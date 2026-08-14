(function(){
  'use strict';

  const L=window.Lajuj=window.Lajuj||{};
  const API=L.GLBModel=L.GLBModel||{};
  const cache=new WeakMap();

  function compileProgram(gl,vsSource,fsSource){
    function shader(type,source){
      const sh=gl.createShader(type);
      gl.shaderSource(sh,source);
      gl.compileShader(sh);
      if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){
        const msg=gl.getShaderInfoLog(sh)||'Error compilando shader';
        gl.deleteShader(sh);
        throw new Error(msg);
      }
      return sh;
    }
    const vs=shader(gl.VERTEX_SHADER,vsSource);
    const fs=shader(gl.FRAGMENT_SHADER,fsSource);
    const p=gl.createProgram();
    gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);
    gl.deleteShader(vs);gl.deleteShader(fs);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS)){
      const msg=gl.getProgramInfoLog(p)||'Error enlazando programa WebGL';
      gl.deleteProgram(p);
      throw new Error(msg);
    }
    return p;
  }

  function parseGLB(arrayBuffer){
    const dv=new DataView(arrayBuffer);
    if(dv.getUint32(0,true)!==0x46546c67)throw new Error('El archivo no es GLB válido.');
    if(dv.getUint32(4,true)!==2)throw new Error('Se requiere glTF/GLB 2.0.');
    const length=dv.getUint32(8,true);
    let off=12,json=null,bin=null;
    while(off<length){
      const size=dv.getUint32(off,true);
      const type=dv.getUint32(off+4,true);
      off+=8;
      const slice=arrayBuffer.slice(off,off+size);
      if(type===0x4E4F534A){
        json=JSON.parse(new TextDecoder().decode(slice).replace(/\u0000+$/,'').trim());
      }else if(type===0x004E4942){
        bin=new Uint8Array(slice);
      }
      off+=size;
    }
    if(!json||!bin)throw new Error('El GLB no contiene JSON y BIN completos.');
    return{json,bin};
  }

  const componentInfo={
    5120:{Ctor:Int8Array,bytes:1},5121:{Ctor:Uint8Array,bytes:1},5122:{Ctor:Int16Array,bytes:2},
    5123:{Ctor:Uint16Array,bytes:2},5125:{Ctor:Uint32Array,bytes:4},5126:{Ctor:Float32Array,bytes:4}
  };
  const componentCount={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16};

  function readAccessor(json,bin,index){
    const a=json.accessors[index],bv=json.bufferViews[a.bufferView];
    const info=componentInfo[a.componentType],n=componentCount[a.type];
    if(!a||!bv||!info||!n)throw new Error('Accessor GLB no compatible.');
    const count=a.count*n;
    const start=(bv.byteOffset||0)+(a.byteOffset||0);
    const packed=n*info.bytes;
    const stride=bv.byteStride||packed;
    if(stride===packed && (bin.byteOffset+start)%info.bytes===0){
      return new info.Ctor(bin.buffer,bin.byteOffset+start,count);
    }
    const out=new info.Ctor(count),view=new DataView(bin.buffer,bin.byteOffset,bin.byteLength);
    const getter={5120:'getInt8',5121:'getUint8',5122:'getInt16',5123:'getUint16',5125:'getUint32',5126:'getFloat32'}[a.componentType];
    for(let i=0;i<a.count;i++){
      const base=start+i*stride;
      for(let k=0;k<n;k++)out[i*n+k]=view[getter](base+k*info.bytes,true);
    }
    return out;
  }

  function embeddedImageBlob(json,bin,primitive){
    const material=json.materials?.[primitive.material||0];
    const texIndex=material?.pbrMetallicRoughness?.baseColorTexture?.index;
    if(texIndex==null)return null;
    const imageIndex=json.textures?.[texIndex]?.source;
    const image=json.images?.[imageIndex];
    if(!image||image.bufferView==null)return null;
    const bv=json.bufferViews[image.bufferView];
    const start=bv.byteOffset||0;
    return new Blob([bin.slice(start,start+bv.byteLength)],{type:image.mimeType||'image/png'});
  }

  function uploadImage(gl,blob){
    return new Promise((resolve,reject)=>{
      const tex=gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D,tex);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      if(!blob){resolve({tex,hasImage:false});return;}
      const url=URL.createObjectURL(blob),im=new Image();
      im.onload=()=>{
        try{
          gl.bindTexture(gl.TEXTURE_2D,tex);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
          gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
          URL.revokeObjectURL(url);
          resolve({tex,hasImage:true});
        }catch(err){URL.revokeObjectURL(url);reject(err);}
      };
      im.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('No se pudo abrir la textura del GLB.'));};
      im.src=url;
    });
  }

  function detectAxes(min,max){
    const ext=[max[0]-min[0],max[1]-min[1],max[2]-min[2]];
    let up=0;if(ext[1]>=ext[up])up=1;if(ext[2]>=ext[up])up=2;
    const rest=[0,1,2].filter(i=>i!==up);
    const xAxis=rest[0], zAxis=rest[1];
    return {up,xAxis,zAxis,height:Math.max(.001,ext[up])};
  }

  function remapPositions(raw,min,max){
    const axes=detectAxes(min,max);
    const center=[(min[0]+max[0])/2,(min[1]+max[1])/2,(min[2]+max[2])/2];
    const out=new Float32Array(raw.length);
    for(let i=0;i<raw.length;i+=3){
      const x=raw[i],y=raw[i+1],z=raw[i+2],src=[x,y,z];
      out[i]   = src[axes.xAxis]-center[axes.xAxis];
      out[i+1] = src[axes.up]-min[axes.up];
      out[i+2] = -(src[axes.zAxis]-center[axes.zAxis]);
    }
    return {positions:out,height:axes.height};
  }

  function computeNormals(positions,indices){
    const out=new Float32Array(positions.length);
    for(let i=0;i<indices.length;i+=3){
      const ia=indices[i]*3, ib=indices[i+1]*3, ic=indices[i+2]*3;
      const ax=positions[ia], ay=positions[ia+1], az=positions[ia+2];
      const bx=positions[ib], by=positions[ib+1], bz=positions[ib+2];
      const cx=positions[ic], cy=positions[ic+1], cz=positions[ic+2];
      const abx=bx-ax, aby=by-ay, abz=bz-az;
      const acx=cx-ax, acy=cy-ay, acz=cz-az;
      const nx=aby*acz-abz*acy, ny=abz*acx-abx*acz, nz=abx*acy-aby*acx;
      out[ia]+=nx; out[ia+1]+=ny; out[ia+2]+=nz;
      out[ib]+=nx; out[ib+1]+=ny; out[ib+2]+=nz;
      out[ic]+=nx; out[ic+1]+=ny; out[ic+2]+=nz;
    }
    for(let i=0;i<out.length;i+=3){
      const nx=out[i], ny=out[i+1], nz=out[i+2];
      const len=Math.hypot(nx,ny,nz)||1;
      out[i]=nx/len; out[i+1]=ny/len; out[i+2]=nz/len;
    }
    return out;
  }

  function remapNormals(raw,min,max){
    const axes=detectAxes(min,max);
    const out=new Float32Array(raw.length);
    for(let i=0;i<raw.length;i+=3){
      const src=[raw[i],raw[i+1],raw[i+2]];
      const nx=src[axes.xAxis], ny=src[axes.up], nz=-src[axes.zAxis];
      const len=Math.hypot(nx,ny,nz)||1;
      out[i]=nx/len; out[i+1]=ny/len; out[i+2]=nz/len;
    }
    return out;
  }

  class GLBMesh{
    constructor(gl,url){
      this.gl=gl;this.url=url;this.ready=false;this.error=null;
      this.program=null;this.positionBuffer=null;this.normalBuffer=null;this.uvBuffer=null;
      this.indexBuffer=null;this.indexCount=0;this.texture=null;this.hasTexture=false;
      this.baseScale=1;this.height=1;this.vertexCount=0;this.triangleCount=0;
    }

    async load(){
      try{
        const response=await fetch(this.url,{cache:'force-cache'});
        if(!response.ok)throw new Error(`No se pudo cargar ${this.url} (${response.status}).`);
        const {json,bin}=parseGLB(await response.arrayBuffer());
        const primitive=json.meshes?.[0]?.primitives?.[0];
        if(!primitive)throw new Error('El GLB no contiene una malla utilizable.');

        const posAccessor=json.accessors[primitive.attributes.POSITION];
        const rawPositions=readAccessor(json,bin,primitive.attributes.POSITION);
        const rawIndices=readAccessor(json,bin,primitive.indices);
        this.vertexCount=posAccessor.count;
        this.triangleCount=Math.floor(rawIndices.length/3);
        if(this.vertexCount>65535)throw new Error('El modelo supera 65,535 vértices para este prototipo WebGL.');
        const indices=rawIndices instanceof Uint16Array?new Uint16Array(rawIndices):Uint16Array.from(rawIndices);

        const min=posAccessor.min||[-1,-1,-1], max=posAccessor.max||[1,1,1];
        const remapped=remapPositions(rawPositions,min,max);
        const positions=remapped.positions;
        this.height=remapped.height;
        this.baseScale=2.05/Math.max(.001,this.height);

        let normals;
        if(primitive.attributes.NORMAL!=null){
          normals=remapNormals(readAccessor(json,bin,primitive.attributes.NORMAL),min,max);
        }else{
          normals=computeNormals(positions,indices);
        }

        let uvs;
        if(primitive.attributes.TEXCOORD_0!=null){
          uvs=readAccessor(json,bin,primitive.attributes.TEXCOORD_0);
        }else{
          uvs=new Float32Array(this.vertexCount*2);
          for(let i=0;i<uvs.length;i+=2){uvs[i]=0;uvs[i+1]=0;}
        }

        const gl=this.gl;
        const VS=`
          attribute vec3 aPos;
          attribute vec3 aNormal;
          attribute vec2 aUV;
          uniform mat4 uVP;
          uniform vec3 uWorld;
          uniform float uScale;
          uniform float uFacing;
          uniform float uHeight;
          varying vec2 vUV;
          varying float vLight;
          varying float vH;
          void main(){
            float c=cos(uFacing), s=sin(uFacing);
            vec3 q=vec3(aPos.x*c+aPos.z*s,aPos.y,-aPos.x*s+aPos.z*c);
            vec3 n=normalize(vec3(aNormal.x*c+aNormal.z*s,aNormal.y,-aNormal.x*s+aNormal.z*c));
            q=q*uScale+uWorld;
            gl_Position=uVP*vec4(q,1.0);
            vUV=aUV;
            vH=clamp(aPos.y/max(0.001,uHeight),0.0,1.0);
            vLight=.52+.48*max(dot(n,normalize(vec3(-.42,.90,.30))),0.0);
          }`;
        const FS=`
          precision mediump float;
          varying vec2 vUV;
          varying float vLight;
          varying float vH;
          uniform sampler2D uTex;
          uniform float uUseTexture;
          void main(){
            vec4 base;
            if(uUseTexture>0.5){
              base=texture2D(uTex,vUV);
            }else{
              vec3 blue=vec3(0.35,0.73,1.0);
              vec3 mid=vec3(0.58,0.84,1.0);
              vec3 white=vec3(0.96,0.98,1.0);
              vec3 grad=mix(blue,mid,smoothstep(0.05,0.55,vH));
              grad=mix(grad,white,smoothstep(0.60,1.0,vH)*0.6);
              base=vec4(grad,1.0);
            }
            base.rgb*=vLight;
            gl_FragColor=base;
          }`;
        this.program=compileProgram(gl,VS,FS);

        this.positionBuffer=gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,positions,gl.STATIC_DRAW);

        this.normalBuffer=gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,normals,gl.STATIC_DRAW);

        this.uvBuffer=gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,this.uvBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,uvs,gl.STATIC_DRAW);

        this.indexBuffer=gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
        this.indexCount=indices.length;

        const texInfo=await uploadImage(gl,embeddedImageBlob(json,bin,primitive));
        this.texture=texInfo.tex;
        this.hasTexture=!!texInfo.hasImage;
        this.ready=true;
        return this;
      }catch(err){
        this.error=err;
        console.warn('[Senderos Lajuj] Bebé GLB: se conserva el avatar provisional porque el modelo no pudo cargarse.',err);
        return this;
      }
    }

    draw(vp,x,z,facing=0,scale=1,phase=0){
      if(!this.ready)return false;
      const gl=this.gl,p=this.program;
      const bob=Math.abs(Math.sin(phase))*.03;
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.disable(gl.CULL_FACE);
      gl.useProgram(p);

      const bind=(name,buffer,size)=>{
        const loc=gl.getAttribLocation(p,name);
        if(loc<0)return;
        gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc,size,gl.FLOAT,false,0,0);
      };
      bind('aPos',this.positionBuffer,3);
      bind('aNormal',this.normalBuffer,3);
      bind('aUV',this.uvBuffer,2);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.indexBuffer);
      gl.uniformMatrix4fv(gl.getUniformLocation(p,'uVP'),false,vp);
      gl.uniform3fv(gl.getUniformLocation(p,'uWorld'),new Float32Array([x,bob,z]));
      gl.uniform1f(gl.getUniformLocation(p,'uScale'),this.baseScale*scale);
      gl.uniform1f(gl.getUniformLocation(p,'uFacing'),facing);
      gl.uniform1f(gl.getUniformLocation(p,'uHeight'),this.height);
      gl.uniform1f(gl.getUniformLocation(p,'uUseTexture'),this.hasTexture?1:0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D,this.texture);
      gl.uniform1i(gl.getUniformLocation(p,'uTex'),0);
      gl.drawElements(gl.TRIANGLES,this.indexCount,gl.UNSIGNED_SHORT,0);
      return true;
    }
  }

  API.load=function(gl,url){
    let byUrl=cache.get(gl);
    if(!byUrl){byUrl=new Map();cache.set(gl,byUrl);}
    if(byUrl.has(url))return byUrl.get(url);
    const model=new GLBMesh(gl,url);
    model.promise=model.load();
    byUrl.set(url,model);
    return model;
  };

  API.GLMesh=GLBMesh;

  function installGameBridge(){
    const canvas=document.getElementById('gameCanvas');
    if(!canvas||!L.Avatar3D||!L.Mat4||!L.CONFIG)return;
    const options={alpha:false,antialias:true,premultipliedAlpha:true,powerPreference:'high-performance',desynchronized:true};
    const gl=canvas.getContext('webgl',options)||canvas.getContext('experimental-webgl');
    if(!gl)return;

    const MODEL_URL='assets/models/bebe_azul_v2.glb';
    const bridge={model:API.load(gl,MODEL_URL),renderActive:false,loopStarted:false};
    L.Bebe3DBridge=bridge;

    const originalAdd=L.Avatar3D.add;
    if(!L.Avatar3D.__bebeGLBWrapped){
      L.Avatar3D.add=function(builder,id,x,z,phase=0,scale=1,facing=0){
        if(id==='p01'&&bridge.renderActive&&bridge.model?.ready)return;
        return originalAdd.call(this,builder,id,x,z,phase,scale,facing);
      };
      L.Avatar3D.__bebeGLBWrapped=true;
    }

    const C=L.CONFIG,M=L.Mat4;
    const gx=x=>(x-C.MAP_W/2)*C.CELL;
    const gz=y=>(y-C.MAP_H/2)*C.CELL;

    function drawGameModels(){
      requestAnimationFrame(drawGameModels);
      const s=L.Game?.state,model=bridge.model;
      if(!s?.started||!model?.ready)return;
      const game=document.getElementById('game');
      if(game?.getAttribute('aria-hidden')==='true')return;
      bridge.renderActive=true;
      const tx=s.visualX??gx(s.player.x),tz=s.visualZ??gz(s.player.y);
      const portrait=innerHeight>innerWidth;
      const target=[tx,.55,tz],eye=[tx,portrait?14.8:13.4,tz+(portrait?10.8:9.1)];
      const proj=M.perspective((portrait?52:45)*Math.PI/180,canvas.clientWidth/Math.max(1,canvas.clientHeight),.1,260);
      const view=M.lookAt(eye,target,[0,1,0]),vp=M.multiply(proj,view);
      const phase=performance.now()/180;
      if(s.selected?.id==='p01'&&!s.reachedTemple)model.draw(vp,tx,tz,s.facing||0,1,phase);
      Object.entries(s.players||{}).forEach(([id,p])=>{if(id===s.id||!p||p.reachedTemple||p.character!=='p01')return;model.draw(vp,gx(p.x),gz(p.y),p.facing||0,.92,phase+id.length*.4);});
    }

    const watcher=setInterval(()=>{
      if(bridge.loopStarted)return;
      const s=L.Game?.state;
      if(s?.started&&bridge.model?.ready){bridge.loopStarted=true;clearInterval(watcher);setTimeout(()=>requestAnimationFrame(drawGameModels),120);}
    },100);
  }

  function installPermanentTestButton(){
    const actions=document.querySelector('#setup .actions');
    if(!actions)return;
    let btn=[...actions.querySelectorAll('button')].find(b=>/PROBAR GRÁFICOS|PRUEBA/i.test(b.textContent||''));
    if(!btn){btn=document.createElement('button');btn.type='button';btn.className='btn';actions.appendChild(btn);}
    btn.textContent='🧪 PRUEBA · BEBÉ 3D';
    btn.onclick=()=>window.open('model-test-bebe.html','_blank','noopener');
    btn.title='Abrir una prueba aislada del modelo antes de continuar con los demás cambios';
  }

  function boot(){installPermanentTestButton();installGameBridge();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();

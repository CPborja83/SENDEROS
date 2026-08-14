(function(){
  const L=window.Lajuj=window.Lajuj||{};
  const M=L.Mat4={};
  M.identity=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
  M.multiply=(a,b)=>{const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[0*4+r]*b[c*4+0]+a[1*4+r]*b[c*4+1]+a[2*4+r]*b[c*4+2]+a[3*4+r]*b[c*4+3];return o};
  M.perspective=(fovy,aspect,near,far)=>{const f=1/Math.tan(fovy/2),nf=1/(near-far),o=new Float32Array(16);o[0]=f/aspect;o[5]=f;o[10]=(far+near)*nf;o[11]=-1;o[14]=2*far*near*nf;return o};
  function norm(v){const l=Math.hypot(v[0],v[1],v[2])||1;return[v[0]/l,v[1]/l,v[2]/l]}
  function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
  function sub(a,b){return[a[0]-b[0],a[1]-b[1],a[2]-b[2]]}
  M.lookAt=(eye,target,up)=>{const z=norm(sub(eye,target)),x=norm(cross(up,z)),y=cross(z,x),o=M.identity();o[0]=x[0];o[1]=y[0];o[2]=z[0];o[4]=x[1];o[5]=y[1];o[6]=z[1];o[8]=x[2];o[9]=y[2];o[10]=z[2];o[12]=-(x[0]*eye[0]+x[1]*eye[1]+x[2]*eye[2]);o[13]=-(y[0]*eye[0]+y[1]*eye[1]+y[2]*eye[2]);o[14]=-(z[0]*eye[0]+z[1]*eye[1]+z[2]*eye[2]);return o};
  M.cameraBasis=(eye,target)=>{const f=norm(sub(target,eye)),right=norm(cross(f,[0,1,0]));return{forward:f,right,up:[0,1,0]}};

  const E=L.WebGLEngine={};
  E.createProgram=function(gl,vs,fs){function sh(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s}const p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,vs));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p};
  E.MeshBuilder=function(){this.data=[]};
  E.MeshBuilder.prototype.tri=function(a,b,c,n,col){for(const p of[a,b,c])this.data.push(p[0],p[1],p[2],n[0],n[1],n[2],col[0],col[1],col[2],col[3]??1)};
  E.MeshBuilder.prototype.quad=function(a,b,c,d,n,col){this.tri(a,b,c,n,col);this.tri(a,c,d,n,col)};
  E.MeshBuilder.prototype.box=function(cx,cy,cz,sx,sy,sz,col){const x=sx/2,y=sy/2,z=sz/2,p=[[cx-x,cy-y,cz-z],[cx+x,cy-y,cz-z],[cx+x,cy+y,cz-z],[cx-x,cy+y,cz-z],[cx-x,cy-y,cz+z],[cx+x,cy-y,cz+z],[cx+x,cy+y,cz+z],[cx-x,cy+y,cz+z]];this.quad(p[4],p[5],p[6],p[7],[0,0,1],col);this.quad(p[1],p[0],p[3],p[2],[0,0,-1],col);this.quad(p[0],p[4],p[7],p[3],[-1,0,0],col);this.quad(p[5],p[1],p[2],p[6],[1,0,0],col);this.quad(p[3],p[7],p[6],p[2],[0,1,0],col);this.quad(p[0],p[1],p[5],p[4],[0,-1,0],col)};
  
  E.MeshBuilder.prototype.boxRotY=function(cx,cy,cz,sx,sy,sz,a,col){const x=sx/2,y=sy/2,z=sz/2,c=Math.cos(a),s=Math.sin(a);function P(lx,ly,lz){return[cx+lx*c+lz*s,cy+ly,cz-lx*s+lz*c]}function N(nx,ny,nz){return[nx*c+nz*s,ny,-nx*s+nz*c]}const p=[P(-x,-y,-z),P(x,-y,-z),P(x,y,-z),P(-x,y,-z),P(-x,-y,z),P(x,-y,z),P(x,y,z),P(-x,y,z)];this.quad(p[4],p[5],p[6],p[7],N(0,0,1),col);this.quad(p[1],p[0],p[3],p[2],N(0,0,-1),col);this.quad(p[0],p[4],p[7],p[3],N(-1,0,0),col);this.quad(p[5],p[1],p[2],p[6],N(1,0,0),col);this.quad(p[3],p[7],p[6],p[2],[0,1,0],col);this.quad(p[0],p[1],p[5],p[4],[0,-1,0],col)};
  E.MeshBuilder.prototype.ellipsoidRotY=function(cx,cy,cz,r,rings,segs,col,sx,sy,sz,a){rings=rings||7;segs=segs||12;sx=sx||1;sy=sy||1;sz=sz||1;const co=Math.cos(a),si=Math.sin(a);for(let iy=0;iy<rings;iy++){const v0=iy/rings,v1=(iy+1)/rings,ph0=-Math.PI/2+v0*Math.PI,ph1=-Math.PI/2+v1*Math.PI;for(let ix=0;ix<segs;ix++){const u0=ix/segs,u1=(ix+1)/segs,th0=u0*Math.PI*2,th1=u1*Math.PI*2;function P(th,ph){const lx=Math.cos(ph)*Math.cos(th)*r*sx,ly=Math.sin(ph)*r*sy,lz=Math.cos(ph)*Math.sin(th)*r*sz;return[cx+lx*co+lz*si,cy+ly,cz-lx*si+lz*co]}function N(th,ph){let nx=Math.cos(ph)*Math.cos(th)/sx,ny=Math.sin(ph)/sy,nz=Math.cos(ph)*Math.sin(th)/sz;const wx=nx*co+nz*si,wz=-nx*si+nz*co,l=Math.hypot(wx,ny,wz)||1;return[wx/l,ny/l,wz/l]}const aa=P(th0,ph0),bb=P(th1,ph0),cc=P(th1,ph1),dd=P(th0,ph1),nn=N((th0+th1)/2,(ph0+ph1)/2);this.quad(aa,bb,cc,dd,nn,col)}}};

  E.MeshBuilder.prototype.plane=function(x1,z1,x2,z2,y,col){this.quad([x1,y,z1],[x2,y,z1],[x2,y,z2],[x1,y,z2],[0,1,0],col)};

  E.MeshBuilder.prototype.cylY=function(cx,cy,cz,r,h,segments,col){segments=segments||10;const y0=cy-h/2,y1=cy+h/2;for(let i=0;i<segments;i++){const a=i*Math.PI*2/segments,b=(i+1)*Math.PI*2/segments;const x1=cx+Math.cos(a)*r,z1=cz+Math.sin(a)*r,x2=cx+Math.cos(b)*r,z2=cz+Math.sin(b)*r;const n1=[Math.cos(a),0,Math.sin(a)],n2=[Math.cos(b),0,Math.sin(b)],na=[(n1[0]+n2[0])/2,0,(n1[2]+n2[2])/2];this.quad([x1,y0,z1],[x2,y0,z2],[x2,y1,z2],[x1,y1,z1],na,col);this.tri([cx,y1,cz],[x2,y1,z2],[x1,y1,z1],[0,1,0],col);this.tri([cx,y0,cz],[x1,y0,z1],[x2,y0,z2],[0,-1,0],col)}};
  E.MeshBuilder.prototype.coneY=function(cx,cy,cz,r,h,segments,col){segments=segments||10;const y0=cy-h/2,y1=cy+h/2,tip=[cx,y1,cz];for(let i=0;i<segments;i++){const a=i*Math.PI*2/segments,b=(i+1)*Math.PI*2/segments;const p1=[cx+Math.cos(a)*r,y0,cz+Math.sin(a)*r],p2=[cx+Math.cos(b)*r,y0,cz+Math.sin(b)*r];const mx=(p1[0]+p2[0])/2-cx,mz=(p1[2]+p2[2])/2-cz;const len=Math.hypot(mx,h,mz)||1;const n=[mx/len,r/len,mz/len];this.tri(p1,p2,tip,n,col);this.tri([cx,y0,cz],p1,p2,[0,-1,0],col)}};

  E.MeshBuilder.prototype.sphere=function(cx,cy,cz,r,rings,segs,col,sx,sy,sz){rings=rings||7;segs=segs||12;sx=sx||1;sy=sy||1;sz=sz||1;for(let iy=0;iy<rings;iy++){const v0=iy/rings,v1=(iy+1)/rings,ph0=-Math.PI/2+v0*Math.PI,ph1=-Math.PI/2+v1*Math.PI;for(let ix=0;ix<segs;ix++){const u0=ix/segs,u1=(ix+1)/segs,th0=u0*Math.PI*2,th1=u1*Math.PI*2;function P(th,ph){return[cx+Math.cos(ph)*Math.cos(th)*r*sx,cy+Math.sin(ph)*r*sy,cz+Math.cos(ph)*Math.sin(th)*r*sz]}function N(th,ph){const nx=Math.cos(ph)*Math.cos(th)/sx,ny=Math.sin(ph)/sy,nz=Math.cos(ph)*Math.sin(th)/sz,l=Math.hypot(nx,ny,nz)||1;return[nx/l,ny/l,nz/l]}const a=P(th0,ph0),b=P(th1,ph0),c=P(th1,ph1),d=P(th0,ph1),n0=N((th0+th1)/2,(ph0+ph1)/2);this.quad(a,b,c,d,n0,col)}}};
  E.MeshBuilder.prototype.capsuleY=function(cx,cy,cz,r,h,col){const body=Math.max(.02,h-2*r);this.cylY(cx,cy,cz,r,body,12,col);this.sphere(cx,cy+body/2,cz,r,5,10,col,1,1,1);this.sphere(cx,cy-body/2,cz,r,5,10,col,1,1,1)};


  E.color=(hex,a=1)=>{const r=L.Utils.hexToRgb(hex);return[r[0],r[1],r[2],a]};
})();

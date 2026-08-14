(function(){
  const L=window.Lajuj=window.Lajuj||{};
  L.CONFIG={
    CELL:2.05, MAP_W:43, MAP_H:23,
    demoMode:true, demoLabel:'PROTOTIPO FULL-STACK · 2 HABITACIONES',
    palette:['#ffd43b','#4ccff0','#ff5fa7','#73dd57','#b98aff','#ff8b3d','#32c7ba','#f46d77','#87a9ff','#dbde55'],
    bands:[
      {min:5,max:7,key:'5-7',label:'5–7 años'},
      {min:8,max:10,key:'8-10',label:'8–10 años'},
      {min:11,max:13,key:'11-13',label:'11–13 años'},
      {min:14,max:17,key:'14-17',label:'14–17 años'},
      {min:18,max:99,key:'18+',label:'18 años o más'}
    ],
    characters:[
      {id:'p01',label:'Bebé Azul',src:'assets/characters/01_bebe_azul.webp',color:'#64c8ff',shadow:'s01'},
      {id:'p02',label:'Bebé Rosa con Lazo',src:'assets/characters/02_nina_lazo_rosa.webp',color:'#ff6fc5',shadow:'s02'},
      {id:'p03',label:'Explorador Verde',src:'assets/characters/03_nino_verde_energetico.webp',color:'#68d84f',shadow:'s03'},
      {id:'p04',label:'Chica Gamer Morada',src:'assets/characters/04_joven_gamer_naranja.webp',color:'#9d62ef',shadow:'s04'},
      {id:'p05',label:'Guardián Naranja',src:'assets/characters/05_mama_cuidadora_coral.webp',color:'#ff842a',shadow:'s05'},
      {id:'p06',label:'Cuidador Coral Floral',src:'assets/characters/06_papa_guardian_teal.webp',color:'#ed625d',shadow:'s06'},
      {id:'p07',label:'Guardián Teal',src:'assets/characters/07_abuela_lavanda.webp',color:'#1499a7',shadow:'s07'},
      {id:'p08',label:'Abuela Lavanda',src:'assets/characters/08_abuelo_explorador.webp',color:'#9a78e8',shadow:'s08'},
      {id:'p09',label:'Abuelo Explorador',src:'assets/characters/09_guia_estelar_amarillo.webp',color:'#8c7b68',shadow:'s09'},
      {id:'p10',label:'Guía Estelar Amarillo',src:'assets/characters/10_chica_musical_morada.webp',color:'#f2c62d',shadow:'s10'}
    ],
    shadows:[
      {id:'s01',label:'Sombra Infernal',src:'assets/shadows/01_sombra_infernal.webp'},
      {id:'s02',label:'Sombra Vacío Púrpura',src:'assets/shadows/02_sombra_vacio_purpura.webp'},
      {id:'s03',label:'Sombra Tóxica',src:'assets/shadows/03_sombra_toxica.webp'},
      {id:'s04',label:'Sombra Araña',src:'assets/shadows/04_sombra_arania.webp'},
      {id:'s05',label:'Sombra Fantasma Linterna',src:'assets/shadows/05_sombra_fantasma_linterna.webp'},
      {id:'s06',label:'Sombra Cadenas',src:'assets/shadows/06_sombra_cadenas.webp'},
      {id:'s07',label:'Sombra Rey Púrpura',src:'assets/shadows/07_sombra_rey_purpura.webp'},
      {id:'s08',label:'Sombra Cosechador',src:'assets/shadows/08_sombra_cosechador.webp'},
      {id:'s09',label:'Sombra Espinas Lava',src:'assets/shadows/09_sombra_espinas_lava.webp'},
      {id:'s10',label:'Sombra Hielo',src:'assets/shadows/10_sombra_hielo.webp'}
    ],
    buildings:[
      {name:'Sala Familiar',floor:'#713e48',wall:'#31485d',accent:'#ff8e9c',kind:'family'},
      {name:'Biblioteca',floor:'#5d422a',wall:'#34485b',accent:'#e7ac65',kind:'library'},
      {name:'Aula',floor:'#34515a',wall:'#2d4658',accent:'#74cfe0',kind:'classroom'},
      {name:'Enfermería',floor:'#2d5d5d',wall:'#2f4b5a',accent:'#68d8cf',kind:'clinic'},
      {name:'Sala de Juegos',floor:'#533158',wall:'#3d3c59',accent:'#e579ec',kind:'game'},
      {name:'Taller',floor:'#59422f',wall:'#3d4850',accent:'#f0a962',kind:'workshop'},
      {name:'Comunicaciones',floor:'#2e476f',wall:'#2d435c',accent:'#74bbff',kind:'comms'},
      {name:'Jardín Interior',floor:'#315640',wall:'#354c50',accent:'#7dda98',kind:'garden'},
      {name:'Capilla',floor:'#514c69',wall:'#3d465b',accent:'#d8cbff',kind:'chapel'},
      {name:'Tienda',floor:'#664b35',wall:'#3e4850',accent:'#f3c079',kind:'shop'},
      {name:'Casa',floor:'#684655',wall:'#3e4654',accent:'#f5a2c0',kind:'home'},
      {name:'Centro de Estudio',floor:'#465334',wall:'#374b50',accent:'#c1d96e',kind:'study'}
    ],
    roads:['#466a84','#52667c','#466f79','#5d6173','#476d6e','#4d5e7d']
  };
})();

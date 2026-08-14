# Arquitectura del proyecto

## Separación de responsabilidades

- `styles/theme.css`: paleta y variables.
- `css/main.css`: componentes de interfaz.
- `css/responsive.css`: ajustes para teléfono, tablet y escritorio.
- `js/config.js`: personajes, sombras, edificios y configuración global.
- `js/utils.js`: utilidades comunes.
- `js/content.js`: preguntas, voces y definición de mini‑juegos.
- `js/ui.js`: selección visual de personaje y HUD.
- `js/world.js`: generación determinista de ciudad/laberinto.
- `js/webgl-engine.js`: matrices, shaders y construcción geométrica WebGL.
- `js/renderer3d.js`: render del mundo 3D y de sprites.
- `js/audio.js`: voz, música y efectos.
- `js/minigames.js`: implementación de los cinco mini‑juegos.
- `js/multiplayer.js`: sincronización de la familia mediante Firebase Realtime Database REST.
- `js/game.js`: mecánicas, preguntas, guía, sombra, cárcel, rescate y Templo.
- `js/main.js`: eventos de entrada y controles.

## Por qué esta versión evita el error de la v7

La selección de personajes ya no depende de un `script type="module"` ni de importar Three.js antes de ejecutar la interfaz. `ui.js` es un script clásico y construye los personajes de inmediato. El motor 3D es WebGL propio y se inicializa únicamente después de pulsar **Entrar a la ciudad 3D**.

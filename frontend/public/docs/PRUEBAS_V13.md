# Pruebas realizadas — Senderos Lajuj v13

## Pruebas automáticas completadas

- **Sintaxis JavaScript:** todos los archivos de `js/` pasan `node --check`.
- **Spawn seguro:** 120 mapas generados con distintos códigos de sala. En todos, el jugador apareció en una celda abierta, fuera de habitaciones cerradas, dentro del componente transitable principal y con al menos una salida.
- **Conectividad del spawn:** desde cada punto inicial probado se pudo recorrer exactamente el componente principal del mapa; no quedó aislado detrás de paredes.
- **Referencias locales:** se comprobaron los `src`/`href` locales de `index.html`; no faltan archivos referenciados.
- **Eventos especiales:** se verificó que existan las implementaciones de Estadio y Laboratorio y la selección de invento por edad.
- **Controles eliminados:** no existen en el HTML/JS los botones antiguos `qContinue`, `miniClose`, “Seguir jugando” o “Seguir el sendero”.

## Validaciones de diseño implementadas

- Las preguntas y mini-juegos cierran automáticamente después del resultado.
- Estadio y laboratorio solo se colocan en habitaciones alcanzables.
- Preguntas, mini-juegos, distracciones, radios, cárcel y arcades externos se generan dentro del componente transitable del jugador.
- La sombra nace en una celda alcanzable desde el jugador.
- La radio usa reproductor interno con silencio y volumen independiente; al reproducir, se atenúa/detiene el audio propio del juego para evitar mezcla.
- Los juegos web externos se muestran en un `iframe` dentro de una ventana del juego; al cerrarla se restaura el audio de Senderos Lajuj.

## Prueba visual recomendada en tu computadora

Ejecuta `start-local.bat` y prueba al menos una partida con cada rango de edad. Las radios y los arcades web requieren Internet y dependen de que el proveedor externo siga disponible.

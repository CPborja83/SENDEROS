# Pruebas v15

Se ejecutaron verificaciones automáticas sobre la lógica de controles, generación del mapa, escala de objetos y peligros dinámicos.

Resultados:
- PASS: `W` y `ArrowUp` se normalizan a la misma acción lógica predeterminada.
- PASS: las instrucciones de controles no duplican nombres de teclas.
- PASS: en modo táctil las instrucciones se convierten a ▲ ◀ ▼ ▶, A, B y ☰.
- PASS: longitud máxima de vehículo <= 1 celda del mapa.
- PASS: ancho máximo de vehículo <= 50% de una celda.
- PASS: 40 mapas generados sin spawn dentro de pared/habitación cerrada.
- PASS: vehículos y animales dentro de los límites de escala definidos.
- PASS: en 40/40 escenarios con el Templo lejano se pudo crear un cable o torbellino de desvío.
- PASS: 0/40 peligros de desvío eliminaron la única ruta disponible hacia el Templo.
- PASS: todos los archivos JavaScript pasan `node --check`.

La validación de rutas usa el mismo `World.path()` que usa el juego durante la partida.

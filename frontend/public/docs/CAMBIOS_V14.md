# Senderos Lajuj v14 — Controles, calles vivas y lectura rápida

## 1. Controles estándar de mini-juegos
Todos los mini-juegos internos muestran una barra **CÓMO JUGAR** antes y durante la actividad.

Norma general:
- Flechas: mover o seleccionar.
- Enter / Espacio: acción o confirmar.
- Esc: salir del mini-juego.
- Mouse/táctil siguen funcionando como alternativa.

Se corrigieron especialmente:
- Atrapa objetivos: ahora tiene mira controlable con flechas + Enter/Espacio.
- Carrera: izquierda/derecha cambian carril; arriba/Enter avanza.
- Penales: izquierda/arriba/derecha disparan.
- Ritmo, reflejos, básquet y temporización: Enter/Espacio ejecuta la acción.
- Memoria, cocina, cartas, trivia, parejas y laboratorio: flechas recorren opciones y Enter confirma.

## 2. Arcades retro / GBA
Se agregó una pantalla **ACTIVAR JUEGO** antes de entregar el teclado al iframe externo.
Cada arcade muestra sus teclas específicas arriba de la ventana.

Catálogo v14:
- Varooom 3D
- Butano Fighter
- Goodboy Galaxy DEMO
- 2048 Advance
- Heartwrench Advance
- Knight Owls

Hay 14 puntos de arcade por mapa y varios aparecen en calles/caminos, no solamente en habitaciones.

Nota técnica: los juegos externos se ejecutan dentro de iframes de sus autores. Por seguridad del navegador no se pueden reprogramar desde Senderos Lajuj todas sus teclas internas; por eso el juego muestra la asignación correcta por título y exige activar primero el iframe.

## 3. Más mini-juegos en calles
La cantidad de mini-juegos pasó a un máximo de 72 colocaciones por mapa cuando existen suficientes celdas disponibles.
Aproximadamente la mitad se intenta colocar en calles/plazas y la otra mitad en habitaciones.
También aumentaron las distracciones cotidianas a 52 colocaciones.

## 4. Animales feroces que parecen un peligro
Se añadieron jaguar, cocodrilo, jabalí y otros animales de aspecto peligroso.
- Al intentar cruzar su celda, sorprenden al jugador.
- Se apartan después del susto.
- No quitan puntos.
- No quitan atención.
- No capturan al jugador.

Su función es crear tensión y percepción de peligro sin convertir cada amenaza visual en castigo real.

## 5. Vehículos en movimiento
Se añadieron automóviles, taxis, buses y camiones que recorren calles conectadas.
- Cambian de celda conforme avanza la partida.
- Nunca eligen como destino la celda ocupada por el jugador.
- Si un vehículo ocupa el próximo paso, el jugador debe esperar o tomar otra calle.
- Se dibujan como pequeños vehículos 3D, con carrocería, cabina y ruedas.

## 6. Hundimientos/agujeros dinámicos
Se añadieron zonas que comienzan a hundirse después de cierta cantidad de movimientos.
- Bloquean temporalmente una franja del camino.
- El motor agrega esas celdas al sistema real de colisiones y también al cálculo de rutas.
- Antes de mantener un hundimiento activo, se comprueba que todavía exista una ruta alternativa hacia el destino.
- Si bloquearlo dejara al jugador sin camino, el obstáculo no se activa.
- Los agujeros desaparecen después de varios movimientos.

## 7. Mini-mapa
Los peligros descubiertos ahora pueden verse en el mini-mapa:
- Naranja: hundimiento activo.
- Celeste: vehículo.
- Rojo: animal peligroso.

## 8. Lectura de voz más rápida
Se aceleró la síntesis de voz general.
Las preguntas se leen a un ritmo más ágil y las opciones se leen todavía más rápido:
- Pregunta: velocidad aproximada 1.16x.
- Opciones: velocidad aproximada 1.34x.
- Avisos y mensajes cálidos también fueron acelerados.

Las opciones se leen como “Uno”, “Dos”, “Tres” en lugar de pausas largas con frases repetitivas.

## 9. Cierre de resultados
Los mini-juegos siguen cerrándose automáticamente. No se agregó nuevamente ningún botón “Seguir jugando”.

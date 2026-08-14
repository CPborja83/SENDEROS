# Senderos Lajuj 3D v15 — Controles personalizados y peligros de ruta

## 1. Configuración de controles antes de entrar
- Se agregó una sección completa en la pantalla inicial.
- El jugador elige **Computadora** o **Celular / tableta**.
- En computadora puede reasignar: Arriba, Abajo, Izquierda, Derecha, Acción, Secundaria y Salir.
- Los valores se guardan en `localStorage` para conservar la preferencia en el mismo navegador.
- Los mini-juegos internos, preguntas y eventos traducen esas teclas a acciones estándar.
- Hay botón **Restablecer** para volver a los controles predeterminados.

## 2. Controles táctiles editables
- En modo celular aparecen D-pad, A, B y menú.
- Antes de iniciar se puede elegir qué acción realiza cada botón táctil.
- Durante la partida cada botón muestra también el nombre de la acción asignada.
- Las instrucciones de los mini-juegos cambian automáticamente: si se usa celular muestran A, B, flechas táctiles y menú; si se usa PC muestran las teclas elegidas.

## 3. Arcades externos
Los arcades GBA/homebrew continúan mostrando sus controles específicos porque se ejecutan dentro de iframes de otros dominios. El navegador no permite que Senderos Lajuj remapee de forma fiable el teclado dentro de esos juegos externos. La pantalla ahora lo explica claramente para evitar confusión.

## 4. Escala de objetos en calles
Todos los tamaños se calculan a partir de `CONFIG.CELL`:
- Vehículo más largo: máximo 0.96 × CELL.
- Ancho del vehículo: 0.42 × CELL.
- Animal: 0.58 × CELL.
- Torbellino: 0.82 × CELL.
- Cable eléctrico: 0.92 × CELL.

Los autobuses y camiones son algo más largos que un auto, pero no más anchos que el carril útil. También se corrigió la dirección inicial de los vehículos para que pueda ser horizontal o vertical según la calle disponible.

## 5. Peligros dinámicos cuando el jugador se aleja
Cuando la ruta real al Templo supera aproximadamente 30 pasos, ocasionalmente puede aparecer un obstáculo temporal delante del jugador:
- ⚡ Cable eléctrico caído.
- 🌪️ Torbellino.

Reglas:
- No aparecen todo el tiempo.
- Se intenta colocarlos en la ruta actual para provocar un desvío real.
- Antes de activarlos el juego calcula una ruta alternativa.
- Si no existe una alternativa, el peligro no se activa.
- Permanecen por varios movimientos y luego desaparecen.
- Tocar/intentar cruzar un cable puede restar 4% de atención.
- Acercarse demasiado a un torbellino puede restar 3% de atención.
- Ambos aparecen en el mini-mapa cuando ya fueron descubiertos.

## 6. Instrucciones coherentes
- Las preguntas muestran los controles configurados.
- Los mini-juegos internos muestran los controles configurados.
- Estadio y laboratorio muestran los controles configurados.
- La introducción recuerda si se está jugando con teclado o con botones táctiles.

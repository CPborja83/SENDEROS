# Pruebas v16

## Umbral de sombra

Prueba automatizada con estado simulado:

- 61% + sombra activa -> `cleared` y `shadow = null`.
- 60% + sombra activa -> permanece.
- 59% + sin sombra -> `spawned`.

Resultado: **OK**.

## Rotación de voces

Se simuló un navegador con cuatro voces españolas: Microsoft Sabina, Dalia, Jorge y Álvaro. Cuatro mensajes consecutivos usaron voces femeninas y masculinas en rotación.

Resultado: **OK**.

## Sintaxis

Todos los archivos `js/*.js` se comprobaron con `node --check`.

Resultado: **OK**.

## Audio persistente

Verificación estática:

- `MediaCenter.close()` ya no destruye el objeto de audio.
- `MediaCenter.setThreat()` modifica el volumen efectivo sin olvidar el volumen base.
- `Audio.setShadowThreat(null)` restaura el nivel de radio y reinicia música ambiente solo si no existe emisora seleccionada.
- `pauseForExternal/restoreAfterExternal` pausa y reanuda radio al entrar/salir de arcades.

## Integración final

- `duckExternal` sigue disponible para los arcades existentes: **OK**.
- `MediaCenter.close()` no detiene ni destruye la emisora: **OK**.
- Barra de radio persistente incluida en `index.html`: **OK**.
- Todas las referencias `<script src>` apuntan a archivos existentes: **OK**.

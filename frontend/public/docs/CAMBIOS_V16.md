# Senderos Lajuj 3D — Cambios v16

## 1. Sombra y atención

La regla queda centralizada en `Game.reconcileAttention()`:

- Atención **<= 60%**: la sombra puede aparecer y perseguir.
- Atención **> 60%**: si la sombra existe, desaparece inmediatamente.
- Al desaparecer se detiene la alerta y se restaura la música/radio previa.
- La posición `shadowX/shadowY` vuelve a sincronizarse como nula en multijugador en el siguiente `sync`.

La reconciliación se ejecuta después de respuestas, mini-juegos, acciones rápidas, arcades y peligros de calle que modifican atención.

## 2. Voces variadas

`audio.js` ahora mantiene perfiles de voz rotativos:

- femenina cálida
- masculina guía
- femenina brillante
- masculina grave
- neutral rápida

Se priorizan voces españolas disponibles en `speechSynthesis`. Si el equipo no ofrece voces masculinas/femeninas identificables, el perfil modifica tono y velocidad para conservar variedad. Cada perfil se mantiene durante un par de mensajes antes de cambiar, evitando cambios excesivamente frecuentes.

## 3. Música/radio persistente

Al seleccionar una emisora en una estación musical:

- la radio sustituye la música ambiente;
- cerrar la ventana no la apaga;
- aparece una barra compacta con nombre, volumen/estado, pausa y apagado;
- el botón global Música puede pausar/reanudar la emisora seleccionada.

Al abrir un arcade externo, la radio se pausa para no competir con su audio y vuelve al salir.

## 4. Alerta de sombra por cercanía

La distancia se calcula usando la ruta transitable real entre sombra y jugador. Hay cuatro niveles:

1. Lejana
2. Media
3. Cercana
4. Crítica

A menor distancia:

- la radio baja más de volumen;
- el patrón de alerta se hace más frecuente y grave;
- en nivel crítico la radio queda casi inaudible y domina la persecución.

Cuando la sombra desaparece, la radio vuelve al volumen elegido por el jugador.

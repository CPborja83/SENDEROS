# Pruebas realizadas — v8

## Validación de selección de personaje

Se ejecutó `config.js`, `utils.js` y `ui.js` con un DOM de prueba:

- Tarjetas de personaje generadas: **10**.
- Personaje seleccionado en la prueba: **p04**.
- Después de ingresar nombre `Prueba`, edad `15` y seleccionar personaje, el botón de entrada quedó **habilitado**.
- El nivel detectado fue **14–17 años**.

Esto corrige el fallo de la v7 donde el script principal no llegaba a construir la selección.

## Contenido

- Personajes configurados: **10**.
- Sombras configuradas: **10**.
- Voces de guía: **16**.
- Tipos de mini‑juegos: **5**.
- Preguntas 5–7 años: **50**.
- Preguntas 8–10 años: **50**.
- Preguntas 11–13 años: **50**.
- Preguntas 14–17 años: **50**.
- Preguntas 18+ años: **50**.

## Mundo

- Tamaño lógico: **73 × 49** celdas.
- Edificios enterables generados con la semilla `FAMILIA123`: **15**.
- Celdas transitables en esa semilla: **2,157**.

## Archivos

- Assets de personajes presentes: **10/10**.
- Assets de sombras presentes: **10/10**.
- Todas las referencias locales de CSS y JavaScript de `index.html` apuntan a archivos existentes.
- Todos los archivos JavaScript pasaron `node --check` sin errores de sintaxis.

## Render 3D

El proyecto usa un motor WebGL propio (`js/webgl-engine.js` + `js/renderer3d.js`). El entorno de ejecución usado para construir el ZIP no ofrece un contexto gráfico Chromium utilizable para capturar una prueba visual GPU, por lo que la comprobación visual final debe hacerse en Chrome/Edge/Safari/Firefox del dispositivo real. Para esa prueba se incluye `start-local.bat` en Windows.

## Validación v10
- Todos los archivos JS pasan `node --check`.
- 10 avatares procedurales 3D y 10 sombras procedurales 3D.
- Mapa configurado a 97×65; generador de prueba produjo 28 edificios y 3,599 celdas transitables.
- 50 decisiones por cada uno de los 5 rangos de edad.
- 12 tipos de mini-juegos, 2 de ellos con consumo opcional de APIs públicas y respaldo local si no hay conexión.
- 10 tipos de distracciones de la vida cotidiana.
- Modelo de Templo 3D procedural: 6,516 vértices en prueba aislada.
- Avatar 3D de prueba: 6,636 vértices.
- Referencias CSS/JS de index.html verificadas sin archivos faltantes.

## Verificaciones v11
- Todos los archivos JavaScript pasan `node --check`.
- Los 10 avatares 3D generan geometría correctamente en 4 orientaciones.
- Las 10 sombras 3D generan geometría correctamente en 4 orientaciones.
- 50 preguntas por cada uno de los 5 rangos de edad.
- 18 tipos de mini-juegos.
- 4 estaciones multimedia externas.
- La pantalla de entrada ya no contiene el campo “Miembros esperados”.
- El mini-mapa incluye marcador de sombra (rombo morado) además de los jugadores.
- La guía usa norte/sur/este/oeste, pasos hasta el giro siguiente y una ruta temporal de destellos.

## Pruebas v12 — exploración y atención
- [ ] Se puede escribir A/a, W/w, S/s y D/d dentro de los campos de Nombre y Código de sala.
- [ ] WASD sigue funcionando como movimiento durante la partida.
- [ ] 85–100% atención: máximo 3 destellos breves.
- [ ] 70–84% atención: máximo 1 destello breve.
- [ ] 50–69% atención: sin ruta luminosa en el suelo.
- [ ] <50% atención: la guía no revela dirección cardinal.
- [ ] Las primeras guías buscan habitaciones con contenido antes del Templo.
- [ ] Se requieren 3 señales comprendidas para revelar el Templo.
- [ ] Se requiere atención >=50% para entrar al Templo.
- [ ] Abrir una pausa musical detiene voz y música internas.

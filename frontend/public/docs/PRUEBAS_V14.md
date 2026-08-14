# Pruebas realizadas — v14

## Sintaxis
- Se ejecutó `node --check` sobre todos los archivos de `js/`.
- Resultado: sin errores de sintaxis.

## Referencias locales
- Se verificaron todos los `src` y `href` locales de `index.html`.
- Se verificaron las imágenes de personajes y sombras declaradas en `config.js`.
- Resultado: no faltan referencias locales.

## Spawn y bloqueos dinámicos
Prueba automatizada sobre 45 mapas generados:
- Spawn dentro de pared: 0.
- Spawn dentro de habitación cerrada: 0.
- Spawn sin salida: 0.
- Hundimientos probados: 270.
- Casos donde un hundimiento activo dejó al jugador sin ruta hacia el destino: 0.

## Comprobaciones v14
Se verificó la existencia de:
- Barra `miniControls`.
- Barra `eventControls`.
- Pantalla `webGameActivate`.
- Alerta `streetAlert`.
- Módulo `street-events.js`.
- Lectura separada `sayQuestion()`.
- 72 intentos de colocación de mini-juegos.
- 14 intentos de colocación de arcades retro.

## Limitación de prueba en este entorno
El navegador automatizado disponible en el entorno de construcción bloquea por política administrativa la navegación incluso hacia `localhost` y `file://`, por lo que no fue posible ejecutar aquí una prueba automatizada visual completa del iframe externo. La sintaxis, estructura, lógica de mapas y rutas sí fueron validadas. Los arcades deben probarse finalmente en Chrome/Edge mediante `start-local.bat` porque dependen además de acceso a Internet y de los servidores de sus autores.

# Guía de despliegue — Senderos Lajuj v19

## Arquitectura recomendada para esta prueba
- Código: GitHub
- Frontend: Netlify
- Backend WebSocket: Render
- Edición/prueba: StackBlitz

## 1. GitHub
1. Crea un repositorio vacío, por ejemplo `Senderos-Lajuj-v19`.
2. Sube TODO el contenido de esta carpeta raíz, no solamente `frontend`.
3. Debes ver `frontend`, `backend`, `package.json`, `netlify.toml` y `.stackblitzrc`.
4. Usa `main` como rama principal.

## 2. StackBlitz
Con el repositorio público abre:
`https://stackblitz.com/github/TU_USUARIO/TU_REPOSITORIO`

`.stackblitzrc` ejecuta `npm run dev`, que inicia frontend y backend. Abre el puerto 5173; el backend usa 8787.

## 3. Backend en Render
1. Render > New > Web Service.
2. Conecta el repositorio de GitHub.
3. Root Directory: `backend`.
4. Runtime: Node.
5. Build Command: `npm install`.
6. Start Command: `npm start`.
7. Elige instancia gratuita si está disponible.
8. Copia la URL que Render te asigne.
9. Comprueba `https://TU-BACKEND.onrender.com/health`; debe responder JSON con `ok: true`.

## 4. Frontend en Netlify
1. Netlify > Add new project > Import an existing project.
2. Conecta el mismo repositorio.
3. `netlify.toml` ya configura Base `frontend`, Build `npm run build`, Publish `dist`.
4. Crea una variable de entorno: `VITE_SERVER_URL` = URL completa de Render, por ejemplo `https://senderos-lajuj-backend.onrender.com`.
5. Despliega.

El build genera `runtime-config.js`. En el navegador la URL HTTPS del backend se convierte en WSS para el multijugador.

## 5. Validar multijugador
1. Abre Netlify en dos teléfonos o ventanas.
2. Usa el mismo código de sala.
3. Entra con personajes distintos.
4. Verifica presencia/mini-mapa y posiciones.
5. Pulsa SALIR en un jugador y verifica que desaparece para el otro.
6. Prueba sombra, rescate y llegada al Templo.

## 6. Mantener un solo repositorio
No separes frontend y backend en dos repositorios todavía. Netlify y Render pueden trabajar con sus subcarpetas. Así el protocolo multijugador y la interfaz permanecen sincronizados.

## 7. Antes de ampliar el mapa
Probar PC, Android y iPhone/tableta: escala/giro de personajes, cámara, controles táctiles, vehículos/animales, arcades, radio/voz, sombra, peligros, penalización de tiempo y conexión de 2–5 jugadores. Solo después ampliar el mundo.

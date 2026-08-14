# Senderos Lajuj 3D v19 — Demo Full-Stack de 2 habitaciones

Esta versión existe para validar la experiencia completa antes de construir el mapa grande.

## Incluye
- Frontend WebGL 3D responsive para PC, teléfono y tableta.
- Exactamente 2 habitaciones para probar rápido.
- Controles de teclado y táctiles configurables.
- Juegos en línea/arcades embebidos; sin mini-juegos locales de memoria, parejas o pulsaciones.
- Radio persistente, voces variables y audio de sombra por cercanía.
- Sombra: aparece con atención <= 60 y se retira al recuperar > 60.
- Cada 10 minutos: -20% atención + pantalla roja pulsante + voz de advertencia.
- Vehículos, animales, hundimientos, torbellinos y cables con rutas alternativas.
- Botón SALIR durante la partida.
- Backend Node.js + WebSocket para salas multijugador.

## Estructura
- `frontend/`: render 3D, controles, audio y jugabilidad.
- `backend/`: servidor multijugador.
- `netlify.toml`: despliegue del frontend.
- `.stackblitzrc`: inicio automático del proyecto completo.
- `GUIA_DESPLIEGUE.md`: GitHub, StackBlitz, Render y Netlify.

## Ejecutar localmente
Requiere Node.js 20+ y conexión a Internet la primera vez para instalar dependencias y para los juegos/radios externos.

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:8787`
Salud: `http://localhost:8787/health`

Vite redirige `/ws` al backend en desarrollo y StackBlitz.

## Backend de esta prueba
Las salas se guardan en memoria. Si el backend se reinicia o el servicio gratuito se duerme, la sala activa se pierde. Para el mapa completo habrá que agregar persistencia.

## Calidad gráfica
El backend no crea la calidad visual: eso depende del frontend, modelos, materiales, iluminación y animaciones. Esta v19 mejora resolución adaptativa, cámara, viewport móvil y suavizado. Para un acabado comparable a un juego comercial habrá que sustituir gradualmente la geometría simple por assets y animaciones optimizados creados para Senderos Lajuj.

# Cambios v13 — Vida real y habitaciones-evento

## 1. Spawn seguro

El punto inicial ya no se elige entre todas las celdas abiertas. El juego:
1. calcula todos los componentes conectados del mapa;
2. identifica el componente transitable más grande;
3. elige una calle/plaza dentro de ese componente;
4. evita interiores de habitaciones;
5. prioriza posiciones con dos o más salidas.

Templo, cárcel, preguntas, mini-juegos, distractores, radio, arcades y habitaciones-evento se colocan dentro del mismo componente accesible.

## 2. Sin botón después de contestar

- Una respuesta muestra retroalimentación aproximadamente un segundo y el modal se cierra solo.
- Un mini-juego muestra su resultado aproximadamente un segundo y se cierra solo.
- Se eliminaron `qContinue` y `miniClose` del HTML.

## 3. Distractores de vida real

El estadio y el laboratorio no se califican como “malos”. Si el jugador participa, la actividad consume tiempo y una pequeña cantidad de atención. Si decide continuar su camino, el costo es nulo o mínimo.

### Estadio Lajuj
- césped 3D;
- líneas y portería;
- NPCs de dos equipos;
- jugadores en movimiento;
- balón animado;
- opción de entrar al equipo;
- mini partido de tres penales.

### Laboratorio
- mesas y paneles 3D;
- piezas flotantes;
- núcleo luminoso;
- recolección de piezas;
- invento ajustado por edad:
  - 5–7: avión luminoso;
  - 8–10: robot explorador;
  - 11–13: auto de carreras;
  - 14–17: máquina del tiempo;
  - 18+: dron solar.

## 4. Mini-juegos adicionales

Se añadieron fútbol, carrera, cocina, baloncesto y construcción de inventos, además de los ya existentes de memoria, reflejos, ritmo, cartas y trivia.

## 5. Radio y música

Las estaciones del mapa abren un reproductor dentro de Senderos Lajuj. El jugador puede:
- elegir emisora;
- silenciar;
- graduar volumen;
- cerrar la radio y continuar.

No se abre YouTube para estas estaciones.

## 6. Arcade retro

Se añadieron puntos de arcade que incrustan juegos GBA homebrew/demo gratuitos publicados para navegador. El juego no contiene ROMs de Nintendo ni copias comerciales.

## 7. Videos

Esta versión no añade videos obligatorios. Si posteriormente se incorporan, deben seguir la regla definida para el proyecto: reproductor pequeño dentro del juego, controles propios, volumen graduable y reducción automática del audio del juego mientras se reproduce el video.

- Se eliminó el botón externo de Jamendo: la experiencia musical principal permanece dentro del juego.

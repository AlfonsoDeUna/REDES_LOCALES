# Tema 1 · Conocemos las redes locales: Neo-Nexus

Juego de repaso de Redes Locales para **1.º de SMR del IES Valle Inclán**. Alfonso te asigna una misión: convertirte en Root, investigar el apagón de Neo-Nexus y recuperar la conexión.

- **[Jugar online](https://alfonsodeuna.github.io/REDES_LOCALES/UT1ConociendoRedesLocales/neonexusgame/)**
- **[Descargar el ZIP para jugar sin Internet](https://alfonsodeuna.github.io/REDES_LOCALES/UT1ConociendoRedesLocales/neonexusgame/neonexusgame.zip)**

## Jugar online

1. Abre el enlace **Jugar online** en el navegador. No necesitas una cuenta de GitHub.
2. Elige una de las cuatro apariencias de Root y pulsa **Iniciar aventura**.
3. Si es tu primera partida, pulsa **Aprender a jugar** para ver la simulación guiada.
4. Para retomar una partida guardada, usa **Continuar partida** en el mismo navegador y dispositivo.

El enlace del repositorio muestra los archivos; el enlace que termina en `github.io/REDES_LOCALES/UT1ConociendoRedesLocales/neonexusgame/` abre el juego.

## Jugar con el ZIP, sin conexión

1. Descarga **neonexusgame.zip**, desde el enlace anterior o desde el botón **Descargar ZIP** de la portada del juego. Durante la partida también tienes el botón **ZIP**.
2. Descomprime el archivo. En Windows: clic derecho sobre el ZIP → **Extraer todo**.
3. Dentro de la carpeta extraída `neonexusgame`, abre **ut1redesneonexus.html** con tu navegador.
4. Conserva esa carpeta para seguir usando la misma copia del juego.

No abras el HTML dentro del ZIP: extráelo primero. El juego incluye sus gráficos, tipografía y preguntas en el propio HTML; no requiere instalación, servidor ni conexión a Internet. En el ZIP también encontrarás `LEEME.txt`.

## Controles

| Acción | Teclado o pantalla |
| --- | --- |
| Moverte | Flechas o **WASD**; botones de dirección en pantalla |
| Correr | Mantener **Mayús** mientras te mueves |
| Hablar o usar un terminal cercano | **E**, **Espacio** o botón **Conectar** |
| Consultar las pistas | **M** o **Inventario MAC** |
| Pedir una pista | Botón **Canal de Alfonso** |
| Cerrar un diálogo | **Esc** o botón de cierre |

## Objetivo y recorrido

La aventura tiene cuatro retos: **Administración, Recursos Humanos, Investigación y Desarrollo y Búnker de Telecomunicaciones**. La pasarela de cristal comunica los edificios: Administración al oeste, RRHH al este, I+D al norte y búnker al sur.

1. Busca los terminales marcados con **?**: hay cinco por edificio, con dos preguntas cada uno.
2. Responde las **10 preguntas del edificio** y acércate a su consola de recuperación, marcada con una estrella.
3. Resuelve la tarea práctica para abrir el siguiente acceso. La oficina de RRHH utiliza tres listas sobre las funciones del switch, el punto de acceso y el router.
4. Conserva los tres fragmentos y la MAC asociada a cada uno. Los personajes marcados con **!** dan información y pistas.
5. Tras responder las diez preguntas del búnker, ordena los fragmentos pulsando sus tarjetas según la indicación del terminal. Cuando el orden sea correcto, la clave se cargará sola. Pulsa **Ejecutar recuperación**.

Los enemigos patrullan, buscan tu señal y te persiguen. Si te alcanzan, vuelves al punto seguro sin perder respuestas ni puntos. **Mientras lees una pregunta o un diálogo, los enemigos quedan pausados.** No hay límite de tiempo para responder.

## Puntuación

- Las **40 preguntas del tema** forman la evaluación principal: **100 puntos por acierto inicial**, hasta **4.000 puntos**.
- Una respuesta incorrecta muestra la explicación y permite continuar. Para avanzar necesitas responder todas las preguntas del reto; no necesitas acertarlas todas.
- Las **6 preguntas extra** son opcionales: hasta **600 puntos adicionales**, registrados por separado. No sustituyen las 40 preguntas ni desbloquean edificios.
- Puedes consultar **Resultados** para ver tus aciertos y repasar las preguntas respondidas.

## Guardado y actualizaciones

El progreso se guarda localmente cuando el navegador lo permite. Para continuarlo, utiliza el mismo navegador, dispositivo y dirección del juego. La versión online y la copia del ZIP no sincronizan sus partidas. La navegación privada, borrar los datos del navegador o cambiar la ubicación del HTML pueden impedir recuperar el guardado.

Las puntuaciones no se envían automáticamente al profesor. Para obtener una versión actualizada sin conexión, descarga un ZIP nuevo. Online, recarga la página después de una actualización y usa **Continuar partida**.

## Publicación para el profesor

El juego se guarda en `UT1ConociendoRedesLocales/neonexusgame/`:

- `index.html`: versión online con enlaces de descarga e instrucciones.
- `neonexusgame.zip`: copia autónoma para descargar y jugar sin conexión.

Esta guía se guarda en `UT1ConociendoRedesLocales/tema1.md`.

GitHub Pages debe publicar la rama **main**, carpeta **/(root)**, desde **Settings → Pages → Deploy from a branch**. El archivo `.nojekyll` conserva la publicación como archivos estáticos. No se necesita instalar Node.js ni otro servidor para jugar.

Al actualizar el juego, actualiza también el HTML del ZIP para que ambas versiones coincidan. Conserva los nombres y rutas para mantener los enlaces de clase.

# Dentro del paquete · Arquitectura TCP/IP

Presentación web interactiva de **Redes Locales, 1.º SMR · UT2: Arquitectura de redes**. Permite acompañar una explicación en clase con simulaciones, actividades de identificación y un cuaderno individual descargable.

**[Abrir la clase](https://alfonsodeuna.github.io/REDES_LOCALES/UT2%20Arquitectura%20de%20redes/tcpip-interactivo/)**

## Qué incluye

| Sección | Trabajo del alumnado |
| --- | --- |
| 00 · Antes de enviar | Formular una predicción sobre lo que viaja por la red. |
| 01 · El viaje del mensaje | Observar la encapsulación y desencapsulación paso a paso. |
| 02 · El paso por routers | Comparar direcciones IP, MAC, TTL y puertos en enlaces consecutivos. |
| 03 · El equipo de protocolos | Relacionar 11 protocolos con su función y su capa; comparar cinco pilas. |
| 04 · Construye una PDU | Montar una trama e inspeccionar la relación entre cabeceras y datos. |
| 05 · Explora las cabeceras | Consultar TCP e IPv4, localizar ocho campos y explicar su función. |
| 06 · Laboratorio de seguridad | Simular cuatro incidentes, predecir sus consecuencias y aplicar defensas. |
| 07 · ICMP y ping | Interpretar respuestas, pérdidas, TTL agotado y ausencia de ruta. |
| 08 · Misión final | Resolver seis situaciones que conectan los conceptos anteriores. |
| 09 · Mi cuaderno | Revisar respuestas, completar el ticket de salida y descargar las evidencias. |

Las actividades admiten reintentos. Su propósito es hacer visible el razonamiento y ofrecer retroalimentación durante el aprendizaje. El progreso no es una calificación oficial ni una prueba protegida.

## Uso durante la clase

1. Abre la clase y activa **Proyector** para ampliar el área de trabajo. Puedes usar el botón de pantalla completa o `F11` si el navegador lo permite.
2. El alumnado abre el mismo enlace. Indica la sección que debe visitar en el menú lateral.
3. Plantea una predicción antes de ejecutar la simulación. Por ejemplo: «¿Qué dirección crees que cambiará al salir de este router?».
4. Avanza con los controles de cada simulación, deja experimentar y pide una explicación apoyada en un campo, una cabecera o una PDU.
5. Consulta **Guía docente** para ver una sugerencia y una pregunta correspondientes a la sección actual.
6. Al terminar, cada alumno revisa **Mi cuaderno**, completa su ticket de salida y descarga el archivo para entregarlo.

Los botones de cada simulación controlan sus propios pasos. El menú lateral y los botones inferiores cambian de sección. `Alt` + flecha izquierda/derecha permite recorrer las secciones.

### Propuesta para dos sesiones de 55 minutos

| Sesión | Secuencia | Tiempo |
| --- | --- | --- |
| 1 · Cómo viajan los datos | Predicción inicial (5 min), viaje del mensaje (12), routers (12), protocolos (14) y PDU (12). | 55 min |
| 2 · Inspeccionar y diagnosticar | Cabeceras (18 min), seguridad (15), ICMP (12), misión final (5) y cuaderno (5). | 55 min |

Es una distribución orientativa. Las actividades pueden hacerse por separado, detenerse para el contraste por parejas o distribuirse en más sesiones. Si el grupo necesita más tiempo, selecciona primero los retos esenciales y continúa después con los restantes.

## Respuestas y entrega en Moodle

Las respuestas, explicaciones, progreso y datos de identificación se guardan **en el navegador utilizado**, cuando este permite el almacenamiento local. Cada alumno puede indicar su nombre o el identificador que solicite el profesor.

En **Mi cuaderno**:

1. Revisa las evidencias y escribe las respuestas del ticket de salida.
2. Pulsa **Descargar mi cuaderno**. Se genera un archivo HTML con las respuestas registradas y las explicaciones.
3. Adjunta ese archivo en la tarea de Moodle indicada por el profesor. También puedes imprimirlo o guardarlo como PDF desde el navegador.
4. Si modificas las respuestas después de descargarlo, vuelve a descargar el cuaderno actualizado.

El cuaderno recoge el registro más reciente de cada actividad. La web **no envía automáticamente las respuestas, no reúne resultados de una clase y no sincroniza pantallas**. El avance del profesor y el de cada alumno son independientes. Tampoco es un paquete SCORM ni escribe calificaciones en Moodle.

Descarga el cuaderno antes de cambiar de dispositivo, borrar los datos del navegador o cerrar una sesión temporal en un equipo compartido. Si se abre una copia local y después la versión web, sus almacenamientos pueden ser distintos. En un ordenador compartido, conserva la entrega y utiliza después **Borrar mis datos locales** para que la siguiente persona empiece su propio recorrido.

## Alcance y decisiones del modelo

- Se utiliza el modelo TCP/IP de cuatro capas: aplicación, transporte, Internet y acceso a red. El mapa de OSI explica la correspondencia de responsabilidades; no presupone siete cabeceras independientes.
- Los diagramas principales muestran Ethernet II, IPv4 y TCP, sin NAT, VLAN ni opciones de cabecera. Las direcciones IP de los ejemplos están reservadas para documentación.
- La encapsulación parte de una conexión TCP ya establecida. El saludo de tres mensajes se explora en el laboratorio de seguridad.
- En el constructor, los datos de aplicación se limitan a **1460 bytes UTF-8**: con 20 bytes de TCP y 20 de IPv4 se respeta una MTU de 1500 bytes. La segmentación TCP queda fuera de ese montaje. Los saltos de línea cuentan como CRLF y los recortes se avisan en pantalla.
- La trama cuenta cabecera Ethernet y FCS. El modelo excluye preámbulo, delimitador de inicio e intervalo entre tramas; añade relleno cuando es necesario.
- Los incidentes de ARP falsificado, IP de origen falsa, conexiones TCP incompletas y HTTP frente a HTTPS son **simulaciones locales**. No generan paquetes, no escanean equipos y no realizan ataques reales.
- Los tiempos, pérdidas y capturas de ping son ficticios. La práctica opcional con un ping real se realiza fuera de la web y con los equipos que indique el profesor.
- HTTPS se ilustra con HTTP/1.1 sobre TLS y TCP. La actividad aclara que HTTP/3 utiliza una combinación diferente, con QUIC sobre UDP.

### Aclaraciones respecto al material de partida

**ICMP:** se presenta como protocolo de notificación de errores y diagnóstico de IP. No se atribuye a ICMP el control de flujo de TCP. Se distinguen Echo Request, Echo Reply, Destination Unreachable y Time Exceeded. El mecanismo histórico Source Quench fue retirado; un ping sin respuesta no demuestra por sí solo que el equipo esté apagado.

**ARP:** se sitúa en la frontera entre el direccionamiento IPv4 y el enlace, dentro de acceso a red en este modelo. Sus mensajes viajan directamente en Ethernet, sin cabecera IPv4 ni TCP. Para un destino remoto se resuelve la MAC del siguiente salto local.

**Ataques y capas:** los casos se organizan por el dato o recurso que ayudan a estudiar. Una herramienta de captura o una técnica no queda asociada de forma exclusiva a una sola capa.

## Fuentes de consulta

Los enlaces a las RFC se incluyen también en la clase. Los diagramas incorporados permiten trabajar aunque no se abran los documentos externos.

- [RFC 9293 · TCP, sección 3.1](https://www.rfc-editor.org/rfc/rfc9293.html#section-3.1).
- [RFC 791 · IPv4, sección 3.1](https://www.rfc-editor.org/rfc/rfc791.html#section-3.1).
- [RFC 826 · ARP](https://www.rfc-editor.org/rfc/rfc826.html).
- [RFC 792 · ICMP](https://www.rfc-editor.org/rfc/rfc792.html).
- [RFC 6633 · Retirada de ICMP Source Quench](https://www.rfc-editor.org/rfc/rfc6633.html).
- [RFC 2474 · DSCP](https://www.rfc-editor.org/rfc/rfc2474.html) y [RFC 3168 · ECN](https://www.rfc-editor.org/rfc/rfc3168.html).
- [RFC 7766 · DNS sobre TCP](https://www.rfc-editor.org/rfc/rfc7766.html).
- [RFC 2827 · Filtrado de direcciones de origen](https://www.rfc-editor.org/rfc/rfc2827.html).
- [RFC 4987 · SYN flooding y mitigaciones](https://www.rfc-editor.org/rfc/rfc4987.html).
- [RFC 8446 · TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446.html).

## Editar y generar la página

La clase funciona con HTML, CSS y JavaScript, sin instalación de paquetes. `index.html` contiene los estilos y scripts integrados y puede abrirse directamente en un navegador moderno. Los enlaces externos a las RFC sí necesitan conexión.

Los archivos editables están en `src/`:

| Archivo | Contenido |
| --- | --- |
| `shell.html` | Estructura general de la página. |
| `base.css` y `app.js` | Navegación, presentación, guía docente, misión final y cuaderno. |
| `journey.js` y `journey.css` | Simulaciones del viaje y del paso por routers. |
| `packet-labs.js` y `packet-labs.css` | Protocolos, constructor de PDU e inspector de cabeceras. |
| `security-labs.js` y `security-labs.css` | Simulaciones de seguridad, ICMP y ping. |

Después de modificar `src/`, ejecuta en la carpeta de la clase:

```bash
python3 build.py
```

El script genera **`index.html` junto a `build.py`**. Publica ese archivo generado y conserva los fuentes para las siguientes ediciones. Evita editar únicamente el HTML generado, ya que una nueva ejecución del script sustituirá esos cambios.

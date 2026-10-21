/* Classroom simulations: all packets are local, illustrative data. */
(function () {
  'use strict';
  window.LabModules = window.LabModules || {};

  const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const bytes = text => new TextEncoder().encode(text).length;
  const LAYERS = [
    { name: 'Aplicación', example: 'HTTP', key: 'app', detail: 'El significado del mensaje' },
    { name: 'Transporte', example: 'TCP', key: 'transport', detail: 'Procesos y entrega fiable' },
    { name: 'Internet', example: 'IPv4', key: 'internet', detail: 'Direcciones y encaminamiento' },
    { name: 'Acceso a la red', example: 'Ethernet', key: 'access', detail: 'Entrega en el enlace local' }
  ];
  const monitor = '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="5" y="7" width="38" height="27" rx="4"/><path d="M19 34v7m10-7v7M13 41h22M10 28h28"/></svg>';
  const router = '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="5" y="13" width="38" height="24" rx="8"/><path d="M13 21h8m-3-3 3 3-3 3m17 5h-8m3-3-3 3 3 3M14 13V7m20 6V7"/></svg>';

  function controls(prefix, count) {
    return `<div class="journey-controls" aria-label="Controles de la simulación">
      <div class="journey-control-buttons"><button class="btn" type="button" data-${prefix}-action="reset" aria-label="Reiniciar simulación">↺</button><button class="btn" type="button" data-${prefix}-action="prev">← Atrás</button><button class="btn primary" type="button" data-${prefix}-action="play">▶ Reproducir</button><button class="btn" type="button" data-${prefix}-action="next">Siguiente →</button></div>
      <label class="journey-speed">Ritmo <select data-${prefix}-speed aria-label="Velocidad de la simulación"><option value="2600">Pausado</option><option value="1600" selected>Normal</option><option value="850">Rápido</option></select></label>
      <label class="journey-scrubber"><span data-${prefix}-counter>Paso 1 de ${count}</span><input data-${prefix}-range type="range" min="0" max="${count - 1}" value="0" aria-label="Elegir paso de la simulación"></label>
    </div>`;
  }

  function attachPlayer(root, prefix, count, onDraw, onEnd) {
    let current = 0;
    let timer = null;
    let speed = 1600;
    const play = root.querySelector(`[data-${prefix}-action="play"]`);
    const range = root.querySelector(`[data-${prefix}-range]`);
    const previous = root.querySelector(`[data-${prefix}-action="prev"]`);
    const next = root.querySelector(`[data-${prefix}-action="next"]`);
    function stop() {
      if (timer !== null) clearTimeout(timer);
      timer = null;
      play.textContent = '▶ Reproducir';
      play.setAttribute('aria-pressed', 'false');
    }
    function draw() {
      range.value = current;
      root.querySelector(`[data-${prefix}-counter]`).textContent = `Paso ${current + 1} de ${count}`;
      previous.disabled = current === 0;
      next.disabled = current === count - 1;
      onDraw(current);
      if (current === count - 1) { stop(); onEnd(); }
    }
    function tick() {
      timer = setTimeout(() => {
        current = Math.min(count - 1, current + 1);
        draw();
        if (current < count - 1) tick();
      }, speed);
    }
    function setStep(step) { stop(); current = Math.max(0, Math.min(count - 1, step)); draw(); }
    function click(event) {
      const button = event.target.closest(`[data-${prefix}-action]`);
      if (!button || !root.contains(button)) return;
      const action = button.getAttribute(`data-${prefix}-action`);
      if (action === 'play') {
        if (timer !== null) return stop();
        if (current === count - 1) { current = 0; draw(); }
        play.textContent = 'Ⅱ Pausar'; play.setAttribute('aria-pressed', 'true'); tick();
      } else if (action === 'prev') setStep(current - 1);
      else if (action === 'next') setStep(current + 1);
      else if (action === 'reset') setStep(0);
    }
    function slide() { setStep(Number(range.value)); }
    function changeSpeed(event) { speed = Number(event.target.value); if (timer !== null) { clearTimeout(timer); tick(); } }
    root.addEventListener('click', click);
    range.addEventListener('input', slide);
    root.querySelector(`[data-${prefix}-speed]`).addEventListener('change', changeSpeed);
    draw();
    return { stop, redraw: draw, setStep, getStep: () => current, destroy() {
      stop(); root.removeEventListener('click', click); range.removeEventListener('input', slide);
      root.querySelector(`[data-${prefix}-speed]`).removeEventListener('change', changeSpeed);
    } };
  }

  function stack(side, active, title, address) {
    return `<div class="journey-computer"><div class="journey-device-caption">${monitor}<div><strong>${title}</strong><small>${address}</small></div></div><div class="journey-stack" aria-label="Capas del ${title}">${LAYERS.map((layer, index) => `<div class="journey-layer journey-${layer.key} ${active === index ? 'journey-active' : ''}"><span>${layer.name}</span><b>${layer.example}</b>${active === index ? '<span class="journey-layer-dot" aria-label="Capa activa"></span>' : ''}</div>`).join('')}</div><p class="journey-direction">${side === 'send' ? '↓ Encapsular para enviar' : '↑ Desencapsular para recibir'}</p></div>`;
  }

  const encSteps = [
    { title: 'Todo empieza con un mensaje', detail: 'La persona escribe un mensaje. La aplicación conoce su significado; todavía no hay un segmento TCP ni una trama Ethernet.', side: 'send', layer: 0, depth: -1, phase: 'Preparar' },
    { title: 'HTTP prepara la petición', detail: 'La aplicación construye una petición HTTP: línea de petición, cabeceras HTTP y cuerpo. Usamos HTTP sin cifrar para poder leer el ejemplo.', side: 'send', layer: 0, depth: 0, phase: 'Aplicación' },
    { title: 'TCP añade su cabecera', detail: 'Los puertos identifican los procesos. Los números de secuencia y confirmación permiten ordenar y confirmar los bytes. La conexión TCP ya está establecida en este ejemplo.', side: 'send', layer: 1, depth: 1, phase: 'Segmento' },
    { title: 'IPv4 añade origen y destino', detail: 'La cabecera IPv4 incluye las direcciones de los equipos, el TTL y el campo Protocol = 6, que indica que su carga útil es TCP.', side: 'send', layer: 2, depth: 2, phase: 'Paquete' },
    { title: 'Ethernet prepara el enlace local', detail: 'La trama añade MAC de destino y de origen, EtherType = 0x0800 y una cola FCS. La cabecera TCP y el paquete IP quedan dentro de la carga útil de Ethernet.', side: 'send', layer: 3, depth: 3, phase: 'Trama' },
    { title: 'La trama se transmite como señales', detail: 'La tarjeta de red codifica los bits como señales del medio. No viajan cajas de colores: los bloques del dibujo nos ayudan a interpretar esos bits.', side: 'wire', layer: -1, depth: 3, phase: 'En el medio' },
    { title: 'Ethernet recibe y comprueba', detail: 'La tarjeta del receptor acepta la trama destinada a su MAC y comprueba su FCS. Si detectara un error, la trama se descartaría.', side: 'receive', layer: 3, depth: 3, phase: 'Recepción' },
    { title: 'Ethernet entrega el paquete a IPv4', detail: 'Se retiran la cabecera Ethernet y la FCS. EtherType indica que el contenido debe entregarse a IPv4, que verifica la dirección IP de destino.', side: 'receive', layer: 2, depth: 2, phase: 'Paquete' },
    { title: 'IPv4 entrega el segmento a TCP', detail: 'Se procesa la cabecera IPv4. Su campo Protocol = 6 permite entregar el segmento a TCP. El puerto de destino 80 identifica el servicio receptor.', side: 'receive', layer: 1, depth: 1, phase: 'Segmento' },
    { title: 'TCP entrega un flujo de bytes', detail: 'TCP comprueba, ordena y entrega los bytes a la aplicación. Puede reunir datos de varios segmentos; una petición HTTP no tiene por qué coincidir con un solo segmento.', side: 'receive', layer: 0, depth: 0, phase: 'Aplicación' },
    { title: 'El servidor interpreta el mensaje', detail: 'La aplicación analiza HTTP y recupera el cuerpo. Las cabeceras han cumplido su función: el mensaje puede ser interpretado por el servicio de destino.', side: 'receive', layer: 0, depth: -1, phase: 'Entregado' }
  ];

  function piece(label, value, layer, className) {
    return `<div class="journey-piece journey-${layer} ${className || ''}"><strong>${label}</strong><small>${value}</small></div>`;
  }

  function packetRibbon(depth, dataBytes, message, route) {
    const item = route || { sourceMAC: '02:00:00:00:01:10', targetMAC: '02:00:00:00:01:20', ttl: 64 };
    let pieces = '';
    if (depth < 0) return `<div class="journey-message-bubble"><span class="journey-message-label">Cuerpo del mensaje</span><strong>“${escapeHTML(message)}”</strong></div>`;
    if (depth >= 3) pieces += piece('Ethernet', '14 B · MAC origen y destino', 'access');
    if (depth >= 2) pieces += piece('IPv4', `20 B · TTL ${item.ttl}`, 'internet');
    if (depth >= 1) pieces += piece('TCP', '20 B · puertos 51000 → 80', 'transport');
    pieces += piece('HTTP', `${dataBytes} B · cabeceras + cuerpo`, 'app', 'journey-body-piece');
    if (depth >= 3) pieces += piece('FCS', '4 B', 'access', 'journey-fcs-piece');
    const names = ['Mensaje HTTP', 'Segmento TCP', 'Paquete IPv4', 'Trama Ethernet'];
    const totals = [dataBytes, dataBytes + 20, dataBytes + 40, dataBytes + 58];
    return `<div class="journey-pdu-caption"><span>${names[depth]}</span><strong>${totals[depth]} bytes</strong></div><div class="journey-pdu-ribbon">${pieces}</div><p class="journey-small">Cada capa trata como datos la PDU de la capa superior. ${depth >= 3 ? 'La FCS es una cola, no una cabecera.' : ''}</p>`;
  }

  window.LabModules.encapsulation = {
    render() {
      return `<div class="journey-view"><div class="journey-intro"><p>Envía un mensaje y observa qué añade cada capa. Después, sigue el proceso inverso en el receptor.</p><span class="chip">Misma red local · IPv4 · HTTP</span></div>
        <div class="panel journey-simulator"><div class="journey-message-form"><label for="journey-message">Tu mensaje <input id="journey-message" type="text" maxlength="60" value="Hola, servidor." autocomplete="off"></label><button type="button" class="btn" data-enc-update>Aplicar mensaje</button></div>
        <div data-enc-stage></div>${controls('enc', encSteps.length)}</div>
        <div class="journey-bottom-grid"><details class="panel journey-details"><summary>Inspeccionar la petición HTTP y sus tamaños</summary><div data-enc-request></div></details><div class="panel journey-key"><span class="eyebrow">Qué debes observar</span><h3>Lo que era cabecera pasa a ser datos.</h3><p>Para IPv4, todo el segmento TCP es carga útil. Para Ethernet, todo el paquete IPv4 es carga útil.</p><p class="journey-small">Modelo de cuatro capas TCP/IP. Las funciones físicas están incluidas en acceso a la red. No todas las capas OSI implican una cabecera independiente.</p></div></div>
        <section class="panel journey-exercise" aria-labelledby="journey-enc-question"><span class="eyebrow">Actividad 01 · identifica la responsabilidad</span><h3 id="journey-enc-question">¿Quién añade esta información?</h3><p>Elige una capa para cada elemento y comprueba tu explicación.</p><div data-enc-quiz></div><div class="toolbar"><button type="button" class="btn primary" data-enc-check>Comprobar respuestas</button><button type="button" class="btn" data-enc-clear>Volver a intentar</button></div><div data-enc-feedback aria-live="polite"></div></section>
      </div>`;
    },
    mount(root, api) {
      let message = api.load('enc-message', 'Hola, servidor.');
      const messageInput = root.querySelector('#journey-message');
      messageInput.value = message;
      const stage = root.querySelector('[data-enc-stage]');
      const questions = [
        { text: 'Puertos de origen y destino', answer: 'transport', why: 'TCP usa puertos para identificar los procesos o servicios.' },
        { text: 'Direcciones IP y TTL', answer: 'internet', why: 'IPv4 identifica los equipos y limita la permanencia del paquete.' },
        { text: 'Direcciones MAC y FCS', answer: 'access', why: 'Ethernet entrega la trama en el enlace y permite detectar errores.' },
        { text: 'Método POST y cabeceras HTTP', answer: 'app', why: 'HTTP define cómo solicitar una operación al servidor.' }
      ];
      let answers = api.load('enc-answers', {});
      function drawQuestions() {
        root.querySelector('[data-enc-quiz]').innerHTML = questions.map((question, index) => `<label class="journey-match-row"><span>${question.text}</span><select data-enc-answer="${index}" aria-label="Capa para ${question.text}"><option value="">Elige una capa</option>${LAYERS.map(layer => `<option value="${layer.key}" ${answers[index] === layer.key ? 'selected' : ''}>${layer.name}</option>`).join('')}</select></label>`).join('');
      }
      function requestText() {
        return `POST /saludo HTTP/1.1\r\nHost: aula.example\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Length: ${bytes(message)}\r\n\r\n${message}`;
      }
      function draw(stepIndex) {
        const step = encSteps[stepIndex];
        const request = requestText();
        stage.innerHTML = `<div class="journey-step-heading"><div><span class="eyebrow">${String(stepIndex + 1).padStart(2, '0')} / ${String(encSteps.length).padStart(2, '0')} · ${step.phase}</span><h3>${step.title}</h3></div><span class="journey-status ${step.side === 'wire' ? 'journey-status-moving' : ''}">${step.side === 'send' ? 'Emisor' : step.side === 'receive' ? 'Receptor' : 'En tránsito'}</span></div>
          <div class="journey-two-stacks">${stack('send', step.side === 'send' ? step.layer : -1, 'Ordenador A', '192.0.2.10')}<div class="journey-center"><div class="journey-flow-marker ${step.side === 'wire' ? 'journey-moving' : ''}" aria-hidden="true"><span></span><b>${step.side === 'receive' ? 'Recibido' : step.side === 'wire' ? '01001101' : 'Mensaje'}</b><span></span></div><div class="journey-step-note" aria-live="polite">${step.detail}</div></div>${stack('receive', step.side === 'receive' ? step.layer : -1, 'Servidor B', '192.0.2.20')}</div>
          <div class="journey-packet-area" aria-label="Contenido actual de la unidad de datos">${packetRibbon(step.depth, bytes(request), message)}</div>`;
        root.querySelector('[data-enc-request]').innerHTML = `<pre class="journey-code">${escapeHTML(request.replace(/\r/g, ''))}</pre><div class="journey-size-grid"><span>Cuerpo <b>${bytes(message)} B</b></span><span>Mensaje HTTP <b>${bytes(request)} B</b></span><span>Cabecera TCP <b>20 B</b></span><span>Cabecera IPv4 <b>20 B</b></span></div><p class="journey-small">Valores del ejemplo: TCP e IPv4 sin opciones; Ethernet sin etiqueta VLAN. No se contabilizan preámbulo, SFD ni separación entre tramas. El cuerpo se codifica en UTF-8: algunas letras ocupan más de un byte. Una petición cabe aquí en un segmento por simplicidad.</p>`;
      }
      const player = attachPlayer(root, 'enc', encSteps.length, draw, () => api.markComplete('encapsulation', 'Viaje del mensaje completado', 'Encapsulación y desencapsulación en cuatro capas.'));
      drawQuestions();
      function click(event) {
        if (event.target.closest('[data-enc-update]')) {
          const value = messageInput.value.trim();
          if (!value) { messageInput.setCustomValidity('Escribe un mensaje antes de enviarlo.'); messageInput.reportValidity(); return; }
          messageInput.setCustomValidity(''); message = value; api.save('enc-message', message); player.setStep(0);
        }
        if (event.target.closest('[data-enc-check]')) {
          const feedback = root.querySelector('[data-enc-feedback]');
          if (questions.some((_, i) => !answers[i])) { feedback.innerHTML = '<p class="feedback">Completa las cuatro capas antes de comprobar.</p>'; return; }
          let correct = 0;
          const details = questions.map((q, i) => { const ok = answers[i] === q.answer; if (ok) correct++; return `<li><strong>${ok ? '✓' : '↺'} ${q.text}:</strong> ${q.why}</li>`; }).join('');
          feedback.innerHTML = `<div class="feedback ${correct === questions.length ? 'ok' : 'bad'}"><strong>${correct} de ${questions.length} relaciones correctas.</strong><ul>${details}</ul></div>`;
          api.record('encapsulation-layers', { question: '¿Quién añade cada información?', answer: questions.map((q, i) => `${q.text}: ${LAYERS.find(l => l.key === answers[i]).name}`).join(' | '), correct: correct === questions.length, score: correct, max: questions.length, feedback: questions.map(q => q.why).join(' ') });
        }
        if (event.target.closest('[data-enc-clear]')) { answers = {}; api.save('enc-answers', answers); drawQuestions(); root.querySelector('[data-enc-feedback]').innerHTML = ''; }
      }
      function change(event) { if (event.target.matches('[data-enc-answer]')) { answers[event.target.dataset.encAnswer] = event.target.value; api.save('enc-answers', answers); } }
      function clearValidity() { messageInput.setCustomValidity(''); }
      root.addEventListener('click', click); root.addEventListener('change', change); messageInput.addEventListener('input', clearValidity);
      return () => { player.destroy(); root.removeEventListener('click', click); root.removeEventListener('change', change); messageInput.removeEventListener('input', clearValidity); };
    }
  };

  const links = [
    { sourceMAC: '02:00:00:00:01:10', targetMAC: '02:00:00:00:01:01', ttl: 64, label: 'A → R1', checksum: '0x9C28' },
    { sourceMAC: '02:00:00:00:12:01', targetMAC: '02:00:00:00:12:02', ttl: 63, label: 'R1 → R2', checksum: '0x9D28' },
    { sourceMAC: '02:00:00:00:03:01', targetMAC: '02:00:00:00:03:20', ttl: 62, label: 'R2 → B', checksum: '0x9E28' }
  ];
  const routeSteps = [
    { title: 'Un destino remoto, un siguiente salto', node: 0, link: -1, hop: 0, depth: 3, detail: 'A quiere alcanzar 203.0.113.20. Su tabla de rutas indica la puerta de enlace R1: la IP de destino es la del servidor, pero la MAC de destino es la de R1.' },
    { title: 'Primer enlace: A → R1', node: -1, link: 0, hop: 0, depth: 3, detail: 'La trama del primer enlace lleva MAC A → MAC R1. Dentro viaja un paquete con IP A → IP B y TTL = 64.' },
    { title: 'R1 recibe la trama', node: 1, link: -1, hop: 0, depth: 3, detail: 'R1 recibe en su interfaz de entrada, valida la trama Ethernet y extrae el paquete IPv4. La trama que recibió termina aquí.' },
    { title: 'R1 consulta IPv4 y decide la salida', node: 1, link: -1, hop: 1, depth: 2, detail: 'R1 consulta la IP de destino y su tabla de rutas. Al reenviar, reduce TTL de 64 a 63 y actualiza el checksum de la cabecera IPv4. No retira la cabecera TCP para entregar el mensaje a HTTP.' },
    { title: 'Segundo enlace: R1 → R2', node: -1, link: 1, hop: 1, depth: 3, detail: 'R1 construye una nueva trama. Su interfaz de salida es ahora la MAC de origen; la interfaz de entrada de R2, la MAC de destino. La nueva trama lleva su propia FCS.' },
    { title: 'R2 procesa el paquete', node: 2, link: -1, hop: 2, depth: 2, detail: 'R2 retira la segunda envoltura Ethernet, consulta su ruta y reduce TTL de 63 a 62. Los extremos IP y los puertos TCP siguen siendo los mismos.' },
    { title: 'Tercer enlace: R2 → B', node: -1, link: 2, hop: 2, depth: 3, detail: 'R2 crea una tercera trama con su MAC de salida y la MAC del servidor B. El paquete continúa dirigido a 203.0.113.20.' },
    { title: 'B es el destino final', node: 3, link: -1, hop: 2, depth: 3, detail: 'B reconoce su MAC e IP. Ahora sí procesa TCP y entrega los bytes al servidor HTTP en el puerto 80. Los routers intermedios se ocuparon de encaminar.' }
  ];
  const nodes = [
    { name: 'Ordenador A', type: 'Equipo', icon: monitor, ip: '192.0.2.10', detail: 'Origen IP: 192.0.2.10. Servicio cliente: puerto 51000. Envía la trama a la puerta de enlace, no a la MAC remota de B.', macs: ['LAN: 02:00:00:00:01:10'] },
    { name: 'Router R1', type: 'Router', icon: router, ip: 'Dos interfaces', detail: 'Encamina con la IP de destino. Una interfaz recibe la trama de A; otra genera la nueva trama hacia R2.', macs: ['Entrada: 02:00:00:00:01:01', 'Salida: 02:00:00:00:12:01'] },
    { name: 'Router R2', type: 'Router', icon: router, ip: 'Dos interfaces', detail: 'Entrega al enlace del servidor. Retira la trama de R1 y crea otra dirigida a la MAC de B.', macs: ['Entrada: 02:00:00:00:12:02', 'Salida: 02:00:00:00:03:01'] },
    { name: 'Servidor B', type: 'Equipo', icon: monitor, ip: '203.0.113.20', detail: 'Destino IP: 203.0.113.20. El servicio HTTP escucha en el puerto 80. Aquí termina el viaje IP y continúa la entrega a la aplicación.', macs: ['LAN: 02:00:00:00:03:20'] }
  ];

  window.LabModules.routing = {
    render() {
      return `<div class="journey-view"><div class="journey-intro"><p>¿Qué permanece igual cuando el mensaje cruza varias redes? Sigue la IP de extremo a extremo y la MAC de salto en salto.</p><span class="chip">3 enlaces Ethernet · Sin NAT</span></div><div class="panel journey-simulator"><div data-route-stage></div>${controls('route', routeSteps.length)}</div>
        <div class="journey-bottom-grid"><div class="panel journey-router-inspector"><span class="eyebrow">Inspecciona el recorrido</span><h3>Haz clic en un equipo o router</h3><div data-route-node-detail></div></div><div class="panel journey-key"><span class="eyebrow">La regla que conecta todo</span><h3>IP: de extremo a extremo.<br>MAC: de salto en salto.</h3><p>El TTL disminuye en cada router que reenvía el paquete. El checksum IPv4 también cambia. La cabecera TCP y sus puertos se conservan en este caso.</p><p class="journey-small">Escenario didáctico sin NAT, túneles ni fragmentación. Algunos dispositivos pueden inspeccionar capas superiores; aquí representamos el encaminamiento IP básico.</p></div></div>
        <section class="panel journey-exercise" aria-labelledby="journey-route-question"><span class="eyebrow">Actividad 02 · predice antes de avanzar</span><h3 id="journey-route-question">R1 va a reenviar el paquete. ¿Qué cambia?</h3><p>Selecciona todas las opciones que cambian entre el primer y el segundo enlace.</p><div class="journey-checkbox-grid" data-route-quiz></div><div class="toolbar"><button class="btn primary" type="button" data-route-check>Comprobar predicción</button><button class="btn" type="button" data-route-clear>Volver a intentar</button></div><div data-route-feedback aria-live="polite"></div></section></div>`;
    },
    mount(root, api) {
      let selectedNode = 0;
      const stage = root.querySelector('[data-route-stage]');
      let selections = api.load('route-answers', []);
      const options = [
        { id: 'mac', text: 'MAC de origen y de destino', correct: true },
        { id: 'ip', text: 'IP de origen y de destino', correct: false },
        { id: 'ttl', text: 'TTL y checksum IPv4', correct: true },
        { id: 'ports', text: 'Puertos TCP de origen y destino', correct: false },
        { id: 'fcs', text: 'Trama Ethernet y su FCS', correct: true },
        { id: 'data', text: 'Mensaje HTTP de la aplicación', correct: false }
      ];
      function drawQuiz() {
        root.querySelector('[data-route-quiz]').innerHTML = options.map(option => `<label class="journey-check-option"><input type="checkbox" value="${option.id}" data-route-answer ${selections.includes(option.id) ? 'checked' : ''}><span>${option.text}</span></label>`).join('');
      }
      function drawNode() {
        const node = nodes[selectedNode];
        root.querySelector('[data-route-node-detail]').innerHTML = `<div class="journey-device-caption">${node.icon}<div><strong>${node.name}</strong><small>${node.ip}</small></div></div><p>${node.detail}</p><div class="journey-interface-list">${node.macs.map(mac => `<code>${mac}</code>`).join('')}</div><div class="journey-node-layers">${(selectedNode === 1 || selectedNode === 2 ? LAYERS.slice(2) : LAYERS).map(layer => `<span class="journey-${layer.key}">${layer.name}</span>`).join('')}</div>`;
      }
      function draw(index) {
        const step = routeSteps[index];
        const link = links[step.hop];
        const network = nodes.map((node, n) => `${n > 0 ? `<div class="journey-route-link ${step.link === n - 1 ? 'journey-link-active' : ''}"><span class="journey-link-line"><i></i></span><small>Enlace ${n}</small></div>` : ''}<button type="button" class="journey-route-node ${step.node === n ? 'journey-node-active' : ''} ${selectedNode === n ? 'journey-node-selected' : ''}" data-route-node="${n}" aria-label="Inspeccionar ${node.name}">${node.icon}<strong>${node.name}</strong><small>${node.ip}</small><span>${node.type === 'Router' ? 'Internet + acceso' : 'Las 4 capas'}</span></button>`).join('');
        stage.innerHTML = `<div class="journey-step-heading"><div><span class="eyebrow">${String(index + 1).padStart(2, '0')} / 08 · ${step.depth === 2 ? 'Dentro del router' : link.label}</span><h3>${step.title}</h3></div><span class="journey-status">TTL ${link.ttl}</span></div><div class="journey-network" aria-label="Recorrido del paquete desde A hasta B">${network}</div><p class="journey-route-explanation" aria-live="polite">${step.detail}</p>
          <div class="journey-packet-area">${packetRibbon(step.depth, 120, 'Mensaje HTTP', link)}</div><div class="journey-hop-table-wrap"><table class="journey-hop-table"><caption>Campos al ${step.depth === 2 ? 'preparar el reenvío' : 'viajar por el enlace'} ${link.label}</caption><thead><tr><th scope="col">Campo</th><th scope="col">Valor que observamos</th><th scope="col">Al reenviar</th></tr></thead><tbody><tr><th scope="row">MAC origen</th><td><code>${step.depth === 2 ? 'Se añadirá: ' : ''}${link.sourceMAC}</code></td><td><span class="journey-change">Cambia</span></td></tr><tr><th scope="row">MAC destino</th><td><code>${step.depth === 2 ? 'Se añadirá: ' : ''}${link.targetMAC}</code></td><td><span class="journey-change">Cambia</span></td></tr><tr><th scope="row">IP origen → destino</th><td><code>192.0.2.10 → 203.0.113.20</code></td><td><span class="journey-keep">Se conserva</span></td></tr><tr><th scope="row">TTL</th><td><b>${link.ttl}</b></td><td><span class="journey-change">Disminuye en 1</span></td></tr><tr><th scope="row">Checksum IPv4</th><td><code>${link.checksum}</code> <small>ilustrativo</small></td><td><span class="journey-change">Se actualiza</span></td></tr><tr><th scope="row">Puertos TCP</th><td><code>51000 → 80</code></td><td><span class="journey-keep">Se conservan</span></td></tr></tbody></table></div><p class="journey-small">Direcciones de documentación y mensaje HTTP ilustrativo de 120 B. La resolución de la MAC del siguiente salto mediante ARP ya se ha realizado. Los valores de checksum ilustran el cambio por TTL y no son una captura real.</p>`;
      }
      const player = attachPlayer(root, 'route', routeSteps.length, draw, () => api.markComplete('routing', 'Recorrido entre redes completado', 'MAC por enlace; IP entre extremos; TTL por router.'));
      drawQuiz(); drawNode();
      function click(event) {
        const nodeButton = event.target.closest('[data-route-node]');
        if (nodeButton) { selectedNode = Number(nodeButton.dataset.routeNode); player.redraw(); drawNode(); root.querySelector(`[data-route-node="${selectedNode}"]`).focus({ preventScroll: true }); }
        if (event.target.closest('[data-route-check]')) {
          const correct = options.every(option => selections.includes(option.id) === option.correct);
          const score = options.filter(option => selections.includes(option.id) === option.correct).length;
          root.querySelector('[data-route-feedback]').innerHTML = `<div class="feedback ${correct ? 'ok' : 'bad'}"><strong>${correct ? '✓ Predicción correcta.' : 'Revisa qué identifica el enlace y qué identifica los extremos.'}</strong><p>Cambian las MAC, la trama con su FCS, el TTL y el checksum IPv4. Las IP de los extremos, los puertos TCP y el mensaje HTTP se conservan en este escenario sin NAT.</p><p class="journey-small">Una FCS recién calculada corresponde a la nueva trama; no es un identificador único ni un mecanismo criptográfico.</p></div>`;
          api.record('routing-prediction', { question: '¿Qué cambia al reenviar R1?', answer: selections.map(id => options.find(option => option.id === id).text).join(' | ') || 'Ningún campo seleccionado', correct, score, max: options.length, feedback: 'Cambian MAC, trama/FCS, TTL y checksum IPv4. Se conservan IP, puertos y HTTP en este caso sin NAT.' });
        }
        if (event.target.closest('[data-route-clear]')) { selections = []; api.save('route-answers', selections); drawQuiz(); root.querySelector('[data-route-feedback]').innerHTML = ''; }
      }
      function change(event) {
        if (!event.target.matches('[data-route-answer]')) return;
        selections = Array.from(root.querySelectorAll('[data-route-answer]:checked')).map(input => input.value);
        api.save('route-answers', selections);
      }
      root.addEventListener('click', click); root.addEventListener('change', change);
      return () => { player.destroy(); root.removeEventListener('click', click); root.removeEventListener('change', change); };
    }
  };
})();

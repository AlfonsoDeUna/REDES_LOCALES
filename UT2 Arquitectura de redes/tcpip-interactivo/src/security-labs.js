(function () {
  'use strict';
  window.LabModules = window.LabModules || {};
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon = name => {
    const paths = {pc:'<rect x="4" y="3" width="24" height="17" rx="2"/><path d="M16 20v6m-7 0h14"/>',router:'<rect x="3" y="9" width="26" height="17" rx="4"/><path d="M8 9V3m16 6V3M9 17h14m-4-4 4 4-4 4"/>',server:'<rect x="7" y="2" width="18" height="28" rx="3"/><path d="M7 11h18M7 21h18M11 7h2m-2 10h2m-2 9h2"/>',eye:'<path d="M2 16s5-9 14-9 14 9 14 9-5 9-14 9S2 16 2 16Z"/><circle cx="16" cy="16" r="4"/>',shield:'<path d="M16 2 28 7v8c0 8-12 15-12 15S4 23 4 15V7Z"/><path d="m10 16 4 4 8-9"/>'};
    return `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">${paths[name] || paths.pc}</svg>`;
  };
  const cases = [
    {
      id:'listen',short:'Escuchar mensajes',title:'¿Puede leer el mensaje alguien más?',color:'blue',
      lead:'Tu ordenador envía un mensaje al servidor. Alguien que observa la comunicación intenta leerlo.',
      question:'¿Qué cambia al proteger el mensaje con HTTPS?',
      answers:['El mensaje deja de viajar por la red.','El observador ya no puede leer el contenido del mensaje.','El servidor tampoco puede leer el mensaje.'],correct:1,
      explain:'El mensaje sigue llegando al servidor, pero su contenido viaja cifrado. El observador puede ver que hay tráfico, aunque no pueda leer ese mensaje.',
      stages:[
        {action:'Tu ordenador envía el mensaje.',effect:'El servidor lo recibe y lo lee.'},
        {action:'El atacante escucha la comunicación y copia el mensaje.',effect:'Puede leerlo porque viaja sin cifrar. El mensaje también llega al servidor.'},
        {action:'La conexión usa HTTPS para cifrar el contenido.',effect:'El servidor puede leerlo; el observador de la red no.'}
      ],
      detail:'Escuchar tráfico se llama captura o sniffing. No toda captura es un ataque: también se usa para diagnosticar redes. Aquí el problema es leer sin permiso un mensaje que viaja sin cifrar. HTTPS utiliza TLS para proteger el contenido en tránsito; no oculta todo, por ejemplo las direcciones IP siguen siendo visibles.',
      source:'https://www.rfc-editor.org/rfc/rfc8446.html',sourceLabel:'TLS y protección del contenido'
    },
    {
      id:'impersonate',short:'Hacerse pasar por otro',title:'¿Y si entrego el mensaje al impostor?',color:'violet',
      lead:'Para salir de su red, tu ordenador entrega el mensaje al router. Un atacante intenta ocupar ese lugar.',
      question:'¿Qué pretende conseguir el atacante al hacerse pasar por el router?',
      answers:['Que mi ordenador le entregue los mensajes creyendo que es el router.','Que el servidor funcione más rápido.','Que el mensaje se cifre automáticamente.'],correct:0,
      explain:'El atacante engaña al ordenador para recibir mensajes que debían ir al router. Comprobar qué equipo es el router ayuda a evitar ese desvío.',
      stages:[
        {action:'Tu ordenador entrega el mensaje al router verdadero.',effect:'El router lo encamina hacia el servidor.'},
        {action:'El atacante anuncia: «Yo soy tu router».',effect:'Si el ordenador se lo cree, entrega el mensaje al impostor.'},
        {action:'La red comprueba quién es el router y rechaza el anuncio falso.',effect:'El mensaje vuelve a ir al equipo correcto.'}
      ],
      detail:'Este caso representa una suplantación ARP en una red local. El atacante intenta asociar su propia dirección MAC con la IP del router. Algunas redes pueden validar esas asociaciones para rechazar anuncios falsos. Aquí no cambiamos el servidor de destino: engañamos al ordenador sobre el siguiente equipo al que debe entregar el mensaje.',
      source:'https://www.rfc-editor.org/rfc/rfc826.html',sourceLabel:'ARP: encontrar el siguiente equipo'
    },
    {
      id:'overload',short:'Saturar un servidor',title:'¿Y si llegan demasiadas peticiones?',color:'teal',
      lead:'Un servidor tiene una capacidad limitada. Un atacante intenta ocuparla con una avalancha de peticiones.',
      question:'¿Qué consecuencia busca el atacante al saturar el servidor?',
      answers:['Que todos los mensajes se vuelvan secretos.','Que el servidor tenga más tiempo libre.','Que tarde en responder o deje de atender a los usuarios.'],correct:2,
      explain:'Demasiado trabajo puede dejar al servidor sin capacidad para atender a los usuarios. Limitar el tráfico abusivo puede ayudar a mantener el servicio.',
      stages:[
        {action:'Llegan unas pocas peticiones de los usuarios.',effect:'El servidor tiene capacidad y responde.'},
        {action:'El atacante envía muchas peticiones seguidas.',effect:'El servidor se sobrecarga: la petición del alumno se queda esperando.'},
        {action:'Un filtro limita las peticiones abusivas.',effect:'En este ejemplo, el servidor vuelve a poder atender al alumno.'}
      ],
      detail:'Se trata de una denegación de servicio: impedir que otros puedan usar un servicio. Puede afectar a la red, al transporte o a la aplicación. Las medidas dependen de lo que se esté saturando. Limitar peticiones es una defensa posible, pero no garantiza resolver todos los ataques.',
      source:'https://www.rfc-editor.org/rfc/rfc4732.html',sourceLabel:'Denegación de servicio'
    }
  ];
  const node = (label,sub,type,cls='') => `<div class="security-node ${cls}">${icon(type)}<strong>${label}</strong><span>${sub}</span></div>`;
  const connection = (label,cls='') => `<div class="security-wire ${cls}"><span>${label}</span><i><b class="security-moving-message" aria-hidden="true"></b></i></div>`;
  window.LabModules.security = {
    render() { return `<div class="security-lab security-simple"><div class="security-intro"><span class="chip">TRES ATAQUES, PASO A PASO</span><p>Observa qué hace el atacante, qué consigue y cómo podemos proteger la comunicación.</p></div><div class="security-tabs" role="group" aria-label="Elige un caso de seguridad"></div><div class="security-case"></div></div>`; },
    mount(root,api) {
      const previous=api.load('security-state',{});
      const previousCaseValid=cases.some(c=>c.id===previous.caseId);
      let state={caseId:previousCaseValid?previous.caseId:'listen',stage:previousCaseValid&&[0,1,2].includes(previous.stage)?previous.stage:0};
      const answered=api.load('security-answers',{})||{};
      const host=root.querySelector('.security-case'),tabs=root.querySelector('.security-tabs');
      const save=()=>api.save('security-state',state);
      function drawNetwork(c) {
        const attack=state.stage===1,protectedNow=state.stage===2;
        if(c.id==='listen') {
          return `<div class="security-flow">${node('Tu ordenador','Envía el mensaje','pc')}${connection(protectedNow?'Contenido cifrado':'Mensaje sin cifrar',protectedNow?'safe':'active')}${node('Servidor','Recibe el mensaje','server')}</div><div class="security-original-message"><span>El mensaje que enviamos</span><strong>«Quedamos a las 17:00»</strong></div><div class="security-observer ${attack?'attack':protectedNow?'protected':''}"><div>${icon('eye')}<strong>${state.stage===0?'¿Y si alguien escucha?':'El observador de la red'}</strong></div><p>${state.stage===0?'Pulsa «Ver ataque» para descubrirlo.':attack?'Puede leer: «Quedamos a las 17:00»':'Ve contenido cifrado: ▪ ▪ ▪ ▪ ▪ ▪ ▪ ▪'}</p><span>${state.stage===0?'El mensaje está viajando en claro.':attack?'Ha copiado el mensaje. No necesita detenerlo.':'No puede leer este mensaje, aunque ve que hay tráfico.'}</span></div>`;
        }
        if(c.id==='impersonate') {
          return `<div class="security-flow three">${node('Tu ordenador','¿A quién lo entrego?','pc')}${connection(attack?'Se cree el engaño':'Equipo correcto',attack?'bad':'active')}${node(attack?'El impostor':'Router verdadero',attack?'«Yo soy tu router»':protectedNow?'Identidad comprobada':'Sale hacia otra red',attack?'eye':protectedNow?'shield':'router',attack?'danger':protectedNow?'safe':'')}${connection(attack?'Puede reenviarlo':'Lo encamina',attack?'bad':'active')}${node('Servidor','Destino del mensaje','server')}</div><div class="security-delivery ${attack?'attack':protectedNow?'protected':''}"><span>¿Quién recibe primero tu mensaje?</span><strong>${attack?'El impostor': 'El router verdadero'}</strong><p>${attack?'El ordenador quería entregarlo al router, pero ha aceptado una indicación falsa.':protectedNow?'El anuncio del impostor se rechaza. El mensaje sigue el camino correcto.':'El ordenador reconoce al equipo al que debe entregar los mensajes para salir de su red.'}</p></div>`;
        }
        const amount=attack?18:protectedNow?3:2;
        return `<div class="security-flow">${node('Alumno','Pide una página','pc')}${connection(attack?'Su petición espera':'Envía una petición',attack?'bad':'active')}${node('Servidor',attack?'Está sobrecargado':'Puede atenderte','server',attack?'danger':protectedNow?'safe':'')}</div><div class="security-request-scene ${attack?'attack':protectedNow?'protected':''}"><div class="security-request-origin">${icon(attack?'eye':protectedNow?'shield':'pc')}<strong>${attack?'El atacante envía muchas peticiones':protectedNow?'El filtro limita las peticiones abusivas':'Llegan unas pocas peticiones'}</strong></div><div class="security-request-cloud" aria-label="${attack?'Muchas peticiones de golpe':protectedNow?'Se limita el tráfico que llega al servidor':'Pocas peticiones'}">${Array.from({length:amount},(_,i)=>`<span class="security-request" style="--request-delay:${i%6*110}ms" aria-hidden="true">Petición</span>`).join('')}</div><div class="security-load"><span>Trabajo del servidor</span><div><i style="width:${attack?100:protectedNow?35:22}%"></i></div><strong>${attack?'Sin capacidad libre':'Tiene capacidad libre'}</strong></div></div>`;
      }
      function render(focusSelector) {
        const c=cases.find(c=>c.id===state.caseId),stage=c.stages[state.stage];
        tabs.innerHTML=cases.map((item,i)=>`<button type="button" class="security-tab ${item.id===c.id?'active':''}" aria-pressed="${item.id===c.id}" data-security-case="${item.id}"><span>CASO ${i+1}</span><strong>${item.short}</strong>${answered[item.id]?.correct?'<b aria-label="Actividad resuelta">✓</b>':''}</button>`).join('');
        host.innerHTML=`<section class="panel security-simulation ${c.color}" aria-label="${c.short}"><div class="security-case-heading"><div><span class="eyebrow">CASO ${cases.indexOf(c)+1} DE 3</span><h2>${c.title}</h2><p>${c.lead}</p></div><span class="security-phase">${['Comunicación normal','Durante el ataque','Con protección'][state.stage]}</span></div><div class="security-stage-buttons" role="group" aria-label="Compara la comunicación"><button type="button" class="btn ${state.stage===0?'primary':''}" aria-pressed="${state.stage===0}" data-security-stage="0">Ver comunicación normal</button><button type="button" class="btn ${state.stage===1?'primary':''}" aria-pressed="${state.stage===1}" data-security-stage="1">Ver ataque</button><button type="button" class="btn ${state.stage===2?'primary':''}" aria-pressed="${state.stage===2}" data-security-stage="2">Proteger</button></div><div class="security-scene" aria-live="polite">${drawNetwork(c)}<div class="security-explanation"><div><span>QUÉ HACE</span><p>${stage.action}</p></div><div><span>QUÉ OCURRE</span><p>${stage.effect}</p></div></div></div></section><section class="panel security-question"><span class="eyebrow">COMPRUEBA SI LO HAS ENTENDIDO</span><h3>${c.question}</h3><div class="security-options">${c.answers.map((answer,i)=>`<button type="button" class="security-option ${answered[c.id]?.index===i?(answered[c.id].correct?'selected-correct':'selected-wrong'):''}" data-security-answer="${i}"><span>${String.fromCharCode(65+i)}</span>${answer}</button>`).join('')}</div><div class="security-feedback" aria-live="polite">${answered[c.id]?`<p class="feedback ${answered[c.id].correct?'ok':'bad'}"><strong>${answered[c.id].correct?'Correcto.':'Vuelve a observar el caso.'}</strong> ${c.explain}</p>`:''}</div><details class="security-detail"><summary>Para saber un poco más</summary><p>${c.detail}</p><a href="${c.source}" target="_blank" rel="noopener noreferrer" class="security-source">Fuente: ${c.sourceLabel} ↗</a></details></section><p class="security-simulation-note">Simulaciones para aprender: no se envía tráfico ni se ataca ningún equipo real.</p>`;
        if(focusSelector){const control=root.querySelector(focusSelector);if(control)control.focus({preventScroll:true});}
      }
      function onClick(event) {
        const target=event.target.closest('button');if(!target||!root.contains(target))return;
        if(target.hasAttribute('data-security-case')) {state={caseId:target.dataset.securityCase,stage:0};save();render(`[data-security-case="${state.caseId}"]`);}
        if(target.hasAttribute('data-security-stage')) {state.stage=Number(target.dataset.securityStage);save();render(`[data-security-stage="${state.stage}"]`);}
        if(target.hasAttribute('data-security-answer')) {
          const c=cases.find(c=>c.id===state.caseId),index=Number(target.dataset.securityAnswer),correct=index===c.correct;
          answered[c.id]={index,correct};api.save('security-answers',answered);
          api.record('security-'+c.id,{question:c.question,answer:c.answers[index],correct,feedback:c.explain});
          if(cases.every(item=>answered[item.id]?.correct))api.markComplete('security','Tres ataques comprendidos','Explica cómo escuchar, suplantar y saturar afectan a una comunicación.');
          render(`[data-security-answer="${index}"]`);
        }
      }
      root.addEventListener('click',onClick);render();
      return ()=>root.removeEventListener('click',onClick);
    }
  };

  const pingScenarios = {success:{label:'La red funciona',desc:'Cuatro respuestas Echo Reply. Observa el recorrido de ida y vuelta.'},loss:{label:'Pérdida de un paquete',desc:'La tercera solicitud se pierde en la simulación. Las otras tres reciben respuesta.'},filtered:{label:'Echo filtrado',desc:'El destino existe, pero una regla descarta las solicitudes Echo sin responder.'},unreachable:{label:'Sin ruta al destino',desc:'R2 no tiene ruta hacia la red de destino y devuelve un error ICMP.'}};
  const pingRtts = [12,16,14,18];
  const pingTypes = [
    {type:8,title:'Echo Request',text:'La petición de eco que envía ping.',tone:'request'},
    {type:0,title:'Echo Reply',text:'El destino responde a la petición de eco.',tone:'reply'},
    {type:3,title:'Destination Unreachable',text:'No se puede entregar el datagrama; el código concreta la causa.',tone:'error'},
    {type:11,title:'Time Exceeded',text:'El TTL se agota durante el recorrido (código 0).',tone:'error'}
  ];
  window.LabModules.icmp = {
    render() { return `<div class="icmp-lab"><div class="icmp-intro"><p><strong>ICMP informa de errores y ayuda a diagnosticar la red.</strong> Se transporta directamente sobre IP. No utiliza puertos TCP ni UDP y no realiza el control de flujo de TCP.</p><span class="chip">SIMULACIÓN LOCAL · SIN TRÁFICO REAL</span></div><div class="icmp-types">${pingTypes.map(item=>`<button type="button" class="icmp-type ${item.tone}" data-icmp-type="${item.type}" aria-label="Explorar ICMP tipo ${item.type}: ${item.title}"><span>TIPO ${item.type}</span><strong>${item.title}</strong><small>${item.text}</small></button>`).join('')}</div><div class="icmp-type-detail" aria-live="polite"></div><section class="panel icmp-controls"><div class="icmp-control-fields"><label>Destino simulado<select data-icmp="destination"><option value="203.0.113.20">Servidor del aula · 203.0.113.20</option><option value="203.0.113.30">Servidor de prácticas · 203.0.113.30</option></select></label><label>Escenario<select data-icmp="scenario">${Object.entries(pingScenarios).map(([id,item])=>`<option value="${id}">${item.label}</option>`).join('')}</select></label><label>TTL inicial de la solicitud<input data-icmp="ttl" type="number" min="1" max="64" step="1" value="64"></label></div><p class="icmp-scenario-description"></p><div class="toolbar icmp-toolbar"><button class="btn primary" data-icmp-action="play">Ejecutar ping</button><button class="btn" data-icmp-action="step">Siguiente evento</button><button class="btn" data-icmp-action="reset">Reiniciar</button><span class="icmp-counter">0 / 4 solicitudes</span></div></section><section class="panel icmp-route-panel"><div class="icmp-route"></div><div class="icmp-event" aria-live="polite"></div><div class="icmp-pdu" aria-label="Estructura del mensaje observado"><span>Ethernet</span><span>IPv4 · protocolo 1</span><span class="icmp-message-type">ICMP · Echo Request</span><span>Datos de prueba: 32 B</span></div></section><div class="icmp-output-grid"><section class="icmp-terminal" aria-label="Terminal de ping simulado"><div class="icmp-terminal-bar"><span></span><span></span><span></span><strong>PING · CAPTURA DIDÁCTICA</strong></div><pre class="icmp-terminal-text" aria-live="polite"></pre></section><section class="panel icmp-stats" aria-label="Resultados del ping"></section></div><p class="icmp-stat-note">Salida inspirada en ping de Windows. Aquí «recibidos» cuenta solo respuestas Echo Reply; los errores ICMP se muestran aparte. Direcciones, tiempos y pérdidas son ficticios.</p><section class="panel icmp-interpretation"></section><details class="panel icmp-real"><summary>Puente a la práctica: compara con un ping real</summary><p>Cuando el profesor lo indique, realiza un ping a dos equipos de la práctica autorizada, conserva las capturas y compara bytes, tiempo, TTL y pérdidas. Esta web no ejecuta comandos en tu ordenador.</p><label>Mi interpretación<textarea data-icmp="reflection" rows="3" placeholder="¿Qué puedo afirmar con mi captura? ¿Qué no puedo concluir?"></textarea></label><button class="btn" data-icmp-action="reflection">Guardar interpretación</button><p class="icmp-reflection-saved" aria-live="polite"></p></details><p class="icmp-sources"><a href="https://www.rfc-editor.org/rfc/rfc792.html" target="_blank" rel="noopener noreferrer">RFC 792 · ICMP ↗</a><a href="https://www.rfc-editor.org/rfc/rfc6633.html" target="_blank" rel="noopener noreferrer">RFC 6633 · Source Quench retirado ↗</a></p></div>`; },
    mount(root,api) {
      const saved=api.load('icmp-settings',{destination:'203.0.113.20',scenario:'success',ttl:64});
      let settings={destination:['203.0.113.20','203.0.113.30'].includes(saved.destination)?saved.destination:'203.0.113.20',scenario:pingScenarios[saved.scenario]?saved.scenario:'success',ttl:Math.max(1,Math.min(64,Number(saved.ttl)||64))};
      let packet=0,phase=-1,results=[],timer=null,running=false,lastEvent='Prepara una predicción: con dos routers, ¿llegará una solicitud con TTL 2?',lastNode=-1,lastLink=-1,reverse=false,type=8;
      let answer=null;
      const qs=s=>root.querySelector(s);
      qs('[data-icmp="destination"]').value=settings.destination;qs('[data-icmp="scenario"]').value=settings.scenario;qs('[data-icmp="ttl"]').value=settings.ttl;
      qs('[data-icmp="reflection"]').value=api.load('icmp-reflection','');
      function stop(){if(timer)clearInterval(timer);timer=null;running=false;qs('[data-icmp-action="play"]').textContent=results.length===4?'Volver a ejecutar':'Ejecutar ping';}
      function outcome(n) {
        if(settings.ttl<=2)return {kind:'ttl',router:settings.ttl,ip:settings.ttl===1?'192.0.2.1':'198.51.100.2',type:11,code:0};
        if(settings.scenario==='unreachable')return {kind:'unreachable',ip:'198.51.100.2',type:3,code:0};
        if(settings.scenario==='filtered'||(settings.scenario==='loss'&&n===2))return {kind:'timeout',type:null};
        return {kind:'reply',ip:settings.destination,type:0,rtt:pingRtts[n]+(settings.destination.endsWith('.30')?5:0),replyTTL:62};
      }
      function metrics(){const replies=results.filter(r=>r.kind==='reply'),sent=results.length;return {sent,received:replies.length,lost:sent-replies.length,loss:sent?Math.round((sent-replies.length)/sent*100):0,min:replies.length?Math.min(...replies.map(r=>r.rtt)):null,max:replies.length?Math.max(...replies.map(r=>r.rtt)):null,avg:replies.length?replies.reduce((sum,r)=>sum+r.rtt,0)/replies.length:null};}
      function line(r){if(r.kind==='reply')return `Respuesta desde ${r.ip}: bytes=32 tiempo=${r.rtt}ms TTL=${r.replyTTL}`;if(r.kind==='ttl')return `Respuesta desde ${r.ip}: TTL agotado en tránsito. [ICMP 11/0]`;if(r.kind==='unreachable')return `Respuesta desde ${r.ip}: Red de destino inaccesible. [ICMP 3/0]`;return 'Tiempo de espera agotado para esta solicitud.';}
      function drawRoute(){
        const labels=[['Mi PC','192.0.2.10','pc'],['Router 1','192.0.2.1','router'],['Router 2','198.51.100.2','router'],['Servidor',settings.destination,'server']];
        qs('.icmp-route').innerHTML=labels.map((item,i)=>`${i?`<div class="icmp-link ${lastLink===i-1?'active':''} ${reverse?'reverse':''}"><span>${reverse?'←':'→'}</span></div>`:''}<div class="icmp-node ${lastNode===i?'active':''} ${lastNode===i&&(type===3||type===11)?'icmp-error-node':''}">${icon(item[2])}<strong>${item[0]}</strong><span>${item[1]}</span><small>${i===0?'Origen':i===3?'Responde con su propio TTL':`TTL de ida: ${Math.max(0,settings.ttl-i)}`}</small></div>`).join('');
      }
      function questionHtml(){
        const complete=results.length===4,m=metrics();
        return `<span class="eyebrow">LEE LA EVIDENCIA</span><h3>¿Qué nos dice este ping?</h3><p>Ejecuta las cuatro solicitudes y calcula la pérdida. Después interpreta lo observado.</p><div class="icmp-question-grid"><label>Porcentaje de solicitudes sin Echo Reply<input type="number" data-icmp="loss-answer" min="0" max="100" step="1" placeholder="0–100" ${!complete?'disabled':''}></label><label>Conclusión<select data-icmp="conclusion" ${!complete?'disabled':''}><option value="">Elige una interpretación</option><option value="reachable">Hubo respuesta ICMP; eso no garantiza que funcione un servicio web.</option><option value="ttl">El TTL se agotó antes de llegar al destino.</option><option value="route">Un router informó que no tenía ruta hacia la red de destino.</option><option value="unknown">No recibimos eco; por sí solo no demuestra que el equipo esté apagado.</option><option value="all">Si ping falla, Internet entero está caído.</option></select></label></div><button class="btn primary" data-icmp-action="check" ${!complete?'disabled':''}>Comprobar interpretación</button><div class="icmp-answer-feedback" aria-live="polite">${answer?`<p class="feedback ${answer.correct?'ok':'bad'}">${answer.text}</p>`:!complete?'<p class="icmp-small">La actividad se activa al completar cuatro solicitudes.</p>':''}</div><details class="icmp-detail"><summary>¿Qué significa el TTL que aparece en una respuesta?</summary><p>Es el TTL restante del paquete IP que trae el Echo Reply. No es el TTL inicial que escribiste para la solicitud. En esta simulación el servidor inicia sus respuestas con 64; tras los dos routers de vuelta llega con 62. El RTT mide ida y vuelta y los bytes=32 corresponden a datos de prueba, no al tamaño total de la trama.</p></details>${complete?`<p class="icmp-small">Resultado de esta ejecución: ${m.sent} solicitudes completadas.</p>`:''}`;
      }
      function draw() {
        qs('.icmp-scenario-description').textContent=pingScenarios[settings.scenario].desc;
        drawRoute();qs('.icmp-event').innerHTML=`<span class="icmp-event-badge">${results.length===4?'FINALIZADO':phase<0?(results.length?`SOLICITUD ${results.length} · FINAL`:'PREDICE'):`SOLICITUD ${packet+1}`}</span><p>${lastEvent}</p>`;
        qs('.icmp-pdu').innerHTML=type===null?'<span class="icmp-no-response">Sin respuesta recibida</span>':`<span>Ethernet</span><span>IPv4 · protocolo 1</span><span class="icmp-message-type">ICMP · ${type===8?'Echo Request (8)':type===0?'Echo Reply (0)':type===11?'Time Exceeded (11)':'Destination Unreachable (3)'}</span><span class="icmp-payload">${type===3||type===11?'Cabecera IPv4 original + primeros 8 B de su carga (mínimo RFC 792)':'Datos de prueba: 32 B'}</span>`;
        qs('.icmp-counter').textContent=`${results.length} / 4 solicitudes completadas`;
        const m=metrics();
        let text=`C:\\Aula> ping -n 4 -i ${settings.ttl} ${settings.destination}\n\nHaciendo ping a ${settings.destination} con 32 bytes de datos:\n\n${results.map(line).join('\n')}`;
        if(results.length===4)text+=`\n\nEstadísticas de eco: enviados = 4, recibidos = ${m.received},\nsin Echo Reply = ${m.lost} (${m.loss}% pérdida de eco).${m.received?`\nRTT: mínimo = ${m.min}ms, máximo = ${m.max}ms,\nmedia = ${Number(m.avg.toFixed(1))}ms.`:'\nRTT: no hay respuestas Echo Reply para calcularlo.'}`;
        qs('.icmp-terminal-text').textContent=text;
        qs('.icmp-stats').innerHTML=`<span class="eyebrow">EVIDENCIAS DE LA PRUEBA</span><div class="icmp-stat-row"><div><strong>${m.sent}</strong><span>Enviados*</span></div><div><strong>${m.received}</strong><span>Echo Reply</span></div></div><div class="icmp-loss-track"><i style="width:${m.loss}%"></i></div><div class="icmp-stat-line"><span>Sin respuesta de eco</span><strong>${m.sent?m.loss+'%':'—'}</strong></div><div class="icmp-stat-line"><span>RTT medio</span><strong>${m.avg!==null?Number(m.avg.toFixed(1))+' ms':'—'}</strong></div><div class="icmp-stat-line"><span>RTT mínimo / máximo</span><strong>${m.min!==null?m.min+' / '+m.max+' ms':'—'}</strong></div><p class="icmp-small">*Se contabilizan al cerrar cada intento. Los errores ICMP no son Echo Reply.</p>`;
        qs('[data-icmp-action="step"]').disabled=results.length===4||running;
        root.querySelectorAll('.icmp-control-fields select,.icmp-control-fields input').forEach(el=>el.disabled=running);
        qs('.icmp-interpretation').innerHTML=questionHtml();
      }
      function finish(result) {
        results.push(result);lastNode=0;reverse=result.kind!=='timeout';type=result.type;
        if(result.kind==='reply')lastEvent=`El PC recibe Echo Reply tras el recorrido servidor → R2 → R1 → PC. Han pasado ${result.rtt} ms de ida y vuelta; la respuesta llega con TTL 62.`;
        if(result.kind==='ttl')lastEvent=`El PC recibe el error ICMP 11/0 desde R${result.router}. Ha vuelto por ${result.router===1?'R1 → PC':'R2 → R1 → PC'}. La petición se detuvo antes del servidor porque agotó su TTL.`;
        if(result.kind==='unreachable')lastEvent='El PC recibe el error ICMP 3/0 tras recorrer R2 → R1 → PC. R2 no tenía ruta hacia el destino. El servidor no ha recibido la petición.';
        if(result.kind==='timeout')lastEvent='Se agota el tiempo de espera sin Echo Reply. Desde esta salida no podríamos distinguir por sí solos un filtrado, una pérdida u otra causa.';
        if(results.length===4){stop();api.save('icmp-last-result',{settings:Object.assign({},settings),metrics:metrics(),results});}
        else{packet++;phase=-1;}
      }
      function packetTimeline(result) {
        const events=[{node:0,link:-1,type:8,back:false,text:`El PC envía una petición de eco: Echo Request. Su TTL inicial es ${settings.ttl}.`}];
        if(result.kind==='ttl'&&result.router===1) {
          events.push(
            {node:1,link:0,type:11,back:false,text:'R1 recibe la petición. El TTL pasa de 1 a 0: la petición se detiene aquí y R1 crea un mensaje de error.'},
            {node:0,link:0,type:11,back:true,text:'El error vuelve directamente de R1 al PC. No ha pasado por R2 ni por el servidor.'}
          );
          return events;
        }
        events.push({node:1,link:0,type:8,back:false,text:`La petición llega a R1. El router reduce el TTL de ${settings.ttl} a ${settings.ttl-1} y la envía a R2.`});
        if(result.kind==='ttl'||result.kind==='unreachable') {
          events.push(
            {node:2,link:1,type:result.type,back:false,text:result.kind==='ttl'?'La petición llega a R2. El TTL pasa de 1 a 0: R2 la detiene y crea un mensaje de error.':'La petición llega a R2, pero ese router no tiene una ruta hacia el destino. R2 crea un mensaje de error.'},
            {node:1,link:1,type:result.type,back:true,text:'El nuevo mensaje de error vuelve de R2 a R1. R1 lo reenvía hacia el PC.'},
            {node:0,link:0,type:result.type,back:true,text:'El PC recibe el error que ha viajado R2 → R1 → PC. La petición no llegó al servidor.'}
          );
          return events;
        }
        events.push({node:2,link:1,type:8,back:false,text:`La petición llega a R2. El router reduce el TTL de ${settings.ttl-1} a ${settings.ttl-2} y la envía hacia el servidor.`});
        if(result.kind==='timeout') {
          events.push(
            settings.scenario==='filtered'
              ?{node:3,link:2,type:null,back:false,text:'La petición alcanza el destino, pero una regla la descarta sin responder. Sabemos la causa porque controlamos esta simulación.'}
              :{node:-1,link:2,type:null,back:false,text:'Esta petición se pierde en el enlace entre R2 y el servidor. No llega al servidor, así que no se crea una respuesta.'},
            {node:0,link:-1,type:null,back:false,text:'El PC espera hasta que se agota el tiempo. No está regresando ningún paquete de respuesta.'}
          );
          return events;
        }
        events.push(
          {node:3,link:2,type:0,back:false,text:'El servidor recibe la petición y crea la respuesta: Echo Reply. Es otro paquete y empieza con su propio TTL: 64.'},
          {node:2,link:2,type:0,back:true,text:'La respuesta sale del servidor y llega a R2. R2 reduce su TTL de 64 a 63 y la envía hacia R1.'},
          {node:1,link:1,type:0,back:true,text:'La respuesta llega ahora a R1. R1 reduce su TTL de 63 a 62 y la envía hacia el PC.'},
          {node:0,link:0,type:0,back:true,text:'El PC recibe la respuesta. Ha vuelto por el camino servidor → R2 → R1 → PC y llega con TTL 62.'}
        );
        return events;
      }
      function step() {
        if(results.length===4)return;
        const result=outcome(packet),events=packetTimeline(result);
        phase++;
        const event=events[Math.min(phase,events.length-1)];
        lastNode=event.node;lastLink=event.link;reverse=event.back;type=event.type;lastEvent=event.text;
        if(phase===events.length-1)finish(result);
        draw();
      }
      function reset(keepMessage) {
        stop();packet=0;phase=-1;results=[];lastNode=-1;lastLink=-1;reverse=false;type=8;answer=null;
        if(!keepMessage)lastEvent='Prepara una predicción: con dos routers, ¿llegará una solicitud con TTL 2?';
        draw();
      }
      function syncSettingsFromControls() {
        const destination=qs('[data-icmp="destination"]').value;
        const scenario=qs('[data-icmp="scenario"]').value;
        const ttl=Math.max(1,Math.min(64,Math.floor(Number(qs('[data-icmp="ttl"]').value)||64)));
        qs('[data-icmp="ttl"]').value=ttl;
        if(destination!==settings.destination||scenario!==settings.scenario||ttl!==settings.ttl) {
          settings={destination,scenario,ttl};
          api.save('icmp-settings',settings);
          reset();
        }
      }
      const onChange=event=>{const key=event.target.dataset.icmp;if(!['destination','scenario','ttl'].includes(key))return;settings.destination=qs('[data-icmp="destination"]').value;settings.scenario=qs('[data-icmp="scenario"]').value;settings.ttl=Math.max(1,Math.min(64,Math.floor(Number(qs('[data-icmp="ttl"]').value)||64)));qs('[data-icmp="ttl"]').value=settings.ttl;api.save('icmp-settings',settings);reset();};
      const onClick=event=>{
        const button=event.target.closest('button');if(!button||!root.contains(button))return;
        if(button.hasAttribute('data-icmp-type')){const chosen=pingTypes.find(t=>t.type===Number(button.dataset.icmpType));qs('.icmp-type-detail').innerHTML=`<p class="feedback"><strong>Tipo ${chosen.type} · ${chosen.title}.</strong> ${chosen.text} ${chosen.type===3?'En el caso de esta web, código 0 significa red inaccesible.':chosen.type===11?'El router envía el error al origen; no devuelve el mismo paquete transformado.':'Echo Request y Echo Reply usan identificador y número de secuencia para relacionar la petición con su respuesta.'}</p>`;}
        const action=button.dataset.icmpAction;
        if(action==='reset')reset();
        if(action==='step'){syncSettingsFromControls();step();}
        if(action==='play'){
          if(running){stop();draw();return;}
          syncSettingsFromControls();
          if(results.length===4)reset();running=true;qs('[data-icmp-action="play"]').textContent='Pausar';step();if(running)timer=setInterval(step,850);draw();
        }
        if(action==='check'){
          const lossInput=qs('[data-icmp="loss-answer"]'),conclusion=qs('[data-icmp="conclusion"]').value;
          if(lossInput.value===''||conclusion===''){qs('.icmp-answer-feedback').innerHTML='<p class="feedback bad">Completa el porcentaje y elige una conclusión antes de comprobar.</p>';return;}
          const m=metrics(),expected=settings.ttl<=2?'ttl':settings.scenario==='unreachable'?'route':m.received?'reachable':'unknown',correct=Number(lossInput.value)===m.loss&&conclusion===expected;
          answer={correct,text:correct?`Correcto: ${m.lost} de 4 solicitudes sin Echo Reply = ${m.loss}%. ${expected==='reachable'?'Una respuesta de eco confirma esa comunicación ICMP en ese momento; no prueba que HTTP funcione.':expected==='ttl'?'El TTL ha limitado el recorrido antes del destino.':expected==='route'?'El error recibido apunta a una ausencia de ruta en R2.':'La ausencia de eco no demuestra por sí sola que el equipo esté apagado.'}`:`Revisa la evidencia: ${m.lost} de 4 solicitudes no recibieron Echo Reply (${m.loss}%). ${expected==='ttl'?'Aparece ICMP 11/0: TTL agotado.':expected==='route'?'Aparece ICMP 3/0: red inaccesible.':expected==='reachable'?'Se ha recibido eco, pero eso no comprueba el servicio web.':'No hay respuesta; un silencio admite varias causas.'}`};
          api.record('icmp-interpretation',{question:'Interpreta el ping y calcula la pérdida de eco.',answer:`Pérdida: ${lossInput.value}%; conclusión: ${qs('[data-icmp="conclusion"]').selectedOptions[0].textContent}`,correct,feedback:answer.text,scenario:settings.scenario,ttl:settings.ttl});
          if(correct)api.markComplete('icmp','Ping interpretado',answer.text);
          qs('.icmp-answer-feedback').innerHTML=`<p class="feedback ${correct?'ok':'bad'}">${answer.text}</p>`;
        }
        if(action==='reflection'){const text=qs('[data-icmp="reflection"]').value.trim();api.save('icmp-reflection',text);api.record('icmp-reflection',{question:'Compara e interpreta las capturas de ping de la práctica.',answer:text,correct:null});qs('.icmp-reflection-saved').textContent=text?'Interpretación guardada en este navegador.':'Escribe tu interpretación antes de guardarla.';}
      };
      root.addEventListener('change',onChange);root.addEventListener('click',onClick);draw();
      return ()=>{stop();root.removeEventListener('change',onChange);root.removeEventListener('click',onClick);};
    }
  };
})();

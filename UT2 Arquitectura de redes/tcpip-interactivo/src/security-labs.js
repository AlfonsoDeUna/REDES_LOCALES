(function () {
  'use strict';
  window.LabModules = window.LabModules || {};
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon = name => {
    const paths = {pc:'<rect x="4" y="3" width="24" height="17" rx="2"/><path d="M16 20v6m-7 0h14"/>',router:'<rect x="3" y="9" width="26" height="17" rx="4"/><path d="M8 9V3m16 6V3M9 17h14m-4-4 4 4-4 4"/>',server:'<rect x="7" y="2" width="18" height="28" rx="3"/><path d="M7 11h18M7 21h18M11 7h2m-2 10h2m-2 9h2"/>',eye:'<path d="M2 16s5-9 14-9 14 9 14 9-5 9-14 9S2 16 2 16Z"/><circle cx="16" cy="16" r="4"/>',shield:'<path d="M16 2 28 7v8c0 8-12 15-12 15S4 23 4 15V7Z"/><path d="m10 16 4 4 8-9"/>'};
    return `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">${paths[name] || paths.pc}</svg>`;
  };
  const cases = [
    {id:'access',layer:'Acceso a la red',title:'¿Y si la puerta de enlace fuera otra?',short:'ARP falsificado',color:'violet',lead:'Un equipo acepta una asociación IP–MAC que no corresponde a su puerta de enlace.',question:'La IP de la puerta de enlace no cambia. ¿Por qué las tramas llegan al equipo intruso?',answers:['Porque cambia la asociación entre la IP de la puerta de enlace y su MAC.','Porque TCP cambia el puerto de destino por sí solo.','Porque ARP cifra el contenido de la trama.'],correct:0,explain:'ARP relaciona una dirección IPv4 del enlace local con una MAC. Una asociación falsa puede desviar las tramas. ARP no se transporta dentro de TCP ni de IPv4.',defense:'Validar las asociaciones ARP',source:'https://www.rfc-editor.org/rfc/rfc826.html',sourceLabel:'RFC 826 · ARP'},
    {id:'internet',layer:'Internet',title:'¿Una IP de origen demuestra quién envía?',short:'IP de origen falsa',color:'amber',lead:'El paquete declara un remitente distinto. Observa dónde iría una respuesta.',question:'Si se suplanta una IP de origen ajena, ¿qué ocurre normalmente con la respuesta?',answers:['Siempre regresa al equipo que falsificó la cabecera.','Se encamina hacia la IP declarada, que puede ser de otro equipo.','La IP de destino se convierte automáticamente en la IP real.'],correct:1,explain:'Los routers encaminan la respuesta hacia la dirección declarada como origen. Falsificar ese campo no da automáticamente acceso a las respuestas ni completa una conexión TCP.',defense:'Activar filtro de origen',source:'https://www.rfc-editor.org/rfc/rfc2827.html',sourceLabel:'RFC 2827 · Filtrado de origen'},
    {id:'transport',layer:'Transporte',title:'¿Qué pasa si nadie termina de conectar?',short:'Cola de conexiones',color:'teal',lead:'El servidor reserva recursos mientras espera el último ACK. Nuestra cola didáctica tiene seis plazas.',question:'¿Qué recurso pretende agotar un SYN flood clásico?',answers:['La tabla de nombres DNS del navegador.','El número de direcciones MAC del cliente.','El estado reservado para conexiones TCP que aún no se han completado.'],correct:2,explain:'Las solicitudes que quedan a medias pueden ocupar el estado disponible. Las SYN cookies permiten posponer la reserva hasta validar el ACK. No solucionan por sí solas toda saturación de la red.',defense:'Activar SYN cookies',source:'https://www.rfc-editor.org/rfc/rfc4987.html',sourceLabel:'RFC 4987 · SYN flood'},
    {id:'application',layer:'Aplicación',title:'¿Qué puede leer alguien en el camino?',short:'HTTP frente a HTTPS',color:'blue',lead:'Compara el contenido visible en una captura de HTTP con el contenido protegido por TLS.',question:'Al usar HTTPS correctamente, ¿qué puede seguir viendo un observador de la red?',answers:['El texto HTTP completo, incluido cualquier dato enviado.','Metadatos como IP, puertos y tamaño aproximado; no el contenido HTTP protegido.','Absolutamente nada: ni direcciones IP ni puertos.'],correct:1,explain:'TLS protege los datos de aplicación en tránsito. Las cabeceras IP y TCP y cierta información de tráfico siguen siendo visibles. Capturar tráfico puede observar varias capas; no es un ataque exclusivo de una sola capa.',defense:'Proteger con HTTPS/TLS',source:'https://www.rfc-editor.org/rfc/rfc8446.html',sourceLabel:'RFC 8446 · TLS 1.3'}
  ];
  const node = (label,sub,type,cls='') => `<div class="security-node ${cls}">${icon(type)}<strong>${label}</strong><span>${sub}</span></div>`;
  const connection = (label,cls='') => `<div class="security-wire ${cls}"><span>${label}</span><i></i></div>`;
  window.LabModules.security = {
    render() { return `<div class="security-lab"><div class="security-intro"><span class="chip">LABORATORIO SIMULADO</span><p>Predice, provoca el incidente y comprueba la defensa. Todos los equipos, mensajes y valores son ficticios.</p></div><div class="security-tabs" role="group" aria-label="Casos por capa"></div><div class="security-case"></div></div>`; },
    mount(root,api) {
      let state = api.load('security-state',{caseId:'access',stage:0,syn:0,handshake:0,note:''});
      state = Object.assign({caseId:'access',stage:0,syn:0,handshake:0,note:''},state);
      if (!cases.some(c => c.id === state.caseId)) state.caseId = 'access';
      let answered = api.load('security-answers',{});
      const host = root.querySelector('.security-case');
      const tabs = root.querySelector('.security-tabs');
      const save = () => api.save('security-state',state);
      function drawNetwork(c) {
        const bad = state.stage === 1, fixed = state.stage === 2;
        if (c.id === 'access') {
          return `<div class="security-net" aria-label="Tramas desde el PC hacia la MAC de la puerta de enlace">${node('PC del aula','192.0.2.10','pc')}${connection(bad?'Trama desviada':'Trama al gateway',bad?'bad':'active')}${node(bad?'Equipo intruso':'Puerta de enlace',bad?'MAC …:99':'MAC …:01',bad?'eye':'router',bad?'danger':fixed?'safe':'')}</div><div class="security-arp"><div><span class="security-small-label">IP que queremos alcanzar en la LAN</span><strong>192.0.2.1</strong></div><div><span class="security-small-label">MAC guardada en el PC</span><strong class="${bad?'security-red':'security-green'}">02:00:00:00:00:${bad?'99':'01'}</strong></div><span class="security-status ${bad?'danger':fixed?'safe':''}">${bad?'Asociación falsa':fixed?'Asociación validada':'Asociación correcta'}</span></div><p class="security-result">${bad?'La IP destino final del paquete puede seguir siendo la del servidor. La trama Ethernet del siguiente salto se dirige a la MAC equivocada.':fixed?'La inspección ARP dinámica (DAI), con una base de asociaciones fiable y puertos bien configurados, puede rechazar anuncios falsos. En un entorno pequeño también se pueden fijar asociaciones concretas.':'El PC utiliza la MAC de su puerta de enlace para enviar tráfico hacia una red remota. La MAC del servidor remoto no se busca con ARP en esta LAN.'}</p><details class="security-detail"><summary>¿Y un fallo físico?</summary><p>Si el cable se desconecta, el enlace deja de transportar las tramas. No es lo mismo perder conectividad que desviar tráfico mediante una asociación ARP falsa.</p></details>`;
        }
        if (c.id === 'internet') {
          return `<div class="security-net">${node('Emisor real','192.0.2.10','pc')}${connection(fixed?'Paquete rechazado':bad?'Origen declarado: 198.51.100.77':'Origen: 192.0.2.10',fixed?'blocked':bad?'bad':'active')}${node(fixed?'Filtro de origen':'Servidor',fixed?'Prefijo esperado: 192.0.2.0/24':'203.0.113.20',fixed?'shield':'server',fixed?'safe':'')}</div><div class="security-ip-header"><span class="security-small-label">CABECERA IPv4 OBSERVADA</span><div><span>IP origen</span><strong>${state.stage?'198.51.100.77':'192.0.2.10'}</strong></div><div><span>IP destino</span><strong>203.0.113.20</strong></div><div><span>La respuesta se dirigiría a</span><strong>${state.stage?'198.51.100.77':'192.0.2.10'}</strong></div></div><p class="security-result">${fixed?'El filtro conoce qué prefijos pueden proceder de esta conexión y descarta una dirección incoherente. No detecta necesariamente una suplantación dentro de un prefijo permitido.':bad?'El servidor no obtiene la identidad real del emisor a partir de esa cabecera. Su respuesta sigue la ruta hacia 198.51.100.77, no necesariamente hacia quien envió el paquete.':'La IP origen sirve para direccionar la respuesta; por sí sola no autentica la identidad de una persona ni de una aplicación.'}</p>`;
        }
        if (c.id === 'transport') {
          const occupied = fixed ? 0 : Math.min(6, state.syn + ((state.handshake === 1 || state.handshake === 2) ? 1 : 0));
          const handshakeText = ['Cliente listo para conectar','SYN: el cliente solicita conexión','SYN-ACK: el servidor responde','ACK: conexión establecida'][state.handshake];
          return `<div class="security-handshake"><span class="${state.handshake>=1?'active':''}">1. SYN →</span><span class="${state.handshake>=2?'active':''}">2. ← SYN-ACK</span><span class="${state.handshake>=3?'active':''}">3. ACK →</span></div><p class="security-small">${handshakeText}</p><div class="security-queue-header"><strong>Conexiones incompletas</strong><span>${occupied} / 6 plazas ${fixed?'· SYN cookies activas':''}</span></div><div class="security-queue" aria-label="${occupied} de seis plazas ocupadas">${Array.from({length:6},(_,i)=>`<div class="security-slot ${i<occupied?'busy':''}"><span>${String(i+1).padStart(2,'0')}</span><strong>${i<occupied?'Espera ACK':'Libre'}</strong></div>`).join('')}</div><div class="security-actions"><button class="btn" data-security-action="handshake">${state.handshake===3?'Repetir conexión normal':'Paso del saludo TCP'}</button><button class="btn" data-security-action="syn">Añadir 2 SYN sin ACK</button><button class="btn" data-security-action="legit">Probar cliente legítimo</button></div><p class="security-result">${state.note || (fixed?'El servidor codifica información en su SYN-ACK y comprueba el ACK antes de reservar el estado de la conexión. La reserva pendiente se evita en este modelo; el tráfico sigue consumiendo red y procesamiento.':'Una petición normal completa los tres mensajes. Pulsa «Añadir 2 SYN sin ACK» y observa qué ocurre cuando se llena la cola.')}</p><p class="security-small">Seis plazas es una simplificación visual, no el límite de un servidor real. La escena no genera paquetes.</p>`;
        }
        return `<div class="security-net">${node('Navegador',fixed?'HTTPS · TCP 443':'HTTP · TCP 80','pc')}${connection(fixed?'TLS protege el contenido':'Contenido en claro',bad?'bad':fixed?'safe':'active')}${node('Servidor web','203.0.113.20','server')}</div><div class="security-capture ${fixed?'encrypted':bad?'exposed':''}"><div class="security-capture-heading">${icon('eye')}<strong>Lo que ve el observador</strong><span>${fixed?'TLS activo':bad?'Captura abierta':'Predice antes de observar'}</span></div>${state.stage===0?'<p class="security-hidden-payload">¿Podrá leer el nombre del equipo que consulta el marcador?</p>':`<pre>${fixed?'[Registro TLS: contenido cifrado]\n17 03 03 … a8 2f 91 …\n(representación ilustrativa, no cifrado real)':'GET /marcador?equipo=azul HTTP/1.1\r\nHost: aula.example\r\n\r\n'}</pre><div class="security-meta"><span>IP: 192.0.2.10 → 203.0.113.20</span><span>TCP: 51514 → ${fixed?'443':'80'}</span><span>Tamaño y tiempos: observables</span></div>`}</div><p class="security-result">${fixed?'TLS mantiene el contenido de aplicación protegido frente a un observador en tránsito si la conexión y la validación del certificado son correctas. El equipo y el servidor sí pueden leer sus propios datos.':bad?'HTTP sin TLS permite leer este contenido a quien consigue observar el tráfico. Ver paquetes con una herramienta de análisis no convierte una captura en maliciosa por sí misma.':'Aquí comparamos la confidencialidad del contenido. La captura de tráfico puede mostrar campos de enlace, IP, transporte y aplicación.'}</p>`;
      }
      function render() {
        const c = cases.find(c => c.id === state.caseId);
        tabs.innerHTML = cases.map((item,i)=>`<button class="security-tab ${item.id===c.id?'active':''}" aria-pressed="${item.id===c.id}" data-security-case="${item.id}"><span>0${i+1} · ${item.layer}</span><strong>${item.short}</strong>${answered[item.id]?.correct?'<b aria-label="Actividad resuelta">✓</b>':''}</button>`).join('');
        host.innerHTML = `<section class="panel security-simulation ${c.color}" aria-label="${c.short}"><div class="security-case-heading"><div><span class="eyebrow">CASO ${cases.indexOf(c)+1} / 4 · ${c.layer.toUpperCase()}</span><h2>${c.title}</h2><p>${c.lead}</p></div><span class="security-phase">${['01 · Observar','02 · Incidente','03 · Defensa'][state.stage]}</span></div><div class="security-stage-buttons" role="group" aria-label="Estado del caso"><button class="btn ${state.stage===0?'primary':''}" data-security-stage="0">Situación inicial</button><button class="btn ${state.stage===1?'primary':''}" data-security-stage="1">${c.id==='application'?'Observar captura':'Simular incidente'}</button><button class="btn ${state.stage===2?'primary':''}" data-security-stage="2">${c.defense}</button></div><div aria-live="polite" class="security-scene">${drawNetwork(c)}</div></section><section class="panel security-question"><span class="eyebrow">EXPLICA LO QUE HA CAMBIADO</span><h3>${c.question}</h3><div class="security-options">${c.answers.map((answer,i)=>`<button class="security-option ${answered[c.id]?.index===i?(answered[c.id].correct?'selected-correct':'selected-wrong'):''}" data-security-answer="${i}"><span>${String.fromCharCode(65+i)}</span>${answer}</button>`).join('')}</div><div class="security-feedback" aria-live="polite">${answered[c.id]?`<p class="feedback ${answered[c.id].correct?'ok':'bad'}"><strong>${answered[c.id].correct?'Bien razonado.':'Revisa el recorrido.'}</strong> ${c.explain}</p>`:''}</div><a href="${c.source}" target="_blank" rel="noopener noreferrer" class="security-source">Consultar la fuente: ${c.sourceLabel} ↗</a></section>`;
      }
      const onClick = event => {
        const target = event.target.closest('button'); if (!target || !root.contains(target)) return;
        if (target.hasAttribute('data-security-case')) { state={caseId:target.dataset.securityCase,stage:0,syn:0,handshake:0,note:''}; save();render(); }
        if (target.hasAttribute('data-security-stage')) {
          state.stage=Number(target.dataset.securityStage);state.syn=state.stage===1&&state.caseId==='transport'?6:0;state.handshake=0;state.note='';save();render();
        }
        if (target.hasAttribute('data-security-action')) {
          const a=target.dataset.securityAction;
          if(a==='syn') {
            state.handshake=0;
            if(state.stage===2)state.note='Llegan dos SYN. Con SYN cookies, este modelo no reserva plazas mientras espera el ACK. El envío de SYN sigue consumiendo ancho de banda y procesamiento.';
            else{state.stage=1;state.syn=Math.min(6,state.syn+2);state.note=state.syn===6?'La cola está llena: seis conexiones incompletas esperan un ACK. Prueba ahora un cliente legítimo.':`Hay ${state.syn} conexiones incompletas esperando el último ACK.`;}
          }
          if(a==='legit') {
            state.note=state.stage!==2&&state.syn===6?'El cliente legítimo no consigue una plaza en esta cola llena. La disponibilidad del servicio se ve afectada.':'El cliente legítimo completa el saludo TCP y establece una conexión. La cola puede atenderlo.';
            if(state.stage===2||state.syn<6)state.handshake=3;
          }
          if(a==='handshake') {
            if(state.handshake===0&&state.stage!==2&&state.syn===6)state.note='No hay plaza para este cliente: aplica la defensa o vuelve a la situación inicial.';
            else {state.handshake=(state.handshake+1)%4;state.note=['Cliente preparado para una nueva conexión.','El cliente envía SYN. El servidor recibe una solicitud de conexión.','El servidor envía SYN-ACK y espera el último ACK.','El cliente confirma con ACK. La conexión pasa a establecida.'][state.handshake];}
          }
          save();render();
        }
        if(target.hasAttribute('data-security-answer')) {
          const c=cases.find(c=>c.id===state.caseId), index=Number(target.dataset.securityAnswer), correct=index===c.correct;
          answered[c.id]={index,correct};api.save('security-answers',answered);
          api.record('security-'+c.id,{question:c.question,answer:c.answers[index],correct,feedback:c.explain});
          if(cases.every(item=>answered[item.id]?.correct))api.markComplete('security','Cuatro incidentes analizados','Identifica el fallo y su mitigación en las cuatro capas.');
          render();
        }
      };
      root.addEventListener('click',onClick);render();
      return () => root.removeEventListener('click',onClick);
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
      let packet=0,phase=-1,results=[],timer=null,running=false,lastEvent='Prepara una predicción: con dos routers, ¿llegará una solicitud con TTL 2?',lastNode=-1,reverse=false,type=8;
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
        qs('.icmp-route').innerHTML=labels.map((item,i)=>`${i?`<div class="icmp-link ${lastNode===i||lastNode===i-1?'active':''} ${reverse?'reverse':''}"><span>${reverse?'←':'→'}</span></div>`:''}<div class="icmp-node ${lastNode===i?'active':''} ${lastNode===i&&(type===3||type===11)?'icmp-error-node':''}">${icon(item[2])}<strong>${item[0]}</strong><span>${item[1]}</span><small>${i===0?'Origen':i===3?'Responde con su propio TTL':`TTL de ida: ${Math.max(0,settings.ttl-i)}`}</small></div>`).join('');
      }
      function questionHtml(){
        const complete=results.length===4,m=metrics();
        return `<span class="eyebrow">LEE LA EVIDENCIA</span><h3>¿Qué nos dice este ping?</h3><p>Ejecuta las cuatro solicitudes y calcula la pérdida. Después interpreta lo observado.</p><div class="icmp-question-grid"><label>Porcentaje de solicitudes sin Echo Reply<input type="number" data-icmp="loss-answer" min="0" max="100" step="1" placeholder="0–100" ${!complete?'disabled':''}></label><label>Conclusión<select data-icmp="conclusion" ${!complete?'disabled':''}><option value="">Elige una interpretación</option><option value="reachable">Hubo respuesta ICMP; eso no garantiza que funcione un servicio web.</option><option value="ttl">El TTL se agotó antes de llegar al destino.</option><option value="route">Un router informó que no tenía ruta hacia la red de destino.</option><option value="unknown">No recibimos eco; por sí solo no demuestra que el equipo esté apagado.</option><option value="all">Si ping falla, Internet entero está caído.</option></select></label></div><button class="btn primary" data-icmp-action="check" ${!complete?'disabled':''}>Comprobar interpretación</button><div class="icmp-answer-feedback" aria-live="polite">${answer?`<p class="feedback ${answer.correct?'ok':'bad'}">${answer.text}</p>`:!complete?'<p class="icmp-small">La actividad se activa al completar cuatro solicitudes.</p>':''}</div><details class="icmp-detail"><summary>¿Qué significa el TTL que aparece en una respuesta?</summary><p>Es el TTL restante del paquete IP que trae el Echo Reply. No es el TTL inicial que escribiste para la solicitud. En esta simulación el servidor inicia sus respuestas con 64; tras los dos routers de vuelta llega con 62. El RTT mide ida y vuelta y los bytes=32 corresponden a datos de prueba, no al tamaño total de la trama.</p></details>${complete?`<p class="icmp-small">Resultado de esta ejecución: ${m.sent} solicitudes completadas.</p>`:''}`;
      }
      function draw() {
        qs('.icmp-scenario-description').textContent=pingScenarios[settings.scenario].desc;
        drawRoute();qs('.icmp-event').innerHTML=`<span class="icmp-event-badge">${results.length===4?'FINALIZADO':phase<0?'PREDICE':`SOLICITUD ${packet+1}`}</span><p>${lastEvent}</p>`;
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
        results.push(result);lastNode=0;reverse=true;type=result.type;
        if(result.kind==='reply')lastEvent=`Echo Reply recibido. ${result.rtt} ms de ida y vuelta; su TTL restante es 62. La solicitud y la respuesta son paquetes distintos.`;
        if(result.kind==='ttl')lastEvent=`R${result.router} devuelve ICMP tipo 11, código 0: el TTL de la solicitud ha llegado a cero. El destino no ha recibido este Echo Request.`;
        if(result.kind==='unreachable')lastEvent='R2 devuelve ICMP tipo 3, código 0: no tiene ruta hacia la red de destino. Es un error recibido, no una respuesta de eco.';
        if(result.kind==='timeout')lastEvent='Se agota el tiempo de espera sin Echo Reply. Desde esta salida no podríamos distinguir por sí solos un filtrado, una pérdida u otra causa.';
        if(results.length===4){stop();api.save('icmp-last-result',{settings:Object.assign({},settings),metrics:metrics(),results});}
        else{packet++;phase=-1;}
      }
      function step() {
        if(results.length===4)return;
        phase++;
        const result=outcome(packet);reverse=false;type=8;
        if(phase===0){lastNode=0;lastEvent=`El PC crea Echo Request (tipo 8, código 0) dentro de IPv4, con TTL ${settings.ttl}. Empieza la solicitud ${packet+1}.`;}
        else if(phase===1){lastNode=1;lastEvent=`R1 examina IPv4 y reduce el TTL: ${settings.ttl} → ${settings.ttl-1}. ${settings.ttl===1?'El valor llega a cero; descarta la solicitud y genera ICMP Time Exceeded.':'Reenvía el paquete hacia R2.'}`;if(settings.ttl===1){type=11;phase=4;}}
        else if(phase===2){lastNode=2;lastEvent=`R2 examina IPv4 y reduce el TTL: ${settings.ttl-1} → ${settings.ttl-2}. ${settings.ttl===2?'Llega a cero: genera Time Exceeded.':settings.scenario==='unreachable'?'No hay una ruta para el destino: genera Destination Unreachable.':'Reenvía el paquete hacia el servidor.'}`;if(settings.ttl===2){type=11;phase=4;}else if(settings.scenario==='unreachable'){type=3;phase=4;}}
        else if(phase===3){lastNode=3;if(result.kind==='timeout'){type=null;lastEvent=settings.scenario==='filtered'?'La regla del destino descarta Echo Request sin responder. Nosotros conocemos la causa porque controlamos la simulación.':'La tercera solicitud se pierde en este escenario. No se genera respuesta de eco.';}else{type=0;lastEvent='El servidor recibe Echo Request y crea Echo Reply (tipo 0). Su nuevo paquete IP comienza con TTL 64.';}}
        else if(phase===4){lastNode=1;reverse=true;type=result.type;lastEvent=result.kind==='reply'?'Echo Reply vuelve por R2 y R1. Su TTL se reduce de 64 a 62. Las direcciones origen y destino están invertidas.':result.kind==='timeout'?'El PC sigue esperando. No ha recibido una respuesta ni un error ICMP.':'El error ICMP vuelve hacia la IP origen de la solicitud.';}
        else finish(result);
        draw();
      }
      function reset(keepMessage) {
        stop();packet=0;phase=-1;results=[];lastNode=-1;reverse=false;type=8;answer=null;
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
          if(results.length===4)reset();running=true;qs('[data-icmp-action="play"]').textContent='Pausar';step();if(running)timer=setInterval(step,550);draw();
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

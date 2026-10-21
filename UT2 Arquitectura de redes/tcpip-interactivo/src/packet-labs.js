/* Laboratorios de protocolos y cabeceras. Sin conexiones de red ni dependencias. */
(() => {
  'use strict';
  window.LabModules = window.LabModules || {};
  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const get = (api, key, fallback) => { try { return api.load(key, fallback) ?? fallback; } catch (_) { return fallback; } };
  const record = (api, key, value) => { if (api.record) api.record(key, value); };
  const layers = {app:'Aplicación', transport:'Transporte', internet:'Internet', access:'Acceso a red'};
  const protocols = [
    {id:'http',name:'HTTP',layer:'app',fn:'Intercambiar peticiones y respuestas de la web', why:'Da significado al mensaje: recurso, método, estado y contenido. En el ejemplo usamos HTTP/1.1 sobre TCP, sin cifrado.', fail:'Llegarían bytes, pero faltaría el lenguaje de la petición web.'},
    {id:'https',name:'HTTPS / TLS',layer:'app',fn:'Proteger la comunicación web con cifrado y autenticación', why:'HTTPS usa HTTP con protección TLS. Aquí mostramos HTTP/1.1 sobre TLS y TCP. HTTP/3 es otra combinación: utiliza QUIC sobre UDP.', fail:'El contenido quedaría expuesto en una conexión HTTP sin protección.'},
    {id:'dns',name:'DNS',layer:'app',fn:'Consultar información de nombres, como sus direcciones IP',why:'Permite consultar direcciones A/AAAA de un nombre. DNS clásico utiliza UDP o TCP; no es exclusivo de UDP.',fail:'Sin resolución ni una dirección ya conocida, el cliente no sabría a qué IP conectarse.'},
    {id:'smtp',name:'SMTP',layer:'app',fn:'Transferir correo electrónico entre sistemas',why:'Permite enviar y transferir correo. La lectura del buzón usa otros protocolos, como IMAP o POP3.',fail:'Faltaría el protocolo de transferencia del correo.'},
    {id:'telnet',name:'Telnet',layer:'app',fn:'Ofrecer una terminal remota sin cifrado propio',why:'Permite una sesión de terminal remota. No cifra por sí mismo; para administración segura se utiliza habitualmente SSH.',fail:'Faltaría el diálogo de terminal remota definido por Telnet.'},
    {id:'tcp',name:'TCP',layer:'transport',fn:'Entregar un flujo de bytes fiable y ordenado entre aplicaciones',why:'Usa puertos, secuencias, confirmaciones y retransmisiones. No conserva los límites de cada mensaje de aplicación.',fail:'HTTP/1.1 perdería el servicio de flujo fiable que espera de TCP.'},
    {id:'udp',name:'UDP',layer:'transport',fn:'Enviar datagramas entre puertos sin garantía propia de entrega',why:'Tiene una cabecera pequeña y conserva los límites de cada datagrama. La aplicación puede añadir mecanismos de fiabilidad.',fail:'Una consulta DNS construida para UDP no tendría su cabecera de transporte.'},
    {id:'ipv4',name:'IPv4',layer:'internet',fn:'Direccionar y encaminar datagramas entre redes',why:'Sus direcciones identifican origen y destino. El encaminamiento permite atravesar redes diferentes, sin garantizar la entrega.',fail:'No habría direcciones IP ni encaminamiento entre redes.'},
    {id:'icmp',name:'ICMP',layer:'internet',fn:'Comunicar errores de IP y apoyar el diagnóstico de red',why:'Viaja dentro de IP, sin TCP ni UDP. Ping utiliza Echo Request y Echo Reply; ICMP no proporciona el control de flujo de TCP.',fail:'Faltarían estos mensajes de diagnóstico y notificación de problemas de IP.'},
    {id:'arp',name:'ARP',layer:'access',fn:'Resolver la dirección MAC del siguiente salto IPv4 local',why:'Relaciona una IPv4 local con una MAC. Aquí se sitúa en acceso a red, en la frontera con Internet. Viaja directamente en una trama, sin cabecera IPv4.',fail:'Sin una entrada conocida, el emisor no podría completar la MAC del siguiente salto.'},
    {id:'ethernet',name:'Ethernet',layer:'access',fn:'Transportar tramas con direcciones MAC en un enlace local',why:'Lleva IPv4, ARP u otros tipos de carga en una trama. Sus direcciones MAC se refieren al enlace; no sustituyen a las IP de extremo a extremo.',fail:'Faltaría la trama necesaria para transmitir por este enlace Ethernet.'}
  ];
  const scenarios = {
    http:{name:'Abrir una web',desc:'Petición HTTP/1.1 sin cifrar: una pila concreta, no todos los protocolos a la vez.',rows:[['app','HTTP','¿Qué recurso quiero?'],['transport','TCP','¿A qué aplicación y con qué fiabilidad?'],['internet','IPv4','¿A qué equipo y por qué redes?'],['access','Ethernet','¿A qué interfaz del siguiente salto?']],note:'Antes pueden intervenir DNS para obtener la IP y ARP para averiguar una MAC. Son intercambios propios, no cabeceras añadidas a esta misma petición.',missing:['Sin HTTP no se expresa el recurso que se solicita.','Esta versión de HTTP espera un flujo fiable de TCP.','Sin IPv4 no se encamina esta petición entre redes.','Sin la trama Ethernet no se envía por este enlace.']},
    https:{name:'Web con HTTPS',desc:'Ejemplo de HTTPS con HTTP/1.1: TLS protege el mensaje por encima de TCP.',rows:[['app','HTTP + TLS','Petición web y protección del contenido'],['transport','TCP','Flujo fiable entre puertos'],['internet','IPv4','Direcciones y encaminamiento'],['access','Ethernet','Entrega al siguiente salto']],note:'Esta es una pila posible. HTTP/3 utiliza QUIC sobre UDP: «web» no significa siempre «TCP».',missing:['Sin TLS desaparece la protección de este ejemplo HTTPS.','Esta combinación HTTP/1.1 + TLS utiliza TCP.','Sin IPv4 no se encamina entre las redes del ejemplo.','Este enlace requiere una trama Ethernet.']},
    dns:{name:'Consultar DNS',desc:'Consulta DNS clásica sobre UDP. También existe DNS sobre TCP.',rows:[['app','DNS','¿Qué dirección tiene este nombre?'],['transport','UDP','Puerto destino 53 en este ejemplo'],['internet','IPv4','IP del servidor DNS'],['access','Ethernet','MAC del siguiente salto']],note:'DNS produce su propio mensaje. La respuesta entrega la información que luego puede usar la conexión web.',missing:['Sin DNS falta el significado de la consulta del nombre.','Esta consulta concreta usa UDP; DNS también puede elegir TCP.','Sin IPv4 falta el destino y el encaminamiento.','No puede salir por este enlace sin Ethernet.']},
    ping:{name:'Hacer ping',desc:'El mensaje ICMP se encapsula directamente dentro de IPv4.',rows:[['internet','ICMP','Solicitud o respuesta de eco'],['internet','IPv4','Protocolo = 1: la carga es ICMP'],['access','Ethernet','Siguiente salto local']],note:'Aquí no hay puertos, TCP ni UDP. La aplicación ping genera mensajes de ICMP; no es una capa de transporte.',missing:['Sin ICMP no se construye la solicitud de eco.','ICMP necesita IP para viajar hasta el destino.','En este escenario la salida requiere una trama Ethernet.']},
    arp:{name:'Resolver una MAC',desc:'ARP resuelve una dirección IPv4 del enlace local.',rows:[['access','ARP','¿Quién tiene esta IPv4 local?'],['access','Ethernet','EtherType = 0x0806']],note:'ARP no lleva una cabecera IPv4. Si el destino está en otra red, se resuelve la MAC de la puerta de enlace, no la del servidor remoto.',missing:['Sin ARP ni caché conocida no se obtiene la asociación IP–MAC.','ARP se transporta directamente en Ethernet en este ejemplo.']}
  };
  window.LabModules.protocols = {
    render() { return `<div class="packet-lab packet-protocols"><div class="packet-intro"><p class="eyebrow">CADA PROTOCOLO RESUELVE UNA PARTE</p><h2>Un equipo de especialistas.</h2><p class="muted">Explora una pila y después asigna a cada protocolo su trabajo y su capa.</p></div><div class="panel packet-scenario-panel"><div class="packet-section-line"><h3>1. Elige una comunicación</h3><span class="chip">Toca una pieza para retirarla</span></div><div class="packet-scenarios" role="group" aria-label="Escenario">${Object.entries(scenarios).map(([k,s])=>`<button class="btn" data-scenario="${k}">${s.name}</button>`).join('')}</div><div class="packet-stack-area"></div></div><section class="panel packet-match-panel"><div class="packet-section-line"><h3>2. ¿Qué hace cada protocolo?</h3><span class="packet-match-progress chip">0 / 11</span></div><div class="packet-match-layout"><div class="packet-protocol-grid" role="group" aria-label="Protocolos">${protocols.map(p=>`<button type="button" class="packet-protocol-card" data-protocol="${p.id}"><strong>${p.name}</strong><span class="packet-protocol-status">Por resolver</span></button>`).join('')}</div><div class="packet-protocol-task"></div></div><p class="packet-source muted">Modelo de cuatro capas. ARP se representa aquí en acceso a red; conecta el direccionamiento IPv4 con las direcciones del enlace.</p></section></div>`; },
    mount(root, api) {
      let scenario = 'http', disabled = -1, current = 'http';
      let solved = get(api, 'protocols.solved', {});
      if (!solved || typeof solved !== 'object') solved = {};
      const progress = () => {
        const n=protocols.filter(p=>solved[p.id]).length;
        root.querySelector('.packet-match-progress').textContent=`${n} / 11 resueltos`;
        root.querySelectorAll('[data-protocol]').forEach(b=>{b.classList.toggle('packet-selected',b.dataset.protocol===current);b.classList.toggle('packet-solved',!!solved[b.dataset.protocol]);b.querySelector('span').textContent=solved[b.dataset.protocol]?'✓ Resuelto':'Por resolver';});
        if (n===11 && api.markComplete) api.markComplete('protocols','Funciones y capas de los protocolos','11 protocolos relacionados correctamente.');
      };
      const drawScenario=()=>{
        const s=scenarios[scenario];
        root.querySelectorAll('[data-scenario]').forEach(b=>{b.classList.toggle('primary',b.dataset.scenario===scenario);b.setAttribute('aria-pressed',b.dataset.scenario===scenario?'true':'false');});
        root.querySelector('.packet-stack-area').innerHTML=`<div class="packet-stack-visual">${s.rows.map((r,i)=>`<button class="packet-stack-layer packet-layer-${r[0]} ${disabled===i?'packet-disabled-layer':''}" data-toggle-layer="${i}" aria-pressed="${disabled===i?'false':'true'}"><span>${layers[r[0]]}</span><strong>${r[1]}</strong><small>${r[2]}</small><span class="packet-toggle-symbol" aria-hidden="true">${disabled===i?'+':'−'}</span></button>`).join('')}<span class="packet-wire-label">↓ enlace físico ↓</span></div><div class="packet-stack-text"><h4>${s.name}</h4><p>${s.desc}</p><div class="packet-dependency ${disabled<0?'':'packet-dependency-warn'}" aria-live="polite">${disabled<0?'<strong>La pila está completa.</strong><br>Retira una pieza y comprueba qué servicio deja de estar disponible.':`<strong>Has retirado ${s.rows[disabled][1]}.</strong><br>${s.missing[disabled]}`}</div><p class="muted">${s.note}</p>${disabled>=0?'<button class="btn" data-restore-stack>Restaurar la pila</button>':''}</div>`;
      };
      const drawTask=()=>{
        const p=protocols.find(p=>p.id===current);
        root.querySelector('.packet-protocol-task').innerHTML=`<span class="eyebrow">PROTOCOLO SELECCIONADO</span><h3>${p.name}</h3><label for="packet-protocol-function">¿Qué trabajo realiza?</label><select id="packet-protocol-function"><option value="">Elige su función…</option>${[...protocols].sort((a,b)=>a.fn.localeCompare(b.fn,'es')).map(v=>`<option value="${v.id}">${v.fn}</option>`).join('')}</select><label for="packet-protocol-layer">¿En qué capa lo situamos?</label><select id="packet-protocol-layer"><option value="">Elige la capa…</option>${Object.entries(layers).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select><div class="toolbar"><button class="btn primary" data-check-protocol>Comprobar</button><button class="btn" data-next-protocol>Siguiente protocolo →</button></div><div class="packet-protocol-feedback" aria-live="polite">${solved[current]?`<p class="feedback ok"><strong>Ya lo has resuelto.</strong> ${p.why}</p>`:'<p class="muted">Primero decide; después podrás consultar la explicación.</p>'}</div>`;
        progress();
      };
      const click=e=>{
        const b=e.target.closest('button');if(!b)return;
        if(b.dataset.scenario){scenario=b.dataset.scenario;disabled=-1;drawScenario();}
        else if(b.hasAttribute('data-toggle-layer')) { const i=Number(b.dataset.toggleLayer);disabled=disabled===i?-1:i;drawScenario(); }
        else if(b.hasAttribute('data-restore-stack')){disabled=-1;drawScenario();}
        else if(b.dataset.protocol){current=b.dataset.protocol;drawTask();}
        else if(b.hasAttribute('data-next-protocol')){const i=protocols.findIndex(p=>p.id===current);current=protocols[(i+1)%protocols.length].id;drawTask();}
        else if(b.hasAttribute('data-check-protocol')){
          const p=protocols.find(p=>p.id===current),f=root.querySelector('#packet-protocol-function').value,l=root.querySelector('#packet-protocol-layer').value;
          const fb=root.querySelector('.packet-protocol-feedback');
          if(!f||!l){fb.innerHTML='<p class="feedback bad">Elige una función y una capa antes de comprobar.</p>';return;}
          const correct=f===p.id&&l===p.layer;
          record(api,`protocols.${p.id}`,{question:`Función y capa de ${p.name}`,answer:`${protocols.find(v=>v.id===f).fn} · ${layers[l]}`,correct,feedback:correct?p.why:'Revisa la función y la capa.'});
          if(correct){solved[p.id]=true;api.save('protocols.solved',solved);fb.innerHTML=`<p class="feedback ok"><strong>Correcto.</strong> ${p.why}</p>`;progress();}
          else fb.innerHTML=`<p class="feedback bad"><strong>${f===p.id?'La función es correcta; revisa la capa.':l===p.layer?'La capa es correcta; revisa la función.':'Revisa la función y la capa.'}</strong> ${p.id==='arp'?'Pista: ARP necesita una dirección del enlace local.':p.id==='icmp'?'Pista: ICMP viaja dentro de IP, sin puertos TCP o UDP.':'Piensa qué problema resuelve y qué recibe de la capa inferior.'}</p>`;
        }
      };
      root.addEventListener('click',click);drawScenario();drawTask();
      return ()=>root.removeEventListener('click',click);
    }
  };

  const parts = [
    {id:'eth',name:'Cabecera Ethernet',short:'ETH',size:14,layer:'access',desc:'MAC destino + MAC origen + EtherType. Identifica el siguiente salto.'},
    {id:'ip',name:'Cabecera IPv4',short:'IP',size:20,layer:'internet',desc:'IP origen y destino, TTL y protocolo, entre otros campos. Sin opciones: 20 bytes.'},
    {id:'tcp',name:'Cabecera TCP',short:'TCP',size:20,layer:'transport',desc:'Puertos, secuencias, confirmaciones y control. Sin opciones: 20 bytes.'},
    {id:'data',name:'Mensaje HTTP',short:'DATOS',size:0,layer:'app',desc:'Datos para TCP. Incluyen la estructura propia del mensaje HTTP.'},
    {id:'fcs',name:'Cola Ethernet (FCS)',short:'FCS',size:4,layer:'access',desc:'Comprobación de errores de la trama. Es una cola, no una cabecera.'}
  ];
  const initialData='GET /aula HTTP/1.1\r\nHost: aula.local\r\n\r\n';
  const byteLength=s=>new TextEncoder().encode(s).length;
  window.LabModules.builder = {
    render(){return `<div class="packet-lab"><div class="packet-intro"><p class="eyebrow">TALLER DE ENCAPSULACIÓN</p><h2>Construye lo que viaja.</h2><p class="muted">Selecciona las piezas en su orden de transmisión. Después abre la trama para ver qué contiene cada PDU.</p></div><section class="panel"><div class="packet-section-line"><h3>1. Monta la trama Ethernet</h3><span class="chip">Sin opciones · Sin VLAN</span></div><p class="muted">Pulsa una pieza para añadirla. Pulsa una posición ocupada para retirarla.</p><div class="packet-part-bank"></div><div class="packet-assembly" aria-label="Orden de las piezas"></div><div class="toolbar"><button class="btn primary" data-check-build>Comprobar montaje</button><button class="btn" data-hint-build>Pista</button><button class="btn" data-reset-build>Reiniciar montaje</button></div><div class="packet-build-feedback" aria-live="polite"></div></section><section class="panel packet-size-panel"><div class="packet-section-line"><h3>2. Unos datos dentro de otros</h3><span class="chip">Tamaño real en bytes</span></div><div class="packet-build-detail"><div><label for="packet-message">Datos de aplicación (puedes modificarlos)</label><textarea id="packet-message" rows="5" spellcheck="false" aria-describedby="packet-message-limit"></textarea><p id="packet-message-limit" class="packet-small packet-message-limit" role="status" aria-live="polite"></p><p class="muted packet-small">El ejemplo incluye un mensaje HTTP completo. Cada salto de línea se cuenta como CRLF; los caracteres se codifican en UTF-8.</p><button class="btn" data-default-message>Restaurar mensaje HTTP</button></div><div class="packet-byte-summary"></div></div><div class="packet-nest"></div><div class="packet-piece-detail" aria-live="polite"><p class="muted">Pulsa una etiqueta del montaje anidado para inspeccionarla.</p></div><p class="packet-source muted">Modelo didáctico Ethernet II + IPv4 + TCP. No se cuentan preámbulo, delimitador de inicio ni intervalo entre tramas. Las capas de sesión y presentación de OSI no implican siempre cabeceras separadas.</p></section></div>`;},
    mount(root,api){
      let order=get(api,'builder.order',[]);if(!Array.isArray(order)||order.some(id=>!parts.some(p=>p.id===id)))order=[];
      let message=get(api,'builder.message',initialData);if(typeof message!=='string')message=initialData;
      let showResult=false;
      const limitMessage=(value)=>{
        const normalized=value.replace(/\r?\n/g,'\r\n');
        let accepted='',bytes=0;
        for(const token of normalized.match(/\r\n|[\s\S]/gu)||[]){
          const next=byteLength(token);
          if(bytes+next>1460)break;
          accepted+=token;bytes+=next;
        }
        return {text:accepted,bytes,truncated:accepted.length<normalized.length};
      };
      const applyMessageLimit=(value)=>{
        const limited=limitMessage(value);message=limited.text;
        const input=root.querySelector('#packet-message');
        if(limited.truncated||input.value.replace(/\r?\n/g,'\r\n')!==message)input.value=message;
        const status=root.querySelector('.packet-message-limit');
        status.textContent=limited.truncated
          ? `El texto superaba el límite: se ha recortado a ${limited.bytes} bytes UTF-8 completos. Máximo: 1460 B de aplicación + 20 B TCP + 20 B IPv4 = MTU 1500 B. La segmentación TCP queda fuera de este montaje.`
          : `${limited.bytes} / 1460 bytes UTF-8 de aplicación. Con 20 B TCP y 20 B IPv4 se respeta la MTU de 1500 B. La segmentación TCP queda fuera de este montaje.`;
        status.classList.toggle('feedback',limited.truncated);status.classList.toggle('bad',limited.truncated);
      };
      const drawAssembly=()=>{
        root.querySelector('.packet-part-bank').innerHTML=['tcp','fcs','data','eth','ip'].map(id=>{const p=parts.find(p=>p.id===id);return `<button class="packet-part packet-layer-${p.layer}" data-add-part="${id}" ${order.includes(id)?'disabled':''}><strong>${p.name}</strong><small>${id==='data'?'Longitud variable':p.size+' bytes'}</small><span>+</span></button>`;}).join('');
        root.querySelector('.packet-assembly').innerHTML=Array.from({length:5},(_,i)=>{const p=parts.find(p=>p.id===order[i]);return `<button class="packet-slot ${p?'packet-layer-'+p.layer:''} ${showResult&&p?(p.id===parts[i].id?'packet-slot-ok':'packet-slot-bad'):''}" ${p?`data-remove-part="${i}"`:'disabled'}><span class="packet-slot-number">0${i+1}</span><strong>${p?p.name:'Añade una pieza'}</strong><small>${p?'Retirar ×':' '}</small></button>`;}).join('');
      };
      const drawSizes=()=>{
        const n=byteLength(message),tcp=20+n,ip=20+tcp,padding=Math.max(0,46-ip),frame=14+ip+padding+4;
        root.querySelector('.packet-byte-summary').innerHTML=`<div><span>Datos de aplicación</span><strong>${n} B</strong></div><div><span>Segmento TCP</span><strong>${tcp} B</strong></div><div><span>Datagrama IPv4</span><strong>${ip} B</strong></div><div class="packet-total"><span>Trama Ethernet</span><strong>${frame} B</strong></div>${padding?`<p class="packet-small">Ethernet añade ${padding} B de relleno para llegar a 46 B de carga mínima.</p>`:'<p class="packet-small">La carga Ethernet supera el mínimo de 46 B: no necesita relleno.</p>'}`;
        root.querySelector('.packet-nest').innerHTML=`<div class="packet-envelope packet-env-access"><span class="packet-envelope-caption">TRAMA ETHERNET · ${frame} B</span><div class="packet-envelope-row"><button data-inspect-part="eth" class="packet-nest-tag packet-layer-access">Ethernet<br><small>14 B</small></button><div class="packet-envelope packet-env-internet"><span class="packet-envelope-caption">DATAGRAMA IPv4 · ${ip} B</span><div class="packet-envelope-row"><button data-inspect-part="ip" class="packet-nest-tag packet-layer-internet">IPv4<br><small>20 B</small></button><div class="packet-envelope packet-env-transport"><span class="packet-envelope-caption">SEGMENTO TCP · ${tcp} B</span><div class="packet-envelope-row"><button data-inspect-part="tcp" class="packet-nest-tag packet-layer-transport">TCP<br><small>20 B</small></button><button data-inspect-part="data" class="packet-nest-data packet-layer-app"><strong>Datos de aplicación</strong><span>${n} B · mensaje completo</span></button></div></div></div></div>${padding?`<span class="packet-padding">Relleno<br>${padding} B</span>`:''}<button data-inspect-part="fcs" class="packet-nest-tag packet-layer-access">FCS<br><small>4 B</small></button></div></div>`;
      };
      const click=e=>{
        const b=e.target.closest('button');if(!b)return;
        if(b.dataset.addPart&&!order.includes(b.dataset.addPart)&&order.length<5){order.push(b.dataset.addPart);showResult=false;api.save('builder.order',order);drawAssembly();root.querySelector('.packet-build-feedback').innerHTML='';}
        else if(b.hasAttribute('data-remove-part')){order.splice(Number(b.dataset.removePart),1);showResult=false;api.save('builder.order',order);drawAssembly();root.querySelector('.packet-build-feedback').innerHTML='';}
        else if(b.hasAttribute('data-reset-build')){order=[];showResult=false;api.save('builder.order',order);drawAssembly();root.querySelector('.packet-build-feedback').innerHTML='';}
        else if(b.hasAttribute('data-hint-build'))root.querySelector('.packet-build-feedback').innerHTML='<p class="feedback">La envoltura del enlace es la más externa. Dentro está IP; dentro de IP, TCP; dentro de TCP, los datos. El FCS cierra la trama.</p>';
        else if(b.hasAttribute('data-check-build')){
          const fb=root.querySelector('.packet-build-feedback');if(order.length<5){fb.innerHTML='<p class="feedback bad">Completa las cinco posiciones antes de comprobar.</p>';return;}
          const correct=order.every((id,i)=>id===parts[i].id);showResult=true;drawAssembly();
          record(api,'builder.order',{question:'Orden de las piezas de una trama Ethernet con IPv4 y TCP',answer:order.map(id=>parts.find(p=>p.id===id).name).join(' → '),correct});
          fb.innerHTML=correct?'<p class="feedback ok"><strong>Trama correcta.</strong> Ethernet contiene el datagrama IP; IP contiene el segmento TCP; TCP contiene el mensaje. El FCS va al final.</p>':'<p class="feedback bad"><strong>Revisa las posiciones marcadas.</strong> Piensa qué envoltura debe poder leer primero la tarjeta de red que recibe la trama.</p>';
          if(correct&&api.markComplete)api.markComplete('builder','Montaje de una PDU','Trama ensamblada correctamente.');
        }
        else if(b.hasAttribute('data-default-message')){applyMessageLimit(initialData);api.save('builder.message',message);drawSizes();}
        else if(b.dataset.inspectPart){const p=parts.find(p=>p.id===b.dataset.inspectPart);root.querySelector('.packet-piece-detail').innerHTML=`<p class="feedback"><strong>${p.name}.</strong> ${p.desc}${p.id==='data'?`<br><code class="packet-message-preview">${esc(message)}</code>`:''}</p>`;}
      };
      const input=e=>{if(e.target.id==='packet-message'){applyMessageLimit(e.target.value);api.save('builder.message',message);drawSizes();}};
      root.querySelector('#packet-message').value=message;applyMessageLimit(message);api.save('builder.message',message);
      root.addEventListener('click',click);root.addEventListener('input',input);drawAssembly();drawSizes();
      return ()=>{root.removeEventListener('click',click);root.removeEventListener('input',input);};
    }
  };

  const tcpFields=[
    {id:'srcport',name:'Puerto origen',en:'Source Port',bits:16,value:'51514',desc:'Identifica el puerto de la aplicación emisora. Junto con las IP y el puerto destino permite distinguir esta comunicación.'},
    {id:'dstport',name:'Puerto destino',en:'Destination Port',bits:16,value:'80',desc:'Indica el puerto de la aplicación receptora. En este ejemplo es el servicio HTTP sin TLS.'},
    {id:'seq',name:'Número de secuencia',en:'Sequence Number',bits:32,value:'1001',desc:'Posición del primer byte de datos de este segmento en el flujo TCP. Las secuencias cuentan bytes, no paquetes.'},
    {id:'ack',name:'Número de confirmación',en:'Acknowledgment Number',bits:32,value:'5001',desc:'Si ACK está activo, indica el siguiente número de secuencia que se espera recibir del otro extremo.'},
    {id:'offset',name:'Offset',en:'Data Offset',bits:4,value:'5',desc:'Longitud de la cabecera TCP en palabras de 32 bits. 5 × 4 = 20 bytes: no hay opciones en este ejemplo.'},
    {id:'reserved',name:'Reserv.',en:'Reserved',bits:4,value:'0',desc:'Cuatro bits reservados en el formato base dibujado en RFC 9293. Se muestran a cero; el esquema no incorpora extensiones posteriores.'},
    {id:'tcpflags',name:'Flags',en:'Control bits',bits:8,value:'ACK · PSH',desc:'Ocho indicadores en RFC 9293: CWR, ECE, URG, ACK, PSH, RST, SYN y FIN. Aquí ACK y PSH están activos (0x18).'},
    {id:'window',name:'Ventana',en:'Window',bits:16,value:'64240',desc:'Informa del espacio de recepción anunciado. Participa en el control de flujo. El valor se interpreta con escalado si se negoció esa extensión.'},
    {id:'tcpchecksum',name:'Checksum TCP',en:'Checksum',bits:16,value:'Calculado',desc:'Comprobación sobre cabecera, datos TCP y una pseudocabecera con información IP. Detecta errores; no cifra ni autentica criptográficamente.'},
    {id:'urgent',name:'Puntero urgente',en:'Urgent Pointer',bits:16,value:'0',desc:'Se interpreta cuando URG está activo. En este ejemplo URG está desactivado y el campo vale cero.'}
  ];
  const ipFields=[
    {id:'version',name:'Versión',en:'Version',bits:4,value:'4',desc:'Indica la versión del protocolo IP: aquí IPv4.'},
    {id:'ihl',name:'IHL',en:'Internet Header Length',bits:4,value:'5',desc:'Longitud de la cabecera IPv4 en palabras de 32 bits. 5 × 4 = 20 bytes: sin opciones.'},
    {id:'dscp',name:'DSCP',en:'Differentiated Services Code Point',bits:6,value:'0',desc:'Permite indicar un tratamiento diferenciado del tráfico. Ocupa seis bits del antiguo campo Type of Service.'},
    {id:'ecn',name:'ECN',en:'Explicit Congestion Notification',bits:2,value:'0',desc:'Dos bits para notificación explícita de congestión cuando se utiliza ECN. El antiguo campo Type of Service se muestra aquí como DSCP + ECN.'},
    {id:'length',name:'Longitud total',en:'Total Length',bits:16,value:'80 B',desc:'Longitud del datagrama completo: cabecera IPv4 + carga. En este ejemplo: 20 B de IP + 20 B de TCP + 40 B del mensaje HTTP.'},
    {id:'identification',name:'Identificación',en:'Identification',bits:16,value:'0x1234',desc:'Se utiliza para asociar los fragmentos de un datagrama cuando hay fragmentación. No es una secuencia de TCP.'},
    {id:'ipflags',name:'Flags',en:'Flags',bits:3,value:'DF',desc:'Tres bits: reservado, DF (no fragmentar) y MF (hay más fragmentos). Aquí DF=1 y MF=0.'},
    {id:'fragment',name:'Desplazamiento',en:'Fragment Offset',bits:13,value:'0',desc:'Posición de los datos de este fragmento en el datagrama original, en unidades de ocho bytes. Aquí no hay fragmentación.'},
    {id:'ttl',name:'TTL',en:'Time to Live',bits:8,value:'64',desc:'Limita el recorrido del datagrama. Los routers lo reducen al reenviarlo; si se agota, descartan el datagrama y pueden generar ICMP Time Exceeded.'},
    {id:'protocol',name:'Protocolo',en:'Protocol',bits:8,value:'6 · TCP',desc:'Identifica qué lleva IP dentro: 6 para TCP, 17 para UDP y 1 para ICMP. No es un número de puerto.'},
    {id:'ipchecksum',name:'Checksum de cabecera',en:'Header Checksum',bits:16,value:'Calculado',desc:'Comprueba únicamente la cabecera IPv4. Debe actualizarse cuando cambia el TTL. No protege la carga ni cifra el mensaje.'},
    {id:'srcip',name:'Dirección IP origen',en:'Source Address',bits:32,value:'192.0.2.10',desc:'Dirección IPv4 del emisor. En la ruta de este laboratorio permanece igual porque no se utiliza NAT.'},
    {id:'dstip',name:'Dirección IP destino',en:'Destination Address',bits:32,value:'203.0.113.20',desc:'Dirección IPv4 del receptor final. El router consulta el destino para decidir hacia dónde reenviar.'}
  ];
  const questions=[
    {proto:'tcp',target:'dstport',text:'El servidor recibe la petición en el puerto 80. ¿Qué campo de TCP lo indica?',hint:'Busca el dato que identifica la aplicación receptora.'},
    {proto:'tcp',target:'seq',text:'Dos segmentos llegan desordenados. ¿Qué campo ayuda a situar sus bytes en el flujo?',hint:'Los bytes tienen una posición en el flujo.'},
    {proto:'tcp',target:'ack',text:'El receptor espera el byte 5001. ¿Dónde comunica ese número?',hint:'No busques la bandera: busca el campo que contiene el número confirmado.'},
    {proto:'tcp',target:'window',text:'El receptor anuncia cuánto espacio tiene disponible. ¿Qué campo participa en el control de flujo?',hint:'Su nombre también significa una abertura en una pared.'},
    {proto:'ip',target:'ttl',text:'Un datagrama da vueltas por un bucle. ¿Qué campo limita su recorrido?',hint:'Su valor disminuye al pasar por un router.'},
    {proto:'ip',target:'protocol',text:'IPv4 debe entregar su carga a TCP, UDP o ICMP. ¿Qué campo le permite decidir?',hint:'El valor 6 significa TCP; el 1 significa ICMP.'},
    {proto:'ip',target:'dstip',text:'El router debe elegir una ruta. ¿Qué dirección de esta cabecera consulta?',hint:'El destino final puede estar más allá del siguiente router.'},
    {proto:'ip',target:'ipchecksum',text:'El router ha reducido el TTL. ¿Qué campo de IPv4 debe actualizar para que su cabecera siga siendo válida?',hint:'La comprobación se calcula sobre la cabecera.'}
  ];
  window.LabModules.headers={
    render(){return `<div class="packet-lab packet-headers"><div class="packet-intro"><p class="eyebrow">INSPECTOR DE CABECERAS</p><h2>Los protocolos tienen estructura.</h2><p class="muted">Cada fila representa 32 bits (4 bytes). Pulsa un campo para leerlo o activa los retos para localizarlo.</p></div><div class="packet-header-toolbar toolbar"><div role="group" aria-label="Cabecera"><button class="btn primary" data-header-tab="tcp">TCP · RFC 9293</button><button class="btn" data-header-tab="ip">IPv4 · RFC 791</button></div><button class="btn" data-start-header-challenge>Iniciar 8 retos</button><button class="btn" data-explore-headers>Explorar libremente</button></div><div class="packet-header-challenge" aria-live="polite"></div><div class="packet-header-layout"><section class="panel packet-bit-panel"><div class="packet-header-title"></div><div class="packet-bit-ruler" aria-hidden="true"><span>0</span><span>8</span><span>16</span><span>24</span><span>31</span></div><div class="packet-bit-grid"></div><div class="packet-header-notes"></div></section><aside class="panel packet-field-inspector" aria-live="polite"></aside></div><section class="panel packet-rfc-task"><div class="packet-section-line"><h3>Del dibujo a la documentación</h3><span class="chip">Actividad RFC</span></div><p>Abre el RFC, localiza su sección <strong>3.1</strong> y compara la cabecera con este inspector. Si no tienes conexión, el esquema y los campos de esta página permiten hacer la identificación.</p><div class="toolbar"><a class="btn" href="https://www.rfc-editor.org/rfc/rfc9293.html#section-3.1" target="_blank" rel="noopener noreferrer">Abrir RFC 9293 ↗</a><a class="btn" href="https://www.rfc-editor.org/rfc/rfc791.html#section-3.1" target="_blank" rel="noopener noreferrer">Abrir RFC 791 ↗</a></div><label for="packet-rfc-reflection">Anota dos campos que identifiques y explica por qué son necesarios.</label><textarea id="packet-rfc-reflection" rows="3" placeholder="Por ejemplo: campo, función y qué ocurriría si faltara…"></textarea><button class="btn" data-save-rfc>Guardar explicación</button><span class="packet-rfc-status" role="status"></span><p class="packet-source muted">Dibujo elaborado para el aula a partir de RFC 9293 §3.1 y RFC 791 §3.1. El antiguo Type of Service de IPv4 se representa como DSCP (RFC 2474) + ECN (RFC 3168). El formato TCP sigue el dibujo de RFC 9293.</p></section></div>`;},
    mount(root,api){
      let proto='tcp',selected='dstport',challenge=false,index=0,locked=false;
      let done=get(api,'headers.done',[]);if(!Array.isArray(done))done=[];
      const fields=()=>proto==='tcp'?tcpFields:ipFields;
      const setDetail=(id)=>{
        const f=fields().find(f=>f.id===id);if(!f)return;selected=id;
        root.querySelectorAll('[data-header-field]').forEach(b=>{b.classList.toggle('packet-field-selected',b.dataset.headerField===id);b.setAttribute('aria-pressed',b.dataset.headerField===id?'true':'false');});
        root.querySelector('.packet-field-inspector').innerHTML=`<span class="eyebrow">${proto==='tcp'?'TRANSPORTE · TCP':'INTERNET · IPv4'}</span><h3>${f.name}</h3><p class="packet-field-en">${f.en}</p><div class="packet-field-value"><strong>${f.value}</strong><span>${f.bits} bits · ${f.bits/8} bytes</span></div><p>${f.desc}</p><span class="chip">${proto==='tcp'?'Cabecera TCP':'Cabecera IPv4'}</span>`;
      };
      const drawGrid=()=>{
        root.querySelectorAll('[data-header-tab]').forEach(b=>{const active=b.dataset.headerTab===proto;b.classList.toggle('primary',active);b.setAttribute('aria-pressed',active?'true':'false');});
        root.querySelector('.packet-header-title').innerHTML=`<h3>${proto==='tcp'?'Cabecera TCP':'Cabecera IPv4'}</h3><span class="chip">20 bytes mínimos</span>`;
        const currentFields=fields();
        root.querySelector('.packet-bit-grid').innerHTML=currentFields.map(f=>`<button class="packet-bit-field ${f.bits<=4?'packet-bit-small':''} packet-${proto}-field" style="grid-column:span ${f.bits}" data-header-field="${f.id}" aria-label="${f.name}, ${f.bits} bits, valor ${f.value}"><strong>${f.name}</strong><span>${f.value}</span></button>`).join('')+`<button class="packet-options-field" data-header-options>Opciones + relleno · longitud variable <span>Ausentes en este ejemplo</span></button><div class="packet-payload-field"><strong>${proto==='tcp'?'Datos de aplicación · 40 B':'Carga: segmento TCP · 60 B'}</strong><span>${proto==='tcp'?'GET /aula HTTP/1.1 …':'Cabecera TCP + datos de aplicación'}</span></div>`;
        root.querySelector('.packet-header-notes').innerHTML=proto==='tcp'?'<p class="packet-small muted">Formato base del RFC 9293: offset 4 bits + reservado 4 bits + flags 8 bits + ventana 16 bits. La fila de opciones es condicional: con offset=5 no se transmite.</p>':'<p class="packet-small muted">IHL=5 indica cinco palabras de 32 bits: 20 bytes sin opciones. La fila de opciones es condicional. Direcciones reservadas para documentación.</p>';
        if(!currentFields.some(f=>f.id===selected))selected=currentFields[0].id;
        setDetail(selected);
      };
      const drawChallenge=()=>{
        const area=root.querySelector('.packet-header-challenge');
        if(!challenge){area.innerHTML='';return;}
        if(index>=questions.length){area.innerHTML=`<div class="feedback ok packet-challenge-complete"><strong>Has localizado los 8 campos.</strong><p>Ahora explica la diferencia entre un puerto TCP, una dirección IP y la MAC del siguiente salto.</p><button class="btn" data-restart-header>Repetir retos</button></div>`;if(api.markComplete)api.markComplete('headers','Identificación de cabeceras','8 campos de TCP e IPv4 localizados.');return;}
        const q=questions[index];
        area.innerHTML=`<div class="panel packet-question"><div class="packet-section-line"><span class="eyebrow">RETO ${index+1} DE ${questions.length}</span><span class="chip">Busca en ${q.proto==='tcp'?'TCP':'IPv4'}</span></div><h3>${q.text}</h3><p class="muted">Responde pulsando un campo del diagrama.</p><div class="packet-challenge-feedback" aria-live="polite"></div><div class="toolbar"><button class="btn" data-header-hint>Ver pista</button><button class="btn primary" data-header-next ${locked?'':'disabled'}>${index===questions.length-1?'Terminar':'Siguiente reto →'}</button></div></div>`;
      };
      const begin=()=>{challenge=true;index=0;locked=false;proto=questions[0].proto;selected=fields()[0].id;drawGrid();drawChallenge();};
      const click=e=>{
        const b=e.target.closest('button');if(!b)return;
        if(b.dataset.headerTab){proto=b.dataset.headerTab;drawGrid();}
        else if(b.hasAttribute('data-start-header-challenge')||b.hasAttribute('data-restart-header'))begin();
        else if(b.hasAttribute('data-explore-headers')){challenge=false;drawChallenge();}
        else if(b.hasAttribute('data-header-hint')&&index<questions.length)root.querySelector('.packet-challenge-feedback').innerHTML=`<p class="feedback">${questions[index].hint}</p>`;
        else if(b.hasAttribute('data-header-next')&&locked){index++;locked=false;if(index<questions.length){proto=questions[index].proto;drawGrid();}drawChallenge();}
        else if(b.dataset.headerField){
          setDetail(b.dataset.headerField);
          if(challenge&&index<questions.length&&!locked){
            const q=questions[index],f=fields().find(f=>f.id===b.dataset.headerField),correct=proto===q.proto&&f.id===q.target;
            record(api,`headers.${index+1}`,{question:q.text,answer:`${proto==='tcp'?'TCP':'IPv4'}: ${f.name}`,correct});
            const fb=root.querySelector('.packet-challenge-feedback');
            if(correct){locked=true;if(!done.includes(index))done.push(index);api.save('headers.done',done);fb.innerHTML=`<p class="feedback ok"><strong>Localizado.</strong> ${f.desc}</p>`;root.querySelector('[data-header-next]').disabled=false;}
            else fb.innerHTML=`<p class="feedback bad"><strong>Ese campo cumple otra función.</strong> Lee su explicación y vuelve a buscar. ${proto!==q.proto?'Cambia a la cabecera '+(q.proto==='tcp'?'TCP':'IPv4')+'.':''}</p>`;
          }
        }
        else if(b.hasAttribute('data-header-options'))root.querySelector('.packet-field-inspector').innerHTML=`<span class="eyebrow">CAMPO CONDICIONAL</span><h3>Opciones y relleno</h3><p>Amplían la cabecera cuando es necesario. El relleno alinea su longitud a palabras de 32 bits.</p><p>En este ejemplo no hay opciones: ${proto==='tcp'?'Data Offset':'IHL'}=5, por lo que la cabecera ocupa 20 bytes. La fila discontinua solo muestra dónde aparecerían.</p>`;
        else if(b.hasAttribute('data-save-rfc')){const text=root.querySelector('#packet-rfc-reflection').value.trim();if(!text){root.querySelector('.packet-rfc-status').textContent='Escribe primero tu explicación.';return;}api.save('headers.reflection',text);record(api,'headers.reflection',{question:'Dos campos del RFC y su función',answer:text,review:'Respuesta abierta para revisar en clase'});root.querySelector('.packet-rfc-status').textContent='Explicación guardada en este navegador.';}
      };
      const input=e=>{if(e.target.id==='packet-rfc-reflection')api.save('headers.reflection',e.target.value);};
      root.querySelector('#packet-rfc-reflection').value=get(api,'headers.reflection','');
      root.addEventListener('click',click);root.addEventListener('input',input);drawGrid();
      return ()=>{root.removeEventListener('click',click);root.removeEventListener('input',input);};
    }
  };
})();

const $=s=>document.querySelector(s);
const elements=['Puesto de trabajo','Roseta RJ45','Armario / rack','Patch panel','Switch','Router','Punto de acceso wifi','Servidor','Cable Cat 6','Fibra óptica','Cableado horizontal','Cableado vertical / backbone','Zona de trabajo','Distribuidor','Otro elemento'];

let state={marks:[[]],notes:[''],student:''};
try{const old=JSON.parse(localStorage.getItem('ad1-office-design-v1'));if(old&&old.marks?.length===1)state=old}catch{}
let index=0,mode='mark',start=null,img=new Image(),cursor=null;
const canvas=$('#canvas'),ctx=canvas.getContext('2d');
function save(){try{localStorage.setItem('ad1-office-design-v1',JSON.stringify(state));$('#saved').textContent='Guardado local en este navegador.'}catch{$('#saved').textContent='No se pudo guardar. Descarga tu trabajo para conservarlo.'}}
function render(c=canvas,im=img,marks=state.marks[index]){const x=c.getContext('2d');c.width=im.naturalWidth;c.height=im.naturalHeight;x.fillStyle='white';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0);const scale=c.width/800;marks.forEach((m,i)=>{x.lineWidth=3*scale;x.strokeStyle='#087ee0';x.fillStyle='#125c4b';if(m.type==='line'){x.beginPath();x.moveTo(m.x*c.width,m.y*c.height);x.lineTo(m.ex*c.width,m.ey*c.height);x.stroke()}else{let px=m.x*c.width,py=m.y*c.height;x.beginPath();x.arc(px,py,12*scale,0,7);x.fill();x.fillStyle='white';x.font=`bold ${11*scale}px Arial`;x.textAlign='center';x.textBaseline='middle';x.fillText(i+1,px,py);x.font=`${11*scale}px Arial`;const w=x.measureText(m.label).width+12*scale;let tx=Math.max(0,Math.min(px+15*scale,c.width-w));let ty=Math.max(0,Math.min(py-28*scale,c.height-22*scale));x.fillStyle='#fff';x.fillRect(tx,ty,w,21*scale);x.strokeStyle='#125c4b';x.lineWidth=scale;x.strokeRect(tx,ty,w,21*scale);x.fillStyle='#172e32';x.textAlign='left';x.fillText(m.label,tx+6*scale,ty+10.5*scale)}});if(c===canvas){$('#count').textContent=marks.length+' marcas';if(start){x.fillStyle='#d88000';x.beginPath();x.arc(start.x*c.width,start.y*c.height,6*scale,0,7);x.fill()}if(cursor){x.strokeStyle='#d88000';x.lineWidth=2;x.strokeRect(cursor.x*c.width-8,cursor.y*c.height-8,16,16)}}}

function place(x,y){if(mode==='line'){if(!start){start={x,y};$('#help').textContent='Ahora marca el final de este tramo.';render();return}state.marks[index].push({type:'line',...start,ex:x,ey:y});start=null;$('#help').textContent='Marca el inicio y el final de cada tramo.'}else state.marks[index].push({type:'mark',x,y,label:$('#element').value});save();render()}
canvas.onclick=e=>{const r=canvas.getBoundingClientRect();place((e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height)};canvas.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter','Escape'].includes(e.key))return;e.preventDefault();cursor ||= {x:.5,y:.5};if(e.key==='Enter')place(cursor.x,cursor.y);else if(e.key==='Escape'){start=null;cursor=null}else{cursor.x=Math.max(.01,Math.min(.99,cursor.x+(e.key==='ArrowRight'?.015:e.key==='ArrowLeft'?-.015:0)));cursor.y=Math.max(.01,Math.min(.99,cursor.y+(e.key==='ArrowDown'?.015:e.key==='ArrowUp'?-.015:0)))}render()};
['mark','line'].forEach(m=>$('#'+m).onclick=()=>{mode=m;start=null;$('#mark').classList.toggle('active',m==='mark');$('#line').classList.toggle('active',m==='line');$('#help').textContent=m==='mark'?'Pulsa sobre la imagen para colocar una etiqueta.':'Marca el inicio y el final de cada tramo.';render()});$('#undo').onclick=()=>{if(start)start=null;else state.marks[index].pop();save();render()};$('#reflection').oninput=e=>{state.notes[index]=e.target.value;save()};
function download(data,name,type){const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)}
$('#download').onclick=()=>{const c=document.createElement('canvas');render(c);c.toBlob(b=>download(b,'AD1-ampliacion.png','image/png'))};

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

elements.forEach(e=>{const o=document.createElement('option');o.textContent=e;$('#element').append(o)});
$('#reflection').value=state.notes[0]||'';
$('#student').value=state.student||'';
$('#student').oninput=e=>{state.student=e.target.value;save()};
$('#print').onclick=()=>window.print();
$('#report').onclick=()=>{
 if(!img.complete||!img.naturalWidth){alert('Espera a que termine de cargar el plano.');return}
 const c=document.createElement('canvas');render(c);
 const html='<!doctype html><html lang="es"><meta charset="utf-8"><title>AD1 · Ampliación</title><style>body{font:16px Arial;max-width:1000px;margin:30px auto;padding:20px}img{max-width:100%}p{white-space:pre-wrap}</style><h1>AD1 · Diseño de una oficina</h1><p>'+esc(state.student)+'</p><img src="'+c.toDataURL('image/png')+'" alt="Plano con el diseño de red"><h2>Tu explicación</h2><p>'+esc(state.notes[0])+'</p></html>';
 download(html,'AD1-ampliacion-entrega.html','text/html;charset=utf-8');
};
$('#download').disabled=true;$('#report').disabled=true;
img.onload=()=>{render();$('#download').disabled=false;$('#report').disabled=false};
img.onerror=()=>{$('#saved').textContent='No se pudo cargar el plano. Recarga la página para intentarlo de nuevo.'};
img.src='assets/oficina-ampliacion.png';

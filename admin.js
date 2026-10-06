(()=>{
 const editor=document.querySelector('#editor'),status=document.querySelector('#status'),save=document.querySelector('#save');
 const labels={index:'Startsida',sortiment:'Sortiment',kalastartor:'Kalastårtor',galleri:'Galleri',cafe:'Café','om-oss':'Om oss',gemensamt:'Gemensamt · sidfot, kontakt & varukorg'};
 let content,revision,tab='visual',selected='index',dirty=false,busy=false,query='',visual;
 const el=(tag,props={},...children)=>{const e=document.createElement(tag);for(const [key,value] of Object.entries(props)){if(key.startsWith('on'))e.addEventListener(key.slice(2),value);else if(key==='class')e.className=value;else if(key==='text')e.textContent=value;else if(key in e)e[key]=value;else e.setAttribute(key,value);}e.append(...children);return e;};
 const message=(text,error=false)=>{status.textContent=text;status.classList.toggle('error',error);};
 const changed=()=>{dirty=true;save.disabled=busy;document.querySelector('#version').textContent='Du har osparade ändringar';document.querySelector('#version').classList.add('unsaved');};
 const field=(label,value,change,{type='text',area=false}={})=>el('label',{text:label},el(area?'textarea':'input',{type,value,oninput:e=>{change(e.target.value);changed();}}));
 const select=(items,value,change)=>el('select',{onchange:e=>change(e.target.value)},...items.map(([id,name])=>el('option',{value:id,text:name,selected:id===value})));
 const pagePicker=()=>select(Object.entries(labels),selected,value=>{selected=value;render();});
 function render(){
  document.body.classList.toggle('visual-admin',tab==='visual');
  editor.replaceChildren();
  if(tab==='visual'){
   visual??=window.createVisualEditor({el,editor,getContent:()=>content,changed,field,select,labels,upload,withUpload,message});
   visual.render();return;
  }
  if(tab==='texts'){
   editor.append(el('div',{class:'toolbar'},el('label',{text:'Sida'},pagePicker()),field('Sök i innehållet',query,value=>{query=value;renderTexts();})));
   editor.append(el('div',{id:'text-fields'}));renderTexts();
  }
  if(tab==='products'){
   editor.append(el('div',{class:'toolbar'},el('p',{class:'help',text:'Produkter visas i sortimentet. Lämna priset tomt när priset ska bekräftas via telefon.'}),el('button',{text:'Lägg till produkt',onclick:()=>{content.products.unshift({id:'produkt-'+crypto.randomUUID(),name:'Ny produkt',category:'Övrigt',description:'',price:null,tags:[]});changed();render();}})));
   content.products.forEach((p,index)=>{
    const card=el('article',{class:'product','data-product':p.id},field('Produktnamn',p.name,v=>p.name=v),field('Kategori',p.category,v=>p.category=v),field('Beskrivning',p.description,v=>p.description=v,{area:true}),field('Pris i kronor',p.price??'',v=>p.price=v===''?null:Number(v),{type:'number'}),field('Etiketter (kommatecken mellan)',p.tags.join(', '),v=>p.tags=v.split(',').map(x=>x.trim()).filter(Boolean)),el('div',{class:'wide'},el('button',{class:'delete',text:'Ta bort produkt',onclick:()=>{if(!confirm('Ta bort '+p.name+' från sortimentet?'))return;content.products.splice(index,1);changed();render();}})));
    editor.append(card);
   });
  }
  if(tab==='images'){
   const groups=[['page','Sidbilder & logotyp'],...Object.keys(content.galleries).map(k=>[k,labels[k]])];
   if(!groups.some(x=>x[0]===selected))selected='galleri';
   editor.append(el('div',{class:'toolbar'},el('label',{text:'Bildsamling'},select(groups,selected,v=>{selected=v;render();})),selected!=='page'?el('label',{text:'Lägg till bilder'},el('input',{type:'file',accept:'image/*',multiple:true,onchange:async e=>{const files=[...e.target.files];await uploadMany(files);}})):el('span')));
   editor.append(el('p',{class:'help',text:'Bilder optimeras automatiskt vid uppladdning. Spara ändringarna för att visa dem på webbplatsen. Att ta bort en bild från ett galleri raderar inte originalfilen.'}));
   const grid=el('div',{class:'photos'});editor.append(grid);
   const entries=selected==='page'?Object.entries(content.images):content.galleries[selected].map((p,i)=>[i,p]);
   for(const [key,p] of entries){
    const card=el('article',{class:'photo'},el('img',{src:p.src,alt:p.alt,loading:'lazy'}));
    if(selected==='page')card.append(el('h3',{text:(labels[p.page]||p.page)+' · '+p.label}));
    card.append(field('Bildbeskrivning',p.alt,v=>p.alt=v),el('label',{text:'Byt bild'},el('input',{type:'file',accept:'image/*',onchange:async e=>{if(e.target.files[0]){await withUpload(async()=>Object.assign(p,await upload(e.target.files[0])));render();}}})));
    if(selected!=='page')card.append(el('div',{class:'actions'},el('button',{text:'↑',ariaLabel:'Flytta bild uppåt',disabled:key===0,onclick:()=>{const a=content.galleries[selected];[a[key-1],a[key]]=[a[key],a[key-1]];changed();render();}}),el('button',{text:'↓',ariaLabel:'Flytta bild nedåt',disabled:key===entries.length-1,onclick:()=>{const a=content.galleries[selected];[a[key],a[key+1]]=[a[key+1],a[key]];changed();render();}}),el('button',{class:'delete',text:'Ta bort',onclick:()=>{content.galleries[selected].splice(key,1);changed();render();}})));
    grid.append(card);
   }
   if(!entries.length)grid.append(el('p',{class:'empty',text:'Inga bilder ännu. Lägg till en bild ovan.'}));
  }
 }
 function renderTexts(){const container=document.querySelector('#text-fields');container.replaceChildren();for(const [key,f] of Object.entries(content.fields)){if(f.page!==selected||query&&!((f.label+' '+f.value).toLowerCase().includes(query.toLowerCase())))continue;container.append(el('div',{class:'field'},field(f.label,f.value,v=>f.value=v,{area:f.type!=='url'}),el('small',{text:f.type==='url'?'Länk: https://, tel:, mailto: eller en befintlig sida.':'Texten visas på webbplatsen.'})));}}
 async function api(path,options){const response=await fetch(path,options);let body;try{body=await response.json()}catch{throw Error('Kunde inte nå servern. Dina ändringar finns kvar.')}if(!response.ok)throw Error(body.error||'Åtgärden misslyckades.');return body;}
 async function upload(file){
  if(!file.type.startsWith('image/')||file.size>30_000_000)throw Error('Välj en bild som är mindre än 30 MB.');
  const bitmap=await createImageBitmap(file);if(bitmap.width>15000||bitmap.height>15000){bitmap.close();throw Error('Bilden har för stora mått.');}
  const fullScale=Math.min(1,1920/Math.max(bitmap.width,bitmap.height));const dimensions={width:Math.max(1,Math.round(bitmap.width*fullScale)),height:Math.max(1,Math.round(bitmap.height*fullScale))};
  const convert=width=>new Promise((resolve,reject)=>{const canvas=document.createElement('canvas');const scale=Math.min(1,width/bitmap.width,(width===1920?1920:1280)/bitmap.height);canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*canvas.width/bitmap.width));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);canvas.toBlob(blob=>blob&&blob.type==='image/webp'?resolve(blob):reject(Error('Din webbläsare kunde inte optimera bilden. Prova Edge eller Chrome.')),'image/webp',.82);});
  try{const form=new FormData();form.append('thumb',await convert(640),'thumb.webp');form.append('full',await convert(1920),'full.webp');form.append('filename',file.name);const result=await api('/api/admin/upload',{method:'POST',body:form});return {...result,...dimensions,srcset:'',alt:file.name.replace(/\.[^.]+$/,'')};}finally{bitmap.close();}
 }
 async function withUpload(fn){if(busy)return;busy=true;editor.inert=true;save.disabled=true;message('Optimerar och laddar upp bilden…');try{await fn();changed();message('Bilden är uppladdad. Spara för att visa ändringen.');}catch(e){message(e.message,true)}finally{busy=false;editor.inert=false;save.disabled=!dirty;}}
 async function uploadMany(files){await withUpload(async()=>{for(const file of files){content.galleries[selected].push(await upload(file));changed();}});render();}
 document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>{if(busy)return;tab=button.dataset.tab;selected=tab==='images'?'galleri':'index';query='';document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render();}));
 save.addEventListener('click',async()=>{if(busy)return;busy=true;editor.inert=true;save.disabled=true;message('Sparar…');try{const result=await api('/api/admin/content',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({content,revision})});revision=result.revision;dirty=false;document.querySelector('#version').textContent='Sparat '+new Date(result.updatedAt).toLocaleString('sv-SE');document.querySelector('#version').classList.remove('unsaved');message('Ändringarna är sparade och visas nu på webbplatsen.');}catch(e){message(e.message,true)}finally{busy=false;editor.inert=false;save.disabled=!dirty;}});
 document.querySelector('#backup').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({revision,content},null,2)],{type:'application/json'}));const a=el('a',{href:url,download:'mullers-innehall-'+new Date().toISOString().slice(0,10)+'.json'});a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 window.addEventListener('beforeunload',e=>{if(dirty||busy){e.preventDefault();e.returnValue='';}});
 api('/api/admin/content').then(data=>{content=data.content;revision=data.revision;document.querySelector('#version').textContent=data.updatedAt?'Senast sparat '+new Date(data.updatedAt).toLocaleString('sv-SE'):'Alla sidor · texter, produkter och bilder';document.querySelector('#backup').disabled=false;render();}).catch(e=>{editor.replaceChildren(el('p',{text:e.message}),el('button',{text:'Försök igen',onclick:()=>location.reload()}));message(e.message,true);});
})();


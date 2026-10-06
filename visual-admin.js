window.createVisualEditor=function({el,editor,getContent,changed,field,select,labels,upload,withUpload,message}){
 let page='index',editing=true,selection=null,sections=[],ready=false,history=[],future=[],lastState=JSON.stringify(getContent()),timer,previewError=false;
 const frame=el('iframe',{title:'Webbplatsens förhandsvisning',id:'site-preview'});
 const inspector=el('aside',{class:'visual-inspector','aria-label':'Valt innehåll'});
 const pageSelect=select(Object.entries(labels).filter(([id])=>id!=='gemensamt'),page,value=>navigate(value));pageSelect.setAttribute('aria-label','Sida att redigera');
 const viewport=el('div',{class:'visual-viewport'},frame);
 const modeButton=el('button',{text:'Förhandsgranska',onclick:()=>{editing=!editing;modeButton.textContent=editing?'Förhandsgranska':'Fortsätt redigera';root.classList.toggle('preview-only',!editing);frame.contentWindow?.postMessage({source:'mullers-admin',type:'mode',editing},location.origin);}});
 const undo=el('button',{text:'Ångra',disabled:true,onclick:()=>travel(history,future)}),redo=el('button',{text:'Gör om',disabled:true,onclick:()=>travel(future,history)});
 const pageTools=el('div',{class:'visual-tools'},el('label',{text:'Sida'},pageSelect),el('div',{class:'visual-devices'},el('button',{text:'Dator',ariaPressed:'true',onclick:e=>device(false,e.currentTarget)}),el('button',{text:'Mobil',ariaPressed:'false',onclick:e=>device(true,e.currentTarget)})),undo,redo,modeButton);
 const workspace=el('div',{class:'visual-workspace'},viewport,inspector);
 const root=el('div',{class:'visual-editor'},pageTools,workspace);
 const content=()=>getContent();
 const publicDraft=()=>({...content(),fields:Object.fromEntries(Object.entries(content().fields).map(([key,f])=>[key,f.value]))});
 function sync(){if(ready)frame.contentWindow?.postMessage({source:'mullers-admin',type:'draft',content:publicDraft()},location.origin);}
 function remember(){clearTimeout(timer);history.push(lastState);if(history.length>60)history.shift();future=[];lastState=JSON.stringify(content());undo.disabled=false;redo.disabled=true;changed();sync();}
 function edit(change){change();remember();}
 function travel(from,to){if(!from.length)return;to.push(JSON.stringify(content()));const state=JSON.parse(from.pop());const target=content();Object.keys(target).forEach(key=>delete target[key]);Object.assign(target,state);lastState=JSON.stringify(target);undo.disabled=!history.length;redo.disabled=!future.length;changed();sync();showInspector();}
 function device(mobile,button){viewport.classList.toggle('phone-preview',mobile);pageTools.querySelectorAll('.visual-devices button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}
 function navigate(value){page=value;pageSelect.value=value;selection=null;ready=false;if(previewError){message('');previewError=false;}frame.src='/api/admin/preview?page='+encodeURIComponent(page);showInspector();}
 function input(label,value,change,options={}){const control=field(label,value,v=>edit(()=>change(v)),options);return control;}
 function imageControls(photo,replace){return el('div',{class:'inspector-image'},el('img',{src:photo.src,alt:photo.alt}),input('Bildbeskrivning',photo.alt,v=>photo.alt=v),el('label',{text:'Byt bild'},el('input',{type:'file',accept:'image/*',onchange:async e=>{const f=e.target.files[0];if(!f)return;await withUpload(async()=>{replace(await upload(f));remember();});showInspector();}})));}
 function positionControl(block){return el('label',{text:'Placering på sidan'},select([['main-end','Sist på sidan'],...sections.map(s=>[s.id,'Efter: '+s.label])],block.after,v=>edit(()=>block.after=v)));}
 function newBlock(type){content().blocks??={};content().blocks[page]??=[];const block={id:'block-'+crypto.randomUUID(),type,title:type==='image'?'Ny bild':type==='button'?'Ny knapp':'Ny rubrik',text:type==='text'?'Skriv din text här.':'',label:'Läs mer',href:'sortiment.html',after:selection?.anchor||'main-end',image:null};edit(()=>content().blocks[page].push(block));selection={kind:'block',key:block.id};showInspector();}
 function addImage(){content().galleries[page]??=[];const inputFile=el('input',{type:'file',accept:'image/*',onchange:async e=>{if(!e.target.files[0])return;await withUpload(async()=>{const photo=await upload(e.target.files[0]);edit(()=>content().galleries[page].push(photo));selection={kind:'gallery',key:page,index:content().galleries[page].length-1};});showInspector();}});inputFile.click();}
 function newProduct(){const product={id:'produkt-'+crypto.randomUUID(),name:'Ny produkt',category:'Övrigt',description:'',tags:[],price:null};edit(()=>content().products.unshift(product));selection={kind:'product',key:product.id};showInspector();}
 function additions(){const items=el('div',{class:'insert-blocks'},el('h3',{text:'Lägg till på sidan'}),el('button',{text:'+ Textavsnitt',onclick:()=>newBlock('text')}),el('button',{text:'+ Bildavsnitt',onclick:()=>newBlock('image')}),el('button',{text:'+ Knapp',onclick:()=>newBlock('button')}));if(page==='sortiment')items.append(el('button',{text:'+ Produkt',onclick:newProduct}));if(['galleri','kalastartor','cafe','om-oss'].includes(page))items.append(el('button',{text:'+ Bild i galleriet',onclick:addImage}));return items;}
 function showInspector(){
  inspector.replaceChildren(el('h2',{text:selection?'Redigera innehåll':'Klicka på sidan'}));
  if(!selection)inspector.append(el('p',{class:'help',text:'Klicka på en text, bild eller produkt i sidan för att ändra den. Du ser ändringen direkt här. Besökare ser den först när du publicerar.'}));
  const selected=selection;
  if(selected?.kind==='field'){
   const f=content().fields[selected.key];if(f){inspector.append(input(f.label,f.value,v=>f.value=v,{area:f.type!=='url'}));const marker=findMarker(selected.key);const parent=marker?.parentElement;const attrs=parent?.closest('[data-cms-attrs]')?.dataset.cmsAttrs;if(attrs)for(const [attribute,key] of Object.entries(JSON.parse(attrs))){const related=content().fields[key];if(related&&['href','title','aria-label'].includes(attribute))inspector.append(input(attribute==='href'?'Knappens eller textens länk':related.label,related.value,v=>related.value=v));}}
  }
  if(selected?.kind==='image'){const p=content().images[selected.key];if(p)inspector.append(imageControls(p,value=>Object.assign(p,value)));}
  if(selected?.kind==='gallery'){
   const list=content().galleries[selected.key],p=list?.[selected.index];if(p){inspector.append(imageControls(p,value=>Object.assign(p,value)),el('div',{class:'actions'},el('button',{text:'Flytta upp',disabled:selected.index===0,onclick:()=>{edit(()=>{[list[selected.index-1],list[selected.index]]=[list[selected.index],list[selected.index-1]];selected.index--;});showInspector();}}),el('button',{text:'Flytta ned',disabled:selected.index===list.length-1,onclick:()=>{edit(()=>{[list[selected.index+1],list[selected.index]]=[list[selected.index],list[selected.index+1]];selected.index++;});showInspector();}})),el('button',{class:'delete',text:'Ta bort bilden',onclick:()=>{edit(()=>list.splice(selected.index,1));selection=null;showInspector();}}));}
  }
  if(selected?.kind==='product'){
   const p=content().products.find(p=>p.id===selected.key);if(p)inspector.append(input('Produktnamn',p.name,v=>p.name=v),input('Kategori',p.category,v=>p.category=v),input('Beskrivning',p.description,v=>p.description=v,{area:true}),input('Pris i kronor',p.price??'',v=>p.price=v===''?null:Number(v),{type:'number'}),input('Etiketter',p.tags.join(', '),v=>p.tags=v.split(',').map(t=>t.trim()).filter(Boolean)),el('button',{class:'delete',text:'Ta bort produkten',onclick:()=>{edit(()=>content().products.splice(content().products.indexOf(p),1));selection=null;showInspector();}}));
  }
  if(selected?.kind==='block'){
   const list=content().blocks?.[page]||[],b=list.find(b=>b.id===selected.key);if(b){inspector.append(input('Rubrik',b.title,v=>b.title=v),input('Text',b.text,v=>b.text=v,{area:true}),positionControl(b));
    if(b.type==='button')inspector.append(input('Knapptext',b.label,v=>b.label=v),input('Länk',b.href,v=>b.href=v));
    if(b.type==='image'){if(b.image)inspector.append(imageControls(b.image,p=>b.image=p));else inspector.append(el('label',{text:'Välj bild'},el('input',{type:'file',accept:'image/*',onchange:async e=>{if(e.target.files[0]){await withUpload(async()=>{const p=await upload(e.target.files[0]);edit(()=>b.image=p);});showInspector();}}})));}
    const i=list.indexOf(b);inspector.append(el('div',{class:'actions'},el('button',{text:'Flytta upp',disabled:i===0,onclick:()=>{edit(()=>[list[i-1],list[i]]=[list[i],list[i-1]]);showInspector();}}),el('button',{text:'Flytta ned',disabled:i===list.length-1,onclick:()=>{edit(()=>[list[i+1],list[i]]=[list[i],list[i+1]]);showInspector();}})),el('button',{class:'delete',text:'Ta bort avsnittet',onclick:()=>{edit(()=>list.splice(i,1));selection=null;showInspector();}}));
   }
  }
  inspector.append(additions());
 }
 function findMarker(key){const doc=frame.contentDocument;if(!doc)return null;const walker=doc.createTreeWalker(doc,NodeFilter.SHOW_COMMENT);while(walker.nextNode())if(walker.currentNode.data==='cms:'+key)return walker.currentNode;return null;}
 window.addEventListener('message',event=>{if(event.source!==frame.contentWindow||event.origin!==location.origin||event.data?.source!=='mullers-visual')return;const data=event.data;if(data.type==='ready'){ready=true;sections=data.sections;sync();frame.contentWindow.postMessage({source:'mullers-admin',type:'mode',editing},location.origin);}if(data.type==='applied')sections=data.sections;if(data.type==='select'){selection=data.selection;showInspector();}if(data.type==='navigate')navigate(data.page);});
 frame.addEventListener('load',()=>{const doc=frame.contentDocument;if(doc?.URL.startsWith(location.origin+'/api/admin/preview')&&!doc.querySelector('main')){previewError=true;message('Förhandsvisningen kunde inte öppnas. Ladda om panelen och försök igen.',true);}});
 return {render(){editor.append(root);lastState=JSON.stringify(content());navigate(page);},sync};
};

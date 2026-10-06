(()=>{
 if(!window.VISUAL_PREVIEW)return;
 let editing=true,selection=null;
 const tell=data=>parent.postMessage({source:'mullers-visual',...data},location.origin);
 const style=document.createElement('style');style.textContent='html.visual-editing{cursor:default}.visual-selected{outline:2px solid #68adff!important;outline-offset:5px}.cms-added{white-space:pre-line}.cms-added img{max-width:100%;height:auto;max-height:700px;object-fit:contain}.visual-editing iframe{pointer-events:none}';document.head.append(style);document.documentElement.classList.add('visual-editing');
 function select(kind,key,target,extra={}){document.querySelectorAll('.visual-selected').forEach(e=>e.classList.remove('visual-selected'));target?.classList.add('visual-selected');selection={kind,key,...extra};tell({type:'select',selection});}
 const sections=()=>[...document.querySelectorAll('main>section,#rest>section')].filter(e=>!e.classList.contains('cms-added')).map((e,i)=>({id:'section-'+i,label:e.querySelector('h1,h2,h3')?.textContent.trim().slice(0,60)||'Avsnitt '+(i+1)}));
 const closestField=(target,event)=>{
  const candidates=[];const walker=document.createTreeWalker(target,NodeFilter.SHOW_COMMENT);
  while(walker.nextNode()){const marker=walker.currentNode;if(marker.data.startsWith('cms:')&&marker.nextSibling?.nodeType===Node.TEXT_NODE&&marker.nextSibling.textContent.trim())candidates.push(marker);}
  if(!candidates.length&&target.parentElement)return closestFieldParent(target);
  const caret=document.caretPositionFromPoint?.(event.clientX,event.clientY);return candidates.find(m=>m.nextSibling===caret?.offsetNode)||candidates[0];
 };
 const closestFieldParent=target=>{for(const n of target.childNodes)if(n.nodeType===Node.COMMENT_NODE&&n.data.startsWith('cms:'))return n;return null};
 document.addEventListener('click',event=>{
  const target=event.target instanceof Element?event.target:null;if(!target)return;
  if(!editing){const link=target.closest('a');if(link){event.preventDefault();const path=new URL(link.href).pathname.match(/^\/(index|sortiment|kalastartor|galleri|cafe|om-oss)\.html$/);if(path)tell({type:'navigate',page:path[1]});}return;}
  if(target.closest('.mobile-menu-toggle,.mobile-menu-close,#mobile-navigation,[data-cart],[data-close],#privacy-button,[data-category]'))return;
  const block=target.closest('[data-block-id]');if(block){event.preventDefault();event.stopImmediatePropagation();select('block',block.dataset.blockId,block);return;}
  const product=target.closest('.product');if(product){event.preventDefault();event.stopImmediatePropagation();select('product',product.querySelector('[data-add]')?.dataset.add,product);return;}
  const image=target.closest('img');if(image){event.preventDefault();event.stopImmediatePropagation();const gallery=image.closest('[data-cms-gallery],#gallery-photos');if(gallery){const key=gallery.dataset.cmsGallery||'galleri';select('gallery',key,image,{index:[...gallery.querySelectorAll('img')].indexOf(image)});}else if(image.dataset.cmsImage)select('image',image.dataset.cmsImage,image);return;}
  const marker=closestField(target,event);if(marker){event.preventDefault();event.stopImmediatePropagation();const key=marker.data.slice(4);const anchor=target.closest('section')?.dataset.siteAnchor;select('field',key,marker.parentElement,{anchor});return;}
  const link=target.closest('a');if(link){event.preventDefault();event.stopImmediatePropagation();}
 },true);
 window.addEventListener('message',event=>{
  if(event.source!==parent||event.origin!==location.origin||event.data?.source!=='mullers-admin')return;
  const message=event.data;
  if(message.type==='mode'){editing=message.editing;document.documentElement.classList.toggle('visual-editing',editing);document.querySelectorAll('.visual-selected').forEach(e=>e.classList.remove('visual-selected'));return;}
  if(message.type==='draft'){
   window.SITE_CONTENT=message.content;menu.splice(0,menu.length,...message.content.products);categories.splice(0,categories.length,'Alla',...new Set(menu.map(p=>p.category)));
   if(typeof allItems!=='undefined'){allItems.splice(0,allItems.length,...menu);for(const id of cart.keys())if(!allItems.some(p=>p.id===id))cart.delete(id);renderCart();}
   if(document.querySelector('#products')){const active=document.querySelector('[data-category][aria-pressed=true]')?.dataset.category||'Alla';const current=categories.includes(active)?active:'Alla';const filters=document.querySelector('#filters');filters.replaceChildren(...categories.map(c=>{const b=document.createElement('button');b.dataset.category=c;b.textContent=c==='Alla'?cmsText('all','Alla'):c;b.setAttribute('aria-pressed',String(c===current));return b;}));renderProducts(current);}
   window.applySiteContent(message.content);
   const hero=message.content.images['background.hero'];if(hero&&document.querySelector('.reference-hero'))document.querySelector('.reference-hero').style.backgroundImage=`linear-gradient(#151311eb,#151311e8 55%,#151311f8),url("${matchMedia('(max-width:700px)').matches?hero.src:hero.full}")`;
   if(selection?.kind==='block')document.querySelector('[data-block-id="'+selection.key+'"]')?.classList.add('visual-selected');
   tell({type:'applied',sections:sections()});
  }
 });
 tell({type:'ready',sections:sections()});
})();

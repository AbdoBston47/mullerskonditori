window.applySiteContent=function(content){
 if(!content)return;
 const comments=document.createTreeWalker(document,NodeFilter.SHOW_COMMENT);const markers=[];
 while(comments.nextNode())if(comments.currentNode.data.startsWith('cms:'))markers.push(comments.currentNode);
 for(const marker of markers){const key=marker.data.slice(4),value=content.fields[key];if(typeof value==='string'&&marker.nextSibling?.nodeType===Node.TEXT_NODE)marker.nextSibling.textContent=value;}
 for(const el of document.querySelectorAll('[data-cms-attrs]'))for(const [attribute,key] of Object.entries(JSON.parse(el.dataset.cmsAttrs))){const value=content.fields[key];if(typeof value==='string')el.setAttribute(attribute,value);}
 for(const el of document.querySelectorAll('[data-cms-title]'))el.textContent=content.fields[el.dataset.cmsTitle]||el.textContent;
 const setPhoto=(img,p)=>{img.src=p.src;img.alt=p.alt;img.width=p.width;img.height=p.height;img.style.aspectRatio=`${p.width}/${p.height}`;img.dataset.full=p.full||p.src;if(p.srcset)img.srcset=p.srcset;else img.removeAttribute('srcset');};
 for(const img of document.querySelectorAll('[data-cms-image]'))if(content.images[img.dataset.cmsImage])setPhoto(img,content.images[img.dataset.cmsImage]);
 for(const el of document.querySelectorAll('[data-cms-gallery],#gallery-photos')){
  const key=el.dataset.cmsGallery||'galleri';el.replaceChildren();
  for(const p of content.galleries[key]||[]){const figure=document.createElement('figure');figure.className='gallery-card';const button=document.createElement('button');button.type='button';button.className='gallery-open';button.setAttribute('aria-label','Visa större bild: '+p.alt);const img=document.createElement('img');img.loading='lazy';img.decoding='async';img.sizes='(max-width: 600px) 92vw, (max-width: 979px) 46vw, 420px';setPhoto(img,p);button.append(img);figure.append(button);el.append(figure);}
 }
 // A removed product must never leave a broken add-to-cart shortcut.
 document.querySelectorAll('[data-add]').forEach(b=>{if(!content.products.some(p=>p.id===b.dataset.add)){b.disabled=true;b.textContent=cmsText('unavailable','Inte tillgänglig');}});
 document.querySelectorAll('.cms-added').forEach(el=>el.remove());
 const page=document.body.dataset.page||'index';
 const anchors=[...document.querySelectorAll('main>section,#rest>section')];
 anchors.forEach((section,index)=>section.dataset.siteAnchor='section-'+index);
 const inserted=new Map();
 for(const block of content.blocks?.[page]||[]){
  const section=document.createElement('section');section.className='wrap section cms-added';section.dataset.blockId=block.id;
  const heading=document.createElement('h2');heading.textContent=block.title;section.append(heading);
  if(block.type==='image'&&block.image){const img=document.createElement('img');setPhoto(img,block.image);img.loading='lazy';img.decoding='async';img.sizes='(max-width:700px) 92vw, 960px';section.append(img);}
  if(block.text){const p=document.createElement('p');p.textContent=block.text;section.append(p);}
  if(block.type==='button'){const a=document.createElement('a');a.className='button gold';a.textContent=block.label;a.href=block.href;section.append(a);}
  const anchor=inserted.get(block.after)||anchors.find(a=>a.dataset.siteAnchor===block.after);
  if(anchor){anchor.after(section);inserted.set(block.after,section);}else document.querySelector('#rest').before(section);
 }
};
window.applySiteContent(window.SITE_CONTENT);

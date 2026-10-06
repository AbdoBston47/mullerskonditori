(()=>{
 const buttons=[...document.querySelectorAll('.gallery-open')];
 if(!buttons.length)return;
 const dialog=document.createElement('dialog');
 dialog.className='photo-dialog';
 dialog.setAttribute('aria-label','Bildvisning');
 dialog.innerHTML='<div class="photo-toolbar"><p id="photo-position" aria-live="polite"></p><button class="photo-close" type="button">Stäng</button></div><div class="photo-stage"><img alt=""></div><div class="photo-nav"><button type="button" data-photo-prev>Föregående</button><button type="button" data-photo-next>Nästa</button></div>';
 dialog.querySelector('.photo-close').textContent=cmsText('close','Stäng');dialog.querySelector('[data-photo-prev]').textContent=cmsText('previous','Föregående');dialog.querySelector('[data-photo-next]').textContent=cmsText('next','Nästa');
 document.body.append(dialog);
 const image=dialog.querySelector('.photo-stage img');
 const position=dialog.querySelector('#photo-position');
 let selected=0;
 function show(index){
  selected=(index+buttons.length)%buttons.length;
  const source=buttons[selected].querySelector('img');
  image.src=source.dataset.full||source.src;image.alt=source.alt;
  position.textContent=`Bild ${selected+1} av ${buttons.length}`;
 }
 buttons.forEach((button,index)=>button.addEventListener('click',()=>{show(index);dialog.showModal()}));
 dialog.querySelector('.photo-close').addEventListener('click',()=>dialog.close());
 dialog.querySelector('[data-photo-prev]').addEventListener('click',()=>show(selected-1));
 dialog.querySelector('[data-photo-next]').addEventListener('click',()=>show(selected+1));
 dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();show(selected-1)}if(e.key==='ArrowRight'){e.preventDefault();show(selected+1)}});
 dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const rect=dialog.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)dialog.close()});
})();

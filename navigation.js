(()=>{
 const trigger=document.querySelector('.mobile-menu-toggle');
 const desktopNav=document.querySelector('.header nav');
 if(!trigger||!desktopNav)return;
 const drawer=document.createElement('dialog');
 drawer.id='mobile-navigation';
 drawer.className='mobile-drawer';
 drawer.setAttribute('aria-labelledby','mobile-menu-title');
 drawer.innerHTML='<div class="mobile-menu-head"><h2 id="mobile-menu-title">Meny</h2><button class="mobile-menu-close" type="button" aria-label="Stäng menyn">Stäng</button></div>';
 drawer.querySelector('h2').textContent=cmsText('menu','Meny');drawer.querySelector('.mobile-menu-close').textContent=cmsText('close','Stäng');
 const nav=desktopNav.cloneNode(true);
 nav.setAttribute('aria-label','Mobilmeny');
 const home=document.createElement('a');
 home.href='index.html';home.textContent=cmsText('home','Hem');
 if(!document.body.dataset.page){home.className='active';home.setAttribute('aria-current','page')}
 nav.prepend(home);drawer.append(nav);document.body.append(drawer);
 const close=()=>drawer.close();
 trigger.addEventListener('click',()=>{
  drawer.showModal();
  trigger.setAttribute('aria-expanded','true');
  document.documentElement.classList.add('nav-open');
 });
 drawer.querySelector('.mobile-menu-close').addEventListener('click',close);
 nav.addEventListener('click',e=>{if(e.target.closest('a'))close()});
 drawer.addEventListener('close',()=>{
  trigger.setAttribute('aria-expanded','false');
  document.documentElement.classList.remove('nav-open');
 });
 drawer.addEventListener('click',e=>{
  if(e.target!==drawer)return;
  const r=drawer.getBoundingClientRect();
  if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();
 });
 const mobile=window.matchMedia('(max-width:979px)');
 mobile.addEventListener('change',e=>{if(!e.matches&&drawer.open)close()});
})();

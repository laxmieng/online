/* Product-card gallery controls and routing to dedicated specification pages */
window.showProduct=function(id){location.href='product-specification.html?id='+encodeURIComponent(id)};
document.querySelectorAll('.image-slider').forEach((slider)=>{
  const images=[...slider.querySelectorAll('img')]; if(images.length<2)return;
  let current=0; const move=(step)=>{images[current].style.opacity='0';current=(current+step+images.length)%images.length;images[current].style.opacity='1'};
  const prev=document.createElement('button');prev.className='glass-slide glass-prev';prev.type='button';prev.setAttribute('aria-label','Previous product image');prev.textContent='‹';
  const next=document.createElement('button');next.className='glass-slide glass-next';next.type='button';next.setAttribute('aria-label','Next product image');next.textContent='›';
  prev.onclick=(e)=>{e.stopPropagation();move(-1)};next.onclick=(e)=>{e.stopPropagation();move(1)};slider.append(prev,next);
  setInterval(()=>move(1),3500);
});

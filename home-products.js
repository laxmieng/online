const homeProducts=[
  {id:'horizontal-south',type:'Horizontal Bandsaw',name:'42″ Horizontal Band Saw Machine',images:['assets/products/horizontal-south/horizontal-south-1.png','assets/products/horizontal-south/horizontal-south-2.png','assets/products/horizontal-south/horizontal-south-3.png']},
  {id:'vertical12',type:'Vertical Bandsaw',name:'42″ Vertical Band Saw Machine · 12″ × 12″',images:['assets/products/vertical12/vertical12-1.png','assets/products/vertical12/vertical12-2.png','assets/products/vertical12/vertical12-3.png']},
  {id:'vertical16',type:'Vertical Bandsaw',name:'42″ Vertical Band Saw Machine · 16″ × 16″',images:['assets/products/vertical16/vertical16-1.png','assets/products/vertical16/vertical16-2.png','assets/products/vertical16/vertical16-3.png']}
];
const homeProductHost=document.getElementById('home-product-grid');
if(homeProductHost){
  homeProductHost.innerHTML=homeProducts.map(product=>`<article class="home-product-card"><div class="home-product-gallery">${product.images.map((image,index)=>`<img src="${image}" class="${index===0?'active':''}" alt="${product.name}">`).join('')}<span class="home-product-badge">Made in India</span><div class="home-product-dots">${product.images.map((_,index)=>`<i class="${index===0?'active':''}"></i>`).join('')}</div></div><div class="home-product-copy"><p>${product.type}</p><h3>${product.name}</h3><a href="product-specification.html?id=${product.id}">View specifications <span>→</span></a></div></article>`).join('');
  document.querySelectorAll('.home-product-card').forEach(card=>{const images=[...card.querySelectorAll('.home-product-gallery img')],dots=[...card.querySelectorAll('.home-product-dots i')];let index=0;setInterval(()=>{images[index].classList.remove('active');dots[index].classList.remove('active');index=(index+1)%images.length;images[index].classList.add('active');dots[index].classList.add('active')},3200)});
}

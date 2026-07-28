const inquiryForm=document.getElementById('inquiry-form');
if(inquiryForm){
  inquiryForm.addEventListener('submit',event=>{
    event.preventDefault();
    const data=new FormData(inquiryForm);
    const selected=data.getAll('products');
    const products=selected.length?selected.join(', '):'General inquiry';
    const message=[
      '*New Inquiry - Laxmi Engineering*',
      '',
      `Name: ${data.get('name')||''}`,
      `Phone: ${data.get('phone')||''}`,
      `Email: ${data.get('email')||''}`,
      `Products / Services: ${products}`,
      '',
      `Requirement: ${data.get('message')||''}`
    ].join('\n');
    window.open('https://wa.me/919477090833?text='+encodeURIComponent(message),'_blank','noopener');
  });
}

window.LePdfDownload={
 // Fixed A4 pages, with proportional fitting for modest overflow and safe long-document breaks.
 plan(height,width,blocks=[]){
  if(!Number.isFinite(height)||height<=0||!Number.isFinite(width)||width<=0)throw Error('The quotation preview has no printable size.');
  const pageWidth=210,pageHeight=297,scale=pageWidth/width,maxHeight=Math.floor(pageHeight/scale);
  if(height<=maxHeight/0.8){const fit=Math.min(scale,pageHeight/height);return {pageWidth,pageHeight,sections:[{start:0,end:height,x:(pageWidth-width*fit)/2,y:0,width:width*fit,height:height*fit}]}}
  const sections=[];let start=0;while(start<height){let end=Math.min(height,start+maxHeight);if(end<height){const crossing=blocks.find(b=>b.top<end&&b.bottom>end&&b.top>start+1);if(crossing)end=Math.floor(crossing.top)}if(end<=start)end=Math.min(height,start+maxHeight);sections.push({start,end,x:0,y:0,width:pageWidth,height:(end-start)*scale});start=end}
  return {pageWidth,pageHeight,sections};
 },async create(q,info){
 if(typeof window.html2canvas!=='function')throw Error('The PDF renderer is missing. Please open the updated website file.');
 const frame=document.createElement('iframe');
 frame.setAttribute('aria-hidden','true');
 frame.style.cssText='position:fixed;left:-12000px;top:0;width:1000px;height:1200px;border:0;pointer-events:none';
 document.body.appendChild(frame);
 try{
  const page=frame.contentDocument;
  const css=Array.from(document.styleSheets).map(sheet=>Array.from(sheet.cssRules).map(rule=>rule.cssText).join('\n')).join('\n');
  page.open();page.write('<!doctype html><html><head><meta charset="utf-8"><style>'+css+'</style><style>html,body{margin:0!important;padding:0!important;background:white!important}#pdf-export{width:760px;margin:0}.paper.premium-quotation{width:760px!important;min-width:760px!important;max-width:760px!important;box-sizing:border-box!important;zoom:1!important;transform:none!important;margin:0!important;box-shadow:none!important}</style></head><body><div id="pdf-export"></div></body></html>');page.close();
  page.getElementById('pdf-export').innerHTML=info.html;
  const paper=page.querySelector('.paper');
  const logo=paper.querySelector('.paper-logo');
  if(logo&&window.LePdfLogo?.data)logo.src=window.LePdfLogo.data;
  await Promise.all(Array.from(paper.querySelectorAll('img')).map(async img=>{try{await img.decode()}catch(error){if(img===logo)throw Error('The embedded company logo could not be decoded.');img.remove()}}));
  await page.fonts.ready;
  const width=760,height=Math.ceil(paper.getBoundingClientRect().height);
  const origin=paper.getBoundingClientRect().top;
  const blocks=Array.from(paper.querySelectorAll('.paper-head,.paper-contact-strip,.document-title-row,.customer-meta,thead,tbody tr,.pricing-summary,.terms-signature-row,.paper-foot')).map(el=>{const r=el.getBoundingClientRect();return {top:r.top-origin,bottom:r.bottom-origin}});
  const layout=window.LePdfDownload.plan(height,width,blocks);
  const doc=new window.jspdf.jsPDF({unit:'mm',format:'a4',orientation:'portrait',compress:true});
  let pages=0;
  for(const section of layout.sections){
   const canvas=await window.html2canvas(paper,{scale:3,width,height:section.end-section.start,y:section.start,backgroundColor:'#ffffff',logging:false,windowWidth:1000,windowHeight:1200,scrollX:0,scrollY:0,removeContainer:true});
   if(pages++)doc.addPage('a4','portrait');
   doc.addImage(canvas.toDataURL('image/png'),'PNG',section.x,section.y,section.width,section.height,undefined,'FAST');
   canvas.width=canvas.height=0;
  }
  // Keep exact quotation data available to Import PDF, even though the visible pages
  // are rendered from the shared preview to preserve its appearance.
  const editable={...q,signature:'',items:q.items.map(item=>({...item,image:''}))};
  const bytes=new TextEncoder().encode(JSON.stringify(editable));let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
  doc.setProperties({title:q.number+' - '+q.party,subject:'Customer quotation',author:'Laxmi Engineering',keywords:'LAXMI_QUOTE_V1:'+btoa(binary)});
  return {blob:doc.output('blob'),filename:(q.number+' - '+q.party).replace(/[<>:"/\\|?*\x00-\x1f]/g,'-').slice(0,160)+'.pdf',pages};
 }finally{frame.remove()}
}};

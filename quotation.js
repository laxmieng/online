window.leLocal.adoptSession();
const $=s=>document.querySelector(s),form=$('#editor');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(n);
const companyAddress='Par Dankuni More, P.O: Dankuni Coal Complex, District: Hooghly, Pin: 712310, West Bengal, India.';
const tagline='Manufacturing and Repairing Vertical  & Horizontal Band Saw Machine , Circular Machine, Genuine Spare Parts for Saw Mill & Timber Mart Since 1983.';
const terms=[
 "This offer will remain valid for 10 Days subject to increase in the price of Casting or Iron & Steel. If the price of Casting or Iron & Steel increases on or before the date of delivery, the increased price shall be payable over these rates.",
 "50% advance payment upon order confirmation. Balance payable on the day of Delivery.",
 "All disputes are subject to Serampore Jurisdiction.",
 "We assure you of our best services & Co-Operation always."
];
const quotationNote="Note : Without Motor , Motor Accessories & Saw Blade / Tranport Charge Extra .";
let editorStep=1;
let records=[],items=[],signature='',editingId=null,dirty=false,toastTimer;
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const dateText=value=>{const [y,m,d]=value.split('-');return `${d}/${m}/${y}`};
const newItem=()=>({name:'',description:'',qty:1,per:'Set',rate:0,image:''});
const lineAmount=item=>Math.round(Number(item.qty)*Number(item.rate)*100)/100;
function totals(quote){const packingCharge=(quote.packingMode==='including'||quote.packingMode==='none')?0:Math.round(Math.max(0,Number(quote.packingCharge)||0)*100)/100,transportCharge=(quote.transportMode==='including'||quote.transportMode==='none')?0:Math.round(Math.max(0,Number(quote.transportCharge)||0)*100)/100,itemTotal=Math.round(quote.items.reduce((sum,item)=>sum+lineAmount(item),0)*100)/100,subtotal=Math.round((itemTotal+packingCharge+transportCharge)*100)/100,gst=quote.gstEnabled?Math.round(subtotal*Number(quote.gstRate))/100:0;return{packingCharge,transportCharge,subtotal,gst,total:Math.round((subtotal+gst)*100)/100}}
function getQuote(){const d=Object.fromEntries(new FormData(form));return{id:editingId||window.leLocal.uuid(),date:d.date,number:d.number.trim(),party:d.party.trim(),address:d.address.trim(),taxid:d.taxid.trim(),contact:d.contact.trim(),packingMode:d.packingMode||'none',packingCharge:Number(d.packingCharge)||0,transportMode:d.transportMode||'none',transportCharge:Number(d.transportCharge)||0,gstMode:d.gstMode||'none',gstEnabled:d.gstMode==='custom',gstRate:Number(form.elements.gstRate.value)||0,items:structuredClone(items),signature,updatedAt:new Date().toISOString()}}
async function api(path,options={}){return window.leLocal.api(path,options)}
function toast(message){const host=$('#preview-dialog').open?$('#preview-dialog'):!$('#editor-dialog').hidden?$('#editor-dialog'):document.body;host.appendChild($('.toast'));clearTimeout(toastTimer);$('.toast').textContent=message;$('.toast').hidden=false;toastTimer=setTimeout(()=>$('.toast').hidden=true,4000)}
function updateTotals(){const included=form.elements.packingMode.value!=='custom';$('#packing-value-label').hidden=included;form.elements.packingCharge.disabled=included;const transportIncluded=form.elements.transportMode.value!=='custom';$('#transport-value-label').hidden=transportIncluded;form.elements.transportCharge.disabled=transportIncluded;const q=getQuote(),t=totals(q);$('#subtotal').textContent=money(t.subtotal);$('#gst-total').textContent=q.gstMode==='including'?'Including':money(t.gst);$('#grand').textContent=money(t.total);$('#gst-label').textContent=q.gstMode==='including'?'GST':`GST (${q.gstRate}%)`;$('#gst-control').hidden=!q.gstEnabled;form.elements.gstRate.disabled=!q.gstEnabled;$('#gst-line').hidden=!q.gstEnabled&&q.gstMode!=='including';items.forEach((item,i)=>{const el=$(`[data-amount="${i}"]`);if(el)el.textContent=money(lineAmount(item))})}
const itemPresets=[
 {
  "name": "42\" Vertical Band Saw Machine (12”X12” Body)",
  "description": "Foundation Bolt : 4 Pcs\nChundi Weight Stand : 1 Pcs\nMotor Stand : 1 Pcs"
 },
 {
  "name": "42\" Vertical Band Saw Machine (16”X16” Body)",
  "description": "Foundation Bolt : 4 Pcs\nChundi Weight Stand : 1 Pcs\nMotor Stand : 1 Pcs"
 },
 {
  "name": "42\" Horizontal Band Saw Machine (South Type Model)",
  "description": "Foundation Bolt : 8\nUp & Down System : With Motor\nRail Line : 70 Ft.\nTrolly Size :\nWise :    |    Excel :    |    10” Wheel"
 },
 {
  "name": "42\" Horizontal Band Saw Machine (Local Type Model)",
  "description": "Foundation Bolt : 8\nUp & Down System : With Motor\nRail Line : 70 Ft.\nTrolly Size : 10 Ft."
 }
];
function presetOptions(item,field){
 const value=item[field]||'',known=itemPresets.some(preset=>preset[field]===value);
 const options=[...new Map(itemPresets.map((preset,i)=>[preset[field],{...preset,index:i}])).values()];
 return '<option value="" disabled '+(!value?'selected':'')+'>Select '+(field==='name'?'item name':'description')+'</option>'+(value&&!known?'<option value="existing" selected>'+esc(value.replace(/\n/g,' • '))+'</option>':'')+options.map(preset=>`<option value="${preset.index}" ${value===preset[field]?'selected':''}>${esc(preset[field].replace(/\n/g,' • '))}</option>`).join('');
}
function renderItems(){
 $('#items').innerHTML=items.map((item,index)=>`<article class="item" data-index="${index}"><div class="item-top"><strong>ITEM ${String(index+1).padStart(2,'0')}</strong><button type="button" class="remove-item" data-remove="${index}" ${items.length===1?'disabled':''}>Remove ✕</button></div><div class="fields"><label class="full">Item name *<select required data-preset="name" aria-label="Choose item name from list">${presetOptions(item,'name')}</select><button type="button" class="text-button item-edit-toggle" data-edit-field="name">Edit item name</button><input hidden disabled data-key="name" maxlength="300" required aria-label="Edit item name" value="${esc(item.name)}"></label><label class="full">Description<select data-preset="description" aria-label="Choose description template">${presetOptions(item,'description')}</select><button type="button" class="text-button item-edit-toggle" data-edit-field="description">Edit description</button><textarea hidden disabled data-key="description" maxlength="5000" aria-label="Edit description">${esc(item.description)}</textarea></label><div class="item-numbers"><label>Quantity *<input data-key="qty" type="number" min="0.001" max="100000000" step="0.001" required value="${item.qty}"></label><label>Per<input data-key="per" maxlength="30" placeholder="Nos., Set, Kg…" value="${esc(item.per??'Set')}"></label><label>Rate (₹) *<input data-key="rate" type="number" min="0" max="100000000000" step="0.01" required value="${item.rate}"></label><label>Amount<output class="line-amount" data-amount="${index}">${money(lineAmount(item))}</output></label></div><div class="item-photo">${item.image?`<img src="${esc(item.image)}" alt="Item ${index+1} image">`:''}<label>Item image (optional)<input type="file" data-image="${index}" accept="image/png,image/jpeg,image/webp"></label>${item.image?`<button type="button" class="text-button" data-clear-image="${index}">Remove</button>`:''}</div></div></article>`).join('');
 $('#items').querySelectorAll('[data-key]').forEach(input=>input.oninput=()=>{const index=Number(input.closest('[data-index]').dataset.index);items[index][input.dataset.key]=['qty','rate'].includes(input.dataset.key)?Number(input.value):input.value;dirty=true;form.dataset.saved="false";updateTotals()});
 $('#items').querySelectorAll('[data-preset]').forEach(select=>select.onchange=()=>{if(select.value==='')return;const index=Number(select.closest('[data-index]').dataset.index),preset=itemPresets[Number(select.value)];if(!preset)return;if(select.dataset.preset==='name')items[index].name=preset.name;items[index].description=preset.description;dirty=true;form.dataset.saved="false";renderItems();updateTotals()});
 $('#items').querySelectorAll('[data-edit-field]').forEach(button=>button.onclick=()=>{const label=button.closest('label'),field=button.dataset.editField,editor=label.querySelector('[data-key]'),select=label.querySelector('select');if(!editor.hidden){if(!editor.reportValidity())return;renderItems();updateTotals();return}select.hidden=true;select.disabled=true;editor.hidden=false;editor.disabled=false;button.textContent='Done editing';editor.focus()});
 $('#items').querySelectorAll('[data-remove]').forEach(button=>button.onclick=()=>{items.splice(Number(button.dataset.remove),1);dirty=true;form.dataset.saved="false";renderItems();updateTotals()});
 $('#items').querySelectorAll('[data-image]').forEach(input=>input.onchange=async()=>{try{const picture=await readImage(input.files[0]);if(!picture)return;items[Number(input.dataset.image)].image=picture;dirty=true;form.dataset.saved="false";renderItems()}catch(error){toast(error.message);input.value=''}});
 $('#items').querySelectorAll('[data-clear-image]').forEach(button=>button.onclick=()=>{items[Number(button.dataset.clearImage)].image='';dirty=true;form.dataset.saved="false";renderItems()});
}
async function readImage(file){if(!file)return '';if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Please choose a PNG, JPG or WebP image.');if(file.size>3*1024*1024)throw Error('Please choose an image smaller than 3 MB.');const original=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Unable to read this image.'));reader.readAsDataURL(file)});const image=new Image();image.src=original;try{await image.decode()}catch{throw Error('This image could not be opened. Please choose another file.')}const canvas=document.createElement('canvas'),scale=Math.min(1,1100/Math.max(image.width,image.height));canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/png')}
function renderSignature(){$('#signature-preview').hidden=!signature;$('#signature-preview').src=signature||'';$('#remove-signature').hidden=!signature;if(editorStep===4)renderEditorReview()}
function nextNumber(){const prefix=`LE/${new Date().getFullYear()}/`;let max=0;records.forEach(record=>{if(record.number.startsWith(prefix))max=Math.max(max,Number(record.number.slice(prefix.length))||0)});return prefix+String(max+1).padStart(4,'0')}

function validateEditorStep(step){const panel=form.querySelector('[data-editor-step="'+step+'"]');const invalid=Array.from(panel.querySelectorAll('input,select,textarea')).find(field=>field.willValidate&&!field.validity.valid);if(invalid){setEditorStep(step,false);invalid.reportValidity();invalid.focus({preventScroll:true});invalid.scrollIntoView({block:'center'});return false}return true}
function renderEditorReview(){const host=$('#wizard-review-content');host.innerHTML='<div class="inline-preview-note"><span>PDF preview</span><div class="inline-zoom-controls" aria-label="Quotation preview zoom"><button type="button" data-inline-zoom="out" aria-label="Zoom out">−</button><output id="inline-zoom-value" aria-live="polite">Fit</output><button type="button" data-inline-zoom="in" aria-label="Zoom in">+</button><button type="button" data-inline-zoom="fit" class="inline-fit">Fit width</button></div></div><div class="inline-preview-viewport" tabindex="0" role="region" aria-label="Quotation preview. Scroll horizontally to explore when zoomed."><div class="inline-preview-stage"><div class="inline-preview-page">'+paper(getQuote())+'</div></div></div><p class="inline-preview-help">Use + and − to zoom. Scroll the page to see the full quotation.</p>';host.querySelectorAll('[data-inline-zoom]').forEach(button=>button.onclick=()=>{const action=button.dataset.inlineZoom;inlinePreviewZoom=action==='fit'?1:Math.max(.5,Math.min(4,inlinePreviewZoom*(action==='in'?1.25:.8)));fitInlineQuotationPreview();if(action==='fit'){const viewport=$('.inline-preview-viewport');viewport.scrollLeft=0;viewport.scrollTop=0}});host.querySelectorAll('img').forEach(img=>img.addEventListener('load',fitInlineQuotationPreview,{once:true}));requestAnimationFrame(fitInlineQuotationPreview)}
function setEditorStep(step,validate=true){step=Math.max(1,Math.min(4,Number(step)||1));if(validate&&step>editorStep){for(let n=1;n<step;n++)if(!validateEditorStep(n))return false}form.dataset.slideDirection=step<editorStep?'back':'forward';editorStep=step;form.querySelectorAll('[data-editor-step]').forEach(panel=>panel.hidden=Number(panel.dataset.editorStep)!==step);form.querySelectorAll('[data-go-step]').forEach(button=>{const n=Number(button.dataset.goStep);button.classList.toggle('active',n===step);button.classList.toggle('completed',n<step);if(n===step)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current')});$('#wizard-back').hidden=step===1;$('#wizard-next').hidden=step===4;$('#wizard-next').textContent=step===1?'Next: Items & pricing →':step===2?'Next: Taxes & Charges →':'Next: Signature & review →';$('#wizard-caption').textContent='Step '+step+' of 4';(step===4?$('#review-grand-anchor'):$('#charges-grand-anchor')).appendChild(form.querySelector('.grand'));if(step===4)renderEditorReview();$('.editor-scroll').scrollTop=0;if(typeof updateStepCompletion==='function')updateStepCompletion();return true}
$('#wizard-back').onclick=()=>setEditorStep(editorStep-1,false);
$('#wizard-next').onclick=()=>setEditorStep(editorStep+1);
form.querySelectorAll('[data-go-step]').forEach(button=>button.onclick=()=>setEditorStep(button.dataset.goStep));
function reset(open=true){form.dataset.saved="false";form.reset();editingId=null;items=[newItem()];signature='';form.elements.date.value=today();form.elements.number.value=nextNumber();$('#save-status').textContent='';renderItems();renderSignature();updateTotals();dirty=false;if(open)showEditor()}
function showEditor(){inlinePreviewZoom=1;form.hidden=false;$('#history').hidden=true;$('#editor-dialog').hidden=false;$('#editor-dialog-title').textContent=editingId?'Edit quotation':'New quotation';$('#new-nav').classList.add('active');$('#history-nav').classList.remove('active');setEditorStep(1,false);window.scrollTo({top:0,behavior:'smooth'});requestAnimationFrame(()=>form.elements.party.focus({preventScroll:true}))}
function showHistory(){if(dirty&&!confirm('Return to the dashboard without saving your latest changes?'))return;dirty=false;$('#editor-dialog').hidden=true;$('.quotation-heading h1').textContent='Quotation dashboard';form.hidden=true;$('#history').hidden=false;$('.dashboard-metrics').hidden=false;$('.dash-intro').hidden=false;$('#new-nav').classList.remove('active');$('#history-nav').classList.add('active');renderHistory();requestAnimationFrame(syncQuotationToolbarOffset)}
function load(record){if(dirty&&!confirm('Replace the current unsaved quotation?'))return;form.dataset.saved="true";editingId=record.id;for(const key of ['date','number','party','address','taxid','contact','gstRate'])form.elements[key].value=record[key]??'';form.elements.packingMode.value=record.packingMode==='none'?'none':record.packingMode==='including'?'including':'custom';form.elements.packingCharge.value=record.packingCharge??0;form.elements.transportMode.value=record.transportMode==='none'?'none':record.transportMode==='including'?'including':'custom';form.elements.transportCharge.value=record.transportCharge??0;form.elements.gstMode.value=record.gstMode==='including'?'including':record.gstEnabled?'custom':'none';items=structuredClone(record.items);signature=record.signature||'';$('#signature').value='';renderItems();renderSignature();updateTotals();dirty=false;showEditor();window.scrollTo({top:0,behavior:'smooth'});$('#save-status').textContent='Opened saved quotation.'}
function renderStats(){$('#saved-count').textContent=records.length;$('#metric-count').textContent=records.length;$('#metric-value').textContent=money(records.reduce((sum,q)=>sum+totals(q).total,0));$('#metric-month').textContent=records.filter(q=>q.date.startsWith(today().slice(0,7))).length;$('#metric-customers').textContent=new Set(records.map(q=>q.party.trim().toLowerCase()).filter(Boolean)).size}
let historyPage=1,previewRecord=null,fitPreview=true;
function historyPageData(all,search,sort,page,size){
 const needle=search.trim().toLowerCase();
 const matches=all.filter(q=>[q.number,q.party,q.contact,q.taxid,q.address].some(value=>String(value||'').toLowerCase().includes(needle)));
 matches.sort((a,b)=>sort==='party'?a.party.localeCompare(b.party):sort==='highest'?totals(b).total-totals(a).total:sort==='oldest'?String(a.updatedAt).localeCompare(String(b.updatedAt)):String(b.updatedAt).localeCompare(String(a.updatedAt)));
 const pages=Math.max(1,Math.ceil(matches.length/size)),current=Math.min(Math.max(1,page),pages);
 return {total:matches.length,pages,page:current,start:(current-1)*size,rows:matches.slice((current-1)*size,current*size)};
}
function renderHistory(){
 const filteredRecords=typeof filterQuotationRecords==='function'?filterQuotationRecords(records):records;const result=historyPageData(filteredRecords,$('#search').value,$('#history-sort').value,historyPage,Number($('#history-page-size').value));historyPage=result.page;
 if(typeof updateRecordInsight==='function')updateRecordInsight(result);$('#register-count').textContent=records.length+' '+(records.length===1?'quotation':'quotations');
 $('#records').innerHTML=result.rows.map(q=>`<tr><td data-label="Quotation"><b class="record-number">${esc(q.number)}</b><small>${q.items.length} ${q.items.length===1?'item':'items'} · ${q.gstMode==='including'?'GST including':q.gstEnabled?'GST '+esc(q.gstRate)+'%':'No GST'}</small></td><td data-label="Customer"><div class="record-customer"><span class="customer-avatar" aria-hidden="true">${esc(q.party.trim().slice(0,1).toUpperCase())}</span><div><b>${esc(q.party)}</b><small>${esc(q.contact||'No contact added')}</small></div></div></td><td data-label="Date"><span>${esc(dateText(q.date))}</span></td><td data-label="Total"><span class="card-total-caption">QUOTATION VALUE</span><strong class="record-total">${money(totals(q).total)}</strong><small>INR</small></td><td data-label="Actions"><div class="record-actions"><button type="button" class="record-action record-edit" data-open="${esc(q.id)}" aria-label="Open quotation ${esc(q.number)}"><span aria-hidden="true">✎</span> Open</button><button type="button" class="record-action" data-record-preview="${esc(q.id)}" aria-label="Preview quotation ${esc(q.number)}">Preview</button><button type="button" class="record-action" data-pdf="${esc(q.id)}" aria-label="Download PDF ${esc(q.number)}">↓ PDF</button><button type="button" class="record-action record-delete" data-delete="${esc(q.id)}" aria-label="Delete quotation ${esc(q.number)}">Delete</button></div></td></tr>`).join('');
 $('.register-table-wrap').hidden=result.total===0;$('.register-page-controls').hidden=result.pages<=1;$('#register-empty').hidden=result.total>0;
 const searching=Boolean($('#search').value.trim());
 $('#register-empty-title').textContent=searching?'No matching quotations.':'Your next quotation starts here.';
 $('#register-empty-copy').textContent=searching?'Try another customer name, phone number or quotation number.':'Saved quotations will appear here, ready to review and reuse.';
 $('#register-empty-action').textContent=searching?'Clear search':'＋ Create quotation';
 $('#history-result-count').textContent=result.total?`${result.start+1}–${result.start+result.rows.length} of ${result.total} quotations`:'0 quotations';
 $('#history-page-label').textContent=result.page+' / '+result.pages;$('#history-prev').disabled=result.page<=1;$('#history-next').disabled=result.page>=result.pages;
 $('#records').querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>load(records.find(q=>q.id===b.dataset.open)));
 $('#records').querySelectorAll('[data-record-preview]').forEach(b=>b.onclick=()=>openRecordPreview(records.find(q=>q.id===b.dataset.recordPreview)));
 $('#records').querySelectorAll('[data-pdf]').forEach(b=>b.onclick=()=>downloadQuote(records.find(q=>q.id===b.dataset.pdf)));
 $('#records').querySelectorAll('[data-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('Delete '+records.find(q=>q.id===b.dataset.delete).number+'? This cannot be undone.'))return;b.disabled=true;const remaining=records.filter(q=>q.id!==b.dataset.delete);try{await persist(remaining);records=remaining;renderHistory();renderStats();if(editingId===b.dataset.delete)dirty=true;form.dataset.saved="false";toast('Quotation deleted.')}catch(error){b.disabled=false;toast(error.message)}});
}
function fitRecordPreview(){const article=$('#preview-paper .paper');if(!article)return;article.style.zoom=fitPreview?String(Math.min(1,Math.max(.2,($('#preview-paper').clientWidth-24)/760))):'1';$('#preview-fit').textContent=fitPreview?'Actual size':'Fit width';$('#preview-fit').setAttribute('aria-pressed',String(fitPreview))}
function openRecordPreview(q){if(!q)return;previewRecord=q;fitPreview=true;$('#preview-dialog .preview-toolbar>b').textContent=q.number+' · '+q.party;$('#preview-paper').innerHTML=paper(q);if(!$('#preview-dialog').open)$('#preview-dialog').showModal();requestAnimationFrame(fitRecordPreview)}

async function persist(next){await api('quotations',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(next)})}
const validImage=src=>/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(src||'')?src:'';
function paper(q){
 const t=totals(q);
 return `<article class="paper premium-quotation">
 <header class="paper-head">
  <img class="paper-logo" src="assets/quotation-logo.webp" alt="Laxmi Engineering logo">
  <div class="paper-company"><span class="letterhead-kicker">ENGINEERING EXCELLENCE · SINCE 1983</span><h2>Laxmi Engineering</h2><p class="company-tagline">${esc(tagline)}</p><p class="company-address">${esc(companyAddress)}</p><p class="company-registration"><span><b>GSTIN:</b> 19AAFFM1306E1ZP</span><span><b>IEC No:</b> 0215007247</span></p></div>
 </header>
 <div class="paper-contact-strip"><div class="contact-group"><span class="contact-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3.1 5.18 2 2 0 0 1 5.1 3h3a1 1 0 0 1 1 .86l.5 3.3a1 1 0 0 1-.28.87L7.9 9.45a16 16 0 0 0 6.65 6.65l1.42-1.42a1 1 0 0 1 .87-.28l3.3.5a1 1 0 0 1 .86 1Z"/></svg></span><div class="contact-copy"><b>CALL</b><strong>9477090833 / 9883194050 / 9831043719</strong></div></div><div class="contact-group contact-email"><span class="contact-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></span><div class="contact-copy"><b>EMAIL</b><strong>office.laxmieng83@gmail.com</strong></div></div></div>
 <section class="document-title-row compact-document-title"><h1>Quotation</h1><div class="document-reference"><span class="compact-reference-number"><span>Quotation No.</span> <strong>${esc(q.number)}</strong></span><span class="compact-reference-date"><span>Date</span> <b>${esc(dateText(q.date))}</b></span></div></section>
 <section class="customer-meta"><div class="party-block"><h3>${esc(q.party)}</h3><p>${esc(q.address)}</p></div><div class="offer-meta"><div><span>GSTIN / PAN</span><b>${esc(q.taxid)||'—'}</b></div><div><span>CONTACT No.</span><b>${esc(q.contact)||'—'}</b></div></div></section>
 <table class="quote-table"><thead><tr><th>No.</th><th>Item & specifications</th><th class="number">Qty</th><th class="number">Rate (₹)</th><th class="number">Amount (₹)</th></tr></thead><tbody>${q.items.map((item,i)=>`<tr><td class="item-serial">${String(i+1).padStart(2,'0')}</td><td><b class="item-title">${esc(item.name)}</b>${item.description?`<div class="description"><ul>${String(item.description).split(/\r?\n/).filter(line=>line.trim()).map(line=>`<li>${esc(line)}</li>`).join('')}</ul></div>`:''}${validImage(item.image)?`<img src="${item.image}" alt="${esc(item.name)}">`:''}</td><td class="number quantity-with-unit">${esc(item.qty)}${(item.per??'Set').trim()?` <span class="quantity-unit">${esc(item.per??'Set')}</span>`:''}</td><td class="number">${money(item.rate)}</td><td class="number item-price">${money(lineAmount(item))}</td></tr>`).join('')}</tbody></table>
 <section class="pricing-summary"><div class="bank-details"><span class="paper-label">PAYMENT INFORMATION</span><h3>ICICI Bank <small>NEFT / RTGS / IMPS</small></h3><dl><div><dt>Account name</dt><dd>LAXMI ENGINEERING</dd></div><div><dt>Account number</dt><dd>527505500040</dd></div><div><dt>IFSC code</dt><dd>ICIC0001607</dd></div><div><dt>Branch</dt><dd>DANKUNI</dd></div></dl></div><div class="paper-totals ${q.gstEnabled?'with-gst':''}">${q.packingMode==='none'?'':`<div class="packing-cell"><span>Packing Charge</span><b>${q.packingMode==='including'?'Including':money(t.packingCharge)}</b></div>`}${q.transportMode==='none'?'':`<div class="packing-cell transport-cell"><span>Transportation</span><b>${q.transportMode==='including'?'Including':money(t.transportCharge)}</b></div>`}<div class="subtotal-cell"><span>Subtotal</span><b>${money(t.subtotal)}</b></div>${q.gstMode==='including'?'<div class="tax-cell"><span>GST</span><b>Including</b></div>':q.gstEnabled?`<div class="tax-cell"><span>GST (${esc(q.gstRate)}%)</span><b>${money(t.gst)}</b></div>`:''}<div class="final-total"><span>Grand Total</span><strong>${money(t.total)}</strong></div></div></section>
 <section class="terms-signature-row"><section class="paper-terms"><h3>Terms & conditions</h3><ol>${terms.map(term=>`<li>${esc(term)}</li>`).join('')}</ol><p class="quotation-note">${esc(quotationNote)}</p></section><section class="bank-sign"><div class="signature-box"><b>For Laxmi Engineering</b>${validImage(q.signature)?`<img src="${q.signature}" alt="Authorized signature">`:'<div class="signature-space"></div>'}<span>Authorized Signatory</span></div></section></section>
 <footer class="paper-foot"><strong>Thank you for choosing Laxmi Engineering.</strong><div class="pdf-social-icons"><a href="https://www.facebook.com/laxmieng83" aria-label="Facebook: laxmieng83"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.9 3.77-3.9 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.62.77-1.62 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12Z"/></svg><span>laxmieng83</span></a><a href="https://www.instagram.com/laxmieng83" aria-label="Instagram: laxmieng83"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg><span>laxmieng83</span></a><a href="https://www.youtube.com/@laxmieng83" aria-label="YouTube: @laxmieng83"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="1" y="4" width="22" height="16" rx="5" fill="currentColor"/><path d="m10 8 6 4-6 4Z" fill="white"/></svg><span>@laxmieng83</span></a></div></footer>
 </article>`;
}

function checkedQuote(){const firstInvalid=Array.from(form.querySelectorAll('input,select,textarea')).find(field=>field.willValidate&&!field.validity.valid);if(firstInvalid){const panel=firstInvalid.closest('[data-editor-step]');if(panel)setEditorStep(panel.dataset.editorStep,false)}if(!form.reportValidity()){const invalid=form.querySelector(':invalid');toast('Please complete '+(invalid?.closest('label')?.textContent.trim().split('\n')[0].slice(0,55)||'the required fields')+' before previewing, saving or downloading.');invalid?.scrollIntoView({block:'center'});return null;}const q=getQuote();if(!q.party||!q.address||!q.number||q.items.some(i=>!i.name.trim()||!Number.isFinite(i.qty)||i.qty<=0||!Number.isFinite(i.rate)||i.rate<0)){toast('Please complete the required details.');return null}return q}
let downloadingPdf=false;
async function downloadQuote(q){
 if(!q||downloadingPdf)return;
 downloadingPdf=true;$('#pdf-download-feedback').hidden=false;$('#pdf-download-status').hidden=false;$('#pdf-download-status').textContent='Preparing your PDF…';$('#pdf-download-link').hidden=true;
 const buttons=[...document.querySelectorAll('[data-pdf],#print,#dialog-print')];buttons.forEach(button=>{button.disabled=true;button.setAttribute('aria-busy','true')});toast('Preparing your PDF…');
 try{const result=await window.LePdfDownload.create(q,{html:paper(q),tagline,address:companyAddress,terms,note:quotationNote,totals,dateText});const url=window.parent.LEApp?.savePdf?window.parent.LEApp.savePdf(result.blob,result.filename):URL.createObjectURL(result.blob);const link=$('#pdf-download-link');link.href=url;link.download=result.filename;link.hidden=false;if(!window.parent.LEApp?.savePdf)link.click();$('#pdf-download-status').hidden=false;$('#pdf-download-status').textContent='PDF ready. If the download did not start, select Download ready PDF below.';toast('PDF ready. Check Downloads, or use Download ready PDF.');}
 catch(error){const message='PDF download failed. '+(error.message||'Please try again.');$('#pdf-download-status').hidden=false;$('#pdf-download-status').textContent=message;toast(message);}
 finally{downloadingPdf=false;buttons.forEach(button=>{button.disabled=false;button.removeAttribute('aria-busy')})}
}
form.addEventListener('input',()=>{dirty=true;form.dataset.saved="false";updateTotals()});
form.elements.packingMode.addEventListener('change',()=>{dirty=true;form.dataset.saved="false";updateTotals()});
form.elements.gstMode.addEventListener('change',()=>{dirty=true;form.dataset.saved="false";updateTotals()});
form.elements.transportMode.addEventListener('change',()=>{dirty=true;form.dataset.saved="false";updateTotals()});
form.onsubmit=async event=>{event.preventDefault();if(editorStep<4){setEditorStep(editorStep+1);return}const q=checkedQuote();if(!q)return;if(records.some(record=>record.number.toLowerCase()===q.number.toLowerCase()&&record.id!==q.id)){toast('This quotation number already exists. Choose a unique number.');return}const button=form.querySelector('[type=submit]');button.disabled=true;try{const next=[...records.filter(record=>record.id!==q.id),q];await persist(next);records=next;editingId=q.id;dirty=false;renderStats();$('#save-status').textContent='Saved successfully • '+new Date().toLocaleTimeString('en-IN');form.dataset.saved='true';setEditorStep(4,false);renderHistory();toast('Quotation saved successfully.')}catch(error){toast(error.message);$('#save-status').textContent='Save failed. Your edits are still in this form.'}finally{button.disabled=false}};
$('#add').onclick=()=>{items.push(newItem());dirty=true;form.dataset.saved="false";renderItems();updateTotals()};
$('#signature').onchange=async event=>{try{signature=await readImage(event.target.files[0]);renderSignature();dirty=true}catch(error){toast(error.message);event.target.value=''}};
$('#remove-signature').onclick=()=>{signature='';$('#signature').value='';renderSignature();dirty=true};
$('#editor-close').onclick=showHistory;

$('#editor-cancel').onclick=showHistory;
$('#drawer-save').onclick=()=>{if(!validateEditorStep(1)||!validateEditorStep(2)||!validateEditorStep(3))return;setEditorStep(4,false);form.requestSubmit()};
$('#history-nav').onclick=showHistory;$('#search').oninput=()=>{historyPage=1;renderHistory()};
function newQuote(){if(dirty&&!confirm('Start a new quotation without saving your latest changes?'))return;reset();window.scrollTo({top:0,behavior:'smooth'})}
$('#new').onclick=newQuote;$('#new-nav').onclick=newQuote;
$('#print').onclick=()=>downloadQuote(checkedQuote());$('#preview').onclick=()=>{const q=checkedQuote();if(q)openRecordPreview(q)};$('#dialog-print').onclick=()=>downloadQuote(previewRecord||checkedQuote());$('#close-preview').onclick=()=>$('#preview-dialog').close();
$('#logout').onclick=async()=>{if(dirty&&!confirm('Sign out without saving your latest changes?'))return;try{await api('logout',{method:'POST'});dirty=false;location.href='login.html'}catch(error){toast(error.message)}};
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue=''}});
$('#terms-info').innerHTML=`<p><b>Laxmi Engineering</b><br>${esc(tagline)}<br>${esc(companyAddress)}<br>9477090833 / 9883194050 / 9831043719<br>office.laxmieng83@gmail.com</p><ol>${terms.map(term=>`<li>${esc(term)}</li>`).join('')}</ol><p class="quotation-note">${esc(quotationNote)}</p><p><b>ICICI BANK</b> • NEFT / RTGS / IMPS<br>Account Name: LAXMI ENGINEERING<br>Account No: 527505500040<br>IFSC Code & Branch: ICIC0001607 – DANKUNI</p>`;
(async()=>{reset(false);try{await api('session');records=await api('quotations');renderStats();reset(false)}catch(error){toast(error.message)}finally{showHistory()}})();















let pendingPdfImport=null;
const pdfInput=$('#import-pdf-file'),pdfButton=$('#import-pdf-button'),pdfDialog=$('#import-pdf-dialog'),pdfStatus=$('#pdf-import-status');
pdfButton.onclick=()=>pdfInput.click();
$('#cancel-pdf-import').onclick=()=>{pdfDialog.close();pendingPdfImport=null};
pdfDialog.addEventListener('cancel',()=>{pendingPdfImport=null});
pdfInput.onchange=async()=>{
 const file=pdfInput.files[0];if(!file)return;
 pdfButton.disabled=true;pdfStatus.hidden=false;pdfStatus.textContent='Reading the PDF locally…';pendingPdfImport=null;
 try{
  const extracted=await window.LePdfImport.extract(file,message=>pdfStatus.textContent=message);
  pendingPdfImport={...extracted,fileName:file.name};
  const details=[['Quotation no.',extracted.number||'Not detected'],['Date',extracted.date?dateText(extracted.date):'Not detected'],['Party name',extracted.party||'Not detected'],['Address',extracted.address||'Not detected'],['GSTIN / PAN',extracted.taxid||'Not detected'],['Contact',extracted.contact||'Not detected'],['Packing charge',extracted.packingMode==='none'?'Not applicable':extracted.packingMode==='including'?'Including':money(extracted.packingCharge||0)],['Transportation',extracted.transportMode==='none'?'Not applicable':extracted.transportMode==='including'?'Including':money(extracted.transportCharge||0)],['GST',extracted.gstMode==='including'?'Including':extracted.gstEnabled?`${extracted.gstRate}%`:(extracted.sourceSubtotal!==null&&extracted.sourceTotal!==null&&Math.abs(extracted.sourceSubtotal-extracted.sourceTotal)<.05?'Not applied in PDF':'Not detected — check PDF')]];
  $('#pdf-import-content').innerHTML=`<p class="pdf-source-name">${esc(file.name)} · ${extracted.pageCount} ${extracted.pageCount===1?'page':'pages'}</p><dl class="pdf-import-fields">${details.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl><h3>${extracted.items.length} ${extracted.items.length===1?'item':'items'} detected</h3><div class="table-scroll"><table><thead><tr><th>Item</th><th>Quantity</th><th>Rate</th></tr></thead><tbody>${extracted.items.length?extracted.items.map(item=>`<tr><td><b>${esc(item.name)}</b>${item.description?`<p>${esc(item.description).replace(/\n/g,'<br>')}</p>`:''}</td><td>${esc(item.qty)} ${esc(item.per)}</td><td>${money(item.rate)}</td></tr>`).join(''):'<tr><td colspan="3">No item rows were reliably detected.</td></tr>'}</tbody></table></div><div class="pdf-import-warnings"><b>Please review before saving</b><ul>${extracted.warnings.map(message=>`<li>${esc(message)}</li>`).join('')}</ul></div>`;
  pdfStatus.textContent='PDF read successfully. Review the extracted data.';pdfDialog.showModal();document.getElementById('pdf-import-title').focus({preventScroll:true});pdfDialog.scrollTop=0;
 }catch(error){pdfStatus.textContent=error.message||'Unable to read this PDF. Try a text-based quotation PDF.';toast(pdfStatus.textContent)}
 finally{pdfButton.disabled=false;pdfInput.value=''}
};
$('#apply-pdf-import').onclick=()=>{
 if(!pendingPdfImport)return;
 if(dirty&&!confirm('Replace the current unsaved form with the imported PDF data?'))return;
 const imported=pendingPdfImport;reset(false);editingId=null;
 for(const field of ['party','address','taxid','contact'])form.elements[field].value=imported[field]||'';
 if(imported.number)form.elements.number.value=imported.number;
 if(imported.date)form.elements.date.value=imported.date;
 form.elements.packingMode.value=imported.packingMode==='none'?'none':imported.packingMode==='including'?'including':'custom';form.elements.packingCharge.value=imported.packingCharge||0;form.elements.transportMode.value=imported.transportMode==='none'?'none':imported.transportMode==='including'?'including':'custom';form.elements.transportCharge.value=imported.transportCharge||0;form.elements.gstMode.value=imported.gstMode==='including'?'including':imported.gstEnabled?'custom':'none';form.elements.gstRate.value=imported.gstEnabled?(imported.gstRate??18):18;
 items=imported.items.length?structuredClone(imported.items):[newItem()];signature='';renderItems();renderSignature();updateTotals();dirty=true;form.dataset.saved="false";
 $('#save-status').textContent='Imported draft — review all fields before saving.';
 pdfStatus.textContent=`Imported from ${imported.fileName}. Review the party details, items, GST and totals before saving. Images and signature must be added separately.`;
 pdfDialog.close();pendingPdfImport=null;showEditor();window.scrollTo({top:0,behavior:'smooth'});toast('PDF data added to the form. Review it before saving.');
};

$('#refresh-dashboard').onclick=()=>{
 if(dirty&&!confirm('Refresh the complete website? Unsaved quotation changes will be lost.'))return;
 const wasDirty=dirty;dirty=false;
 try{window.parent.location.reload();}
 catch(error){dirty=wasDirty;toast('Unable to refresh. Please use your browser’s Refresh button.');}
};



$('#history-sort').onchange=$('#history-page-size').onchange=()=>{historyPage=1;renderHistory()};
$('#history-prev').onclick=()=>{historyPage--;renderHistory()};
$('#history-next').onclick=()=>{historyPage++;renderHistory()};
$('#register-empty-action').onclick=()=>{if($('#search').value.trim()){$('#search').value='';historyPage=1;renderHistory();$('#search').focus()}else newQuote()};
$('#preview-fit').onclick=()=>{fitPreview=!fitPreview;fitRecordPreview()};
window.addEventListener('resize',()=>{if($('#preview-dialog').open)requestAnimationFrame(fitRecordPreview)});

window.leCanNavigate=()=>!dirty||confirm('Leave this quotation without saving your changes?');
// Keep the record toolbar clear of the responsive sticky header.
function syncQuotationToolbarOffset(){const header=document.querySelector('.workspace-header'),toolbar=document.querySelector('.register-tools');const offset=header?Math.ceil(header.getBoundingClientRect().height+8):74;document.documentElement.style.setProperty('--quotation-toolbar-top',offset+'px');if(toolbar&&!document.querySelector('#history').hidden)document.documentElement.style.setProperty('--quotation-table-top',Math.ceil(offset+toolbar.getBoundingClientRect().height)+'px')}
window.addEventListener('resize',syncQuotationToolbarOffset);
window.addEventListener('load',syncQuotationToolbarOffset);
requestAnimationFrame(syncQuotationToolbarOffset);
if(document.fonts)document.fonts.ready.then(syncQuotationToolbarOffset);
$('#form-import-pdf').onclick=()=>$('#import-pdf-button').click();
$('#form-quotation-record').onclick=()=>{showHistory();requestAnimationFrame(syncQuotationToolbarOffset)};

function updateStepCompletion(){
 const ready=[1,2,3].map(n=>{const panel=form.querySelector('[data-editor-step="'+n+'"]');const fields=Array.from(panel.querySelectorAll('input,select,textarea')).filter(field=>field.willValidate);return fields.every(field=>field.validity.valid)&&(n!==2||items.length>0)});
 form.querySelectorAll('[data-go-step]').forEach(button=>{const n=Number(button.dataset.goStep);const complete=n===4?form.dataset.saved==='true':ready[n-1];button.classList.toggle('completed',complete);button.classList.toggle('auto-complete',complete);button.classList.toggle('needs-required',n<4&&!complete);button.setAttribute('aria-label',(['Party details','Items & pricing','Taxes & Charges','Signature & review'][n-1])+(complete?' — complete':''))});
}
form.addEventListener('input',updateStepCompletion);
form.addEventListener('change',updateStepCompletion);
form.addEventListener('click',()=>queueMicrotask(updateStepCompletion));
updateStepCompletion();

var inlinePreviewZoom=1;
function fitInlineQuotationPreview(){const viewport=$('.inline-preview-viewport'),page=$('.inline-preview-page'),stage=$('.inline-preview-stage');if(!viewport||!page||!stage||$('#wizard-review').hidden)return;const fit=Math.min(1,Math.max(.1,(viewport.clientWidth-2)/760));const scale=fit*inlinePreviewZoom;page.style.transform='scale('+scale+')';const height=Math.ceil(page.scrollHeight*scale);stage.style.width=Math.ceil(760*scale)+'px';stage.style.height=height+'px';viewport.style.height=(height+2)+'px';const value=$('#inline-zoom-value');if(value)value.textContent=Math.round(scale*100)+'%';$('[data-inline-zoom="out"]').disabled=inlinePreviewZoom<=.5;$('[data-inline-zoom="in"]').disabled=inlinePreviewZoom>=4}
window.addEventListener('resize',fitInlineQuotationPreview);
form.addEventListener('input',()=>{if(editorStep===4)renderEditorReview()});
form.addEventListener('change',()=>{if(editorStep===4)requestAnimationFrame(renderEditorReview)});

var quotationRecordFilter='all';
function filterQuotationRecords(all){return all.filter(q=>quotationRecordFilter==='month'?q.date.slice(0,7)===today().slice(0,7):quotationRecordFilter==='gst'?(q.gstEnabled||q.gstMode==='including'):quotationRecordFilter==='signed'?Boolean(q.signature):true)}
function updateRecordInsight(result){const node=$('#record-filter-insight');if(node)node.textContent=result.total+' '+(result.total===1?'quotation':'quotations')+' in view'}
document.querySelectorAll('[data-record-filter]').forEach(button=>button.onclick=()=>{quotationRecordFilter=button.dataset.recordFilter;document.querySelectorAll('[data-record-filter]').forEach(control=>control.setAttribute('aria-pressed',String(control===button)));historyPage=1;renderHistory();requestAnimationFrame(syncQuotationToolbarOffset)});

function quotationCsvCell(value){let text=String(value??'');if(/^[=+@\-\t\r]/.test(text.trimStart()))text="'"+text;return '"'+text.replaceAll('"','""')+'"'}
function buildQuotationCsv(rows){const header=['Quotation number','Date','Customer','Contact','GSTIN / PAN','Items','Grand total (INR)'];return '\uFEFF'+[header,...rows.map(q=>[q.number,q.date,q.party,q.contact,q.taxid,q.items.length,totals(q).total.toFixed(2)])].map(row=>row.map(quotationCsvCell).join(',')).join('\r\n')}
$('#export-records').onclick=()=>{const rows=historyPageData(filterQuotationRecords(records),$('#search').value,$('#history-sort').value,1,Number.MAX_SAFE_INTEGER).rows;if(!rows.length){toast('No matching quotations to export.');return}const blob=new Blob([buildQuotationCsv(rows)],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='Laxmi-Quotation-Records-'+today()+'.csv';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);toast('Quotation records exported.')};

document.documentElement.dataset.theme='light';
try{localStorage.setItem('le-quotation-theme','light')}catch{}

/* Local, geometry-aware extraction. Imported content is data, never code. */
window.LePdfImport=(()=>{
 const clean=value=>String(value??'').replace(/\s+/g,' ').trim();
 const numeric=value=>{const match=String(value).replace(/[₹\s]/g,'').match(/-?\d[\d,]*(?:\.\d+)?/);return match?Number(match[0].replace(/,/g,'')):null};
 function normalizeDate(value){
  const text=clean(value);let y,m,d;
  let match=text.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if(match)[,y,m,d]=match;
  else if(match=text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/)){[,d,m,y]=match;if(y.length===2)y='20'+y}
  else {match=text.match(/\b(\d{1,2})[\s-]+([A-Za-z]{3,9})[\s,-]+(20\d{2})\b/);if(!match)return '';d=match[1];m=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(match[2].slice(0,3).toLowerCase())+1;y=match[3]}
  const date=new Date(Date.UTC(Number(y),Number(m)-1,Number(d)));
  if(date.getUTCFullYear()!==Number(y)||date.getUTCMonth()+1!==Number(m)||date.getUTCDate()!==Number(d))return '';
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
 }
 function makeLines(tokens,page,width){
  const lines=[];
  for(const word of tokens.filter(word=>clean(word.text)).sort((a,b)=>a.y-b.y||a.x-b.x)){
   let line=lines.find(line=>Math.abs(line.y-word.y)<Math.max(2.2,Math.min(3.5,word.height*.3)));
   if(!line){line={page,width,y:word.y,words:[]};lines.push(line)}line.words.push({...word,text:clean(word.text)});
  }
  return lines.sort((a,b)=>a.y-b.y).map(line=>({...line,words:line.words.sort((a,b)=>a.x-b.x),text:line.words.map(word=>word.text).join(' ')}));
 }
 function headerInfo(line){
  if(!/\b(?:qty|quantity)\b/i.test(line.text)||!/\brate\b/i.test(line.text)||!/\bamount\b/i.test(line.text))return null;
  const locate=regex=>line.words.find(word=>regex.test(word.text));
  const qty=locate(/\b(?:qty|quantity)\b/i),rate=locate(/\brate\b/i),amount=locate(/\bamount\b/i),description=locate(/\b(?:item|description|particulars)\b/i),per=locate(/^per\b|\bunit\b/i);
  if(!qty||!rate||!amount)return null;
  const center=word=>word.x+word.width/2;
  return {qtyStart:qty.x-line.width*.035,rateStart:(center(per||qty)+center(rate))/2,amountStart:(center(rate)+center(amount))/2,itemStart:description?description.x-5:line.width*.08,perStart:per?(center(qty)+center(per))/2:null};
 }
 function parse(lines){
  const result={date:'',number:'',party:'',address:'',taxid:'',contact:'',items:[],gstEnabled:false,gstRate:0,packingMode:'custom',packingCharge:0,transportMode:'custom',transportCharge:0,warnings:[],sourceTotal:null,sourceSubtotal:null};
  const text=lines.map(line=>line.text).join('\n');
  if(text.replace(/\s/g,'').length<25)throw Error('This PDF has no readable text. Scanned PDFs and photos need OCR before they can be imported.');
  const firstHeader=lines.findIndex(line=>headerInfo(line));
  const before=firstHeader<0?lines:lines.slice(0,firstHeader);
  for(let i=0;i<before.length;i++){
   const line=before[i],value=line.text;
   const compact=value.replace(/\s/g,'');
   const labelled=value.match(/(?:quotation|quote|estimate)\s*(?:no\.?|number|#|ref(?:erence)?\.?)\s*[:.\-]?\s*(.*)/i)||(/(?:QUOTATION|QUOTE|ESTIMATE)(?:NO\.?|NUMBER|#)[:.\-]?$/i.test(compact)?['','']:null);
   if(labelled&&!result.number){const candidate=clean(labelled[1]).replace(/\b(?:issued|date|dated)\b.*$/i,'').trim();const labelWord=line.words.find(word=>/(?:quotation|quote|estimate)/i.test(word.text.replace(/\s/g,'')));const next=before[i+1];result.number=candidate||(next?clean(next.words.filter(word=>!labelWord||word.x>=labelWord.x-line.width*.08).map(word=>word.text).join(' ')):'')}
   if(!result.number&&/^(?:no\.|no\s*:)/i.test(value))result.number=clean(value.replace(/^no\.?\s*:?\s*/i,'')).split(/\bdate\b/i)[0].trim();
   if(/\b(?:date|dated|issued)\b/i.test(value)&&!result.date)result.date=normalizeDate(value)||normalizeDate(before[i+1]?.text);
  }
  if(result.number)result.number=result.number.slice(0,80);
  // Customer area is below the document reference, before the item table.
  let start=before.findIndex(line=>/\b(?:customer details|prepared for|quotation to|bill(?:ed)? to|party (?:name|details)|customer name|m\/s\.)\b/i.test(line.text)||/CUSTOMERDETAILS|OFFERDETAILS/i.test(line.text.replace(/\s/g,'')));
  if(start<0){for(let i=before.length-1;i>=0;i--)if(/\bissued on\b|\bdate\s*:|\bdated\b/i.test(before[i].text)){start=i+1;break}}
  if(start>=0){
   const area=before.slice(start);
   const rightLabel=area.flatMap(line=>line.words).find(word=>/^(?:CUSTOMER|OFFER)(?:DETAILS)?$/i.test(word.text.replace(/\s/g,'')));
   const split=rightLabel?rightLabel.x-8:(lines[firstHeader]?.width*.59||350);
   const customerLines=area.map(line=>({...line,text:clean(line.words.filter(word=>word.x<split).map(word=>word.text).join(' '))}));
   const isMeta=value=>/^(?:customer details|offer details|prepared for|quotation to|bill(?:ed)? to|party details|gstin|gst|pan\b|contact|phone|mobile|tel\b|validity|currency|payment|items?\s*(?:&|and)\s*pricing|quotation\b|issued\b|date\b)/i.test(value);
   const candidates=customerLines.map(line=>line.text).filter(value=>value&&!isMeta(value)&&!/^\d+\s+line items?$/i.test(value));
   if(candidates.length){result.party=candidates[0].replace(/^(?:party name|customer name|m\/s\.?|to)\s*[:.\-]?\s*/i,'');result.address=candidates.slice(1).filter(value=>!/^\d{10,15}$/.test(value.replace(/[+\s-]/g,''))).join('\n')}
   const customerText=area.map(line=>line.text).join('\n');
   result.taxid=customerText.match(/\b\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]\b/i)?.[0]?.toUpperCase()||customerText.match(/\b[A-Z]{5}\d{4}[A-Z]\b/i)?.[0]?.toUpperCase()||'';
   if(!result.taxid){const labelledTax=area.find(line=>/GSTIN\s*\/\s*PAN|\bGSTIN\b|\bPAN\s*(?:No\.?|Number)?\s*:/i.test(line.text));if(labelledTax){const raw=clean(labelledTax.text.replace(/^.*?(?:GSTIN\s*\/\s*PAN|GSTIN|PAN\s*(?:No\.?|Number)?\s*:)\s*[:.\-]?\s*/i,''));if(raw&&raw!=='—'&&raw!=='-'){result.taxid=raw.slice(0,30);result.warnings.push('The GSTIN / PAN value was copied as printed, but does not match a standard GSTIN or PAN format. Please verify it.')}}}
   const phoneLine=area.find(line=>/\b(?:contact|phone|mobile|tel)\b/i.test(line.text));
   if(phoneLine){const tail=phoneLine.text.replace(/^.*?\b(?:contact|phone|mobile|tel)\b\s*(?:no\.?)?\s*[:.\-]?\s*/i,'');result.contact=tail.match(/\+?\d[\d\s()\/-]{7,}\d/)?.[0]?.trim()||''}
  }
  let columns=null,current=null,pending=null,inTable=false;
  for(const line of lines){
   const found=headerInfo(line);if(found){columns=found;inTable=true;continue}
   if(!inTable||!columns)continue;
   if(/\b(?:sub\s*total|grand\s*total|payment information|bank details|terms\s*(?:&|and)\s*conditions|built on trust)\b/i.test(line.text)){inTable=false;continue}
   if(/^(?:page\s+\d|laxmi engineering|thank you|manufacturing\s*[·•])/i.test(line.text))continue;
   const group=(min,max)=>clean(line.words.filter(word=>word.x>=min&&word.x<max).map(word=>word.text).join(' '));
   const qtyText=group(columns.qtyStart,columns.perStart??columns.rateStart),rateText=group(columns.rateStart,columns.amountStart),amountText=group(columns.amountStart,Infinity);
   const qtyMatch=qtyText.match(/^([\d,]+(?:\.\d+)?)\s*([A-Za-z./]+)?/),qty=qtyMatch?Number(qtyMatch[1].replace(/,/g,'')):null;
   const rate=numeric(rateText),amount=numeric(amountText);
   const leftWords=line.words.filter(word=>word.x<columns.qtyStart);
   const serial=leftWords.find(word=>word.x<columns.itemStart&&/^\d{1,3}[.)]?$/.test(word.text));
   const itemText=clean(leftWords.filter(word=>word!==serial&&word.x>=columns.itemStart-4).map(word=>word.text).join(' ')).replace(/^[•·▪]\s*/, '');
   const hasValues=qty!==null&&qty>0&&rate!==null&&amount!==null;
   const isDescription=itemText&&!/^(?:specifications|items?\s*(?:&|and)\s*pricing|\d+\s+line items?)$/i.test(itemText);
   if(hasValues&&(pending||itemText)){
    const title=pending?.name||itemText;
    let description=pending?.description||'';
    if(pending&&isDescription)description+=(description?'\n':'')+itemText;
    current={name:title,description,qty,per:columns.perStart?group(columns.perStart,columns.rateStart):(qtyMatch[2]||'Set'),rate,image:''};result.items.push(current);pending=null;
    if(Math.abs(Math.round(qty*rate*100)/100-amount)>.05)result.warnings.push(`Check the quantity and rate for “${title}”: the PDF amount does not match quantity × rate.`);
   }else if(isDescription){
    if(serial||(!current&&!pending)){pending={name:itemText,description:''};current=null}
    else{const target=pending||current;target.description+=(target.description?'\n':'')+itemText}
   }
  }
  const rates=[...text.matchAll(/\b((?:I|C|S)?GST)\s*(?:\(\s*)?(\d+(?:\.\d+)?)\s*%/gi)];
  if(rates.length){const seen=new Map();for(const match of rates)seen.set(match[1].toUpperCase(),Number(match[2]));result.gstRate=seen.get('GST')??seen.get('IGST')??((seen.get('CGST')||0)+(seen.get('SGST')||0));result.gstEnabled=true}
  const grand=lines.find(line=>/grand\s*total/i.test(line.text));if(grand){const tail=grand.text.replace(/^.*?grand\s*total/i,'');result.sourceTotal=numeric(tail)}
  const subtotalLine=lines.find(line=>/sub\s*total/i.test(line.text));if(subtotalLine)result.sourceSubtotal=numeric(subtotalLine.text.replace(/^.*?sub\s*total/i,''));
  const packing=lines.find(line=>/packing\s*charge/i.test(line.text));if(packing){const tail=packing.text.replace(/^.*?packing\s*charge/i,'');result.packingMode=/not\s+applicable/i.test(tail)?'none':/including|included/i.test(tail)?'including':'custom';result.packingCharge=result.packingMode!=='custom'?0:Math.max(0,numeric(tail)||0)}
  const transport=lines.find(line=>/^\s*transport(?:ation)?(?:\s*charge)?\b/i.test(line.text));if(transport){const tail=transport.text.replace(/^\s*transport(?:ation)?(?:\s*charge)?\b/i,'');result.transportMode=/not\s+applicable/i.test(tail)?'none':/including|included/i.test(tail)?'including':'custom';result.transportCharge=result.transportMode!=='custom'?0:Math.max(0,numeric(tail)||0)}
  if(!result.gstEnabled&&/\bGST\b/i.test(text)&&result.sourceTotal!==null&&result.items.length){const subtotal=result.items.reduce((sum,item)=>sum+item.qty*item.rate,0)+result.packingCharge+result.transportCharge;if(subtotal>0){const inferred=Math.round((result.sourceTotal/subtotal-1)*10000)/100;if(inferred>0&&inferred<=100){result.gstRate=inferred;result.gstEnabled=true;result.warnings.push('GST rate was calculated from the PDF total. Please confirm it.')}}}
  if(!result.party)result.warnings.push('Party name was not confidently identified. Enter it in the form.');
  if(!result.address)result.warnings.push('Party address was not confidently identified. Enter it in the form.');
  if(!result.items.length)result.warnings.push('The item table could not be reliably identified. Add the items manually.');
  if(result.sourceTotal!==null&&result.items.length){const subtotal=Math.round((result.items.reduce((sum,item)=>sum+item.qty*item.rate,0)+result.packingCharge+result.transportCharge)*100)/100;const total=Math.round((subtotal+(result.gstEnabled?Math.round(subtotal*result.gstRate)/100:0))*100)/100;if(Math.abs(total-result.sourceTotal)>.05)result.warnings.push('The extracted items/GST do not match the PDF grand total. Review every amount before saving.');}
  result.warnings.push('Review all extracted fields. Item images and signatures are not imported automatically.');
  return result;
 }
 async function extract(file,onProgress=()=>{}){
  if(!file||file.size>20*1024*1024)throw Error('Choose a PDF smaller than 20 MB.');
  const bytes=new Uint8Array(await file.arrayBuffer());
  if(!new TextDecoder('latin1').decode(bytes.slice(0,1024)).includes('%PDF-'))throw Error('This file is not a valid PDF.');
  let library;
  if(window.parent.LEApp?.pdfLibrary)library=await window.parent.LEApp.pdfLibrary();
  else{if(!window.LEPdfOffline)await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='vendor/pdf-offline.js';script.onload=resolve;script.onerror=()=>reject(Error('The offline PDF reader is missing. Please open the complete updated HTML website.'));document.head.append(script)});library=window.LEPdfOffline}
  let pdfDocument;
  try{
   pdfDocument=await library.getDocument({data:bytes,isEvalSupported:false,useWorkerFetch:false,useSystemFonts:true}).promise;
   if(pdfDocument.numPages>40)throw Error('Please upload a quotation PDF with no more than 40 pages.');
   const metadata=await pdfDocument.getMetadata().catch(()=>null),keywords=metadata?.info?.Keywords;
   if(typeof keywords==='string'&&keywords.startsWith('LAXMI_QUOTE_V1:')){const restored=readQuotationMetadata(keywords.slice(15));if(restored)return {...restored,pageCount:pdfDocument.numPages}}
   const lines=[];
   for(let pageNumber=1;pageNumber<=pdfDocument.numPages;pageNumber++){
    onProgress(`Reading page ${pageNumber} of ${pdfDocument.numPages}…`);
    const page=await pdfDocument.getPage(pageNumber),viewport=page.getViewport({scale:1}),content=await page.getTextContent();
    const tokens=content.items.filter(item=>typeof item.str==='string').map(item=>{const [x,y]=viewport.convertToViewportPoint(item.transform[4],item.transform[5]);return {text:item.str,x,y,width:item.width,height:Math.abs(item.height)||10}});
    lines.push(...makeLines(tokens,pageNumber,viewport.width));page.cleanup();
   }
   return {...parse(lines),pageCount:pdfDocument.numPages};
  }catch(error){if(error.name==='PasswordException')throw Error('This PDF is password protected. Upload an unlocked copy.');if(error.name==='InvalidPDFException')throw Error('This PDF is damaged or unreadable. Try exporting a fresh copy.');throw error}
  finally{if(pdfDocument)await pdfDocument.destroy()}
 }
 function readQuotationMetadata(encoded){
  try{
   if(encoded.length>4*1024*1024)return null;
   const raw=atob(encoded),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0)),q=JSON.parse(new TextDecoder().decode(bytes));
   const string=(value,max,required=false)=>{if(typeof value!=='string'||value.length>max||(required&&!value.trim()))throw Error();return value};
   const number=(value,min,max)=>{if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw Error();return value};
   if(!q||!Array.isArray(q.items)||!q.items.length||q.items.length>500||!normalizeDate(q.date)||typeof q.gstEnabled!=='boolean')return null;
   const result={date:normalizeDate(q.date),number:string(q.number,80,true),party:string(q.party,200,true),address:string(q.address,1500,true),taxid:string(q.taxid||'',30),contact:string(q.contact||'',60),gstMode:q.gstMode==='including'?'including':q.gstEnabled?'custom':'none',gstEnabled:q.gstMode==='including'?false:q.gstEnabled,gstRate:number(q.gstRate,0,100),packingMode:q.packingMode==='none'?'none':q.packingMode==='including'?'including':'custom',packingCharge:number(q.packingCharge??0,0,1e11),transportMode:q.transportMode==='none'?'none':q.transportMode==='including'?'including':'custom',transportCharge:number(q.transportCharge??0,0,1e11),items:q.items.map(item=>({name:string(item.name,300,true),description:string(item.description||'',5000),qty:number(item.qty,.001,1e8),per:string(item.per??'Set',30),rate:number(item.rate,0,1e11),image:''})),warnings:['Review all extracted fields. Item images and signatures are not imported automatically.']};
   if(result.packingMode==='including'||result.packingMode==='none')result.packingCharge=0;
   if(result.transportMode==='including'||result.transportMode==='none')result.transportCharge=0;
   result.sourceSubtotal=Math.round((result.items.reduce((sum,item)=>sum+Math.round(item.qty*item.rate*100)/100,0)+result.packingCharge+result.transportCharge)*100)/100;result.sourceTotal=Math.round((result.sourceSubtotal+(result.gstEnabled?Math.round(result.sourceSubtotal*result.gstRate)/100:0))*100)/100;return result;
  }catch{return null}
 }
 return {extract,parse,makeLines,normalizeDate,readQuotationMetadata};
})();

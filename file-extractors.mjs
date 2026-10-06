const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_UPLOAD = 24 * 1024 * 1024;
const normalizeText = value => String(value || "").replace(/\r\n?/g,"\n").split("\n").map(s => s.trimEnd()).join("\n").trim();
const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const direct = (el,name) => [...(el?.children || [])].filter(n => n.namespaceURI === W && n.localName === name);
const child = (el,name) => direct(el,name)[0];
const attr = el => el?.getAttributeNS(W,"val");
const on = el => !!el && !["0","false","off"].includes(attr(el));
function xml(text) {
  const doc = new DOMParser().parseFromString(text,"application/xml");
  if (doc.getElementsByTagName("parsererror").length) throw new Error("Could not extract file");
  return doc;
}
function runText(run) {
  return [...run.children].map(n => {
    if (n.namespaceURI !== W) return "";
    if (n.localName === "t") return n.textContent;
    if (n.localName === "tab" || n.localName === "ptab") return "\t";
    if (n.localName === "br") return !n.hasAttributeNS(W,"type") || attrType(n) === "textWrapping" ? "\n" : "";
    if (n.localName === "cr") return "\n";
    if (n.localName === "noBreakHyphen") return "\u2011";
    return "";
  }).join("");
}
const attrType = el => el.getAttributeNS(W,"type");
function paragraphText(p) {
  // python-docx 1.2 includes hyperlinks in text but excludes them from paragraph.runs.
  return [...p.children].map(n => n.namespaceURI !== W ? "" :
    n.localName === "r" ? runText(n) : n.localName === "hyperlink" ? direct(n,"r").map(runText).join("") : "").join("");
}
async function unzip(bytes) {
  const view = new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  let end = -1;
  for (let i=bytes.length-22; i>=Math.max(0,bytes.length-65557); i--) {
    if (view.getUint32(i,true) === 0x06054b50 && i+22+view.getUint16(i+20,true) === bytes.length) { end=i; break; }
  }
  if (end < 0 || view.getUint16(end+4,true) || view.getUint16(end+6,true)) throw new Error("Could not extract file");
  const count=view.getUint16(end+10,true);
  if (count > 4096) throw new Error("Could not extract file");
  let offset=view.getUint32(end+16,true), expanded=0;
  const entries=new Map();
  for (let i=0;i<count;i++) {
    if (view.getUint32(offset,true)!==0x02014b50) throw new Error("Could not extract file");
    const flags=view.getUint16(offset+8,true), method=view.getUint16(offset+10,true);
    const size=view.getUint32(offset+20,true), expected=view.getUint32(offset+24,true);
    const nameLen=view.getUint16(offset+28,true), extra=view.getUint16(offset+30,true), comment=view.getUint16(offset+32,true);
    const name=new TextDecoder().decode(bytes.subarray(offset+46,offset+46+nameLen));
    const local=view.getUint32(offset+42,true);
    offset+=46+nameLen+extra+comment;
    if (!["word/document.xml","word/styles.xml","docProps/core.xml"].includes(name)) continue;
    if (entries.has(name) || flags & 1 || ![0,8].includes(method) || expected > 64*1024*1024) throw new Error("Could not extract file");
    if (view.getUint32(local,true)!==0x04034b50) throw new Error("Could not extract file");
    const start=local+30+view.getUint16(local+26,true)+view.getUint16(local+28,true);
    if (start+size > bytes.length) throw new Error("Could not extract file");
    const data=bytes.slice(start,start+size);
    const stream=method===8 ? new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw")) : new Blob([data]).stream();
    const reader=stream.getReader(), chunks=[]; let total=0;
    try {
      while (true) {
        const {done,value}=await reader.read(); if(done) break;
        total+=value.byteLength; expanded+=value.byteLength;
        if (total>expected || expanded>64*1024*1024) { await reader.cancel(); throw new Error("Could not extract file"); }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    if(total!==expected) throw new Error("Could not extract file");
    const decoded=new Uint8Array(total); let at=0;
    for(const c of chunks) {decoded.set(c,at);at+=c.byteLength;}
    entries.set(name,new TextDecoder().decode(decoded));
  }
  return entries;
}
export async function extractDocx(bytes,filename) {
  const entries=await unzip(bytes);
  if(!entries.has("word/document.xml")) throw new Error("Could not extract file");
  const doc=xml(entries.get("word/document.xml"));
  const styles=entries.has("word/styles.xml") ? xml(entries.get("word/styles.xml")) : null;
  const styleMap=new Map(); let defaultParagraph="",defaultCharacter="";
  for(const s of styles?.getElementsByTagNameNS(W,"style") || []) {
    styleMap.set(s.getAttributeNS(W,"styleId"),s);
    if(s.getAttributeNS(W,"type")==="paragraph" && onDefault(s)) defaultParagraph=s.getAttributeNS(W,"styleId");
    if(s.getAttributeNS(W,"type")==="character" && onDefault(s)) defaultCharacter=s.getAttributeNS(W,"styleId");
  }
  const core=entries.has("docProps/core.xml") ? xml(entries.get("docProps/core.xml")) : null;
  const title=core?.getElementsByTagNameNS("http://purl.org/dc/elements/1.1/","title")[0]?.textContent.trim() || filename;
  const blocks=[],body=doc.getElementsByTagNameNS(W,"body")[0];
  for(const p of direct(body,"p")) {
    const text=paragraphText(p).trim(); if(!text) continue;
    const style=styleMap.get(attr(child(child(p,"pPr"),"pStyle"))) || styleMap.get(defaultParagraph);
    const name=(attr(child(style,"name")) || "").trim().toLowerCase();
    const visible=direct(p,"r").filter(r=>runText(r).trim());
    const bold=visible.length>0 && visible.every(r=>{
      const rp=child(r,"rPr"), charStyle=styleMap.get(attr(child(rp,"rStyle"))) || styleMap.get(defaultCharacter);
      return on(child(rp,"b")) || on(child(child(charStyle,"rPr"),"b"));
    });
    const terminal=text.replace(/[»”"')\]]+$/g,"").trim();
    const label=/^(påstand|innføring|innledning|argumenter|vurdering|kilder|konklusjon|metode|resultat|resultater|drøfting|teori|claim|section|chapter)/i.test(text);
    const heading=text.split(/\s+/u).length<=22 && [...text].length<=180 &&
      (name.startsWith("heading") || ["title","subtitle"].includes(name) || (bold && (label || !/[.!?]$/.test(terminal))));
    blocks.push(heading ? "## "+text : text);
  }
  for(const table of direct(body,"tbl")) {
    let previous=[];
    for(const row of direct(table,"tr")) {
      const cells=[]; let column=Number(attr(child(child(row,"trPr"),"gridBefore")) || 0);
      const current=[];
      for(const cell of direct(row,"tc")) {
        const props=child(cell,"tcPr"),span=Number(attr(child(props,"gridSpan")) || 1),merge=child(props,"vMerge");
        const text=merge && attr(merge)!=="restart" ? (previous[column] || "") : direct(cell,"p").map(paragraphText).join("\n").trim();
        for(let i=0;i<span;i++) {cells.push(text);current[column++]=text;}
      }
      previous=current;
      const visible=cells.filter(Boolean); if(visible.length) blocks.push(visible.join(" | "));
    }
  }
  return {title,contentType:DOCX_TYPE,body:normalizeText(blocks.join("\n\n")),warnings:blocks.length?[]:["No readable text found in this DOCX."]};
}
const onDefault = s => ["1","true","on"].includes(s.getAttributeNS(W,"default"));

export async function extractPdf(bytes,filename) {
  const pdfjs=await import("./vendor/pdfjs/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc=new URL("./vendor/pdfjs/pdf.worker.mjs",import.meta.url).href;
  const task=pdfjs.getDocument({data:bytes,password:"",isEvalSupported:false,useWasm:false,
    cMapUrl:new URL("./vendor/pdfjs/cmaps/",import.meta.url).href,cMapPacked:true,
    standardFontDataUrl:new URL("./vendor/pdfjs/standard_fonts/",import.meta.url).href});
  let pdf;
  try { pdf=await task.promise; }
  catch(error) {
    await task.destroy();
    if(error.name==="PasswordException") return {title:filename,contentType:"application/pdf",body:"",warnings:["This PDF is encrypted and could not be read."]};
    throw new Error("Could not extract file text");
  }
  const warnings=[],pages=[]; let title=filename;
  try {
    try { const metadata=await pdf.getMetadata(); title=String(metadata.info?.Title || "").trim() || filename; } catch {}
    for(let i=1;i<=pdf.numPages;i++) {
      try {
        const page=await pdf.getPage(i),content=await page.getTextContent();
        let text="",last=null;
        for(const item of content.items) {
          if(typeof item.str!=="string") continue;
          if(last && !text.endsWith("\n") && item.str && !/^\s/.test(item.str)) {
            const dy=Math.abs(item.transform[5]-last.transform[5]);
            const gap=item.transform[4]-(last.transform[4]+last.width);
            if(dy>Math.max(2,Math.abs(item.transform[3])*0.4)) text+="\n";
            else if(gap>1 && !/\s$/.test(text)) text+=" ";
          }
          text+=item.str; if(item.hasEOL) text+="\n"; last=item;
        }
        if(text.trim()) pages.push(text.trim()); page.cleanup();
      } catch { warnings.push("Page "+i+" could not be read."); }
    }
    if(!pages.length) warnings.push("No selectable text found. Scanned PDFs need OCR before they can be read here.");
    return {title,contentType:"application/pdf",body:normalizeText(pages.join("\n\n")),warnings};
  } finally { await task.destroy(); }
}
export async function extractFile(file) {
  if(file.size>MAX_UPLOAD) throw new Error("Upload is too large");
  const bytes=new Uint8Array(await file.arrayBuffer());
  try { return /\.pdf$/i.test(file.name) ? await extractPdf(bytes,file.name) : await extractDocx(bytes,file.name); }
  catch(error) { throw new Error(error.message==="Upload is too large" ? error.message : "Could not extract file text"); }
}

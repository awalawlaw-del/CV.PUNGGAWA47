/* =====================================================================
   pdf-doc.js: ekspor PDF profesional (invoice, nota, penawaran) tanpa pustaka luar
   + menu Rekening pembayaran (tambah, edit, hapus) di akun Direktur.
   Dimuat setelah skrip utama; menimpa tombol Unduh/Cetak lama.
   ===================================================================== */
(function(){
'use strict';

/* ---------- Metrik huruf Helvetica (kode WinAnsi 32..255, per 1000 unit) ---------- */
const W_H=[278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584, 761, 556, 761, 222, 556, 333, 1000, 556, 556, 333, 1000, 667, 333, 1000, 761, 611, 761, 761, 222, 222, 333, 333, 350, 556, 1000, 333, 1000, 500, 333, 944, 761, 500, 667, 278, 333, 556, 556, 556, 556, 260, 556, 333, 737, 370, 556, 584, 333, 737, 333, 400, 584, 333, 333, 333, 556, 537, 278, 333, 333, 365, 556, 834, 834, 834, 611, 667, 667, 667, 667, 667, 667, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278, 722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611, 556, 556, 556, 556, 556, 556, 889, 500, 556, 556, 556, 556, 278, 278, 278, 278, 556, 556, 556, 556, 556, 556, 556, 584, 611, 556, 556, 556, 556, 500, 556, 500];
const W_B=[278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584, 761, 556, 761, 278, 556, 500, 1000, 556, 556, 333, 1000, 667, 333, 1000, 761, 611, 761, 761, 278, 278, 500, 500, 350, 556, 1000, 333, 1000, 556, 333, 944, 761, 500, 667, 278, 333, 556, 556, 556, 556, 280, 556, 333, 737, 370, 556, 584, 333, 737, 333, 400, 584, 333, 333, 333, 611, 556, 278, 333, 333, 365, 556, 834, 834, 834, 611, 722, 722, 722, 722, 722, 722, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278, 722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611, 556, 556, 556, 556, 556, 556, 889, 556, 556, 556, 556, 556, 278, 278, 278, 278, 611, 611, 611, 611, 611, 611, 611, 584, 611, 611, 611, 611, 611, 556, 611, 556];
const CP1252=[0x20AC,0,0x201A,0x0192,0x201E,0x2026,0x2020,0x2021,0x02C6,0x2030,0x0160,0x2039,0x0152,0,0x017D,0,0,0x2018,0x2019,0x201C,0x201D,0x2022,0x2013,0x2014,0x02DC,0x2122,0x0161,0x203A,0x0153,0,0x017E,0x0178];
function enc(s){const o=[];for(const ch of String(s==null?'':s)){const c=ch.codePointAt(0);
  if(c>=32&&c<127)o.push(c);else if(c>=160&&c<=255)o.push(c);
  else if(c===9||c===10||c===13||c===0x2009||c===0x200A||c===0x202F)o.push(32);
  else if(c===0x2605||c===0x2606)o.push(42);
  else{const k=CP1252.indexOf(c);o.push(k>=0?128+k:63)}}return o}
const hex=a=>a.map(c=>(c<16?'0':'')+c.toString(16)).join('');
const fx=n=>(Math.round(n*100)/100).toString();

/* ---------- Penulis PDF mini ---------- */
function PDF(){this.W=595.28;this.H=841.89;this.pages=[];this.cur=null;this.imgs=[]}
PDF.prototype={
 page(){this.cur=[];this.pages.push(this.cur);return this.cur},
 y(v){return fx(this.H-v)},
 col(h){const n=parseInt(String(h).replace('#',''),16);return [(n>>16)&255,(n>>8)&255,n&255].map(v=>fx(v/255)).join(' ')},
 width(s,size,bold,sp){const t=bold?W_B:W_H,a=enc(s);let w=0;for(const c of a)w+=t[c-32]||500;return w*size/1000+(sp||0)*a.length},
 wrap(s,maxW,size,bold){const out=[];String(s==null?'':s).split(/\r?\n/).forEach(par=>{
   const words=par.split(/\s+/).filter(Boolean);if(!words.length){out.push('');return}let line='';
   words.forEach(w=>{let t=line?line+' '+w:w;if(this.width(t,size,bold)<=maxW){line=t;return}
    if(line){out.push(line);line=''}
    if(this.width(w,size,bold)<=maxW){line=w;return}
    let seg='';for(const ch of w){if(this.width(seg+ch,size,bold)>maxW&&seg){out.push(seg);seg=ch}else seg+=ch}line=seg});
   out.push(line)});return out},
 text(s,x,y,o){o=o||{};const size=o.size||10,bold=!!o.bold,sp=o.sp||0;s=String(s==null?'':s);if(!s)return;
   const w=this.width(s,size,bold,sp);if(o.align==='r')x-=w;else if(o.align==='c')x-=w/2;
   this.cur.push('BT /'+(bold?'F2':'F1')+' '+fx(size)+' Tf '+fx(sp)+' Tc '+this.col(o.color||'#10163a')+' rg '+fx(x)+' '+this.y(y)+' Td <'+hex(enc(s))+'> Tj ET')},
 line(x1,y1,x2,y2,o){o=o||{};this.cur.push('q '+fx(o.lw||.6)+' w '+this.col(o.color||'#cfd5ea')+' RG '+(o.dash?'['+o.dash+'] 0 d ':'')+fx(x1)+' '+this.y(y1)+' m '+fx(x2)+' '+this.y(y2)+' l S Q')},
 rect(x,y,w,h,o){o=o||{};const r=Math.min(o.r||0,w/2,h/2),Y=this.H-y-h;let p;
   if(r>0){const k=r*.5523,x2=x+w,y2=Y+h;
    p=fx(x+r)+' '+fx(Y)+' m '+fx(x2-r)+' '+fx(Y)+' l '+fx(x2-r+k)+' '+fx(Y)+' '+fx(x2)+' '+fx(Y+r-k)+' '+fx(x2)+' '+fx(Y+r)+' c '+
      fx(x2)+' '+fx(y2-r)+' l '+fx(x2)+' '+fx(y2-r+k)+' '+fx(x2-r+k)+' '+fx(y2)+' '+fx(x2-r)+' '+fx(y2)+' c '+
      fx(x+r)+' '+fx(y2)+' l '+fx(x+r-k)+' '+fx(y2)+' '+fx(x)+' '+fx(y2-r+k)+' '+fx(x)+' '+fx(y2-r)+' c '+
      fx(x)+' '+fx(Y+r)+' l '+fx(x)+' '+fx(Y+r-k)+' '+fx(x+r-k)+' '+fx(Y)+' '+fx(x+r)+' '+fx(Y)+' c h'}
   else p=fx(x)+' '+fx(Y)+' '+fx(w)+' '+fx(h)+' re';
   let s='q ';if(o.fill)s+=this.col(o.fill)+' rg ';if(o.stroke)s+=this.col(o.stroke)+' RG '+fx(o.lw||.6)+' w ';
   s+=p+' '+(o.fill&&o.stroke?'B':o.fill?'f':'S')+' Q';this.cur.push(s)},
 addImage(rec){this.imgs.push(rec);return this.imgs.length-1},
 image(idx,x,y,w,h){this.cur.push('q '+fx(w)+' 0 0 '+fx(h)+' '+fx(x)+' '+this.y(y+h)+' cm /Im'+idx+' Do Q')},
 build(){
  const parts=[],offs=[];let pos=0;const A=s=>{const u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i)&255;return u};
  const push=u=>{parts.push(u);pos+=u.length};
  const objs=[];let n=0;const add=(dict,stream)=>{objs[++n]={dict,stream};return n};
  const root=add('',null),pagesId=add('',null);
  const f1=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'),f2=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const imgIds=this.imgs.map(im=>{let sm='';
    if(im.alpha){const sid=add('<< /Type /XObject /Subtype /Image /Width '+im.w+' /Height '+im.h+' /ColorSpace /DeviceGray /BitsPerComponent 8'+(im.alpha.filter?' /Filter /'+im.alpha.filter:'')+' /Length '+im.alpha.data.length+' >>',im.alpha.data);sm=' /SMask '+sid+' 0 R'}
    return add('<< /Type /XObject /Subtype /Image /Width '+im.w+' /Height '+im.h+' /ColorSpace /'+im.cs+' /BitsPerComponent 8'+(im.filter?' /Filter /'+im.filter:'')+sm+' /Length '+im.data.length+' >>',im.data)});
  const xo=imgIds.map((id,i)=>'/Im'+i+' '+id+' 0 R').join(' ');
  const res='<< /Font << /F1 '+f1+' 0 R /F2 '+f2+' 0 R >>'+(xo?' /XObject << '+xo+' >>':'')+' >>';
  const pageIds=this.pages.map(ops=>{const body=A(ops.join('\n'));const cid=add('<< /Length '+body.length+' >>',body);
    return add('<< /Type /Page /Parent '+pagesId+' 0 R /MediaBox [0 0 '+fx(this.W)+' '+fx(this.H)+'] /Resources '+res+' /Contents '+cid+' 0 R >>')});
  objs[root].dict='<< /Type /Catalog /Pages '+pagesId+' 0 R >>';
  objs[pagesId].dict='<< /Type /Pages /Kids ['+pageIds.map(i=>i+' 0 R').join(' ')+'] /Count '+pageIds.length+' >>';
  push(A('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'));
  for(let i=1;i<=n;i++){offs[i]=pos;const o=objs[i];push(A(i+' 0 obj\n'+o.dict+'\n'));if(o.stream){push(A('stream\n'));push(o.stream);push(A('\nendstream\n'))}push(A('endobj\n'))}
  const xr=pos;let t='xref\n0 '+(n+1)+'\n0000000000 65535 f \n';for(let i=1;i<=n;i++)t+=String(offs[i]).padStart(10,'0')+' 00000 n \n';
  t+='trailer\n<< /Size '+(n+1)+' /Root '+root+' 0 R >>\nstartxref\n'+xr+'\n%%EOF';push(A(t));
  const out=new Uint8Array(pos);let p=0;parts.forEach(u=>{out.set(u,p);p+=u.length});return out}
};

/* ---------- Gambar (logo, stempel) ---------- */
const loadImg=src=>new Promise((ok,no)=>{const im=new Image();im.onload=()=>ok(im);im.onerror=()=>no(new Error('gambar'));im.src=src});
const b64=s=>{const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u};
function jpgInfo(u){let i=2;while(i<u.length-9){if(u[i]!==255){i++;continue}const m=u[i+1];
  if(m>=0xC0&&m<=0xCF&&m!==0xC4&&m!==0xC8&&m!==0xCC)return{h:(u[i+5]<<8)|u[i+6],w:(u[i+7]<<8)|u[i+8],n:u[i+9]};
  i+=2+((u[i+2]<<8)|u[i+3])}return null}
async function deflate(u){try{if(typeof CompressionStream==='undefined')return null;
  const s=new Blob([u]).stream().pipeThrough(new CompressionStream('deflate'));return new Uint8Array(await new Response(s).arrayBuffer())}catch(e){return null}}
async function fromCanvas(c){const w=c.width,h=c.height,d=c.getContext('2d').getImageData(0,0,w,h).data,rgb=new Uint8Array(w*h*3),al=new Uint8Array(w*h);let ha=false;
  for(let i=0,j=0,k=0;i<d.length;i+=4,j+=3,k++){rgb[j]=d[i];rgb[j+1]=d[i+1];rgb[j+2]=d[i+2];al[k]=d[i+3];if(d[i+3]<255)ha=true}
  const z=await deflate(rgb),za=ha?await deflate(al):null;
  return{w,h,cs:'DeviceRGB',data:z||rgb,filter:z?'FlateDecode':null,alpha:ha?{data:za||al,filter:za?'FlateDecode':null}:null}}
async function prepImage(src){
  try{const m=/^data:image\/jpe?g;base64,(.*)$/i.exec(src||'');
   if(m){const u=b64(m[1]),inf=jpgInfo(u);if(inf&&(inf.n===1||inf.n===3))return{w:inf.w,h:inf.h,cs:inf.n===1?'DeviceGray':'DeviceRGB',data:u,filter:'DCTDecode',alpha:null}}
   const im=await loadImg(src),k=Math.min(1,700/Math.max(im.naturalWidth||im.width,im.naturalHeight||im.height)),c=document.createElement('canvas');
   c.width=Math.max(1,Math.round((im.naturalWidth||im.width)*k));c.height=Math.max(1,Math.round((im.naturalHeight||im.height)*k));
   c.getContext('2d').drawImage(im,0,0,c.width,c.height);return await fromCanvas(c)}catch(e){return null}}
async function stampRec(at){
  try{let src;if(S.set.stempel)src=S.set.stempel;else{const m=/<svg[\s\S]*<\/svg>/.exec(stampHTML({ttd:{at}}));if(!m)return null;
     src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(m[0].replace(/ style="[^"]*"/,'').replace('<svg','<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"'))}
   const im=await loadImg(src),c=document.createElement('canvas');c.width=c.height=384;const x=c.getContext('2d');
   const iw=im.naturalWidth||im.width||96,ih=im.naturalHeight||im.height||96,k=Math.min(330/iw,330/ih);
   x.translate(192,192);x.rotate(-8*Math.PI/180);x.drawImage(im,-iw*k/2,-ih*k/2,iw*k,ih*k);return await fromCanvas(c)}catch(e){return null}}
function qrMatrix(t){try{const q=qrcode(0,'M');q.addData(t);q.make();const n=q.getModuleCount();return{n,dark:(r,c)=>q.isDark(r,c)}}catch(e){return null}}

/* ---------- Terbilang (angka jadi kata) ---------- */
function terbilang(n){n=Math.floor(Math.abs(Number(n)||0));const s=['','satu','dua','tiga','empat','lima','enam','tujuh','delapan','sembilan','sepuluh','sebelas'];
  const t=n=>{if(n<12)return s[n];if(n<20)return t(n-10)+' belas';if(n<100)return t(Math.floor(n/10))+' puluh'+(n%10?' '+t(n%10):'');
   if(n<200)return 'seratus'+(n>100?' '+t(n-100):'');if(n<1e3)return t(Math.floor(n/100))+' ratus'+(n%100?' '+t(n%100):'');
   if(n<2e3)return 'seribu'+(n>1e3?' '+t(n-1e3):'');if(n<1e6)return t(Math.floor(n/1e3))+' ribu'+(n%1e3?' '+t(n%1e3):'');
   if(n<1e9)return t(Math.floor(n/1e6))+' juta'+(n%1e6?' '+t(n%1e6):'');if(n<1e12)return t(Math.floor(n/1e9))+' miliar'+(n%1e9?' '+t(n%1e9):'');
   return t(Math.floor(n/1e12))+' triliun'+(n%1e12?' '+t(n%1e12):'')};
  const r=n===0?'nol':t(n);return r.charAt(0).toUpperCase()+r.slice(1)+' rupiah'}

/* ---------- Rekening pembayaran ---------- */
function parseBank(s){s=(s||'').trim();if(!s)return[];
  return s.split(/\s*(?:\n|;|\s\/\s)\s*/).filter(Boolean).map(x=>{const m=/^(.*?)\s*[:\-]?\s*([0-9][0-9\-\. ]{4,}[0-9])\s*(?:a\.?\s*n\.?\s*[:.]?\s*(.*))?$/i.exec(x);
   return m?{id:uid('bk'),bank:(m[1]||'').trim()||'Bank',no:m[2].trim(),an:(m[3]||'').trim()}:{id:uid('bk'),bank:x,no:'',an:''}})}
function banks(){if(!Array.isArray(S.set.banks))S.set.banks=parseBank(S.set.bank);return S.set.banks}
function syncBank(){S.set.bank=banks().map(b=>[b.bank,b.no,b.an?'a.n. '+b.an:''].filter(Boolean).join(' ')).join('\n')}
window.bankList=banks;
window.bankHTML=function(){const L=banks().filter(b=>b.bank||b.no);if(!L.length)return '';
  return `<div style="margin-top:16px;border:1px solid #cfd5ea;border-radius:8px;overflow:hidden;color:#10163a"><div style="background:#eef0ff;padding:7px 12px;font-size:11px;font-weight:700;letter-spacing:.1em;color:#3a4df0">INFORMASI PEMBAYARAN</div>${L.map((b,k)=>`<div style="display:flex;flex-wrap:wrap;gap:4px 18px;padding:8px 12px;${k?'border-top:1px solid #e3e7f5;':''}font-size:13px"><b style="min-width:70px">${esc(b.bank)}</b><span style="font-weight:700;letter-spacing:.03em">${esc(b.no)}</span><span style="color:#5d6585">${b.an?'a.n. '+esc(b.an):''}</span></div>`).join('')}</div>`};

function rekCard(){if(!(isAp()||isSA()))return '';const L=banks();
  return `<div class="card"><h3>Rekening pembayaran</h3><p style="margin:0 0 10px;color:var(--muted);font-size:13px">Semua rekening di bawah tampil pada bagian Informasi pembayaran di invoice dan nota (layar, cetak, dan PDF). Tambah rekening baru atau ubah yang sudah ada.</p>
  ${L.length?`<div class="tw"><table><thead><tr><th>Bank</th><th>No. rekening</th><th>Atas nama</th><th></th></tr></thead><tbody>${L.map(b=>`<tr><td><b>${esc(b.bank)}</b></td><td class="num">${esc(b.no)}</td><td>${esc(b.an)}</td><td class="r" style="white-space:nowrap"><button class="btn sm" data-act="rekEdit" data-id="${b.id}">Edit</button> <button class="btn sm del" data-act="rekDel" data-id="${b.id}">Hapus</button></td></tr>`).join('')}</tbody></table></div>`:'<p class="empty">Belum ada rekening. Invoice akan tampil tanpa informasi pembayaran.</p>'}
  <div class="row" style="margin-top:12px"><button class="btn sm pri" data-act="rekAdd">Tambah rekening</button></div></div>`}
window.rekCard=rekCard;
const rekOK=()=>{if(isAp()||isSA())return true;toast('Hanya Direktur yang dapat mengubah rekening');return false};
const rekFields=[{k:'bank',l:'Nama bank',req:1},{k:'no',l:'Nomor rekening',req:1},{k:'an',l:'Atas nama',wide:1}];
A.rekAdd=()=>{if(!rekOK())return;form('Tambah rekening',rekFields,{bank:'',no:'',an:S.set.nama||''},v=>{
  banks().push({id:uid('bk'),bank:v.bank.trim(),no:v.no.trim(),an:v.an.trim()});syncBank();save();render();toast('Rekening ditambahkan')})};
A.rekEdit=b=>{if(!rekOK())return;const r=banks().find(x=>x.id===b.dataset.id);if(!r)return;form('Edit rekening',rekFields,r,v=>{
  r.bank=v.bank.trim();r.no=v.no.trim();r.an=v.an.trim();syncBank();save();render();toast('Rekening diperbarui')})};
A.rekDel=b=>{if(!rekOK())return;const r=banks().find(x=>x.id===b.dataset.id);if(!r)return;
  modal(`<h2 style="font-size:20px">Hapus rekening?</h2><div class="info"><b>${esc(r.bank)}</b> ${esc(r.no)}${r.an?' a.n. '+esc(r.an):''}<br>Rekening ini tidak akan tampil lagi di invoice baru maupun lama.</div><div class="row" style="justify-content:flex-end"><button class="btn" data-act="close">Batal</button><button class="btn pri" data-act="rekDelOk" data-id="${r.id}">Ya, hapus</button></div>`)};
A.rekDelOk=b=>{if(!rekOK())return;S.set.banks=banks().filter(x=>x.id!==b.dataset.id);syncBank();save();closeModal();render();toast('Rekening dihapus')};
/* kolom rekening di form "Alamat dan kontak" dipindah ke kartu Rekening */
A.kopEdit=()=>{const k=kopOf();form('Alamat dan kontak perusahaan',[{k:'alamat',l:'Alamat perusahaan',wide:1,def:k.alamat},{k:'telp',l:'Telepon / WA (pisahkan dengan titik tengah)',wide:1,def:k.telp},{k:'email',l:'Email',def:k.email}],k,v=>{
  S.set.kop={...(S.set.kop||{}),alamat:v.alamat.trim(),telp:v.telp.trim(),email:v.email.trim()};save();render();toast('Kop dokumen tersimpan')})};
{const _apr=V.apr;V.apr=()=>{let h=_apr();const m='<div class="card"><h3>Tarif PPN</h3>',i=h.indexOf(m);return i>-1?h.slice(0,i)+rekCard()+h.slice(i):h+rekCard()}}

/* ---------- Tata letak dokumen ---------- */
const C={ink:'#10163a',navy:'#0d1237',brand:'#3a4df0',soft:'#eef0ff',gray:'#5d6585',line:'#cfd5ea',line2:'#e3e7f5',zebra:'#f8f9ff',good:'#12936a',warn:'#c4650f',white:'#ffffff'};
const PW=595.28,PH=841.89,M=42,CW=PW-2*M,LIM=PH-64;

async function build(sp){
  const k=kopOf(),p=new PDF();let y=0;
  const logo=k.logo?await prepImage(k.logo):null,li=logo?p.addImage(logo):-1;
  const st=sp.sig?await stampRec(sp.sig.at):null,si=st?p.addImage(st):-1;
  const qr=sp.sig?qrMatrix(sp.sig.qr):null;
  const eyebrow=(t,x,yy)=>p.text(t,x,yy,{size:7.5,bold:1,color:C.brand,sp:.8});
  function bar(){p.rect(0,0,PW,7,{fill:C.brand})}
  function head(){bar();
    if(logo){const s=68,r=Math.min(s/logo.w,s/logo.h);p.image(li,M,24,logo.w*r,logo.h*r)}
    const tx=M+(logo?82:0);
    p.text(S.set.nama||'',tx,44,{size:18,bold:1,color:C.navy});
    p.text('Ahli Sejuk, Andalan Anda',tx,58,{size:10,bold:1,color:C.brand});
    p.text('Servis · Cuci · Instalasi AC',tx,70,{size:8.5,color:C.gray});
    let yy=83;if(k.alamat){p.text(k.alamat,tx,yy,{size:8.5});yy+=11}
    if(k.telp){const mw=PW-M-tx-(sp.badge?112:8),segs=k.telp.split(/\s*·\s*/).filter(Boolean),ls=[];let cur='';
      segs.forEach(g=>{const t=cur?cur+'  ·  '+g:g;if(cur&&p.width(t,8.5,0)>mw){ls.push(cur);cur=g}else cur=t});if(cur)ls.push(cur);
      ls.forEach(l=>{p.text(l,tx,yy,{size:8.5});yy+=11})}
    if(k.email){p.text('Email: '+k.email,tx,yy,{size:8.5});yy+=11}
    {const nw=p.width(S.set.nama||'',18,1),av=PW-M-(tx+nw+18);let ts=22;while(ts>13&&p.width(sp.title,ts,1,1.4)>av)ts-=1;p.text(sp.title,PW-M,48,{size:ts,bold:1,color:C.brand,sp:1.4,align:'r'})}
    p.text(sp.no,PW-M,64,{size:11.5,bold:1,color:C.navy,align:'r'});
    if(sp.badge){const w=p.width(sp.badge.t,8.5,1,.8)+22;p.rect(PW-M-w,72,w,17,{r:8.5,stroke:sp.badge.c,lw:1.2});p.text(sp.badge.t,PW-M-w/2,83.6,{size:8.5,bold:1,color:sp.badge.c,sp:.8,align:'c'})}
    y=Math.max(yy,92)+6;
    p.line(M,y,PW-M,y,{color:C.navy,lw:1.8});p.line(M,y+3.2,PW-M,y+3.2,{color:C.navy,lw:.5});y+=22}
  function cont(){p.page();bar();
    p.text(S.set.nama||'',M,32,{size:11,bold:1,color:C.navy});
    p.text(sp.title+'  '+sp.no,PW-M,32,{size:9.5,bold:1,color:C.brand,align:'r'});
    p.line(M,41,PW-M,41,{color:C.navy,lw:1});y=58}
  function ensure(h){if(y+h>LIM)cont()}

  p.page();head();

  /* kotak No. Referensi (penawaran) */
  if(sp.ref){const nl=p.wrap(sp.ref.note,215,8.5,0),h=Math.max(46,nl.length*11+18);
    p.rect(M,y,CW,h,{r:6,stroke:C.navy,lw:1.6});eyebrow(sp.ref.label.toUpperCase(),M+14,y+17);
    p.text(sp.ref.value,M+14,y+h-13,{size:20,bold:1,color:C.navy,sp:.8});
    nl.forEach((l,i)=>p.text(l,PW-M-14,y+(h-nl.length*11)/2+8+i*11,{size:8.5,color:C.gray,align:'r'}));y+=h+16}

  /* kotak pihak dan detail dokumen */
  {const LW=262,GAP=14,RW=CW-LW-GAP,pl=[];
   sp.party.lines.forEach((l,i)=>p.wrap(l.t,LW-28,l.size||9.5,l.bold).forEach(x=>pl.push({t:x,b:l.bold,s:l.size||9.5})));
   const ml=sp.meta.map(m=>({l:m[0],v:p.wrap(m[1],RW-28-84,9.5,1)}));
   const lh=24+pl.length*13+10,rh=24+ml.reduce((a,m)=>a+m.v.length*13+2,0)+10,h=Math.max(lh,rh,70);ensure(h);
   const box=(x,w,label)=>{p.rect(x,y,w,h,{r:6,stroke:C.line,lw:.9});p.rect(x+.5,y+.5,w-1,19,{r:5.5,fill:C.soft});p.rect(x+.5,y+12,w-1,8,{fill:C.soft});eyebrow(label,x+14,y+14)};
   box(M,LW,sp.party.label);box(M+LW+GAP,RW,'DETAIL DOKUMEN');
   let yy=y+37;pl.forEach(l=>{p.text(l.t,M+14,yy,{size:l.s,bold:l.b,color:l.b?C.navy:C.ink});yy+=13});
   yy=y+37;const rx=M+LW+GAP;ml.forEach(m=>{p.text(m.l,rx+14,yy,{size:8.5,color:C.gray});m.v.forEach((t,i)=>{p.text(t,rx+RW-14,yy+i*13,{size:9.5,bold:1,align:'r'})});yy+=m.v.length*13+2});
   y+=h+20}

  /* tabel item */
  const cw=[30,0,46,92,100];cw[1]=CW-cw[0]-cw[2]-cw[3]-cw[4];
  const cx=[M];for(let i=0;i<cw.length;i++)cx.push(cx[i]+cw[i]);
  const heads=['NO','DESKRIPSI','QTY','HARGA','JUMLAH'],al=['c','l','r','r','r'];
  const cell=(t,i,yy,o)=>{o=o||{};const pad=9;let x=al[i]==='l'?cx[i]+pad:al[i]==='r'?cx[i+1]-pad:cx[i]+cw[i]/2;p.text(t,x,yy,{size:o.size||9.5,bold:o.bold,color:o.color,align:al[i]==='l'?'l':al[i]==='r'?'r':'c',sp:o.sp})};
  function thead(){p.rect(M,y,CW,23,{fill:C.navy});heads.forEach((h,i)=>cell(h,i,y+15,{size:8,bold:1,color:'#ffffff',sp:.7}));y+=23}
  ensure(23+30);thead();
  const rows=sp.items.length?sp.items:[{desc:'-',qty:'',harga:'',jml:''}];
  rows.forEach((r,idx)=>{const dl=p.wrap(r.desc,cw[1]-18,9.5,0),h=Math.max(26,dl.length*12.5+12);
    if(y+h>LIM){p.line(M,y,PW-M,y,{color:C.navy,lw:.9});cont();thead()}
    if(idx%2)p.rect(M,y,CW,h,{fill:C.zebra});
    for(let i=1;i<cw.length;i++)p.line(cx[i],y,cx[i],y+h,{color:C.line2,lw:.5});
    p.line(M,y,M,y+h,{color:C.navy,lw:.9});p.line(PW-M,y,PW-M,y+h,{color:C.navy,lw:.9});
    p.line(M,y+h,PW-M,y+h,{color:C.line2,lw:.5});
    const b0=y+(h-dl.length*12.5)/2+9;
    cell(String(idx+1),0,b0,{color:C.gray});dl.forEach((l,i)=>p.text(l,cx[1]+9,b0+i*12.5,{size:9.5}));
    cell(String(r.qty),2,b0);cell(r.harga===''?'':rp(r.harga),3,b0);cell(r.jml===''?'':rp(r.jml),4,b0,{bold:1});y+=h});
  p.line(M,y,PW-M,y,{color:C.navy,lw:.9});y+=18;

  /* total dan catatan */
  {const TW=246,rowsT=sp.totals,gh=34,th=rowsT.length*20+gh,LW=CW-TW-30;
   const left=[];if(sp.terbilang!=null)left.push({lab:'TERBILANG',lines:p.wrap('# '+terbilang(sp.terbilang)+' #',LW,9.5,1),b:1});
   (sp.notes||[]).forEach(n=>left.push({lab:n.lab,lines:p.wrap(n.t,LW,n.size||9,0),c:C.gray}));
   const lh=left.reduce((a,l)=>a+14+l.lines.length*12+8,0),h=Math.max(th,lh);ensure(h);
   let ly=y;left.forEach(l=>{eyebrow(l.lab,M,ly+8);ly+=14;l.lines.forEach(t=>{p.text(t,M,ly+8,{size:l.size||9.5,bold:l.b,color:l.c||C.ink});ly+=12});ly+=8});
   const tx=PW-M-TW;p.rect(tx,y,TW,th,{r:6,stroke:C.line,lw:.9});let ty=y;
   rowsT.forEach((r,i)=>{if(i)p.line(tx+10,ty,tx+TW-10,ty,{color:C.line2,lw:.5});p.text(r.l,tx+14,ty+13.5,{size:r.small?8.5:9.5,color:C.gray});p.text(r.v,tx+TW-14,ty+13.5,{size:r.small?8.5:9.5,bold:!r.small,align:'r'});ty+=20});
   p.rect(tx,ty,TW,gh,{r:6,fill:C.navy});p.rect(tx,ty,TW,8,{fill:C.navy});
   p.text(sp.grand.l,tx+14,ty+21.5,{size:10,bold:1,color:'#ffffff',sp:1});p.text(sp.grand.v,tx+TW-14,ty+22,{size:14,bold:1,color:'#ffffff',align:'r'});
   y+=h+20}

  /* informasi pembayaran */
  if(sp.bank&&sp.bank.length){const rh=22,h=22+16+sp.bank.length*rh+(sp.bankNote?20:6);ensure(h);
    p.rect(M,y,CW,h,{r:6,stroke:C.line,lw:.9});p.rect(M+.5,y+.5,CW-1,19,{r:5.5,fill:C.soft});p.rect(M+.5,y+12,CW-1,8,{fill:C.soft});eyebrow('INFORMASI PEMBAYARAN',M+14,y+14);
    const c1=M+14,c2=M+130,c3=M+300;let yy=y+34;
    p.text('BANK',c1,yy,{size:7.5,bold:1,color:C.gray,sp:.6});p.text('NO. REKENING',c2,yy,{size:7.5,bold:1,color:C.gray,sp:.6});p.text('ATAS NAMA',c3,yy,{size:7.5,bold:1,color:C.gray,sp:.6});yy+=6;
    sp.bank.forEach(b=>{p.line(M+10,yy,PW-M-10,yy,{color:C.line2,lw:.5});p.text(b.bank,c1,yy+15,{size:10,bold:1,color:C.navy});p.text(b.no,c2,yy+15,{size:10.5,bold:1,sp:.3});p.text(b.an,c3,yy+15,{size:9.5});yy+=rh});
    if(sp.bankNote)p.text(sp.bankNote,M+14,yy+11,{size:8,color:C.gray});y+=h+18}

  /* tanda tangan digital */
  if(sp.sig){const h=112;ensure(h);p.line(M,y,PW-M,y,{color:C.line,lw:.7,dash:'3 3'});y+=14;
    if(qr){const cell2=84/(qr.n+4),ox=M,oy=y;p.rect(ox,oy,84,84,{fill:'#ffffff',stroke:C.line2,lw:.5});
      for(let r=0;r<qr.n;r++){let c=0;while(c<qr.n){if(qr.dark(r,c)){let e=c;while(e<qr.n&&qr.dark(r,e))e++;p.rect(ox+(c+2)*cell2,oy+(r+2)*cell2,(e-c)*cell2+.15,cell2+.15,{fill:C.ink});c=e}else c++}}}
    const tx=M+(qr?100:0);eyebrow('TANDA TANGAN DIGITAL',tx,y+12);
    sp.sig.lines.forEach((l,i)=>p.text(l,tx,y+30+i*14,{size:9.5,bold:i===0,color:i===0?C.navy:C.gray}));
    p.text('Kode verifikasi',tx,y+30+sp.sig.lines.length*14+4,{size:8,color:C.gray});p.text(sp.sig.kode,tx,y+30+sp.sig.lines.length*14+17,{size:11,bold:1,color:C.navy,sp:1.2});
    if(st){const s=98;p.image(si,PW-M-s,y-6,s,s)}y+=h-14}

  /* footer semua halaman */
  const tot=p.pages.length;
  p.pages.forEach((pg,i)=>{p.cur=pg;p.rect(0,PH-5,PW,5,{fill:C.brand});p.line(M,PH-42,PW-M,PH-42,{color:C.line,lw:.6});
    p.text((S.set.nama||'')+'  ·  '+sp.no,M,PH-28,{size:8,color:C.gray});
    p.text('Halaman '+(i+1)+' dari '+tot,PW-M,PH-28,{size:8,color:C.gray,align:'r'})});
  return p.build()}

/* ---------- Spesifikasi invoice dan penawaran ---------- */
function bankSpec(){return banks().filter(b=>b.bank||b.no).map(b=>({bank:b.bank||'',no:b.no||'',an:b.an||''}))}
function specInv(i){const t=invTot(i),o=i.ref&&S.orders.find(q=>q.id===i.ref),pn=i.pnwNo||(S.pnw.find(q=>q.id===i.pnwId)||{}).no,lunas=invStat(i)==='Lunas';
  const meta=[['Tanggal',fd(i.tgl)],['Jatuh tempo',fd(i.tempo)]];if(o){meta.push(['Ref. Order',o.id]);if(o.teknisi)meta.push(['Teknisi',empNm(o.teknisi)])}if(pn)meta.push(['Ref. Penawaran',pn]);
  const tr=[];if(i.diskon||(i.ppn&&i.ppn.mode==='excl'))tr.push({l:'Subtotal',v:rp(t.sub)});if(i.diskon)tr.push({l:i.dnama||'Diskon',v:'-'+rp(i.diskon)});
  if(i.ppn&&i.ppn.mode==='excl')tr.push({l:'PPN '+i.ppn.rate+'% (material)',v:rp(t.ppn)});
  const notes=[];if(i.ppn&&i.ppn.mode==='incl')notes.push({lab:'PPN',t:'Harga material sudah termasuk PPN '+i.ppn.rate+'%: '+rp(t.ppn),size:8.5});
  const ttd=i.ttd,pl=ttd?['INVOICE '+i.no,S.set.nama,'TOTAL '+t.tot,'DISETUJUI '+ttd.oleh+' ('+ttd.role+')',ttd.at,'KODE '+ttd.kode].join('|'):'';
  return{title:'INVOICE',no:i.no,badge:{t:lunas?'LUNAS':'BELUM LUNAS',c:lunas?C.good:C.warn},
   party:{label:'DITAGIHKAN KEPADA',lines:[{t:i.nama,bold:1,size:11},{t:i.alamat||''},{t:i.hp||''}].filter(l=>l.t)},meta,
   items:i.items.map(x=>({desc:x.desc,qty:x.qty,harga:x.harga,jml:x.qty*x.harga})),totals:tr,grand:{l:'TOTAL',v:rp(t.tot)},terbilang:t.tot,notes,
   bank:bankSpec(),bankNote:'Mohon cantumkan nomor '+i.no+' pada berita transfer.',
   sig:ttd?{qr:pl,at:(ttd.at||'').slice(0,10),kode:ttd.kode,lines:['Disetujui oleh '+ttd.oleh+' ('+ttd.role+')',ttd.at]}:null}}
function specPnw(p){const L=(p.lines||[]).filter(x=>x.desc||x.qty),kode=fnv(p.no+'|'+p.total+'|'+(p.apprOleh||'')+'|'+(p.apprTgl||'')),
  pl=['PENAWARAN '+p.no,S.set.nama,'TOTAL '+p.total,'DISETUJUI '+(p.apprOleh||'Direktur'),p.apprTgl||'','KODE '+kode].join('|');
  const tr=[{l:'Subtotal',v:rp(p.sub)}];if(p.dsk)tr.push({l:'Diskon',v:'-'+rp(p.dsk)});if(p.ongkir)tr.push({l:'Ongkos kirim',v:rp(p.ongkir)});if(p.pasang)tr.push({l:'Jasa pasang',v:rp(p.pasang)});
  if(p.ppn==='excl'&&p.ppnVal)tr.push({l:'PPN '+p.ppnRate+'% (material '+rp(p.ppnMat)+')',v:rp(p.ppnVal)});
  const notes=[];if(p.ppn==='incl'&&p.ppnVal)notes.push({lab:'PPN',t:'Harga material sudah termasuk PPN '+p.ppnRate+'%: '+rp(p.ppnVal),size:8.5});
  if(p.cat)notes.push({lab:'CATATAN',t:p.cat});
  notes.push({lab:'MASA BERLAKU',t:'Penawaran berlaku sampai '+fd(p.berlaku)+'. Harga dapat berubah setelah masa berlaku berakhir.',size:8.5});
  return{title:'PENAWARAN HARGA',no:p.no,
   ref:{label:'No. Referensi Penawaran',value:p.no,note:'Sebutkan nomor ini ke admin saat pembuatan invoice. Invoice hanya bisa dibuat dari penawaran yang sudah disetujui.'},
   party:{label:'DITUJUKAN KEPADA',lines:[{t:p.kantor,bold:1,size:11},{t:p.alamat||''},{t:p.hp||''}].filter(l=>l.t)},
   meta:[['Tanggal',fd(p.tgl)],['Berlaku sampai',fd(p.berlaku)],['Sales',empNm(p.sid)]],
   items:L.map(x=>({desc:x.desc,qty:x.qty,harga:x.harga,jml:x.qty*x.harga})),totals:tr,grand:{l:'TOTAL',v:rp(p.total)},terbilang:p.total,notes,bank:null,
   sig:{qr:pl,at:p.apprTgl||TODAY,kode,lines:['Disetujui oleh '+(p.apprOleh||'Direktur')+' (Direktur)',p.apprTgl?fd(p.apprTgl):'']}}}

const pdfInv=i=>build(specInv(i)),pdfPnw=p=>build(specPnw(p));
window.pdfInv=pdfInv;window.pdfPnw=pdfPnw;

/* ---------- Tombol unduh dan cetak ---------- */
function openPdf(u8,name){const url=URL.createObjectURL(new Blob([u8],{type:'application/pdf'})),w=window.open(url,'_blank');
  if(!w){saveFile(name,u8);return}setTimeout(()=>URL.revokeObjectURL(url),120000)}
async function run(get,name,mode){toast('Membuat PDF...');try{const u8=await get();mode==='print'?openPdf(u8,name):saveFile(name,u8)}catch(e){console.error(e);toast('PDF gagal dibuat, coba lagi')}}
const getInv=b=>{const i=S.inv.find(x=>x.id===b.dataset.id);if(!i)return null;if(!okInv(i)){toast('Invoice belum disetujui Direktur');return null}return i};
const getPnw=b=>{const p=S.pnw.find(x=>x.id===b.dataset.id);if(!p)return null;if(p.appr!=='Disetujui'){toast('Penawaran harus disetujui Direktur dulu');return null}return p};
A.dlInv=b=>{const i=getInv(b);if(i)run(()=>pdfInv(i),i.no+'.pdf')};
A.prtInv=b=>{const i=getInv(b);if(i)run(()=>pdfInv(i),i.no+'.pdf','print')};
A.pnDl=b=>{const p=getPnw(b);if(p)run(()=>pdfPnw(p),p.no+'.pdf')};
A.pnPrint=b=>{const p=getPnw(b);if(p)run(()=>pdfPnw(p),p.no+'.pdf','print')};
})();

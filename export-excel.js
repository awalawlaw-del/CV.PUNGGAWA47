/* =====================================================================
   export-excel.js
   Export data ke Excel (.xlsx) untuk SEMUA peran.
   - Tombol "Export Excel" muncul di header tiap menu: mengekspor SELURUH data menu
     itu (bukan hanya 15 baris yang tampil di halaman).
   - Tombol "Export semua data (Excel)" di menu samping: satu file berisi semua lembar
     dari menu yang boleh dibuka oleh peran tersebut.
   - Data dibatasi sesuai peran (teknisi hanya order miliknya, sales hanya data sales itu,
     dst). Kata sandi karyawan TIDAK pernah ikut diekspor.
   Dimuat setelah script utama (butuh S, SES, A, render, dll).
   ===================================================================== */
"use strict";
const xlSH=(name,rows)=>({name,rows});
const xlOwn=()=>SES.empId||(S.emps.find(e=>e.role===SES.role)||{}).id||'';
const xlNm=id=>id?empNm(id):'';
const xlBoss=()=>SES.role==='admin'||SES.role==='direktur';
const xlDesc=(a,k)=>a.slice().sort((x,y)=>x[k]<y[k]?1:x[k]>y[k]?-1:0);
const xlMat=o=>(o.pakai||[]).map(p=>{const s=S.stok.find(x=>x.id===p.sid);return s?s.nama+' '+p.qty+' '+s.sat:''}).filter(Boolean).join(', ');
const xlLoc=p=>p?p.lat+', '+p.lng+(p.d!=null?' ('+p.d+' m dari kantor)':''):'';

/* ---------- Order, pelanggan ---------- */
function xlOrders(){const T=SES.role==='teknisi',L=xlDesc(T?S.orders.filter(o=>o.teknisi===SES.empId):S.orders,'tgl');
 return [xlSH('Order',L.map(o=>{const r={'No. Order':o.id,'Tanggal':o.tgl,'Jam':o.jam||'','Pelanggan':o.nama,'No. WA':o.hp||'','Alamat':o.alamat||'','Layanan':o.layanan,'Unit':o.unit,'Teknisi':xlNm(o.teknisi),'Jenis kerja':o.bobot||'Ringan','Kontraktor':o.kontraktor||'Tidak','Status':o.status,'Material dipakai':xlMat(o),'Catatan':o.catatan||'','Alasan batal':o.alasanBatal||''};
  if(!T){r['Nilai (Rp)']=o.nilai;r['No. Nota']=(notaOf(o)||{}).no||''}return r}))]}
function xlCust(){if(SES.role==='teknisi'||SES.role==='sales')return [];
 return [xlSH('Pelanggan',S.cust.map(c=>({'No. Customer':c.no||'','Nama':c.nama,'No. WA':c.hp||'','Alamat':c.alamat||''})))]}

/* ---------- Invoice ---------- */
function xlInv(){const L=xlDesc(S.inv,'tgl');
 return [xlSH('Invoice',L.map(i=>{const t=invTot(i);return{'No. Invoice':i.no,'Tanggal':i.tgl,'Jatuh tempo':i.tempo,'Pelanggan':i.nama,'No. Customer':i.cno||'','No. WA':i.hp||'','Alamat':i.alamat||'','Subtotal (Rp)':t.sub,'Diskon (Rp)':i.diskon||0,'PPN (Rp)':t.ppn||0,'Total (Rp)':t.tot,'Status':invStat(i),'Ref. Order':i.ref||'','Ref. Penawaran':i.pnwNo||'','Sales':xlNm(i.slsId),'Teknisi':xlNm(i.tek),'Dibuat oleh':i.oleh||'','Disetujui oleh':(i.ttd||{}).oleh||'','Tanggal lunas':i.status==='Lunas'?lunasD(i):''}})),
  xlSH('Item Invoice',L.flatMap(i=>(i.items||[]).map(x=>({'No. Invoice':i.no,'Deskripsi':x.desc,'Jenis':(x.jenis==='barang'||x.sid)?'Material':'Jasa','Qty':x.qty,'Harga (Rp)':x.harga,'Jumlah (Rp)':x.qty*x.harga}))))]}

/* ---------- Keuangan & jurnal ---------- */
function xlKeu(){const T=xlDesc(S.tx,'tgl'),E=jEntries(S.tx.slice().sort((a,b)=>a.tgl<b.tgl?-1:a.tgl>b.tgl?1:0)),mo={};
 OKTX().forEach(t=>{const k=t.tgl.slice(0,7),x=mo[k]=mo[k]||{m:0,k:0};if(t.jenis==='Pemasukan')x.m+=t.jml;else x.k+=t.jml});
 return [xlSH('Transaksi',T.map(t=>({'Tanggal':t.tgl,'No. Referensi':jKey(t),'Jenis':t.jenis,'Kategori':t.kat,'Keterangan':t.ket,'Akun':t.akun,'Jumlah (Rp)':t.jml,'Status':t.appr||'Disetujui'}))),
  xlSH('Jurnal',E.flatMap(e=>e.lines.map(l=>({'Tanggal':e.tgl,'No. Referensi':e.key,'Keterangan':e.ket,'Akun':l.a,'Debit (Rp)':l.d,'Kredit (Rp)':l.k})))),
  xlSH('Ringkasan Bulanan',Object.keys(mo).sort().map(k=>({'Bulan':k,'Pemasukan (Rp)':mo[k].m,'Pengeluaran (Rp)':mo[k].k,'Laba (Rp)':mo[k].m-mo[k].k})))]}

/* ---------- Analisa penjualan ---------- */
function xlAna(){const R=xlDesc(salesRows(),'t'),m={};R.forEach(r=>{const k=r.t.slice(0,7);m[k]=(m[k]||0)+r.v});
 return [xlSH('Penjualan',R.map(r=>({'Tanggal':r.t,'Jasa / Barang':r.d,'Nilai (Rp)':r.v}))),
  xlSH('Omzet Bulanan',Object.keys(m).sort().map(k=>({'Bulan':k,'Omzet (Rp)':m[k]})))]}

/* ---------- Reminder WA ---------- */
function xlWa(){return [xlSH('Reminder Cuci AC',remList().map(r=>({'Pelanggan':r.nama,'No. WA':r.hp||'','Alamat':r.alamat||'','Terakhir cuci':r.last,'Jatuh tempo':r.due,'Sisa hari':r.left,'Status':r.pending?'Sudah dijadwalkan':r.st,'Pengingat terkirim':r.sent||''})))]}

/* ---------- Persetujuan & log ---------- */
function xlApr(){return [xlSH('Persetujuan',S.req.map(r=>({'Tanggal':r.tgl,'Jenis':RJ[r.jenis]||r.jenis,'Keterangan':r.ket,'Nilai (Rp)':r.jml||0,'Diajukan oleh':r.oleh,'Status':r.st,'Diputuskan oleh':r.oleh2||'','Alasan pengajuan':r.alasan||'','Alasan tolak':r.alasanTolak||''}))),
  xlSH('Log Aksi',(S.log||[]).map(x=>({'Tanggal':x.tgl,'Jam':x.jam,'Oleh':x.oleh,'Peran':x.role,'Aksi':x.aksi,'Data':x.ref,'Alasan':x.alasan})))]}

/* ---------- Absensi (admin/direktur: semua karyawan; peran lain: hanya diri sendiri) ---------- */
function xlAbs(){const E=xlBoss()?S.emps:S.emps.filter(e=>e.id===xlOwn()),R=[];
 Object.keys(S.att).sort().reverse().forEach(d=>E.forEach(e=>{const a=S.att[d][e.id];if(!a)return;
  R.push({'Tanggal':d,'Karyawan':e.nama,'Jabatan':e.jabatan,'Status':(a.s==='Hadir'&&isLate(a.in))?'Hadir, telat':a.s,'Masuk':a.in||a.inP||'','Pulang':a.out||'','Lokasi masuk':xlLoc(a.loc),'Lokasi pulang':xlLoc(a.locOut)})}));
 const out=[xlSH('Absensi',R)];
 if(SES.role==='admin')out.push(xlSH('Karyawan',S.emps.map(e=>({'Nama':e.nama,'Jabatan':e.jabatan,'Tingkat':e.tingkat||'','Target order / bulan':e.target||0}))));
 return out}

/* ---------- Kinerja ---------- */
function xlKinT(){const mo=U.kinM||TODAY.slice(0,7),[y,m]=mo.split('-').map(Number),dm=new Date(y,m,0).getDate(),ds=[];
 for(let d=1;d<=dm;d++){const t=mo+'-'+pad(d);if(pd(t).getDay()!==0&&t<=TODAY)ds.push(t)}
 return [xlSH('Kinerja Teknisi '+mo,S.emps.filter(e=>isTek(e)).map(e=>{
  const jobs=S.orders.filter(o=>o.teknisi===e.id&&o.status==='Selesai'&&o.tgl.startsWith(mo)),h=ds.filter(t=>((S.att[t]||{})[e.id]||{}).s==='Hadir').length,jasa=jasaOf(e.id,mo);
  return{'Karyawan':e.nama,'Jabatan':e.jabatan,'Tingkat':e.tingkat||'','Order selesai':jobs.length,'Target order':e.target||0,'Capaian (%)':pct(jobs.length,e.target),'Nilai order (Rp)':sum(jobs,o=>o.nilai),'Biaya jasa (Rp)':jasa,'Reward (Rp)':rwOf(jasa),'Hari hadir':h,'Hari kerja':ds.length,'Kehadiran (%)':pct(h,ds.length)}}))]}
function xlKinS(){const d0=U.kinD||TODAY,mo=d0.slice(0,7),last=+d0.slice(8),me=mySid(),L=salesL().filter(e=>!me||e.id===me),R=[],J=[];
 L.forEach(e=>{for(let i=1;i<=last;i++){const t=mo+'-'+pad(i);if(pd(t).getDay()===0)continue;const n=sM(e.id,t).n;
   R.push({'Tanggal':t,'Sales':e.nama,'Prospek baru':n.prospek,'Kunjungan / meeting':n.kunj,'Penawaran dikirim':n.pnw,'Follow up':n.fu})}
  const jl=salesJl(e.id,mo);J.push({'Bulan':mo,'Sales':e.nama,'Invoice lunas':jl.length,'Penjualan (Rp)':sum(jl,x=>x.p.total),'Target penjualan (Rp)':sTarget().jual})});
 return [xlSH('Kinerja Sales Harian',R),xlSH('Penjualan Sales',J)]}

/* ---------- Stok, pemasok, surat, sewa ---------- */
function xlStk(){return [xlSH('Stok Material',S.stok.map(s=>({'Barang':s.nama,'Kategori':s.kat,'Satuan':s.sat,'Stok':s.qty,'Minimum':s.min,'Harga beli (Rp)':s.hargaBeli||0,'Harga jual (Rp)':s.harga||0,'Pemasok':s.sup||''}))),
  xlSH('Mutasi Stok',S.mut.map(m=>{const s=S.stok.find(x=>x.id===m.sid)||{nama:'-',sat:''};return{'Tanggal':m.tgl,'Barang':s.nama,'Jenis':m.jenis,'Jumlah':m.qty,'Satuan':s.sat,'Keterangan':m.ket,'Oleh':m.oleh}}))]}
function xlSup(){return [xlSH('Pemasok',S.sup.map(r=>({'Pemasok':r.nama,'Kontak person':r.pic||'','No. HP / WA':r.hp||'','Produk':r.produk||'','Alamat':r.alamat||''})))]}
function xlSrt(){return [xlSH('Surat Masuk-Keluar',xlDesc(S.surat,'tgl').map(r=>({'Tanggal':r.tgl,'Jenis':r.jenis,'No. Surat':r.no||'','Pengirim / tujuan':r.pihak,'Perihal':r.perihal,'Barang / lampiran':r.barang||'','Status':r.status})))]}
function xlSewa(){return [xlSH('Sewa AC',S.sewa.map(r=>({'Penyewa':r.nama,'No. WA':r.hp||'','Alamat':r.alamat||'','Unit AC':r.unit,'Jumlah unit':r.qty,'Mulai':r.mulai,'Berakhir':r.selesai,'Sisa hari':swD(r),'Tarif / unit / bulan (Rp)':r.tarif,'Tarif total / bulan (Rp)':r.tarif*r.qty,'Deposit (Rp)':r.deposit,'Tahap':r.status})))]}

/* ---------- Kunjungan, prospek, penawaran (sales hanya melihat data miliknya) ---------- */
function xlKunj(){const me=SES.role==='sales'?SES.empId:'',K=xlDesc(KJS(),'tgl'),PR=(S.prospek||[]).filter(p=>!me||p.sid===me);
 return [xlSH('Kunjungan',K.map(k=>({'Tanggal':k.tgl,'Kantor':k.kantor,'Alamat':k.alamat||'','Kontak':k.kontak||'','Ditemui':k.ditemui||'','Jenis':k.tipe||'Kunjungan','Sales':xlNm(k.sid),'Kebutuhan':kebTxt(k),'Kendala':k.kendala||'','Status':k.status,'Prospek baru':k.baru?'Ya':'Tidak','Follow up terakhir':k.lastFu||''}))),
  xlSH('Riwayat Follow Up',K.flatMap(k=>(k.fuLog||[]).map(x=>({'Tanggal':x.tgl,'Jam':x.jam||'','Kantor':k.kantor,'Sales':xlNm(k.sid),'Hasil follow up':x.cat,'Oleh':x.oleh||''})))),
  xlSH('Prospek',xlDesc(PR,'tgl').map(p=>({'Tanggal':p.tgl,'Nama':p.nama,'Kontak':p.kontak||'','Sumber':p.sumber||'','Sales':xlNm(p.sid),'Catatan':p.cat||''})))]}
function xlPnw(){const P=xlDesc(PNS(),'tgl');
 return [xlSH('Penawaran',P.map(p=>({'No. Penawaran':p.no,'Tanggal':p.tgl,'Perusahaan':p.kantor,'Alamat':p.alamat||'','Kontak':p.hp||'','Sales':xlNm(p.sid),'Subtotal (Rp)':p.sub,'Diskon (Rp)':p.dsk,'Ongkos kirim (Rp)':p.ongkir||0,'Jasa pasang (Rp)':p.pasang||0,'PPN (Rp)':p.ppnVal||0,'Total (Rp)':p.total,'Berlaku sampai':p.berlaku,'Status':p.appr,'Disetujui oleh':p.apprOleh||'','Alasan tolak':p.alasanTolak||'','Tanggal kirim':p.kirim||''}))),
  xlSH('Item Penawaran',P.flatMap(p=>(p.lines||[]).map(x=>({'No. Penawaran':p.no,'Uraian':x.desc,'Qty':x.qty,'Harga (Rp)':x.harga,'Jumlah (Rp)':x.qty*x.harga}))))]}

/* ---------- Peta menu -> lembar data ---------- */
const XL_TAB={dash:()=>xlOrders().concat(xlCust()),job:xlOrders,kas:xlInv,inv:xlInv,keu:xlKeu,jur:xlKeu,ana:xlAna,wa:xlWa,apr:xlApr,abs:xlAbs,
 kin:()=>SES.role==='sales'?xlKinS():xlKinT().concat(xlKinS()),ber:xlKinS,stk:xlStk,sup:xlSup,srt:xlSrt,sewa:xlSewa,dbk:xlKunj,kjn:xlKunj,kjg:xlKunj,lap:xlKunj,pnw:xlPnw};
const xlSheets=tab=>(XL_TAB[tab]||(()=>[]))();
function xlAll(){const seen={},out=[];allowedTabs().forEach(t=>xlSheets(t[0]).forEach(s=>{if(!seen[s.name]){seen[s.name]=1;out.push(s)}}));return out}

/* ---------- Penulis file ---------- */
const xlName=s=>String(s).replace(/[\\\/?*\[\]:&<>"']/g,'').slice(0,31)||'Data';
function xlLoad(){return new Promise((ok,no)=>{if(window.XLSX)return ok(window.XLSX);
 const s=document.createElement('script'),t=setTimeout(()=>no(new Error('timeout')),12000);
 s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
 s.onload=()=>{clearTimeout(t);window.XLSX?ok(window.XLSX):no(new Error('x'))};s.onerror=()=>{clearTimeout(t);no(new Error('x'))};document.head.appendChild(s)})}
function xlBook(X,sheets){const wb=X.utils.book_new();
 sheets.forEach(s=>{const rows=s.rows.length?s.rows:[{Info:'Belum ada data'}],ks=Object.keys(rows[0]),ws=X.utils.json_to_sheet(rows,{header:ks});
  ws['!cols']=ks.map(k=>({wch:Math.min(48,Math.max(String(k).length,...rows.slice(0,300).map(r=>String(r[k]==null?'':r[k]).length))+2)}));
  X.utils.book_append_sheet(wb,ws,xlName(s.name))});return wb}
/* cadangan bila library Excel gagal dimuat (offline): XML Spreadsheet, tetap bisa dibuka di Excel */
function xlXml(sheets){const e=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'),
 c=v=>typeof v==='number'&&isFinite(v)?'<Cell><Data ss:Type="Number">'+v+'</Data></Cell>':'<Cell><Data ss:Type="String">'+e(v==null?'':v)+'</Data></Cell>';
 return '<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">'+
  sheets.map(s=>{const rows=s.rows.length?s.rows:[{Info:'Belum ada data'}],ks=Object.keys(rows[0]);
   return '<Worksheet ss:Name="'+e(xlName(s.name))+'"><Table><Row>'+ks.map(k=>c(String(k))).join('')+'</Row>'+rows.map(r=>'<Row>'+ks.map(k=>c(r[k])).join('')+'</Row>').join('')+'</Table></Worksheet>'}).join('')+'</Workbook>'}
async function xlExport(sheets,base){
 if(!sheets.length){toast('Tidak ada data untuk diekspor di menu ini');return}
 toast('Menyiapkan file Excel...');
 try{const X=await xlLoad();await saveFile(base+'.xlsx',X.write(xlBook(X,sheets),{bookType:'xlsx',type:'array'}))}
 catch(err){await saveFile(base+'.xml',xlXml(sheets));toast('Library Excel tidak termuat (offline?). File disimpan sebagai XML Spreadsheet, buka dengan Excel.')}}
A.expXls=()=>xlExport(xlSheets(S.tab),'punggawa47-'+S.tab+'-'+TODAY);
A.expAll=()=>xlExport(xlAll(),'punggawa47-semua-data-'+TODAY);

/* ---------- Pasang tombol setelah setiap render ---------- */
function xlInject(){if(!SES||!S)return;
 const h=$('#view .head');
 if(h&&XL_TAB[S.tab]&&!h.querySelector('[data-act="expXls"]')){
  let r=h.querySelector(':scope > .row');
  if(!r){r=document.createElement('div');r.className='row';[...h.children].slice(1).forEach(c=>r.appendChild(c));h.appendChild(r)}
  r.insertAdjacentHTML('afterbegin','<button type="button" class="btn" data-act="expXls" title="Unduh seluruh data menu ini ke Excel">Export Excel</button>')}
 const sf=$('#sidefoot');
 if(sf&&!sf.querySelector('[data-act="expAll"]'))sf.insertAdjacentHTML('beforeend','<button type="button" class="btn sm" data-act="expAll">Export semua data (Excel)</button>')}
{const _r=render;render=function(){const x=_r.apply(this,arguments);try{xlInject()}catch(e){}return x}}
if(S&&SES)render();

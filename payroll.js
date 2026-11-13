/* =====================================================================
   MENU PAYROLL (dipasang paling akhir, setelah semua script lain)
   - Gaji pokok per karyawan (kolom baru di data karyawan)
   - Gaji per hari = gaji pokok / jumlah hari kerja bulan itu
   - Gaji per jam = gaji per hari / 10 jam (dipakai untuk lembur, diambil dari absen lembur)
   - Potongan tidak masuk = jumlah hari tidak masuk x gaji per hari
   - Item potongan / tambahan bebas (kasbon, BPJS, dll)
   - Alur PER ORANG: Admin buat -> ajukan (per karyawan / semua) -> Direktur setujui per karyawan (lihat absensi & kinerja)
     -> Admin bayar per karyawan -> jurnal pengeluaran per karyawan + slip gaji otomatis muncul di menu Payroll karyawan
   ===================================================================== */
(function(){
const MAKER=['admin','adminjual','adminops'];
const mk=()=>!!SES&&MAKER.includes(SES.role);
const cfg=()=>Object.assign({izin:1,sakit:1,mult:1,jam:10},S.set.payCfg||{});
const PST={Draft:'Dicetak',Menunggu:'Menunggu',Disetujui:'Aman',Ditolak:'Batal',Dibayar:'Lunas'};
const pill=s=>`<span class="pill p-${PST[s]||'Belum'}">${s==='Menunggu'?'Menunggu ACC Direktur':s}</span>`;
const num=v=>Math.max(0,Number(v)||0);
const gj=e=>num(e&&e.gaji);
const empl=id=>S.emps.find(e=>e.id===id)||(S.empsOld||[]).find(e=>e.id===id)||null;
const meId=()=>{try{return absMe()}catch(e){return SES&&SES.empId}};
const fmtJ=x=>String(Math.round((x||0)*100)/100).replace('.',',');
const pMo=mo=>absBulanTxt(mo);
const cur=()=>(S.pay||[]).find(p=>p.id===U.payId);
const rst=r=>r.st||'Draft';
const rEd=r=>mk()&&(rst(r)==='Draft'||rst(r)==='Ditolak');
const cnt=(p,st)=>p.rows.filter(r=>rst(r)===st).length;
const waitAll=()=>(S.pay||[]).reduce((a,p)=>a+cnt(p,'Menunggu'),0);
const sumTxt=p=>{const c={};p.rows.forEach(r=>{c[rst(r)]=(c[rst(r)]||0)+1});const k=Object.keys(c);return k.length?k.map(x=>c[x]+' '+x).join(', '):'Kosong'};
const pStat=p=>{const k=[...new Set(p.rows.map(rst))];if(!k.length)return pill('Draft');if(k.length===1)return pill(k[0]);return '<small>'+sumTxt(p)+'</small>'};
const hkMo=mo=>{const [y,m]=mo.split('-').map(Number),dim=new Date(y,m,0).getDate();let n=0;for(let d=1;d<=dim;d++)if(isHK(mo+'-'+pad(d)))n++;return n};

ICON.payroll='<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9v.01M18 15v.01"/>';
EMO.payroll='💰';

/* ---------- Hitung dari absensi & lembur ---------- */
function absOf(eid,mo){
 const [y,m]=mo.split('-').map(Number),dim=new Date(y,m,0).getDate(),o={hk:0,h:0,tl:0,iz:0,sk:0,al:0,mn:0};
 for(let d=1;d<=dim;d++){const t=mo+'-'+pad(d);if(!isHK(t))continue;o.hk++;if(t>TODAY)continue;
  const a=(S.att[t]||{})[eid];
  if(!a){if(t<TODAY)o.al++;continue}
  if(a.s==='Hadir'){o.h++;if(isLate(a))o.tl++}else if(a.s==='Izin')o.iz++;else if(a.s==='Sakit')o.sk++;else if(a.s==='Menunggu')o.mn++;else o.al++}
 return o}
function lbrOfMo(eid,mo){const L=S.lbr||{};let ms=0,n=0;
 Object.keys(L).forEach(t=>{if(!t.startsWith(mo))return;const l=(L[t]||{})[eid];if(l&&l.in&&l.out){ms+=lbrMs(t,l);n++}});
 return{jam:Math.round(ms/36e5*100)/100,n}}
function calc(r){
 r.perHari=r.hk?Math.round(r.gp/r.hk):0;
 r.perJam=Math.round(r.perHari/(r.jh||10));
 r.potAbs=Math.round(r.tm*r.perHari);
 r.lembur=Math.round(r.lj*r.perJam*(r.mult==null?1:r.mult));
 r.tambah=sum(r.extra.filter(x=>x.jenis==='Tambahan'),x=>x.jml);
 r.pot=sum(r.extra.filter(x=>x.jenis!=='Tambahan'),x=>x.jml);
 r.total=r.gp-r.potAbs+r.lembur+r.tambah-r.pot;
 return r}
function build(e,mo,extra){
 const a=absOf(e.id,mo),l=lbrOfMo(e.id,mo),c=cfg();
 return calc({st:'Draft',eid:e.id,nama:e.nama,jab:e.jabatan||'',gp:gj(e),hk:a.hk,h:a.h,tl:a.tl,iz:a.iz,sk:a.sk,al:a.al,mn:a.mn,
  tm:a.al+(c.izin?a.iz:0)+(c.sakit?a.sk:0),lj:l.jam,ln:l.n,mult:c.mult,jh:c.jam,extra:extra||[]})}
const totals=p=>({gp:sum(p.rows,r=>r.gp),pa:sum(p.rows,r=>r.potAbs),lm:sum(p.rows,r=>r.lembur),tb:sum(p.rows,r=>r.tambah),pt:sum(p.rows,r=>r.pot),net:sum(p.rows,r=>r.total)});

/* ---------- Kartu gaji pokok (juga dipasang di Daftar Pegawai) ---------- */
function gajiCard(){
 const E=[...S.emps].sort((a,b)=>String(a.nama).localeCompare(String(b.nama))),can=mk()||isAp()||isSA(),mo=TODAY.slice(0,7),hk=hkMo(mo),c=cfg();
 return `<div class="card"><div class="row" style="justify-content:space-between"><h3>Gaji pokok karyawan</h3><span>Total <b class="num">${rp(sum(E,gj))}</b></span></div>
 <div class="tw"><table><thead><tr><th>Karyawan</th><th>Jabatan</th><th class="r">Gaji pokok / bulan</th><th class="r">Per hari*</th><th class="r">Per jam*</th><th></th></tr></thead><tbody>
 ${E.length?E.map(e=>{const g=gj(e),ph=hk?Math.round(g/hk):0;return `<tr><td><b>${esc(e.nama)}</b></td><td>${esc(e.jabatan||'')}</td><td class="r num">${g?rp(g):'<span class="pill p-Belum">Belum diisi</span>'}</td><td class="r num">${g?rp(ph):'-'}</td><td class="r num">${g?rp(Math.round(ph/c.jam)):'-'}</td><td class="r">${can?`<button class="btn sm" data-act="gjEd" data-id="${e.id}">${g?'Ubah':'Isi gaji'}</button>`:''}</td></tr>`}).join(''):'<tr><td colspan="6" class="empty">Belum ada karyawan.</td></tr>'}</tbody></table></div>
 <p style="color:var(--muted);margin:8px 0 0;font-size:12px">*Perkiraan untuk ${pMo(mo)}: gaji pokok dibagi ${hk} hari kerja, dan per jam = per hari dibagi ${c.jam} jam.</p></div>`}
A.gjEd=b=>{if(!(mk()||isAp()||isSA()))return;const e=S.emps.find(x=>x.id===b.dataset.id);if(!e)return;
 form('Gaji pokok: '+e.nama,[{k:'gaji',l:'Gaji pokok per bulan (Rp)',t:'number',min:0,def:gj(e),wide:1}],{gaji:gj(e)},v=>{e.gaji=num(v.gaji);save();render();toast('Gaji pokok '+e.nama+' disimpan')})};

/* Kolom gaji pokok di form data karyawan (Tambah & Ubah) */
function withGaji(fn,idOf){return function(b,ev,pre){
 const of=form,eid=idOf(b,pre);
 form=function(t,f,v,cb,ex){form=of;
  const f2=f.concat([{k:'gaji',l:'Gaji pokok per bulan (Rp)',t:'number',min:0,def:0,wide:1}]);
  return of(t,f2,v,function(o){if(eid){const e=S.emps.find(x=>x.id===eid);if(e)e.gaji=num(o.gaji)}cb(o)},ex)};
 try{return fn.apply(this,arguments)}finally{form=of}}}
{const _e=A.pegEd;if(_e)A.pegEd=withGaji(_e,(b,pre)=>pre?pre._id:(b&&b.dataset&&b.dataset.id));
 const _n=A.newEmp;if(_n)A.newEmp=withGaji(_n,()=>null)}
{const _pg=V.peg;if(_pg)V.peg=()=>{const h=_pg();return(isAp()||isSA())?h+gajiCard():h}}

/* ---------- Pengaturan perhitungan ---------- */
function cfgCard(){const c=cfg();
 return `<div class="card"><h3>Aturan perhitungan</h3><div class="fgrid">
 <label class="f">Izin dipotong gaji?<select data-chg="payCfg" data-k="izin"><option value="1"${c.izin?' selected':''}>Ya, dihitung tidak masuk</option><option value="0"${c.izin?'':' selected'}>Tidak dipotong</option></select></label>
 <label class="f">Sakit dipotong gaji?<select data-chg="payCfg" data-k="sakit"><option value="1"${c.sakit?' selected':''}>Ya, dihitung tidak masuk</option><option value="0"${c.sakit?'':' selected'}>Tidak dipotong</option></select></label>
 <label class="f">Jam kerja per hari (pembagi gaji per jam)<input type="number" min="1" step="any" value="${c.jam}" data-chg="payCfg" data-k="jam"></label>
 <label class="f">Pengali upah lembur<input type="number" min="0" step="0.25" value="${c.mult}" data-chg="payCfg" data-k="mult"></label></div>
 <p style="color:var(--muted);margin:10px 0 0;font-size:12px">Gaji per hari = gaji pokok ÷ jumlah hari kerja bulan itu (hari kerja = hari di bulan itu dikurangi 4 hari libur Minggu). Gaji per jam = gaji per hari ÷ ${c.jam}. Upah lembur = jam lembur (dari absen lembur masuk dan pulang) × gaji per jam × pengali. Alpa selalu dipotong. Perubahan hanya berlaku untuk payroll baru atau saat Hitung ulang.</p></div>`}
CH.payCfg=el=>{if(!mk())return;const k=el.dataset.k,c=Object.assign({},S.set.payCfg||{});
 if(k==='izin'||k==='sakit')c[k]=el.value==='1'?1:0;
 else if(k==='jam'){const v=Number(el.value);c.jam=v>=1?v:10}
 else{const v=Number(el.value);c.mult=v>=0?v:1}
 S.set.payCfg=c;save();render();toast('Aturan disimpan')};

/* ---------- Daftar payroll ---------- */
function listView(){
 const R=[...(S.pay||[])].sort((a,b)=>b.bln.localeCompare(a.bln)),P=paginate('pay',R,R.length),wait=waitAll();
 return `<div class="head"><div><h1>Payroll</h1><p>${isAp()?'Periksa gaji karyawan yang diajukan admin beserta absensi dan kinerja, lalu setujui per orang.':'Buat payroll bulanan dari absensi, lembur, dan potongan, lalu ajukan ke Direktur per karyawan.'}</p></div>${mk()?'<button class="btn pri" data-act="payNew">+ Payroll baru</button>':''}</div>
 ${isAp()&&wait?`<div class="info"><b>${wait} karyawan</b> menunggu persetujuan gaji Anda.</div>`:''}
 <div class="card"><h3>Daftar payroll</h3><div class="tw"><table><thead><tr><th>Bulan</th><th>No.</th><th class="r">Karyawan</th><th class="r">Total gaji bersih</th><th>Status</th><th></th></tr></thead><tbody>
 ${R.length?P.items.map(p=>`<tr><td><b>${pMo(p.bln)}</b></td><td class="num"><small>${esc(p.no)}</small></td><td class="r num">${p.rows.length}</td><td class="r num">${rp(totals(p).net)}</td><td>${pStat(p)}</td><td class="r"><button class="btn sm pri" data-act="payOpen" data-id="${p.id}">Buka</button></td></tr>`).join(''):'<tr><td colspan="6" class="empty">Belum ada payroll.'+(mk()?' Tekan + Payroll baru.':'')+'</td></tr>'}</tbody></table></div>${P.html}</div>
 ${mk()?cfgCard():''}${(mk()||isAp()||isSA())?gajiCard():''}`}
A.payOpen=b=>{U.payId=b.dataset.id;render();window.scrollTo(0,0)};
A.payBack=()=>{U.payId='';render();window.scrollTo(0,0)};
A.payNew=()=>{if(!mk())return;
 form('Payroll baru',[{k:'bln',l:'Bulan gaji',t:'month',req:1,def:TODAY.slice(0,7),wide:1}],null,v=>{
  const mo=v.bln;if(!mo)return;
  const ex=(S.pay||[]).find(p=>p.bln===mo);
  if(ex){U.payId=ex.id;render();toast('Payroll '+pMo(mo)+' sudah ada, dibuka');return}
  if(!S.emps.length){toast('Belum ada karyawan');return}
  const p={id:uid('py'),no:'PAY-'+mo.replace('-',''),bln:mo,dibuat:TODAY,oleh:SES.nama,rows:S.emps.map(e=>build(e,mo))};
  S.pay=S.pay||[];S.pay.unshift(p);U.payId=p.id;save();render();window.scrollTo(0,0);toast('Payroll '+pMo(mo)+' dibuat. Periksa tiap karyawan lalu ajukan per orang.')},
 `<div class="info">Semua karyawan dimuat otomatis beserta gaji pokok, hari tidak masuk, dan jam lembur dari absensi bulan itu. Bulan yang masih berjalan hanya menghitung sampai hari ini, jadi sebaiknya payroll dibuat setelah bulan berakhir.</div>`)};

/* ---------- Detail payroll ---------- */
function kinTxt(r,mo){const e=empl(r.eid);if(!e)return '-';
 if(e.jabatan==='Sales'){const kj=(S.kjg||[]).filter(k=>k.sid===e.id&&k.tgl.startsWith(mo)).length,pn=(S.pnw||[]).filter(x=>x.sid===e.id&&x.kirim&&x.kirim.startsWith(mo)).length,jl=sum(salesJl(e.id,mo),x=>x.p.total);
  return `${kj} kunjungan · ${pn} penawaran terkirim · penjualan lunas ${rp(jl)}`}
 if(isTek(e)){const O=S.orders.filter(o=>o.teknisi===e.id&&o.status==='Selesai'&&o.tgl.startsWith(mo)),tg=+e.target||0;
  return `${O.length} order selesai${tg?' dari target '+tg+' ('+pct(O.length,tg)+'%)':''} · nilai jasa ${rp(sum(O,o=>o.nilai))}`}
 return '-'}
function detail(p){
 const T=totals(p),ed=mk(),ap=isAp(),rows=[...p.rows].sort((a,b)=>String(a.nama).localeCompare(String(b.nama))),c=cfg();
 const info=`Dibuat ${esc(p.oleh)} · ${fd(p.dibuat)} · Pengajuan, persetujuan, dan pembayaran dilakukan per karyawan.`,nD=p.rows.filter(rEd).length,nW=cnt(p,'Menunggu'),nA=cnt(p,'Disetujui');
 const btn=[];
 btn.push('<button class="btn" data-act="payBack">‹ Kembali</button>');
 if(ed){btn.push('<button class="btn" data-act="payAddEmp">+ Karyawan</button>');if(nD)btn.push('<button class="btn" data-act="payRecalc">Hitung ulang yang belum diajukan</button>');if(p.rows.every(rEd))btn.push('<button class="btn del" data-act="payDel">Hapus</button>');if(nD)btn.push('<button class="btn pri" data-act="paySubmit">Ajukan semua ('+nD+')</button>')}
 if(ap&&nW)btn.push('<button class="btn pri" data-act="payOk">Setujui semua ('+nW+')</button>');
 if(mk()&&nA)btn.push('<button class="btn pri" data-act="payPay">Bayar semua yang disetujui ('+nA+')</button>');
 btn.push('<button class="btn" data-act="payPrint">Cetak rekap</button><button class="btn" data-act="payXls">Unduh Excel</button>');
 const tile=(t,v,col,s)=>`<div class="tile"><small>${t}</small><b class="num" style="color:${col}">${v}</b><span>${s}</span></div>`;
 return `<div class="head"><div><h1>Payroll ${pMo(p.bln)}</h1><p><span class="num">${esc(p.no)}</span> · ${pStat(p)}</p></div><div class="row">${btn.join('')}</div></div>
 <div class="info">${info}</div>
 <div class="ind"><div class="tiles">${tile('GAJI POKOK',rp(T.gp),'var(--ink)',p.rows.length+' karyawan')}${tile('POTONGAN TIDAK MASUK','-'+rp(T.pa),'var(--bad)','')}${tile('UPAH LEMBUR','+'+rp(T.lm),'var(--good)','')}${tile('TAMBAHAN / POTONGAN LAIN','+'+rp(T.tb)+' / -'+rp(T.pt),'var(--ink)','')}${tile('TOTAL GAJI BERSIH',rp(T.net),'var(--brand)','yang dibayarkan')}</div></div>
 <div class="card"><h3>Rincian gaji karyawan</h3><div class="tw"><table><thead><tr><th>Karyawan</th><th class="r">Gaji pokok</th><th class="r">Hari kerja</th><th class="r">Tidak masuk</th><th class="r">Lembur</th><th class="r">Tambahan</th><th class="r">Potongan lain</th><th class="r">Gaji bersih</th><th>Status</th><th></th></tr></thead><tbody>
 ${rows.length?rows.map(r=>`<tr><td><b>${esc(r.nama)}</b><br><small style="color:var(--muted)">${esc(r.jab)}</small>${r.gp?'':'<br><span class="pill p-Belum">Gaji pokok belum diisi</span>'}</td><td class="r num">${rp(r.gp)}</td><td class="r num">${r.hk}<br><small>${rp(r.perHari)}/hari</small></td><td class="r num">${fmtJ(r.tm)} hari<br><small>-${rp(r.potAbs)}</small></td><td class="r num">${fmtJ(r.lj)} jam<br><small>+${rp(r.lembur)}</small></td><td class="r num">${r.tambah?'+'+rp(r.tambah):'-'}${r.extra.filter(x=>x.jenis==='Tambahan').map(x=>'<br><small>'+esc(x.n)+'</small>').join('')}</td><td class="r num">${r.pot?'-'+rp(r.pot):'-'}${r.extra.filter(x=>x.jenis!=='Tambahan').map(x=>'<br><small>'+esc(x.n)+' '+rp(x.jml)+'</small>').join('')}</td><td class="r num"><b>${rp(r.total)}</b></td><td>${pill(rst(r))}${rst(r)==='Ditolak'&&r.tolak?'<br><small>'+esc(r.tolak.oleh)+': '+esc(r.tolak.alasan)+'</small>':''}${r.acc?'<br><small>ACC '+esc(r.acc.oleh)+' '+fd(r.acc.tgl)+'</small>':''}${r.bayar?'<br><small>Dibayar '+fd(r.bayar.tgl)+'</small>':''}</td><td class="r" style="white-space:nowrap">${rEd(r)?`<button class="btn sm pri" data-act="payRow" data-id="${r.eid}">Ubah</button> <button class="btn sm pri" data-act="paySubmit" data-id="${r.eid}">Ajukan</button> <button class="btn sm del" data-act="payRowDel" data-id="${r.eid}" aria-label="Keluarkan dari payroll">×</button> `:''}${ap&&rst(r)==='Menunggu'?`<button class="btn sm pri" data-act="payOk" data-id="${r.eid}">Setujui</button> <button class="btn sm del" data-act="payNo" data-id="${r.eid}">Tolak</button> `:''}${mk()&&rst(r)==='Disetujui'?`<button class="btn sm pri" data-act="payPay" data-id="${r.eid}">Bayar</button> `:''}<button class="btn sm" data-act="paySlip" data-p="${p.id}" data-id="${r.eid}">Slip</button></td></tr>`).join(''):'<tr><td colspan="10" class="empty">Belum ada karyawan di payroll ini.</td></tr>'}</tbody>
 <tfoot><tr><td><b>Total</b></td><td class="r num"><b>${rp(T.gp)}</b></td><td></td><td class="r num"><b>-${rp(T.pa)}</b></td><td class="r num"><b>+${rp(T.lm)}</b></td><td class="r num"><b>+${rp(T.tb)}</b></td><td class="r num"><b>-${rp(T.pt)}</b></td><td class="r num"><b>${rp(T.net)}</b></td><td></td><td></td></tr></tfoot></table></div>
 <p style="color:var(--muted);margin:8px 0 0;font-size:12px">Gaji per hari = gaji pokok ÷ hari kerja bulan itu. Gaji per jam = gaji per hari ÷ ${c.jam}. Upah lembur diambil dari absen lembur masuk dan pulang.</p></div>
 <div class="card"><h3>Absensi &amp; kinerja ${pMo(p.bln)}</h3><div class="tw"><table><thead><tr><th>Karyawan</th><th class="r">Hadir</th><th class="r">Telat</th><th class="r">Izin</th><th class="r">Sakit</th><th class="r">Alpa</th><th class="r">Lembur</th><th>Kinerja</th><th>Status</th></tr></thead><tbody>
 ${rows.map(r=>`<tr><td><b>${esc(r.nama)}</b><br><small style="color:var(--muted)">${esc(r.jab)}</small></td><td class="r num">${r.h}/${r.hk}</td><td class="r num">${r.tl}</td><td class="r num">${r.iz}</td><td class="r num">${r.sk}</td><td class="r num"${r.al?' style="color:var(--bad)"':''}>${r.al}</td><td class="r num">${fmtJ(r.lj)} jam${r.ln?'<br><small>'+r.ln+'x</small>':''}</td><td><small>${kinTxt(r,p.bln)}</small></td><td>${pill(rst(r))}</td></tr>`).join('')||'<tr><td colspan="9" class="empty">Belum ada data.</td></tr>'}</tbody></table></div>
 <p style="color:var(--muted);margin:8px 0 0;font-size:12px">Absensi diambil dari data saat payroll dibuat atau dihitung ulang. Kinerja dihitung langsung dari data order dan penjualan bulan itu.</p></div>`}

/* ---------- Ubah gaji satu karyawan ---------- */
let MR=null,MP=null;
const itRow=x=>`<tr><td><input data-pi="n" list="pr_dl" value="${esc(x.n||'')}" placeholder="mis. Kasbon"></td><td style="width:120px"><select data-pi="j"><option${x.jenis==='Potongan'?' selected':''}>Potongan</option><option${x.jenis==='Tambahan'?' selected':''}>Tambahan</option></select></td><td style="width:140px"><input data-pi="v" type="number" min="0" value="${x.jml||''}"></td><td style="width:44px"><button type="button" class="btn sm del" data-act="payItDel" aria-label="Hapus item">×</button></td></tr>`;
function readM(){const g=id=>$('#'+id).value;
 const o=Object.assign({},MR,{gp:num(g('pr_gp')),hk:Math.max(1,num(g('pr_hk'))),tm:num(g('pr_tm')),lj:num(g('pr_lj')),mult:num(g('pr_mu'))});
 o.extra=$$('#pr_it tr').map(tr=>({n:$('[data-pi=n]',tr).value.trim(),jenis:$('[data-pi=j]',tr).value,jml:num($('[data-pi=v]',tr).value)})).filter(x=>x.jml>0).map(x=>({n:x.n||(x.jenis==='Tambahan'?'Tambahan lain':'Potongan lain'),jenis:x.jenis,jml:x.jml}));
 return calc(o)}
function prv(){const pv=$('#pr_pv');if(!pv||!MR)return;const r=readM();
 pv.innerHTML=`Gaji per hari <b class="num">${rp(r.perHari)}</b> · per jam <b class="num">${rp(r.perJam)}</b><br>Potongan tidak masuk <b class="num">-${rp(r.potAbs)}</b> · Upah lembur <b class="num">+${rp(r.lembur)}</b> · Tambahan <b class="num">+${rp(r.tambah)}</b> · Potongan lain <b class="num">-${rp(r.pot)}</b><br>Gaji bersih <b class="num" style="font-size:18px">${rp(r.total)}</b>`}
A.payRow=b=>{const p=cur();if(!p)return;const r=p.rows.find(x=>x.eid===b.dataset.id);if(!r||!rEd(r))return;MR=r;MP=p;
 modal(`<h2 style="font-size:20px">Ubah gaji: ${esc(r.nama)}</h2><div class="info" id="pr_pv"></div>
 <form id="mf" class="grid" style="gap:14px"><div class="fgrid">
 <label class="f">Gaji pokok (Rp)<input id="pr_gp" type="number" min="0" value="${r.gp}"></label>
 <label class="f">Jumlah hari kerja bulan ini<input id="pr_hk" type="number" min="1" value="${r.hk}"></label>
 <label class="f">Hari tidak masuk<input id="pr_tm" type="number" min="0" step="0.5" value="${r.tm}"></label>
 <label class="f">Jam lembur<input id="pr_lj" type="number" min="0" step="0.25" value="${r.lj}"></label>
 <label class="f">Pengali lembur<input id="pr_mu" type="number" min="0" step="0.25" value="${r.mult==null?1:r.mult}"></label></div>
 <div class="note" style="background:var(--surface2);color:var(--muted)">Dari absensi: hadir ${r.h}, telat ${r.tl}, izin ${r.iz}, sakit ${r.sk}, alpa ${r.al}${r.mn?', menunggu ACC '+r.mn:''} · lembur ${r.ln}x. Angka di atas boleh diubah manual.</div>
 <div><b>Potongan &amp; tambahan lain</b><div class="tw" style="margin-top:8px"><table style="min-width:0"><thead><tr><th>Nama item</th><th>Jenis</th><th>Jumlah (Rp)</th><th></th></tr></thead><tbody id="pr_it">${r.extra.map(itRow).join('')}</tbody></table></div>
 <div class="row" style="margin-top:8px"><button type="button" class="btn sm" data-act="payItAdd" data-j="Potongan">+ Potongan</button><button type="button" class="btn sm" data-act="payItAdd" data-j="Tambahan">+ Tambahan</button>${isTek(empl(r.eid)||{jabatan:r.jab})?'<button type="button" class="btn sm" data-act="payRw">+ Reward kinerja</button>':''}<button type="button" class="btn sm" data-act="payRst">Reset dari absensi</button></div>
 <datalist id="pr_dl"><option value="Potongan kasbon"><option value="BPJS"><option value="Denda keterlambatan"><option value="Cicilan pinjaman"><option value="Bonus"><option value="Uang makan"><option value="Tunjangan"><option value="Reward kinerja"></datalist></div>
 <div class="row" style="justify-content:flex-end"><button type="button" class="btn" data-act="close">Batal</button><button class="btn pri" type="submit">Simpan</button></div></form>`,sh=>{
  sh.style.width='min(720px,100%)';prv();sh.addEventListener('input',prv);
  $('#mf',sh).addEventListener('submit',e=>{e.preventDefault();const n=readM(),i=MP.rows.findIndex(x=>x.eid===MR.eid);if(i<0)return;MP.rows[i]=n;save();closeModal();render();toast('Gaji '+n.nama+' disimpan')})})};
A.payItAdd=b=>{const t=$('#pr_it');if(t){t.insertAdjacentHTML('beforeend',itRow({jenis:b.dataset.j}));prv()}};
A.payItDel=b=>{b.closest('tr').remove();prv()};
A.payRw=()=>{if(!MR||!MP)return;const v=rwOf(jasaOf(MR.eid,MP.bln));if(!v){toast('Belum memenuhi standar reward di bulan ini');return}
 $('#pr_it').insertAdjacentHTML('beforeend',itRow({n:'Reward kinerja '+pMo(MP.bln),jenis:'Tambahan',jml:v}));prv();toast('Reward kinerja ditambahkan')};
A.payRst=()=>{if(!MR||!MP)return;const e=empl(MR.eid)||{id:MR.eid,nama:MR.nama,jabatan:MR.jab,gaji:MR.gp},n=build(e,MP.bln);
 $('#pr_hk').value=n.hk;$('#pr_tm').value=n.tm;$('#pr_lj').value=n.lj;$('#pr_mu').value=n.mult;if(!num($('#pr_gp').value))$('#pr_gp').value=n.gp;prv();toast('Dihitung ulang dari absensi')};
A.payRowDel=b=>{const p=cur();if(!p)return;const r=p.rows.find(x=>x.eid===b.dataset.id);if(!r||!rEd(r))return;
 if(!confirm('Keluarkan '+r.nama+' dari payroll '+pMo(p.bln)+'?'))return;p.rows=p.rows.filter(x=>x!==r);save();render()};
A.payAddEmp=()=>{const p=cur();if(!p||!mk())return;const L=S.emps.filter(e=>!p.rows.some(r=>r.eid===e.id));
 if(!L.length){toast('Semua karyawan sudah ada di payroll ini');return}
 form('Tambah karyawan ke payroll',[{k:'e',l:'Karyawan',t:'select',o:L.map(e=>[e.id,e.nama+' · '+e.jabatan]),wide:1}],null,v=>{const e=S.emps.find(x=>x.id===v.e);if(!e)return;p.rows.push(build(e,p.bln));save();render()})};
A.payRecalc=()=>{const p=cur();if(!p||!mk())return;
 if(!confirm('Hitung ulang karyawan yang belum diajukan dari data absensi, lembur, dan gaji pokok terbaru? Isian manual hari tidak masuk dan jam lembur akan diganti. Item potongan/tambahan tetap.'))return;
 p.rows=p.rows.map(r=>rEd(r)?Object.assign(build(empl(r.eid)||{id:r.eid,nama:r.nama,jabatan:r.jab,gaji:r.gp},p.bln,r.extra),{st:r.st,tolak:r.tolak}):r);save();render();toast('Payroll dihitung ulang')};
A.payDel=()=>{const p=cur();if(!p||!mk()||!p.rows.every(rEd))return;
 askReason('Hapus payroll '+pMo(p.bln),'Payroll yang belum disetujui dihapus beserta semua isiannya.',al=>{S.pay=S.pay.filter(x=>x!==p);U.payId='';logAksi('Hapus payroll',p.no,al);save();render();toast('Payroll dihapus')})};

/* ---------- Alur persetujuan & pembayaran (PER KARYAWAN) ---------- */
const pick=(p,b,fn)=>{const id=b&&b.dataset&&b.dataset.id;return p.rows.filter(r=>fn(r)&&(!id||r.eid===id))};
const nmList=L=>L.length===1?L[0].nama:L.length+' karyawan';
A.paySubmit=b=>{const p=cur();if(!p||!mk())return;
 const L=pick(p,b,rEd);if(!L.length){toast('Tidak ada karyawan yang bisa diajukan');return}
 const z=L.filter(r=>!r.gp).length;
 if(z&&!confirm(z+' karyawan gaji pokoknya masih Rp 0. Tetap ajukan?'))return;
 L.forEach(r=>{r.st='Menunggu';r.tglAju=TODAY;r.ajuOleh=SES.nama;r.tolak=null});
 notify(['direktur'],'Gaji menunggu persetujuan','Payroll '+pMo(p.bln)+' · '+nmList(L)+' · total '+rp(sum(L,r=>r.total))+' · diajukan '+SES.nama,{tipe:'wait',tab:'payroll'});
 save();render();toast('Diajukan ke Direktur: '+nmList(L))};
A.payOk=b=>{const p=cur();if(!isAp()||!p)return;
 const L=pick(p,b,r=>rst(r)==='Menunggu');if(!L.length)return;
 L.forEach(r=>{r.st='Disetujui';r.acc={oleh:SES.nama,tgl:TODAY}});
 notify(['adminjual','adminops'],'Gaji disetujui','Gaji '+pMo(p.bln)+' untuk '+nmList(L)+' disetujui '+SES.nama+'. Silakan bayar lalu tandai sudah dibayar.',{tipe:'ok',tab:'payroll'});
 save();render();toast('Disetujui: '+nmList(L))};
A.payNo=b=>{const p=cur();if(!isAp()||!p)return;
 const L=pick(p,b,r=>rst(r)==='Menunggu');if(!L.length||!b.dataset.id)return;const r=L[0];
 askReason('Tolak gaji '+r.nama+' · '+pMo(p.bln),'Alasan akan dilihat admin yang membuat payroll.',al=>{r.st='Ditolak';r.tolak={oleh:SES.nama,alasan:al,tgl:TODAY};logAksi('Tolak payroll',p.no+' '+r.nama,al);
  notify(['adminjual','adminops'],'Gaji ditolak','Gaji '+pMo(p.bln)+' untuk '+r.nama+' ditolak. Alasan: '+al,{tipe:'no',tab:'payroll'});save();render();toast('Gaji '+r.nama+' ditolak')})};
A.payPay=b=>{const p=cur();if(!mk()||!p)return;const L=pick(p,b,r=>rst(r)==='Disetujui');if(!L.length)return;
 const B=S.set.banks||[],tot=sum(L,r=>r.total);
 form('Bayar gaji '+pMo(p.bln)+' · '+nmList(L),[{k:'tgl',l:'Tanggal bayar',t:'date',req:1,def:TODAY},{k:'akun',l:'Dibayar dari',t:'select',o:[['Kas','Kas Kecil'],['Bank','Bank']],def:'Bank'},{k:'bankId',l:'Rekening bank',t:'select',o:B.length?B.map(x=>[x.id,bankLbl(x)]):[['','Belum ada rekening bank']],def:B.length?B[0].id:''}],null,v=>{
  if(v.akun==='Bank'&&!v.bankId){toast('Belum ada rekening bank. Tambahkan dulu di menu Keuangan.');return}
  L.forEach(r=>{
   r.st='Dibayar';r.bayar={tgl:v.tgl,akun:v.akun,bankId:v.akun==='Bank'?v.bankId:'',oleh:SES.nama};
   const ref=p.no+':'+r.eid;
   if(r.total>0&&!S.tx.some(t=>t.ref===ref))S.tx.push({id:uid('t'),tgl:v.tgl,jenis:'Pengeluaran',kat:'Gaji karyawan',ket:'Gaji '+r.nama+' '+pMo(p.bln),akun:v.akun,bankId:r.bayar.bankId,bankNm:v.akun==='Bank'?bankNmById(v.bankId):'',jml:r.total,ref});
   const e=empl(r.eid),rl=e?empRole(e):'';if(rl&&rl!=='direktur')notify([rl],'Slip gaji tersedia','Slip gaji '+pMo(p.bln)+' sudah bisa dilihat di menu Payroll.',{emp:r.eid,tipe:'ok',tab:'payroll'})});
  save();render();toast('Gaji dibayar dan dijurnal per karyawan. Slip otomatis masuk ke menu Payroll mereka.',4000)},
 `<div class="info">${L.length===1?'<b>'+esc(L[0].nama)+'</b> · ':''}Total <b>${rp(tot)}</b> untuk ${L.length} karyawan. Setelah dibayar, tiap karyawan tercatat sebagai satu pengeluaran Gaji karyawan di Keuangan dan slip gajinya otomatis tampil di menu Payroll mereka.</div>`);
 {const ak=$('#f_akun'),bl=$('#f_bankId').closest('label'),sy=()=>{bl.style.display=ak.value==='Bank'?'':'none'};ak.addEventListener('change',sy);sy()}};

/* ---------- Slip gaji ---------- */
function slipHTML(p,r){
 const paid=rst(r)==='Dibayar',row=(a,b,st)=>`<tr><td${st?` style="${st}"`:''}>${a}</td><td class="r num"${st?` style="${st}"`:''}>${b}</td></tr>`,
  tb=r.extra.filter(x=>x.jenis==='Tambahan'),pt=r.extra.filter(x=>x.jenis!=='Tambahan');
 return `<div class="inv">${kopHTML()}<div class="row" style="justify-content:space-between;align-items:flex-start"><div><b style="font-size:18px;letter-spacing:.08em">SLIP GAJI</b><div>Periode ${pMo(p.bln)}</div></div><div style="text-align:right"><div class="num">${esc(p.no)}</div>${paid?'Dibayar '+fd(r.bayar.tgl):'<b>PRATINJAU · belum dibayar</b>'}</div></div>
 <hr style="border:0;border-top:1px solid #d7e1e4;margin:14px 0"><div style="margin-bottom:12px"><small style="color:#4b6068">Nama</small> <b>${esc(r.nama)}</b> &nbsp;·&nbsp; <small style="color:#4b6068">Jabatan</small> ${esc(r.jab||'-')}</div>
 <table><thead><tr><th>Keterangan</th><th class="r">Jumlah</th></tr></thead><tbody>
 ${row('<b>Pendapatan</b>','','background:#f3f6f8')}
 ${row('Gaji pokok',rp(r.gp))}
 ${r.lembur?row('Upah lembur ('+fmtJ(r.lj)+' jam × '+rp(r.perJam)+(r.mult!==1?' × '+r.mult:'')+')',rp(r.lembur)):''}
 ${tb.map(x=>row(esc(x.n),rp(x.jml))).join('')}
 ${row('<b>Potongan</b>','','background:#f3f6f8')}
 ${r.potAbs?row('Tidak masuk ('+fmtJ(r.tm)+' hari × '+rp(r.perHari)+')','-'+rp(r.potAbs)):row('Tidak masuk','-')}
 ${pt.map(x=>row(esc(x.n),'-'+rp(x.jml))).join('')}
 ${row('<b>Gaji bersih diterima</b>','<b>'+rp(r.total)+'</b>','font-size:18px')}</tbody></table>
 <p style="margin:12px 0 0;font-size:12px;color:#4b6068">Gaji per hari = gaji pokok ${rp(r.gp)} ÷ ${r.hk} hari kerja = ${rp(r.perHari)}. Gaji per jam = per hari ÷ ${r.jh||10} = ${rp(r.perJam)}.<br>Kehadiran: hadir ${r.h} dari ${r.hk} hari kerja, telat ${r.tl}, izin ${r.iz}, sakit ${r.sk}, alpa ${r.al}. Lembur ${fmtJ(r.lj)} jam.</p></div>`}
A.paySlip=b=>{const p=(S.pay||[]).find(x=>x.id===b.dataset.p),r=p&&p.rows.find(x=>x.eid===b.dataset.id);if(!r)return;
 modal(slipHTML(p,r)+`<div class="row" style="justify-content:flex-end"><button class="btn pri" data-act="paySlipPrint" data-p="${p.id}" data-id="${r.eid}">Cetak</button><button class="btn" data-act="close">Tutup</button></div>`)};
A.paySlipPrint=b=>{const p=(S.pay||[]).find(x=>x.id===b.dataset.p),r=p&&p.rows.find(x=>x.eid===b.dataset.id);if(!r)return;directPrint('Slip Gaji '+r.nama+' '+p.bln,slipHTML(p,r))};
function slipView(){
 const me=meId();
 if(!me||!S.emps.some(e=>e.id===me))return `<div class="head"><div><h1>Slip Gaji</h1></div></div><div class="card"><p class="empty">Akun Anda belum tersambung ke data karyawan, jadi slip gaji belum bisa ditampilkan. Hubungi admin.</p></div>`;
 const R=(S.pay||[]).filter(p=>p.rows.some(r=>r.eid===me&&rst(r)==='Dibayar')).sort((a,b)=>b.bln.localeCompare(a.bln)),sel=R.find(p=>p.id===U.slipId)||R[0],r=sel&&sel.rows.find(x=>x.eid===me&&rst(x)==='Dibayar');
 return `<div class="head"><div><h1>Slip Gaji</h1><p>Slip gaji muncul otomatis setelah gaji dibayar.</p></div></div>
 ${R.length?`<div class="tabs">${R.slice(0,12).map(p=>`<button class="chip" aria-pressed="${p===sel}" data-act="slipPick" data-id="${p.id}">${BLN[+p.bln.slice(5)-1]} ${p.bln.slice(0,4)}</button>`).join('')}</div>
 <div class="grid g4"><div class="card kpi"><small>Gaji bersih ${BLN[+sel.bln.slice(5)-1]}</small><span class="v">${rp(r.total)}</span><span class="s">dibayar ${fd(r.bayar.tgl)}</span></div><div class="card kpi"><small>Upah lembur</small><span class="v">${rp(r.lembur)}</span><span class="s">${fmtJ(r.lj)} jam</span></div><div class="card kpi"><small>Total potongan</small><span class="v">${rp(r.potAbs+r.pot)}</span><span class="s">tidak masuk dan potongan lain</span></div></div>
 <div class="card"><div class="row" style="justify-content:flex-end;margin-bottom:12px"><button class="btn pri" data-act="paySlipPrint" data-p="${sel.id}" data-id="${me}">Cetak slip</button></div><div style="overflow-x:auto">${slipHTML(sel,r)}</div></div>`
 :'<div class="card"><p class="empty">Belum ada slip gaji. Slip akan muncul di sini setelah gaji bulan berjalan dibayar.</p></div>'}`}
A.slipPick=b=>{U.slipId=b.dataset.id;render()};

/* ---------- Cetak rekap & Excel ---------- */
A.payPrint=()=>{const p=cur();if(!p)return;const T=totals(p),rows=[...p.rows].sort((a,b)=>String(a.nama).localeCompare(String(b.nama)));
 directPrint('Payroll '+p.bln,`<div class="inv">${kopHTML()}<b style="font-size:18px;letter-spacing:.06em">REKAP PAYROLL</b><div>Periode ${pMo(p.bln)} · ${esc(p.no)} · ${esc(sumTxt(p))}</div>
 <table style="margin-top:12px"><thead><tr><th>No</th><th>Nama</th><th class="r">Gaji pokok</th><th class="r">Pot. tidak masuk</th><th class="r">Lembur</th><th class="r">Tambahan</th><th class="r">Pot. lain</th><th class="r">Gaji bersih</th></tr></thead><tbody>
 ${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.nama)}</td><td class="r num">${rp(r.gp)}</td><td class="r num">${rp(r.potAbs)}</td><td class="r num">${rp(r.lembur)}</td><td class="r num">${rp(r.tambah)}</td><td class="r num">${rp(r.pot)}</td><td class="r num"><b>${rp(r.total)}</b></td></tr>`).join('')}
 <tr><td colspan="2"><b>Total</b></td><td class="r num"><b>${rp(T.gp)}</b></td><td class="r num"><b>${rp(T.pa)}</b></td><td class="r num"><b>${rp(T.lm)}</b></td><td class="r num"><b>${rp(T.tb)}</b></td><td class="r num"><b>${rp(T.pt)}</b></td><td class="r num"><b>${rp(T.net)}</b></td></tr></tbody></table>
 </div>`)};
A.payXls=()=>{const p=cur();if(!p)return;const hd=a=>a.map(x=>[x,1]),rows=[...p.rows].sort((a,b)=>String(a.nama).localeCompare(String(b.nama))),T=totals(p),it=[];
 rows.forEach(r=>r.extra.forEach(x=>it.push([[r.nama,2],[x.jenis,2],[x.n,2],[x.jml,2]])));
 try{saveFile('Payroll-'+p.bln+'.xlsx',xlsxBuild([
  {name:'Payroll',widths:[5,26,16,14,10,12,14,11,14,14,14,16],freeze:4,rows:[[['PAYROLL '+pMo(p.bln).toUpperCase(),3]],[['Status: '+sumTxt(p)+' · '+p.no]],[],
   hd(['No','Nama','Jabatan','Gaji pokok','Hari kerja','Tidak masuk (hari)','Pot. tidak masuk','Lembur (jam)','Upah lembur','Tambahan','Potongan lain','Gaji bersih']),
   ...rows.map((r,i)=>[[i+1,2],[r.nama,2],[r.jab,2],[r.gp,2],[r.hk,2],[r.tm,2],[r.potAbs,2],[r.lj,2],[r.lembur,2],[r.tambah,2],[r.pot,2],[r.total,2]]),
   [['',2],['TOTAL',4],['',2],[T.gp,4],['',2],['',2],[T.pa,4],['',2],[T.lm,4],[T.tb,4],[T.pt,4],[T.net,4]]]},
  {name:'Item Potongan & Tambahan',widths:[26,12,30,14],freeze:1,rows:[hd(['Nama','Jenis','Item','Jumlah']),...it]}]))}catch(e){console.error(e);toast('Gagal membuat file Excel')}};

/* ---------- Tampilan menu ---------- */
function mgmt(){const p=U.payId&&cur();return p?detail(p):listView()}
V.payroll=()=>{
 if(!SES)return '';
 if(isAp()||SES.role==='admin')return mgmt();
 if(SES.role==='adminjual'||SES.role==='adminops'){U.paysub=U.paysub||'kel';
  return subBar('paysub',[['kel','Kelola Payroll'],['slip','Slip Gaji Saya']])+(U.paysub==='slip'?slipView():mgmt())}
 return slipView()};
V.payrollT=()=>slipView();

/* ---------- Pasang ke menu & data ---------- */
{const _at=allowedTabs;allowedTabs=function(){const t=_at(),r=SES&&SES.role;if(!r||t.some(x=>x[0]==='payroll'))return t;
 if(r==='direktur'||r==='admin'||r==='adminjual'||r==='adminops'){
  const n=r==='direktur'?waitAll():0,i=t.findIndex(x=>x[0]==='abs');
  t.splice(i<0?t.length:i+1,0,['payroll','Payroll'+(n?' ('+n+')':'')])}
 else t.push(['payroll','Slip Gaji']);
 return t}}
{const _m=mig;mig=function(){_m();S.pay=S.pay||[];S.pay.forEach(p=>{(p.rows||[]).forEach(r=>{if(!r.st){r.st=p.st||'Draft';if(p.acc)r.acc=p.acc;if(p.bayar)r.bayar=p.bayar;if(p.tolak)r.tolak=p.tolak}})})}}
})();

/* =====================================================================
   daftar.js — Pendaftaran akun dari halaman login, menunggu persetujuan Direktur.
   - Pendaftar memilih peran sendiri lewat dropdown (Admin Penjualan, Admin Operasional,
     Sales, Teknisi). Peran Direktur dan Admin Super sengaja tidak ditawarkan.
   - Pendaftaran masuk ke kartu "Pendaftaran akun" di menu Persetujuan (hanya Direktur).
   - Setelah disetujui, akun bisa login dengan username + kata sandi pilihan sendiri.
   Dimuat setelah script utama.
   ===================================================================== */
"use strict";
const REG_ROLES=[['adminjual','Admin Penjualan'],['adminops','Admin Operasional'],['sales','Sales'],['teknisi','Teknisi']];
const REG_JAB={adminjual:'Admin',adminops:'Admin',sales:'Sales',teknisi:'Teknisi'};
const REG_RESV=['admin','direktur','adminjual','adminops','sales','teknisi'];
const regList=()=>S.reg=S.reg||[];
const userList=()=>S.users=S.users||[];
function regTaken(u,exceptId){return REG_RESV.includes(u)||userList().some(x=>x.user===u)||regList().some(x=>x.user===u&&x.id!==exceptId&&x.st!=='Ditolak')}

/* ---------- Halaman login: tautan daftar + form daftar ---------- */
{const _sl=showLogin;showLogin=function(){
 if(L.mode==='daftar'){_sl();regForm();return}
 _sl();const f=$('#lf');if(!f)return;
 if(L.info){f.querySelector('.lerr').insertAdjacentHTML('beforebegin','<div class="info" role="status">'+esc(L.info)+'</div>');L.info=''}
 f.insertAdjacentHTML('beforeend','<button type="button" class="btn sm" data-act="regOpen" style="align-self:center">Belum punya akun? Daftar di sini</button>')}}
function regForm(){const box=$('#login .lg-form');if(!box)return;const v=L.reg||{};
 box.innerHTML=`<form class="lg-box" id="rf"><h2 style="font-size:22px">Daftar akun baru</h2><div class="info">Pendaftaran akan diperiksa dan harus disetujui Direktur sebelum akun bisa dipakai masuk.</div>
 <label class="f">Nama lengkap<input id="rg_nama" required autocomplete="name" value="${esc(v.nama||'')}"></label>
 <label class="f">Peran<select id="rg_role" required><option value="">Pilih peran...</option>${REG_ROLES.map(r=>`<option value="${r[0]}"${v.role===r[0]?' selected':''}>${r[1]}</option>`).join('')}</select></label>
 <label class="f">No. WA (opsional)<input id="rg_hp" type="tel" autocomplete="tel" placeholder="62812..." value="${esc(v.hp||'')}"></label>
 <label class="f">Nama pengguna (huruf kecil, angka, titik, minus, 3-20 karakter)<input id="rg_user" required autocomplete="username" value="${esc(v.user||'')}"></label>
 <label class="f">Kata sandi (minimal 6 karakter)<input id="rg_pw" type="password" required autocomplete="new-password"></label>
 <label class="f">Ulangi kata sandi<input id="rg_pw2" type="password" required autocomplete="new-password"></label>
 <div class="lerr" role="alert">${esc(L.err)}</div>
 <button class="btn pri" type="submit" style="justify-content:center">Kirim pendaftaran</button>
 <button type="button" class="btn sm" data-act="regBack" style="align-self:center">Kembali ke halaman masuk</button></form>`;
 $('#rg_nama').focus()}
A.regOpen=()=>{L.mode='daftar';L.err='';showLogin()};
A.regBack=()=>{L.mode='';L.err='';L.reg=null;showLogin()};
document.addEventListener('submit',e=>{if(e.target.id!=='rf')return;e.preventDefault();
 const nama=$('#rg_nama').value.trim(),role=$('#rg_role').value,hp=$('#rg_hp').value.trim(),user=$('#rg_user').value.trim().toLowerCase(),pw=$('#rg_pw').value,pw2=$('#rg_pw2').value;
 L.reg={nama,role,hp,user};
 const bad=m=>{L.err=m;regForm()};
 if(nama.length<3)return bad('Isi nama lengkap.');
 if(!REG_ROLES.some(r=>r[0]===role))return bad('Pilih peran Anda.');
 if(!/^[a-z0-9._-]{3,20}$/.test(user))return bad('Nama pengguna 3-20 karakter: huruf kecil, angka, titik, minus.');
 if(regTaken(user))return bad('Nama pengguna sudah dipakai, pilih yang lain.');
 if(pw.length<6)return bad('Kata sandi minimal 6 karakter.');
 if(pw!==pw2)return bad('Ulangi kata sandi tidak sama.');
 regList().unshift({id:uid('g'),tgl:TODAY,jam:nowHM(),nama,role,hp,user,pw,st:'Menunggu'});
 notify(['direktur'],'Pendaftaran akun menunggu persetujuan',nama+' · '+ROLE_L[role]+' · username '+user,{tipe:'wait',tab:'apr'});
 save();L.mode='';L.err='';L.reg=null;L.info='Pendaftaran terkirim. Akun bisa dipakai setelah disetujui Direktur.';showLogin()});

/* ---------- Kartu persetujuan untuk Direktur ---------- */
function regCard(){if(!isAp())return '';
 const all=regList(),P=all.filter(r=>r.st==='Menunggu'),H=all.filter(r=>r.st!=='Menunggu'),G=paginate('regH',H,H.length);
 const row=(r,a)=>`<tr><td>${fds(r.tgl)}<br><small>${esc(r.jam||'')}</small></td><td><b>${esc(r.nama)}</b>${r.hp?'<br><small class="num">'+esc(r.hp)+'</small>':''}</td><td class="num">${esc(r.user)}</td><td>${esc(ROLE_L[r.role]||r.role)}</td><td class="r">${a?`<button class="btn sm pri" data-act="regOk" data-id="${r.id}">Setujui</button> <button class="btn sm del" data-act="regNo" data-id="${r.id}">Tolak</button>`:`<span class="pill p-${r.st==='Disetujui'?'Aman':'Batal'}">${r.st}</span><br><small>${esc(r.oleh2||'')}${r.alasanTolak?' · Alasan: '+esc(r.alasanTolak):''}</small>`}</td></tr>`;
 const T=(R,a,e)=>`<div class="tw"><table><thead><tr><th>Tanggal</th><th>Nama</th><th>Nama pengguna</th><th>Peran</th><th></th></tr></thead><tbody>${R.length?R.map(r=>row(r,a)).join(''):`<tr><td colspan="5" class="empty">${e}</td></tr>`}</tbody></table></div>`;
 return `<div class="card"><h3>Pendaftaran akun menunggu persetujuan (${P.length})</h3>${T(P,1,'Tidak ada pendaftaran yang menunggu.')}</div><div class="card"><h3>Riwayat pendaftaran akun</h3>${T(G.items,0,'Belum ada riwayat.')}${G.html}</div>`}
{const _a=V.apr;V.apr=()=>regCard()+_a()}
A.regOk=b=>{if(!isAp()){toast('Hanya Direktur yang dapat menyetujui');return}
 const r=regList().find(x=>x.id===b.dataset.id);if(!r||r.st!=='Menunggu')return;
 if(userList().some(x=>x.user===r.user)||REG_RESV.includes(r.user)){toast('Nama pengguna sudah dipakai akun lain');return}
 const E={id:uid('e'),nama:r.nama,jabatan:REG_JAB[r.role],target:r.role==='teknisi'?20:0,pw:r.pw,user:r.user,hp:r.hp||''};
 if(r.role==='teknisi')E.tingkat='T3';else if(r.role!=='sales')E.role=r.role;
 S.emps.push(E);userList().push({id:uid('u'),nama:r.nama,user:r.user,pw:r.pw,role:r.role,empId:E.id});
 r.st='Disetujui';r.oleh2=SES.nama;r.tglPutus=TODAY;save();render();
 toast('Akun '+r.user+' disetujui'+(r.role==='teknisi'?'. Tingkat teknisi diset T3, ubah di menu Absensi bila perlu.':''))};
A.regNo=b=>{if(!isAp())return;const r=regList().find(x=>x.id===b.dataset.id);if(!r||r.st!=='Menunggu')return;
 askReason('Tolak pendaftaran: '+r.nama,'Alasan penolakan wajib diisi dan tercatat di log.',al=>{r.st='Ditolak';r.alasanTolak=al;r.oleh2=SES.nama;r.tglPutus=TODAY;logAksi('Tolak pendaftaran akun',r.nama+' ('+r.user+')',al);save();render();toast('Pendaftaran ditolak')})};

if(S&&!SES)render();

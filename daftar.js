/* =====================================================================
   daftar.js (versi Supabase)
   - Login ditangani index.html lewat Supabase Auth (tidak ada lagi login lokal / sandi bawaan).
   - Pendaftar membuat akun lewat Supabase Auth, status 'pending' di tabel profiles.
   - Direktur menyetujui / menolak di menu Persetujuan (mengubah profiles.status).
   Dimuat setelah script utama.
   ===================================================================== */
"use strict";
const REG_ROLES=[['adminjual','Admin Penjualan'],['adminops','Admin Operasional'],['sales','Sales'],['teknisi','Teknisi']];
const REG_JAB={adminjual:'Admin',adminops:'Admin',sales:'Sales',teknisi:'Teknisi'};
const REG_RESV=['admin','direktur','adminjual','adminops','sales','teknisi'];

/* ---------- Halaman login: tautan daftar + form daftar ---------- */
{const _sl=showLogin;showLogin=function(){
 if(L.mode==='daftar'){_sl();regForm();return}
 _sl();const f=$('#lf');if(!f)return;
 const sg=f.querySelector('.seg');if(sg)sg.remove();
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
document.addEventListener('submit',async e=>{if(e.target.id!=='rf')return;e.preventDefault();
 const nama=$('#rg_nama').value.trim(),role=$('#rg_role').value,hp=$('#rg_hp').value.trim(),user=$('#rg_user').value.trim().toLowerCase(),pw=$('#rg_pw').value,pw2=$('#rg_pw2').value;
 L.reg={nama,role,hp,user};
 const bad=m=>{L.err=m;regForm()};
 if(nama.length<3)return bad('Isi nama lengkap.');
 if(!REG_ROLES.some(r=>r[0]===role))return bad('Pilih peran Anda.');
 if(!/^[a-z0-9._-]{3,20}$/.test(user))return bad('Nama pengguna 3-20 karakter: huruf kecil, angka, titik, minus.');
 if(REG_RESV.includes(user))return bad('Nama pengguna sudah dipakai, pilih yang lain.');
 if(pw.length<6)return bad('Kata sandi minimal 6 karakter.');
 if(pw!==pw2)return bad('Ulangi kata sandi tidak sama.');
 const btn=e.target.querySelector('button[type=submit]');if(btn){btn.disabled=true;btn.textContent='Mengirim...'}
 try{
  const {data,error}=await supabaseClient.auth.signUp({email:user+'@punggawa47.app',password:pw,options:{data:{nama,role,hp}}});
  if(error){console.error('DAFTAR GAGAL:',error);return bad(/already|registered/i.test(error.message)?'Nama pengguna sudah dipakai, pilih yang lain.':'Pendaftaran gagal: '+error.message)}
  if(data&&data.user&&Array.isArray(data.user.identities)&&data.user.identities.length===0)return bad('Nama pengguna sudah dipakai, pilih yang lain.');
  try{await supabaseClient.auth.signOut()}catch(_){}
  L.mode='';L.err='';L.reg=null;L.info='Pendaftaran terkirim. Akun bisa dipakai setelah disetujui Direktur.';showLogin();
 }catch(err){console.error(err);bad('Terjadi kesalahan jaringan.')}
});

/* ---------- Kartu persetujuan untuk Direktur (data dari tabel profiles) ---------- */
const REGP={items:[],t:0,loading:false};
async function regLoad(force){
 if(REGP.loading)return;if(!force&&Date.now()-REGP.t<15000)return;
 REGP.loading=true;
 try{
  const {data,error}=await supabaseClient.from('profiles').select('*').not('role','in','(admin,direktur)').order('created_at',{ascending:false});
  if(error)console.error('Gagal memuat pendaftaran:',error);else REGP.items=data||[];
 }catch(e){console.error(e)}
 REGP.t=Date.now();REGP.loading=false;
 if(S&&SES&&S.tab==='apr'&&$('#modal').hidden)render();
}
function regCard(){if(!isAp())return '';regLoad();
 const all=REGP.items,P=all.filter(r=>r.status==='pending'),H=all.filter(r=>r.status!=='pending'),G=paginate('regH',H,H.length);
 const row=(r,a)=>`<tr><td>${fds((r.created_at||'').slice(0,10))}</td><td><b>${esc(r.nama)}</b>${r.hp?'<br><small class="num">'+esc(r.hp)+'</small>':''}</td><td class="num">${esc(r.username||'')}</td><td>${esc(ROLE_L[r.role]||r.role)}</td><td class="r">${a?`<button class="btn sm pri" data-act="regOk" data-id="${r.id}">Setujui</button> <button class="btn sm del" data-act="regNo" data-id="${r.id}">Tolak</button>`:`<span class="pill p-${r.status==='active'?'Aman':'Batal'}">${r.status==='active'?'Disetujui':'Ditolak'}</span>${r.alasan?'<br><small>Alasan: '+esc(r.alasan)+'</small>':''}`}</td></tr>`;
 const T=(R,a,e)=>`<div class="tw"><table><thead><tr><th>Tanggal</th><th>Nama</th><th>Nama pengguna</th><th>Peran</th><th></th></tr></thead><tbody>${R.length?R.map(r=>row(r,a)).join(''):`<tr><td colspan="5" class="empty">${e}</td></tr>`}</tbody></table></div>`;
 return `<div class="card"><h3>Pendaftaran akun menunggu persetujuan (${P.length})</h3>${T(P,1,'Tidak ada pendaftaran yang menunggu.')}</div><div class="card"><h3>Riwayat akun</h3>${T(G.items,0,'Belum ada riwayat.')}${G.html}</div>`}
{const _a=V.apr;V.apr=()=>regCard()+_a()}
A.regOk=async b=>{if(!isAp()){toast('Hanya Direktur yang dapat menyetujui');return}
 const r=REGP.items.find(x=>x.id===b.dataset.id);if(!r||r.status!=='pending')return;
 const E={id:uid('e'),nama:r.nama,jabatan:REG_JAB[r.role]||'Teknisi',target:r.role==='teknisi'?20:0,user:r.username,hp:r.hp||''};
 if(r.role==='teknisi')E.tingkat='T3';else if(r.role!=='sales')E.role=r.role;
 const {error}=await supabaseClient.from('profiles').update({status:'active',emp_id:E.id}).eq('id',r.id);
 if(error){toast('Gagal menyetujui: '+error.message);return}
 S.emps.push(E);save();await regLoad(true);render();
 toast('Akun '+r.username+' disetujui'+(r.role==='teknisi'?'. Tingkat teknisi diset T3, ubah di menu Absensi bila perlu.':''))};
A.regNo=b=>{if(!isAp())return;const r=REGP.items.find(x=>x.id===b.dataset.id);if(!r||r.status!=='pending')return;
 askReason('Tolak pendaftaran: '+r.nama,'Alasan penolakan wajib diisi dan tercatat di log.',async al=>{
  const {error}=await supabaseClient.from('profiles').update({status:'inactive',alasan:al}).eq('id',r.id);
  if(error){toast('Gagal menolak: '+error.message);return}
  logAksi('Tolak pendaftaran akun',r.nama+' ('+r.username+')',al);save();await regLoad(true);render();toast('Pendaftaran ditolak')})};

if(S&&!SES)render();

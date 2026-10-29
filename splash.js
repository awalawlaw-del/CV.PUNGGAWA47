/* Layar pemuatan: disisipkan di awal <body>, hilang otomatis setelah halaman siap.
   Butuh logo.js (LOGO_URI) dimuat lebih dulu. */
(function(){
 document.body.insertAdjacentHTML('afterbegin','<div id="splash" role="status" aria-live="polite"><img alt="PUNGGAWA Air Conditioner"><div class="splbar"><i></i></div><small>MEMUAT\u2026</small></div>');
 const sp=document.getElementById('splash');sp.querySelector('img').src=LOGO_URI;
 let off=false;
 const done=()=>{if(off)return;off=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{sp.classList.add('out');setTimeout(()=>sp.remove(),700)}))};
 const go=()=>setTimeout(done,Math.max(0,900-Math.round(performance.now())));
 if(document.readyState==='complete')go();else addEventListener('load',go);
 setTimeout(done,4500);
})();

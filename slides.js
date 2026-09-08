(() => {
  'use strict';
  const slides = [...document.querySelectorAll('.slide')];
  const $ = s => document.querySelector(s);
  const viewport = $('#viewport'), deck = $('#deck'), select = $('#slide-select');
  const mobile = matchMedia('(max-width: 760px), (orientation: portrait)');
  let index = Math.max(0, Math.min(slides.length - 1, (parseInt(location.hash.slice(1), 10) || 1) - 1));
  let mode = mobile.matches ? 'reading' : 'present', explicitMode = false;
  let printState = false, statusTimer;
  slides.forEach((slide, i) => { const option = document.createElement('option'); option.value = i; option.textContent = `${i + 1}. ${slide.dataset.title}`; select.append(option); });
  function announce(text) { $('#status').textContent = text; clearTimeout(statusTimer); statusTimer = setTimeout(() => { $('#status').textContent = ''; }, 3500); }
  function render() {
    document.body.dataset.mode = mode;
    slides.forEach((s,i)=>{if(i!==index){s.querySelectorAll('git-demo').forEach(d=>d.pause?.());s.querySelectorAll('video').forEach(v=>v.pause());}});
    slides.forEach((slide, i) => { slide.hidden = !printState && mode === 'present' && i !== index; slide.inert = slide.hidden; slide.setAttribute('aria-hidden', String(slide.hidden)); });
    $('#counter').textContent = `${index + 1} / ${slides.length}`;
    $('#prev').disabled = index === 0; $('#next').disabled = index === slides.length - 1;
    $('#mode').textContent = mode === 'present' ? '세로 읽기' : '발표 모드';
    $('#mode').setAttribute('aria-pressed', String(mode === 'reading'));
    select.value = index;
    if (mode === 'present') deck.style.transform = `translate(-50%, -50%) scale(${Math.min(viewport.clientWidth / 1280, viewport.clientHeight / 720)})`;
    $('#announcement').textContent = `${index + 1}장. ${slides[index].dataset.title}`;
  }
  function move(value, scroll = true) { index = Math.max(0, Math.min(slides.length - 1, value)); history.replaceState(null, '', `#${index + 1}`); render(); if (mode === 'reading' && scroll) slides[index].scrollIntoView({block:'start'}); }
  function toggleMode() { explicitMode = true; mode = mode === 'present' ? 'reading' : 'present'; render(); if (mode === 'reading') slides[index].scrollIntoView({block:'start'}); }
  $('#prev').onclick = () => move(index - 1); $('#next').onclick = () => move(index + 1);
  select.onchange = () => move(Number(select.value)); $('#mode').onclick = toggleMode;
  $('#fullscreen').onclick = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else if(document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); else announce('브라우저 메뉴의 전체화면 기능 사용'); } catch { announce('브라우저 메뉴의 전체화면 기능 사용'); } };
  $('#mono').onclick = () => { const mono = document.body.dataset.theme !== 'mono'; document.body.dataset.theme = mono ? 'mono' : 'light'; $('#mono').setAttribute('aria-pressed', String(mono)); };
  $('#print').onclick = async () => { await document.fonts.ready; window.print(); };
  function openNotes() { $('#notes-title').textContent = `${index + 1}. ${slides[index].dataset.title}`; $('#notes-content').replaceChildren(slides[index].querySelector('.notes-block').content.cloneNode(true)); $('#notes-dialog').showModal(); }
  $('#notes').onclick = openNotes; $('#close-notes').onclick = () => $('#notes-dialog').close();
  $('#notes-dialog').addEventListener('click', e => { if(e.target === $('#notes-dialog')) { const r = e.target.getBoundingClientRect(); if(e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) e.target.close(); } });
  addEventListener('keydown', e => {
    if ($('#notes-dialog').open || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest('a,button,input,textarea,select,[contenteditable=true],.table-wrap,pre,video,git-demo,details')) return;
    if (e.key.toLowerCase() === 'n') { e.preventDefault(); openNotes(); return; }
    if (e.key.toLowerCase() === 'r') { e.preventDefault(); toggleMode(); return; }
    if (mode === 'reading') return;
    const target = {ArrowLeft:index-1,PageUp:index-1,ArrowRight:index+1,PageDown:index+1,Home:0,End:slides.length-1,' ':index+1}[e.key];
    if(target !== undefined){e.preventDefault();move(target);}
  });
  addEventListener('hashchange', () => move((parseInt(location.hash.slice(1),10)||1)-1));
  addEventListener('resize', render); addEventListener('fullscreenchange',render);
  mobile.addEventListener('change',()=>{if(!explicitMode) mode=mobile.matches?'reading':'present';render();});
  addEventListener('beforeprint',()=>{printState=true;render();}); addEventListener('afterprint',()=>{printState=false;render();});
  const observer = new IntersectionObserver(entries => { if(mode !== 'reading' || printState) return; const candidates = entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio); if(candidates.length){index=slides.indexOf(candidates[0].target); select.value=index; $('#counter').textContent=`${index+1} / ${slides.length}`; $('#prev').disabled=index===0;$('#next').disabled=index===slides.length-1;} },{rootMargin:'-10% 0px -45% 0px',threshold:0});
  slides.forEach(s=>observer.observe(s));
  document.fonts.ready.then(render); render();
})();

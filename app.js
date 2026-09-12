/* ============ PAGE NAVIGATION ============ */
let current = 1;
function goTo(n){
  const curEl = document.getElementById('page-'+current);
  const nextEl = document.getElementById('page-'+n);
  if(!nextEl || n===current) return;
  curEl.classList.add('leaving');
  curEl.classList.remove('active');
  setTimeout(()=> curEl.classList.remove('leaving'), 560);
  nextEl.classList.add('active');
  current = n;
  if(n===4) initCaptcha();
  if(n===7){
    initCanvasPage();
    setTimeout(showStayModal, 700); // ask "stay here??" once the interface is already visible
  }
}

/* ============ PAGE 3 : NAME ============ */
let userName = '';
function submitName(e){
  e.preventDefault();
  const val = document.getElementById('nameInput').value.trim();
  userName = val || 'Vara';
  goTo(4);
}

/* ============ PAGE 4 : REVERSE SHIFT CAPTCHA ============
   The captcha shown on screen (CAPTCHA_TARGET) is a normal-looking
   random code, e.g. "A3rF5". It is NOT what the user types.
   To pass, the user must type the REQUIRED_ANSWER: the same code with
   every digit swapped for its Shift-symbol (3 -> #, 5 -> %, 6 -> ^ ...)
   and every letter's case flipped (r -> R, F -> f). They type this
   normally on their keyboard (real Shift presses for real symbols/
   case) - the "reverse" part is the mental transform, not the keys. */
let CAPTCHA_TARGET = 'thalavara';
let REQUIRED_ANSWER = '';
let captchaBuffer = '';
let captchaKeyHandler = null;

const SHIFT_SYMBOL_MAP = {
  '1':'!','2':'@','3':'#','4':'$','5':'%',
  '6':'^','7':'&','8':'*','9':'(','0':')'
};

// Generates a real captcha-style code: mixed upper/lower letters + digits.
function generateCaptchaTarget(){
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const upper = lower.toUpperCase();
  const digits = '23456789';
  let out = '';
  for(let i=0;i<6;i++){
    const r = Math.random();
    if(r < 0.18) out += digits[Math.floor(Math.random()*digits.length)];
    else if(r < 0.59) out += lower[Math.floor(Math.random()*lower.length)];
    else out += upper[Math.floor(Math.random()*upper.length)];
  }
  return out;
}

// Digit -> its Shift symbol. Lowercase <-> uppercase. Everything else unchanged.
function computeRequiredAnswer(target){
  return [...target].map(ch=>{
    if(SHIFT_SYMBOL_MAP[ch]) return SHIFT_SYMBOL_MAP[ch];
    if(/[a-z]/.test(ch)) return ch.toUpperCase();
    if(/[A-Z]/.test(ch)) return ch.toLowerCase();
    return ch;
  }).join('');
}

function renderCaptchaCode(){
  const box = document.getElementById('captchaCode');
  box.innerHTML = '';
  [...CAPTCHA_TARGET].forEach((ch,i)=>{
    const s = document.createElement('span');
    s.textContent = ch;
    const rot = (i%2===0 ? -1 : 1) * (6 + Math.random()*8);
    const rise = (i%3===0) ? -4 : (i%3===1 ? 3 : 0);
    s.style.display = 'inline-block';
    s.style.transform = `rotate(${rot.toFixed(1)}deg) translateY(${rise}px)`;
    box.appendChild(s);
  });
}

function initCaptcha(){
  CAPTCHA_TARGET = generateCaptchaTarget();
  REQUIRED_ANSWER = computeRequiredAnswer(CAPTCHA_TARGET);
  renderCaptchaCode();
  captchaBuffer = '';
  renderCaptcha();
  document.getElementById('captchaStatus').textContent = '';
  document.getElementById('captchaStatus').className = 'p4-status';
  if(captchaKeyHandler) window.removeEventListener('keydown', captchaKeyHandler);
  captchaKeyHandler = function(e){
    if(current !== 4) return;
    if(e.key === 'Backspace'){
      e.preventDefault();
      captchaBuffer = captchaBuffer.slice(0,-1);
      renderCaptcha();
      return;
    }
    if(e.key === 'Enter'){
      e.preventDefault();
      checkCaptcha();
      return;
    }
    if(e.key.length === 1){
      e.preventDefault();
      // Type normally: real Shift presses produce the real symbol/case.
      captchaBuffer += e.key;
      renderCaptcha();
      autoCheckCaptcha();
    }
  };
  window.addEventListener('keydown', captchaKeyHandler);
}

function renderCaptcha(){
  document.getElementById('captchaText').textContent = captchaBuffer;
}

function autoCheckCaptcha(){
  const statusEl = document.getElementById('captchaStatus');
  if(captchaBuffer === REQUIRED_ANSWER){
    statusEl.textContent = 'Correct — thalavara nokka! ✓';
    statusEl.className = 'p4-status ok';
    window.removeEventListener('keydown', captchaKeyHandler);
    setTimeout(()=> goTo(5), 750);
  } else if(captchaBuffer.length >= REQUIRED_ANSWER.length){
    statusEl.textContent = 'Not quite — try again with Shift reversed';
    statusEl.className = 'p4-status err';
    setTimeout(()=>{ captchaBuffer=''; renderCaptcha(); statusEl.textContent=''; statusEl.className='p4-status'; }, 900);
  }
}
function checkCaptcha(){ autoCheckCaptcha(); }

/* ============ PAGE 5 & 6 : OPPOSITE SELECTION + MODAL ============ */
let selection = null; // final chosen animal for the canvas page

function selectImage(clicked){
  // ANTI-GRAVITY REVERSE LOGIC: clicking cat selects apple, and vice versa
  selection = clicked === 'cat' ? 'apple' : 'cat';
  // go straight into the canvas interface for the (swapped) selection —
  // the "stay here?" confirmation is asked once the interface is already showing
  goTo(7);
}

function showStayModal(){
  document.getElementById('modal-overlay').classList.add('show');
}

function modalChoice(choice){
  document.getElementById('modal-overlay').classList.remove('show');
  if(choice === 'no'){
    // REVERSE LOGIC: "Nooo" swaps the view to the opposite of current selection
    selection = selection === 'cat' ? 'apple' : 'cat';
    document.getElementById('refImageBox').innerHTML = selection === 'cat' ? CAT_SVG : APPLE_SVG;
  }
  // "Yes" keeps the current (already-swapped) selection as-is — stay on the canvas
}

/* ============ PAGE 7 : MIRROR CANVAS + REVERSE TOOLBAR ============ */
// Reverse pairing follows the toolbar's actual on-screen order
// (brush, brushsize, square, circle, fill, eraser): position 1<->6,
// 2<->5, 3<->4 -> brush<->eraser, brushsize<->fill, square<->circle.
const TOOL_MAP = {
  brush:'eraser',
  eraser:'brush',
  brushsize:'fill',
  fill:'brushsize',
  square:'circle',
  circle:'square'
};
let activeTool = 'eraser';
let brushSize = 8;
let drawing = false;
let lastPt = null;
let ctx, canvasEl;
let coverageGrid = [];
const GRID_N = 36;
const COMPLETION_THRESHOLD = 90; // % of canvas covered before auto-advancing (confidence = 100 - coverage, so this fires once confidence drops below 10%)
let canvasInited = false;

const CAT_SVG = `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#222" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
  <path d="M60 70 L48 28 L78 52 Z"/><path d="M140 70 L152 28 L122 52 Z"/>
  <path d="M60 70 Q40 110 46 150 Q50 190 100 196 Q150 190 154 150 Q160 110 140 70 Q100 46 60 70 Z"/>
  <circle cx="78" cy="118" r="9" fill="#222"/><circle cx="122" cy="118" r="9" fill="#222"/>
  <path d="M92 140 Q100 148 108 140" /><path d="M100 132 L96 140 L104 140 Z" fill="#222"/>
  <path d="M40 132 L10 126 M40 140 L8 140 M40 148 L10 154" />
  <path d="M160 132 L190 126 M160 140 L192 140 M160 148 L190 154" />
  <path d="M154 150 Q188 150 186 190 Q184 210 160 202" />
</svg>`;
const APPLE_SVG = `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#222" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
  <path d="M100 60 C 96 40 108 26 122 22"/>
  <path d="M100 58 C 118 44 138 50 142 66 C 154 48 130 24 106 40"/>
  <path d="M100 62 C 60 50 30 84 32 126 C 34 172 66 200 100 198 C 134 200 168 172 168 126 C 168 84 138 50 100 62 Z"/>
</svg>`;

function initCanvasPage(){
  document.getElementById('refImageBox').innerHTML = selection === 'cat' ? CAT_SVG : APPLE_SVG;
  canvasEl = document.getElementById('drawCanvas');
  ctx = canvasEl.getContext('2d');
  if(!canvasInited){
    ctx.fillStyle = '#D9D9D9';
    ctx.fillRect(0,0,canvasEl.width,canvasEl.height);
    canvasEl.addEventListener('mousedown', onDown);
    canvasEl.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    document.getElementById('sizeSlider').addEventListener('input', e=>{ brushSize = +e.target.value; });
    document.querySelectorAll('.p7-tool').forEach(el=>{
      el.addEventListener('click', ()=> chooseTool(el.dataset.tool));
    });
    canvasInited = true;
  } else {
    resetCanvasState();
  }
  coverageGrid = new Array(GRID_N*GRID_N).fill(0);
  updateConfidence();
  chooseTool('brush', true);
}

function resetCanvasState(){
  ctx.fillStyle = '#D9D9D9';
  ctx.fillRect(0,0,canvasEl.width,canvasEl.height);
}

function chooseTool(clicked, silent){
  // REVERSE MAPPING: clicking a tool activates its mirrored counterpart
  activeTool = TOOL_MAP[clicked];
  document.querySelectorAll('.p7-tool').forEach(el=>{
    el.classList.toggle('active', el.dataset.tool === activeTool);
  });
  document.getElementById('sizeWrap').classList.toggle('show', activeTool === 'brushsize');
  document.getElementById('activeToolTag').textContent = 'TOOL: ' + activeTool.toUpperCase();
  // Fill no longer fires just from selecting the tool - only from an
  // actual click on the canvas (see onDown), so choosing a tool never
  // by itself jumps the confidence bar or advances the page.
}

function canvasPoint(e){
  const rect = canvasEl.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width * canvasEl.width;
  const y = (e.clientY - rect.top) / rect.height * canvasEl.height;
  return {x,y};
}
function mirror(pt){
  return { x: canvasEl.width - pt.x, y: canvasEl.height - pt.y };
}

function onDown(e){
  if(activeTool === 'fill'){
    doMirroredFill();
    return;
  }
  drawing = true;
  const raw = canvasPoint(e);
  lastPt = mirror(raw);
  markCoverage(lastPt);
  if(activeTool === 'square' || activeTool === 'circle'){
    dragStart = lastPt;
  } else {
    ctx.beginPath();
    ctx.arc(lastPt.x, lastPt.y, brushSize/2, 0, Math.PI*2);
    ctx.fillStyle = activeTool === 'eraser' ? '#D9D9D9' : '#2B2640';
    ctx.fill();
  }
}
let dragStart = null;
function onMove(e){
  if(!drawing) return;
  const raw = canvasPoint(e);
  const pt = mirror(raw);
  if(activeTool === 'brush' || activeTool === 'eraser'){
    ctx.strokeStyle = activeTool === 'eraser' ? '#D9D9D9' : '#2B2640';
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPt.x, lastPt.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    markCoverage(pt);
    lastPt = pt;
  }
}
function onUp(e){
  if(!drawing) return;
  drawing = false;
  if((activeTool === 'square' || activeTool === 'circle') && dragStart){
    const raw = canvasPoint(e);
    const pt = mirror(raw);
    ctx.strokeStyle = '#2B2640';
    ctx.lineWidth = Math.max(3, brushSize/2);
    if(activeTool === 'square'){
      ctx.strokeRect(Math.min(dragStart.x,pt.x), Math.min(dragStart.y,pt.y), Math.abs(pt.x-dragStart.x), Math.abs(pt.y-dragStart.y));
    } else {
      const r = Math.hypot(pt.x-dragStart.x, pt.y-dragStart.y);
      ctx.beginPath();
      ctx.arc(dragStart.x, dragStart.y, r, 0, Math.PI*2);
      ctx.stroke();
    }
    markCoverageRect(dragStart, pt);
    dragStart = null;
  }
  lastPt = null;
}

function doMirroredFill(){
  ctx.fillStyle = '#C9BCEE';
  ctx.fillRect(0,0,canvasEl.width,canvasEl.height);
  coverageGrid = coverageGrid.map(()=>1);
  updateConfidence();
}

function markCoverage(pt){
  const gx = Math.floor(pt.x / canvasEl.width * GRID_N);
  const gy = Math.floor(pt.y / canvasEl.height * GRID_N);
  for(let dx=-1; dx<=1; dx++){
    for(let dy=-1; dy<=1; dy++){
      const x = gx+dx, y = gy+dy;
      if(x>=0 && x<GRID_N && y>=0 && y<GRID_N) coverageGrid[y*GRID_N+x] = 1;
    }
  }
  updateConfidence();
}
function markCoverageRect(a,b){
  const steps = 12;
  for(let i=0;i<=steps;i++){
    markCoverage({ x: a.x + (b.x-a.x)*i/steps, y: a.y + (b.y-a.y)*i/steps });
  }
}

function updateConfidence(){
  const painted = coverageGrid.reduce((a,b)=>a+b,0);
  const coverage = painted / (GRID_N*GRID_N) * 100;
  const confidence = Math.max(0, 100 - coverage);
  document.getElementById('confFill').style.height = confidence + '%';
  if(coverage >= COMPLETION_THRESHOLD){
    setTimeout(()=> goTo(8), 500);
  }
}

/* ============ PAGE 8 : SURPRISE ENVELOPE ============ */
function openEnvelope(){
  const flap = document.getElementById('envFlap');
  if(flap) flap.classList.add('open');
  setTimeout(()=> goTo(9), 550);
}

/* ============ PAGE 9 : loop back into the captcha ============ */
function nextLoop(){
  goTo(4);
}

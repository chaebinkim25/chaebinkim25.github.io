tElementById('messages'),
// ──────────────────────────────────────────────
// 최신 AI 모델 (수동 업데이트형 models.json)
// ──────────────────────────────────────────────
let ALL_MODELS = [];
function formatPrice(p){
if(!p) return '가격 정보 없음';
const fr = p.free ? '무료' : (p.trial? '체험판' : '유료');
const parts = [];
if(p.input) parts.push(`입력 ${p.input}`);
if(p.output) parts.push(`출력 ${p.output}`);
if(p.image) parts.push(`이미지 ${p.image}`);
if(p.audio) parts.push(`오디오 ${p.audio}`);
return [fr, parts.join(' · ')].filter(Boolean).join(' — ');
}
function renderModels(){
const box = els.aiList; if(!box) return;
const cat = els.aiCatFilter?.value || '';
const freeOnly = els.aiFreeOnly?.checked;
box.innerHTML='';
const items = ALL_MODELS.filter(m=>{
const okCat = !cat || (Array.isArray(m.category)? m.category.includes(cat) : m.category===cat);
const okFree = !freeOnly || (!!m.price?.free || (m.price?.trial===true));
return okCat && okFree;
});
if(!items.length){ box.textContent = '해당 조건의 모델이 없습니다.'; return; }
for(const m of items){
const price = formatPrice(m.price);
const cats = Array.isArray(m.category)? m.category.join(', ') : (m.category||'');
const div = document.createElement('div');
div.className = 'cite';
div.innerHTML = `
<b>${m.name}</b> <small>(${m.org}${m.date?`, ${m.date}`:''}${cats?`, ${cats}`:''})</small><br>
${m.desc || ''}<br>
<span class="pill">${price}</span>
<a href="${m.url}" target="_blank" style="margin-left:8px">🔗 자세히 보기</a>
`;
box.appendChild(div);
}
}
async function loadModels(){
try{
const res = await fetch('models.json', { cache: 'no-cache' });
const items = await res.json();
ALL_MODELS = Array.isArray(items) ? items : [];
renderModels();
}catch(e){
const box = els.aiList; if(!box) return;
box.classList.add('danger');
box.textContent = '모델 정보를 불러올 수 없습니다: ' + e.message;
}
}


document.addEventListener('change', (e)=>{
if(e.target && (e.target.id==='aiCatFilter' || e.target.id==='aiFreeOnly')){
renderModels();
}
});


// 환영 메시지 & 초기화
addMessage('assistant', '안녕하세요! GitHub Pages에서 동작하는 HTML+JS AI 포털 템플릿입니다. 설정 버튼에서 프록시 API URL을 입력하고 시작하세요.');
loadModels();

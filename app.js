// models-only app.js
const els = {
  aiCatFilter: document.getElementById('aiCatFilter'),
  aiFreeOnly: document.getElementById('aiFreeOnly'),
  aiList: document.getElementById('aiList'),
};

let ALL_MODELS = [];

// ✅ 카테고리 매칭 헬퍼 (이미지/영상 ⇄ 이미지/비디오 포함)
function categoryMatches(selected, rawCat){
  if(!selected) return true;
  if(!rawCat) return false;

  // 모델의 카테고리를 배열로 정규화
  const modelCats = (Array.isArray(rawCat) ? rawCat : [rawCat])
    .filter(Boolean)
    .map(s => String(s).trim().toLowerCase());

  const sel = String(selected).trim().toLowerCase();

  // '이미지/영상' 선택 시 허용 토큰(한/영, 변형 포함)
  if (sel === '이미지/영상' || sel === 'image/video' || sel === 'media') {
    const accept = new Set([
      '이미지','영상','비디오','이미지/영상',
      'image','video','image/video','multimodal','multi-modal','multi modal'
    ]);
    return modelCats.some(c => accept.has(c));
  }

  // 그 외는 정확/포함 매칭(배열이면 includes, 문자열이면 동일)
  return modelCats.includes(sel);
}

function formatPrice(p){
  if(!p) return '가격 정보 없음';
  const fr = p.free ? '무료' : '유료';
  if(p.free) return fr;
  const parts = [];
  if(p.subscription) parts.push(`1달 구독: ${p.subscription}`);
  if(p.input) parts.push(`입력 ${p.input}`);
  if(p.output) parts.push(`출력 ${p.output}`);
  if(p.image) parts.push(`이미지 ${p.image}`);
  if(p.audio) parts.push(`오디오 ${p.audio}`);
  return [parts.join(' · ')].filter(Boolean).join(' — ');
}

function renderModels(){
  const box = els.aiList;
  if(!box) return;
  const cat = els.aiCatFilter?.value || '';
  const freeOnly = els.aiFreeOnly?.checked;
  box.innerHTML = '';
  const items = ALL_MODELS.filter(m=>{
    const okCat = categoryMatches(cat, m.category);
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
      <a href="${m.url}" target="_blank" style="margin-left:8px">🔗 ${m.url}</a>
    `;
    box.appendChild(div);
  }
}

async function loadModels(){
  try{
    const res = await fetch('models.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items = await res.json();
    ALL_MODELS = Array.isArray(items) ? items : [];
    renderModels();
  }catch(e){
    const box = els.aiList;
    if(!box) return;
    box.classList.add('danger');
    box.textContent = '모델 정보를 불러올 수 없습니다: ' + e.message;
  }
}

document.addEventListener('change', (e)=>{
  if(e.target && (e.target.id==='aiCatFilter' || e.target.id==='aiFreeOnly')){
    renderModels();
  }
});

loadModels();

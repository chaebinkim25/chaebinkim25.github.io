// models-only app.js
const els = {
  aiCatFilter: document.getElementById('aiCatFilter'),
  aiList: document.getElementById('aiList'),
};

let ALL_MODELS = [];

/* -------------------------
 * 유틸
 * ------------------------- */
function parseDateLoose(s) {
  if (!s) return null;
  const str = String(s).trim();
  const m = str.match(/^(\d{4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2] || 1) - 1;
  const d = Number(m[3] || 1);
  const dt = new Date(Date.UTC(y, mo, d));
  return isNaN(dt.getTime()) ? null : dt;
}

function sortModelsByDateDesc(items) {
  return [...items].sort((a, b) => {
    const da = parseDateLoose(a.date);
    const db = parseDateLoose(b.date);
    if (da && db) return db - da;
    if (da && !db) return -1;
    if (!da && db) return 1;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });
}

/* -------------------------
 * 카테고리 매칭
 * ------------------------- */
function categoryMatches(selected, rawCat) {
  if (!selected) return true;
  if (!rawCat) return false;

  const modelCats = (Array.isArray(rawCat) ? rawCat : [rawCat])
    .filter(Boolean)
    .map(s => String(s).trim().toLowerCase());

  const sel = String(selected).trim().toLowerCase();

  if (sel === '이미지/영상' || sel === 'image/video' || sel === 'media') {
    const accept = new Set([
      '이미지','영상','비디오','이미지/영상',
      'image','video','image/video','media',
      'multimodal','multi-modal','multi modal'
    ]);
    return modelCats.some(c => accept.has(c));
  }

  return modelCats.includes(sel);
}

/* -------------------------
 * 카테고리 옵션 구성
 *  - models.json에서 카테고리 자동 수집
 *  - '이미지/영상' 특수 옵션 포함
 *  - '오픈소스' 우선 배치(있을 때)
 * ------------------------- */
function collectCategories(items) {
  const set = new Map(); // key: lower, val: original label
  for (const m of items) {
    if (!m?.category) continue;
    const cats = Array.isArray(m.category) ? m.category : [m.category];
    for (const c of cats) {
      const label = String(c).trim();
      if (!label) continue;
      const key = label.toLowerCase();
      if (!set.has(key)) set.set(key, label); // 처음 본 라벨 보존
    }
  }
  return Array.from(set.values());
}


function populateCategoryFilter(items) {
  const sel = els.aiCatFilter;
  if (!sel) return;

  const prev = sel.value; // 기존 선택값 기억

  // 기본/특수 옵션
  const SPECIALS = [
    { value: '', label: '모두' },
  ];

  // 데이터에서 수집
  let cats = collectCategories(items);

  // 우선순위: '오픈소스'가 있으면 맨 앞쪽(특수 옵션 다음)
  const priority = ['오픈소스'];
  cats.sort((a, b) => {
    const ia = priority.indexOf(a);
    const ib = priority.indexOf(b);
    if (ia !== -1 || ib !== -1) {
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    }
    // 그 외는 가나다/알파벳 정렬
    return a.localeCompare(b, 'ko');
  });

  // 렌더
  sel.innerHTML = '';
  for (const o of SPECIALS) {
    const opt = document.createElement('option');
    opt.value = o.value;
    opt.textContent = o.label;
    sel.appendChild(opt);
  }
  for (const c of cats) {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    sel.appendChild(opt);
  }

  // 기존 선택 복원(없으면 그대로)
  if ([...sel.options].some(o => o.value === prev)) {
    sel.value = prev;
  }
}

/* -------------------------
 * 렌더링
 * ------------------------- */
function renderModels() {
  const box = els.aiList;
  if (!box) return;

  const cat = els.aiCatFilter?.value || '';
  box.innerHTML = '';

  let items = ALL_MODELS.filter(m => categoryMatches(cat, m.category));
  items = sortModelsByDateDesc(items);

  if (!items.length) {
    box.textContent = '해당 조건의 모델이 없습니다.';
    return;
  }

  for (const m of items) {
    const org = m.org || '';
    const date = m.date || '';
    const fam = m.model_family ? `<span class="pill" style="margin-left:6px">${m.model_family}</span>` : '';

    let catPills = '';
    if (m.category) {
      const cats = Array.isArray(m.category) ? m.category : [m.category];
      catPills = cats
        .map(c => `<span class="pill" style="background:#e2e8f0; color:#1e293b; margin-right:4px;">${c}</span>`)
        .join('');
    }

    const url = m.url ? String(m.url) : '';
    const urlAnchor = url ? `<a href="${url}" target="_blank" style="margin-left:8px">🔗 ${url}</a>` : '';

    const div = document.createElement('div');
    div.className = 'cite';
    div.innerHTML = `
      ${fam} ${catPills} <b>${m.name || '이름 없음'}</b>
      ${org || date ? ` <small>(${[org, date].filter(Boolean).join(', ')})</small>` : ''}<br>
      
      ${m.desc ? `<div style="margin-top:4px">${m.desc}</div>` : ''}
      ${urlAnchor}
    `;
    box.appendChild(div);
  }
}

/* -------------------------
 * 데이터 로딩
 * ------------------------- */
async function loadModels() {
  try {
    const res = await fetch('models.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items = await res.json();
    ALL_MODELS = Array.isArray(items) ? items : [];

    // ✅ 카테고리 선택 옵션을 데이터로부터 채움
    populateCategoryFilter(ALL_MODELS);

    renderModels();
  } catch (e) {
    const box = els.aiList;
    if (!box) return;
    box.classList.add('danger');
    box.textContent = '모델 정보를 불러올 수 없습니다: ' + e.message;
  }
}

/* -------------------------
 * 이벤트
 * ------------------------- */
document.addEventListener('change', (e) => {
  if (e.target && e.target.id === 'aiCatFilter') {
    renderModels();
  }
});

loadModels();

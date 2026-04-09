// ---- marked.js セットアップ ----
if (typeof marked !== 'undefined') {
  const wikiRenderer = {
    table(token) {
      const header = token.header.map(h =>
        `<th>${marked.parseInline(h.text)}</th>`
      ).join('');
      const rows = token.rows.map(row =>
        '<tr>' + row.map(cell =>
          `<td>${marked.parseInline(cell.text)}</td>`
        ).join('') + '</tr>'
      ).join('');
      return `<div class="table-wrap"><table><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table></div>`;
    }
  };
  marked.use({ renderer: wikiRenderer });
}

// ---- DOMPurify セットアップ ----
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'h1','h2','h3','h4','h5','h6',
    'p','br','hr','blockquote','pre','code',
    'ul','ol','li',
    'table','thead','tbody','tr','th','td',
    'a','strong','em','del','s',
    'div','span','img',
  ],
  ALLOWED_ATTR: ['href','title','target','rel','src','alt','width','height','class','style','id'],
  ALLOW_UNKNOWN_PROTOCOLS: false,
};
function sanitize(html) {
  return (typeof DOMPurify !== 'undefined') ? DOMPurify.sanitize(html, PURIFY_CONFIG) : html;
}

// ---- HTML エスケープ（テンプレートリテラル用）----
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---- Wiki Navigation ----
const wikiCache = {};

async function showWiki(article, btn) {
  document.querySelectorAll('.wiki-nav-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const display = document.getElementById('wiki-display');
  if (!display) return;

  if (!wikiCache[article]) {
    display.innerHTML = '<p style="color:var(--text3)">読み込み中...</p>';
    try {
      const res = await fetch('wiki/' + article + '.md');
      if (!res.ok) throw new Error('404');
      wikiCache[article] = await res.text();
    } catch {
      display.innerHTML = '<p style="color:var(--red)">記事を読み込めませんでした。</p>';
      return;
    }
  }
  display.innerHTML = sanitize(marked.parse(wikiCache[article]));
}

// ---- Wiki Search ----
function wikiSearch(query) {
  const btns = document.querySelectorAll('.wiki-nav-btn');
  const q = query.toLowerCase().trim();
  if (!q) {
    btns.forEach(b => b.style.display = '');
    document.querySelectorAll('.wiki-cat-label').forEach(l => l.style.display = '');
    return;
  }
  btns.forEach(b => {
    b.style.display = b.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

// ---- News フィルター状態 ----
let newsItems = [];
let newsFilter = { year: 'all', category: 'all' };

// ---- News 初期化 ----
async function initNews() {
  const list = document.querySelector('.news-list');
  if (!list) return;

  try {
    const res = await fetch('news/index.json');
    newsItems = await res.json();
  } catch {
    list.innerHTML = '<p style="color:var(--red)">お知らせを読み込めませんでした。</p>';
    return;
  }

  list.innerHTML = newsItems.map(item => `
    <div class="news-card" onclick="toggleNews(this)" data-id="${esc(item.id)}" data-year="${esc(item.date.slice(0, 4))}" data-category="${esc(item.category)}">
      <div class="news-card-header">
        <div style="flex:1">
          <div class="news-meta">
            <span class="news-date">${esc(item.date)}</span>
            <span class="pill pill-${esc(item.categoryColor)}">${esc(item.category)}</span>
          </div>
          <div class="news-title">${esc(item.title)}</div>
          <div class="news-summary">${esc(item.summary)}</div>
        </div>
        <span class="news-chevron">▼</span>
      </div>
      <div class="news-body"></div>
    </div>
  `).join('');

  renderNewsFilters();
  applyNewsFilter();
}

// ---- News フィルターボタン生成 ----
function renderNewsFilters() {
  const years = ['all', ...new Set(newsItems.map(i => i.date.slice(0, 4)))];
  const cats  = ['all', ...new Set(newsItems.map(i => i.category))];

  document.getElementById('news-year-filters').innerHTML =
    years.map(y => `<button class="news-filter-btn${y === 'all' ? ' active' : ''}" onclick="setNewsFilter('year','${esc(y)}',this)">${y === 'all' ? 'すべて' : esc(y) + '年'}</button>`).join('');

  document.getElementById('news-cat-filters').innerHTML =
    cats.map(c => `<button class="news-filter-btn${c === 'all' ? ' active' : ''}" onclick="setNewsFilter('category','${esc(c)}',this)">${c === 'all' ? 'すべて' : esc(c)}</button>`).join('');
}

// ---- News フィルター切り替え ----
function setNewsFilter(type, value, btn) {
  newsFilter[type] = value;
  btn.closest('.news-filter-group').querySelectorAll('.news-filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  applyNewsFilter();
}

// ---- News フィルター適用 ----
function applyNewsFilter() {
  const q = (document.getElementById('news-search')?.value ?? '').toLowerCase().trim();
  let visible = 0;

  document.querySelectorAll('.news-card').forEach(card => {
    const yearOk = newsFilter.year === 'all' || card.dataset.year === newsFilter.year;
    const catOk  = newsFilter.category === 'all' || card.dataset.category === newsFilter.category;
    const textOk = !q ||
      card.querySelector('.news-title').textContent.toLowerCase().includes(q) ||
      card.querySelector('.news-summary').textContent.toLowerCase().includes(q);

    const show = yearOk && catOk && textOk;
    card.style.display = show ? '' : 'none';
    if (show) visible++;
  });

  document.getElementById('news-empty').style.display = visible === 0 ? '' : 'none';
}

// ---- News 本文読み込み ----
async function loadNewsBody(card) {
  const id = card.dataset.id;
  const body = card.querySelector('.news-body');
  if (!id || body.dataset.loaded) return;

  if (!/^[a-zA-Z0-9\-]+$/.test(id)) {
    body.innerHTML = '<p style="color:var(--red)">無効な記事IDです。</p>';
    body.dataset.loaded = '1';
    return;
  }

  try {
    const res = await fetch('news/' + id + '.md');
    if (!res.ok) throw new Error('404');
    const md = await res.text();
    body.innerHTML = sanitize(marked.parse(md));
    body.dataset.loaded = '1';
  } catch {
    body.innerHTML = '<p style="color:var(--red)">本文を読み込めませんでした。</p>';
    body.dataset.loaded = '1';
  }
}

// ---- News Toggle ----
async function toggleNews(card) {
  const body = card.querySelector('.news-body');
  const isOpen = card.classList.contains('expanded');
  document.querySelectorAll('.news-card').forEach(c => {
    c.classList.remove('expanded');
    c.querySelector('.news-body').classList.remove('open');
  });
  if (!isOpen) {
    await loadNewsBody(card);
    card.classList.add('expanded');
    body.classList.add('open');
  }
}

// ---- Copy Server Address ----
function copyAddr() {
  const addr = document.getElementById('server-addr').textContent;
  navigator.clipboard.writeText(addr).then(() => {
    const btn = document.querySelector('.copy-btn');
    btn.textContent = 'コピー済み';
    setTimeout(() => btn.textContent = 'コピー', 1500);
  });
}

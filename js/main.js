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
  display.innerHTML = marked.parse(wikiCache[article]);
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

// ---- News 初期化 ----
async function initNews() {
  const list = document.querySelector('.news-list');
  if (!list) return;

  let items;
  try {
    const res = await fetch('news/index.json');
    items = await res.json();
  } catch {
    list.innerHTML = '<p style="color:var(--red)">お知らせを読み込めませんでした。</p>';
    return;
  }

  list.innerHTML = items.map(item => `
    <div class="news-card" onclick="toggleNews(this)" data-id="${item.id}">
      <div class="news-card-header">
        <div style="flex:1">
          <div class="news-meta">
            <span class="news-date">${item.date}</span>
            <span class="pill pill-${item.categoryColor}">${item.category}</span>
          </div>
          <div class="news-title">${item.title}</div>
          <div class="news-summary">${item.summary}</div>
        </div>
        <span class="news-chevron">▼</span>
      </div>
      <div class="news-body"></div>
    </div>
  `).join('');
}

// ---- News 本文読み込み ----
async function loadNewsBody(card) {
  const id = card.dataset.id;
  const body = card.querySelector('.news-body');
  if (!id || body.dataset.loaded) return;

  try {
    const res = await fetch('news/' + id + '.md');
    if (!res.ok) throw new Error('404');
    const md = await res.text();
    body.innerHTML = marked.parse(md);
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

// ---- Page Navigation ----
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.getElementById('nav-' + page).classList.add('active');
  window.scrollTo(0, 0);
}

// ---- Wiki Navigation ----
function showWiki(article) {
  document.querySelectorAll('.wiki-article').forEach(a => a.classList.remove('active'));
  document.querySelectorAll('.wiki-nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('wiki-' + article).classList.add('active');
  event.currentTarget.classList.add('active');
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

// ---- News Toggle ----
function toggleNews(card) {
  const body = card.querySelector('.news-body');
  const isOpen = card.classList.contains('expanded');
  // Close all
  document.querySelectorAll('.news-card').forEach(c => {
    c.classList.remove('expanded');
    c.querySelector('.news-body').classList.remove('open');
  });
  if (!isOpen) {
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

// ---- URL Hash Navigation ----
window.addEventListener('load', () => {
  const hash = location.hash.slice(1);
  if (hash && document.getElementById('page-' + hash)) {
    showPage(hash);
  }
});

const STORAGE_KEY = 'retroChallengeLogV1';
const DIFFICULTIES = ['쉬움', '보통', '어려움', '극악'];
const STATUSES = ['예정', '플레이 중', '클리어', '올클 완료', '보류'];
const GENRES = ['액션', 'RPG', '어드벤처', '슈팅', '격투', '퍼즐', '시뮬레이션', '레이싱', '플랫포머', '기타'];
const ORIGINAL_PLATFORMS = [
  'Famicom','Disk System','Super Famicom','Nintendo 64','GameCube','Wii','Wii U','Switch',
  'Game Boy','Game Boy Color','Game Boy Advance','Nintendo DS','Nintendo 3DS',
  'PlayStation','PlayStation 2','PlayStation Portable','Mega Drive','PC Engine','Arcade','기타'
];
const PLAYED_PLATFORMS = [
  'Famicom 실기','AV Famicom','Disk System 실기','Super Famicom 실기','Nintendo 64 실기','GameCube 실기','Wii 실기','Wii U 실기','Switch 실기',
  'Game Boy 실기','Game Boy Color 실기','Game Boy Advance 실기','DS 실기','3DS 실기','PlayStation 실기','PlayStation 2 실기',
  'Wii Virtual Console','Wii U Virtual Console','Nintendo 3DS Virtual Console','Switch Online','컬렉션 합본','에뮬레이터','기타'
];
const ACH_FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '미달성' },
  { key: 'done', label: '달성' },
  { key: 'hard', label: '어려움 이상' }
];

let state = loadState();
let currentPage = 'home';
let selectedGameId = null;
let currentDrawerType = null;
let currentAchievementFilter = 'all';

function seedData() {
  const smbId = uid();
  const bioId = uid();
  const now = new Date().toISOString();
  return {
    games: [
      {
        id: smbId,
        title: '스ーパーマリオブラザーズ',
        altTitle: '슈퍼 마리오 브라더스',
        originalPlatform: 'Famicom',
        playedPlatform: 'Switch Online',
        releaseDate: '1985-09-13',
        genre: '플랫포머',
        status: '플레이 중',
        coverImage: '',
        note: '워프 없이 클리어 목표.',
        createdAt: now,
        updatedAt: now,
        achievements: [
          { id: uid(), title: '1회 클리어', description: '엔딩 보기', difficulty: '쉬움', completed: true, completedAt: '2026-03-18', note: '초반 워프 사용', order: 1, updatedAt: now },
          { id: uid(), title: '워프 없이 클리어', description: '전 구간 정석 진행', difficulty: '보통', completed: false, completedAt: '', note: '', order: 2, updatedAt: now },
          { id: uid(), title: '노컨티뉴 클리어', description: '컨티뉴 없이 엔딩', difficulty: '어려움', completed: false, completedAt: '', note: '', order: 3, updatedAt: now }
        ]
      },
      {
        id: bioId,
        title: 'バイオハザード',
        altTitle: 'Resident Evil',
        originalPlatform: 'PlayStation',
        playedPlatform: 'GameCube 실기',
        releaseDate: '1996-03-22',
        genre: '어드벤처',
        status: '예정',
        coverImage: '',
        note: '원작 감성 위주로 천천히 진행.',
        createdAt: now,
        updatedAt: now,
        achievements: [
          { id: uid(), title: '1회 엔딩 보기', description: '아무 루트나 엔딩 보기', difficulty: '쉬움', completed: false, completedAt: '', note: '', order: 1, updatedAt: now },
          { id: uid(), title: '세이브 최소화', description: '세이브 사용을 최소화한 클리어', difficulty: '어려움', completed: false, completedAt: '', note: '', order: 2, updatedAt: now }
        ]
      }
    ],
    ui: {
      gamesViewMode: 'all',
      filters: {
        status: '',
        originalPlatform: '',
        playedPlatform: ''
      },
      sort: 'releaseAsc',
      search: ''
    }
  };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return seedData();
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.games || !parsed.ui) return seedData();
    return parsed;
  } catch {
    return seedData();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getStatusClass(status = '') {
  return `status-${status.replace(/\s/g, '')}`;
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function yearOf(dateString = '') {
  return dateString ? String(dateString).slice(0, 4) : '-';
}

function gameProgress(game) {
  const total = game.achievements.length;
  const completed = game.achievements.filter(a => a.completed).length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  return { total, completed, percent };
}

function overallStats() {
  const totalGames = state.games.length;
  const totalAchievements = state.games.reduce((sum, g) => sum + g.achievements.length, 0);
  const completedAchievements = state.games.reduce((sum, g) => sum + g.achievements.filter(a => a.completed).length, 0);
  const overallPercent = totalAchievements ? Math.round((completedAchievements / totalAchievements) * 100) : 0;
  const clearedGames = state.games.filter(g => ['클리어', '올클 완료'].includes(g.status)).length;
  const playingGames = state.games.filter(g => g.status === '플레이 중').length;
  return { totalGames, totalAchievements, completedAchievements, overallPercent, clearedGames, playingGames };
}

function recentAchievementRecords(limit = 20) {
  return state.games.flatMap(game =>
    game.achievements
      .filter(a => a.completed)
      .map(a => ({
        gameId: game.id,
        gameTitle: game.title,
        achievementId: a.id,
        achievementTitle: a.title,
        completedAt: a.completedAt,
        difficulty: a.difficulty
      }))
  )
  .sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''))
  .slice(0, limit);
}

function recentlyUpdatedGames(limit = 10) {
  return [...state.games]
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
    .slice(0, limit);
}

function applyGameFilters(games) {
  const { search, filters, sort } = state.ui;
  let out = [...games];
  const q = search.trim().toLowerCase();

  if (q) {
    out = out.filter(g =>
      [g.title, g.altTitle, g.originalPlatform, g.playedPlatform]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }
  if (filters.status) out = out.filter(g => g.status === filters.status);
  if (filters.originalPlatform) out = out.filter(g => g.originalPlatform === filters.originalPlatform);
  if (filters.playedPlatform) out = out.filter(g => g.playedPlatform === filters.playedPlatform);

  out.sort((a, b) => {
    switch (sort) {
      case 'releaseAsc': return (a.releaseDate || '').localeCompare(b.releaseDate || '');
      case 'releaseDesc': return (b.releaseDate || '').localeCompare(a.releaseDate || '');
      case 'titleAsc': return a.title.localeCompare(b.title, 'ja');
      case 'recentAdded': return (b.createdAt || '').localeCompare(a.createdAt || '');
      case 'progressHigh': return gameProgress(b).percent - gameProgress(a).percent;
      case 'progressLow': return gameProgress(a).percent - gameProgress(b).percent;
      default: return 0;
    }
  });

  return out;
}

function render() {
  renderTopbar();
  renderHome();
  renderGames();
  renderRecords();
  renderSettings();
  renderDetail();
  syncNav();
  saveState();
}

function renderTopbar() {
  const titleMap = {
    home: '홈',
    games: '게임',
    detail: '게임 상세',
    records: '기록',
    settings: '설정'
  };
  document.getElementById('topTitle').textContent = titleMap[currentPage] || '홈';
  document.getElementById('fabBtn').classList.toggle('hidden', !(currentPage === 'games' || currentPage === 'detail'));
  document.getElementById('fabBtn').textContent = currentPage === 'detail' ? '★' : '＋';
}

function setPage(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  if (page === 'detail') {
    document.getElementById('page-detail').classList.add('active');
  } else {
    document.getElementById(`page-${page}`).classList.add('active');
  }
  renderTopbar();
  syncNav();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function syncNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    const page = btn.dataset.page;
    btn.classList.toggle('active', page === currentPage || (page === 'games' && currentPage === 'detail'));
  });
}

function renderHome() {
  const stats = overallStats();
  document.getElementById('homeOverallText').textContent = `${stats.completedAchievements} / ${stats.totalAchievements} 달성`;
  document.getElementById('homeOverallPercent').textContent = `${stats.overallPercent}%`;
  document.getElementById('homeGameCount').textContent = `게임 ${stats.totalGames}개`;
  document.getElementById('homeOverallBar').style.width = `${stats.overallPercent}%`;

  document.getElementById('statsGrid').innerHTML = `
    <div class="stat"><div class="label">등록 게임</div><div class="value">${stats.totalGames}</div></div>
    <div class="stat"><div class="label">전체 업적</div><div class="value">${stats.totalAchievements}</div></div>
    <div class="stat"><div class="label">클리어 이상</div><div class="value">${stats.clearedGames}</div></div>
    <div class="stat"><div class="label">플레이 중</div><div class="value">${stats.playingGames}</div></div>
  `;

  const recent = recentAchievementRecords(5);
  const recentWrap = document.getElementById('homeRecentAchievements');
  recentWrap.innerHTML = recent.length ? recent.map(r => `
    <button class="record-item" onclick="openGame('${r.gameId}')">
      <div class="split">
        <div>
          <strong>${escapeHtml(r.achievementTitle)}</strong>
          <div class="small muted" style="margin-top:4px;">${escapeHtml(r.gameTitle)}</div>
        </div>
        <div class="text-right">
          <div class="badge">${escapeHtml(r.difficulty)}</div>
          <div class="tiny muted" style="margin-top:6px;">${formatDate(r.completedAt)}</div>
        </div>
      </div>
    </button>
  `).join('') : `<div class="list-empty">아직 달성한 업적이 없다.</div>`;

  const recentGames = recentlyUpdatedGames(4);
  const rgWrap = document.getElementById('homeRecentGames');
  rgWrap.innerHTML = recentGames.length ? recentGames.map(g => {
    const prog = gameProgress(g);
    return `
      <button class="simple-item" onclick="openGame('${g.id}')">
        <div class="split">
          <div>
            <strong>${escapeHtml(g.title)}</strong>
            <div class="small muted" style="margin-top:4px;">${escapeHtml(g.originalPlatform)} · ${yearOf(g.releaseDate)}</div>
          </div>
          <div class="text-right">
            <div class="badge ${getStatusClass(g.status)}">${escapeHtml(g.status)}</div>
            <div class="tiny muted" style="margin-top:6px;">${prog.percent}%</div>
          </div>
        </div>
      </button>
    `;
  }).join('') : `<div class="list-empty">등록된 게임이 없다.</div>`;
}

function renderGames() {
  document.getElementById('gameSearchInput').value = state.ui.search || '';
  renderAppliedChips();
  const games = applyGameFilters(state.games);
  const container = document.getElementById('gamesContainer');

  if (!games.length) {
    container.innerHTML = `<div class="list-empty">조건에 맞는 게임이 없다.</div>`;
    return;
  }

  if (state.ui.gamesViewMode === 'grouped') {
    const grouped = games.reduce((acc, game) => {
      (acc[game.originalPlatform] ||= []).push(game);
      return acc;
    }, {});

    container.innerHTML = Object.entries(grouped).map(([platform, list]) => `
      <details class="platform-group" open>
        <summary>
          <span>${escapeHtml(platform)}</span>
          <span class="small muted">${list.length}개</span>
        </summary>
        <div class="group-body">
          ${list.map(renderGameCard).join('')}
        </div>
      </details>
    `).join('');
  } else {
    container.innerHTML = `<div class="game-grid">${games.map(renderGameCard).join('')}</div>`;
  }
}

function renderGameCard(game) {
  const prog = gameProgress(game);
  const coverContent = game.coverImage
    ? `<img src="${escapeHtml(game.coverImage)}" alt="${escapeHtml(game.title)}" />`
    : `<span>${escapeHtml(game.title)}</span>`;

  return `
    <button class="game-card" onclick="openGame('${game.id}')">
      <div class="cover">${coverContent}</div>
      <div class="game-main">
        <div>
          <h3 class="game-title">${escapeHtml(game.title)}</h3>
          ${game.altTitle ? `<div class="subtitle">${escapeHtml(game.altTitle)}</div>` : ''}
        </div>
        <div class="meta">
          <span class="badge">원작 ${escapeHtml(game.originalPlatform)}</span>
          <span class="badge">플레이 ${escapeHtml(game.playedPlatform)}</span>
          <span class="badge ${getStatusClass(game.status)}">${escapeHtml(game.status)}</span>
          <span class="badge">${yearOf(game.releaseDate)}</span>
        </div>
        <div class="progress-wrap">
          <div class="progress-row">
            <span class="small muted">${prog.completed} / ${prog.total} 달성</span>
            <strong class="small">${prog.percent}%</strong>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${prog.percent}%"></div></div>
        </div>
      </div>
    </button>
  `;
}

function renderAppliedChips() {
  const chips = [];
  chips.push(state.ui.gamesViewMode === 'grouped' ? '기종별 보기' : '전체보기');
  if (state.ui.filters.status) chips.push(`상태: ${state.ui.filters.status}`);
  if (state.ui.filters.originalPlatform) chips.push(`원작: ${state.ui.filters.originalPlatform}`);
  if (state.ui.filters.playedPlatform) chips.push(`플레이: ${state.ui.filters.playedPlatform}`);

  const sortMap = {
    releaseAsc: '발매일 빠른순',
    releaseDesc: '발매일 늦은순',
    titleAsc: '제목순',
    recentAdded: '최근 추가순',
    progressHigh: '진행률 높은순',
    progressLow: '진행률 낮은순'
  };

  chips.push(sortMap[state.ui.sort]);
  document.getElementById('appliedChips').innerHTML = chips.map(c => `<span class="chip active">${escapeHtml(c)}</span>`).join('');
}

function renderDetail() {
  const game = state.games.find(g => g.id === selectedGameId);
  if (!game) return;

  const prog = gameProgress(game);
  const cover = document.getElementById('detailCover');
  cover.innerHTML = game.coverImage
    ? `<img src="${escapeHtml(game.coverImage)}" alt="${escapeHtml(game.title)}" />`
    : `<span>${escapeHtml(game.title)}</span>`;

  document.getElementById('detailTitle').textContent = game.title;
  document.getElementById('detailSubtitle').textContent = game.altTitle || '';
  document.getElementById('detailMeta').innerHTML = `
    <span class="badge">원작 ${escapeHtml(game.originalPlatform)}</span>
    <span class="badge">플레이 ${escapeHtml(game.playedPlatform)}</span>
    <span class="badge">${escapeHtml(game.genre || '기타')}</span>
    <span class="badge ${getStatusClass(game.status)}">${escapeHtml(game.status)}</span>
    <span class="badge">${formatDate(game.releaseDate)}</span>
  `;
  document.getElementById('detailProgressText').textContent = `${prog.percent}%`;
  document.getElementById('detailProgressCount').textContent = `${prog.completed} / ${prog.total} 달성`;
  document.getElementById('detailProgressBar').style.width = `${prog.percent}%`;
  document.getElementById('detailNote').textContent = game.note?.trim() ? game.note : '메모가 없습니다.';

  document.getElementById('achievementFilterSeg').innerHTML = ACH_FILTERS.map(f => `
    <button class="seg-btn ${currentAchievementFilter === f.key ? 'active' : ''}" onclick="setAchievementFilter('${f.key}')">${f.label}</button>
  `).join('');

  const achWrap = document.getElementById('achievementList');
  let achievements = [...game.achievements].sort((a, b) => a.order - b.order);
  if (currentAchievementFilter === 'pending') achievements = achievements.filter(a => !a.completed);
  if (currentAchievementFilter === 'done') achievements = achievements.filter(a => a.completed);
  if (currentAchievementFilter === 'hard') achievements = achievements.filter(a => ['어려움', '극악'].includes(a.difficulty));

  achWrap.innerHTML = achievements.length
    ? achievements.map(a => renderAchievementItem(game, a)).join('')
    : `<div class="list-empty">조건에 맞는 업적이 없다.</div>`;
}

function renderAchievementItem(game, ach) {
  return `
    <div class="ach-item" id="ach-${ach.id}">
      <div class="ach-main">
        <button class="check-btn ${ach.completed ? 'done' : ''}" onclick="toggleAchievement('${game.id}','${ach.id}'); event.stopPropagation();">✓</button>
        <button class="ach-text" style="background:none;border:0;color:inherit;text-align:left;padding:0;" onclick="toggleAchievementOpen('${ach.id}')">
          <h4 class="ach-name">${escapeHtml(ach.title)}</h4>
          ${ach.description ? `<div class="tiny muted" style="margin-top:4px; line-height:1.4;">${escapeHtml(ach.description)}</div>` : ''}
          ${ach.completed ? `<div class="tiny muted" style="margin-top:4px;">${formatDate(ach.completedAt)} 달성</div>` : ''}
        </button>
        <span class="badge">${escapeHtml(ach.difficulty)}</span>
      </div>
      <div class="ach-extra">
        <div class="small" style="line-height:1.5; margin-bottom:10px;">${ach.description ? escapeHtml(ach.description) : '<span class="muted">설명이 없다.</span>'}</div>
        <div class="meta">
          ${ach.completed ? `<span class="badge">달성 ${formatDate(ach.completedAt)}</span>` : `<span class="badge">미달성</span>`}
        </div>
        <div class="field">
          <label>메모</label>
          <textarea class="textarea" placeholder="업적 관련 메모" onchange="saveAchievementNote('${game.id}','${ach.id}', this.value)">${escapeHtml(ach.note || '')}</textarea>
        </div>
        <div class="inline-actions">
          <button class="tiny-btn" onclick="editAchievement('${game.id}','${ach.id}')">업적 수정</button>
          <button class="tiny-btn danger" onclick="deleteAchievement('${game.id}','${ach.id}')">업적 삭제</button>
        </div>
      </div>
    </div>
  `;
}

function renderRecords() {
  const records = recentAchievementRecords(200);
  document.getElementById('recordsCount').textContent = `${records.length}개`;
  document.getElementById('recordsList').innerHTML = records.length ? records.map(r => `
    <button class="record-item" onclick="openGame('${r.gameId}')">
      <div class="split">
        <div>
          <strong>${escapeHtml(r.achievementTitle)}</strong>
          <div class="small muted" style="margin-top:4px;">${escapeHtml(r.gameTitle)}</div>
        </div>
        <div class="text-right">
          <div class="badge">${escapeHtml(r.difficulty)}</div>
          <div class="tiny muted" style="margin-top:6px;">${formatDate(r.completedAt)}</div>
        </div>
      </div>
    </button>
  `).join('') : `<div class="list-empty">아직 달성 기록이 없다.</div>`;
}

function renderSettings() {
  // static for now
}

function openDrawer(type) {
  currentDrawerType = type;
  const title = document.getElementById('drawerTitle');
  const content = document.getElementById('drawerContent');

  if (type === 'view') {
    title.textContent = '보기';
    content.innerHTML = `
      <div class="field-grid">
        <button class="action ${state.ui.gamesViewMode === 'all' ? 'primary' : ''}" onclick="setGamesViewMode('all')">전체보기</button>
        <button class="action ${state.ui.gamesViewMode === 'grouped' ? 'primary' : ''}" onclick="setGamesViewMode('grouped')">기종별 보기</button>
      </div>
    `;
  }

  if (type === 'filter') {
    title.textContent = '필터';
    content.innerHTML = `
      <div class="field-grid">
        <div class="field">
          <label>상태</label>
          <select class="select" id="filterStatus">
            <option value="">전체</option>
            ${STATUSES.map(v => `<option value="${v}" ${state.ui.filters.status === v ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>원작 기종</label>
          <select class="select" id="filterOriginal">
            <option value="">전체</option>
            ${ORIGINAL_PLATFORMS.map(v => `<option value="${v}" ${state.ui.filters.originalPlatform === v ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>플레이 기종</label>
          <select class="select" id="filterPlayed">
            <option value="">전체</option>
            ${PLAYED_PLATFORMS.map(v => `<option value="${v}" ${state.ui.filters.playedPlatform === v ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        </div>
        <div class="dual">
          <button class="action" onclick="resetFilters()">초기화</button>
          <button class="action primary" onclick="applyFiltersFromDrawer()">적용</button>
        </div>
      </div>
    `;
  }

  if (type === 'sort') {
    title.textContent = '정렬';
    const options = [
      ['releaseAsc', '일본 발매일 빠른순'],
      ['releaseDesc', '일본 발매일 늦은순'],
      ['titleAsc', '제목순'],
      ['recentAdded', '최근 추가순'],
      ['progressHigh', '진행률 높은순'],
      ['progressLow', '진행률 낮은순']
    ];
    content.innerHTML = `
      <div class="field-grid">
        ${options.map(([value, label]) => `<button class="action ${state.ui.sort === value ? 'primary' : ''}" onclick="setSort('${value}')">${label}</button>`).join('')}
      </div>
    `;
  }

  document.getElementById('drawerBackdrop').classList.add('open');
  document.getElementById('optionDrawer').classList.add('open');
}

function closeDrawer() {
  document.getElementById('drawerBackdrop').classList.remove('open');
  document.getElementById('optionDrawer').classList.remove('open');
  currentDrawerType = null;
}

function openModal(config) {
  document.getElementById('modalTitle').textContent = config.title;
  document.getElementById('modalForm').innerHTML = config.html;
  document.getElementById('modalForm').onsubmit = config.onSubmit;
  document.getElementById('modalBackdrop').classList.add('open');
  document.getElementById('formModal').classList.add('open');
  setTimeout(() => document.querySelector('#modalForm input, #modalForm select, #modalForm textarea')?.focus(), 0);
}

function closeModal() {
  document.getElementById('modalBackdrop').classList.remove('open');
  document.getElementById('formModal').classList.remove('open');
  document.getElementById('modalForm').innerHTML = '';
  document.getElementById('modalForm').onsubmit = null;
}

function gameFormHtml(game = {}) {
  return `
    <div class="field-grid">
      <div class="field">
        <label>대표 제목 (일본판 기준)</label>
        <input class="input" name="title" required value="${escapeHtml(game.title || '')}" placeholder="예: バイオハザード" />
      </div>
      <div class="field">
        <label>보조 제목</label>
        <input class="input" name="altTitle" value="${escapeHtml(game.altTitle || '')}" placeholder="예: Resident Evil" />
      </div>
      <div class="dual">
        <div class="field">
          <label>원작 기종</label>
          <select class="select" name="originalPlatform" required>
            ${ORIGINAL_PLATFORMS.map(v => `<option value="${v}" ${(game.originalPlatform || '') === v ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>플레이 기종</label>
          <select class="select" name="playedPlatform" required>
            ${PLAYED_PLATFORMS.map(v => `<option value="${v}" ${(game.playedPlatform || '') === v ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="dual">
        <div class="field">
          <label>일본 첫 발매일</label>
          <input class="input" type="date" name="releaseDate" value="${escapeHtml(game.releaseDate || '')}" />
        </div>
        <div class="field">
          <label>상태</label>
          <select class="select" name="status">
            ${STATUSES.map(v => `<option value="${v}" ${(game.status || '예정') === v ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="field">
        <label>장르</label>
        <select class="select" name="genre">
          ${GENRES.map(v => `<option value="${v}" ${(game.genre || '액션') === v ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label>커버 이미지 URL</label>
        <input class="input" name="coverImage" value="${escapeHtml(game.coverImage || '')}" placeholder="https://..." />
      </div>
      <div class="field">
        <label>메모</label>
        <textarea class="textarea" name="note" placeholder="플레이 목표나 비고">${escapeHtml(game.note || '')}</textarea>
      </div>
    </div>
    <div class="form-actions">
      <button type="button" class="action" onclick="closeModal()">취소</button>
      <button type="submit" class="action primary">저장</button>
    </div>
  `;
}

function achievementFormHtml(gameId, ach = {}) {
  const game = state.games.find(g => g.id === gameId);
  return `
    <div class="field-grid">
      <div class="notice">${escapeHtml(game?.title || '')}</div>
      <div class="field">
        <label>업적 이름</label>
        <input class="input" name="title" required value="${escapeHtml(ach.title || '')}" placeholder="예: 노컨티뉴 클리어" />
      </div>
      <div class="field">
        <label>설명</label>
        <textarea class="textarea" name="description" placeholder="조건 설명">${escapeHtml(ach.description || '')}</textarea>
      </div>
      <div class="dual">
        <div class="field">
          <label>난이도</label>
          <select class="select" name="difficulty">
            ${DIFFICULTIES.map(v => `<option value="${v}" ${(ach.difficulty || '보통') === v ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>정렬 순서</label>
          <input class="input" type="number" name="order" min="1" value="${ach.order || ((game?.achievements.length || 0) + 1)}" />
        </div>
      </div>
      <div class="field">
        <label>메모</label>
        <textarea class="textarea" name="note" placeholder="추가 메모">${escapeHtml(ach.note || '')}</textarea>
      </div>
    </div>
    <div class="form-actions">
      <button type="button" class="action" onclick="closeModal()">취소</button>
      <button type="submit" class="action primary">저장</button>
    </div>
  `;
}

function openAddGameModal() {
  openModal({
    title: '게임 추가',
    html: gameFormHtml({
      originalPlatform: ORIGINAL_PLATFORMS[0],
      playedPlatform: PLAYED_PLATFORMS[0],
      status: '예정',
      genre: '액션'
    }),
    onSubmit: (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const now = new Date().toISOString();

      state.games.unshift({
        id: uid(),
        title: fd.get('title').trim(),
        altTitle: fd.get('altTitle').trim(),
        originalPlatform: fd.get('originalPlatform'),
        playedPlatform: fd.get('playedPlatform'),
        releaseDate: fd.get('releaseDate'),
        genre: fd.get('genre'),
        status: fd.get('status'),
        coverImage: fd.get('coverImage').trim(),
        note: fd.get('note').trim(),
        createdAt: now,
        updatedAt: now,
        achievements: []
      });

      closeModal();
      setPage('games');
      render();
    }
  });
}

function openEditGameModal(gameId) {
  const game = state.games.find(g => g.id === gameId);
  if (!game) return;

  openModal({
    title: '게임 수정',
    html: gameFormHtml(game),
    onSubmit: (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      game.title = fd.get('title').trim();
      game.altTitle = fd.get('altTitle').trim();
      game.originalPlatform = fd.get('originalPlatform');
      game.playedPlatform = fd.get('playedPlatform');
      game.releaseDate = fd.get('releaseDate');
      game.genre = fd.get('genre');
      game.status = fd.get('status');
      game.coverImage = fd.get('coverImage').trim();
      game.note = fd.get('note').trim();
      game.updatedAt = new Date().toISOString();
      closeModal();
      render();
    }
  });
}

function openAddAchievementModal(gameId) {
  openModal({
    title: '업적 추가',
    html: achievementFormHtml(gameId),
    onSubmit: (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const game = state.games.find(g => g.id === gameId);
      if (!game) return;

      game.achievements.push({
        id: uid(),
        title: fd.get('title').trim(),
        description: fd.get('description').trim(),
        difficulty: fd.get('difficulty'),
        completed: false,
        completedAt: '',
        note: fd.get('note').trim(),
        order: Number(fd.get('order')) || game.achievements.length + 1,
        updatedAt: new Date().toISOString()
      });

      game.updatedAt = new Date().toISOString();
      closeModal();
      render();
    }
  });
}

function editAchievement(gameId, achievementId) {
  const game = state.games.find(g => g.id === gameId);
  const ach = game?.achievements.find(a => a.id === achievementId);
  if (!game || !ach) return;

  openModal({
    title: '업적 수정',
    html: achievementFormHtml(gameId, ach),
    onSubmit: (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      ach.title = fd.get('title').trim();
      ach.description = fd.get('description').trim();
      ach.difficulty = fd.get('difficulty');
      ach.note = fd.get('note').trim();
      ach.order = Number(fd.get('order')) || ach.order;
      ach.updatedAt = new Date().toISOString();
      game.updatedAt = new Date().toISOString();
      closeModal();
      render();
    }
  });
}

function deleteAchievement(gameId, achievementId) {
  const game = state.games.find(g => g.id === gameId);
  if (!game) return;
  if (!confirm('이 업적을 삭제할까?')) return;
  game.achievements = game.achievements.filter(a => a.id !== achievementId);
  game.updatedAt = new Date().toISOString();
  render();
}

function toggleAchievement(gameId, achievementId) {
  const game = state.games.find(g => g.id === gameId);
  const ach = game?.achievements.find(a => a.id === achievementId);
  if (!game || !ach) return;

  ach.completed = !ach.completed;
  ach.completedAt = ach.completed ? new Date().toISOString().slice(0, 10) : '';
  ach.updatedAt = new Date().toISOString();
  game.updatedAt = new Date().toISOString();
  render();
  setPage('detail');
}

function saveAchievementNote(gameId, achievementId, value) {
  const game = state.games.find(g => g.id === gameId);
  const ach = game?.achievements.find(a => a.id === achievementId);
  if (!game || !ach) return;
  ach.note = value;
  ach.updatedAt = new Date().toISOString();
  game.updatedAt = new Date().toISOString();
  saveState();
}

function toggleAchievementOpen(achievementId) {
  document.getElementById(`ach-${achievementId}`)?.classList.toggle('open');
}

function openGame(gameId) {
  selectedGameId = gameId;
  currentAchievementFilter = 'all';
  setPage('detail');
  renderDetail();
}

function setAchievementFilter(key) {
  currentAchievementFilter = key;
  renderDetail();
}

function setGamesViewMode(mode) {
  state.ui.gamesViewMode = mode;
  closeDrawer();
  render();
}

function applyFiltersFromDrawer() {
  state.ui.filters.status = document.getElementById('filterStatus').value;
  state.ui.filters.originalPlatform = document.getElementById('filterOriginal').value;
  state.ui.filters.playedPlatform = document.getElementById('filterPlayed').value;
  closeDrawer();
  render();
}

function resetFilters() {
  state.ui.filters = { status: '', originalPlatform: '', playedPlatform: '' };
  closeDrawer();
  render();
}

function setSort(sort) {
  state.ui.sort = sort;
  closeDrawer();
  render();
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'retro-challenge-log-backup.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!imported.games || !imported.ui) throw new Error('invalid');
      state = imported;
      selectedGameId = state.games[0]?.id || null;
      render();
      alert('불러오기 완료');
    } catch {
      alert('유효한 JSON 파일이 아니다.');
    }
  };
  reader.readAsText(file);
}

function resetAllData() {
  if (!confirm('정말 전체 데이터를 초기화할까?')) return;
  state = seedData();
  selectedGameId = state.games[0]?.id || null;
  currentPage = 'home';
  saveState();
  render();
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    setPage(btn.dataset.page);
  });
});

document.getElementById('quickAddBtn').addEventListener('click', openAddGameModal);
document.getElementById('fabBtn').addEventListener('click', () => {
  if (currentPage === 'detail' && selectedGameId) openAddAchievementModal(selectedGameId);
  else openAddGameModal();
});
document.getElementById('viewBtn').addEventListener('click', () => openDrawer('view'));
document.getElementById('filterBtn').addEventListener('click', () => openDrawer('filter'));
document.getElementById('sortBtn').addEventListener('click', () => openDrawer('sort'));
document.getElementById('drawerCloseBtn').addEventListener('click', closeDrawer);
document.getElementById('drawerBackdrop').addEventListener('click', closeDrawer);
document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
document.getElementById('modalBackdrop').addEventListener('click', closeModal);
document.getElementById('gameSearchInput').addEventListener('input', (e) => {
  state.ui.search = e.target.value;
  renderGames();
  renderAppliedChips();
  saveState();
});
document.getElementById('editGameBtn').addEventListener('click', () => selectedGameId && openEditGameModal(selectedGameId));
document.getElementById('addAchievementBtn').addEventListener('click', () => selectedGameId && openAddAchievementModal(selectedGameId));
window.setPage = setPage;
document.getElementById('exportBtn').addEventListener('click', exportJson);
document.getElementById('importInput').addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (file) importJson(file);
  e.target.value = '';
});
document.getElementById('resetBtn').addEventListener('click', resetAllData);

selectedGameId = state.games[0]?.id || null;
render();

window.openGame = openGame;
window.setAchievementFilter = setAchievementFilter;
window.toggleAchievement = toggleAchievement;
window.toggleAchievementOpen = toggleAchievementOpen;
window.saveAchievementNote = saveAchievementNote;
window.editAchievement = editAchievement;
window.deleteAchievement = deleteAchievement;
window.setGamesViewMode = setGamesViewMode;
window.applyFiltersFromDrawer = applyFiltersFromDrawer;
window.resetFilters = resetFilters;
window.setSort = setSort;
window.closeModal = closeModal;

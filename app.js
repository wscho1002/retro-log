const STORAGE_KEY = 'retroChallengeLogV2Visual';
const DIFFICULTIES = ['쉬움', '보통', '어려움', '극악'];
const STATUSES = ['예정', '플레이 중', '클리어', '올클 완료', '보류'];
const GENRES = ['액션', 'RPG', '어드벤처', '슈팅', '격투', '퍼즐', '시뮬레이션', '레이싱', '플랫포머', '공포', '기타'];
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

let currentPage = 'home';
let selectedGameId = null;
let currentAchievementFilter = 'all';
let state = normalizeState(loadState());
selectedGameId = state.games[0]?.id || null;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function seedData() {
  const now = new Date().toISOString();
  return {
    games: [
      {
        id: uid(),
        title: '슈퍼 마리오 브라더스',
        altTitle: 'スーパーマリオブラザーズ',
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
          { id: uid(), title: '1회 클리어', description: '엔딩 보기', difficulty: '쉬움', image: '', completed: true, completedAt: '2026-03-18', note: '초반 워프 사용', order: 1, updatedAt: now },
          { id: uid(), title: '워프 없이 클리어', description: '전 구간 정석 진행', difficulty: '보통', image: '', completed: false, completedAt: '', note: '', order: 2, updatedAt: now },
          { id: uid(), title: '노컨티뉴 클리어', description: '컨티뉴 없이 엔딩', difficulty: '어려움', image: '', completed: false, completedAt: '', note: '', order: 3, updatedAt: now }
        ]
      },
      {
        id: uid(),
        title: '바이오하자드',
        altTitle: 'バイオハザード',
        originalPlatform: 'PlayStation',
        playedPlatform: 'GameCube 실기',
        releaseDate: '1996-03-22',
        genre: '공포',
        status: '예정',
        coverImage: '',
        note: '원작 감성 위주로 천천히 진행.',
        createdAt: now,
        updatedAt: now,
        achievements: [
          { id: uid(), title: '1회 엔딩 보기', description: '아무 루트나 엔딩 보기', difficulty: '쉬움', image: '', completed: false, completedAt: '', note: '', order: 1, updatedAt: now },
          { id: uid(), title: '세이브 최소화', description: '세이브를 아껴서 클리어', difficulty: '어려움', image: '', completed: false, completedAt: '', note: '', order: 2, updatedAt: now }
        ]
      }
    ],
    ui: {
      gamesViewMode: 'all',
      filters: { status: '', originalPlatform: '', playedPlatform: '' },
      sort: 'releaseAsc',
      search: ''
    },
    meta: {
      lastSavedAt: '',
      lastBackupAt: ''
    }
  };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return seedData();
  try {
    return JSON.parse(raw);
  } catch {
    return seedData();
  }
}

function normalizeState(input) {
  const base = seedData();
  const out = {
    games: Array.isArray(input.games) ? input.games : base.games,
    ui: { ...base.ui, ...(input.ui || {}), filters: { ...base.ui.filters, ...((input.ui || {}).filters || {}) } },
    meta: { ...base.meta, ...(input.meta || {}) }
  };

  out.games = out.games.map(game => ({
    ...game,
    title: game.title || '이름 없는 게임',
    altTitle: game.altTitle || '',
    originalPlatform: game.originalPlatform || '기타',
    playedPlatform: game.playedPlatform || '기타',
    releaseDate: game.releaseDate || '',
    genre: game.genre || '기타',
    status: game.status || '예정',
    coverImage: game.coverImage || '',
    note: game.note || '',
    createdAt: game.createdAt || new Date().toISOString(),
    updatedAt: game.updatedAt || new Date().toISOString(),
    achievements: Array.isArray(game.achievements) ? game.achievements.map((ach, index) => ({
      ...ach,
      title: ach.title || '이름 없는 업적',
      description: ach.description || '',
      difficulty: ach.difficulty || '보통',
      image: ach.image || '',
      completed: !!ach.completed,
      completedAt: ach.completedAt || '',
      note: ach.note || '',
      order: Number.isFinite(Number(ach.order)) ? Number(ach.order) : index + 1,
      updatedAt: ach.updatedAt || new Date().toISOString()
    })) : []
  }));

  out.games.forEach(normalizeAchievementOrder);
  return out;
}

function saveState() {
  state.meta.lastSavedAt = new Date().toISOString();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error(error);
    alert('저장에 실패했다. 이미지가 너무 크거나 많아서 브라우저 저장공간이 부족할 수 있다. JSON 백업 후 이미지 크기를 줄여보자.');
  }
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateTime(dateString) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function yearOf(dateString = '') {
  return dateString ? String(dateString).slice(0, 4) : '-';
}

function gameProgress(game) {
  const total = game.achievements.length;
  const completed = game.achievements.filter(a => a.completed).length;
  return { total, completed, percent: total ? Math.round((completed / total) * 100) : 0 };
}

function overallStats() {
  const totalGames = state.games.length;
  const totalAchievements = state.games.reduce((sum, game) => sum + game.achievements.length, 0);
  const completedAchievements = state.games.reduce((sum, game) => sum + game.achievements.filter(a => a.completed).length, 0);
  const clearedGames = state.games.filter(g => ['클리어', '올클 완료'].includes(g.status)).length;
  const playingGames = state.games.filter(g => g.status === '플레이 중').length;
  return {
    totalGames,
    totalAchievements,
    completedAchievements,
    overallPercent: totalAchievements ? Math.round((completedAchievements / totalAchievements) * 100) : 0,
    clearedGames,
    playingGames
  };
}

function recentAchievementRecords(limit = 20) {
  return state.games.flatMap(game => game.achievements
    .filter(ach => ach.completed)
    .map(ach => ({
      gameId: game.id,
      gameTitle: game.title,
      title: ach.title,
      difficulty: ach.difficulty,
      completedAt: ach.completedAt,
      image: ach.image || '',
      gameCover: game.coverImage || ''
    })))
    .sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''))
    .slice(0, limit);
}

function recentlyUpdatedGames(limit = 10) {
  return [...state.games].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')).slice(0, limit);
}

function statusClass(status = '') {
  if (status === '플레이 중') return 'status-playing';
  if (status === '클리어') return 'status-cleared';
  if (status === '올클 완료') return 'status-master';
  if (status === '보류') return 'status-hold';
  return '';
}

function diffClass(difficulty = '') {
  return `diff-${difficulty}`;
}

function coverTheme(platform = '기타') {
  const map = {
    Famicom: ['#ff6b6b', '#6b8cff'],
    'Disk System': ['#ff6f61', '#ffbe5c'],
    'Super Famicom': ['#8d7bff', '#61c7ff'],
    'Nintendo 64': ['#ff8f5c', '#6be6a8'],
    'Game Boy': ['#8ce6ff', '#7d88ff'],
    'Game Boy Color': ['#66d1ff', '#c273ff'],
    'Game Boy Advance': ['#73c4ff', '#6d7cff'],
    PlayStation: ['#6b8cff', '#7fffe3'],
    Wii: ['#9ee7ff', '#7f8cff'],
    Switch: ['#ff5c7a', '#64d0ff'],
    Arcade: ['#ff9a5c', '#ffd166'],
    기타: ['#4b5b70', '#273140']
  };
  return map[platform] || map['기타'];
}

function achievementTheme(difficulty = '보통') {
  const map = {
    쉬움: ['#3abff8', '#0f5f9f'],
    보통: ['#59d98e', '#0e6a59'],
    어려움: ['#ffc857', '#b85f1d'],
    극악: ['#ff6b6b', '#8f1c4e']
  };
  return map[difficulty] || map['보통'];
}

function coverMarkup(game, variant = 'small') {
  if (game.coverImage) {
    return `<img src="${escapeHtml(game.coverImage)}" alt="${escapeHtml(game.title)}">`;
  }
  const [a, b] = coverTheme(game.originalPlatform);
  const cls = variant === 'detail' ? 'detail-cover-fallback' : 'cover-fallback';
  return `
    <div class="${cls}" style="--cover-a:${a}; --cover-b:${b};">
      <div class="cover-platform">${escapeHtml(game.originalPlatform)}</div>
      <div class="cover-title">${escapeHtml(game.title)}</div>
      <div class="cover-year">${escapeHtml(yearOf(game.releaseDate))}</div>
    </div>
  `;
}

function achievementImageMarkup(achievement, gameTitle = '') {
  if (achievement.image) {
    return `<img src="${escapeHtml(achievement.image)}" alt="${escapeHtml(achievement.title)}">`;
  }
  const [a, b] = achievementTheme(achievement.difficulty);
  const stateText = achievement.completed ? '달성 완료' : '미달성';
  return `
    <div class="achievement-fallback" style="--cover-a:${a}; --cover-b:${b};">
      <div class="achievement-difficulty">${escapeHtml(achievement.difficulty)}</div>
      <div class="achievement-fallback-title">${escapeHtml(achievement.title || gameTitle || '업적')}</div>
      <div class="achievement-status-text">${stateText}</div>
    </div>
  `;
}

function coverPreviewMarkup(gameLike = {}) {
  return coverMarkup({
    title: gameLike.title || '커버 미리보기',
    originalPlatform: gameLike.originalPlatform || '기타',
    releaseDate: gameLike.releaseDate || '',
    coverImage: gameLike.coverImage || ''
  }, 'detail');
}

function achievementPreviewMarkup(achLike = {}) {
  return achievementImageMarkup({
    title: achLike.title || '업적 미리보기',
    difficulty: achLike.difficulty || '보통',
    image: achLike.image || '',
    completed: false
  }, '업적');
}

function applyGameFilters(games) {
  const { search, filters, sort } = state.ui;
  let out = [...games];
  const q = search.trim().toLowerCase();
  if (q) {
    out = out.filter(game => [game.title, game.altTitle, game.originalPlatform, game.playedPlatform].join(' ').toLowerCase().includes(q));
  }
  if (filters.status) out = out.filter(g => g.status === filters.status);
  if (filters.originalPlatform) out = out.filter(g => g.originalPlatform === filters.originalPlatform);
  if (filters.playedPlatform) out = out.filter(g => g.playedPlatform === filters.playedPlatform);

  out.sort((a, b) => {
    switch (sort) {
      case 'releaseAsc': return (a.releaseDate || '').localeCompare(b.releaseDate || '');
      case 'releaseDesc': return (b.releaseDate || '').localeCompare(a.releaseDate || '');
      case 'titleAsc': return a.title.localeCompare(b.title, 'ko');
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
  renderDetail();
  renderRecords();
  renderSettings();
  syncNav();
  saveState();
}

function renderTopbar() {
  const titleMap = { home: '홈', games: '게임', detail: '게임 상세', records: '기록', settings: '설정' };
  document.getElementById('topTitle').textContent = titleMap[currentPage] || '홈';
  const fab = document.getElementById('fabBtn');
  if (currentPage === 'detail') {
    fab.textContent = '★';
    fab.style.display = 'grid';
  } else if (currentPage === 'games') {
    fab.textContent = '＋';
    fab.style.display = 'grid';
  } else {
    fab.style.display = 'none';
  }
}

function setPage(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  document.getElementById(`page-${page === 'detail' ? 'detail' : page}`).classList.add('active');
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
  document.getElementById('homeOverallPercent').textContent = `${stats.overallPercent}%`;
  document.getElementById('homeOverallText').textContent = `${stats.completedAchievements} / ${stats.totalAchievements} 달성`;
  document.getElementById('homeGameCount').textContent = `게임 ${stats.totalGames}개`;
  document.getElementById('homeOverallBar').style.width = `${stats.overallPercent}%`;
  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-box"><div class="stat-label">등록 게임</div><div class="stat-value">${stats.totalGames}</div></div>
    <div class="stat-box"><div class="stat-label">전체 업적</div><div class="stat-value">${stats.totalAchievements}</div></div>
    <div class="stat-box"><div class="stat-label">클리어 이상</div><div class="stat-value">${stats.clearedGames}</div></div>
    <div class="stat-box"><div class="stat-label">플레이 중</div><div class="stat-value">${stats.playingGames}</div></div>
  `;

  const recentAchievements = recentAchievementRecords(4);
  document.getElementById('homeRecentAchievements').innerHTML = recentAchievements.length
    ? recentAchievements.map(record => `
      <button class="media-card" onclick="openGame('${record.gameId}')">
        <div class="media-thumb achievement">${record.image ? `<img src="${escapeHtml(record.image)}" alt="${escapeHtml(record.title)}">` : (record.gameCover ? `<img src="${escapeHtml(record.gameCover)}" alt="${escapeHtml(record.gameTitle)}">` : achievementImageMarkup({ title: record.title, difficulty: record.difficulty, image: '', completed: true }, record.gameTitle))}</div>
        <div class="media-card-body">
          <h3 class="media-title">${escapeHtml(record.title)}</h3>
          <div class="media-subtitle">${escapeHtml(record.gameTitle)}</div>
          <div class="media-footer">
            <span class="badge ${diffClass(record.difficulty)}">${escapeHtml(record.difficulty)}</span>
            <span class="muted small">${formatDate(record.completedAt)}</span>
          </div>
        </div>
      </button>
    `).join('')
    : `<div class="empty">아직 달성한 업적이 없다.</div>`;

  const recentGames = recentlyUpdatedGames(4);
  document.getElementById('homeRecentGames').innerHTML = recentGames.length
    ? recentGames.map(game => {
      const prog = gameProgress(game);
      return `
        <button class="media-card" onclick="openGame('${game.id}')">
          <div class="media-thumb">${coverMarkup(game, 'detail')}</div>
          <div class="media-card-body">
            <h3 class="media-title">${escapeHtml(game.title)}</h3>
            <div class="media-subtitle">${escapeHtml(game.originalPlatform)} · ${yearOf(game.releaseDate)}</div>
            <div class="media-footer">
              <span class="badge ${statusClass(game.status)}">${escapeHtml(game.status)}</span>
              <span class="muted small">${prog.percent}%</span>
            </div>
          </div>
        </button>
      `;
    }).join('')
    : `<div class="empty">등록된 게임이 없다.</div>`;
}

function renderGameCard(game) {
  const prog = gameProgress(game);
  return `
    <button class="game-card" onclick="openGame('${game.id}')">
      <div class="cover">${coverMarkup(game, 'small')}</div>
      <div class="game-main">
        <div>
          <h3 class="game-title">${escapeHtml(game.title)}</h3>
          ${game.altTitle ? `<div class="subtitle">${escapeHtml(game.altTitle)}</div>` : ''}
        </div>
        <div class="meta-row">
          <span class="badge">원작 ${escapeHtml(game.originalPlatform)}</span>
          <span class="badge">플레이 ${escapeHtml(game.playedPlatform)}</span>
          <span class="badge ${statusClass(game.status)}">${escapeHtml(game.status)}</span>
          <span class="badge">${yearOf(game.releaseDate)}</span>
        </div>
        <div>
          <div class="space-between"><span class="muted small">${prog.completed} / ${prog.total} 달성</span><strong class="small">${prog.percent}%</strong></div>
          <div class="progress-bar"><div class="progress-fill" style="width:${prog.percent}%"></div></div>
        </div>
      </div>
    </button>
  `;
}

function renderGames() {
  document.getElementById('gameSearchInput').value = state.ui.search;
  renderAppliedChips();
  const games = applyGameFilters(state.games);
  const container = document.getElementById('gamesContainer');
  if (!games.length) {
    container.innerHTML = `<div class="empty">조건에 맞는 게임이 없다.</div>`;
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
          <strong>${escapeHtml(platform)}</strong>
          <span class="muted small">${list.length}개</span>
        </summary>
        <div class="platform-body">${list.map(renderGameCard).join('')}</div>
      </details>
    `).join('');
  } else {
    container.innerHTML = `<div class="game-grid">${games.map(renderGameCard).join('')}</div>`;
  }
}

function renderAppliedChips() {
  const chips = [state.ui.gamesViewMode === 'grouped' ? '기종별 보기' : '전체보기'];
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
  document.getElementById('appliedChips').innerHTML = chips.map(chip => `<span class="chip active">${escapeHtml(chip)}</span>`).join('');
}

function renderDetail() {
  const game = state.games.find(g => g.id === selectedGameId);
  if (!game) {
    document.getElementById('detailTitle').textContent = '게임을 선택해줘';
    document.getElementById('achievementList').innerHTML = `<div class="empty">게임이 없다.</div>`;
    return;
  }
  const prog = gameProgress(game);
  document.getElementById('detailCover').innerHTML = coverMarkup(game, 'detail');
  document.getElementById('detailTitle').textContent = game.title;
  document.getElementById('detailSubtitle').textContent = game.altTitle || '';
  document.getElementById('detailMeta').innerHTML = `
    <span class="badge">원작 ${escapeHtml(game.originalPlatform)}</span>
    <span class="badge">플레이 ${escapeHtml(game.playedPlatform)}</span>
    <span class="badge">${escapeHtml(game.genre)}</span>
    <span class="badge ${statusClass(game.status)}">${escapeHtml(game.status)}</span>
    <span class="badge">${formatDate(game.releaseDate)}</span>
  `;
  document.getElementById('detailProgressText').textContent = `${prog.percent}%`;
  document.getElementById('detailProgressCount').textContent = `${prog.completed} / ${prog.total} 달성`;
  document.getElementById('detailProgressBar').style.width = `${prog.percent}%`;
  document.getElementById('detailNote').textContent = game.note?.trim() ? game.note : '메모가 없습니다.';
  document.getElementById('achievementFilterSeg').innerHTML = ACH_FILTERS.map(filter => `
    <button class="seg-btn ${currentAchievementFilter === filter.key ? 'active' : ''}" onclick="setAchievementFilter('${filter.key}')">${filter.label}</button>
  `).join('');

  let achievements = [...game.achievements].sort((a, b) => a.order - b.order);
  if (currentAchievementFilter === 'pending') achievements = achievements.filter(a => !a.completed);
  if (currentAchievementFilter === 'done') achievements = achievements.filter(a => a.completed);
  if (currentAchievementFilter === 'hard') achievements = achievements.filter(a => ['어려움', '극악'].includes(a.difficulty));

  document.getElementById('achievementList').innerHTML = achievements.length
    ? achievements.map(achievement => renderAchievementCard(game.id, game.title, achievement)).join('')
    : `<div class="empty">조건에 맞는 업적이 없다.</div>`;
}

function renderAchievementCard(gameId, gameTitle, achievement) {
  return `
    <div class="achievement-card ${achievement.completed ? 'is-complete' : ''}" id="ach-${achievement.id}">
      <div class="achievement-main">
        <button class="check-btn ${achievement.completed ? 'done' : ''}" onclick="toggleAchievement('${gameId}','${achievement.id}'); event.stopPropagation();">✓</button>
        <div class="achievement-art">${achievementImageMarkup(achievement, gameTitle)}</div>
        <button class="achievement-text-button" onclick="toggleAchievementOpen('${achievement.id}')">
          <h4 class="achievement-title">${escapeHtml(achievement.title)}</h4>
          <div class="muted small" style="margin-top:4px;">${achievement.completed ? `${formatDate(achievement.completedAt)} 달성` : '탭해서 세부 정보 보기'}</div>
        </button>
        <span class="badge ${diffClass(achievement.difficulty)}">${escapeHtml(achievement.difficulty)}</span>
      </div>
      <div class="achievement-extra">
        <div>${achievement.description ? escapeHtml(achievement.description) : '<span class="muted">설명이 없다.</span>'}</div>
        <div class="achievement-meta-grid">
          <div class="achievement-art-preview">${achievementImageMarkup(achievement, gameTitle)}</div>
          <div class="list-col" style="gap:10px;">
            <div class="meta-row">
              ${achievement.completed ? `<span class="badge">달성 ${formatDate(achievement.completedAt)}</span>` : `<span class="badge">미달성</span>`}
              <span class="badge ${diffClass(achievement.difficulty)}">${escapeHtml(achievement.difficulty)}</span>
            </div>
            <div class="field">
              <label>메모</label>
              <textarea class="textarea" onchange="saveAchievementNote('${gameId}','${achievement.id}', this.value)">${escapeHtml(achievement.note || '')}</textarea>
            </div>
          </div>
        </div>
        <div class="inline-actions">
          <button class="btn ghost" onclick="editAchievement('${gameId}','${achievement.id}')">업적 수정</button>
          <button class="btn ghost" onclick="moveAchievement('${gameId}','${achievement.id}', -1)">위로</button>
          <button class="btn ghost" onclick="moveAchievement('${gameId}','${achievement.id}', 1)">아래로</button>
          <button class="btn danger" onclick="deleteAchievement('${gameId}','${achievement.id}')">업적 삭제</button>
        </div>
      </div>
    </div>
  `;
}

function renderRecords() {
  const records = recentAchievementRecords(200);
  document.getElementById('recordsCount').textContent = `${records.length}개`;
  document.getElementById('recordsList').innerHTML = records.length ? records.map(record => `
    <button class="item-card" onclick="openGame('${record.gameId}')">
      <div class="achievement-main" style="grid-template-columns: 78px 1fr auto;">
        <div class="achievement-art" style="width:78px; height:78px;">${record.image ? `<img src="${escapeHtml(record.image)}" alt="${escapeHtml(record.title)}">` : achievementImageMarkup({ title: record.title, difficulty: record.difficulty, image: '', completed: true }, record.gameTitle)}</div>
        <div>
          <strong>${escapeHtml(record.title)}</strong>
          <div class="muted small" style="margin-top:4px;">${escapeHtml(record.gameTitle)}</div>
        </div>
        <div style="text-align:right;">
          <div class="badge ${diffClass(record.difficulty)}">${escapeHtml(record.difficulty)}</div>
          <div class="muted small" style="margin-top:6px;">${formatDate(record.completedAt)}</div>
        </div>
      </div>
    </button>
  `).join('') : `<div class="empty">아직 달성 기록이 없다.</div>`;
}

function renderSettings() {
  document.getElementById('lastSavedAt').textContent = formatDateTime(state.meta.lastSavedAt);
  document.getElementById('lastBackupAt').textContent = state.meta.lastBackupAt ? formatDateTime(state.meta.lastBackupAt) : '아직 백업 없음';
}

function openDrawer(type) {
  const title = document.getElementById('drawerTitle');
  const content = document.getElementById('drawerContent');
  if (type === 'view') {
    title.textContent = '보기';
    content.innerHTML = `
      <div class="form-grid">
        <button class="btn ${state.ui.gamesViewMode === 'all' ? 'primary' : 'ghost'}" onclick="setGamesViewMode('all')">전체보기</button>
        <button class="btn ${state.ui.gamesViewMode === 'grouped' ? 'primary' : 'ghost'}" onclick="setGamesViewMode('grouped')">기종별 보기</button>
      </div>
    `;
  }
  if (type === 'filter') {
    title.textContent = '필터';
    content.innerHTML = `
      <div class="form-grid">
        <div class="field">
          <label>상태</label>
          <select class="select" id="filterStatus">
            <option value="">전체</option>
            ${STATUSES.map(value => `<option value="${value}" ${state.ui.filters.status === value ? 'selected' : ''}>${value}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>원작 기종</label>
          <select class="select" id="filterOriginal">
            <option value="">전체</option>
            ${ORIGINAL_PLATFORMS.map(value => `<option value="${value}" ${state.ui.filters.originalPlatform === value ? 'selected' : ''}>${value}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>플레이 기종</label>
          <select class="select" id="filterPlayed">
            <option value="">전체</option>
            ${PLAYED_PLATFORMS.map(value => `<option value="${value}" ${state.ui.filters.playedPlatform === value ? 'selected' : ''}>${value}</option>`).join('')}
          </select>
        </div>
        <div class="form-actions">
          <button type="button" class="btn ghost" onclick="resetFilters()">초기화</button>
          <button type="button" class="btn primary" onclick="applyFiltersFromDrawer()">적용</button>
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
    content.innerHTML = `<div class="form-grid">${options.map(([value, label]) => `<button class="btn ${state.ui.sort === value ? 'primary' : 'ghost'}" onclick="setSort('${value}')">${label}</button>`).join('')}</div>`;
  }
  document.getElementById('drawerBackdrop').classList.add('open');
  document.getElementById('optionDrawer').classList.add('open');
}

function closeDrawer() {
  document.getElementById('drawerBackdrop').classList.remove('open');
  document.getElementById('optionDrawer').classList.remove('open');
}

function openModal(config) {
  document.getElementById('modalTitle').textContent = config.title;
  const form = document.getElementById('modalForm');
  form.innerHTML = config.html;
  form.onsubmit = config.onSubmit;
  document.getElementById('modalBackdrop').classList.add('open');
  document.getElementById('formModal').classList.add('open');
  if (typeof config.onOpen === 'function') config.onOpen(form);
}

function closeModal() {
  document.getElementById('modalBackdrop').classList.remove('open');
  document.getElementById('formModal').classList.remove('open');
  document.getElementById('modalForm').innerHTML = '';
  document.getElementById('modalForm').onsubmit = null;
}

function gameFormHtml(game = {}) {
  return `
    <div class="form-grid">
      <div class="field">
        <label>대표 제목 (한국어 표기)</label>
        <input class="input" name="title" required value="${escapeHtml(game.title || '')}" placeholder="예: 바이오하자드" />
      </div>
      <div class="field">
        <label>원제 / 보조 제목</label>
        <input class="input" name="altTitle" value="${escapeHtml(game.altTitle || '')}" placeholder="예: バイオハザード" />
      </div>
      <div class="form-two">
        <div class="field">
          <label>원작 기종</label>
          <select class="select" name="originalPlatform" required>
            ${ORIGINAL_PLATFORMS.map(value => `<option value="${value}" ${(game.originalPlatform || ORIGINAL_PLATFORMS[0]) === value ? 'selected' : ''}>${value}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>플레이 기종</label>
          <select class="select" name="playedPlatform" required>
            ${PLAYED_PLATFORMS.map(value => `<option value="${value}" ${(game.playedPlatform || PLAYED_PLATFORMS[0]) === value ? 'selected' : ''}>${value}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-two">
        <div class="field">
          <label>일본 첫 발매일</label>
          <input class="input" type="date" name="releaseDate" value="${escapeHtml(game.releaseDate || '')}" />
        </div>
        <div class="field">
          <label>상태</label>
          <select class="select" name="status">
            ${STATUSES.map(value => `<option value="${value}" ${(game.status || '예정') === value ? 'selected' : ''}>${value}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="field">
        <label>장르</label>
        <select class="select" name="genre">
          ${GENRES.map(value => `<option value="${value}" ${(game.genre || '액션') === value ? 'selected' : ''}>${value}</option>`).join('')}
        </select>
      </div>
      <div class="preview-grid">
        <div class="field">
          <label>커버 이미지 URL</label>
          <input class="input" name="coverImageUrl" value="${escapeHtml(game.coverImage || '')}" placeholder="https://... 또는 비워두기" />
          <div class="field-help">파일을 고르면 파일 이미지가 URL보다 우선된다.</div>
        </div>
        <div class="field">
          <label>커버 이미지 파일 업로드</label>
          <input class="input" type="file" name="coverImageFile" accept="image/*" />
          <label class="field-help"><input type="checkbox" name="removeCoverImage"> 커버 이미지를 제거하고 기본 카드 사용</label>
        </div>
      </div>
      <div class="field">
        <label>커버 미리보기</label>
        <div class="cover-preview" id="coverPreviewArea">${coverPreviewMarkup(game)}</div>
      </div>
      <div class="field">
        <label>메모</label>
        <textarea class="textarea" name="note">${escapeHtml(game.note || '')}</textarea>
      </div>
    </div>
    <div class="form-actions">
      <button type="button" class="btn ghost" onclick="closeModal()">취소</button>
      <button type="submit" class="btn primary">저장</button>
    </div>
  `;
}

function achievementFormHtml(game, achievement = {}) {
  return `
    <div class="form-grid">
      <div class="item-box"><strong>${escapeHtml(game.title)}</strong></div>
      <div class="field">
        <label>업적 이름</label>
        <input class="input" name="title" required value="${escapeHtml(achievement.title || '')}" placeholder="예: 노컨티뉴 클리어" />
      </div>
      <div class="field">
        <label>설명</label>
        <textarea class="textarea" name="description">${escapeHtml(achievement.description || '')}</textarea>
      </div>
      <div class="form-two">
        <div class="field">
          <label>난이도</label>
          <select class="select" name="difficulty">
            ${DIFFICULTIES.map(value => `<option value="${value}" ${(achievement.difficulty || '보통') === value ? 'selected' : ''}>${value}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>정렬 순서</label>
          <input class="input" type="number" name="order" min="1" value="${achievement.order || (game.achievements.length + 1)}" />
        </div>
      </div>
      <div class="preview-grid">
        <div class="field">
          <label>업적 이미지 URL</label>
          <input class="input" name="achievementImageUrl" value="${escapeHtml(achievement.image || '')}" placeholder="https://... 또는 비워두기" />
          <div class="field-help">스팀 도전과제처럼 업적마다 이미지를 따로 쓸 수 있다.</div>
        </div>
        <div class="field">
          <label>업적 이미지 파일 업로드</label>
          <input class="input" type="file" name="achievementImageFile" accept="image/*" />
          <label class="field-help"><input type="checkbox" name="removeAchievementImage"> 업적 이미지를 제거하고 기본 카드 사용</label>
        </div>
      </div>
      <div class="field">
        <label>업적 이미지 미리보기</label>
        <div class="achievement-art-preview" id="achievementPreviewArea">${achievementPreviewMarkup(achievement)}</div>
      </div>
      <div class="field">
        <label>메모</label>
        <textarea class="textarea" name="note">${escapeHtml(achievement.note || '')}</textarea>
      </div>
    </div>
    <div class="form-actions">
      <button type="button" class="btn ghost" onclick="closeModal()">취소</button>
      <button type="submit" class="btn primary">저장</button>
    </div>
  `;
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('file-read-error'));
    reader.readAsDataURL(file);
  });
}

function initGameFormPreview(form, game = {}) {
  const title = form.elements.title;
  const originalPlatform = form.elements.originalPlatform;
  const releaseDate = form.elements.releaseDate;
  const urlInput = form.elements.coverImageUrl;
  const fileInput = form.elements.coverImageFile;
  const removeInput = form.elements.removeCoverImage;
  const previewArea = form.querySelector('#coverPreviewArea');
  let uploadedImageData = '';

  const renderPreview = () => {
    const remove = removeInput.checked;
    const image = remove ? '' : (uploadedImageData || String(urlInput.value || '').trim() || game.coverImage || '');
    previewArea.innerHTML = coverPreviewMarkup({
      title: title.value || '커버 미리보기',
      originalPlatform: originalPlatform.value || '기타',
      releaseDate: releaseDate.value || '',
      coverImage: image
    });
  };

  [title, originalPlatform, releaseDate, urlInput, removeInput].forEach(el => {
    el.addEventListener('input', renderPreview);
    el.addEventListener('change', renderPreview);
  });

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) {
      uploadedImageData = '';
      renderPreview();
      return;
    }
    uploadedImageData = await readFileAsDataURL(file);
    removeInput.checked = false;
    renderPreview();
  });

  form._getResolvedCoverImage = async () => {
    if (removeInput.checked) return '';
    const file = fileInput.files?.[0];
    if (file) return readFileAsDataURL(file);
    return String(urlInput.value || '').trim();
  };

  renderPreview();
}

function initAchievementFormPreview(form, achievement = {}) {
  const title = form.elements.title;
  const difficulty = form.elements.difficulty;
  const urlInput = form.elements.achievementImageUrl;
  const fileInput = form.elements.achievementImageFile;
  const removeInput = form.elements.removeAchievementImage;
  const previewArea = form.querySelector('#achievementPreviewArea');
  let uploadedImageData = '';

  const renderPreview = () => {
    const remove = removeInput.checked;
    const image = remove ? '' : (uploadedImageData || String(urlInput.value || '').trim() || achievement.image || '');
    previewArea.innerHTML = achievementPreviewMarkup({
      title: title.value || '업적 미리보기',
      difficulty: difficulty.value || '보통',
      image
    });
  };

  [title, difficulty, urlInput, removeInput].forEach(el => {
    el.addEventListener('input', renderPreview);
    el.addEventListener('change', renderPreview);
  });

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) {
      uploadedImageData = '';
      renderPreview();
      return;
    }
    uploadedImageData = await readFileAsDataURL(file);
    removeInput.checked = false;
    renderPreview();
  });

  form._getResolvedAchievementImage = async () => {
    if (removeInput.checked) return '';
    const file = fileInput.files?.[0];
    if (file) return readFileAsDataURL(file);
    return String(urlInput.value || '').trim();
  };

  renderPreview();
}

function openAddGameModal() {
  openModal({
    title: '게임 추가',
    html: gameFormHtml(),
    onOpen: form => initGameFormPreview(form),
    onSubmit: async (event) => {
      event.preventDefault();
      const fd = new FormData(event.target);
      const now = new Date().toISOString();
      const newGame = {
        id: uid(),
        title: String(fd.get('title')).trim(),
        altTitle: String(fd.get('altTitle')).trim(),
        originalPlatform: String(fd.get('originalPlatform')),
        playedPlatform: String(fd.get('playedPlatform')),
        releaseDate: String(fd.get('releaseDate')),
        genre: String(fd.get('genre')),
        status: String(fd.get('status')),
        coverImage: await event.target._getResolvedCoverImage(),
        note: String(fd.get('note')).trim(),
        createdAt: now,
        updatedAt: now,
        achievements: []
      };
      state.games.unshift(newGame);
      selectedGameId = newGame.id;
      closeModal();
      render();
      setPage('detail');
    }
  });
}

function openEditGameModal(gameId) {
  const game = state.games.find(item => item.id === gameId);
  if (!game) return;
  openModal({
    title: '게임 수정',
    html: gameFormHtml(game),
    onOpen: form => initGameFormPreview(form, game),
    onSubmit: async (event) => {
      event.preventDefault();
      const fd = new FormData(event.target);
      game.title = String(fd.get('title')).trim();
      game.altTitle = String(fd.get('altTitle')).trim();
      game.originalPlatform = String(fd.get('originalPlatform'));
      game.playedPlatform = String(fd.get('playedPlatform'));
      game.releaseDate = String(fd.get('releaseDate'));
      game.genre = String(fd.get('genre'));
      game.status = String(fd.get('status'));
      game.coverImage = await event.target._getResolvedCoverImage();
      game.note = String(fd.get('note')).trim();
      game.updatedAt = new Date().toISOString();
      closeModal();
      render();
    }
  });
}

function openAddAchievementModal(gameId) {
  const game = state.games.find(item => item.id === gameId);
  if (!game) return;
  openModal({
    title: '업적 추가',
    html: achievementFormHtml(game),
    onOpen: form => initAchievementFormPreview(form),
    onSubmit: async (event) => {
      event.preventDefault();
      const fd = new FormData(event.target);
      game.achievements.push({
        id: uid(),
        title: String(fd.get('title')).trim(),
        description: String(fd.get('description')).trim(),
        difficulty: String(fd.get('difficulty')),
        image: await event.target._getResolvedAchievementImage(),
        completed: false,
        completedAt: '',
        note: String(fd.get('note')).trim(),
        order: Number(fd.get('order')) || game.achievements.length + 1,
        updatedAt: new Date().toISOString()
      });
      normalizeAchievementOrder(game);
      game.updatedAt = new Date().toISOString();
      closeModal();
      render();
      setPage('detail');
    }
  });
}

function editAchievement(gameId, achievementId) {
  const game = state.games.find(item => item.id === gameId);
  const achievement = game?.achievements.find(item => item.id === achievementId);
  if (!game || !achievement) return;
  openModal({
    title: '업적 수정',
    html: achievementFormHtml(game, achievement),
    onOpen: form => initAchievementFormPreview(form, achievement),
    onSubmit: async (event) => {
      event.preventDefault();
      const fd = new FormData(event.target);
      achievement.title = String(fd.get('title')).trim();
      achievement.description = String(fd.get('description')).trim();
      achievement.difficulty = String(fd.get('difficulty'));
      achievement.image = await event.target._getResolvedAchievementImage();
      achievement.note = String(fd.get('note')).trim();
      achievement.order = Number(fd.get('order')) || achievement.order;
      achievement.updatedAt = new Date().toISOString();
      normalizeAchievementOrder(game);
      game.updatedAt = new Date().toISOString();
      closeModal();
      render();
    }
  });
}

function normalizeAchievementOrder(game) {
  game.achievements.sort((a, b) => a.order - b.order).forEach((achievement, index) => {
    achievement.order = index + 1;
  });
}

function moveAchievement(gameId, achievementId, direction) {
  const game = state.games.find(item => item.id === gameId);
  if (!game) return;
  const list = [...game.achievements].sort((a, b) => a.order - b.order);
  const index = list.findIndex(item => item.id === achievementId);
  const targetIndex = index + direction;
  if (index < 0 || targetIndex < 0 || targetIndex >= list.length) return;
  [list[index], list[targetIndex]] = [list[targetIndex], list[index]];
  list.forEach((item, idx) => { item.order = idx + 1; });
  game.achievements = list;
  game.updatedAt = new Date().toISOString();
  render();
}

function deleteAchievement(gameId, achievementId) {
  const game = state.games.find(item => item.id === gameId);
  if (!game) return;
  if (!confirm('이 업적을 삭제할까?')) return;
  game.achievements = game.achievements.filter(item => item.id !== achievementId);
  normalizeAchievementOrder(game);
  game.updatedAt = new Date().toISOString();
  render();
}

function deleteGame(gameId) {
  const game = state.games.find(item => item.id === gameId);
  if (!game) return;
  if (!confirm(`'${game.title}' 게임을 삭제할까?`)) return;
  state.games = state.games.filter(item => item.id !== gameId);
  selectedGameId = state.games[0]?.id || null;
  setPage('games');
  render();
}

function toggleAchievement(gameId, achievementId) {
  const game = state.games.find(item => item.id === gameId);
  const achievement = game?.achievements.find(item => item.id === achievementId);
  if (!game || !achievement) return;
  achievement.completed = !achievement.completed;
  achievement.completedAt = achievement.completed ? new Date().toISOString().slice(0, 10) : '';
  achievement.updatedAt = new Date().toISOString();
  game.updatedAt = new Date().toISOString();
  render();
  setPage('detail');
}

function saveAchievementNote(gameId, achievementId, value) {
  const game = state.games.find(item => item.id === gameId);
  const achievement = game?.achievements.find(item => item.id === achievementId);
  if (!game || !achievement) return;
  achievement.note = value;
  achievement.updatedAt = new Date().toISOString();
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
  state.meta.lastBackupAt = new Date().toISOString();
  saveState();
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `retro-challenge-log-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  renderSettings();
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = normalizeState(JSON.parse(String(reader.result || '{}')));
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
  state = normalizeState(seedData());
  selectedGameId = state.games[0]?.id || null;
  currentPage = 'home';
  render();
}

function bindEvents() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => setPage(btn.dataset.page));
  });
  document.getElementById('quickAddBtn').addEventListener('click', openAddGameModal);
  document.getElementById('backupTopBtn').addEventListener('click', exportJson);
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
  document.getElementById('gameSearchInput').addEventListener('input', event => {
    state.ui.search = event.target.value;
    renderGames();
    renderAppliedChips();
    saveState();
  });
  document.getElementById('backToGamesBtn').addEventListener('click', () => setPage('games'));
  document.getElementById('editGameBtn').addEventListener('click', () => selectedGameId && openEditGameModal(selectedGameId));
  document.getElementById('deleteGameBtn').addEventListener('click', () => selectedGameId && deleteGame(selectedGameId));
  document.getElementById('addAchievementBtn').addEventListener('click', () => selectedGameId && openAddAchievementModal(selectedGameId));
  document.getElementById('exportBtn').addEventListener('click', exportJson);
  document.getElementById('importInput').addEventListener('change', event => {
    const file = event.target.files?.[0];
    if (file) importJson(file);
    event.target.value = '';
  });
  document.getElementById('resetBtn').addEventListener('click', resetAllData);
}

bindEvents();
render();

window.openGame = openGame;
window.setAchievementFilter = setAchievementFilter;
window.toggleAchievement = toggleAchievement;
window.toggleAchievementOpen = toggleAchievementOpen;
window.saveAchievementNote = saveAchievementNote;
window.editAchievement = editAchievement;
window.deleteAchievement = deleteAchievement;
window.moveAchievement = moveAchievement;
window.setGamesViewMode = setGamesViewMode;
window.applyFiltersFromDrawer = applyFiltersFromDrawer;
window.resetFilters = resetFilters;
window.setSort = setSort;
window.closeModal = closeModal;
window.deleteGame = deleteGame;

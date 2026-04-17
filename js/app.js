import { initCalendar, renderCalendar, renderDayView } from './calendar.js';
import { renderEntryForm } from './entry-form.js';
import { renderEntryDetail } from './entry-detail.js';
import { renderStats } from './stats.js';
import { renderSettings } from './settings.js';
import { getSetting } from './db.js';
import { todayString } from './utils.js';
import { getUser, onAuthChange, renderAuth } from './auth.js';
import { renderCover } from './cover.js';
import { renderLanding } from './landing.js';
import { renderQuickLog } from './quick-log.js';

const app = document.getElementById('app');
const fab = document.getElementById('fab');
const headerEl = document.getElementById('header');
const headerBack = document.getElementById('header-back');
const headerTitle = document.getElementById('header-title');
const headerAction = document.getElementById('header-action');
const tabBar = document.getElementById('tab-bar');
const tabs = document.querySelectorAll('.tab');

let currentRoute = '';
let currentDayContext = null;
let isAuthed = false;
let coverDismissed = !!sessionStorage.getItem('cover_seen');
let welcomeShown = !!localStorage.getItem('welcome_seen');

export function navigate(route) {
  window.location.hash = route;
}

function setHeader(title, showBack = false, action = null) {
  headerTitle.textContent = title;
  headerBack.classList.toggle('hidden', !showBack);
  if (action) {
    headerAction.innerHTML = action.label;
    headerAction.classList.remove('hidden');
    headerAction.onclick = action.handler;
  } else {
    headerAction.classList.add('hidden');
    headerAction.onclick = null;
  }
}

function setActiveTab(tabName) {
  tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
}

function setFullscreen() {
  headerEl.style.display = 'none';
  tabBar.style.display = 'none';
  fab.classList.add('hidden');
  app.style.top = '0';
  app.style.bottom = '0';
  app.style.padding = '0';
  app.style.overflow = 'hidden';
}

function setAuthScreen() {
  headerEl.style.display = 'none';
  tabBar.style.display = 'none';
  fab.classList.add('hidden');
  app.style.top = '0';
  app.style.bottom = '0';
  app.style.padding = '16px';
  app.style.overflow = 'auto';
}

function setAppScreen() {
  headerEl.style.display = '';
  tabBar.style.display = '';
  fab.classList.add('hidden');
  app.style.top = '';
  app.style.bottom = '';
  app.style.padding = '';
  app.style.overflow = '';
}

async function route() {
  // Step 1: Cover page (pre-auth, every session)
  if (!coverDismissed) {
    setFullscreen();
    renderCover(app, () => {
      coverDismissed = true;
      sessionStorage.setItem('cover_seen', '1');
      route();
    });
    return;
  }

  // Step 2: Auth screen
  if (!isAuthed) {
    setAuthScreen();
    renderAuth(app, () => {});
    return;
  }

  // Step 3: Welcome intro (post-auth, first time only)
  if (!welcomeShown) {
    setFullscreen();
    renderLanding(app, () => {
      welcomeShown = true;
      localStorage.setItem('welcome_seen', '1');
      route();
    });
    return;
  }

  // Step 4: Main app
  setAppScreen();

  const hash = window.location.hash.slice(1) || 'log';
  currentRoute = hash;
  app.innerHTML = '';

  if (hash === 'log') {
    setHeader('Daily Log');
    setActiveTab('log');
    fab.classList.add('hidden');
    await renderQuickLog(app);

  } else if (hash === 'calendar') {
    setHeader('Calendar');
    setActiveTab('calendar');
    fab.classList.remove('hidden');
    fab.onclick = () => navigate(`new/${todayString()}`);
    await renderCalendar(app);

  } else if (hash.startsWith('day/')) {
    const dateStr = hash.split('/')[1];
    currentDayContext = dateStr;
    setHeader('Day View', true);
    setActiveTab('calendar');
    fab.classList.remove('hidden');
    fab.onclick = () => navigate(`new/${dateStr}`);
    await renderDayView(app, dateStr);

  } else if (hash.startsWith('new/')) {
    const dateStr = hash.split('/')[1] || todayString();
    currentDayContext = dateStr;
    setHeader('New Entry', true);
    setActiveTab('calendar');
    fab.classList.add('hidden');
    await renderEntryForm(app, null, dateStr);

  } else if (hash.startsWith('entry/') && hash.endsWith('/edit')) {
    const id = hash.split('/')[1];
    setHeader('Edit Entry', true);
    setActiveTab('calendar');
    fab.classList.add('hidden');
    await renderEntryForm(app, id);

  } else if (hash.startsWith('entry/')) {
    const id = hash.split('/')[1];
    setHeader('Entry', true, {
      label: '&#9998;',
      handler: () => navigate(`entry/${id}/edit`)
    });
    setActiveTab('calendar');
    fab.classList.add('hidden');
    await renderEntryDetail(app, id);

  } else if (hash === 'stats') {
    setHeader('Stats');
    setActiveTab('stats');
    fab.classList.add('hidden');
    await renderStats(app);

  } else if (hash === 'settings') {
    setHeader('Settings');
    setActiveTab('settings');
    fab.classList.add('hidden');
    await renderSettings(app);

  } else {
    navigate('log');
  }
}

headerBack.addEventListener('click', () => {
  if (currentRoute.startsWith('entry/') && currentRoute.endsWith('/edit')) {
    const id = currentRoute.split('/')[1];
    navigate(`entry/${id}`);
  } else if (currentRoute.startsWith('entry/') || currentRoute.startsWith('new/')) {
    if (currentDayContext) {
      navigate(`day/${currentDayContext}`);
    } else {
      navigate('log');
    }
  } else {
    navigate('log');
  }
});

tabs.forEach(tab => {
  tab.addEventListener('click', () => navigate(tab.dataset.tab));
});

async function init() {
  const theme = await getSetting('theme');
  if (theme) document.documentElement.setAttribute('data-theme', theme);
  initCalendar();

  const user = await getUser();
  isAuthed = !!user;

  onAuthChange((user) => {
    isAuthed = !!user;
    route();
  });

  window.addEventListener('hashchange', route);
  route();
}

init();

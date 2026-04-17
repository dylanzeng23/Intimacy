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
import { t } from './i18n.js';

const app = document.getElementById('app');
const fab = document.getElementById('fab');
const headerEl = document.getElementById('header');
const headerBack = document.getElementById('header-back');
const headerTitle = document.getElementById('header-title');
const headerAction = document.getElementById('header-action');
const tabBar = document.getElementById('tab-bar');
const tabs = document.querySelectorAll('.tab');

let currentRoute = '', currentDayContext = null, isAuthed = false;
let coverDismissed = false; // always show cover on page load
let welcomeShown = !!localStorage.getItem('welcome_seen');

export function navigate(route) { window.location.hash = route; }

function setHeader(title, showBack = false, action = null) {
  headerTitle.textContent = title;
  headerBack.classList.toggle('hidden', !showBack);
  if (action) { headerAction.innerHTML = action.label; headerAction.classList.remove('hidden'); headerAction.onclick = action.handler; }
  else { headerAction.classList.add('hidden'); headerAction.onclick = null; }
}

function setActiveTab(name) { tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name)); }

function setFullscreen() {
  headerEl.style.display = 'none'; tabBar.style.display = 'none'; fab.classList.add('hidden');
  app.style.top = '0'; app.style.bottom = '0'; app.style.padding = '0'; app.style.overflow = 'hidden';
}
function setAuthScreen() {
  headerEl.style.display = 'none'; tabBar.style.display = 'none'; fab.classList.add('hidden');
  app.style.top = '0'; app.style.bottom = '0'; app.style.padding = '16px'; app.style.overflow = 'auto';
}
function setAppScreen() {
  headerEl.style.display = ''; tabBar.style.display = ''; fab.classList.add('hidden');
  app.style.top = ''; app.style.bottom = ''; app.style.padding = ''; app.style.overflow = '';
}

// Update tab labels with i18n
function updateTabLabels() {
  tabs.forEach(tab => {
    const key = { calendar: 'navCalendar', log: 'navLog', stats: 'navStats', settings: 'navSettings' }[tab.dataset.tab];
    if (key) tab.querySelector('.tab-label').textContent = t(key);
  });
}

async function route() {
  if (!coverDismissed) {
    setFullscreen();
    renderCover(app, () => { coverDismissed = true; route(); });
    return;
  }
  if (!isAuthed) { setAuthScreen(); renderAuth(app, () => {}); return; }
  if (!welcomeShown) {
    setFullscreen();
    renderLanding(app, () => { welcomeShown = true; localStorage.setItem('welcome_seen', '1'); route(); });
    return;
  }

  setAppScreen();
  updateTabLabels();
  const hash = window.location.hash.slice(1) || 'log';
  currentRoute = hash;
  app.innerHTML = '';

  if (hash === 'log') {
    setHeader(t('navDailyLog')); setActiveTab('log'); await renderQuickLog(app);
  } else if (hash === 'calendar') {
    setHeader(t('calendarTitle')); setActiveTab('calendar');
    fab.classList.remove('hidden'); fab.onclick = () => navigate(`new/${todayString()}`);
    await renderCalendar(app);
  } else if (hash.startsWith('day/')) {
    const d = hash.split('/')[1]; currentDayContext = d;
    setHeader(t('navDayView'), true); setActiveTab('calendar');
    fab.classList.remove('hidden'); fab.onclick = () => navigate(`new/${d}`);
    await renderDayView(app, d);
  } else if (hash.startsWith('new/')) {
    const d = hash.split('/')[1] || todayString(); currentDayContext = d;
    setHeader(t('navNewEntry'), true); setActiveTab('log');
    await renderQuickLog(app, d);
  } else if (hash.startsWith('entry/') && hash.endsWith('/edit')) {
    const id = hash.split('/')[1];
    setHeader(t('navEditEntry'), true); setActiveTab('calendar');
    await renderEntryForm(app, id);
  } else if (hash.startsWith('entry/')) {
    const id = hash.split('/')[1];
    setHeader(t('navEntry'), true, { label: '&#9998;', handler: () => navigate(`entry/${id}/edit`) });
    setActiveTab('calendar');
    await renderEntryDetail(app, id);
  } else if (hash === 'stats') {
    setHeader(t('navStats')); setActiveTab('stats'); await renderStats(app);
  } else if (hash === 'settings') {
    setHeader(t('navSettings')); setActiveTab('settings'); await renderSettings(app);
  } else { navigate('log'); }
}

headerBack.addEventListener('click', () => {
  if (currentRoute.startsWith('entry/') && currentRoute.endsWith('/edit')) navigate(`entry/${currentRoute.split('/')[1]}`);
  else if (currentRoute.startsWith('entry/') || currentRoute.startsWith('new/')) navigate(currentDayContext ? `day/${currentDayContext}` : 'log');
  else navigate('log');
});

tabs.forEach(tab => tab.addEventListener('click', () => navigate(tab.dataset.tab)));

async function init() {
  const theme = await getSetting('theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
  initCalendar();
  const user = await getUser();
  isAuthed = !!user;
  onAuthChange((user) => { isAuthed = !!user; route(); });
  window.addEventListener('hashchange', route);
  route();
}

init();

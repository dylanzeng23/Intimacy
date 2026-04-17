import { getDaysInMonth, getFirstDayOfMonth, todayString, formatTime12h, TYPE_COLORS } from './utils.js';
import { getEntriesByDateRange, getEntriesByDate } from './db.js';
import { navigate } from './app.js';
import { t, getTypeLabel, getLang } from './i18n.js';

const MONTH_NAMES_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_NAMES_CN = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];

let startYear, startMonth;
const MONTHS_TO_SHOW = 6;

export function initCalendar() {
  const now = new Date();
  startYear = now.getFullYear();
  startMonth = now.getMonth();
}

function monthName(m) { return (getLang() === 'cn' ? MONTH_NAMES_CN : MONTH_NAMES_EN)[m]; }
function dayNames() {
  return [t('daySun'),t('dayMon'),t('dayTue'),t('dayWed'),t('dayThu'),t('dayFri'),t('daySat')];
}

function getCellClass(entries) {
  if (!entries || entries.length === 0) return '';
  const types = new Set(entries.map(e => e.type));
  if (types.size > 1) return 'has-mixed';
  if (types.has('partner')) return 'has-partner';
  if (types.has('solo')) return 'has-solo';
  return 'has-other';
}

export async function renderCalendar(container) {
  const today = todayString();
  let ey = startYear, em = startMonth + MONTHS_TO_SHOW - 1;
  while (em > 11) { em -= 12; ey++; }
  const startDate = `${startYear}-${String(startMonth+1).padStart(2,'0')}-01`;
  const endDate = `${ey}-${String(em+1).padStart(2,'0')}-${String(getDaysInMonth(ey,em)).padStart(2,'0')}`;
  const entries = await getEntriesByDateRange(startDate, endDate);
  const entryMap = {};
  for (const e of entries) { if (!entryMap[e.date]) entryMap[e.date] = []; entryMap[e.date].push(e); }

  let html = `<div class="multi-calendar-nav"><button class="calendar-nav" id="cal-prev">&#8249;</button><button class="calendar-nav" id="cal-next">&#8250;</button></div><div class="multi-calendar-grid">`;
  let y = startYear, m = startMonth;
  for (let i = 0; i < MONTHS_TO_SHOW; i++) {
    const dims = getDaysInMonth(y, m), fd = getFirstDayOfMonth(y, m), ms = String(m+1).padStart(2,'0');
    html += `<div class="mini-month"><div class="mini-month-title">${monthName(m)} ${y}</div><div class="mini-days-header">${dayNames().map(d=>`<div class="mini-day-name">${d}</div>`).join('')}</div><div class="mini-grid">`;
    for (let j = 0; j < fd; j++) html += `<div class="mini-cell empty"></div>`;
    for (let day = 1; day <= dims; day++) {
      const ds = `${y}-${ms}-${String(day).padStart(2,'0')}`;
      const dayEntries = entryMap[ds] || [];
      const cls = getCellClass(dayEntries);
      const dots = dayEntries.length > 0 ? `<span class="mini-dots">${dayEntries.slice(0,4).map(e => `<span class="mini-dot" style="background:${TYPE_COLORS[e.type]||TYPE_COLORS.other}"></span>`).join('')}</span>` : '';
      html += `<button class="mini-cell${ds===today?' today':''} ${cls}" data-date="${ds}">${day}${dots}</button>`;
    }
    const rem = (fd+dims)%7; for (let j = 0; j < (rem?7-rem:0); j++) html += `<div class="mini-cell empty"></div>`;
    html += `</div></div>`;
    m++; if (m > 11) { m = 0; y++; }
  }
  html += `</div><div class="calendar-legend"><div class="legend-item"><div class="legend-dot" style="background:var(--partner)"></div>${t('calPartner')}</div><div class="legend-item"><div class="legend-dot" style="background:var(--solo)"></div>${t('calSolo')}</div><div class="legend-item"><div class="legend-dot" style="background:var(--other)"></div>${t('calOther')}</div></div>`;
  container.innerHTML = html;
  document.getElementById('cal-prev').addEventListener('click', () => { startMonth -= MONTHS_TO_SHOW; while (startMonth < 0) { startMonth += 12; startYear--; } renderCalendar(container); });
  document.getElementById('cal-next').addEventListener('click', () => { startMonth += MONTHS_TO_SHOW; while (startMonth > 11) { startMonth -= 12; startYear++; } renderCalendar(container); });
  container.querySelectorAll('.mini-cell[data-date]').forEach(cell => cell.addEventListener('click', () => navigate(`day/${cell.dataset.date}`)));
}

export async function renderDayView(container, dateStr) {
  const entries = await getEntriesByDate(dateStr);
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m-1, d);
  const dayName = getLang() === 'cn' ? `${m}月${d}日` : dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  let html = `<div class="day-header"><h2>${dayName}</h2></div>`;
  if (entries.length === 0) {
    html += `<div class="day-empty"><p>${t('dayNoEntries')}</p><p>${t('dayTapAdd')}</p></div>`;
  } else {
    for (const entry of entries.sort((a,b) => a.time.localeCompare(b.time))) {
      const color = TYPE_COLORS[entry.type] || TYPE_COLORS.other;
      const meta = [getTypeLabel(entry.type)];
      if (entry.notes) meta.push(entry.notes.substring(0, 50));
      html += `<div class="entry-card" data-id="${entry.id}"><div class="entry-type-dot" style="background:${color}"></div><div class="entry-card-info"><div class="entry-card-time">${formatTime12h(entry.time)}</div><div class="entry-card-meta">${meta.join(' · ')}</div></div><div class="entry-card-arrow">&#8250;</div></div>`;
    }
  }
  container.innerHTML = html;
  container.querySelectorAll('.entry-card').forEach(card => card.addEventListener('click', () => navigate(`entry/${card.dataset.id}`)));
}

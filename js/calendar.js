import { getMonthName, getDayNames, getDaysInMonth, getFirstDayOfMonth, todayString, formatTime12h, TYPE_COLORS, TYPE_LABELS } from './utils.js';
import { getEntriesByDateRange, getEntriesByDate } from './db.js';
import { navigate } from './app.js';

let startYear, startMonth;
const MONTHS_TO_SHOW = 6;

export function initCalendar() {
  const now = new Date();
  startYear = now.getFullYear();
  startMonth = now.getMonth();
}

function getCellClass(entries) {
  if (!entries || entries.length === 0) return '';
  const types = new Set(entries.map(e => e.type));
  if (types.size > 1) return 'has-mixed';
  if (types.has('partner')) return 'has-partner';
  if (types.has('solo')) return 'has-solo';
  return 'has-other';
}

function getMonthRange(year, month, count) {
  let sy = year, sm = month;
  let ey = year, em = month + count - 1;
  while (em > 11) { em -= 12; ey++; }
  const startDate = `${sy}-${String(sm + 1).padStart(2, '0')}-01`;
  const lastDay = getDaysInMonth(ey, em);
  const endDate = `${ey}-${String(em + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
}

function renderSingleMonth(year, month, entryMap, today) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const dayNames = getDayNames();
  const monthStr = String(month + 1).padStart(2, '0');

  let html = `<div class="mini-month">`;
  html += `<div class="mini-month-title">${getMonthName(month)} ${year}</div>`;
  html += `<div class="mini-days-header">`;
  for (const d of dayNames) {
    html += `<div class="mini-day-name">${d[0]}</div>`;
  }
  html += `</div><div class="mini-grid">`;

  for (let i = 0; i < firstDay; i++) {
    html += `<div class="mini-cell empty"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${monthStr}-${String(day).padStart(2, '0')}`;
    const isToday = dateStr === today;
    const dayEntries = entryMap[dateStr] || [];
    const cellClass = getCellClass(dayEntries);

    html += `<button class="mini-cell${isToday ? ' today' : ''} ${cellClass}" data-date="${dateStr}">${day}</button>`;
  }

  const totalCells = firstDay + daysInMonth;
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 0; i < remaining; i++) {
    html += `<div class="mini-cell empty"></div>`;
  }

  html += `</div></div>`;
  return html;
}

export async function renderCalendar(container) {
  const today = todayString();
  const { startDate, endDate } = getMonthRange(startYear, startMonth, MONTHS_TO_SHOW);
  const entries = await getEntriesByDateRange(startDate, endDate);

  const entryMap = {};
  for (const e of entries) {
    if (!entryMap[e.date]) entryMap[e.date] = [];
    entryMap[e.date].push(e);
  }

  let html = `
    <div class="multi-calendar-nav">
      <button class="calendar-nav" id="cal-prev">&#8249;</button>
      <button class="calendar-nav" id="cal-next">&#8250;</button>
    </div>
    <div class="multi-calendar-grid">
  `;

  let y = startYear, m = startMonth;
  for (let i = 0; i < MONTHS_TO_SHOW; i++) {
    html += renderSingleMonth(y, m, entryMap, today);
    m++;
    if (m > 11) { m = 0; y++; }
  }

  html += `</div>`;

  html += `
    <div class="calendar-legend">
      <div class="legend-item"><div class="legend-dot" style="background:var(--partner)"></div>Partner</div>
      <div class="legend-item"><div class="legend-dot" style="background:var(--solo)"></div>Solo</div>
      <div class="legend-item"><div class="legend-dot" style="background:var(--other)"></div>Other</div>
    </div>
  `;

  container.innerHTML = html;

  document.getElementById('cal-prev').addEventListener('click', () => {
    startMonth -= MONTHS_TO_SHOW;
    while (startMonth < 0) { startMonth += 12; startYear--; }
    renderCalendar(container);
  });

  document.getElementById('cal-next').addEventListener('click', () => {
    startMonth += MONTHS_TO_SHOW;
    while (startMonth > 11) { startMonth -= 12; startYear++; }
    renderCalendar(container);
  });

  container.querySelectorAll('.mini-cell[data-date]').forEach(cell => {
    cell.addEventListener('click', () => {
      navigate(`day/${cell.dataset.date}`);
    });
  });
}

export async function renderDayView(container, dateStr) {
  const entries = await getEntriesByDate(dateStr);
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const monthName = getMonthName(m - 1);

  let html = `
    <div class="day-header">
      <h2>${dayName}, ${monthName} ${d}</h2>
    </div>
  `;

  if (entries.length === 0) {
    html += `<div class="day-empty"><p>No entries for this day</p><p>Tap + to add one</p></div>`;
  } else {
    for (const entry of entries.sort((a, b) => a.time.localeCompare(b.time))) {
      const color = TYPE_COLORS[entry.type] || TYPE_COLORS.other;
      const label = TYPE_LABELS[entry.type] || entry.type;
      const meta = [label];
      if (entry.notes) meta.push(entry.notes.substring(0, 50));

      html += `
        <div class="entry-card" data-id="${entry.id}">
          <div class="entry-type-dot" style="background:${color}"></div>
          <div class="entry-card-info">
            <div class="entry-card-time">${formatTime12h(entry.time)}</div>
            <div class="entry-card-meta">${meta.join(' · ')}</div>
          </div>
          <div class="entry-card-arrow">&#8250;</div>
        </div>
      `;
    }
  }

  container.innerHTML = html;

  container.querySelectorAll('.entry-card').forEach(card => {
    card.addEventListener('click', () => {
      navigate(`entry/${card.dataset.id}`);
    });
  });
}

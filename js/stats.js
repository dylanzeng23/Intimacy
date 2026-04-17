import { getAllEntries } from './db.js';
import { TYPE_COLORS, getTimeOfDay, todayString } from './utils.js';
import { t, getTypeLabel } from './i18n.js';

export async function renderStats(container) {
  const entries = await getAllEntries();
  if (entries.length === 0) {
    container.innerHTML = `<div class="stats-empty"><div style="font-size:48px">&#128202;</div><p>${t('statsNoData')}</p><p>${t('statsAddFirst')}</p></div>`;
    return;
  }
  const today = todayString(), now = new Date();
  const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth()+1).padStart(2,'0')}-${String(weekAgo.getDate()).padStart(2,'0')}`;
  const monthStart = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
  const thisWeek = entries.filter(e => e.date >= weekAgoStr && e.date <= today).length;
  const thisMonth = entries.filter(e => e.date >= monthStart && e.date <= today).length;

  const typeCounts = {};
  for (const e of entries) typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
  const maxTC = Math.max(...Object.values(typeCounts), 1);

  const timeBuckets = { [t('statsMorning')]: 0, [t('statsAfternoon')]: 0, [t('statsEvening')]: 0, [t('statsNight')]: 0 };
  const todMap = { Morning: t('statsMorning'), Afternoon: t('statsAfternoon'), Evening: t('statsEvening'), Night: t('statsNight') };
  for (const e of entries) if (e.time) timeBuckets[todMap[getTimeOfDay(e.time)]]++;
  const maxTB = Math.max(...Object.values(timeBuckets), 1);

  const dates = [...new Set(entries.map(e => e.date))].sort().reverse();
  let currentStreak = 0;
  const todayDate = new Date(today + 'T00:00:00');
  for (let i = 0; i < dates.length; i++) {
    const exp = new Date(todayDate); exp.setDate(exp.getDate() - i);
    const es = `${exp.getFullYear()}-${String(exp.getMonth()+1).padStart(2,'0')}-${String(exp.getDate()).padStart(2,'0')}`;
    if (dates[i] === es) currentStreak++; else break;
  }
  const sorted = [...dates].sort(); let longest = 1, tmp = 1;
  for (let i = 1; i < sorted.length; i++) {
    if ((new Date(sorted[i]+'T00:00:00') - new Date(sorted[i-1]+'T00:00:00')) / 86400000 === 1) { tmp++; longest = Math.max(longest, tmp); } else tmp = 1;
  }

  const moodEntries = entries.filter(e => e.mood);
  const avgMood = moodEntries.length > 0 ? (moodEntries.reduce((s,e) => s + e.mood, 0) / moodEntries.length).toFixed(1) : null;
  const ds = currentStreak !== 1 ? t('statsDays') : t('statsDay');
  const ls = longest !== 1 ? t('statsDays') : t('statsDay');

  let html = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
      <div class="stat-card"><h3>${t('statsThisWeek')}</h3><div class="stat-number">${thisWeek}</div></div>
      <div class="stat-card"><h3>${t('statsThisMonth')}</h3><div class="stat-number">${thisMonth}</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
      <div class="stat-card"><h3>${t('statsCurrentStreak')}</h3><div class="stat-number">${currentStreak}</div><div class="stat-sub">${ds}</div></div>
      <div class="stat-card"><h3>${t('statsLongestStreak')}</h3><div class="stat-number">${longest}</div><div class="stat-sub">${ls}</div></div>
    </div>
    <div class="stat-card"><h3>${t('statsTotal')}</h3><div class="stat-number">${entries.length}</div><div class="stat-sub">${t('statsAllTime')}</div></div>`;
  if (avgMood) html += `<div class="stat-card" style="margin-top:10px"><h3>${t('statsAvgMood')}</h3><div class="stat-number">${avgMood}<span style="font-size:16px;color:var(--text-dim)"> / 5</span></div></div>`;
  html += `<div class="stat-card" style="margin-top:10px"><h3>${t('statsByType')}</h3>${Object.entries(typeCounts).map(([tp,c]) => `<div class="stat-row"><span class="stat-bar-label">${getTypeLabel(tp)}</span><div class="stat-bar-track"><div class="stat-bar-fill" style="width:${(c/maxTC)*100}%;background:${TYPE_COLORS[tp]||'#888'}"></div></div><span class="stat-bar-count">${c}</span></div>`).join('')}</div>`;
  html += `<div class="stat-card" style="margin-top:10px"><h3>${t('statsTimeOfDay')}</h3>${Object.entries(timeBuckets).map(([p,c]) => `<div class="stat-row"><span class="stat-bar-label">${p}</span><div class="stat-bar-track"><div class="stat-bar-fill" style="width:${(c/maxTB)*100}%;background:var(--accent)"></div></div><span class="stat-bar-count">${c}</span></div>`).join('')}</div>`;
  container.innerHTML = html;
}

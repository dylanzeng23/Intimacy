import { addEntry, getAllEntries } from './db.js';
import { todayString, nowTimeString, TYPE_COLORS, MOOD_EMOJIS, toDateString } from './utils.js';
import { navigate } from './app.js';
import { t, getTypeLabel } from './i18n.js';

const GREETINGS_EN = [
  "Feeling frisky?", "How was it?", "Another one?", "Spill the tea.",
  "What happened?", "Good times?", "Go on...", "Been busy?",
  "Score!", "Again already?", "Don't be shy.", "Post-nut clarity?",
  "Memorable?", "Worth noting?", "Nice.",
];
const GREETINGS_CN = [
  "又来了？", "今天如何？", "记一下吧", "怎么样？",
  "有好事？", "来吧", "说说看", "忙着呢？",
  "得手了？", "值得记录？", "别害羞", "贤者时间？",
  "难忘吗？", "精彩吗？", "不错嘛",
];

import { getLang } from './i18n.js';

function pickGreeting() {
  const list = getLang() === 'cn' ? GREETINGS_CN : GREETINGS_EN;
  return list[Math.floor(Math.random() * list.length)];
}

function getTimeOfDayFromHour(h) {
  if (h < 6) return 'night';
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'night';
}

async function computeStreaks() {
  const entries = await getAllEntries();
  if (entries.length === 0) return { current: 0, longest: 0, noNut: 0 };
  const dates = [...new Set(entries.map(e => e.date))].sort();
  const today = todayString();
  const todayDate = new Date(today + 'T00:00:00');
  let currentStreak = 0;
  for (let i = 0; i <= dates.length; i++) {
    const expected = new Date(todayDate);
    expected.setDate(expected.getDate() - i);
    if (dates.includes(toDateString(expected))) currentStreak++;
    else break;
  }
  let longestStreak = 1, temp = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = (new Date(dates[i] + 'T00:00:00') - new Date(dates[i-1] + 'T00:00:00')) / 86400000;
    if (diff === 1) { temp++; longestStreak = Math.max(longestStreak, temp); } else temp = 1;
  }
  const lastDate = new Date(dates[dates.length - 1] + 'T00:00:00');
  const noNut = Math.floor((todayDate - lastDate) / 86400000);
  return { current: currentStreak, longest: longestStreak, noNut };
}

export async function renderQuickLog(container, presetDate = null) {
  const date = presetDate || todayString();
  const currentHour = new Date().getHours();
  const currentPeriod = getTimeOfDayFromHour(currentHour);
  const greeting = pickGreeting();
  const streaks = await computeStreaks();
  const types = [['partner', TYPE_COLORS.partner], ['solo', TYPE_COLORS.solo], ['other', TYPE_COLORS.other]];

  container.innerHTML = `
    <div class="qlog">
      <div class="qlog-greeting">${greeting}</div>
      <div class="qlog-sub">${t('logSub')}</div>
      <div class="streak-bar">
        <div class="streak-item">
          <div class="streak-icon">${streaks.current > 0 ? '&#128293;' : '&#10052;&#65039;'}</div>
          <div class="streak-info"><div class="streak-count">${streaks.current}</div><div class="streak-label">${t('logDayStreak')}</div></div>
        </div>
        <div class="streak-divider"></div>
        <div class="streak-item">
          <div class="streak-icon">&#127942;</div>
          <div class="streak-info"><div class="streak-count">${streaks.longest}</div><div class="streak-label">${t('logBestStreak')}</div></div>
        </div>
        <div class="streak-divider"></div>
        <div class="streak-item">
          <div class="streak-icon">${streaks.noNut > 0 ? '&#128170;' : '&#128064;'}</div>
          <div class="streak-info"><div class="streak-count">${streaks.noNut}</div><div class="streak-label">${streaks.noNut > 0 ? t('logNoNut') : t('logToday')}</div></div>
        </div>
      </div>
      <form id="qlog-form" class="qlog-form">
        <div class="qlog-section">
          <div class="form-label">${t('logType')}</div>
          <div class="qlog-types" id="f-type">
            ${types.map(([key, color]) => `<button type="button" class="qlog-type-btn${key === 'solo' ? ' active' : ''}" data-type="${key}"><span class="qlog-type-dot" style="background:${color}"></span>${getTypeLabel(key)}</button>`).join('')}
          </div>
        </div>
        <div class="qlog-section">
          <div class="form-label">${t('logDate')}</div>
          <input type="date" class="form-input" id="f-date" value="${date}">
        </div>
        <div class="qlog-section">
          <div class="form-label">${t('logWhen')}</div>
          <div class="qlog-time-periods" id="f-period">
            <button type="button" class="qlog-period-btn${currentPeriod === 'morning' ? ' active' : ''}" data-period="morning"><span class="qlog-period-icon">&#9728;&#65039;</span><span>${t('logMorning')}</span></button>
            <button type="button" class="qlog-period-btn${currentPeriod === 'afternoon' ? ' active' : ''}" data-period="afternoon"><span class="qlog-period-icon">&#9925;</span><span>${t('logAfternoon')}</span></button>
            <button type="button" class="qlog-period-btn${currentPeriod === 'night' ? ' active' : ''}" data-period="night"><span class="qlog-period-icon">&#127769;</span><span>${t('logNight')}</span></button>
          </div>
          <div class="qlog-exact-time">
            <label class="qlog-exact-toggle" id="exact-toggle"><span>${t('logExactTime')}</span><span class="qlog-toggle-arrow" id="toggle-arrow">&#9662;</span></label>
            <input type="time" class="form-input qlog-time-input hidden" id="f-time" value="${nowTimeString()}">
          </div>
        </div>
        <div class="qlog-section">
          <div class="form-label">${t('logMood')}</div>
          <div class="qlog-moods" id="f-mood">
            ${[1,2,3,4,5].map(i => `<button type="button" class="qlog-mood-btn" data-mood="${i}">${MOOD_EMOJIS[i]}</button>`).join('')}
          </div>
        </div>
        <div class="qlog-section">
          <div class="form-label">${t('logDuration')}</div>
          <input type="number" class="form-input qlog-duration" id="f-duration" placeholder="${t('logDurationPlaceholder')}" min="0" inputmode="numeric">
        </div>
        <div class="qlog-section">
          <div class="form-label">${t('logNotes')}</div>
          <textarea class="form-input qlog-notes" id="f-notes" placeholder="${t('logNotesPlaceholder')}"></textarea>
        </div>
        <button type="submit" class="btn btn-primary qlog-submit">${t('logSubmit')}</button>
      </form>
    </div>
  `;

  let selectedPeriod = currentPeriod, useExactTime = false, selectedType = 'solo', selectedMood = 0;
  const periodToTime = { morning: '09:00', afternoon: '14:00', night: '22:00' };

  container.querySelectorAll('.qlog-period-btn').forEach(btn => btn.addEventListener('click', () => {
    container.querySelectorAll('.qlog-period-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); selectedPeriod = btn.dataset.period;
  }));
  document.getElementById('exact-toggle').addEventListener('click', () => {
    useExactTime = !useExactTime;
    document.getElementById('f-time').classList.toggle('hidden', !useExactTime);
    document.getElementById('toggle-arrow').innerHTML = useExactTime ? '&#9652;' : '&#9662;';
  });
  container.querySelectorAll('.qlog-type-btn').forEach(btn => btn.addEventListener('click', () => {
    container.querySelectorAll('.qlog-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); selectedType = btn.dataset.type;
  }));
  container.querySelectorAll('.qlog-mood-btn').forEach(btn => btn.addEventListener('click', () => {
    const val = parseInt(btn.dataset.mood);
    if (val === selectedMood) { selectedMood = 0; btn.classList.remove('active'); }
    else { container.querySelectorAll('.qlog-mood-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); selectedMood = val; }
  }));
  document.getElementById('qlog-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      date: document.getElementById('f-date').value,
      time: useExactTime ? document.getElementById('f-time').value : periodToTime[selectedPeriod],
      type: selectedType,
      duration: document.getElementById('f-duration').value ? parseInt(document.getElementById('f-duration').value) : null,
      mood: selectedMood || null,
      notes: document.getElementById('f-notes').value.trim(),
    };
    await addEntry(data);
    navigate(`day/${data.date}`);
  });
}

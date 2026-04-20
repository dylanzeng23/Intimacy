import { addEntry, getAllEntries } from './db.js';
import { todayString, nowTimeString, SEX_TYPE_COLORS, DRINK_TYPE_COLORS, MOOD_EMOJIS, toDateString } from './utils.js';
import { navigate } from './app.js';
import { t, getTypeLabel, getLang } from './i18n.js';

const GREETINGS_EN = ["Feeling frisky?","How was it?","Another one?","Spill the tea.","What happened?","Good times?","Go on...","Been busy?","Score!","Again already?","Don't be shy.","Post-nut clarity?","Memorable?","Worth noting?","Nice."];
const GREETINGS_CN = ["又来了？","今天如何？","记一下吧","怎么样？","有好事？","来吧","说说看","忙着呢？","得手了？","值得记录？","别害羞","贤者时间？","难忘吗？","精彩吗？","不错嘛"];

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
  const sexEntries = entries.filter(e => (e.category || 'sex') === 'sex');
  const drinkEntries = entries.filter(e => e.category === 'drink');
  if (sexEntries.length === 0 && drinkEntries.length === 0) return { current: 0, longest: 0, noNut: 0, drinksWeek: 0 };
  const today = todayString();
  const todayDate = new Date(today + 'T00:00:00');
  const dates = [...new Set(sexEntries.map(e => e.date))].sort();
  let currentStreak = 0;
  for (let i = 0; i <= dates.length; i++) {
    const exp = new Date(todayDate); exp.setDate(exp.getDate() - i);
    if (dates.includes(toDateString(exp))) currentStreak++; else break;
  }
  let longest = 1, tmp = 1;
  if (dates.length > 0) {
    for (let i = 1; i < dates.length; i++) {
      if ((new Date(dates[i]+'T00:00:00') - new Date(dates[i-1]+'T00:00:00')) / 86400000 === 1) { tmp++; longest = Math.max(longest, tmp); } else tmp = 1;
    }
  } else { longest = 0; }
  const lastSex = dates.length > 0 ? dates[dates.length - 1] : null;
  const noNut = lastSex ? Math.floor((todayDate - new Date(lastSex + 'T00:00:00')) / 86400000) : 999;
  const weekAgo = new Date(todayDate); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = toDateString(weekAgo);
  const drinksWeek = drinkEntries.filter(e => e.date >= weekAgoStr && e.date <= today).length;
  return { current: currentStreak, longest, noNut, drinksWeek };
}

const DRINK_TYPES = [
  ['beer', '🍺', DRINK_TYPE_COLORS.beer],
  ['wine', '🍷', DRINK_TYPE_COLORS.wine],
  ['spirits', '🥃', DRINK_TYPE_COLORS.spirits],
  ['cocktail', '🍸', DRINK_TYPE_COLORS.cocktail],
];

const SEX_TYPES = [
  ['partner', SEX_TYPE_COLORS.partner],
  ['solo', SEX_TYPE_COLORS.solo],
  ['other', SEX_TYPE_COLORS.other],
];

export async function renderQuickLog(container, presetDate = null) {
  const date = presetDate || todayString();
  const currentHour = new Date().getHours();
  const currentPeriod = getTimeOfDayFromHour(currentHour);
  const greeting = pickGreeting();
  const streaks = await computeStreaks();

  container.innerHTML = `
    <div class="qlog">
      <div class="qlog-greeting">${greeting}</div>
      <div class="qlog-sub">${t('logSub')}</div>
      <div class="streak-bar">
        <div class="streak-item"><div class="streak-icon">${streaks.current > 0 ? '🔥' : '❄️'}</div><div class="streak-info"><div class="streak-count">${streaks.current}</div><div class="streak-label">${t('logDayStreak')}</div></div></div>
        <div class="streak-divider"></div>
        <div class="streak-item"><div class="streak-icon">🏆</div><div class="streak-info"><div class="streak-count">${streaks.longest}</div><div class="streak-label">${t('logBestStreak')}</div></div></div>
        <div class="streak-divider"></div>
        <div class="streak-item"><div class="streak-icon">💪</div><div class="streak-info"><div class="streak-count">${streaks.noNut}</div><div class="streak-label">${t('logNoNut')}</div></div></div>
        <div class="streak-divider"></div>
        <div class="streak-item"><div class="streak-icon">🍷</div><div class="streak-info"><div class="streak-count">${streaks.drinksWeek}</div><div class="streak-label">${t('statsDrinkWeek')}</div></div></div>
      </div>

      <form id="qlog-form" class="qlog-form">
        <div class="qlog-section">
          <div class="qlog-cat-toggle">
            <button type="button" class="qlog-cat-btn active" data-cat="sex">🔥 ${t('catSex')}</button>
            <button type="button" class="qlog-cat-btn" data-cat="drink">🍷 ${t('catDrink')}</button>
          </div>
        </div>

        <div class="qlog-section">
          <div class="form-label">${t('logType')}</div>
          <div class="qlog-types" id="f-type">
            ${SEX_TYPES.map(([key, color]) => `<button type="button" class="qlog-type-btn active-cat-sex${key === 'solo' ? ' active' : ''}" data-type="${key}" data-cat="sex"><span class="qlog-type-dot" style="background:${color}"></span>${getTypeLabel(key)}</button>`).join('')}
            ${DRINK_TYPES.map(([key, emoji, color]) => `<button type="button" class="qlog-type-btn active-cat-drink hidden${key === 'beer' ? ' active' : ''}" data-type="${key}" data-cat="drink"><span>${emoji}</span>${getTypeLabel(key)}</button>`).join('')}
          </div>
        </div>

        <div class="qlog-section"><div class="form-label">${t('logDate')}</div><input type="date" class="form-input" id="f-date" value="${date}"></div>

        <div class="qlog-section">
          <div class="form-label">${t('logWhen')}</div>
          <div class="qlog-time-periods" id="f-period">
            <button type="button" class="qlog-period-btn${currentPeriod === 'morning' ? ' active' : ''}" data-period="morning"><span class="qlog-period-icon">☀️</span><span>${t('logMorning')}</span></button>
            <button type="button" class="qlog-period-btn${currentPeriod === 'afternoon' ? ' active' : ''}" data-period="afternoon"><span class="qlog-period-icon">⛅</span><span>${t('logAfternoon')}</span></button>
            <button type="button" class="qlog-period-btn${currentPeriod === 'night' ? ' active' : ''}" data-period="night"><span class="qlog-period-icon">🌙</span><span>${t('logNight')}</span></button>
          </div>
          <div class="qlog-exact-time"><label class="qlog-exact-toggle" id="exact-toggle"><span>${t('logExactTime')}</span><span class="qlog-toggle-arrow" id="toggle-arrow">▾</span></label><input type="time" class="form-input qlog-time-input hidden" id="f-time" value="${nowTimeString()}"></div>
        </div>

        <div class="qlog-section"><div class="form-label">${t('logMood')}</div><div class="qlog-moods" id="f-mood">${[1,2,3,4,5].map(i => `<button type="button" class="qlog-mood-btn" data-mood="${i}">${MOOD_EMOJIS[i]}</button>`).join('')}</div></div>
        <div class="qlog-section"><div class="form-label">${t('logDuration')}</div><input type="number" class="form-input qlog-duration" id="f-duration" placeholder="${t('logDurationPlaceholder')}" min="0" inputmode="numeric"></div>
        <div class="qlog-section"><div class="form-label">${t('logNotes')}</div><textarea class="form-input qlog-notes" id="f-notes" placeholder="${t('logNotesPlaceholder')}"></textarea></div>
        <button type="submit" class="btn btn-primary qlog-submit">${t('logSubmit')}</button>
      </form>
    </div>
  `;

  let selectedCat = 'sex', selectedType = 'solo', selectedPeriod = currentPeriod, useExactTime = false, selectedMood = 0;
  const periodToTime = { morning: '09:00', afternoon: '14:00', night: '22:00' };

  // Category toggle
  container.querySelectorAll('.qlog-cat-btn').forEach(btn => btn.addEventListener('click', () => {
    container.querySelectorAll('.qlog-cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedCat = btn.dataset.cat;
    // Show/hide type buttons
    container.querySelectorAll('.active-cat-sex').forEach(b => b.classList.toggle('hidden', selectedCat !== 'sex'));
    container.querySelectorAll('.active-cat-drink').forEach(b => b.classList.toggle('hidden', selectedCat !== 'drink'));
    // Reset type selection
    selectedType = selectedCat === 'sex' ? 'solo' : 'beer';
    container.querySelectorAll(`.qlog-type-btn[data-cat="${selectedCat}"]`).forEach((b, i) => b.classList.toggle('active', i === (selectedCat === 'sex' ? 1 : 0)));
  }));

  // Time period
  container.querySelectorAll('.qlog-period-btn').forEach(btn => btn.addEventListener('click', () => {
    container.querySelectorAll('.qlog-period-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); selectedPeriod = btn.dataset.period;
  }));
  document.getElementById('exact-toggle').addEventListener('click', () => {
    useExactTime = !useExactTime;
    document.getElementById('f-time').classList.toggle('hidden', !useExactTime);
    document.getElementById('toggle-arrow').textContent = useExactTime ? '▴' : '▾';
  });

  // Type
  container.querySelectorAll('.qlog-type-btn').forEach(btn => btn.addEventListener('click', () => {
    const cat = btn.dataset.cat;
    container.querySelectorAll(`.qlog-type-btn[data-cat="${cat}"]`).forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); selectedType = btn.dataset.type;
  }));

  // Mood
  container.querySelectorAll('.qlog-mood-btn').forEach(btn => btn.addEventListener('click', () => {
    const val = parseInt(btn.dataset.mood);
    if (val === selectedMood) { selectedMood = 0; btn.classList.remove('active'); }
    else { container.querySelectorAll('.qlog-mood-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); selectedMood = val; }
  }));

  // Submit
  document.getElementById('qlog-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      category: selectedCat,
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

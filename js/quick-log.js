import { addEntry, getAllEntries } from './db.js';
import { todayString, nowTimeString, SEX_TYPE_COLORS, MOOD_EMOJIS, toDateString } from './utils.js';
import { navigate } from './app.js';
import { t, getTypeLabel, getLang } from './i18n.js';

const GREETINGS_EN = ["Feeling frisky?","How was it?","Another one?","Spill the tea.","What happened?","Good times?","Go on...","Been busy?","Score!","Again already?","Don't be shy.","Post-nut clarity?","Memorable?","Worth noting?","Nice."];
const GREETINGS_CN = ["又来了？","今天如何？","记一下吧","怎么样？","有好事？","来吧","说说看","忙着呢？","得手了？","值得记录？","别害羞","贤者时间？","难忘吗？","精彩吗？","不错嘛"];
const DRINK_GREETINGS_EN = ["Cheers!","Another round?","Bottoms up!","How many?","Thirsty?","Party time?","Happy hour?","One more?","Drink up!"];
const DRINK_GREETINGS_CN = ["干杯！","又喝了？","来一杯？","喝了多少？","渴了？","派对时间？","happy hour?","再来一杯？","续杯！"];

function pickGreeting(cat) {
  const list = cat === 'drink'
    ? (getLang() === 'cn' ? DRINK_GREETINGS_CN : DRINK_GREETINGS_EN)
    : (getLang() === 'cn' ? GREETINGS_CN : GREETINGS_EN);
  return list[Math.floor(Math.random() * list.length)];
}

function getTimeOfDayFromHour(h) {
  if (h < 6) return 'night'; if (h < 12) return 'morning'; if (h < 18) return 'afternoon'; return 'night';
}

async function computeStreaks() {
  const entries = await getAllEntries();
  const sexEntries = entries.filter(e => (e.category || 'sex') === 'sex');
  const drinkEntries = entries.filter(e => e.category === 'drink');
  const today = todayString(), todayDate = new Date(today + 'T00:00:00');
  const dates = [...new Set(sexEntries.map(e => e.date))].sort();
  let currentStreak = 0;
  for (let i = 0; i <= dates.length; i++) {
    const exp = new Date(todayDate); exp.setDate(exp.getDate() - i);
    if (dates.includes(toDateString(exp))) currentStreak++; else break;
  }
  let longest = dates.length > 0 ? 1 : 0, tmp = 1;
  for (let i = 1; i < dates.length; i++) {
    if ((new Date(dates[i]+'T00:00:00') - new Date(dates[i-1]+'T00:00:00')) / 86400000 === 1) { tmp++; longest = Math.max(longest, tmp); } else tmp = 1;
  }
  const lastSex = dates.length > 0 ? dates[dates.length - 1] : null;
  const noNut = lastSex ? Math.floor((todayDate - new Date(lastSex + 'T00:00:00')) / 86400000) : 0;
  const weekAgo = new Date(todayDate); weekAgo.setDate(weekAgo.getDate() - 7);
  const drinksWeek = drinkEntries.filter(e => e.date >= toDateString(weekAgo) && e.date <= today).length;
  return { current: currentStreak, longest, noNut, drinksWeek };
}

// Selection screen — choose category first
export async function renderQuickLog(container, presetDate = null, presetCat = null) {
  if (presetCat) {
    return renderLogForm(container, presetCat, presetDate);
  }

  const streaks = await computeStreaks();

  container.innerHTML = `
    <div class="qlog">
      <div class="qlog-greeting">${getLang() === 'cn' ? '记录什么？' : "What's up?"}</div>
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

      <div class="qlog-pick">
        <button class="qlog-pick-card" id="pick-sex">
          <span class="qlog-pick-emoji">🔥</span>
          <span class="qlog-pick-label">${t('catSex')}</span>
        </button>
        <button class="qlog-pick-card" id="pick-drink">
          <span class="qlog-pick-emoji">🍷</span>
          <span class="qlog-pick-label">${t('catDrink')}</span>
        </button>
      </div>
    </div>
  `;

  document.getElementById('pick-sex').addEventListener('click', () => renderLogForm(container, 'sex', presetDate));
  document.getElementById('pick-drink').addEventListener('click', () => renderLogForm(container, 'drink', presetDate));
}

// Actual log form
async function renderLogForm(container, category, presetDate) {
  const date = presetDate || todayString();
  const currentHour = new Date().getHours();
  const currentPeriod = getTimeOfDayFromHour(currentHour);
  const greeting = pickGreeting(category);
  const isSex = category === 'sex';
  const types = Object.entries(SEX_TYPE_COLORS);

  container.innerHTML = `
    <div class="qlog">
      <div class="qlog-greeting">${greeting}</div>
      <div class="qlog-sub">${t('logSub')}</div>

      <form id="qlog-form" class="qlog-form">
        ${isSex ? `
        <div class="qlog-section">
          <div class="form-label">${t('logType')}</div>
          <div class="qlog-types" id="f-type">
            ${types.map(([key, color]) => `<button type="button" class="qlog-type-btn${key === 'solo' ? ' active' : ''}" data-type="${key}"><span class="qlog-type-dot" style="background:${color}"></span>${getTypeLabel(key)}</button>`).join('')}
          </div>
        </div>` : ''}

        <div class="qlog-section"><div class="form-label">${t('logDate')}</div><input type="date" class="form-input" id="f-date" value="${date}"></div>

        <div class="qlog-section">
          <div class="form-label">${t('logWhen')}</div>
          <div class="qlog-time-periods">
            <button type="button" class="qlog-period-btn${currentPeriod === 'morning' ? ' active' : ''}" data-period="morning"><span class="qlog-period-icon">☀️</span><span>${t('logMorning')}</span></button>
            <button type="button" class="qlog-period-btn${currentPeriod === 'afternoon' ? ' active' : ''}" data-period="afternoon"><span class="qlog-period-icon">⛅</span><span>${t('logAfternoon')}</span></button>
            <button type="button" class="qlog-period-btn${currentPeriod === 'night' ? ' active' : ''}" data-period="night"><span class="qlog-period-icon">🌙</span><span>${t('logNight')}</span></button>
          </div>
          <div class="qlog-exact-time"><label class="qlog-exact-toggle" id="exact-toggle"><span>${t('logExactTime')}</span><span class="qlog-toggle-arrow" id="toggle-arrow">▾</span></label><input type="time" class="form-input qlog-time-input hidden" id="f-time" value="${nowTimeString()}"></div>
        </div>

        <div class="qlog-section"><div class="form-label">${t('logMood')}</div><div class="qlog-moods">${[1,2,3,4,5].map(i => `<button type="button" class="qlog-mood-btn" data-mood="${i}">${MOOD_EMOJIS[i]}</button>`).join('')}</div></div>
        ${isSex ? `<div class="qlog-section"><div class="form-label">${t('logDuration')}</div><input type="number" class="form-input qlog-duration" id="f-duration" placeholder="${t('logDurationPlaceholder')}" min="0" inputmode="numeric"></div>` : ''}
        <div class="qlog-section"><div class="form-label">${t('logNotes')}</div><textarea class="form-input qlog-notes" id="f-notes" placeholder="${t('logNotesPlaceholder')}"></textarea></div>
        <button type="submit" class="btn btn-primary qlog-submit">${t('logSubmit')}</button>
      </form>
    </div>
  `;

  let selectedType = isSex ? 'solo' : 'drink', selectedPeriod = currentPeriod, useExactTime = false, selectedMood = 0;
  const periodToTime = { morning: '09:00', afternoon: '14:00', night: '22:00' };

  container.querySelectorAll('.qlog-period-btn').forEach(btn => btn.addEventListener('click', () => {
    container.querySelectorAll('.qlog-period-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); selectedPeriod = btn.dataset.period;
  }));
  document.getElementById('exact-toggle').addEventListener('click', () => {
    useExactTime = !useExactTime;
    document.getElementById('f-time').classList.toggle('hidden', !useExactTime);
    document.getElementById('toggle-arrow').textContent = useExactTime ? '▴' : '▾';
  });
  if (isSex) {
    container.querySelectorAll('.qlog-type-btn').forEach(btn => btn.addEventListener('click', () => {
      container.querySelectorAll('.qlog-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active'); selectedType = btn.dataset.type;
    }));
  }
  container.querySelectorAll('.qlog-mood-btn').forEach(btn => btn.addEventListener('click', () => {
    const val = parseInt(btn.dataset.mood);
    if (val === selectedMood) { selectedMood = 0; btn.classList.remove('active'); }
    else { container.querySelectorAll('.qlog-mood-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); selectedMood = val; }
  }));

  document.getElementById('qlog-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      category,
      date: document.getElementById('f-date').value,
      time: useExactTime ? document.getElementById('f-time').value : periodToTime[selectedPeriod],
      type: selectedType,
      duration: (isSex && document.getElementById('f-duration')?.value) ? parseInt(document.getElementById('f-duration').value) : null,
      mood: selectedMood || null,
      notes: document.getElementById('f-notes').value.trim(),
    };
    await addEntry(data);
    navigate(`day/${data.date}`);
  });
}

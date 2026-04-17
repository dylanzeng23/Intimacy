import { addEntry, getAllEntries } from './db.js';
import { todayString, nowTimeString, TYPE_LABELS, TYPE_COLORS, MOOD_EMOJIS, toDateString } from './utils.js';
import { navigate } from './app.js';

const GREETINGS = [
  "Feeling frisky?",
  "How was it?",
  "Another one?",
  "Spill the tea.",
  "Let's log it.",
  "What happened?",
  "Good times?",
  "Tell me more.",
  "Go on...",
  "Been busy?",
  "Score!",
  "Nice.",
  "Again already?",
  "Log the magic.",
  "Don't be shy.",
  "The deed is done?",
  "Worth noting?",
  "Memorable?",
  "Post-nut clarity?",
  "How do you feel?",
];

function pickGreeting() {
  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
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

  // Current activity streak (consecutive days with entries, ending today or yesterday)
  let currentStreak = 0;
  const todayDate = new Date(today + 'T00:00:00');
  for (let i = 0; i <= dates.length; i++) {
    const expected = new Date(todayDate);
    expected.setDate(expected.getDate() - i);
    const expectedStr = toDateString(expected);
    if (dates.includes(expectedStr)) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Longest streak
  let longestStreak = 1;
  let tempStreak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1] + 'T00:00:00');
    const curr = new Date(dates[i] + 'T00:00:00');
    const diff = (curr - prev) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  // No Nut streak — days since last entry
  const lastEntryDate = dates[dates.length - 1];
  const lastDate = new Date(lastEntryDate + 'T00:00:00');
  const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
  const noNut = diffDays;

  return { current: currentStreak, longest: longestStreak, noNut };
}

export async function renderQuickLog(container) {
  const date = todayString();
  const currentHour = new Date().getHours();
  const currentPeriod = getTimeOfDayFromHour(currentHour);
  const greeting = pickGreeting();
  const streaks = await computeStreaks();

  container.innerHTML = `
    <div class="qlog">
      <div class="qlog-greeting">${greeting}</div>
      <div class="qlog-sub">Log something. No one's watching.</div>

      ${renderStreakBar(streaks)}

      <form id="qlog-form" class="qlog-form">
        <div class="qlog-section">
          <div class="form-label">Type</div>
          <div class="qlog-types" id="f-type">
            ${Object.entries(TYPE_LABELS).map(([key, label]) => `
              <button type="button" class="qlog-type-btn${key === 'solo' ? ' active' : ''}" data-type="${key}">
                <span class="qlog-type-dot" style="background:${TYPE_COLORS[key]}"></span>
                ${label}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="qlog-section">
          <div class="form-label">Date</div>
          <input type="date" class="form-input" id="f-date" value="${date}">
        </div>

        <div class="qlog-section">
          <div class="form-label">When</div>
          <div class="qlog-time-periods" id="f-period">
            <button type="button" class="qlog-period-btn${currentPeriod === 'morning' ? ' active' : ''}" data-period="morning">
              <span class="qlog-period-icon">&#9728;&#65039;</span>
              <span>Morning</span>
            </button>
            <button type="button" class="qlog-period-btn${currentPeriod === 'afternoon' ? ' active' : ''}" data-period="afternoon">
              <span class="qlog-period-icon">&#9925;</span>
              <span>Afternoon</span>
            </button>
            <button type="button" class="qlog-period-btn${currentPeriod === 'night' ? ' active' : ''}" data-period="night">
              <span class="qlog-period-icon">&#127769;</span>
              <span>Night</span>
            </button>
          </div>
          <div class="qlog-exact-time">
            <label class="qlog-exact-toggle" id="exact-toggle">
              <span>Exact time</span>
              <span class="qlog-toggle-arrow" id="toggle-arrow">&#9662;</span>
            </label>
            <input type="time" class="form-input qlog-time-input hidden" id="f-time" value="${nowTimeString()}">
          </div>
        </div>

        <div class="qlog-section">
          <div class="form-label">Mood</div>
          <div class="qlog-moods" id="f-mood">
            ${[1, 2, 3, 4, 5].map(i => `
              <button type="button" class="qlog-mood-btn" data-mood="${i}">${MOOD_EMOJIS[i]}</button>
            `).join('')}
          </div>
        </div>

        <div class="qlog-section">
          <div class="form-label">Duration (min)</div>
          <input type="number" class="form-input qlog-duration" id="f-duration" placeholder="optional" min="0" inputmode="numeric">
        </div>

        <div class="qlog-section">
          <div class="form-label">Notes</div>
          <textarea class="form-input qlog-notes" id="f-notes" placeholder="How was it?"></textarea>
        </div>

        <button type="submit" class="btn btn-primary qlog-submit">Log It</button>
      </form>
    </div>
  `;

  // Time period logic
  let selectedPeriod = currentPeriod;
  let useExactTime = false;
  const periodToTime = { morning: '09:00', afternoon: '14:00', night: '22:00' };

  container.querySelectorAll('.qlog-period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.qlog-period-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedPeriod = btn.dataset.period;
    });
  });

  document.getElementById('exact-toggle').addEventListener('click', () => {
    useExactTime = !useExactTime;
    document.getElementById('f-time').classList.toggle('hidden', !useExactTime);
    document.getElementById('toggle-arrow').innerHTML = useExactTime ? '&#9652;' : '&#9662;';
  });

  // Type
  let selectedType = 'solo';
  container.querySelectorAll('.qlog-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.qlog-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedType = btn.dataset.type;
    });
  });

  // Mood
  let selectedMood = 0;
  container.querySelectorAll('.qlog-mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.dataset.mood);
      if (val === selectedMood) {
        selectedMood = 0;
        btn.classList.remove('active');
      } else {
        container.querySelectorAll('.qlog-mood-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMood = val;
      }
    });
  });

  // Submit
  document.getElementById('qlog-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const time = useExactTime
      ? document.getElementById('f-time').value
      : periodToTime[selectedPeriod];

    const data = {
      date: document.getElementById('f-date').value,
      time,
      type: selectedType,
      duration: document.getElementById('f-duration').value ? parseInt(document.getElementById('f-duration').value) : null,
      mood: selectedMood || null,
      notes: document.getElementById('f-notes').value.trim(),
    };

    await addEntry(data);
    navigate(`day/${data.date}`);
  });
}

function renderStreakBar(streaks) {
  const hasActivity = streaks.current > 0;
  const isClean = streaks.noNut > 0;

  return `
    <div class="streak-bar">
      <div class="streak-item streak-fire">
        <div class="streak-icon">${hasActivity ? '&#128293;' : '&#10052;&#65039;'}</div>
        <div class="streak-info">
          <div class="streak-count">${streaks.current}</div>
          <div class="streak-label">day streak</div>
        </div>
      </div>
      <div class="streak-divider"></div>
      <div class="streak-item streak-trophy">
        <div class="streak-icon">&#127942;</div>
        <div class="streak-info">
          <div class="streak-count">${streaks.longest}</div>
          <div class="streak-label">best streak</div>
        </div>
      </div>
      <div class="streak-divider"></div>
      <div class="streak-item streak-nonut">
        <div class="streak-icon">${isClean ? '&#128170;' : '&#128064;'}</div>
        <div class="streak-info">
          <div class="streak-count">${streaks.noNut}</div>
          <div class="streak-label">${isClean ? 'no nut' : 'today!'}</div>
        </div>
      </div>
    </div>
  `;
}

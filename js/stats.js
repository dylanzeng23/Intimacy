import { getAllEntries } from './db.js';
import { TYPE_LABELS, TYPE_COLORS, getTimeOfDay, todayString } from './utils.js';

export async function renderStats(container) {
  const entries = await getAllEntries();

  if (entries.length === 0) {
    container.innerHTML = `
      <div class="stats-empty">
        <div style="font-size:48px">&#128202;</div>
        <p>No data yet</p>
        <p>Add your first entry to see stats</p>
      </div>
    `;
    return;
  }

  const today = todayString();
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth() + 1).padStart(2, '0')}-${String(weekAgo.getDate()).padStart(2, '0')}`;
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const thisWeek = entries.filter(e => e.date >= weekAgoStr && e.date <= today).length;
  const thisMonth = entries.filter(e => e.date >= monthStart && e.date <= today).length;

  // Type breakdown
  const typeCounts = {};
  for (const e of entries) {
    typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
  }
  const maxTypeCount = Math.max(...Object.values(typeCounts), 1);

  // Time of day
  const timeBuckets = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
  for (const e of entries) {
    if (e.time) timeBuckets[getTimeOfDay(e.time)]++;
  }
  const maxTimeBucket = Math.max(...Object.values(timeBuckets), 1);

  // Streaks
  const dates = [...new Set(entries.map(e => e.date))].sort().reverse();
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  if (dates.length > 0) {
    // Current streak (from today backwards)
    const todayDate = new Date(today + 'T00:00:00');
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(todayDate);
      expected.setDate(expected.getDate() - i);
      const expectedStr = `${expected.getFullYear()}-${String(expected.getMonth() + 1).padStart(2, '0')}-${String(expected.getDate()).padStart(2, '0')}`;
      if (dates[i] === expectedStr) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Longest streak
    const sortedDates = [...dates].sort();
    tempStreak = 1;
    longestStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1] + 'T00:00:00');
      const curr = new Date(sortedDates[i] + 'T00:00:00');
      const diff = (curr - prev) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
  }

  // Average mood
  const moodEntries = entries.filter(e => e.mood);
  const avgMood = moodEntries.length > 0
    ? (moodEntries.reduce((sum, e) => sum + e.mood, 0) / moodEntries.length).toFixed(1)
    : null;

  let html = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <div class="stat-card">
        <h3>This Week</h3>
        <div class="stat-number">${thisWeek}</div>
      </div>
      <div class="stat-card">
        <h3>This Month</h3>
        <div class="stat-number">${thisMonth}</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <div class="stat-card">
        <h3>Current Streak</h3>
        <div class="stat-number">${currentStreak}</div>
        <div class="stat-sub">day${currentStreak !== 1 ? 's' : ''}</div>
      </div>
      <div class="stat-card">
        <h3>Longest Streak</h3>
        <div class="stat-number">${longestStreak}</div>
        <div class="stat-sub">day${longestStreak !== 1 ? 's' : ''}</div>
      </div>
    </div>

    <div class="stat-card">
      <h3>Total</h3>
      <div class="stat-number">${entries.length}</div>
      <div class="stat-sub">entries all time</div>
    </div>
  `;

  if (avgMood) {
    html += `
      <div class="stat-card" style="margin-top:12px">
        <h3>Average Mood</h3>
        <div class="stat-number">${avgMood}<span style="font-size:16px;color:var(--text-muted)"> / 5</span></div>
      </div>
    `;
  }

  html += `
    <div class="stat-card" style="margin-top:12px">
      <h3>By Type</h3>
      ${Object.entries(typeCounts).map(([type, count]) => `
        <div class="stat-row">
          <span class="stat-bar-label">${TYPE_LABELS[type] || type}</span>
          <div class="stat-bar-track">
            <div class="stat-bar-fill" style="width:${(count / maxTypeCount) * 100}%;background:${TYPE_COLORS[type] || '#888'}"></div>
          </div>
          <span class="stat-bar-count">${count}</span>
        </div>
      `).join('')}
    </div>

    <div class="stat-card" style="margin-top:12px">
      <h3>Time of Day</h3>
      ${Object.entries(timeBuckets).map(([period, count]) => `
        <div class="stat-row">
          <span class="stat-bar-label">${period}</span>
          <div class="stat-bar-track">
            <div class="stat-bar-fill" style="width:${(count / maxTimeBucket) * 100}%;background:var(--accent)"></div>
          </div>
          <span class="stat-bar-count">${count}</span>
        </div>
      `).join('')}
    </div>
  `;

  container.innerHTML = html;
}

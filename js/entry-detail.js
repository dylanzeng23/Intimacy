import { getEntry } from './db.js';
import { formatDate, formatTime12h, TYPE_LABELS, TYPE_COLORS, MOOD_EMOJIS } from './utils.js';
import { navigate } from './app.js';

export async function renderEntryDetail(container, id) {
  const entry = await getEntry(id);
  if (!entry) {
    container.innerHTML = '<div class="day-empty"><p>Entry not found</p></div>';
    return;
  }

  const fields = [
    { label: 'Date', value: formatDate(entry.date) },
    { label: 'Time', value: formatTime12h(entry.time) },
    { label: 'Type', value: `<span style="color:${TYPE_COLORS[entry.type]}">${TYPE_LABELS[entry.type] || entry.type}</span>` },
  ];

  if (entry.duration != null) {
    fields.push({ label: 'Duration', value: `${entry.duration} min` });
  }

  if (entry.mood) {
    fields.push({ label: 'Mood', value: `${MOOD_EMOJIS[entry.mood]} (${entry.mood}/5)` });
  }

  if (entry.notes) {
    fields.push({ label: 'Notes', value: entry.notes.replace(/\n/g, '<br>') });
  }

  container.innerHTML = fields.map(f => `
    <div class="detail-field">
      <div class="detail-label">${f.label}</div>
      <div class="detail-value">${f.value}</div>
    </div>
  `).join('');
}

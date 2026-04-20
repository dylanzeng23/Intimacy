import { getEntry } from './db.js';
import { formatDate, formatTime12h, TYPE_COLORS, MOOD_EMOJIS } from './utils.js';
import { t, getTypeLabel, getCategoryLabel } from './i18n.js';

export async function renderEntryDetail(container, id) {
  const entry = await getEntry(id);
  if (!entry) { container.innerHTML = `<div class="day-empty"><p>Entry not found</p></div>`; return; }

  const cat = entry.category || 'sex';
  const catEmoji = cat === 'drink' ? '🍷' : '🔥';
  const fields = [
    { label: t('entryDate'), value: formatDate(entry.date) },
    { label: t('entryTime'), value: formatTime12h(entry.time) },
    { label: t('logType'), value: `${catEmoji} ${getCategoryLabel(cat)} — <span style="color:${TYPE_COLORS[entry.type] || 'inherit'}">${getTypeLabel(entry.type)}</span>` },
  ];
  if (entry.duration != null) fields.push({ label: t('entryDuration'), value: `${entry.duration} min` });
  if (entry.mood) fields.push({ label: t('entryMood'), value: `${MOOD_EMOJIS[entry.mood]} (${entry.mood}/5)` });
  if (entry.notes) fields.push({ label: t('entryNotes'), value: entry.notes.replace(/\n/g, '<br>') });

  container.innerHTML = fields.map(f => `<div class="detail-field"><div class="detail-label">${f.label}</div><div class="detail-value">${f.value}</div></div>`).join('');
}

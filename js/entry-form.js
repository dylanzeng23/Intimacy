import { addEntry, getEntry, updateEntry, deleteEntry } from './db.js';
import { todayString, nowTimeString, TYPE_LABELS, MOOD_EMOJIS } from './utils.js';
import { navigate } from './app.js';

export async function renderEntryForm(container, editId = null, defaultDate = null) {
  let entry = null;
  if (editId) {
    entry = await getEntry(editId);
    if (!entry) {
      container.innerHTML = '<div class="day-empty"><p>Entry not found</p></div>';
      return;
    }
  }

  const date = entry?.date || defaultDate || todayString();
  const time = entry?.time || nowTimeString();
  const type = entry?.type || 'solo';
  const duration = entry?.duration ?? '';
  const mood = entry?.mood ?? 0;
  const notes = entry?.notes || '';

  const typeButtons = Object.entries(TYPE_LABELS).map(([key, label]) =>
    `<button type="button" class="type-btn${key === type ? ' active' : ''}" data-type="${key}">${label}</button>`
  ).join('');

  const moodButtons = [1, 2, 3, 4, 5].map(i =>
    `<button type="button" class="mood-btn${i === mood ? ' active' : ''}" data-mood="${i}">${MOOD_EMOJIS[i]}</button>`
  ).join('');

  container.innerHTML = `
    <form id="entry-form">
      <div class="form-group">
        <label class="form-label">Date</label>
        <input type="date" class="form-input" id="f-date" value="${date}">
      </div>

      <div class="form-group">
        <label class="form-label">Time</label>
        <input type="time" class="form-input" id="f-time" value="${time}">
      </div>

      <div class="form-group">
        <label class="form-label">Type</label>
        <div class="type-selector" id="f-type">${typeButtons}</div>
      </div>

      <div class="form-group">
        <label class="form-label">Duration (minutes, optional)</label>
        <input type="number" class="form-input" id="f-duration" value="${duration}" placeholder="e.g. 15" min="0" inputmode="numeric">
      </div>

      <div class="form-group">
        <label class="form-label">Mood (optional)</label>
        <div class="mood-selector" id="f-mood">${moodButtons}</div>
      </div>

      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-input" id="f-notes" placeholder="Add notes...">${notes}</textarea>
      </div>

      <button type="submit" class="btn btn-primary">${editId ? 'Save Changes' : 'Add Entry'}</button>
      ${editId ? '<button type="button" class="btn btn-danger" id="delete-btn">Delete Entry</button>' : ''}
    </form>
  `;

  let selectedType = type;
  let selectedMood = mood;

  container.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedType = btn.dataset.type;
    });
  });

  container.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.dataset.mood);
      if (val === selectedMood) {
        selectedMood = 0;
        btn.classList.remove('active');
      } else {
        container.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMood = val;
      }
    });
  });

  document.getElementById('entry-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      date: document.getElementById('f-date').value,
      time: document.getElementById('f-time').value,
      type: selectedType,
      duration: document.getElementById('f-duration').value ? parseInt(document.getElementById('f-duration').value) : null,
      mood: selectedMood || null,
      notes: document.getElementById('f-notes').value.trim(),
    };

    if (editId) {
      await updateEntry({ ...entry, ...data });
      navigate(`entry/${editId}`);
    } else {
      const newEntry = await addEntry(data);
      navigate(`day/${data.date}`);
    }
  });

  if (editId) {
    document.getElementById('delete-btn').addEventListener('click', () => {
      showConfirmDialog(container, 'Delete Entry', 'This cannot be undone.', async () => {
        await deleteEntry(editId);
        navigate(`day/${entry.date}`);
      });
    });
  }
}

function showConfirmDialog(container, title, message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'dialog-overlay';
  overlay.innerHTML = `
    <div class="dialog">
      <h3>${title}</h3>
      <p>${message}</p>
      <div class="dialog-actions">
        <button class="btn btn-cancel" id="dialog-cancel">Cancel</button>
        <button class="btn btn-danger" id="dialog-confirm">Delete</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('dialog-cancel').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.getElementById('dialog-confirm').addEventListener('click', () => {
    overlay.remove();
    onConfirm();
  });
}

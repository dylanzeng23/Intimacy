import { addEntry, getEntry, updateEntry, deleteEntry } from './db.js';
import { todayString, nowTimeString, SEX_TYPE_COLORS, MOOD_EMOJIS } from './utils.js';
import { navigate } from './app.js';
import { t, getTypeLabel } from './i18n.js';

export async function renderEntryForm(container, editId = null) {
  let entry = null;
  if (editId) {
    entry = await getEntry(editId);
    if (!entry) { container.innerHTML = '<div class="day-empty"><p>Entry not found</p></div>'; return; }
  }

  const cat = entry?.category || 'sex';
  const date = entry?.date || todayString();
  const time = entry?.time || nowTimeString();
  const type = entry?.type || (cat === 'sex' ? 'solo' : 'drink');
  const duration = entry?.duration ?? '';
  const mood = entry?.mood ?? 0;
  const notes = entry?.notes || '';

  const sexTypes = Object.entries(SEX_TYPE_COLORS);
  const isDrink = cat === 'drink';

  container.innerHTML = `
    <div class="qlog">
      <form id="entry-form" class="qlog-form">
        <div class="qlog-section">
          <div class="qlog-cat-toggle">
            <button type="button" class="qlog-cat-btn${cat === 'sex' ? ' active' : ''}" data-cat="sex">🔥 ${t('catSex')}</button>
            <button type="button" class="qlog-cat-btn${cat === 'drink' ? ' active' : ''}" data-cat="drink">🍷 ${t('catDrink')}</button>
          </div>
        </div>
        <div class="qlog-section">
          <div class="form-label">${t('entryType')}</div>
          <div class="qlog-types" id="f-type">
            ${isDrink ? '' : sexTypes.map(([key, color]) => `<button type="button" class="qlog-type-btn${key === type ? ' active' : ''}" data-type="${key}"><span class="qlog-type-dot" style="background:${color}"></span>${getTypeLabel(key)}</button>`).join('')}
          </div>
        </div>
        <div class="qlog-section"><div class="form-label">${t('entryDate')}</div><input type="date" class="form-input" id="f-date" value="${date}"></div>
        <div class="qlog-section"><div class="form-label">${t('entryTime')}</div><input type="time" class="form-input" id="f-time" value="${time}"></div>
        <div class="qlog-section"><div class="form-label">${t('logDuration')}</div><input type="number" class="form-input qlog-duration" id="f-duration" value="${duration}" placeholder="${t('logDurationPlaceholder')}" min="0" inputmode="numeric"></div>
        <div class="qlog-section"><div class="form-label">${t('entryMood')}</div><div class="qlog-moods" id="f-mood">${[1,2,3,4,5].map(i => `<button type="button" class="qlog-mood-btn${i === mood ? ' active' : ''}" data-mood="${i}">${MOOD_EMOJIS[i]}</button>`).join('')}</div></div>
        <div class="qlog-section"><div class="form-label">${t('entryNotes')}</div><textarea class="form-input qlog-notes" id="f-notes" placeholder="${t('logNotesPlaceholder')}">${notes}</textarea></div>
        <button type="submit" class="btn btn-primary">${editId ? t('entrySave') : t('entryAdd')}</button>
        ${editId ? `<button type="button" class="btn btn-danger" id="delete-btn">${t('entryDelete')}</button>` : ''}
      </form>
    </div>
  `;

  let selectedCat = cat, selectedType = type, selectedMood = mood;

  container.querySelectorAll('.qlog-cat-btn').forEach(btn => btn.addEventListener('click', () => {
    container.querySelectorAll('.qlog-cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); selectedCat = btn.dataset.cat;
    const typeSection = container.querySelector('.qlog-types');
    if (typeSection) typeSection.style.display = selectedCat === 'sex' ? '' : 'none';
    selectedType = selectedCat === 'sex' ? 'solo' : 'drink';
  }));

  container.querySelectorAll('.qlog-type-btn').forEach(btn => btn.addEventListener('click', () => {
    container.querySelectorAll('.qlog-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); selectedType = btn.dataset.type;
  }));

  container.querySelectorAll('.qlog-mood-btn').forEach(btn => btn.addEventListener('click', () => {
    const val = parseInt(btn.dataset.mood);
    if (val === selectedMood) { selectedMood = 0; btn.classList.remove('active'); }
    else { container.querySelectorAll('.qlog-mood-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); selectedMood = val; }
  }));

  document.getElementById('entry-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = { category: selectedCat, date: document.getElementById('f-date').value, time: document.getElementById('f-time').value, type: selectedType, duration: document.getElementById('f-duration').value ? parseInt(document.getElementById('f-duration').value) : null, mood: selectedMood || null, notes: document.getElementById('f-notes').value.trim() };
    if (editId) { await updateEntry({ ...entry, ...data }); navigate(`entry/${editId}`); }
    else { await addEntry(data); navigate(`day/${data.date}`); }
  });

  if (editId) {
    document.getElementById('delete-btn').addEventListener('click', () => {
      const overlay = document.createElement('div'); overlay.className = 'dialog-overlay';
      overlay.innerHTML = `<div class="dialog"><h3>${t('entryDeleteTitle')}</h3><p>${t('entryDeleteMsg')}</p><div class="dialog-actions"><button class="btn btn-cancel" id="dialog-cancel">${t('entryCancel')}</button><button class="btn btn-danger" id="dialog-confirm">${t('entryDeleteConfirm')}</button></div></div>`;
      document.body.appendChild(overlay);
      document.getElementById('dialog-cancel').addEventListener('click', () => overlay.remove());
      overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
      document.getElementById('dialog-confirm').addEventListener('click', async () => { await deleteEntry(editId); overlay.remove(); navigate(`day/${entry.date}`); });
    });
  }
}

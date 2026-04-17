import { getSetting, setSetting, getAllEntries, clearAllEntries, addEntry } from './db.js';
import { signOut } from './auth.js';
import { t, getLang, setLang } from './i18n.js';

export async function renderSettings(container) {
  const currentTheme = await getSetting('theme') || 'dark';
  const isDark = currentTheme === 'dark';
  const lang = getLang();

  container.innerHTML = `
    <div class="settings-section">
      <h3>${t('settingsAppearance')}</h3>
      <div class="settings-row">
        <span>${t('settingsDarkMode')}</span>
        <button class="toggle${isDark ? ' on' : ''}" id="theme-toggle"></button>
      </div>
    </div>

    <div class="settings-section">
      <h3>${t('settingsLanguage')}</h3>
      <div class="settings-row" id="lang-btn">
        <span>${lang === 'en' ? 'English' : '中文'}</span>
        <span style="color:var(--text-dim);font-size:13px">${lang === 'en' ? '切换中文' : 'Switch to EN'}</span>
      </div>
    </div>

    <div class="settings-section">
      <h3>${t('settingsData')}</h3>
      <div class="settings-row" id="export-btn">
        <span>${t('settingsExport')}</span>
        <span style="color:var(--text-dim)">&#8250;</span>
      </div>
      <div class="settings-row" id="import-btn">
        <span>${t('settingsImport')}</span>
        <span style="color:var(--text-dim)">&#8250;</span>
      </div>
      <div class="settings-row" id="clear-btn">
        <span style="color:var(--danger)">${t('settingsClear')}</span>
        <span style="color:var(--text-dim)">&#8250;</span>
      </div>
    </div>

    <div class="settings-section">
      <h3>${t('settingsAccount')}</h3>
      <div class="settings-row" id="signout-btn">
        <span>${t('settingsSignOut')}</span>
        <span style="color:var(--text-dim)">&#8250;</span>
      </div>
    </div>

    <input type="file" id="import-file" accept=".json" style="display:none">
    <div id="settings-toast" style="display:none;position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:var(--bg-elevated);color:var(--text);padding:10px 20px;border-radius:8px;font-size:14px;z-index:300;box-shadow:0 4px 12px rgba(0,0,0,0.3)"></div>
  `;

  document.getElementById('theme-toggle').addEventListener('click', async (e) => {
    const toggle = e.currentTarget;
    const newTheme = toggle.classList.contains('on') ? 'light' : 'dark';
    toggle.classList.toggle('on');
    document.documentElement.setAttribute('data-theme', newTheme);
    await setSetting('theme', newTheme);
  });

  document.getElementById('lang-btn').addEventListener('click', () => {
    setLang(lang === 'en' ? 'cn' : 'en');
    window.location.reload();
  });

  document.getElementById('export-btn').addEventListener('click', async () => {
    const entries = await getAllEntries();
    const data = JSON.stringify({ entries, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-log-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(t('settingsExported'));
  });

  document.getElementById('import-btn').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });

  document.getElementById('import-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const entries = data.entries || data;
      if (!Array.isArray(entries)) throw new Error('Invalid');
      let imported = 0;
      for (const entry of entries) {
        if (entry.date && entry.time && entry.type) {
          await addEntry({ date: entry.date, time: entry.time, type: entry.type, duration: entry.duration ?? null, mood: entry.mood ?? null, notes: entry.notes || '' });
          imported++;
        }
      }
      showToast(t('settingsImported').replace('{n}', imported));
    } catch (err) {
      showToast(t('settingsImportFail'));
    }
    e.target.value = '';
  });

  document.getElementById('clear-btn').addEventListener('click', () => {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.innerHTML = `<div class="dialog"><h3>${t('settingsClearTitle')}</h3><p>${t('settingsClearMsg')}</p><div class="dialog-actions"><button class="btn btn-cancel" id="dialog-cancel">${t('entryCancel')}</button><button class="btn btn-danger" id="dialog-confirm">${t('settingsClearConfirm')}</button></div></div>`;
    document.body.appendChild(overlay);
    document.getElementById('dialog-cancel').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.getElementById('dialog-confirm').addEventListener('click', async () => { await clearAllEntries(); overlay.remove(); showToast(t('settingsCleared')); });
  });

  document.getElementById('signout-btn').addEventListener('click', async () => {
    await signOut();
    window.location.hash = '';
    window.location.reload();
  });
}

function showToast(message) {
  const toast = document.getElementById('settings-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 2000);
}

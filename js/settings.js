import { getSetting, setSetting, getAllEntries, clearAllEntries, addEntry } from './db.js';
import { signOut } from './auth.js';

export async function renderSettings(container) {
  const currentTheme = await getSetting('theme') || 'dark';
  const isDark = currentTheme === 'dark';

  container.innerHTML = `
    <div class="settings-section">
      <h3>Appearance</h3>
      <div class="settings-row">
        <span>Dark Mode</span>
        <button class="toggle${isDark ? ' on' : ''}" id="theme-toggle"></button>
      </div>
    </div>

    <div class="settings-section">
      <h3>Data</h3>
      <div class="settings-row" id="export-btn">
        <span>Export Data (JSON)</span>
        <span style="color:var(--text-muted)">&#8250;</span>
      </div>
      <div class="settings-row" id="import-btn">
        <span>Import Data (JSON)</span>
        <span style="color:var(--text-muted)">&#8250;</span>
      </div>
      <div class="settings-row" id="clear-btn">
        <span style="color:var(--danger)">Clear All Data</span>
        <span style="color:var(--text-muted)">&#8250;</span>
      </div>
    </div>

    <div class="settings-section">
      <h3>Account</h3>
      <div class="settings-row" id="signout-btn">
        <span>Sign Out</span>
        <span style="color:var(--text-muted)">&#8250;</span>
      </div>
    </div>

    <input type="file" id="import-file" accept=".json" style="display:none">
    <div id="settings-toast" style="display:none;position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:var(--bg-card);color:var(--text);padding:10px 20px;border-radius:8px;font-size:14px;z-index:300;box-shadow:0 4px 12px rgba(0,0,0,0.3)"></div>
  `;

  // Theme toggle
  document.getElementById('theme-toggle').addEventListener('click', async (e) => {
    const toggle = e.currentTarget;
    const newTheme = toggle.classList.contains('on') ? 'light' : 'dark';
    toggle.classList.toggle('on');
    document.documentElement.setAttribute('data-theme', newTheme);
    await setSetting('theme', newTheme);
  });

  // Export
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
    showToast('Data exported');
  });

  // Import
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
      if (!Array.isArray(entries)) throw new Error('Invalid format');

      let imported = 0;
      for (const entry of entries) {
        if (entry.date && entry.time && entry.type) {
          await addEntry({
            date: entry.date,
            time: entry.time,
            type: entry.type,
            duration: entry.duration ?? null,
            mood: entry.mood ?? null,
            notes: entry.notes || '',
          });
          imported++;
        }
      }
      showToast(`Imported ${imported} entries`);
    } catch (err) {
      showToast('Import failed: invalid file');
    }
    e.target.value = '';
  });

  // Clear
  document.getElementById('clear-btn').addEventListener('click', () => {
    showClearDialog();
  });

  // Sign out
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

function showClearDialog() {
  const overlay = document.createElement('div');
  overlay.className = 'dialog-overlay';
  overlay.innerHTML = `
    <div class="dialog">
      <h3>Clear All Data</h3>
      <p>This will permanently delete all entries. This cannot be undone.</p>
      <div class="dialog-actions">
        <button class="btn btn-cancel" id="dialog-cancel">Cancel</button>
        <button class="btn btn-danger" id="dialog-confirm">Clear All</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('dialog-cancel').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.getElementById('dialog-confirm').addEventListener('click', async () => {
    await clearAllEntries();
    overlay.remove();
    showToast('All data cleared');
  });
}

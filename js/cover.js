import { t } from './i18n.js';

export function renderCover(container, onEnter) {
  container.innerHTML = `
    <div class="cover">
      <div class="cover-bg"></div>
      <div class="cover-content">
        <div class="cover-icon">&#127769;</div>
        <div class="cover-title">Daily Log</div>
        <div class="cover-tagline">${t('coverTagline')}</div>
        <button class="cover-cta" id="cover-enter">${t('coverCta')}</button>
      </div>
      <div class="cover-footer">${t('coverFooter')}</div>
    </div>
  `;
  document.getElementById('cover-enter').addEventListener('click', onEnter);
}

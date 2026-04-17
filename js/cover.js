import { t } from './i18n.js';

export function renderCover(container, onEnter) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const icon = isDark ? '&#127769;' : '&#9728;&#65039;';

  container.innerHTML = `
    <div class="cover">
      <div class="cover-bg"></div>
      <div class="cover-content">
        <div class="cover-icon">${icon}</div>
        <div class="cover-title">Daily Log</div>
        <div class="cover-tagline">${t('coverTagline')}</div>
        <div class="cover-features">
          <div class="cover-feat">${t('landingCalendar')}</div>
          <div class="cover-feat-dot">&middot;</div>
          <div class="cover-feat">${t('landingPatterns')}</div>
          <div class="cover-feat-dot">&middot;</div>
          <div class="cover-feat">${t('landingStreaks')}</div>
          <div class="cover-feat-dot">&middot;</div>
          <div class="cover-feat">${t('landingPrivate')}</div>
        </div>
        <button class="cover-cta" id="cover-enter">${t('landingCta')}</button>
      </div>
      <div class="cover-footer">${t('coverFooter')}</div>
    </div>
  `;
  document.getElementById('cover-enter').addEventListener('click', onEnter);
}

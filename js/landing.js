import { t } from './i18n.js';

export function renderLanding(container, onEnter) {
  container.innerHTML = `
    <div class="landing">
      <div class="landing-content">
        <span class="landing-icon">&#127769;</span>
        <div class="landing-pretitle">${t('landingPretitle')}</div>
        <h1 class="landing-title">${t('landingTitle')}</h1>
        <p class="landing-desc">${t('landingDesc')}</p>
        <div class="landing-features">
          <div class="landing-feat"><div class="landing-feat-icon">&#128197;</div><span class="landing-feat-label">${t('landingCalendar')}</span></div>
          <div class="landing-feat"><div class="landing-feat-icon">&#128200;</div><span class="landing-feat-label">${t('landingPatterns')}</span></div>
          <div class="landing-feat"><div class="landing-feat-icon">&#128274;</div><span class="landing-feat-label">${t('landingPrivate')}</span></div>
          <div class="landing-feat"><div class="landing-feat-icon">&#9889;</div><span class="landing-feat-label">${t('landingStreaks')}</span></div>
        </div>
        <button class="landing-cta" id="landing-enter">${t('landingCta')}</button>
      </div>
      <div class="landing-footer">${t('landingFooter')}</div>
    </div>
  `;
  document.getElementById('landing-enter').addEventListener('click', onEnter);
}

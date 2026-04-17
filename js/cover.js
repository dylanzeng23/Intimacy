export function renderCover(container, onEnter) {
  container.innerHTML = `
    <div class="cover">
      <div class="cover-bg"></div>
      <div class="cover-content">
        <div class="cover-icon">&#127769;</div>
        <div class="cover-title">Daily Log</div>
        <div class="cover-tagline">Your body. Your data. Your eyes only.</div>
        <button class="cover-cta" id="cover-enter">Sign In</button>
      </div>
      <div class="cover-footer">Private &middot; Encrypted &middot; No tracking</div>
    </div>
  `;

  document.getElementById('cover-enter').addEventListener('click', onEnter);
}

export function renderLanding(container, onEnter) {
  container.innerHTML = `
    <div class="landing">
      <div class="landing-content">
        <span class="landing-icon">&#127769;</span>
        <div class="landing-pretitle">Your Private Journal</div>
        <h1 class="landing-title">Daily Log</h1>
        <p class="landing-desc">
          Track your <em>intimate moments</em> with zero judgment.<br>
          Solo sessions, partner adventures, or anything in between &mdash;
          log it, see patterns, and understand your rhythm.<br><br>
          Your body, your data, your eyes only.
        </p>
        <div class="landing-features">
          <div class="landing-feat">
            <div class="landing-feat-icon">&#128197;</div>
            <span class="landing-feat-label">Calendar</span>
          </div>
          <div class="landing-feat">
            <div class="landing-feat-icon">&#128200;</div>
            <span class="landing-feat-label">Patterns</span>
          </div>
          <div class="landing-feat">
            <div class="landing-feat-icon">&#128274;</div>
            <span class="landing-feat-label">Private</span>
          </div>
          <div class="landing-feat">
            <div class="landing-feat-icon">&#9889;</div>
            <span class="landing-feat-label">Streaks</span>
          </div>
        </div>
        <button class="landing-cta" id="landing-enter">Get Started &#8594;</button>
      </div>
      <div class="landing-footer">All data encrypted &middot; Nothing leaves your device</div>
    </div>
  `;

  document.getElementById('landing-enter').addEventListener('click', onEnter);
}

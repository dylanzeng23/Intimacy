import { supabase } from './supabase.js';
import { t } from './i18n.js';

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function onAuthChange(callback) {
  supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
}

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function renderAuth(container, onSuccess) {
  let isLogin = true;
  function render() {
    container.innerHTML = `
      <div style="max-width:360px;margin:40px auto;padding:0 16px">
        <h2 style="text-align:center;color:var(--text-bright);margin-bottom:8px">Daily Log</h2>
        <p style="text-align:center;color:var(--text-dim);margin-bottom:32px;font-size:14px">${isLogin ? t('authSignIn') : t('authSignUp')}</p>
        <form id="auth-form">
          <div class="form-group"><label class="form-label">${t('authEmail')}</label><input type="email" class="form-input" id="auth-email" required autocomplete="email"></div>
          <div class="form-group"><label class="form-label">${t('authPassword')}</label><input type="password" class="form-input" id="auth-password" required minlength="6" autocomplete="${isLogin ? 'current-password' : 'new-password'}"></div>
          <div id="auth-error" style="color:var(--danger);font-size:13px;margin-bottom:12px;display:none"></div>
          <button type="submit" class="btn btn-primary" id="auth-submit">${isLogin ? t('authSignInBtn') : t('authSignUpBtn')}</button>
        </form>
        <p style="text-align:center;margin-top:20px;font-size:14px;color:var(--text-dim)">${isLogin ? t('authNoAccount') : t('authHasAccount')} <a href="#" id="auth-toggle" style="color:var(--accent);text-decoration:none">${isLogin ? t('authSignUpBtn') : t('authSignInBtn')}</a></p>
      </div>
    `;
    document.getElementById('auth-toggle').addEventListener('click', (e) => { e.preventDefault(); isLogin = !isLogin; render(); });
    document.getElementById('auth-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-email').value;
      const password = document.getElementById('auth-password').value;
      const errorEl = document.getElementById('auth-error');
      const submitBtn = document.getElementById('auth-submit');
      errorEl.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = isLogin ? t('authSigningIn') : t('authSigningUp');
      try {
        if (isLogin) { await signIn(email, password); }
        else {
          const data = await signUp(email, password);
          if (data.user && !data.session) {
            errorEl.textContent = t('authCheckEmail');
            errorEl.style.display = 'block'; errorEl.style.color = 'var(--accent)';
            submitBtn.disabled = false; submitBtn.textContent = isLogin ? t('authSignInBtn') : t('authSignUpBtn');
            return;
          }
        }
        onSuccess();
      } catch (err) {
        errorEl.textContent = err.message; errorEl.style.display = 'block';
        submitBtn.disabled = false; submitBtn.textContent = isLogin ? t('authSignInBtn') : t('authSignUpBtn');
      }
    });
  }
  render();
}

// shared/auth-ui.js
// Small optional-sign-in widget. Nothing on the site depends on this ever
// being used — every page works fully signed-out. When `window.sb` isn't
// configured yet (see shared/supabase-client.js), every method here is a
// safe no-op so pages behave exactly as if sign-in didn't exist.
const AuthUI = (() => {
  async function getSession() {
    if (!window.sb) return null;
    const { data } = await sb.auth.getSession();
    return data.session;
  }

  function onChange(fn) {
    if (!window.sb) {
      fn(null);
      return;
    }
    getSession().then(fn); // fire immediately with current state, don't wait for the next auth event
    sb.auth.onAuthStateChange((_event, session) => fn(session));
  }

  async function signInWithGoogle() {
    if (!window.sb) return;
    await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } });
  }

  async function signInWithPassword(email, password) {
    if (!window.sb) return { error: new Error('Sync is not configured yet.') };
    return sb.auth.signInWithPassword({ email, password });
  }

  async function signUpWithPassword(email, password) {
    if (!window.sb) return { error: new Error('Sync is not configured yet.') };
    return sb.auth.signUp({ email, password });
  }

  async function signOut() {
    if (!window.sb) return;
    await sb.auth.signOut();
  }

  function render(container, session) {
    if (!window.sb) {
      container.innerHTML = '';
      return;
    }
    if (session) {
      container.innerHTML = `
        <div class="auth-widget auth-signed-in">
          <span class="auth-email" title="${session.user.email}">Synced as ${session.user.email}</span>
          <button type="button" class="auth-btn auth-btn-ghost" data-action="sign-out">Sign out</button>
        </div>`;
      container.querySelector('[data-action="sign-out"]').addEventListener('click', signOut);
      return;
    }

    container.innerHTML = `
      <div class="auth-widget auth-signed-out">
        <button type="button" class="auth-btn auth-btn-google" data-action="google">Sign in to sync progress</button>
        <button type="button" class="auth-btn auth-btn-ghost" data-action="toggle-email">or use email</button>
        <form class="auth-form" hidden>
          <input type="email" class="auth-email-input" placeholder="Email" required autocomplete="email">
          <input type="password" class="auth-password-input" placeholder="Password (6+ chars)" required autocomplete="current-password" minlength="6">
          <div class="auth-form-actions">
            <button type="submit" class="auth-btn" data-action="signin">Sign in</button>
            <button type="button" class="auth-btn auth-btn-ghost" data-action="signup">Sign up</button>
          </div>
          <p class="auth-form-msg" role="status"></p>
        </form>
      </div>`;

    container.querySelector('[data-action="google"]').addEventListener('click', signInWithGoogle);

    const form = container.querySelector('.auth-form');
    container.querySelector('[data-action="toggle-email"]').addEventListener('click', () => {
      form.hidden = !form.hidden;
    });

    const msg = container.querySelector('.auth-form-msg');
    const emailInput = container.querySelector('.auth-email-input');
    const passwordInput = container.querySelector('.auth-password-input');

    async function handle(fn, verb) {
      msg.textContent = `${verb}…`;
      const { error } = await fn(emailInput.value, passwordInput.value);
      msg.textContent = error ? error.message : (verb === 'Signing up' ? 'Check your email to confirm, or just sign in if confirmation is off.' : '');
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handle(signInWithPassword, 'Signing in');
    });
    container.querySelector('[data-action="signup"]').addEventListener('click', () => handle(signUpWithPassword, 'Signing up'));
  }

  async function mount(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !window.sb) return;
    onChange((session) => {
      const el = document.getElementById(containerId);
      if (el) render(el, session);
    });
  }

  return { mount, getSession, onChange, signInWithGoogle, signInWithPassword, signUpWithPassword, signOut };
})();

window.AuthUI = AuthUI;

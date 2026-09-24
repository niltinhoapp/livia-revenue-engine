(function () {
  var gate = document.getElementById('auth-gate');
  var appLayout = document.querySelector('.app-layout');
  var form = document.getElementById('auth-form');
  var passwordInput = document.getElementById('auth-password');
  var errorEl = document.getElementById('auth-error');
  var submitBtn = document.getElementById('auth-submit');
  var logoutBtn = document.getElementById('logout-btn');

  if (!gate || !appLayout || !form) return;

  function showLogin() {
    gate.classList.remove('hidden');
    appLayout.style.display = 'none';
    if (passwordInput) {
      passwordInput.value = '';
      passwordInput.focus();
    }
    if (errorEl) errorEl.classList.add('hidden');
  }

  function showApp() {
    gate.classList.add('hidden');
    appLayout.style.display = '';
  }

  function setLoading(loading) {
    if (submitBtn) {
      submitBtn.disabled = loading;
      submitBtn.textContent = loading ? 'Entrando...' : 'Entrar';
    }
    if (passwordInput) passwordInput.disabled = loading;
  }

  async function verifySession() {
    try {
      var res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify' })
      });
      if (!res.ok) return false;
      var data = await res.json();
      return data.ok && data.valid;
    } catch (e) {
      return false;
    }
  }

  async function init() {
    appLayout.style.display = 'none';
    var valid = await verifySession();
    if (valid) {
      showApp();
    } else {
      showLogin();
    }
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (errorEl) errorEl.classList.add('hidden');
    var password = passwordInput ? passwordInput.value : '';
    if (!password) return;
    setLoading(true);
    try {
      var res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', password: password })
      });
      var data = await res.json();
      if (res.ok && data.ok) {
        showApp();
      } else {
        if (errorEl) errorEl.classList.remove('hidden');
      }
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = 'Erro de conexão.';
        errorEl.classList.remove('hidden');
      }
    }
    setLoading(false);
  });

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function () {
      try {
        await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'logout' })
        });
      } catch (e) {}
      showLogin();
    });
  }

  window.__revenueForceLogin = showLogin;

  init();
})();

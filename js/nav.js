/* =========================================
   nav.js — Navegación + Login
   ========================================= */

/* ========== CREDENCIALES ==========
   Cambia aquí tu usuario y contraseña
*/
const VALID_USER = 'Adrian';
const VALID_PASS = 'hololive2026';
/* ================================= */

/**
 * Muestra la página indicada y marca el link activo en el navbar.
 * También actualiza el hash de la URL (#home, #tareas, etc.)
 */
function showPage(pageId, linkEl) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));

  const target = document.getElementById(pageId);
  if (target) target.classList.add('active');

  // Marcar link activo por data-page si no se pasó linkEl
  if (linkEl) {
    linkEl.classList.add('active');
  } else {
    const navLink = document.querySelector(`.nav-links a[data-page="${pageId}"]`);
    if (navLink) navLink.classList.add('active');
  }

  // Actualizar hash sin recargar
  if (location.hash !== '#' + pageId) {
    history.replaceState(null, '', '#' + pageId);
  }
}

/** Actualiza UI según tipo de sesión (user vs guest) */
function updateAuthUI() {
  const auth = localStorage.getItem('portfolio_auth');
  const isUser = auth === 'user';

  const badge = document.getElementById('hololive-badge');
  if (badge) badge.style.display = isUser ? 'inline-flex' : 'none';

  if (typeof updateEditControlsUI === 'function') updateEditControlsUI();
  else {
    const editControls = document.getElementById('edit-controls');
    if (editControls) editControls.style.display = isUser ? 'flex' : 'none';
  }
}

/* Modo edición: lógica en js/edit.js (compartido con páginas de semanas) */

function enterPortfolio(asGuest = false) {
  const loginScreen = document.getElementById('login-screen');
  if (loginScreen) {
    loginScreen.classList.add('hidden');
    setTimeout(() => {
      loginScreen.style.display = 'none';
    }, 400);
  }
  localStorage.setItem('portfolio_auth', asGuest ? 'guest' : 'user');
  updateAuthUI();
}

/** Intentar iniciar sesión con usuario y contraseña */
function tryLogin() {
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const errorEl = document.getElementById('login-error');

  if (user === VALID_USER && pass === VALID_PASS) {
    errorEl.textContent = '';
    errorEl.style.display = 'none';
    enterPortfolio(false);
  } else {
    errorEl.textContent = 'Usuario o contraseña incorrectos';
    errorEl.style.display = 'block';
    document.getElementById('login-pass').value = '';
    document.getElementById('login-pass').focus();
  }
}

/** Ingresar como invitado */
function enterAsGuest() {
  enterPortfolio(true);
}

/** Mostrar / ocultar el formulario de login */
function toggleLoginForm(show) {
  const form = document.getElementById('login-form');
  const buttons = document.getElementById('login-buttons');
  if (show) {
    form.style.display = 'flex';
    buttons.style.display = 'none';
    document.getElementById('login-user').focus();
  } else {
    form.style.display = 'none';
    buttons.style.display = 'flex';
    document.getElementById('login-error').style.display = 'none';
  }
}

/** Cerrar sesión y volver a la pantalla de login */
function logout() {
  localStorage.removeItem('portfolio_auth');
  updateAuthUI();
  const loginScreen = document.getElementById('login-screen');
  if (loginScreen) {
    loginScreen.style.display = 'flex';
    loginScreen.classList.remove('hidden');
    const form = document.getElementById('login-form');
    const buttons = document.getElementById('login-buttons');
    if (form) form.style.display = 'none';
    if (buttons) buttons.style.display = 'flex';
    const userInput = document.getElementById('login-user');
    const passInput = document.getElementById('login-pass');
    const errorEl = document.getElementById('login-error');
    if (userInput) userInput.value = '';
    if (passInput) passInput.value = '';
    if (errorEl) errorEl.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Si ya está autenticado, no mostrar login
  const auth = localStorage.getItem('portfolio_auth');
  if (auth === 'user' || auth === 'guest') {
    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) loginScreen.style.display = 'none';
  }

  updateAuthUI();
  // Abrir la sección según el hash (#tareas, #perfil, etc.)
  const hash = (location.hash || '#home').replace('#', '');
  const validPages = ['home', 'tareas', 'perfil', 'info'];
  const pageId = validPages.includes(hash) ? hash : 'home';
  showPage(pageId, document.querySelector(`.nav-links a[data-page="${pageId}"]`));

  // Si el usuario cambia el hash manualmente
  window.addEventListener('hashchange', () => {
    const h = (location.hash || '#home').replace('#', '');
    if (validPages.includes(h)) {
      showPage(h, document.querySelector(`.nav-links a[data-page="${h}"]`));
    }
  });

  // Enter en el campo de contraseña = intentar login
  const passInput = document.getElementById('login-pass');
  if (passInput) {
    passInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') tryLogin();
    });
  }
});

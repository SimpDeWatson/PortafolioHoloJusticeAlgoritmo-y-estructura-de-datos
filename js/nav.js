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
  document.querySelectorAll('.nav-links a[data-page]').forEach(a => a.classList.remove('active'));

  const target = document.getElementById(pageId);
  if (target) target.classList.add('active');

  if (linkEl && linkEl.classList) {
    linkEl.classList.add('active');
  } else {
    const navLink = document.querySelector(`.nav-links a[data-page="${pageId}"]`);
    if (navLink) navLink.classList.add('active');
  }

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

  const logoutLi = document.getElementById('nav-logout-item');
  const loginLi = document.getElementById('nav-login-item');
  if (logoutLi) logoutLi.style.display = isUser ? '' : 'none';
  if (loginLi) loginLi.style.display = isUser ? 'none' : '';

  if (typeof updateEditControlsUI === 'function') updateEditControlsUI();
  else {
    const editControls = document.getElementById('edit-controls');
    if (editControls) editControls.style.display = isUser ? 'flex' : 'none';
  }

  // Si deja de ser usuario, salir de modo edición
  if (!isUser && typeof setEditMode === 'function' && window.__editMode) {
    setEditMode(false);
  }
}

/** Oculta el modal/pantalla de login */
function hideLoginScreen() {
  const loginScreen = document.getElementById('login-screen');
  if (!loginScreen) return;
  loginScreen.classList.add('hidden');
  setTimeout(() => {
    loginScreen.style.display = 'none';
  }, 300);
}

/** Muestra el modal de login (desde la barra de navegación) */
function showLoginScreen() {
  const loginScreen = document.getElementById('login-screen');
  if (!loginScreen) return;
  loginScreen.style.display = 'flex';
  // forzar reflow para transición
  void loginScreen.offsetWidth;
  loginScreen.classList.remove('hidden');

  const form = document.getElementById('login-form');
  const buttons = document.getElementById('login-buttons');
  if (form) form.style.display = 'none';
  if (buttons) buttons.style.display = 'flex';

  const errorEl = document.getElementById('login-error');
  if (errorEl) errorEl.style.display = 'none';
}

/** Entrar al portafolio como usuario o invitado */
function enterPortfolio(asGuest = false) {
  localStorage.setItem('portfolio_auth', asGuest ? 'guest' : 'user');
  hideLoginScreen();
  updateAuthUI();
}

/** Intentar iniciar sesión con usuario y contraseña */
function tryLogin() {
  const userEl = document.getElementById('login-user');
  const passEl = document.getElementById('login-pass');
  const errorEl = document.getElementById('login-error');
  if (!userEl || !passEl) return;

  const user = userEl.value.trim();
  const pass = passEl.value;

  if (user === VALID_USER && pass === VALID_PASS) {
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.style.display = 'none';
    }
    enterPortfolio(false);
  } else {
    if (errorEl) {
      errorEl.textContent = 'Usuario o contraseña incorrectos';
      errorEl.style.display = 'block';
    }
    passEl.value = '';
    passEl.focus();
  }
}

/** Ingresar como invitado (también cierra el modal) */
function enterAsGuest() {
  enterPortfolio(true);
}

/** Mostrar / ocultar el formulario de login dentro del modal */
function toggleLoginForm(show) {
  const form = document.getElementById('login-form');
  const buttons = document.getElementById('login-buttons');
  if (!form || !buttons) return;
  if (show) {
    form.style.display = 'flex';
    buttons.style.display = 'none';
    const u = document.getElementById('login-user');
    if (u) u.focus();
  } else {
    form.style.display = 'none';
    buttons.style.display = 'flex';
    const errorEl = document.getElementById('login-error');
    if (errorEl) errorEl.style.display = 'none';
  }
}

/**
 * Cerrar sesión: vuelve a modo invitado (NO obliga a ver la pantalla de login).
 * Solo aparece "Iniciar sesión" de nuevo en la barra.
 */
function logout() {
  localStorage.setItem('portfolio_auth', 'guest');
  updateAuthUI();
  hideLoginScreen();

  const userInput = document.getElementById('login-user');
  const passInput = document.getElementById('login-pass');
  const errorEl = document.getElementById('login-error');
  if (userInput) userInput.value = '';
  if (passInput) passInput.value = '';
  if (errorEl) errorEl.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  const auth = localStorage.getItem('portfolio_auth');

  // Por defecto: invitado. Solo "user" mantiene sesión de administrador.
  if (auth !== 'user') {
    localStorage.setItem('portfolio_auth', 'guest');
  }

  // Nunca bloquear el sitio con la pantalla de login al cargar
  hideLoginScreen();
  updateAuthUI();

  // Abrir la sección según el hash
  const hash = (location.hash || '#home').replace('#', '');
  const valid = ['home', 'tareas', 'perfil', 'info'];
  const page = valid.includes(hash) ? hash : 'home';
  showPage(page);

  // Enter en el formulario de login
  const passInput = document.getElementById('login-pass');
  if (passInput) {
    passInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') tryLogin();
    });
  }
  const userInput = document.getElementById('login-user');
  if (userInput) {
    userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const p = document.getElementById('login-pass');
        if (p) p.focus();
      }
    });
  }

  // Cerrar modal al hacer clic fuera de la tarjeta
  const loginScreen = document.getElementById('login-screen');
  if (loginScreen) {
    loginScreen.addEventListener('click', (e) => {
      if (e.target === loginScreen) {
        hideLoginScreen();
        // Si cerró sin loguearse, sigue como invitado
        if (localStorage.getItem('portfolio_auth') !== 'user') {
          localStorage.setItem('portfolio_auth', 'guest');
          updateAuthUI();
        }
      }
    });
  }
});

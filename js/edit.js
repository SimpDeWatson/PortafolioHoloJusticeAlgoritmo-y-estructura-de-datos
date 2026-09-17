/* =========================================
   edit.js — Modo edición (solo usuario logueado)
   ========================================= */

window.__editMode = false;

function isLoggedUser() {
  return localStorage.getItem('portfolio_auth') === 'user';
}

function updateEditControlsUI() {
  const isUser = isLoggedUser();
  const editControls = document.getElementById('edit-controls');
  if (editControls) {
    editControls.style.display = isUser ? 'flex' : 'none';
  }
  if (!isUser && window.__editMode) {
    setEditMode(false);
  }
}

function setEditMode(on) {
  if (on && !isLoggedUser()) return;
  window.__editMode = !!on;

  document.querySelectorAll('[data-editable]').forEach(el => {
    el.contentEditable = on ? 'true' : 'false';
    el.classList.toggle('is-editing', on);
  });

  const btnToggle = document.getElementById('btn-toggle-edit');
  const btnSave = document.getElementById('btn-save-edit');
  if (btnToggle) {
    btnToggle.textContent = on ? '✏️ Editando…' : '✏️ Editar';
    btnToggle.classList.toggle('active', on);
  }
  if (btnSave) {
    btnSave.style.display = on ? 'inline-flex' : 'none';
  }

  document.body.classList.toggle('edit-mode-on', on);
}

function toggleEditMode() {
  if (!isLoggedUser()) {
    alert('Solo los usuarios con sesión pueden editar.');
    return;
  }
  setEditMode(!window.__editMode);
}

function saveEdits() {
  if (!isLoggedUser()) {
    alert('Solo los usuarios con sesión pueden guardar.');
    return;
  }

  // Cargar lo ya guardado y fusionar (para no borrar textos de otras páginas)
  let data = {};
  try {
    const raw = localStorage.getItem('holofolio_content');
    if (raw) data = JSON.parse(raw);
  } catch (e) {}

  document.querySelectorAll('[data-editable]').forEach(el => {
    const key = el.getAttribute('data-editable');
    if (key) data[key] = el.innerHTML;
  });

  localStorage.setItem('holofolio_content', JSON.stringify(data));
  setEditMode(false);

  const btn = document.getElementById('btn-save-edit');
  if (btn) {
    const prev = btn.textContent;
    btn.textContent = '✅ Guardado';
    setTimeout(() => { btn.textContent = prev; }, 1500);
  }
}

function loadSavedContent() {
  try {
    const raw = localStorage.getItem('holofolio_content');
    if (!raw) return;
    const data = JSON.parse(raw);
    Object.keys(data).forEach(key => {
      const el = document.querySelector(`[data-editable="${key}"]`);
      if (el) el.innerHTML = data[key];
    });
  } catch (e) {
    console.warn('No se pudo cargar contenido guardado', e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateEditControlsUI();
  loadSavedContent();
});

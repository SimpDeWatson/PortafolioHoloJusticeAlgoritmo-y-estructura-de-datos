/* edit.js — edición de textos (solo localStorage, sin descargas ni GitHub) */
const EDIT_STORAGE_KEY = 'portfolio_edits_v1';

function isEditUser() {
  return localStorage.getItem('portfolio_auth') === 'user';
}

function getLocalEdits() {
  try {
    return JSON.parse(localStorage.getItem(EDIT_STORAGE_KEY) || '{}');
  } catch (e) {
    return {};
  }
}

function setLocalEdits(obj) {
  localStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(obj || {}));
}

function collectEditsFromDom() {
  const data = getLocalEdits();
  document.querySelectorAll('[data-editable]').forEach((el) => {
    const key = el.getAttribute('data-editable');
    if (!key) return;
    data[key] = el.innerText.trim();
  });
  return data;
}

function applyEdits(data) {
  if (!data) return;
  document.querySelectorAll('[data-editable]').forEach((el) => {
    const key = el.getAttribute('data-editable');
    if (key && data[key] != null && data[key] !== '') {
      el.innerText = data[key];
    }
  });
}

function updateEditControlsUI() {
  const isUser = isEditUser();
  const editControls = document.getElementById('edit-controls');
  if (editControls) editControls.style.display = isUser ? 'flex' : 'none';
  if (!isUser) {
    document.body.classList.remove('edit-mode');
    document.querySelectorAll('[data-editable]').forEach((el) => {
      el.contentEditable = 'false';
    });
    const btnSave = document.getElementById('btn-save-edit');
    const btnToggle = document.getElementById('btn-toggle-edit');
    if (btnSave) btnSave.style.display = 'none';
    if (btnToggle) btnToggle.textContent = '✏️ Editar';
  }
}

function toggleEditMode() {
  if (!isEditUser()) return;
  const on = document.body.classList.toggle('edit-mode');
  document.querySelectorAll('[data-editable]').forEach((el) => {
    el.contentEditable = on ? 'true' : 'false';
  });
  const btnSave = document.getElementById('btn-save-edit');
  const btnToggle = document.getElementById('btn-toggle-edit');
  if (btnSave) btnSave.style.display = on ? 'inline-flex' : 'none';
  if (btnToggle) btnToggle.textContent = on ? '✏️ Terminando…' : '✏️ Editar';
}

function saveEdits() {
  if (!isEditUser()) return;
  const data = collectEditsFromDom();
  setLocalEdits(data);

  document.body.classList.remove('edit-mode');
  document.querySelectorAll('[data-editable]').forEach((el) => {
    el.contentEditable = 'false';
  });
  const btnSave = document.getElementById('btn-save-edit');
  const btnToggle = document.getElementById('btn-toggle-edit');
  if (btnSave) btnSave.style.display = 'none';
  if (btnToggle) btnToggle.textContent = '✏️ Editar';

}

document.addEventListener('DOMContentLoaded', () => {
  applyEdits(getLocalEdits());
  updateEditControlsUI();
});

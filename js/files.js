/* =========================================
   files.js — Archivos por semana (sin token)
   - Listar y mostrar: desde GitHub (repo público, sin auth)
   - Subir / borrar: se hace en la web de GitHub (enlace directo)
   ========================================= */

const GH_OWNER = 'SimpDeWatson';
const GH_REPO = 'PortafolioHoloAdvent_BaseDeDatosII';
const GH_BRANCH = 'main';

function getWeekKeyFromPage() {
  const el = document.getElementById('week-files-root');
  if (el && el.dataset.week) return el.dataset.week;
  const m = location.pathname.match(/semana(\d+)/i);
  return m ? `semana${m[1]}` : 'semana0';
}

function weekFolderName(weekKey) {
  const m = String(weekKey).match(/(\d+)/);
  return m ? `Semana${m[1]}` : 'Semana0';
}

function folderPath(weekKey) {
  return `pages/${weekFolderName(weekKey)}`;
}

function githubUploadUrl(weekKey) {
  return `https://github.com/${GH_OWNER}/${GH_REPO}/upload/${GH_BRANCH}/${folderPath(weekKey)}`;
}

function githubFolderUrl(weekKey) {
  return `https://github.com/${GH_OWNER}/${GH_REPO}/tree/${GH_BRANCH}/${folderPath(weekKey)}`;
}

function githubDeleteUrl(path) {
  // Página del archivo; el usuario puede borrar desde allí si está logueado en GitHub
  return `https://github.com/${GH_OWNER}/${GH_REPO}/blob/${GH_BRANCH}/${path}`;
}

function guessType(name) {
  const n = (name || '').toLowerCase();
  if (/\.png$/.test(n)) return 'image/png';
  if (/\.jpe?g$/.test(n)) return 'image/jpeg';
  if (/\.gif$/.test(n)) return 'image/gif';
  if (/\.webp$/.test(n)) return 'image/webp';
  if (/\.svg$/.test(n)) return 'image/svg+xml';
  if (/\.pdf$/.test(n)) return 'application/pdf';
  return 'application/octet-stream';
}

function isImageType(type, name) {
  if (type && type.startsWith('image/')) return true;
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name || '');
}

function isPdfType(type, name) {
  if (type === 'application/pdf') return true;
  return /\.pdf$/i.test(name || '');
}

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function filesIsUser() {
  return localStorage.getItem('portfolio_auth') === 'user';
}

/** Obtiene URL visualizable (PDF de GitHub suele forzar descarga; lo convertimos a blob) */
async function getEmbedUrl(rec) {
  const url = rec.url;
  if (!url) return null;

  if (isPdfType(rec.type, rec.name)) {
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error('fetch failed');
      const buf = await res.arrayBuffer();
      const blob = new Blob([buf], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch (e) {
      console.warn('PDF blob fallback', e);
      // Visor PDF.js (no descarga automática)
      return 'https://mozilla.github.io/pdf.js/web/viewer.html?file=' + encodeURIComponent(url);
    }
  }

  if (isImageType(rec.type, rec.name)) {
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      const typed = blob.type && blob.type.startsWith('image/')
        ? blob
        : new Blob([await blob.arrayBuffer()], { type: rec.type || 'image/png' });
      return URL.createObjectURL(typed);
    } catch (e) {
      return url;
    }
  }

  return url;
}


/** Lista archivos de la carpeta SemanaN en GitHub (API pública, sin token) */
async function listGithubWeekFiles(weekKey) {
  const folder = folderPath(weekKey);
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${folder}?ref=${GH_BRANCH}`,
      { headers: { Accept: 'application/vnd.github+json' } }
    );
    if (res.status === 404) return [];
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .filter(item => item.type === 'file' && item.name.toLowerCase() !== 'readme.txt')
      .map(item => ({
        id: item.sha,
        name: item.name,
        type: guessType(item.name),
        size: item.size || 0,
        path: item.path,
        url: item.download_url,
        htmlUrl: item.html_url
      }));
  } catch (e) {
    console.warn('No se pudo listar archivos de GitHub', e);
    return [];
  }
}

function openGithubUpload() {
  const weekKey = getWeekKeyFromPage();
  window.open(githubUploadUrl(weekKey), '_blank', 'noopener');
}

function openGithubFolder() {
  const weekKey = getWeekKeyFromPage();
  window.open(githubFolderUrl(weekKey), '_blank', 'noopener');
}

async function renderWeekFiles() {
  const root = document.getElementById('week-files-root');
  if (!root) return;

  const weekKey = getWeekKeyFromPage();
  const isUser = filesIsUser();

  const emptyHint = root.querySelector('.files-empty-hint');
  const gallery = root.querySelector('.files-gallery');
  const uploadPanel = root.querySelector('.files-upload-panel');

  // Panel de acciones: visible sobre todo para usuario; invitados pueden ver/abrir carpeta
  if (uploadPanel) {
    uploadPanel.style.display = 'block';
    const userOnly = uploadPanel.querySelectorAll('.user-only');
    userOnly.forEach(el => {
      el.style.display = isUser ? '' : 'none';
    });
  }

  if (!gallery) return;
  gallery.innerHTML = '';

  const list = await listGithubWeekFiles(weekKey);

  if (!list.length) {
    if (emptyHint) emptyHint.style.display = 'block';
    return;
  }
  if (emptyHint) emptyHint.style.display = 'none';

  for (const rec of list) {
    const card = document.createElement('div');
    card.className = 'file-card';

    const header = document.createElement('div');
    header.className = 'file-card-header';
    header.innerHTML = `<span class="file-name">🌐 ${escapeHtml(rec.name)}</span>
      <span class="file-size">${formatSize(rec.size || 0)}</span>`;

    if (isUser) {
      const del = document.createElement('a');
      del.className = 'file-delete-btn';
      del.title = 'Abrir en GitHub para eliminar';
      del.textContent = '🗑️';
      del.href = rec.htmlUrl || githubDeleteUrl(rec.path);
      del.target = '_blank';
      del.rel = 'noopener';
      header.appendChild(del);
    }

    card.appendChild(header);

    const body = document.createElement('div');
    body.className = 'file-card-body';
    body.innerHTML = '<p class="files-hint-small">Cargando vista previa…</p>';
    card.appendChild(body);
    gallery.appendChild(card);

    const embedUrl = await getEmbedUrl(rec);
    body.innerHTML = '';

    const rawUrl = rec.url || embedUrl || '';
    const viewUrl = embedUrl || rawUrl;
    const isImg = isImageType(rec.type, rec.name);
    const isPdf = isPdfType(rec.type, rec.name);

    if (isImg && embedUrl) {
      const img = document.createElement('img');
      img.src = embedUrl;
      img.alt = rec.name;
      img.className = 'file-preview-img';
      img.style.cursor = 'zoom-in';
      img.title = 'Clic para ampliar';
      img.addEventListener('click', () => openFullView(viewUrl, rawUrl, rec.name, 'image'));
      body.appendChild(img);
    } else if (isPdf && embedUrl) {
      const frame = document.createElement('iframe');
      frame.src = embedUrl;
      frame.className = 'file-preview-pdf';
      frame.title = rec.name;
      frame.setAttribute('allow', 'fullscreen');
      body.appendChild(frame);
    } else if (embedUrl) {
      const link = document.createElement('a');
      link.href = embedUrl;
      link.target = '_blank';
      link.rel = 'noopener';
      link.className = 'file-download-link';
      link.textContent = '🔗 Abrir archivo';
      body.appendChild(link);
    } else {
      body.innerHTML = '<p class="files-hint-small">No se pudo mostrar este archivo.</p>';
    }

    // Acciones por archivo: ampliar / zoom / descargar
    const actions = document.createElement('div');
    actions.className = 'file-card-actions';

    if (viewUrl && (isImg || isPdf)) {
      const btnView = document.createElement('button');
      btnView.type = 'button';
      btnView.className = 'btn-file-action';
      btnView.textContent = isPdf ? '📄 Ampliar PDF' : '🔍 Ampliar';
      btnView.addEventListener('click', () => openFullView(viewUrl, rawUrl, rec.name, isPdf ? 'pdf' : 'image'));
      actions.appendChild(btnView);
    }
    if (rawUrl) {
      const btnDl = document.createElement('a');
      btnDl.className = 'btn-file-action btn-file-download';
      btnDl.textContent = '⬇️ Descargar';
      btnDl.href = rawUrl;
      btnDl.setAttribute('download', rec.name);
      btnDl.target = '_blank';
      btnDl.rel = 'noopener';
      actions.appendChild(btnDl);
    }
    card.appendChild(actions);
  }
}

/** Visor ampliado con zoom (imagen) y descarga — no toca fondos de la página */
function openFullView(viewUrl, downloadUrl, name, kind) {
  let overlay = document.getElementById('file-fullview-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'file-fullview-overlay';
    overlay.innerHTML = `
      <div class="file-fullview-backdrop" data-close></div>
      <div class="file-fullview-panel">
        <div class="file-fullview-bar">
          <span class="file-fullview-title"></span>
          <div class="file-fullview-btns">
            <button type="button" class="btn-file-action" data-zoom-out title="Alejar">−</button>
            <span class="file-zoom-label">100%</span>
            <button type="button" class="btn-file-action" data-zoom-in title="Acercar">+</button>
            <button type="button" class="btn-file-action" data-zoom-reset title="Restablecer">100%</button>
            <a class="btn-file-action btn-file-download" data-dl target="_blank" rel="noopener">⬇️ Descargar</a>
            <button type="button" class="btn-file-action" data-close>✕ Cerrar</button>
          </div>
        </div>
        <div class="file-fullview-content"></div>
      </div>`;
    document.body.appendChild(overlay);

    const close = () => {
      overlay.classList.remove('open');
      const content = overlay.querySelector('.file-fullview-content');
      content.innerHTML = '';
      content.onclick = null;
      overlay._zoom = 1;
      const lbl = overlay.querySelector('.file-zoom-label');
      if (lbl) lbl.textContent = '100%';
    };
    overlay.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', close));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });

    const applyZoom = () => {
      const z = overlay._zoom || 1;
      const lbl = overlay.querySelector('.file-zoom-label');
      if (lbl) lbl.textContent = Math.round(z * 100) + '%';
      const img = overlay.querySelector('.file-fullview-content img');
      if (img) {
        img.style.transform = `scale(${z})`;
        img.style.transformOrigin = 'center center';
      }
      const frame = overlay.querySelector('.file-fullview-content iframe');
      // PDF: zoom via CSS scale on wrapper
      if (frame && overlay._kind === 'pdf') {
        frame.style.transform = `scale(${z})`;
        frame.style.transformOrigin = 'top center';
        frame.style.width = (100 / z) + '%';
        frame.style.height = (100 / z) + '%';
      }
    };
    overlay.querySelector('[data-zoom-in]').addEventListener('click', () => {
      overlay._zoom = Math.min(4, (overlay._zoom || 1) + 0.25);
      applyZoom();
    });
    overlay.querySelector('[data-zoom-out]').addEventListener('click', () => {
      overlay._zoom = Math.max(0.5, (overlay._zoom || 1) - 0.25);
      applyZoom();
    });
    overlay.querySelector('[data-zoom-reset]').addEventListener('click', () => {
      overlay._zoom = 1;
      applyZoom();
    });

    // Rueda del ratón para zoom en imagen
    overlay.querySelector('.file-fullview-content').addEventListener('wheel', (e) => {
      if (!overlay.classList.contains('open')) return;
      e.preventDefault();
      if (e.deltaY < 0) overlay._zoom = Math.min(4, (overlay._zoom || 1) + 0.1);
      else overlay._zoom = Math.max(0.5, (overlay._zoom || 1) - 0.1);
      applyZoom();
    }, { passive: false });
  }

  overlay._zoom = 1;
  overlay._kind = kind;
  overlay.querySelector('.file-fullview-title').textContent = name || '';
  const dl = overlay.querySelector('[data-dl]');
  dl.href = downloadUrl || viewUrl;
  dl.setAttribute('download', name || 'archivo');

  const content = overlay.querySelector('.file-fullview-content');
  content.innerHTML = '';
  content.classList.toggle('is-pdf', kind === 'pdf');

  if (kind === 'image') {
    const img = document.createElement('img');
    img.src = viewUrl;
    img.alt = name || '';
    content.appendChild(img);
  } else {
    const frame = document.createElement('iframe');
    frame.src = viewUrl;
    frame.title = name || 'PDF';
    frame.setAttribute('allow', 'fullscreen');
    content.appendChild(frame);
  }
  const lbl = overlay.querySelector('.file-zoom-label');
  if (lbl) lbl.textContent = '100%';
  overlay.classList.add('open');
}

function initWeekFilesUI() {
  const root = document.getElementById('week-files-root');
  if (!root) return;

  const panel = root.querySelector('.files-upload-panel');
  if (panel) {
    // Reconstruir panel sin input de archivo local ni token
    panel.innerHTML = `
      <div class="files-dropzone files-gh-actions">
        <p>Los archivos se gestionan en la carpeta de esta semana en GitHub.</p>
        <div class="files-tools">
          <button type="button" class="btn-upload user-only" id="btn-gh-upload">⬆️ Subir en GitHub</button>
          <button type="button" class="btn-gh-token" id="btn-gh-folder">📂 Ver carpeta</button>
          <button type="button" class="btn-gh-token" id="btn-gh-refresh">🔄 Actualizar lista</button>
        </div>
        <p class="files-hint-small user-only">Se abrirá GitHub. Sube el archivo ahí y vuelve a esta página → Actualizar lista.</p>
      </div>
    `;
    const up = panel.querySelector('#btn-gh-upload');
    const folder = panel.querySelector('#btn-gh-folder');
    const refresh = panel.querySelector('#btn-gh-refresh');
    if (up) up.addEventListener('click', openGithubUpload);
    if (folder) folder.addEventListener('click', openGithubFolder);
    if (refresh) refresh.addEventListener('click', () => {
      refresh.textContent = '⏳ ...';
      renderWeekFiles().finally(() => { refresh.textContent = '🔄 Actualizar lista'; });
    });
  }

  renderWeekFiles();
}

document.addEventListener('DOMContentLoaded', initWeekFilesUI);

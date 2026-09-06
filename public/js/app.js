document.addEventListener('DOMContentLoaded', () => {
  console.log('SocialFinder AI — Clean Search UI Initialized');

  const fileInput = document.getElementById('file-input');
  const dropzone = document.getElementById('dropzone');
  const previewContainer = document.getElementById('preview-container');
  const previewImg = document.getElementById('preview-img');
  const previewName = document.getElementById('preview-name');
  const btnChangePhoto = document.getElementById('btn-change-photo');
  const btnSearch = document.getElementById('btn-search');
  const scanningBox = document.getElementById('scanning-box');
  const resultsSection = document.getElementById('results-section');
  const resultsCountText = document.getElementById('results-count-text');
  const matchesGrid = document.getElementById('matches-grid');
  const btnNewSearch = document.getElementById('btn-new-search');

  let currentFile = null;

  // ── Drag and Drop handlers ──
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleSelectedFile(files[0]);
    }
  });

  dropzone.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleSelectedFile(e.target.files[0]);
    }
  });

  btnChangePhoto.addEventListener('click', () => {
    resetSelection();
    fileInput.click();
  });

  function handleSelectedFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPG, PNG, WEBP).');
      return;
    }
    currentFile = file;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      previewName.textContent = file.name;
      dropzone.style.display = 'none';
      previewContainer.style.display = 'flex';
      btnSearch.disabled = false;
    };
    reader.readAsDataURL(file);
  }

  function resetSelection() {
    currentFile = null;
    fileInput.value = '';
    previewImg.src = '';
    previewContainer.style.display = 'none';
    dropzone.style.display = 'flex';
    btnSearch.disabled = true;
    scanningBox.style.display = 'none';

    // Hide results and toolbars
    const identityBanner = document.getElementById('identity-banner');
    const deepEnginesBar = document.getElementById('deep-engines-bar');
    if (identityBanner) identityBanner.style.display = 'none';
    if (deepEnginesBar) deepEnginesBar.style.display = 'none';
  }

  // ── Brand Icons Helper ──
  function getPlatformIcon(platform) {
    const p = (platform || '').toLowerCase();
    if (p.includes('facebook')) {
      return `<svg width="34" height="34" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`;
    }
    if (p.includes('youtube')) {
      return `<svg width="34" height="34" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`;
    }
    if (p.includes('telegram')) {
      return `<svg width="34" height="34" viewBox="0 0 24 24" fill="#229ED9"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.716-.962 4.084-1.362 5.795-.168.724-.44 1.04-.703 1.064-.572.053-1.006-.378-1.561-.742-.868-.569-1.358-.923-2.199-1.477-.972-.64-.342-.992.212-1.568.145-.151 2.666-2.444 2.715-2.653.006-.026.011-.125-.048-.178-.059-.052-.146-.034-.209-.02-.089.02-1.504.957-4.246 2.808-.402.276-.766.411-1.092.404-.36-.008-1.052-.204-1.567-.371-.631-.206-1.133-.314-1.089-.663.023-.182.272-.368.747-.56 2.925-1.274 4.876-2.115 5.854-2.523 2.788-1.159 3.367-1.36 3.745-1.366.083-.001.268.02.388.118.101.082.129.193.136.271.007.086.002.176-.001.203z"/></svg>`;
    }
    if (p.includes('instagram')) {
      return `<svg width="34" height="34" viewBox="0 0 24 24" fill="#E4405F"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`;
    }
    if (p.includes('tiktok')) {
      return `<svg width="34" height="34" viewBox="0 0 24 24" fill="#ffffff"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.83 4.45 6.3 6.3 0 0 0 1.87-4.48V8.69a8.18 8.18 0 0 0 4.78 1.52v-3.4a4.85 4.85 0 0 1-.89-.12z"/></svg>`;
    }
    return `<svg width="30" height="30" viewBox="0 0 24 24" fill="#ffffff"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;
  }

  // ── Search Submission ──
  btnSearch.addEventListener('click', async () => {
    if (!currentFile) return;

    btnSearch.disabled = true;
    btnSearch.style.display = 'none';
    scanningBox.style.display = 'block';

    const formData = new FormData();
    formData.append('file', currentFile);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scan image. Please try again.');
      }

      renderResults(data);
    } catch (err) {
      console.error(err);
      alert(err.message || 'An error occurred while scanning. Please try another image.');
      btnSearch.disabled = false;
      btnSearch.style.display = 'flex';
      scanningBox.style.display = 'none';
    }
  });

  function renderResults(data) {
    scanningBox.style.display = 'none';
    btnSearch.style.display = 'flex';
    btnSearch.disabled = false;
    matchesGrid.innerHTML = '';

    const matches = data.matches || [];
    const identityTags = data.identityTags || [];
    const deepLinks = data.deepSearchLinks || {};

    // 1. Render Identity Tags Banner
    const identityBanner = document.getElementById('identity-banner');
    const identityTagsList = document.getElementById('identity-tags-list');
    if (identityTags && identityTags.length > 0) {
      identityTagsList.innerHTML = '';
      identityTags.forEach(tag => {
        const pill = document.createElement('span');
        pill.className = 'identity-tag-pill';
        pill.textContent = tag;
        identityTagsList.appendChild(pill);
      });
      identityBanner.style.display = 'block';
    } else {
      identityBanner.style.display = 'none';
    }

    // 2. Render Deep Reverse Search Engines Toolbar
    const deepEnginesBar = document.getElementById('deep-engines-bar');
    if (deepLinks.googleLens || deepLinks.yandex || deepLinks.bing || deepLinks.facecheck) {
      if (document.getElementById('link-facecheck')) {
        document.getElementById('link-facecheck').href = deepLinks.facecheck || 'https://facecheck.id';
      }
      document.getElementById('link-google-lens').href = deepLinks.googleLens || '#';
      document.getElementById('link-yandex').href = deepLinks.yandex || '#';
      document.getElementById('link-bing').href = deepLinks.bing || '#';
      document.getElementById('link-tineye').href = deepLinks.tineye || '#';
      deepEnginesBar.style.display = 'block';
    } else {
      deepEnginesBar.style.display = 'none';
    }

    // 3. Render Matches Cards
    if (matches.length === 0) {
      resultsCountText.textContent = 'No direct social media matches found for this photo.';
      matchesGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: rgba(15, 23, 42, 0.4); border-radius: 1.25rem; border: 1px solid rgba(255, 255, 255, 0.08);">
          <p style="color: #94a3b8; font-size: 1.1rem; margin-bottom: 1rem;">No public social accounts automatically matched this image.</p>
          <p style="color: #64748b; font-size: 0.9rem;">You can use the multi-engine reverse search buttons above to explore live results on Google Lens and Yandex.</p>
        </div>
      `;
    } else {
      resultsCountText.textContent = `Found ${matches.length} matching profile${matches.length === 1 ? '' : 's'} across social networks`;

      matches.forEach(match => {
        const card = document.createElement('div');
        card.className = 'card-match';

        const avatarSrc = match.base64 ? (match.base64.startsWith('http') ? match.base64 : `data:image/jpeg;base64,${match.base64}`) : '';
        const platformIcon = getPlatformIcon(match.platform);

        card.innerHTML = `
          <div class="match-avatar-frame">
            ${avatarSrc ? `
              <img src="${avatarSrc}" referrerpolicy="no-referrer" alt="${match.username}" class="match-avatar-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
              <div style="display:none; width: 100%; height: 100%; align-items: center; justify-content: center; background: #0f172a;">${platformIcon}</div>
            ` : `
              <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #0f172a;">${platformIcon}</div>
            `}
          </div>
          <div class="match-username" title="${match.title || match.username}">${match.username}</div>
          <div class="match-meta">
            <span>${match.platform}</span> &bull; <span>${match.score}% Match</span>
          </div>
          <a href="${match.url}" target="_blank" rel="noopener noreferrer" class="btn-profile">
            ${match.platform === 'YouTube' ? 'Watch Video &nearr;' : 'Open Profile &nearr;'}
          </a>
        `;

        matchesGrid.appendChild(card);
      });
    }

    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  btnNewSearch.addEventListener('click', () => {
    resetSelection();
    resultsSection.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

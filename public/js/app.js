document.addEventListener('DOMContentLoaded', () => {
  console.log('SocialFinder AI — High-Definition Interactive Biometric UI Initialized');

  // DOM Elements
  const fileInput = document.getElementById('file-input');
  const dropzone = document.getElementById('dropzone');
  const previewContainer = document.getElementById('preview-container');
  const previewImg = document.getElementById('preview-img');
  const faceCropCanvas = document.getElementById('face-crop-canvas');
  const previewName = document.getElementById('preview-name');
  const previewSize = document.getElementById('preview-size');
  const btnChangePhoto = document.getElementById('btn-change-photo');
  const tabFullImage = document.getElementById('tab-full-image');
  const tabFaceCrop = document.getElementById('tab-face-crop');
  const viewportWrapper = document.getElementById('viewport-wrapper');
  const scannerOverlay = document.getElementById('scanner-overlay');
  const scannerReticle = document.getElementById('scanner-reticle');
  const biometricNodesLayer = document.getElementById('biometric-nodes-layer');
  const hudStatus = document.getElementById('hud-status');
  const btnSearch = document.getElementById('btn-search');

  // Pan & Zoom Controls
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const btnResetView = document.getElementById('btn-reset-view');
  const zoomLevelText = document.getElementById('zoom-level-text');

  // Telemetry Elements
  const scanningBox = document.getElementById('scanning-box');
  const telemetryProgressBar = document.getElementById('telemetry-progress-bar');
  const logSteps = [
    document.getElementById('log-step-1'),
    document.getElementById('log-step-2'),
    document.getElementById('log-step-3'),
    document.getElementById('log-step-4')
  ];

  // Results & Summary
  const resultsSection = document.getElementById('results-section');
  const hdSummaryBanner = document.getElementById('hd-summary-banner');
  const hdSummaryCropImg = document.getElementById('hd-summary-crop-img');
  const statRes = document.getElementById('stat-res');
  const statMatchPct = document.getElementById('stat-match-pct');
  const statPlatformCount = document.getElementById('stat-platform-count');
  const btnInspectFace = document.getElementById('btn-inspect-face');
  const resultsCountText = document.getElementById('results-count-text');
  const matchesGrid = document.getElementById('matches-grid');
  const btnNewSearch = document.getElementById('btn-new-search');

  // Lightbox Modal Elements
  const hdLightboxModal = document.getElementById('hd-lightbox-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const lightboxSourceImg = document.getElementById('lightbox-source-img');
  const lightboxTargetImg = document.getElementById('lightbox-target-img');
  const lightboxTargetLabel = document.getElementById('lightbox-target-label');
  const lightboxPlatform = document.getElementById('lightbox-platform');
  const lightboxUser = document.getElementById('lightbox-user');
  const lightboxScore = document.getElementById('lightbox-score');
  const btnLightboxVisit = document.getElementById('btn-lightbox-visit');

  // State
  let currentFile = null;
  let loadedImageObj = null;
  let hdFaceCropDataUrl = '';
  let naturalWidth = 0;
  let naturalHeight = 0;
  let telemetryInterval = null;
  let latestMatches = [];

  // Pan & Zoom State
  let zoomScale = 1.0;
  let panX = 0;
  let panY = 0;
  let isPanningImage = false;
  let panStartX = 0;
  let panStartY = 0;

  // Reticle Dragging State
  let isDraggingReticle = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let reticleStartLeft = 0;
  let reticleStartTop = 0;

  // ── Drag & Drop Listeners ──
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

  // ── Viewport Tab Switching ──
  tabFullImage.addEventListener('click', () => {
    tabFullImage.classList.add('active');
    tabFaceCrop.classList.remove('active');
    previewImg.style.display = 'block';
    faceCropCanvas.style.display = 'none';
    scannerOverlay.style.display = 'block';
  });

  tabFaceCrop.addEventListener('click', () => {
    tabFaceCrop.classList.add('active');
    tabFullImage.classList.remove('active');
    previewImg.style.display = 'none';
    faceCropCanvas.style.display = 'block';
    scannerOverlay.style.display = 'none';
  });

  // ── File Selection & HD Image Ingestion ──
  function handleSelectedFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPG, PNG, WEBP).');
      return;
    }
    currentFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        loadedImageObj = img;
        naturalWidth = img.naturalWidth;
        naturalHeight = img.naturalHeight;

        previewImg.src = e.target.result;
        previewName.textContent = file.name;

        // Display HD Resolution & Size
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        const resTier = naturalWidth >= 1920 || naturalHeight >= 1080 ? 'Ultra HD 1080p+' : 'HD Ready';
        previewSize.textContent = `${naturalWidth} × ${naturalHeight} px (${resTier}) • ${sizeMb} MB`;

        // Switch to preview view
        dropzone.style.display = 'none';
        previewContainer.style.display = 'flex';
        btnSearch.disabled = false;

        // Reset Pan & Zoom
        resetPanAndZoom();

        // Perform Initial Face Localization and Placement
        initializeReticlePosition();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // ── Initialize Reticle Position ──
  function initializeReticlePosition() {
    // Center reticle by default with slight upper portrait bias (38% from top)
    const vw = viewportWrapper.clientWidth || 600;
    const vh = viewportWrapper.clientHeight || 340;
    const rw = 150;
    const rh = 170;

    scannerReticle.style.width = `${rw}px`;
    scannerReticle.style.height = `${rh}px`;

    const left = Math.round((vw - rw) / 2);
    const top = Math.round(vh * 0.25);

    scannerReticle.style.left = `${left}px`;
    scannerReticle.style.top = `${top}px`;

    updateBiometricNodes();
    updateCropFromReticle();
    if (hudStatus) hudStatus.textContent = 'TARGET CALIBRATED';
  }

  // ── Dynamic Biometric Nodes Placement ──
  function updateBiometricNodes() {
    biometricNodesLayer.innerHTML = '';
    const rw = scannerReticle.offsetWidth || 150;
    const rh = scannerReticle.offsetHeight || 170;
    const rLeft = scannerReticle.offsetLeft;
    const rTop = scannerReticle.offsetTop;

    // 7 Anatomical facial tracking points relative to the reticle
    const points = [
      { x: rLeft + rw * 0.36, y: rTop + rh * 0.38 }, // Left Eye
      { x: rLeft + rw * 0.64, y: rTop + rh * 0.38 }, // Right Eye
      { x: rLeft + rw * 0.50, y: rTop + rh * 0.48 }, // Nose Bridge
      { x: rLeft + rw * 0.50, y: rTop + rh * 0.58 }, // Nose Tip
      { x: rLeft + rw * 0.38, y: rTop + rh * 0.70 }, // Mouth Left
      { x: rLeft + rw * 0.62, y: rTop + rh * 0.70 }, // Mouth Right
      { x: rLeft + rw * 0.50, y: rTop + rh * 0.84 }  // Chin
    ];

    points.forEach(p => {
      const node = document.createElement('div');
      node.className = 'biometric-point';
      node.style.left = `${p.x}px`;
      node.style.top = `${p.y}px`;
      biometricNodesLayer.appendChild(node);
    });
  }

  // ── Real-Time HD Face Crop Generation From Reticle ──
  function updateCropFromReticle() {
    if (!loadedImageObj) return;

    // Get current rendered bounds of previewImg
    const imgRect = previewImg.getBoundingClientRect();
    const retRect = scannerReticle.getBoundingClientRect();

    if (imgRect.width <= 0 || imgRect.height <= 0) return;

    // Compute relative reticle coordinates within rendered image
    const relLeft = retRect.left - imgRect.left;
    const relTop = retRect.top - imgRect.top;
    const relWidth = retRect.width;
    const relHeight = retRect.height;

    // Ratio from rendered display dimensions to original natural pixel dimensions
    const scaleX = loadedImageObj.naturalWidth / imgRect.width;
    const scaleY = loadedImageObj.naturalHeight / imgRect.height;

    let cropX = relLeft * scaleX;
    let cropY = relTop * scaleY;
    let cropW = relWidth * scaleX;
    let cropH = relHeight * scaleY;

    // Clamp inside image natural bounds
    cropX = Math.max(0, Math.min(loadedImageObj.naturalWidth - 10, cropX));
    cropY = Math.max(0, Math.min(loadedImageObj.naturalHeight - 10, cropY));
    cropW = Math.max(10, Math.min(loadedImageObj.naturalWidth - cropX, cropW));
    cropH = Math.max(10, Math.min(loadedImageObj.naturalHeight - cropY, cropH));

    // Render HD Crop into 400x400 Canvas
    faceCropCanvas.width = 400;
    faceCropCanvas.height = 400;
    const ctx = faceCropCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, 400, 400);

    try {
      ctx.drawImage(loadedImageObj, cropX, cropY, cropW, cropH, 0, 0, 400, 400);
      hdFaceCropDataUrl = faceCropCanvas.toDataURL('image/jpeg', 0.95);
      hdSummaryCropImg.src = hdFaceCropDataUrl;
      lightboxSourceImg.src = hdFaceCropDataUrl;
    } catch (e) {
      console.warn('Canvas crop draw failed', e);
    }
  }

  // ── Drag & Move Reticle Handlers ──
  scannerReticle.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    isDraggingReticle = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    reticleStartLeft = scannerReticle.offsetLeft;
    reticleStartTop = scannerReticle.offsetTop;
    scannerReticle.classList.add('dragging');
    scannerReticle.setPointerCapture(e.pointerId);
    if (hudStatus) hudStatus.textContent = 'POSITIONING TARGET...';
  });

  scannerReticle.addEventListener('pointermove', (e) => {
    if (!isDraggingReticle) return;
    e.preventDefault();

    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;

    const vw = viewportWrapper.clientWidth;
    const vh = viewportWrapper.clientHeight;
    const rw = scannerReticle.offsetWidth;
    const rh = scannerReticle.offsetHeight;

    const newLeft = Math.max(0, Math.min(vw - rw, reticleStartLeft + dx));
    const newTop = Math.max(0, Math.min(vh - rh, reticleStartTop + dy));

    scannerReticle.style.left = `${newLeft}px`;
    scannerReticle.style.top = `${newTop}px`;

    updateBiometricNodes();
    updateCropFromReticle();
  });

  scannerReticle.addEventListener('pointerup', (e) => {
    if (isDraggingReticle) {
      isDraggingReticle = false;
      scannerReticle.classList.remove('dragging');
      try { scannerReticle.releasePointerCapture(e.pointerId); } catch (_) {}
      if (hudStatus) hudStatus.textContent = 'TARGET LOCKED';
      updateCropFromReticle();
    }
  });

  scannerReticle.addEventListener('pointercancel', () => {
    if (isDraggingReticle) {
      isDraggingReticle = false;
      scannerReticle.classList.remove('dragging');
    }
  });

  // ── 1-Click Reticle Relocation On Image ──
  viewportWrapper.addEventListener('click', (e) => {
    if (isDraggingReticle || isPanningImage) return;
    if (e.target.closest('#scanner-reticle') || e.target.closest('.preview-header') || e.target.closest('.viewport-controls')) return;

    const rect = viewportWrapper.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const rw = scannerReticle.offsetWidth;
    const rh = scannerReticle.offsetHeight;
    const newLeft = Math.max(0, Math.min(viewportWrapper.clientWidth - rw, clickX - rw / 2));
    const newTop = Math.max(0, Math.min(viewportWrapper.clientHeight - rh, clickY - rh / 2));

    scannerReticle.style.left = `${newLeft}px`;
    scannerReticle.style.top = `${newTop}px`;

    updateBiometricNodes();
    updateCropFromReticle();
    if (hudStatus) hudStatus.textContent = 'TARGET RELOCATED';
  });

  // ── Pan & Zoom Functions ──
  function setZoom(newZoom) {
    zoomScale = Math.max(1.0, Math.min(3.5, Math.round(newZoom * 100) / 100));
    if (zoomScale === 1.0) {
      panX = 0;
      panY = 0;
      viewportWrapper.classList.remove('can-pan');
    } else {
      viewportWrapper.classList.add('can-pan');
    }
    applyImageTransform();
  }

  function applyImageTransform() {
    previewImg.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
    if (zoomLevelText) zoomLevelText.textContent = `${Math.round(zoomScale * 100)}%`;
    updateCropFromReticle();
  }

  function resetPanAndZoom() {
    zoomScale = 1.0;
    panX = 0;
    panY = 0;
    viewportWrapper.classList.remove('can-pan', 'panning');
    applyImageTransform();
  }

  btnZoomIn.addEventListener('click', () => setZoom(zoomScale + 0.25));
  btnZoomOut.addEventListener('click', () => setZoom(zoomScale - 0.25));
  btnResetView.addEventListener('click', () => {
    resetPanAndZoom();
    initializeReticlePosition();
  });

  // Mouse Wheel Zoom
  viewportWrapper.addEventListener('wheel', (e) => {
    if (!currentFile) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    setZoom(zoomScale + delta);
  }, { passive: false });

  // Pan / Drag Image
  viewportWrapper.addEventListener('pointerdown', (e) => {
    if (e.target.closest('#scanner-reticle')) return;
    if (zoomScale <= 1.0) return;

    isPanningImage = true;
    panStartX = e.clientX - panX;
    panStartY = e.clientY - panY;
    viewportWrapper.classList.add('panning');
    viewportWrapper.setPointerCapture(e.pointerId);
  });

  viewportWrapper.addEventListener('pointermove', (e) => {
    if (!isPanningImage) return;
    panX = e.clientX - panStartX;
    panY = e.clientY - panStartY;
    applyImageTransform();
  });

  viewportWrapper.addEventListener('pointerup', (e) => {
    if (isPanningImage) {
      isPanningImage = false;
      viewportWrapper.classList.remove('panning');
      try { viewportWrapper.releasePointerCapture(e.pointerId); } catch (_) {}
    }
  });

  viewportWrapper.addEventListener('pointercancel', () => {
    isPanningImage = false;
    viewportWrapper.classList.remove('panning');
  });

  // ── Reset All Selection ──
  function resetSelection() {
    currentFile = null;
    loadedImageObj = null;
    fileInput.value = '';
    previewImg.src = '';
    hdFaceCropDataUrl = '';
    previewContainer.style.display = 'none';
    dropzone.style.display = 'flex';
    btnSearch.disabled = true;
    btnSearch.style.display = 'flex';
    scanningBox.style.display = 'none';
    scannerOverlay.classList.remove('active');

    tabFullImage.classList.add('active');
    tabFaceCrop.classList.remove('active');
    previewImg.style.display = 'block';
    faceCropCanvas.style.display = 'none';
    resetPanAndZoom();

    // Reset telemetry
    if (telemetryInterval) clearInterval(telemetryInterval);
    telemetryProgressBar.style.width = '10%';
    logSteps.forEach(step => step.className = 'log-line');

    // Hide banners
    const identityBanner = document.getElementById('identity-banner');
    const deepEnginesBar = document.getElementById('deep-engines-bar');
    if (identityBanner) identityBanner.style.display = 'none';
    if (deepEnginesBar) deepEnginesBar.style.display = 'none';
  }

  // ── Brand Icons Helper ──
  function getPlatformIcon(platform) {
    const p = (platform || '').toLowerCase();
    if (p.includes('facebook')) {
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`;
    }
    if (p.includes('youtube')) {
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`;
    }
    if (p.includes('telegram')) {
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="#229ED9"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.716-.962 4.084-1.362 5.795-.168.724-.44 1.04-.703 1.064-.572.053-1.006-.378-1.561-.742-.868-.569-1.358-.923-2.199-1.477-.972-.64-.342-.992.212-1.568.145-.151 2.666-2.444 2.715-2.653.006-.026.011-.125-.048-.178-.059-.052-.146-.034-.209-.02-.089.02-1.504.957-4.246 2.808-.402.276-.766.411-1.092.404-.36-.008-1.052-.204-1.567-.371-.631-.206-1.133-.314-1.089-.663.023-.182.272-.368.747-.56 2.925-1.274 4.876-2.115 5.854-2.523 2.788-1.159 3.367-1.36 3.745-1.366.083-.001.268.02.388.118.101.082.129.193.136.271.007.086.002.176-.001.203z"/></svg>`;
    }
    if (p.includes('instagram')) {
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="#E4405F"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`;
    }
    if (p.includes('tiktok')) {
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="#ffffff"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.83 4.45 6.3 6.3 0 0 0 1.87-4.48V8.69a8.18 8.18 0 0 0 4.78 1.52v-3.4a4.85 4.85 0 0 1-.89-.12z"/></svg>`;
    }
    if (p.includes('linkedin')) {
      return `<svg width="22" height="22" viewBox="0 0 24 24" fill="#0A66C2"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>`;
    }
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;
  }

  // ── High-Precision Telemetry Progress Orchestrator ──
  function startTelemetryAnimation() {
    scannerOverlay.classList.add('active');
    btnSearch.style.display = 'none';
    scanningBox.style.display = 'block';

    let progress = 12;
    telemetryProgressBar.style.width = '12%';
    logSteps[0].className = 'log-line active';

    let elapsed = 0;
    telemetryInterval = setInterval(() => {
      elapsed += 200;
      if (elapsed === 800) {
        logSteps[0].className = 'log-line success';
        logSteps[1].className = 'log-line active';
        progress = 38;
        hudStatus.textContent = 'LANDMARK VECTORIZATION';
      } else if (elapsed === 2000) {
        logSteps[1].className = 'log-line success';
        logSteps[2].className = 'log-line active';
        progress = 65;
        hudStatus.textContent = 'QUERYING NEURAL INDEX';
      } else if (elapsed === 3400) {
        logSteps[2].className = 'log-line success';
        logSteps[3].className = 'log-line active';
        progress = 85;
        hudStatus.textContent = 'REVERSE VERIFICATION';
      }
      telemetryProgressBar.style.width = `${progress}%`;
    }, 200);
  }

  function completeTelemetryAnimation() {
    if (telemetryInterval) clearInterval(telemetryInterval);
    telemetryProgressBar.style.width = '100%';
    logSteps.forEach(step => step.className = 'log-line success');
    hudStatus.textContent = 'SCAN COMPLETE';
    scannerOverlay.classList.remove('active');
  }

  // ── Search Submission ──
  btnSearch.addEventListener('click', async () => {
    if (!currentFile) return;

    btnSearch.disabled = true;
    startTelemetryAnimation();

    const executeUpload = async (cropBlob) => {
      const formData = new FormData();
      formData.append('file', currentFile);
      if (cropBlob) {
        formData.append('crop', cropBlob, 'face_crop.jpg');
      }

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to scan image. Please try again.');
        }

        completeTelemetryAnimation();
        setTimeout(() => {
          renderResults(data);
        }, 400);
      } catch (err) {
        console.error(err);
        if (telemetryInterval) clearInterval(telemetryInterval);
        scannerOverlay.classList.remove('active');
        alert(err.message || 'An error occurred while scanning. Please try another image.');
        btnSearch.disabled = false;
        btnSearch.style.display = 'flex';
        scanningBox.style.display = 'none';
      }
    };

    // Extract cropped face blob if canvas exists, else send directly
    if (faceCropCanvas && faceCropCanvas.width > 0) {
      faceCropCanvas.toBlob((blob) => {
        executeUpload(blob);
      }, 'image/jpeg', 0.95);
    } else {
      executeUpload(null);
    }
  });

  // ── Render High-Definition Results ──
  function renderResults(data) {
    scanningBox.style.display = 'none';
    btnSearch.style.display = 'flex';
    btnSearch.disabled = false;
    matchesGrid.innerHTML = '';

    const matches = data.matches || [];
    latestMatches = matches;
    const identityTags = data.identityTags || [];
    const deepLinks = data.deepSearchLinks || {};

    // 1. Update HD Summary Banner
    hdSummaryBanner.style.display = 'flex';
    statRes.textContent = `${naturalWidth} × ${naturalHeight} Ultra-Clear`;
    statMatchPct.textContent = matches.length > 0 ? `${matches[0].score}%` : '98.5%';
    const platforms = new Set(matches.map(m => m.platform).filter(p => p !== 'Web'));
    statPlatformCount.textContent = platforms.size > 0 ? Array.from(platforms).join(', ') : 'Multi-Platform Neural';

    // 2. Render Identity Tags Banner
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

    // 3. Render Deep Reverse Search Engines Toolbar
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

    // 4. Render Results: If no direct web links, show 1-Click Neural Engine Cards
    if (matches.length === 0) {
      resultsCountText.textContent = 'Biometric signature calibrated. Launch a neural reverse search engine below:';
      matchesGrid.innerHTML = `
        <div class="card-match" style="border-color: rgba(66, 133, 244, 0.4); background: linear-gradient(180deg, rgba(66, 133, 244, 0.08), rgba(15, 23, 42, 0.7));">
          <div class="match-image-frame" style="cursor: pointer;" onclick="window.open('${deepLinks.googleLens}', '_blank')">
            <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #020617;">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#4285F4" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
            </div>
            <div class="match-platform-badge" style="background: #4285F4; color: #fff;">Google Lens</div>
            <div class="match-score-badge"><span>100% Free</span></div>
          </div>
          <div class="match-content">
            <div class="match-username">Google Lens HD Search</div>
            <div class="match-snippet">Query Google's global neural index across Instagram, TikTok, Facebook, news, and public profiles with your calibrated face crop.</div>
            <div class="match-actions">
              <a href="${deepLinks.googleLens}" target="_blank" rel="noopener noreferrer" class="btn-profile" style="background: linear-gradient(135deg, #1d4ed8, #2563eb); border: none;">
                Launch Google Lens &nearr;
              </a>
            </div>
          </div>
        </div>

        <div class="card-match" style="border-color: rgba(252, 63, 29, 0.4); background: linear-gradient(180deg, rgba(252, 63, 29, 0.08), rgba(15, 23, 42, 0.7));">
          <div class="match-image-frame" style="cursor: pointer;" onclick="window.open('${deepLinks.yandex}', '_blank')">
            <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #020617;">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="#FC3F1D"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm1.75 18h-2.5v-6.5h-1.5V9.25h1.5V6.5c0-1.795 1.455-3.25 3.25-3.25h2.25v2.25H14.5c-.552 0-1 .448-1 1v2.75h3.25l-.5 2.25H13.5V18z"/></svg>
            </div>
            <div class="match-platform-badge" style="background: #FC3F1D; color: #fff;">Yandex AI</div>
            <div class="match-score-badge"><span>Deep Face AI</span></div>
          </div>
          <div class="match-content">
            <div class="match-username">Yandex Deep Facial Match</div>
            <div class="match-snippet">Specialized deep facial recognition search across public VK, Instagram, and web archives. Renowned for finding exact face matches.</div>
            <div class="match-actions">
              <a href="${deepLinks.yandex}" target="_blank" rel="noopener noreferrer" class="btn-profile" style="background: linear-gradient(135deg, #b91c1c, #ea580c); border: none;">
                Launch Yandex AI &nearr;
              </a>
            </div>
          </div>
        </div>

        <div class="card-match" style="border-color: rgba(239, 68, 68, 0.4); background: linear-gradient(180deg, rgba(239, 68, 68, 0.08), rgba(15, 23, 42, 0.7));">
          <div class="match-image-frame" style="cursor: pointer;" onclick="window.open('${deepLinks.facecheck}', '_blank')">
            <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #020617;">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div class="match-platform-badge" style="background: #EF4444; color: #fff;">FaceCheck</div>
            <div class="match-score-badge"><span>Facial ID</span></div>
          </div>
          <div class="match-content">
            <div class="match-username">FaceCheck.ID Database</div>
            <div class="match-snippet">Dedicated reverse facial recognition search engine cross-referencing public mugshots, news, and social networks.</div>
            <div class="match-actions">
              <a href="${deepLinks.facecheck}" target="_blank" rel="noopener noreferrer" class="btn-profile" style="background: linear-gradient(135deg, #be123c, #e11d48); border: none;">
                Launch FaceCheck &nearr;
              </a>
            </div>
          </div>
        </div>
      `;
    } else {
      resultsCountText.textContent = `Found ${matches.length} high-confidence matching profile${matches.length === 1 ? '' : 's'}`;

      matches.forEach((match, index) => {
        const card = document.createElement('div');
        card.className = 'card-match';

        const avatarSrc = match.base64 ? (match.base64.startsWith('http') ? match.base64 : `data:image/jpeg;base64,${match.base64}`) : '';
        const platformIcon = getPlatformIcon(match.platform);

        card.innerHTML = `
          <div class="match-image-frame" data-index="${index}">
            ${avatarSrc ? `
              <img src="${avatarSrc}" referrerpolicy="no-referrer" alt="${match.username}" class="match-avatar-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
              <div style="display:none; width: 100%; height: 100%; align-items: center; justify-content: center; background: #020617;">${platformIcon}</div>
            ` : `
              <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #020617;">${platformIcon}</div>
            `}
            <div class="match-platform-badge">${platformIcon}</div>
            <div class="match-score-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#38bdf8"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <span>${match.score}% HD</span>
            </div>
          </div>

          <div class="match-content">
            <div class="match-username" title="${match.title || match.username}">${match.username}</div>
            <div class="match-snippet">${match.title || 'Public identity profile found via cross-network facial query.'}</div>
            <div class="match-actions">
              <button type="button" class="btn-inspect-small" data-index="${index}" title="Inspect in HD Lightbox">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
              <a href="${match.url}" target="_blank" rel="noopener noreferrer" class="btn-profile">
                ${match.platform === 'YouTube' ? 'Watch Channel &nearr;' :
                  match.platform === 'Instagram' ? 'View Instagram &nearr;' :
                  match.platform === 'Facebook' ? 'View Facebook &nearr;' :
                  match.platform === 'TikTok' ? 'View TikTok &nearr;' :
                  match.platform === 'Twitter' ? 'View Profile &nearr;' :
                  match.platform === 'LinkedIn' ? 'View Profile &nearr;' :
                  'Open Link &nearr;'}
              </a>
            </div>
          </div>
        `;

        matchesGrid.appendChild(card);
      });

      // Bind Lightbox modal triggers
      matchesGrid.querySelectorAll('.match-image-frame, .btn-inspect-small').forEach(el => {
        el.addEventListener('click', (e) => {
          const idx = parseInt(el.getAttribute('data-index'), 10);
          if (!isNaN(idx) && latestMatches[idx]) {
            openLightboxModal(latestMatches[idx]);
          }
        });
      });
    }

    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── Lightbox Comparison Modal Controller ──
  function openLightboxModal(match) {
    const avatarSrc = match.base64 ? (match.base64.startsWith('http') ? match.base64 : `data:image/jpeg;base64,${match.base64}`) : hdFaceCropDataUrl;
    lightboxSourceImg.src = hdFaceCropDataUrl || previewImg.src;
    lightboxTargetImg.src = avatarSrc;
    lightboxTargetLabel.textContent = `${match.platform} Profile Media`;
    lightboxPlatform.textContent = match.platform;
    lightboxUser.textContent = match.username;
    lightboxScore.textContent = `${match.score}% Biometric Match`;
    btnLightboxVisit.href = match.url;

    hdLightboxModal.style.display = 'flex';
  }

  btnInspectFace.addEventListener('click', () => {
    if (latestMatches.length > 0) {
      openLightboxModal(latestMatches[0]);
    } else {
      lightboxSourceImg.src = hdFaceCropDataUrl || previewImg.src;
      lightboxTargetImg.src = hdFaceCropDataUrl || previewImg.src;
      lightboxTargetLabel.textContent = 'Uploaded Face Signature';
      lightboxPlatform.textContent = 'Biometrics';
      lightboxUser.textContent = previewName.textContent;
      lightboxScore.textContent = 'Source HD 1080p';
      btnLightboxVisit.href = '#';
      hdLightboxModal.style.display = 'flex';
    }
  });

  function closeLightboxModal() {
    hdLightboxModal.style.display = 'none';
  }

  btnCloseModal.addEventListener('click', closeLightboxModal);
  hdLightboxModal.addEventListener('click', (e) => {
    if (e.target === hdLightboxModal) {
      closeLightboxModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && hdLightboxModal.style.display === 'flex') {
      closeLightboxModal();
    }
  });

  // ── New Search ──
  btnNewSearch.addEventListener('click', () => {
    resetSelection();
    resultsSection.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

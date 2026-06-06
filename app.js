/* ==========================================================================
   AetherCatalog Main Orchestrator & Application Logic
   ========================================================================== */

import { DB } from './modules/db.js';
import { Dashboard, CATEGORY_COLORS } from './modules/dashboard.js';
import { VoiceEngine } from './modules/voice.js';
import { AIClient } from './modules/ai.js';

// Application State Context
const AppState = {
  currentView: 'dashboard',
  selectedImageBase64: null,
  selectedImageMimeType: null,
  activeAssetId: null,
  isMicActive: false
};

// DOM Elements Cache
const DOM = {
  views: document.querySelectorAll('.app-view'),
  menuItems: document.querySelectorAll('.menu-item'),
  globalSearch: document.getElementById('global-search'),
  quickVoiceBtn: document.getElementById('quick-voice-btn'),
  headerAddBtn: document.getElementById('header-add-btn'),
  liveClock: document.getElementById('live-clock'),
  apiStatus: document.getElementById('api-status-indicator'),
  
  // Catalog View Elements
  catalogGrid: document.getElementById('catalog-grid-container'),
  catalogSearch: document.getElementById('catalog-search'),
  filterCat: document.getElementById('filter-category'),
  filterStatus: document.getElementById('filter-status'),
  filterCond: document.getElementById('filter-condition'),
  sortBy: document.getElementById('sort-by'),
  catalogEmpty: document.getElementById('catalog-empty-state'),
  exportBtn: document.getElementById('export-catalog-btn'),
  emptyStateAddBtn: document.getElementById('empty-state-add-btn'),
  
  // Registration View Elements
  dropzone: document.getElementById('image-dropzone'),
  imageInput: document.getElementById('asset-image-input'),
  dropzonePrompt: document.getElementById('dropzone-prompt-box'),
  dropzonePreview: document.getElementById('dropzone-preview-box'),
  previewImage: document.getElementById('selected-image-preview'),
  laser: document.getElementById('scanner-laser'),
  scannerBadge: document.getElementById('scanner-badge'),
  boxesContainer: document.getElementById('bounding-boxes-container'),
  
  micBtn: document.getElementById('mic-toggle-btn'),
  micCard: document.querySelector('.voice-intake-card'),
  micStatusText: document.getElementById('mic-status-text'),
  micGlow: document.getElementById('mic-status-glow'),
  dictationBox: document.getElementById('voice-dictation-box'),
  aiExtractStatus: document.getElementById('ai-extract-status'),
  
  regForm: document.getElementById('asset-reg-form'),
  formReset: document.getElementById('form-reset-btn'),
  
  // Hands-Free View Elements
  hfStartBtn: document.getElementById('hf-start-btn'),
  hfExitBtn: document.getElementById('hf-exit-btn'),
  hfSkipBtn: document.getElementById('hf-skip-btn'),
  hfBackBtn: document.getElementById('hf-back-btn'),
  hfPromptVoice: document.getElementById('hf-prompt-voice'),
  hfLiveSpeech: document.getElementById('hf-live-speech'),
  hfInteractivePanel: document.getElementById('hf-interactive-panel'),
  hfAvatarState: document.getElementById('hf-avatar-state'),
  hfConsole: document.querySelector('.handsfree-console'),
  
  // Settings View Elements
  settingsKey: document.getElementById('settings-gemini-key'),
  toggleKeyVisibility: document.getElementById('toggle-key-visibility'),
  apiSaveBtn: document.getElementById('api-save-btn'),
  apiTestBtn: document.getElementById('api-test-btn'),
  prefTTS: document.getElementById('pref-tts-active'),
  prefAutoMic: document.getElementById('pref-auto-mic'),
  prefVoiceSelect: document.getElementById('pref-voice-select'),
  purgeDBBtn: document.getElementById('btn-purge-db'),
  
  // Detail Modal Elements
  detailsModal: document.getElementById('details-modal'),
  detailsClose: document.getElementById('details-modal-close'),
  modalImg: document.getElementById('modal-asset-img'),
  modalStatus: document.getElementById('modal-asset-status'),
  modalCat: document.getElementById('modal-asset-category'),
  modalName: document.getElementById('modal-asset-name'),
  modalVal: document.getElementById('modal-asset-value'),
  modalMan: document.getElementById('modal-asset-man'),
  modalModel: document.getElementById('modal-asset-model'),
  modalCond: document.getElementById('modal-asset-condition'),
  modalLoc: document.getElementById('modal-asset-location'),
  modalSerial: document.getElementById('modal-asset-serial'),
  modalDate: document.getElementById('modal-asset-date'),
  modalTags: document.getElementById('modal-asset-tags'),
  modalNotes: document.getElementById('modal-asset-notes'),
  modalBarcode: document.getElementById('modal-barcode-id'),
  modalDeleteBtn: document.getElementById('modal-btn-delete'),
  
  // Speech Dialog overlay (Ask Aether)
  speechModal: document.getElementById('speech-modal'),
  speechModalClose: document.getElementById('speech-modal-close'),
  globalSpeechStatus: document.getElementById('global-speech-status'),
  globalSpeechLiveBox: document.getElementById('global-speech-live-box'),
  globalMicPulse: document.getElementById('global-mic-pulse'),
  globalSpeechIntent: document.getElementById('global-speech-intent-box'),
  globalIntentText: document.getElementById('global-intent-text'),

  // Authentication Gateway Elements
  loginScreen: document.getElementById('login-screen'),
  loginForm: document.getElementById('login-form'),
  loginRole: document.getElementById('login-role'),
  loginUsername: document.getElementById('login-username'),
  loginPassword: document.getElementById('login-password'),
  loginHint: document.getElementById('login-hint'),
  tabAdmin: document.getElementById('tab-admin'),
  tabUser: document.getElementById('tab-user'),
  headerRoleBadge: document.getElementById('header-role-badge'),
  userAvatarText: document.getElementById('user-avatar-text')
};

// ==========================================================================
// 1. Router & View Management
// ==========================================================================
function initRouter() {
  const handleRouting = () => {
    let hash = window.location.hash || '#dashboard';
    
    if (hash === '#logout') {
      logout();
      return;
    }

    // Clean route parameter
    const viewName = hash.replace('#', '');
    
    // Route guard for Admin-only views
    const adminViews = ['register', 'handsfree', 'settings'];
    const currentUser = JSON.parse(localStorage.getItem('aether_logged_in_user') || 'null');
    const isStaff = currentUser && currentUser.role === 'staff';
    const isLoggedOut = !currentUser;

    if (isLoggedOut) {
      window.location.hash = '#dashboard';
      return;
    }

    if (isStaff && adminViews.includes(viewName)) {
      window.location.hash = '#dashboard';
      return;
    }

    const activeView = document.getElementById(`view-${viewName}`);
    
    if (activeView) {
      // Deactivate active views
      DOM.views.forEach(v => v.classList.remove('active'));
      DOM.menuItems.forEach(item => item.classList.remove('active'));
      
      // Activate target view
      activeView.classList.add('active');
      AppState.currentView = viewName;
      
      // Update sidebar nav state
      const targetNav = document.getElementById(`nav-${viewName}`);
      if (targetNav) targetNav.classList.add('active');
      
      // View specific triggers
      if (viewName === 'dashboard') {
        Dashboard.updateDashboard();
      } else if (viewName === 'catalog') {
        populateCategoryFilter();
        renderCatalog();
      } else if (viewName === 'handsfree') {
        // Ensure wizard resets
        VoiceEngine.HandsFreeWizard.stop();
      }
    }
  };

  window.addEventListener('hashchange', handleRouting);
  // Default load routing
  if (!window.location.hash) {
    window.location.hash = '#dashboard';
  } else {
    handleRouting();
  }
}

// ==========================================================================
// 2. Global Utilities & Settings Loading
// ==========================================================================
function initClock() {
  const refreshClock = () => {
    const now = new Date();
    DOM.liveClock.textContent = now.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };
  refreshClock();
  setInterval(refreshClock, 60000);
}

function loadSettings() {
  // Load saved API Key
  const apiKey = AIClient.getApiKey();
  if (apiKey) {
    DOM.settingsKey.value = apiKey;
    DOM.apiStatus.className = 'api-status-badge active';
    DOM.apiStatus.querySelector('.status-text').textContent = 'Live Mode';
  } else {
    DOM.apiStatus.className = 'api-status-badge inactive';
    DOM.apiStatus.querySelector('.status-text').textContent = 'Simulation Mode';
  }

  // Load preferences
  DOM.prefTTS.checked = VoiceEngine.ttsActive;
  DOM.prefAutoMic.checked = localStorage.getItem('aether_pref_automic') === 'true';
}

// ==========================================================================
// 3. Digital Catalog List & Filters
// ==========================================================================
function populateCategoryFilter() {
  const assets = DB.getAllAssets();
  const categories = [...new Set(assets.map(a => a.category || 'Uncategorized'))];
  
  // Store existing selection
  const previousVal = DOM.filterCat.value;
  
  DOM.filterCat.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    DOM.filterCat.appendChild(opt);
  });
  
  // Restore selection
  if (categories.includes(previousVal)) {
    DOM.filterCat.value = previousVal;
  }
}

function renderCatalog() {
  const assets = DB.getAllAssets();
  
  const searchVal = DOM.catalogSearch.value.toLowerCase().trim();
  const catVal = DOM.filterCat.value;
  const statusVal = DOM.filterStatus.value;
  const condVal = DOM.filterCond.value;
  const sortVal = DOM.sortBy.value;
  
  // 1. Filter operations
  let filtered = assets.filter(asset => {
    const matchesSearch = searchVal === '' || 
      (asset.name && asset.name.toLowerCase().includes(searchVal)) ||
      (asset.manufacturer && asset.manufacturer.toLowerCase().includes(searchVal)) ||
      (asset.serial && asset.serial.toLowerCase().includes(searchVal)) ||
      (asset.model && asset.model.toLowerCase().includes(searchVal)) ||
      (asset.tags && asset.tags.some(t => t.toLowerCase().includes(searchVal))) ||
      (asset.location && asset.location.toLowerCase().includes(searchVal));
      
    const matchesCat = catVal === 'all' || asset.category === catVal;
    const matchesStatus = statusVal === 'all' || asset.status === statusVal;
    const matchesCond = condVal === 'all' || asset.condition === condVal;
    
    return matchesSearch && matchesCat && matchesStatus && matchesCond;
  });

  // 2. Sorting operations
  filtered.sort((a, b) => {
    if (sortVal === 'date-desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortVal === 'date-asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortVal === 'value-desc') return parseFloat(b.value || 0) - parseFloat(a.value || 0);
    if (sortVal === 'value-asc') return parseFloat(a.value || 0) - parseFloat(b.value || 0);
    if (sortVal === 'name-asc') return (a.name || '').localeCompare(b.name || '');
    return 0;
  });

  // Render nodes
  DOM.catalogGrid.innerHTML = '';
  
  if (filtered.length === 0) {
    DOM.catalogGrid.classList.add('hidden');
    DOM.catalogEmpty.classList.remove('hidden');
    return;
  }
  
  DOM.catalogGrid.classList.remove('hidden');
  DOM.catalogEmpty.classList.add('hidden');

  filtered.forEach(asset => {
    const card = document.createElement('div');
    card.className = 'asset-card glassmorphic';
    
    const formattedVal = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(asset.value || 0);

    const statusClass = (asset.status || '').toLowerCase().replace(' ', '');
    const condColor = CATEGORY_COLORS[asset.category] || CATEGORY_COLORS['default'];

    card.innerHTML = `
      <div class="card-image-box">
        <img src="${asset.image || 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect fill=%22%231e293b%22 width=%22100%22 height=%22100%22/></svg>'}" alt="${asset.name}">
        <span class="card-badge ${statusClass}">${asset.status}</span>
      </div>
      <div class="card-cat" style="color: ${condColor}">${asset.category}</div>
      <div class="card-name" title="${asset.name}">${asset.name}</div>
      <div class="card-meta-row">
        <span>LOC: <strong>${asset.location || 'N/A'}</strong></span>
        <span class="card-condition-dot">
          <span class="condition-indicator condition-${asset.condition}"></span>
          ${asset.condition}
        </span>
      </div>
      <div class="card-value">
        <span>${formattedVal}</span>
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="var(--text-muted)" stroke-width="2.5" fill="none">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    `;

    card.addEventListener('click', () => openDetailModal(asset.id));
    DOM.catalogGrid.appendChild(card);
  });
}

// ==========================================================================
// 4. Detail View Modal Overlay
// ==========================================================================
function openDetailModal(id) {
  const asset = DB.getAssetById(id);
  if (!asset) return;

  AppState.activeAssetId = id;
  
  DOM.modalImg.src = asset.image;
  
  const statusClass = (asset.status || '').toLowerCase().replace(' ', '');
  DOM.modalStatus.className = `modal-status-pill ${statusClass}`;
  DOM.modalStatus.textContent = asset.status;
  
  DOM.modalCat.textContent = asset.category;
  DOM.modalCat.style.color = CATEGORY_COLORS[asset.category] || CATEGORY_COLORS['default'];
  
  DOM.modalName.textContent = asset.name;
  
  DOM.modalVal.textContent = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(asset.value || 0);

  DOM.modalMan.textContent = asset.manufacturer || 'N/A';
  DOM.modalModel.textContent = asset.model || 'N/A';
  DOM.modalCond.textContent = asset.condition;
  DOM.modalLoc.textContent = asset.location || 'N/A';
  DOM.modalSerial.textContent = asset.serial || 'N/A';
  
  DOM.modalDate.textContent = new Date(asset.createdAt).toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  DOM.modalNotes.textContent = asset.notes || 'No description provided.';
  DOM.modalBarcode.textContent = asset.id;

  // Render tag badges
  DOM.modalTags.innerHTML = '';
  if (asset.tags && asset.tags.length > 0) {
    asset.tags.forEach(tag => {
      const badge = document.createElement('span');
      badge.className = 'tag-badge';
      badge.textContent = tag;
      DOM.modalTags.appendChild(badge);
    });
  } else {
    DOM.modalTags.innerHTML = '<span class="activity-time">No tags.</span>';
  }

  DOM.detailsModal.classList.remove('hidden');
}

function closeDetailModal() {
  DOM.detailsModal.classList.add('hidden');
  AppState.activeAssetId = null;
}

// ==========================================================================
// 5. Intelligent Vision Upload & Scanner Simulation
// ==========================================================================
function setupDropzone() {
  const preventDefaults = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    DOM.dropzone.addEventListener(eventName, preventDefaults, false);
  });

  DOM.dropzone.addEventListener('dragenter', () => DOM.dropzone.classList.add('dragover'));
  DOM.dropzone.addEventListener('dragover', () => DOM.dropzone.classList.add('dragover'));
  DOM.dropzone.addEventListener('dragleave', () => DOM.dropzone.classList.remove('dragover'));
  DOM.dropzone.addEventListener('drop', (e) => {
    DOM.dropzone.classList.remove('dragover');
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      handleImageFile(files[0]);
    }
  });

  DOM.dropzone.addEventListener('click', () => DOM.imageInput.click());
  DOM.imageInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleImageFile(e.target.files[0]);
    }
  });
}

function handleImageFile(file) {
  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file (JPEG, PNG, WebP).');
    return;
  }

  AppState.selectedImageMimeType = file.type;

  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => {
    const base64 = reader.result;
    AppState.selectedImageBase64 = base64;
    
    // Inject image into wizard if wizard is active
    if (window.location.hash === '#handsfree' && VoiceEngine.HandsFreeWizard.currentState === 'IMAGE') {
      VoiceEngine.HandsFreeWizard.feedImage(base64);
      return;
    }

    // Normal Form flow
    displayScanningMode(base64);
    triggerAIVisionAnalysis(base64, file.type);
  };
}

function displayScanningMode(base64) {
  DOM.previewImage.src = base64;
  DOM.dropzonePrompt.classList.add('hidden');
  DOM.dropzonePreview.classList.remove('hidden');
  
  // Show scanner laser sweeps
  DOM.laser.classList.remove('hidden');
  DOM.scannerBadge.textContent = 'AI Vision scanning...';
  DOM.scannerBadge.style.backgroundColor = 'rgba(245, 158, 11, 0.85)';
  DOM.scannerBadge.style.boxShadow = '0 4px 15px rgba(245, 158, 11, 0.4)';
  
  DOM.boxesContainer.innerHTML = '';
}

async function triggerAIVisionAnalysis(base64, mimeType) {
  DOM.aiExtractStatus.textContent = 'Scanning image...';
  DOM.aiExtractStatus.className = 'form-mode-badge extracting';

  try {
    const result = await AIClient.analyzeAssetImage(base64, mimeType);
    
    // Clean scanning styles
    DOM.laser.classList.add('hidden');
    DOM.scannerBadge.textContent = 'AI Scan Completed';
    DOM.scannerBadge.style.backgroundColor = 'rgba(16, 185, 129, 0.9)';
    DOM.scannerBadge.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';

    DOM.aiExtractStatus.textContent = 'Metadata Extracted';
    DOM.aiExtractStatus.className = 'form-mode-badge success';

    // Populate Bounding Box
    if (result.detectedObjects && result.detectedObjects.length > 0) {
      result.detectedObjects.forEach(obj => {
        drawBoundingBox(obj.label, obj.box_2d);
      });
    }

    // Populate Fields with glow sweeps
    populateFormField('form-name', result.name);
    populateFormField('form-category', result.category);
    populateFormField('form-value', result.value);
    populateFormField('form-manufacturer', result.manufacturer);
    populateFormField('form-model', result.model);
    populateFormField('form-condition', result.condition);
    populateFormField('form-tags', result.tags ? result.tags.join(', ') : '');
    populateFormField('form-notes', result.notes);
    
    // TTS feedback
    if (DOM.prefTTS.checked) {
      VoiceEngine.speak(`Asset recognized as ${result.name} belonging to ${result.category}. Parameters successfully filled.`);
    }

    // Auto microphone activation preference
    if (DOM.prefAutoMic.checked) {
      setTimeout(() => startDictation(), 1500);
    }

  } catch (error) {
    console.error(error);
    DOM.laser.classList.add('hidden');
    DOM.scannerBadge.textContent = 'Analysis Failed';
    DOM.scannerBadge.style.backgroundColor = 'rgba(239, 68, 68, 0.9)';
    
    DOM.aiExtractStatus.textContent = 'Extraction Failed';
    DOM.aiExtractStatus.className = 'form-mode-badge';
    
    if (DOM.prefTTS.checked) {
      VoiceEngine.speak("Image analysis failed. Please fill coordinates manually or repeat command.");
    }
  }
}

// Dynamic visual bounding box placement
function drawBoundingBox(label, box_2d) {
  // box_2d is [ymin, xmin, ymax, xmax] percentages
  const [ymin, xmin, ymax, xmax] = box_2d;
  
  const box = document.createElement('div');
  box.className = 'ai-bounding-box';
  box.style.top = `${ymin}%`;
  box.style.left = `${xmin}%`;
  box.style.width = `${xmax - xmin}%`;
  box.style.height = `${ymax - ymin}%`;

  const labelEl = document.createElement('span');
  labelEl.className = 'bounding-box-label';
  labelEl.textContent = label;

  box.appendChild(labelEl);
  DOM.boxesContainer.appendChild(box);
}

function populateFormField(elementId, value) {
  const el = document.getElementById(elementId);
  if (!el || value === undefined || value === null) return;
  
  el.value = value;
  
  // Apply a glowing keyframe visual highlight
  el.classList.add('ai-field-highlight');
  setTimeout(() => el.classList.remove('ai-field-highlight'), 1600);
}

// ==========================================================================
// 6. Dictation Speech Capture & Natural Language Extraction
// ==========================================================================
function toggleDictation() {
  if (AppState.isMicActive) {
    stopDictation();
  } else {
    startDictation();
  }
}

function startDictation() {
  DOM.dictationBox.innerHTML = '<span class="transcript-placeholder">Listening... state parameters now.</span>';
  DOM.micCard.classList.add('active-mic');
  DOM.micStatusText.textContent = 'Listening Mode Active';
  DOM.micGlow.className = 'voice-indicator-glow listening';
  AppState.isMicActive = true;

  VoiceEngine.listenOnce(
    (result) => {
      if (result.final) {
        DOM.dictationBox.innerHTML = highlightTranscriptKeywords(result.final);
        processParsedVocalInput(result.final);
      } else if (result.interim) {
        DOM.dictationBox.innerHTML = `<span style="opacity: 0.6">${result.interim}</span>`;
      }
    },
    () => {
      // Complete
      stopDictation();
    },
    (err) => {
      console.error(err);
      stopDictation();
      DOM.dictationBox.innerHTML = `<span style="color: var(--color-danger)">Voice capture error: ${err}</span>`;
    }
  );
}

function stopDictation() {
  DOM.micCard.classList.remove('active-mic');
  DOM.micStatusText.textContent = 'Microphone Idle';
  DOM.micGlow.className = 'voice-indicator-glow';
  AppState.isMicActive = false;
}

// Extracts tags visually as green highlighted tokens in transcripts
function highlightTranscriptKeywords(text) {
  const result = VoiceEngine.parseConversationalSentence(text);
  let highlighted = text;
  
  // Replace words
  if (result.name) {
    const idx = text.toLowerCase().indexOf(result.name.toLowerCase());
    if (idx > -1) {
      const match = text.slice(idx, idx + result.name.length);
      highlighted = highlighted.replace(match, `<span class="extracted-word" style="background-color: var(--color-primary-glow); color: var(--color-primary); border-color: var(--color-primary);">${match}</span>`);
    }
  }

  ['category', 'condition', 'value', 'location', 'serial'].forEach(key => {
    if (result[key]) {
      const strVal = result[key].toString();
      const idx = highlighted.toLowerCase().indexOf(strVal.toLowerCase());
      if (idx > -1) {
        const match = highlighted.slice(idx, idx + strVal.length);
        highlighted = highlighted.replace(match, `<span class="extracted-word">${match}</span>`);
      }
    }
  });

  return highlighted;
}

function processParsedVocalInput(text) {
  DOM.aiExtractStatus.textContent = 'Processing Voice...';
  DOM.aiExtractStatus.className = 'form-mode-badge extracting';

  const extraction = VoiceEngine.parseConversationalSentence(text);

  setTimeout(() => {
    DOM.aiExtractStatus.textContent = 'Speech Decoded';
    DOM.aiExtractStatus.className = 'form-mode-badge success';

    if (extraction.name) populateFormField('form-name', extraction.name);
    if (extraction.category) populateFormField('form-category', extraction.category);
    if (extraction.value) populateFormField('form-value', extraction.value);
    if (extraction.condition) populateFormField('form-condition', extraction.condition);
    if (extraction.location) populateFormField('form-location', extraction.location);
    if (extraction.serial) populateFormField('form-serial', extraction.serial);

    if (DOM.prefTTS.checked) {
      VoiceEngine.speak("Voice coordinates parsed and registered successfully.");
    }
  }, 1000);
}

// ==========================================================================
// 7. Guided Hands-Free State Machine UI bindings
// ==========================================================================
function toggleHandsFreeWizard() {
  const active = VoiceEngine.HandsFreeWizard.currentState !== 'IDLE';
  if (active) {
    VoiceEngine.HandsFreeWizard.stop();
  } else {
    // Setup wizard callbacks
    VoiceEngine.HandsFreeWizard.start({
      onStateChange: (state) => updateHandsFreeWizardStepUI(state),
      onSpeechPrompt: (prompt) => {
        DOM.hfPromptVoice.textContent = prompt;
      },
      onSpeechTranscript: (speech, isFinal) => {
        AppState.latestHandsFreeSpeech = speech;
        
        const manualInput = document.getElementById('hf-manual-input');
        if (manualInput && speech && speech !== 'Listening...' && speech !== 'Skipped') {
          manualInput.value = speech;
        }

        if (isFinal) {
          DOM.hfLiveSpeech.innerHTML = `Captured: <strong style="color: var(--color-accent)">${speech}</strong>`;
        } else {
          DOM.hfLiveSpeech.innerHTML = `<span style="font-style: italic; opacity:0.75;">Listening... "${speech}"</span>`;
        }
      },
      onComplete: (data) => {
        // Complete wizard, assign default mockup picture if missing
        if (!data.image) {
          data.image = AppState.selectedImageBase64 || DB.getAllAssets()[0].image; // fallback
        }
        
        DB.saveAsset(data);
        
        DB.logActivity('voice', `Hands-free capture logged: <strong>${data.name}</strong> added successfully via microphone.`);
        Dashboard.updateDashboard();
        
        // Open Success popup or flash
        DOM.hfPromptVoice.innerHTML = '<span style="color: var(--color-success)">Inventory Record Saved Successfully!</span>';
      }
    });
  }
}

function updateHandsFreeWizardStepUI(state) {
  AppState.latestHandsFreeSpeech = '';
  VoiceEngine.HandsFreeWizard.manualTypingActive = false;
  // Clear steps active classes
  const steps = ['img', 'fields', 'confirm'];
  steps.forEach(s => {
    const el = document.getElementById(`hf-step-${s}`);
    if (el) {
      el.className = 'step-indicator';
    }
  });

  DOM.hfSkipBtn.classList.add('hidden');
  DOM.hfBackBtn.classList.add('hidden');
  DOM.hfInteractivePanel.innerHTML = '';

  // Avatar and micro status
  if (state === 'IDLE') {
    DOM.hfStartBtn.textContent = 'Initialize Wizard';
    DOM.hfStartBtn.className = 'btn btn-accent';
    DOM.hfConsole.classList.remove('active-mic');
    DOM.hfPromptVoice.textContent = 'Click "Initialize Wizard" to start hands-free logging';
    DOM.hfLiveSpeech.textContent = 'Speech synthesis and dictation status offline';
    
    // Renders visual default trigger box
    DOM.hfInteractivePanel.innerHTML = `
      <div class="hf-upload-prompt" id="hf-camera-box">
        <button class="btn btn-secondary" disabled>Camera Intake Locked</button>
      </div>
    `;
    return;
  }

  // Active Wizard state
  DOM.hfStartBtn.textContent = 'Restart Wizard';
  DOM.hfStartBtn.className = 'btn btn-secondary';
  DOM.hfConsole.classList.add('active-mic');
  DOM.hfSkipBtn.classList.remove('hidden');
  
  if (state === 'DICTATE' || state === 'CONFIRM') {
    DOM.hfBackBtn.classList.remove('hidden');
  } else {
    DOM.hfBackBtn.classList.add('hidden');
  }

  const activeIndex = ['IMAGE', 'DICTATE', 'CONFIRM'].indexOf(state);
  
  // Highlight completed steps
  for (let i = 0; i < activeIndex; i++) {
    const el = document.getElementById(`hf-step-${steps[i]}`);
    if (el) el.classList.add('complete');
  }

  // Highlight current active step
  const activeStepEl = document.getElementById(`hf-step-${steps[activeIndex]}`);
  if (activeStepEl) activeStepEl.classList.add('active');

  // Load interactive contents based on stage
  switch (state) {
    case 'IMAGE':
      DOM.hfInteractivePanel.innerHTML = `
        <div class="hf-upload-prompt">
          <input type="file" id="hf-file-element" accept="image/*" class="hidden-file-input">
          <button class="btn btn-primary" id="hf-upload-btn">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none" style="margin-right:8px">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            Upload Photo
          </button>
          <p class="hf-box-hint">Drag & drop files or click button</p>
        </div>
      `;
      
      const fileEl = document.getElementById('hf-file-element');
      const uploadBtn = document.getElementById('hf-upload-btn');
      
      uploadBtn.addEventListener('click', () => fileEl.click());
      fileEl.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          const reader = new FileReader();
          reader.readAsDataURL(e.target.files[0]);
          reader.onload = () => {
            AppState.selectedImageBase64 = reader.result;
            // Feed to Wizard state machine
            VoiceEngine.HandsFreeWizard.feedImage(reader.result);
          };
        }
      });
      break;

    case 'DICTATE':
      const wizard = VoiceEngine.HandsFreeWizard;
      const field = wizard.fields[wizard.currentFieldIndex];
      
      // Update stepper count
      const counterEl = document.getElementById('hf-step-counter');
      if (counterEl) {
        counterEl.textContent = `(${wizard.currentFieldIndex + 1}/11)`;
      }

      DOM.hfInteractivePanel.innerHTML = `
        <div class="hf-field-intake-card animate-zoom" style="text-align: center; padding: 25px; background: rgba(255,255,255,0.02); border-radius: var(--border-radius-md); border: 1px solid var(--glass-border); width: 100%; max-width: 450px;">
          <span style="display: inline-block; padding: 4px 10px; background: var(--color-primary-glow); color: var(--color-primary); font-weight: 700; font-size: 11px; border-radius: 20px; text-transform: uppercase; margin-bottom: 12px;">${field.label}</span>
          <h3 style="font-size: 20px; font-weight: 600; margin-bottom: 20px; color: var(--text-primary);">${field.prompt}</h3>
          
          <div class="input-wrapper" style="margin-bottom: 20px;">
            <input type="text" id="hf-manual-input" placeholder="Speak details or type here..." style="width: 100%; text-align: center; background: rgba(15, 23, 42, 0.4); border: 1px solid var(--glass-border); border-radius: var(--border-radius-md); padding: 12px 18px; color: var(--text-primary); font-family: var(--font-body); font-size: 15px; transition: all var(--transition-fast);">
            <div class="glow-indicator" style="left: 0; width: 100%;"></div>
          </div>

          <div style="width: 40px; height: 40px; border-radius: 50%; background: rgba(6, 182, 212, 0.1); margin: 0 auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(6, 182, 212, 0.2);">
            <div id="hf-mic-glow" class="voice-indicator-glow" style="width: 16px; height: 16px; border-radius: 50%; background: var(--color-accent);"></div>
          </div>
        </div>
        <p class="activity-time" style="margin-top:10px; font-weight:500;">
          Speak details, press <kbd class="keyboard-badge">Space</kbd> to restart mic, press <kbd class="keyboard-badge">Enter</kbd> to confirm & next, or click <kbd class="keyboard-badge">Skip Field</kbd> to skip.
        </p>
      `;

      // Auto-focus and auto-pause mic on focus
      const manualInput = document.getElementById('hf-manual-input');
      if (manualInput) {
        setTimeout(() => manualInput.focus(), 150);
        manualInput.addEventListener('focus', () => {
          wizard.manualTypingActive = true;
          if (VoiceEngine.isListening && VoiceEngine.recognition) {
            VoiceEngine.recognition.stop();
          }
        });
      }
      break;

    case 'CONFIRM':
      const data = VoiceEngine.HandsFreeWizard.capturedData;
      const fields = VoiceEngine.HandsFreeWizard.fields;
      
      let rowsHtml = '';
      fields.forEach(f => {
        let val = data[f.key];
        if (f.key === 'tags' && Array.isArray(val)) {
          val = val.join(', ');
        }
        rowsHtml += `
          <div style="margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:12px; color:var(--text-secondary); width:35%; text-align:left;">${f.label}:</span>
            <input type="text" class="hf-review-input" data-key="${f.key}" value="${val !== undefined && val !== null ? val : ''}" style="width:60%; background:rgba(0,0,0,0.3); border:1px solid var(--glass-border); border-radius:4px; padding:3px 8px; color:var(--text-primary); font-size:12px; text-align:right;">
          </div>
        `;
      });

      DOM.hfInteractivePanel.innerHTML = `
        <div style="text-align: left; background: rgba(255,255,255,0.03); padding:15px; border-radius: var(--border-radius-md); width:100%; max-width:450px; border: 1px solid var(--glass-border); max-height:250px; overflow-y:auto;">
          <h4 style="margin-bottom:12px; color: var(--color-accent); font-size:14px; font-weight:700;">Review & Edit Attributes:</h4>
          ${rowsHtml}
        </div>
        <p class="activity-time" style="margin-top:10px; font-weight:500;">
          Modify fields, press <kbd class="keyboard-badge">Enter</kbd> to save, or say "Save" / "Cancel".
        </p>
      `;

      // Bind input change listeners to sync values in real-time
      const inputs = DOM.hfInteractivePanel.querySelectorAll('.hf-review-input');
      inputs.forEach(input => {
        input.addEventListener('input', (e) => {
          const key = e.target.getAttribute('data-key');
          let val = e.target.value;
          if (key === 'tags') {
            VoiceEngine.HandsFreeWizard.capturedData[key] = val.split(',').map(t => t.trim());
          } else if (key === 'value') {
            VoiceEngine.HandsFreeWizard.capturedData[key] = parseFloat(val) || 0;
          } else {
            VoiceEngine.HandsFreeWizard.capturedData[key] = val;
          }
        });
      });
      break;
  }
}

function openQuickVoiceOverlay() {
  DOM.speechModal.classList.remove('hidden');
  DOM.speechModal.classList.add('active-mic');
  DOM.globalSpeechStatus.textContent = 'Aether Voice Assistant listening...';
  DOM.globalSpeechLiveBox.textContent = 'Say a search command (e.g. "Show chairs") or log asset command.';
  
  VoiceEngine.listenOnce(
    (result) => {
      if (result.final) {
        DOM.globalSpeechLiveBox.textContent = `"${result.final}"`;
        executeGlobalVoiceQuery(result.final);
      } else if (result.interim) {
        DOM.globalSpeechLiveBox.textContent = result.interim;
      }
    },
    () => {
      // Completed listen, wait for parsing execution before closing
    },
    (err) => {
      console.error(err);
      closeQuickVoiceOverlay();
    }
  );
}

function closeQuickVoiceOverlay() {
  DOM.speechModal.classList.add('hidden');
  DOM.speechModal.classList.remove('active-mic');
}

function executeGlobalVoiceQuery(query) {
  // Strip trailing punctuation like full stops, question marks, and exclamation marks
  const clean = query.toLowerCase().replace(/[\.\?\!\s]+$/, '').trim();
  DOM.globalSpeechIntent.classList.remove('hidden');
  DOM.globalIntentText.textContent = 'Analyzing speech intent...';
  
  setTimeout(() => {
    DOM.globalSpeechIntent.classList.add('hidden');
    closeQuickVoiceOverlay();
    
    // Speech command router
    if (clean.includes('show') || clean.includes('filter') || clean.includes('find') || clean.includes('search')) {
      // Check query keyword filters
      let filterCategory = 'all';
      let searchVal = '';
      
      if (clean.includes('laptop') || clean.includes('computer') || clean.includes('electronics')) {
        filterCategory = 'Electronics';
      } else if (clean.includes('chair') || clean.includes('desk') || clean.includes('office')) {
        filterCategory = 'Office Gear';
      } else if (clean.includes('camera') || clean.includes('lens') || clean.includes('media')) {
        filterCategory = 'Media Equipment';
      }

      // Exact phrase extraction
      const parts = clean.split(/\b(?:show|filter|find|search)\b/i);
      if (parts.length > 1) {
        searchVal = parts[1].replace(/(?:laptops|chairs|cameras|assets|category|electronics|office gear|media equipment)/g, '').trim();
        searchVal = searchVal.replace(/^\b(?:for|me|the|a|an)\b/gi, '').trim();
      }

      // Redirect to catalog page and apply parameters
      window.location.hash = '#catalog';
      setTimeout(() => {
        DOM.filterCat.value = filterCategory;
        DOM.catalogSearch.value = searchVal;
        renderCatalog();
        
        if (DOM.prefTTS.checked) {
          VoiceEngine.speak(`Displaying inventory filtered by ${filterCategory} and keyword ${searchVal}`);
        }
      }, 200);
      
    } else if (clean.includes('add') || clean.includes('register') || clean.includes('create') || clean.includes('log')) {
      // Redirect to Register Form and populate conversational NLP parameters
      window.location.hash = '#register';
      setTimeout(() => {
        DOM.dictationBox.innerHTML = highlightTranscriptKeywords(query);
        processParsedVocalInput(query);
      }, 200);
      
    } else if (clean.includes('dashboard') || clean.includes('center') || clean.includes('stats')) {
      window.location.hash = '#dashboard';
      if (DOM.prefTTS.checked) VoiceEngine.speak("Loading central analytics command center.");
    } else if (clean.includes('hands free') || clean.includes('wizard') || clean.includes('guided')) {
      window.location.hash = '#handsfree';
      if (DOM.prefTTS.checked) VoiceEngine.speak("Activating guided warehouse hands free mode.");
    } else {
      // Default fallback: treat as a catalog search query
      const searchVal = clean.replace(/^\b(?:for|me|the|a|an)\b/gi, '').trim();
      if (searchVal) {
        window.location.hash = '#catalog';
        setTimeout(() => {
          DOM.filterCat.value = 'all';
          DOM.catalogSearch.value = searchVal;
          renderCatalog();
          
          if (DOM.prefTTS.checked) {
            VoiceEngine.speak(`Searching catalog for ${searchVal}`);
          }
        }, 200);
      } else {
        if (DOM.prefTTS.checked) {
          VoiceEngine.speak("Voice query completed. Command unrecognized.");
        }
      }
    }
  }, 1200);
}

// ==========================================================================
// 8.5. Session & Authentication Management
// ==========================================================================
function initAuth() {
  // Tab click listeners
  DOM.tabAdmin.addEventListener('click', () => {
    DOM.tabAdmin.classList.add('active');
    DOM.tabUser.classList.remove('active');
    DOM.loginRole.value = 'admin';
    DOM.loginHint.innerHTML = 'Demo Hint: Use <strong>admin</strong> for both fields.';
    DOM.loginHint.style.color = 'var(--text-secondary)';
    DOM.loginHint.style.borderColor = 'rgba(255, 255, 255, 0.04)';
    DOM.loginHint.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
  });

  DOM.tabUser.addEventListener('click', () => {
    DOM.tabUser.classList.add('active');
    DOM.tabAdmin.classList.remove('active');
    DOM.loginRole.value = 'staff';
    DOM.loginHint.innerHTML = 'Demo Hint: Use <strong>user</strong> for both fields.';
    DOM.loginHint.style.color = 'var(--text-secondary)';
    DOM.loginHint.style.borderColor = 'rgba(255, 255, 255, 0.04)';
    DOM.loginHint.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
  });

  // Form submit listener
  DOM.loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const role = DOM.loginRole.value;
    const username = DOM.loginUsername.value.trim();
    const password = DOM.loginPassword.value;

    const user = DB.verifyCredentials(username, password, role);

    if (user) {
      localStorage.setItem('aether_logged_in_user', JSON.stringify(user));
      applyUserSession(user);
      
      // Clear inputs
      DOM.loginUsername.value = '';
      DOM.loginPassword.value = '';
    } else {
      // Trigger card shake animation
      const card = DOM.loginForm.closest('.login-card');
      if (card) {
        card.classList.add('shake');
        setTimeout(() => card.classList.remove('shake'), 500);
      }

      // Display error hint
      DOM.loginHint.innerHTML = 'Invalid username, password, or role selector!';
      DOM.loginHint.style.color = 'var(--color-danger)';
      DOM.loginHint.style.borderColor = 'rgba(239, 68, 68, 0.2)';
      DOM.loginHint.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
    }
  });
}

function applyUserSession(user) {
  document.body.classList.add('logged-in');
  document.body.classList.remove('logged-out');

  if (user.role === 'admin') {
    document.body.classList.remove('role-staff');
    DOM.headerRoleBadge.textContent = 'Admin';
    DOM.userAvatarText.textContent = 'AD';
  } else {
    document.body.classList.add('role-staff');
    DOM.headerRoleBadge.textContent = 'Staff';
    DOM.userAvatarText.textContent = 'US';
  }

  // Refresh view contents
  if (AppState.currentView === 'dashboard') {
    Dashboard.updateDashboard();
  } else if (AppState.currentView === 'catalog') {
    renderCatalog();
  }
}

function checkSession() {
  const session = localStorage.getItem('aether_logged_in_user');
  if (session) {
    try {
      const user = JSON.parse(session);
      applyUserSession(user);
    } catch (e) {
      console.error("Session parse error, logging out", e);
      logout();
    }
  } else {
    document.body.classList.add('logged-out');
    document.body.classList.remove('logged-in', 'role-staff');
  }
}

function logout() {
  localStorage.removeItem('aether_logged_in_user');
  document.body.classList.add('logged-out');
  document.body.classList.remove('logged-in', 'role-staff');
  window.location.hash = '#dashboard';
}

// ==========================================================================
// 9. Page Event Listeners & Bootstrapping
// ==========================================================================
function bindEvents() {
  // Navigation redirects
  DOM.headerAddBtn.addEventListener('click', () => { window.location.hash = '#register'; });
  DOM.emptyStateAddBtn.addEventListener('click', () => { window.location.hash = '#register'; });
  
  // Global quick voice button
  DOM.quickVoiceBtn.addEventListener('click', openQuickVoiceOverlay);
  DOM.speechModalClose.addEventListener('click', closeQuickVoiceOverlay);

  // Detail Modal Close
  DOM.detailsClose.addEventListener('click', closeDetailModal);
  DOM.modalDeleteBtn.addEventListener('click', () => {
    if (AppState.activeAssetId) {
      const confirm = window.confirm("Are you sure you want to permanently delete this asset record?");
      if (confirm) {
        DB.deleteAsset(AppState.activeAssetId);
        closeDetailModal();
        renderCatalog();
        Dashboard.updateDashboard();
      }
    }
  });

  // Global & Catalog Search sync & trigger
  DOM.globalSearch.addEventListener('input', (e) => {
    const val = e.target.value;
    DOM.catalogSearch.value = val;
    if (window.location.hash !== '#catalog') {
      window.location.hash = '#catalog';
    }
    renderCatalog();
  });

  DOM.catalogSearch.addEventListener('input', (e) => {
    DOM.globalSearch.value = e.target.value;
    renderCatalog();
  });
  DOM.filterCat.addEventListener('change', renderCatalog);
  DOM.filterStatus.addEventListener('change', renderCatalog);
  DOM.filterCond.addEventListener('change', renderCatalog);
  DOM.sortBy.addEventListener('change', renderCatalog);
  
  DOM.exportBtn.addEventListener('click', () => {
    const assets = DB.getAllAssets();
    let csv = 'ID,Name,Category,Value,Manufacturer,Model,Condition,Status,Location,Serial,Created\n';
    
    assets.forEach(a => {
      csv += `"${a.id}","${a.name}","${a.category}",${a.value},"${a.manufacturer || ''}","${a.model || ''}","${a.condition}","${a.status}","${a.location}","${a.serial || ''}","${a.createdAt}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Aether_Inventory_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // Forms interactions
  setupDropzone();
  DOM.micBtn.addEventListener('click', toggleDictation);
  
  DOM.formReset.addEventListener('click', () => {
    DOM.regForm.reset();
    AppState.selectedImageBase64 = null;
    AppState.selectedImageMimeType = null;
    DOM.dropzonePrompt.classList.remove('hidden');
    DOM.dropzonePreview.classList.add('hidden');
    DOM.previewImage.src = '';
    DOM.laser.classList.add('hidden');
    DOM.boxesContainer.innerHTML = '';
    DOM.dictationBox.innerHTML = '<span class="transcript-placeholder">Click microphone above and speak description to fill details...</span>';
    DOM.aiExtractStatus.textContent = 'Waiting for input';
    DOM.aiExtractStatus.className = 'form-mode-badge';
  });

  DOM.regForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const payload = {
      name: document.getElementById('form-name').value,
      category: document.getElementById('form-category').value,
      value: parseFloat(document.getElementById('form-value').value),
      manufacturer: document.getElementById('form-manufacturer').value || null,
      model: document.getElementById('form-model').value || null,
      condition: document.getElementById('form-condition').value,
      status: document.getElementById('form-status').value,
      location: document.getElementById('form-location').value || 'Storage A',
      serial: document.getElementById('form-serial').value || null,
      tags: document.getElementById('form-tags').value ? document.getElementById('form-tags').value.split(',').map(t => t.trim()) : [],
      notes: document.getElementById('form-notes').value || '',
      image: AppState.selectedImageBase64 || DB.getAllAssets()[0].image // fallback to macbook seed if no upload
    };

    DB.saveAsset(payload);
    
    // Soft redirection to catalog after save
    DOM.formReset.click();
    window.location.hash = '#catalog';
  });

  // Hands Free triggers
  DOM.hfStartBtn.addEventListener('click', toggleHandsFreeWizard);
  DOM.hfExitBtn.addEventListener('click', () => VoiceEngine.HandsFreeWizard.stop());
  DOM.hfSkipBtn.addEventListener('click', () => {
    const wizard = VoiceEngine.HandsFreeWizard;
    if (wizard.currentState === wizard.states.IMAGE) {
      wizard.skipImage();
    } else if (wizard.currentState === wizard.states.DICTATE) {
      wizard.skipField();
    }
  });
  DOM.hfBackBtn.addEventListener('click', () => {
    const wizard = VoiceEngine.HandsFreeWizard;
    wizard.previousField();
  });

  // Keyboard shortcuts listener for Hands-Free Mode
  window.addEventListener('keydown', (e) => {
    if (AppState.currentView !== 'handsfree') return;
    
    // Check if user is typing in a text field
    const activeEl = document.activeElement;
    const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

    // Spacebar toggles microphone / dictation
    if (e.code === 'Space') {
      if (isTyping) return; // Allow space character to be typed normally
      
      const wizard = VoiceEngine.HandsFreeWizard;
      if (wizard.currentState === wizard.states.DICTATE || wizard.currentState === wizard.states.CONFIRM) {
        e.preventDefault(); // prevent scrolling
        if (VoiceEngine.isListening) {
          if (VoiceEngine.recognition) VoiceEngine.recognition.stop();
        } else {
          // Clear any old temporary transcript to start fresh
          AppState.latestHandsFreeSpeech = '';
          // Trigger one-shot listen
          wizard.promptAndListen(
            wizard.currentState === wizard.states.DICTATE ? 
              `Please state ${wizard.fields[wizard.currentFieldIndex].label}...` : 
              "Confirm with Save or Cancel...",
            (speech) => {
              if (wizard.currentState === wizard.states.DICTATE) {
                const clean = speech.trim();
                const lower = clean.toLowerCase();
                const field = wizard.fields[wizard.currentFieldIndex];
                if (lower === 'skip' || lower === 'default' || !clean) {
                  wizard.onSpeechTranscript("Skipped", true);
                } else {
                  wizard.onSpeechTranscript(clean, true);
                  if (field.parser) {
                    const val = field.parser(clean);
                    wizard.capturedData[field.key] = val !== null ? val : clean;
                  } else {
                    wizard.capturedData[field.key] = clean;
                  }
                }
                wizard.pendingTimeout = setTimeout(() => wizard.nextField(), 1000);
              } else if (wizard.currentState === wizard.states.CONFIRM) {
                const clean = speech.toLowerCase().trim();
                if (clean.includes('save') || clean.includes('commit') || clean.includes('yes') || clean.includes('store')) {
                  if (wizard.onComplete) wizard.onComplete(wizard.capturedData);
                  wizard.pendingTimeout = setTimeout(() => wizard.stop(), 1500);
                } else if (clean.includes('cancel') || clean.includes('no') || clean.includes('abort') || clean.includes('stop')) {
                  wizard.pendingTimeout = setTimeout(() => wizard.stop(), 1000);
                }
              }
            }
          );
        }
      }
    }



    // 'Enter' key advances to next step or saves the asset based on state
    if (e.key === 'Enter') {
      const wizard = VoiceEngine.HandsFreeWizard;
      e.preventDefault();
      
      if (wizard.currentState === wizard.states.IMAGE) {
        // Step 1: Skip image upload, transition to dictation
        wizard.skipImage();
      } else if (wizard.currentState === wizard.states.DICTATE) {
        // Stop listening if active
        if (VoiceEngine.isListening && VoiceEngine.recognition) {
          VoiceEngine.recognition.stop();
        }
        
        // Read manual input first, fallback to latest speech
        const manualInput = document.getElementById('hf-manual-input');
        const text = manualInput ? manualInput.value.trim() : (AppState.latestHandsFreeSpeech ? AppState.latestHandsFreeSpeech.trim() : '');
        
        const field = wizard.fields[wizard.currentFieldIndex];
        if (text && text !== 'Listening...' && text !== 'Skipped') {
          if (field.parser) {
            const val = field.parser(text);
            wizard.capturedData[field.key] = val !== null ? val : text;
          } else {
            wizard.capturedData[field.key] = text;
          }
        }
        
        // Clear latest speech and reset typing flag
        AppState.latestHandsFreeSpeech = '';
        wizard.manualTypingActive = false;
        
        // Step 2: Transition/advance to the next field
        wizard.nextField();
      } else if (wizard.currentState === wizard.states.CONFIRM) {
        // Step 3: Save and commit asset to database
        if (wizard.onComplete) wizard.onComplete(wizard.capturedData);
        wizard.stop();
      }
    }
  });

  // Settings handlers
  DOM.toggleKeyVisibility.addEventListener('click', () => {
    const isPass = DOM.settingsKey.type === 'password';
    DOM.settingsKey.type = isPass ? 'text' : 'password';
    DOM.toggleKeyVisibility.querySelector('svg').style.color = isPass ? 'var(--color-accent)' : 'var(--text-muted)';
  });

  DOM.apiSaveBtn.addEventListener('click', () => {
    const key = DOM.settingsKey.value.trim();
    if (key) {
      AIClient.setApiKey(key);
      DOM.apiStatus.className = 'api-status-badge active';
      DOM.apiStatus.querySelector('.status-text').textContent = 'Live Mode';
      
      if (DOM.prefTTS.checked) VoiceEngine.speak("API configuration committed successfully.");
      alert('Gemini API key saved successfully in your local browser space. Real-time vision is active.');
    } else {
      AIClient.clearApiKey();
      DOM.apiStatus.className = 'api-status-badge inactive';
      DOM.apiStatus.querySelector('.status-text').textContent = 'Simulation Mode';
      alert('API key cleared. System returned to mock simulation mode.');
    }
  });

  DOM.apiTestBtn.addEventListener('click', async () => {
    const key = DOM.settingsKey.value.trim();
    if (!key) {
      alert('Please enter an API key first to test.');
      return;
    }

    DOM.apiTestBtn.textContent = 'Testing connection...';
    DOM.apiTestBtn.disabled = true;

    const ok = await AIClient.validateApiKey(key);
    
    DOM.apiTestBtn.textContent = 'Test Connectivity';
    DOM.apiTestBtn.disabled = false;

    if (ok) {
      alert('Connection successful! Google Gemini 2.5 Flash API validated.');
    } else {
      alert('Connection failed. Please verify your Gemini API key is valid and has not expired.');
    }
  });

  DOM.prefTTS.addEventListener('change', (e) => {
    VoiceEngine.ttsActive = e.target.checked;
    localStorage.setItem('aether_pref_tts', e.target.checked.toString());
  });

  DOM.prefAutoMic.addEventListener('change', (e) => {
    localStorage.setItem('aether_pref_automic', e.target.checked.toString());
  });

  DOM.prefVoiceSelect.addEventListener('change', (e) => {
    if ('speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find(v => v.name === e.target.value);
      if (match) VoiceEngine.selectedVoice = match;
    }
  });

  DOM.purgeDBBtn.addEventListener('click', () => {
    const conf = window.confirm("WARNING: This will permanently delete ALL registered assets and clear custom settings. Reseed catalog?");
    if (conf) {
      DB.purgeDB();
    }
  });

  // Bind logout navigation button
  const logoutBtn = document.getElementById('nav-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }

  const dashLogoutBtn = document.getElementById('dashboard-logout-btn');
  if (dashLogoutBtn) {
    dashLogoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }

  // Listen to custom DB log events to trigger dashboard updates live
  window.addEventListener('activity-updated', () => {
    if (AppState.currentView === 'dashboard') {
      Dashboard.updateDashboard();
    }
  });
}

// Initial Bootstrapper
async function bootstrap() {
  // 1. Init Database
  await DB.init();
  
  // 1.5 Setup Auth bindings and check session
  initAuth();
  checkSession();
  
  // 2. Load settings and API status
  loadSettings();
  
  // 3. Init Speech engine
  VoiceEngine.init();
  
  // 4. Bind listeners
  bindEvents();
  
  // 5. Init clock tick
  initClock();
  
  // 6. Bind Hash Router
  initRouter();
  
  // 7. Render initial dashboard counts
  Dashboard.updateDashboard();
}

// Start application when DOM completes loading
window.addEventListener('DOMContentLoaded', bootstrap);
export { AppState };

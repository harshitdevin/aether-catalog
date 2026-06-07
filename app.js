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
  isMicActive: false,
  checkoutCart: []
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
  userAvatarText: document.getElementById('user-avatar-text'),

  // Checkout View Elements
  checkoutAssetSelect: document.getElementById('checkout-asset-select'),
  checkoutPreview: document.getElementById('checkout-preview'),
  checkoutCartItems: document.getElementById('checkout-cart-items'),
  checkoutCartTotalCost: document.getElementById('checkout-cart-total-cost'),
  checkoutForm: document.getElementById('checkout-reg-form'),
  checkoutAssetId: document.getElementById('checkout-asset-id'),
  checkoutPrice: document.getElementById('checkout-price'),
  checkoutCustomer: document.getElementById('checkout-customer'),
  checkoutNotes: document.getElementById('checkout-notes'),
  checkoutResetBtn: document.getElementById('checkout-reset-btn'),

  // Sales View Elements
  exportSalesBtn: document.getElementById('export-sales-btn'),
  salesStatSold: document.getElementById('sales-stat-sold'),
  salesStatRevenue: document.getElementById('sales-stat-revenue'),
  salesStatProfit: document.getElementById('sales-stat-profit'),
  salesStatProfitLbl: document.getElementById('sales-stat-profit-lbl'),
  salesStatAvg: document.getElementById('sales-stat-avg'),
  salesSearch: document.getElementById('sales-search'),
  salesLedgerTbody: document.getElementById('sales-ledger-tbody'),
  salesLedgerEmpty: document.getElementById('sales-ledger-empty'),
  salesRevenueBars: document.getElementById('sales-revenue-bars'),

  // Receipt Modal Elements
  receiptModal: document.getElementById('receipt-modal'),
  receiptModalClose: document.getElementById('receipt-modal-close'),
  receiptId: document.getElementById('receipt-id'),
  receiptDate: document.getElementById('receipt-date'),
  receiptCustomer: document.getElementById('receipt-customer'),
  receiptItemName: document.getElementById('receipt-item-name'),
  receiptItemModel: document.getElementById('receipt-item-model'),
  receiptItemSerial: document.getElementById('receipt-item-serial'),
  receiptCostVal: document.getElementById('receipt-cost-val'),
  receiptSalePrice: document.getElementById('receipt-sale-price'),
  receiptNetProfit: document.getElementById('receipt-net-profit'),
  receiptNotes: document.getElementById('receipt-notes'),
  receiptBtnRefund: document.getElementById('receipt-btn-refund')
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
    const adminViews = ['register', 'handsfree', 'settings', 'checkout', 'sales'];
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
      } else if (viewName === 'checkout') {
        populateCheckoutAssetSelect();
        resetCheckoutForm();
      } else if (viewName === 'sales') {
        renderSalesDashboard();
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
// 1.5. Product Checkout & Sales Dashboard Handlers
// ==========================================================================
function populateCheckoutAssetSelect() {
  const assets = DB.getAllAssets();
  const select = DOM.checkoutAssetSelect;
  if (!select) return;

  select.innerHTML = '<option value="">-- Choose Asset to Add --</option>';

  const activeAssets = assets.filter(a => a.status !== 'Sold');
  
  // Group active assets by base name
  const groups = {};
  activeAssets.forEach(asset => {
    const baseName = asset.name.replace(/\s*\(\d+\/\d+\)$/, '');
    if (!groups[baseName]) {
      groups[baseName] = [];
    }
    groups[baseName].push(asset);
  });

  // Populate select with items not yet in checkout cart
  Object.keys(groups).forEach(baseName => {
    const isAlreadyInCart = AppState.checkoutCart.some(item => item.baseName === baseName);
    if (!isAlreadyInCart) {
      const opt = document.createElement('option');
      opt.value = baseName;
      opt.textContent = `${baseName} (${groups[baseName].length} available)`;
      select.appendChild(opt);
    }
  });
}

function handleCheckoutAssetChange() {
  const baseName = DOM.checkoutAssetSelect.value;
  if (!baseName) return;

  const assets = DB.getAllAssets().filter(a => a.status !== 'Sold');
  const matchingAssets = assets.filter(a => a.name.replace(/\s*\(\d+\/\d+\)$/, '') === baseName);

  if (matchingAssets.length === 0) return;

  const firstAsset = matchingAssets[0];
  const cartItem = {
    baseName: baseName,
    category: firstAsset.category,
    image: firstAsset.image,
    unitValue: parseFloat(firstAsset.value || 0),
    quantity: 1,
    salePrices: [parseFloat(firstAsset.value || 0)],
    maxAvailable: matchingAssets.length,
    allAssets: matchingAssets
  };

  AppState.checkoutCart.push(cartItem);

  // Reset dropdown selection
  DOM.checkoutAssetSelect.value = '';

  // Render and refresh dropdown
  renderCheckoutCart();
  populateCheckoutAssetSelect();
}

function renderCheckoutCart() {
  const cart = AppState.checkoutCart;
  const itemsContainer = DOM.checkoutCartItems;
  const totalCostEl = DOM.checkoutCartTotalCost;
  
  if (!itemsContainer) return;

  if (cart.length === 0) {
    DOM.checkoutPreview.classList.add('hidden');
    DOM.checkoutPrice.value = '';
    DOM.checkoutAssetId.value = '';
    return;
  }

  DOM.checkoutPreview.classList.remove('hidden');
  itemsContainer.innerHTML = '';

  let grandOriginalValue = 0;
  let grandSalePrice = 0;
  const selectedIds = [];

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val);
  };

  cart.forEach(item => {
    grandOriginalValue += item.unitValue * item.quantity;

    // Sum of individual sale prices
    const itemSubtotal = item.salePrices.reduce((sum, p) => sum + p, 0);
    grandSalePrice += itemSubtotal;

    // Get selected individual asset IDs
    const selectedAssets = item.allAssets.slice(0, item.quantity);
    selectedAssets.forEach(a => selectedIds.push(a.id));

    // Render individual itemized price controls
    let itemRowsHtml = '';
    selectedAssets.forEach((asset, index) => {
      const price = item.salePrices[index];
      itemRowsHtml += `
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; padding-left: 10px; margin-bottom: 4px;">
          <span style="color: var(--text-secondary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 180px;">
            Item ${index + 1}: <strong style="color: var(--text-primary);">${asset.serial || 'No Serial'}</strong> (${asset.model || 'N/A'})
          </span>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="color: var(--text-muted);">Sale Price (₹):</span>
            <input type="number" class="cart-item-individual-price" data-base-name="${item.baseName}" data-index="${index}" step="0.01" value="${price}" style="width: 80px; padding: 2px 4px; background: rgba(15, 23, 42, 0.6); border: 1px solid var(--glass-border); color: var(--text-primary); border-radius: 4px; text-align: right; font-size: 11px;">
          </div>
        </div>
      `;
    });

    const div = document.createElement('div');
    div.className = 'cart-item-row';
    div.style.cssText = 'display: flex; flex-direction: column; gap: 10px; padding: 12px; border-radius: var(--border-radius-sm); border: 1px solid var(--glass-border); background: rgba(255, 255, 255, 0.02); position: relative; margin-bottom: 12px;';

    div.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
        <div style="display: flex; gap: 10px; align-items: center; min-width: 0; flex: 1;">
          <div style="width: 40px; height: 40px; border-radius: 4px; overflow: hidden; border: 1px solid var(--glass-border); flex-shrink: 0; background: rgba(0,0,0,0.2);">
            <img src="${item.image || 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22/></svg>'}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          <div style="min-width: 0; flex: 1;">
            <div style="font-size: 13px; font-weight: 700; color: var(--color-accent); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${item.baseName}">
              ${item.baseName}
            </div>
            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
              Value: ${formatCurrency(item.unitValue)} | Avail: ${item.maxAvailable}
            </div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; flex-shrink: 0;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 11px; color: var(--text-secondary);">Qty:</span>
            <input type="number" class="cart-item-qty" data-base-name="${item.baseName}" min="1" max="${item.maxAvailable}" value="${item.quantity}" style="width: 48px; padding: 3px 6px; background: rgba(15, 23, 42, 0.6); border: 1px solid var(--glass-border); color: var(--text-primary); border-radius: 4px; text-align: center; font-size: 11px;">
          </div>
          <button type="button" class="cart-item-remove" data-base-name="${item.baseName}" style="background: none; border: none; color: var(--color-danger); cursor: pointer; padding: 0 5px; font-size: 18px; line-height: 1; font-weight: bold;">
            &times;
          </button>
        </div>
      </div>
      <div style="margin-top: 4px; border-top: 1px dashed var(--glass-border); padding-top: 8px; display: flex; flex-direction: column; gap: 6px;">
        ${itemRowsHtml}
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; border-top: 1px solid rgba(255,255,255,0.03); padding-top: 6px; margin-top: 4px; color: var(--color-success);">
        <span>Subtotal:</span>
        <span>${formatCurrency(itemSubtotal)}</span>
      </div>
    `;

    itemsContainer.appendChild(div);
  });

  if (totalCostEl) {
    totalCostEl.textContent = formatCurrency(grandOriginalValue);
  }

  DOM.checkoutAssetId.value = selectedIds.join(',');
  DOM.checkoutPrice.value = grandSalePrice.toFixed(2);
}

function resetCheckoutForm() {
  AppState.checkoutCart = [];
  if (DOM.checkoutForm) {
    DOM.checkoutForm.reset();
  }
  renderCheckoutCart();
  populateCheckoutAssetSelect();
}

function handleCheckoutSubmit(e) {
  e.preventDefault();

  const cart = AppState.checkoutCart;
  if (cart.length === 0) {
    alert("Please add at least one product to check out.");
    return;
  }

  const soldTo = DOM.checkoutCustomer.value.trim() || 'Anonymous';
  const notes = DOM.checkoutNotes.value.trim();

  let totalCheckedOut = 0;
  let totalSaleValue = 0;

  cart.forEach(item => {
    const selectedAssets = item.allAssets.slice(0, item.quantity);
    selectedAssets.forEach((asset, index) => {
      const salePrice = item.salePrices[index];
      const saleRecord = {
        id: `SALE-${Math.floor(10000 + Math.random() * 90000)}`,
        assetId: asset.id,
        assetName: asset.name,
        category: asset.category,
        manufacturer: asset.manufacturer,
        model: asset.model,
        serial: asset.serial,
        costValue: asset.value,
        salePrice: salePrice,
        profit: salePrice - asset.value,
        soldDate: new Date().toISOString(),
        soldTo: soldTo,
        notes: notes,
        image: asset.image
      };

      DB.saveSale(saleRecord);

      // Delete from assets inventory completely rather than marking as sold
      DB.deleteAsset(asset.id, true);

      totalCheckedOut++;
      totalSaleValue += salePrice;
    });
  });

  const formattedTotalSale = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(totalSaleValue);

  DB.logActivity('update', `Checked out <strong>${totalCheckedOut} items</strong> sold to <strong>${soldTo}</strong> for <strong>${formattedTotalSale}</strong>.`);

  if (DOM.prefTTS && DOM.prefTTS.checked) {
    VoiceEngine.speak(`Checkout complete for ${totalCheckedOut} items. Grand total is ${totalSaleValue} rupees.`);
  }

  resetCheckoutForm();
  window.location.hash = '#sales';
}

function renderSalesDashboard() {
  const sales = DB.getAllSales();
  
  const totalSold = sales.length;
  const grossRevenue = sales.reduce((sum, s) => sum + parseFloat(s.salePrice || 0), 0);
  const totalCost = sales.reduce((sum, s) => sum + parseFloat(s.costValue || 0), 0);
  const netProfit = grossRevenue - totalCost;
  const avgOrderVal = totalSold > 0 ? (grossRevenue / totalSold) : 0;

  if (DOM.salesStatSold) DOM.salesStatSold.textContent = totalSold;
  
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val);
  };

  if (DOM.salesStatRevenue) DOM.salesStatRevenue.textContent = formatCurrency(grossRevenue);
  if (DOM.salesStatProfit) DOM.salesStatProfit.textContent = formatCurrency(netProfit);
  
  if (DOM.salesStatProfitLbl) {
    if (netProfit >= 0) {
      DOM.salesStatProfitLbl.className = 'metric-footer success';
      DOM.salesStatProfitLbl.innerHTML = `<span>Net Profit Margin (Gain)</span>`;
      if (DOM.salesStatProfit) DOM.salesStatProfit.style.color = 'var(--color-success)';
    } else {
      DOM.salesStatProfitLbl.className = 'metric-footer danger';
      DOM.salesStatProfitLbl.innerHTML = `<span>Net Loss Margin (Deficit)</span>`;
      if (DOM.salesStatProfit) DOM.salesStatProfit.style.color = 'var(--color-danger)';
    }
  }

  if (DOM.salesStatAvg) DOM.salesStatAvg.textContent = formatCurrency(avgOrderVal);

  renderSalesLedger();
  renderSalesCategoryChart(sales);
}

function renderSalesLedger() {
  const sales = DB.getAllSales();
  const searchVal = DOM.salesSearch ? DOM.salesSearch.value.toLowerCase().trim() : '';

  const filtered = sales.filter(s => {
    return searchVal === '' ||
      (s.id && s.id.toLowerCase().includes(searchVal)) ||
      (s.assetName && s.assetName.toLowerCase().includes(searchVal)) ||
      (s.soldTo && s.soldTo.toLowerCase().includes(searchVal)) ||
      (s.model && s.model.toLowerCase().includes(searchVal)) ||
      (s.serial && s.serial.toLowerCase().includes(searchVal)) ||
      (s.category && s.category.toLowerCase().includes(searchVal));
  });

  const tbody = DOM.salesLedgerTbody;
  if (!tbody) return;

  tbody.innerHTML = '';

  if (filtered.length === 0) {
    if (DOM.salesLedgerEmpty) DOM.salesLedgerEmpty.classList.remove('hidden');
    return;
  }

  if (DOM.salesLedgerEmpty) DOM.salesLedgerEmpty.classList.add('hidden');

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val);
  };

  filtered.forEach(sale => {
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid var(--glass-border)';
    tr.style.cursor = 'pointer';
    tr.style.transition = 'background-color var(--transition-fast)';
    
    tr.addEventListener('mouseenter', () => {
      tr.style.backgroundColor = 'rgba(255,255,255,0.02)';
    });
    tr.addEventListener('mouseleave', () => {
      tr.style.backgroundColor = 'transparent';
    });

    const profitColor = sale.profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)';
    const profitSign = sale.profit >= 0 ? '+' : '';
    const formattedProfit = formatCurrency(sale.profit);
    const saleDateStr = new Date(sale.soldDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    tr.innerHTML = `
      <td style="padding: 12px 5px; font-weight: 700; color: var(--color-accent);">${sale.id}</td>
      <td style="padding: 12px 5px; font-weight: 600;">${sale.assetName}</td>
      <td style="padding: 12px 5px; color: var(--text-secondary);">${sale.serial || 'N/A'}</td>
      <td style="padding: 12px 5px;">${formatCurrency(sale.costValue)}</td>
      <td style="padding: 12px 5px; font-weight: 600; color: var(--color-success);">${formatCurrency(sale.salePrice)}</td>
      <td style="padding: 12px 5px; font-weight: 700; color: ${profitColor};">${profitSign}${formattedProfit}</td>
      <td style="padding: 12px 5px; color: var(--text-secondary);">${saleDateStr}</td>
    `;

    tr.addEventListener('click', () => openReceiptModal(sale));
    tbody.appendChild(tr);
  });
}

function renderSalesCategoryChart(sales) {
  const barsContainer = DOM.salesRevenueBars;
  if (!barsContainer) return;

  barsContainer.innerHTML = '';

  if (sales.length === 0) {
    barsContainer.innerHTML = '<p class="activity-time" style="text-align: center; padding: 20px 0;">No sales category data available.</p>';
    return;
  }

  const tally = {};
  sales.forEach(s => {
    const cat = s.category || 'Uncategorized';
    tally[cat] = (tally[cat] || 0) + parseFloat(s.salePrice || 0);
  });

  const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  const maxVal = sorted.length > 0 ? sorted[0][1] : 1;

  sorted.forEach(([name, val]) => {
    const percentage = (val / maxVal) * 100;
    const formattedVal = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);

    const color = CATEGORY_COLORS[name] || CATEGORY_COLORS['default'];

    const barRow = document.createElement('div');
    barRow.className = 'bar-row';
    barRow.innerHTML = `
      <div class="bar-meta">
        <span class="bar-name" style="font-weight: 700;">${name}</span>
        <span class="bar-value" style="color: ${color}; font-weight: 800;">${formattedVal}</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width: 0%; background: linear-gradient(90deg, ${color}, ${color}80);"></div>
      </div>
    `;

    barsContainer.appendChild(barRow);

    setTimeout(() => {
      const fill = barRow.querySelector('.bar-fill');
      if (fill) fill.style.width = `${percentage}%`;
    }, 50);
  });
}

let activeReceiptSale = null;

function openReceiptModal(sale) {
  activeReceiptSale = sale;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val);
  };

  const saleDateStr = new Date(sale.soldDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  DOM.receiptId.textContent = sale.id;
  DOM.receiptDate.textContent = saleDateStr;
  DOM.receiptCustomer.textContent = sale.soldTo;
  DOM.receiptItemName.textContent = sale.assetName;
  DOM.receiptItemModel.textContent = sale.model || 'N/A';
  DOM.receiptItemSerial.textContent = sale.serial || 'N/A';
  DOM.receiptCostVal.textContent = formatCurrency(sale.costValue);
  DOM.receiptSalePrice.textContent = formatCurrency(sale.salePrice);
  
  const formattedProfit = formatCurrency(sale.profit);
  const profitSign = sale.profit >= 0 ? '+' : '';
  DOM.receiptNetProfit.textContent = `${profitSign}${formattedProfit}`;
  DOM.receiptNetProfit.style.color = sale.profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)';
  
  DOM.receiptNotes.textContent = sale.notes || 'No notes available.';

  DOM.receiptModal.classList.remove('hidden');
}

function closeReceiptModal() {
  DOM.receiptModal.classList.add('hidden');
  activeReceiptSale = null;
}

function handleUndoCheckout() {
  if (!activeReceiptSale) return;

  const confirm = window.confirm(`Are you sure you want to refund this sale and return the item back to the active catalog?`);
  if (!confirm) return;

  const sale = activeReceiptSale;
  
  DB.deleteSale(sale.id);

  // Recreate the asset record since it was deleted during checkout
  const restoredAsset = {
    id: sale.assetId,
    name: sale.assetName,
    category: sale.category,
    value: sale.costValue,
    manufacturer: sale.manufacturer,
    model: sale.model,
    serial: sale.serial,
    condition: 'Excellent',
    status: 'In Service',
    location: 'Storage A',
    notes: 'Restored via refund of Sale ' + sale.id + '.',
    image: sale.image,
    createdAt: new Date().toISOString()
  };
  DB.saveAsset(restoredAsset);

  DB.logActivity('update', `Refund processed: Sale <strong>${sale.id}</strong> undone. Asset <strong>${sale.assetName}</strong> returned to active service.`);

  if (DOM.prefTTS && DOM.prefTTS.checked) {
    VoiceEngine.speak("Refund completed. Asset returned to inventory.");
  }

  closeReceiptModal();
  renderSalesDashboard();
  Dashboard.updateDashboard();
}

function handleExportSalesCSV() {
  const sales = DB.getAllSales();
  let csv = 'Sale ID,Asset ID,Asset Name,Category,Manufacturer,Model,Serial,Cost Value (₹),Sale Price (₹),Profit (₹),Sold Date,Customer,Notes\n';

  sales.forEach(s => {
    csv += `"${s.id}","${s.assetId}","${s.assetName}","${s.category}","${s.manufacturer || ''}","${s.model || ''}","${s.serial || ''}",${s.costValue},${s.salePrice},${s.profit},"${s.soldDate}","${s.soldTo}","${s.notes || ''}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `Aether_Sales_Ledger_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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

  // Group filtered assets by base name to avoid duplicate cards for products with quantity > 1
  const grouped = [];
  const baseNameMap = {};

  filtered.forEach(asset => {
    const baseName = asset.name.replace(/\s*\(\d+\/\d+\)$/, '');
    if (!baseNameMap[baseName]) {
      baseNameMap[baseName] = {
        baseName: baseName,
        instances: [],
        primaryAsset: asset
      };
      grouped.push(baseNameMap[baseName]);
    }
    baseNameMap[baseName].instances.push(asset);
  });

  // 2. Sorting operations
  grouped.sort((a, b) => {
    const assetA = a.primaryAsset;
    const assetB = b.primaryAsset;
    if (sortVal === 'date-desc') return new Date(assetB.createdAt).getTime() - new Date(assetA.createdAt).getTime();
    if (sortVal === 'date-asc') return new Date(assetA.createdAt).getTime() - new Date(assetB.createdAt).getTime();
    if (sortVal === 'value-desc') {
      const valA = a.instances.reduce((sum, inst) => sum + parseFloat(inst.value || 0), 0);
      const valB = b.instances.reduce((sum, inst) => sum + parseFloat(inst.value || 0), 0);
      return valB - valA;
    }
    if (sortVal === 'value-asc') {
      const valA = a.instances.reduce((sum, inst) => sum + parseFloat(inst.value || 0), 0);
      const valB = b.instances.reduce((sum, inst) => sum + parseFloat(inst.value || 0), 0);
      return valA - valB;
    }
    if (sortVal === 'name-asc') return a.baseName.localeCompare(b.baseName);
    return 0;
  });

  // Render nodes
  DOM.catalogGrid.innerHTML = '';
  
  if (grouped.length === 0) {
    DOM.catalogGrid.classList.add('hidden');
    DOM.catalogEmpty.classList.remove('hidden');
    return;
  }
  
  DOM.catalogGrid.classList.remove('hidden');
  DOM.catalogEmpty.classList.add('hidden');

  grouped.forEach(group => {
    const primary = group.primaryAsset;
    const qty = group.instances.length;
    const card = document.createElement('div');
    card.className = 'asset-card glassmorphic';
    
    // Display total value of the group
    const totalVal = group.instances.reduce((sum, inst) => sum + parseFloat(inst.value || 0), 0);
    const formattedVal = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(totalVal);

    const statusClass = (primary.status || '').toLowerCase().replace(' ', '');
    const condColor = CATEGORY_COLORS[primary.category] || CATEGORY_COLORS['default'];

    card.innerHTML = `
      <div class="card-image-box">
        <img src="${primary.image || 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect fill=%22%231e293b%22 width=%22100%22 height=%22100%22/></svg>'}" alt="${group.baseName}">
        <span class="card-badge ${statusClass}">${primary.status}</span>
        ${qty > 1 ? `<span class="card-qty-badge">${qty}x</span>` : ''}
      </div>
      <div class="card-cat" style="color: ${condColor}">${primary.category}</div>
      <div class="card-name" title="${group.baseName}">${group.baseName}</div>
      <div class="card-meta-row">
        <span>LOC: <strong>${primary.location || 'N/A'}</strong></span>
        <span class="card-condition-dot">
          <span class="condition-indicator condition-${primary.condition}"></span>
          ${primary.condition}
        </span>
      </div>
      <div class="card-value">
        <span>${formattedVal}</span>
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="var(--text-muted)" stroke-width="2.5" fill="none">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    `;

    card.addEventListener('click', () => openDetailModal(primary.id));
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
  
  const baseName = asset.name.replace(/\s*\(\d+\/\d+\)$/, '');
  const allRelated = DB.getAllAssets().filter(a => a.name.replace(/\s*\(\d+\/\d+\)$/, '') === baseName && a.status !== 'Sold');
  
  if (allRelated.length > 1) {
    DOM.modalName.textContent = `${baseName} (${allRelated.length} Units)`;
    
    // Grouped Valuation
    const totalVal = allRelated.reduce((sum, inst) => sum + parseFloat(inst.value || 0), 0);
    DOM.modalVal.textContent = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(totalVal) + ` (₹${new Intl.NumberFormat('en-IN').format(asset.value || 0)}/ea)`;
    
    // List all unique models
    const models = Array.from(new Set(allRelated.map(r => r.model || 'N/A')));
    DOM.modalModel.textContent = models.join(', ');
    
    // List all unique locations
    const locations = Array.from(new Set(allRelated.map(r => r.location || 'N/A')));
    DOM.modalLoc.textContent = locations.join(', ');

    // List all unique conditions
    const conditions = Array.from(new Set(allRelated.map(r => r.condition || 'N/A')));
    DOM.modalCond.textContent = conditions.join(', ');

    // Render serials as custom styled badges
    DOM.modalSerial.innerHTML = allRelated.map(r => `<code class="serial-badge">${r.serial || 'N/A'}</code>`).join(' ');
  } else {
    DOM.modalName.textContent = asset.name;
    
    DOM.modalVal.textContent = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(asset.value || 0);

    DOM.modalModel.textContent = asset.model || 'N/A';
    DOM.modalLoc.textContent = asset.location || 'N/A';
    DOM.modalCond.textContent = asset.condition;
    DOM.modalSerial.textContent = asset.serial || 'N/A';
  }

  DOM.modalMan.textContent = asset.manufacturer || 'N/A';
  
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

function setupPresetPhotos() {
  const presetCards = document.querySelectorAll('.preset-card');
  presetCards.forEach(card => {
    card.addEventListener('click', () => {
      // 1. Remove active class from all preset cards
      presetCards.forEach(c => c.classList.remove('active'));
      
      // 2. Add active class to clicked card
      card.classList.add('active');
      
      // 3. Update AppState and preview
      const imagePath = card.getAttribute('data-path');
      AppState.selectedImageBase64 = imagePath;
      AppState.selectedImageMimeType = 'image/png';
      
      DOM.previewImage.src = imagePath;
      DOM.dropzonePrompt.classList.add('hidden');
      DOM.dropzonePreview.classList.remove('hidden');
      
      DOM.laser.classList.add('hidden');
      DOM.scannerBadge.textContent = 'Preset Selected';
      DOM.scannerBadge.style.backgroundColor = 'rgba(6, 182, 212, 0.9)';
      DOM.scannerBadge.style.boxShadow = '0 4px 15px rgba(6, 182, 212, 0.4)';
      DOM.boxesContainer.innerHTML = '';
      
      DOM.aiExtractStatus.textContent = 'Preset Loaded';
      DOM.aiExtractStatus.className = 'form-mode-badge success';
      
      // 4. Auto-fill manual form fields
      const fields = {
        name: card.getAttribute('data-name'),
        category: card.getAttribute('data-category'),
        value: card.getAttribute('data-value'),
        manufacturer: card.getAttribute('data-manufacturer'),
        model: card.getAttribute('data-model'),
        notes: card.getAttribute('data-notes'),
        tags: card.getAttribute('data-tags')
      };
      
      const formName = document.getElementById('form-name');
      const formCategory = document.getElementById('form-category');
      const formValue = document.getElementById('form-value');
      const formManufacturer = document.getElementById('form-manufacturer');
      const formModel = document.getElementById('form-model');
      const formNotes = document.getElementById('form-notes');
      const formTags = document.getElementById('form-tags');
      
      if (fields.name) {
        formName.value = fields.name;
        formName.dataset.userEdited = 'true';
      }
      if (fields.category) {
        formCategory.value = fields.category;
        formCategory.dataset.userEdited = 'true';
      }
      if (fields.value) {
        formValue.value = fields.value;
        formValue.dataset.userEdited = 'true';
      }
      if (fields.manufacturer) {
        formManufacturer.value = fields.manufacturer;
        formManufacturer.dataset.userEdited = 'true';
      }
      if (fields.model) {
        formModel.value = fields.model;
        formModel.dataset.userEdited = 'true';
      }
      if (fields.notes) {
        formNotes.value = fields.notes;
        formNotes.dataset.userEdited = 'true';
      }
      if (fields.tags) {
        formTags.value = fields.tags;
        formTags.dataset.userEdited = 'true';
      }
      
      // Sync dynamic item lists if quantity > 1
      const quantityInput = document.getElementById('form-quantity');
      if (quantityInput) {
        quantityInput.dispatchEvent(new Event('input'));
      }
    });
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
          data.image = AppState.selectedImageBase64 || (DB.getAllAssets().length > 0 ? DB.getAllAssets()[0].image : 'assets/macbook.png'); // fallback
        }
        
        const qty = parseInt(data.quantity) || 1;
        if (qty <= 1) {
          DB.saveAsset(data);
          DB.logActivity('voice', `Hands-free capture logged: <strong>${data.name}</strong> added successfully via microphone.`);
        } else {
          for (let i = 1; i <= qty; i++) {
            const item = data.items[i - 1];
            const payload = {
              name: `${data.name} (${i}/${qty})`,
              category: data.category,
              value: parseFloat(data.value) || 0,
              manufacturer: data.manufacturer || null,
              model: item.model || data.model || null,
              condition: data.condition,
              status: data.status,
              location: data.location || 'Storage A',
              serial: item.serial || data.serial || null,
              tags: data.tags || [],
              notes: data.notes || '',
              image: data.image
            };
            DB.saveAsset(payload);
          }
          DB.logActivity('voice', `Hands-free capture logged: <strong>${qty} items</strong> of <strong>${data.name}</strong> added successfully via microphone.`);
        }
        
        Dashboard.updateDashboard();
        
        // Open Success popup or flash
        DOM.hfPromptVoice.innerHTML = '<span style="color: var(--color-success)">Inventory Records Saved Successfully!</span>';
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
      const qty = parseInt(data.quantity) || 1;

      // Initialize itemized list if qty > 1
      if (qty > 1) {
        if (!data.items || data.items.length !== qty) {
          data.items = [];
          for (let i = 1; i <= qty; i++) {
            data.items.push({
              model: data.model ? (i === 1 ? data.model : `${data.model}-${i}`) : '',
              serial: data.serial ? (i === 1 ? data.serial : `${data.serial}-${i}`) : ''
            });
          }
        }
      }
      
      let rowsHtml = '';
      fields.forEach(f => {
        // Skip model and serial if quantity > 1, as they are itemized
        if (qty > 1 && (f.key === 'model' || f.key === 'serial')) {
          return;
        }

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

      if (qty > 1) {
        rowsHtml += `<div style="margin-top: 12px; border-top: 1px dashed var(--glass-border); padding-top: 8px;">`;
        for (let i = 1; i <= qty; i++) {
          const item = data.items[i - 1];
          rowsHtml += `
            <div style="margin-top: 8px; background: rgba(255,255,255,0.01); padding: 5px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.03);">
              <div style="font-size: 10px; color: var(--color-accent); font-weight: bold; margin-bottom: 4px; text-transform: uppercase;">Item ${i} Details:</div>
              <div style="margin-bottom:4px; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:11px; color:var(--text-secondary); width:35%; text-align:left;">Model #${i}:</span>
                <input type="text" class="hf-item-review-input" data-index="${i-1}" data-prop="model" value="${item.model || ''}" style="width:60%; background:rgba(0,0,0,0.3); border:1px solid var(--glass-border); border-radius:4px; padding:3px 8px; color:var(--text-primary); font-size:11px; text-align:right;">
              </div>
              <div style="margin-bottom:4px; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:11px; color:var(--text-secondary); width:35%; text-align:left;">Serial #${i}:</span>
                <input type="text" class="hf-item-review-input" data-index="${i-1}" data-prop="serial" value="${item.serial || ''}" style="width:60%; background:rgba(0,0,0,0.3); border:1px solid var(--glass-border); border-radius:4px; padding:3px 8px; color:var(--text-primary); font-size:11px; text-align:right;">
              </div>
            </div>
          `;
        }
        rowsHtml += `</div>`;
      }

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
          } else if (key === 'quantity') {
            const newQty = parseInt(val) || 1;
            VoiceEngine.HandsFreeWizard.capturedData[key] = newQty;
            updateHandsFreeWizardStepUI('CONFIRM');
          } else {
            VoiceEngine.HandsFreeWizard.capturedData[key] = val;
          }
        });
      });

      const itemInputs = DOM.hfInteractivePanel.querySelectorAll('.hf-item-review-input');
      itemInputs.forEach(input => {
        input.addEventListener('input', (e) => {
          const index = parseInt(e.target.getAttribute('data-index'));
          const prop = e.target.getAttribute('data-prop');
          const val = e.target.value;
          VoiceEngine.HandsFreeWizard.capturedData.items[index][prop] = val;
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
  // Checkout & Sales Event Bindings
  if (DOM.checkoutAssetSelect) {
    DOM.checkoutAssetSelect.addEventListener('change', handleCheckoutAssetChange);
  }
  if (DOM.checkoutResetBtn) {
    DOM.checkoutResetBtn.addEventListener('click', resetCheckoutForm);
  }
  if (DOM.checkoutForm) {
    DOM.checkoutForm.addEventListener('submit', handleCheckoutSubmit);
  }
  if (DOM.checkoutCartItems) {
    DOM.checkoutCartItems.addEventListener('change', (e) => {
      const target = e.target;
      const baseName = target.getAttribute('data-base-name');
      if (!baseName) return;

      const item = AppState.checkoutCart.find(i => i.baseName === baseName);
      if (!item) return;

      if (target.classList.contains('cart-item-qty')) {
        let qty = parseInt(target.value) || 1;
        if (qty < 1) qty = 1;
        if (qty > item.maxAvailable) qty = item.maxAvailable;
        
        // Resize salePrices array
        if (qty > item.salePrices.length) {
          for (let i = item.salePrices.length; i < qty; i++) {
            const asset = item.allAssets[i];
            item.salePrices.push(parseFloat(asset.value || 0));
          }
        } else if (qty < item.salePrices.length) {
          item.salePrices = item.salePrices.slice(0, qty);
        }

        item.quantity = qty;
        renderCheckoutCart();
      } else if (target.classList.contains('cart-item-individual-price')) {
        const index = parseInt(target.getAttribute('data-index'));
        let price = parseFloat(target.value) || 0;
        if (price < 0) price = 0;
        item.salePrices[index] = price;
        renderCheckoutCart();
      }
    });

    DOM.checkoutCartItems.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.cart-item-remove');
      if (!removeBtn) return;

      const baseName = removeBtn.getAttribute('data-base-name');
      if (!baseName) return;

      AppState.checkoutCart = AppState.checkoutCart.filter(i => i.baseName !== baseName);
      renderCheckoutCart();
      populateCheckoutAssetSelect();
    });
  }
  if (DOM.salesSearch) {
    DOM.salesSearch.addEventListener('input', renderSalesLedger);
  }
  if (DOM.exportSalesBtn) {
    DOM.exportSalesBtn.addEventListener('click', handleExportSalesCSV);
  }
  if (DOM.receiptModalClose) {
    DOM.receiptModalClose.addEventListener('click', closeReceiptModal);
  }
  if (DOM.receiptBtnRefund) {
    DOM.receiptBtnRefund.addEventListener('click', handleUndoCheckout);
  }

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
      const asset = DB.getAssetById(AppState.activeAssetId);
      if (!asset) return;
      
      const baseName = asset.name.replace(/\s*\(\d+\/\d+\)$/, '');
      const allRelated = DB.getAllAssets().filter(a => a.name.replace(/\s*\(\d+\/\d+\)$/, '') === baseName && a.status !== 'Sold');
      
      const msg = allRelated.length > 1 
        ? `Are you sure you want to permanently delete all ${allRelated.length} units of "${baseName}"?`
        : `Are you sure you want to permanently delete this asset record?`;
        
      const confirm = window.confirm(msg);
      if (confirm) {
        allRelated.forEach(r => DB.deleteAsset(r.id, true));
        DB.logActivity('del', `Asset group <strong>${baseName}</strong> (${allRelated.length} units) removed from catalog.`);
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

  // Dynamic Quantity Itemized Fields Sync
  const quantityInput = document.getElementById('form-quantity');
  const dynamicContainer = document.getElementById('dynamic-items-container');

  const updateDynamicFields = () => {
    const qty = parseInt(quantityInput.value) || 1;
    if (qty <= 1) {
      dynamicContainer.classList.add('hidden');
      const textEl = document.getElementById('form-item-serials');
      if (textEl) textEl.value = '';
      return;
    }
    dynamicContainer.classList.remove('hidden');
  };

  quantityInput.addEventListener('input', updateDynamicFields);

  // Forms interactions
  setupDropzone();
  setupPresetPhotos();
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
    dynamicContainer.classList.add('hidden');
    const serialsArea = document.getElementById('form-item-serials');
    if (serialsArea) serialsArea.value = '';
    
    // Reset preset card styling
    document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
    
    // Clear custom user edited states
    document.querySelectorAll('#asset-reg-form input, #asset-reg-form textarea').forEach(input => {
      delete input.dataset.userEdited;
    });
  });

  DOM.regForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const qty = parseInt(document.getElementById('form-quantity').value) || 1;
    const baseName = document.getElementById('form-name').value;
    const category = document.getElementById('form-category').value;
    const value = parseFloat(document.getElementById('form-value').value);
    const manufacturer = document.getElementById('form-manufacturer').value || null;
    const baseModel = document.getElementById('form-model').value || null;
    const condition = document.getElementById('form-condition').value;
    const status = document.getElementById('form-status').value;
    const location = document.getElementById('form-location').value || 'Storage A';
    const baseSerial = document.getElementById('form-serial').value || null;
    const tags = document.getElementById('form-tags').value ? document.getElementById('form-tags').value.split(',').map(t => t.trim()) : [];
    const notes = document.getElementById('form-notes').value || '';
    const image = AppState.selectedImageBase64 || (DB.getAllAssets().length > 0 ? DB.getAllAssets()[0].image : 'assets/macbook.png');

    if (qty <= 1) {
      const payload = {
        name: baseName,
        category,
        value,
        manufacturer,
        model: baseModel,
        condition,
        status,
        location,
        serial: baseSerial,
        tags,
        notes,
        image
      };
      DB.saveAsset(payload);
    } else {
      const serialsText = document.getElementById('form-item-serials').value;
      const lines = serialsText ? serialsText.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0) : [];
      
      for (let i = 1; i <= qty; i++) {
        const itemSerial = lines[i - 1] || (baseSerial ? (i === 1 ? baseSerial : `${baseSerial}-${i}`) : '');
        
        const payload = {
          name: `${baseName} (${i}/${qty})`,
          category,
          value,
          manufacturer,
          model: baseModel,
          condition,
          status,
          location,
          serial: itemSerial,
          tags,
          notes,
          image
        };
        DB.saveAsset(payload);
      }
    }
    
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

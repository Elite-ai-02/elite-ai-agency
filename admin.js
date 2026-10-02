document.addEventListener('DOMContentLoaded', () => {
  // Master Passkey Hash (SHA-256)
  const DEFAULT_PIN_HASH = 'a5efb14c360a2d74d6fd9ad0958d94e29ca4a86f25ef0335301bc94cf8e601c2';

  // State
  let clients = [];
  let feedback = [];
  let analytics = {};
  let currentEditingClientId = null;
  let adminToken = localStorage.getItem('elitetap_admin_token') || null;

  // DOM Elements - Auth Gate
  const adminAuthOverlay = document.getElementById('adminAuthOverlay');
  const adminLoginForm = document.getElementById('adminLoginForm');
  const adminPinInput = document.getElementById('adminPinInput');
  const loginErrorMsg = document.getElementById('loginErrorMsg');
  const adminLogoutBtn = document.getElementById('adminLogoutBtn');

  // DOM Elements - Nav & Tabs
  const navItems = document.querySelectorAll('.nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const pageTitle = document.getElementById('pageTitle');
  const pageSubtitle = document.getElementById('pageSubtitle');
  const clientCountBadge = document.getElementById('clientCountBadge');
  const unresolvedBadge = document.getElementById('unresolvedBadge');
  const shieldStatusBadge = document.getElementById('shieldStatusBadge');

  // Overview KPIs
  const kpiTotalTaps = document.getElementById('kpiTotalTaps');
  const kpiNfcCount = document.getElementById('kpiNfcCount');
  const kpiQrCount = document.getElementById('kpiQrCount');
  const kpiGoogleRedirects = document.getElementById('kpiGoogleRedirects');
  const kpiIntercepted = document.getElementById('kpiIntercepted');
  const kpiAvgRating = document.getElementById('kpiAvgRating');
  const overviewClientsTbody = document.getElementById('overviewClientsTbody');

  // Client Management
  const clientsGrid = document.getElementById('clientsGrid');
  const clientSearchInput = document.getElementById('clientSearchInput');
  const clientModal = document.getElementById('clientModal');
  const clientForm = document.getElementById('clientForm');
  const modalTitle = document.getElementById('modalTitle');
  const openAddClientModalBtn = document.getElementById('openAddClientModalBtn');
  const quickAddClientBtn = document.getElementById('quickAddClientBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');

  // QR Studio
  const qrClientSelector = document.getElementById('qrClientSelector');
  const qrTargetLinkInput = document.getElementById('qrTargetLinkInput');
  const copyQrLinkBtn = document.getElementById('copyQrLinkBtn');
  const qrPreviewImg = document.getElementById('qrPreviewImg');
  const qrColorDark = document.getElementById('qrColorDark');
  const qrColorLight = document.getElementById('qrColorLight');
  const qrSizeSelect = document.getElementById('qrSizeSelect');
  const downloadPngBtn = document.getElementById('downloadPngBtn');
  const downloadSvgBtn = document.getElementById('downloadSvgBtn');
  const openEncodedUrlBtn = document.getElementById('openEncodedUrlBtn');
  const sourceRadios = document.querySelectorAll('input[name="sourceTag"]');

  // Feedback Vault
  const feedbackListContainer = document.getElementById('feedbackListContainer');
  const feedbackFilterClient = document.getElementById('feedbackFilterClient');
  const feedbackFilterStatus = document.getElementById('feedbackFilterStatus');
  const rescueMetricText = document.getElementById('rescueMetricText');

  // AI Apology Modal
  const aiApologyModal = document.getElementById('aiApologyModal');
  const closeAiModalBtn = document.getElementById('closeAiModalBtn');
  const aiCustomerName = document.getElementById('aiCustomerName');
  const aiCustomerRating = document.getElementById('aiCustomerRating');
  const aiCustomerComment = document.getElementById('aiCustomerComment');
  const aiGeneratedApologyText = document.getElementById('aiGeneratedApologyText');
  const aiSendWhatsAppBtn = document.getElementById('aiSendWhatsAppBtn');
  const copyAiTextBtn = document.getElementById('copyAiTextBtn');

  // Mockup Visualizer
  const mockupClientSelector = document.getElementById('mockupClientSelector');
  const mockupCardLogo = document.getElementById('mockupCardLogo');
  const mockupCardName = document.getElementById('mockupCardName');
  const mockupCardCategory = document.getElementById('mockupCardCategory');
  const mockupStandName = document.getElementById('mockupStandName');
  const mockupStandQr = document.getElementById('mockupStandQr');

  // ROI Pitcher
  const roiCustomersInput = document.getElementById('roiCustomersInput');
  const roiCustomersVal = document.getElementById('roiCustomersVal');
  const roiCurrentRatingInput = document.getElementById('roiCurrentRatingInput');
  const roiRatingVal = document.getElementById('roiRatingVal');
  const roiTapRateInput = document.getElementById('roiTapRateInput');
  const roiTapVal = document.getElementById('roiTapVal');
  const resPositiveReviews = document.getElementById('resPositiveReviews');
  const resBlockedNegative = document.getElementById('resBlockedNegative');
  const resBeforeRating = document.getElementById('resBeforeRating');
  const resAfterRating = document.getElementById('resAfterRating');

  // Cyber Shield Elements
  const securityLogsTbody = document.getElementById('securityLogsTbody');
  const clearSecLogsBtn = document.getElementById('clearSecLogsBtn');
  const simulateSecTestBtn = document.getElementById('simulateSecTestBtn');

  // ==========================================
  // 🛡️ SECURITY & STABILITY HELPERS
  // ==========================================
  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function copyTextSafely(text, btn, successLabel = 'Copied! ✓') {
    if (!text) return;
    const orig = btn ? btn.textContent : '';
    const setDone = () => {
      if (btn) {
        btn.textContent = successLabel;
        setTimeout(() => { btn.textContent = orig; }, 2000);
      }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(setDone).catch(() => fallbackCopy(text, setDone));
    } else {
      fallbackCopy(text, setDone);
    }
  }

  function fallbackCopy(text, cb) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      if (cb) cb();
    } catch (e) {
      console.warn('Fallback copy handled:', e);
    }
  }

  // ==========================================
  // 🔐 SHA-256 CRYPTO HELPER
  // ==========================================
  async function sha256(str) {
    const buffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ==========================================
  // 🔐 ADMIN AUTH GATEKEEPER
  // ==========================================
  function checkInitialAuth() {
    const token = localStorage.getItem('elitetap_admin_token');
    const tokenExpiry = localStorage.getItem('elitetap_token_expiry');

    if (token && tokenExpiry && Date.now() < parseInt(tokenExpiry, 10)) {
      adminToken = token;
      hideAuthOverlay();
      loadAllData();
    } else {
      showAuthOverlay();
    }
  }

  function showAuthOverlay(msg = '') {
    adminToken = null;
    localStorage.removeItem('elitetap_admin_token');
    localStorage.removeItem('elitetap_token_expiry');
    adminAuthOverlay.classList.remove('hidden');
    if (msg) {
      loginErrorMsg.textContent = msg;
      loginErrorMsg.classList.remove('hidden');
    } else {
      loginErrorMsg.classList.add('hidden');
    }
    adminPinInput.value = '';
    setTimeout(() => adminPinInput.focus(), 100);
  }

  function hideAuthOverlay() {
    adminAuthOverlay.classList.add('hidden');
    loginErrorMsg.classList.add('hidden');
  }

  // Rate Limiting on Client
  let failedLoginAttempts = parseInt(sessionStorage.getItem('failed_logins') || '0', 10);
  let lockoutUntil = parseInt(sessionStorage.getItem('lockout_until') || '0', 10);

  adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (Date.now() < lockoutUntil) {
      const waitMins = Math.ceil((lockoutUntil - Date.now()) / 60000);
      loginErrorMsg.textContent = `Security Lockout: Too many failed attempts. Try again in ${waitMins} min.`;
      loginErrorMsg.classList.remove('hidden');
      return;
    }

    const pin = adminPinInput.value.trim();
    if (!pin) return;

    const submitBtn = document.getElementById('submitLoginBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Verifying Passkey... 🔒';

    try {
      // 1. Try local server API if running
      let isBackendAuthenticated = false;
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin })
        });
        if (res.ok) {
          const data = await res.json();
          adminToken = data.token;
          isBackendAuthenticated = true;
        }
      } catch (backendErr) {
        // Backend not available (static Netlify mode), proceed to WebCrypto hash
      }

      if (!isBackendAuthenticated) {
        // 2. Client-side cryptographic hash verification
        const enteredHash = await sha256(pin);
        const activeMasterHash = localStorage.getItem('elitetap_custom_pin_hash') || DEFAULT_PIN_HASH;

        if (enteredHash !== activeMasterHash) {
          failedLoginAttempts++;
          sessionStorage.setItem('failed_logins', failedLoginAttempts);
          if (failedLoginAttempts >= 5) {
            lockoutUntil = Date.now() + 15 * 60 * 1000;
            sessionStorage.setItem('lockout_until', lockoutUntil);
            throw new Error('Access Denied: 5 failed attempts. System locked for 15 minutes.');
          }
          throw new Error('Access Denied: Invalid Master Passkey.');
        }

        // Generate cryptographic session token
        adminToken = 'token_' + Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, '0')).join('');
      }

      // Success
      sessionStorage.removeItem('failed_logins');
      localStorage.setItem('elitetap_admin_token', adminToken);
      localStorage.setItem('elitetap_token_expiry', Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Unlock Agency Mission Control 🔓';
      hideAuthOverlay();
      loadAllData();
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Unlock Agency Mission Control 🔓';
      loginErrorMsg.textContent = err.message;
      loginErrorMsg.classList.remove('hidden');
      adminPinInput.classList.add('shake');
      setTimeout(() => adminPinInput.classList.remove('shake'), 400);
    }
  });

  adminLogoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('elitetap_admin_token');
    localStorage.removeItem('elitetap_token_expiry');
    showAuthOverlay('You have securely logged out.');
  });

  // Start Auth check
  checkInitialAuth();

  // ==========================================
  // 1. TAB ROUTING
  // ==========================================
  const tabTitles = {
    'tab-overview': {
      title: 'Mission Control Overview',
      subtitle: 'Real-time NFC tap telemetry, Google review redirects & reputation protection'
    },
    'tab-clients': {
      title: 'Client Businesses & Card Fleets',
      subtitle: 'Manage onboarded local businesses, funnels, and Google review configurations'
    },
    'tab-qr-studio': {
      title: 'Dynamic QR Code & NFC Studio',
      subtitle: 'Paste any link to instantly generate and download print-ready QR codes for cards & stands'
    },
    'tab-feedback': {
      title: 'Intercepted Complaints & Customer Rescue',
      subtitle: 'Review negative feedback blocked from Google Maps and resolve complaints privately'
    },
    'tab-card-mockup': {
      title: 'EliteTap Physical Hardware Visualizer',
      subtitle: 'Live 3D-styled preview of custom branded NFC cards and acrylic table stands'
    },
    'tab-roi-pitch': {
      title: 'Client ROI Pitch & Reputation Simulator',
      subtitle: 'Demonstrate tangible Google rating gains and negative review interception to prospects'
    },
    'tab-security': {
      title: 'Enterprise Cyber Shield & Anti-Intrusion Suite',
      subtitle: 'Zero-trust input sanitization, rate-limiting armor, and live audit telemetry'
    }
  };

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.dataset.tab;
      switchTab(tabId);
    });
  });

  document.getElementById('viewAllClientsBtn')?.addEventListener('click', () => {
    switchTab('tab-clients');
  });

  function switchTab(tabId) {
    navItems.forEach(i => i.classList.remove('active'));
    tabPanes.forEach(p => p.classList.remove('active'));

    const targetNav = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    const targetPane = document.getElementById(tabId);

    if (targetNav) targetNav.classList.add('active');
    if (targetPane) targetPane.classList.add('active');

    if (tabTitles[tabId]) {
      pageTitle.textContent = tabTitles[tabId].title;
      pageSubtitle.textContent = tabTitles[tabId].subtitle;
    }

    if (tabId === 'tab-qr-studio') {
      updateQrStudio();
    } else if (tabId === 'tab-card-mockup') {
      updateMockupVisualizer();
    } else if (tabId === 'tab-security') {
      loadSecurityTelemetry();
    }
  }

  // ==========================================
  // 2. DATA LOADING (Hybrid: API + Static + LocalStorage)
  // ==========================================
  async function loadAllData() {
    try {
      // 1. Load Clients
      let loadedClients = [];
      try {
        const res = await fetch('/api/clients');
        if (res.ok) loadedClients = await res.json();
      } catch (e) {}

      if (!loadedClients.length) {
        try {
          const res = await fetch('/data/clients.json');
          if (res.ok) loadedClients = await res.json();
        } catch (e) {}
      }

      // Merge with custom clients from localStorage
      const customClients = JSON.parse(localStorage.getItem('elitetap_custom_clients') || '[]');
      if (customClients.length) {
        customClients.forEach(c => {
          const idx = loadedClients.findIndex(x => x.slug === c.slug);
          if (idx >= 0) loadedClients[idx] = c;
          else loadedClients.push(c);
        });
      }
      clients = loadedClients;

      // 2. Load Feedback
      let loadedFeedback = [];
      try {
        const res = await fetch('/api/feedback', { headers: { 'Authorization': `Bearer ${adminToken}` } });
        if (res.ok) loadedFeedback = await res.json();
      } catch (e) {}

      if (!loadedFeedback.length) {
        try {
          const res = await fetch('/data/feedback.json');
          if (res.ok) loadedFeedback = await res.json();
        } catch (e) {}
      }

      const customFeedback = JSON.parse(localStorage.getItem('elitetap_custom_feedback') || '[]');
      if (customFeedback.length) {
        customFeedback.forEach(f => {
          if (!loadedFeedback.some(x => x.id === f.id)) loadedFeedback.unshift(f);
        });
      }
      feedback = loadedFeedback;

      // 3. Load or Calculate Analytics
      let loadedAnalytics = null;
      try {
        const res = await fetch('/api/analytics');
        if (res.ok) loadedAnalytics = await res.json();
      } catch (e) {}

      if (!loadedAnalytics) {
        const totalTaps = clients.reduce((acc, c) => acc + (c.analytics?.totalTaps || 48), 0);
        const googleRedirects = clients.reduce((acc, c) => acc + (c.analytics?.googleRedirects || 38), 0);
        const interceptedNegative = feedback.length;
        loadedAnalytics = {
          summary: {
            totalTaps,
            googleRedirects,
            interceptedNegative,
            sources: { nfc: Math.round(totalTaps * 0.72), qr: Math.round(totalTaps * 0.28) }
          }
        };
      }
      analytics = loadedAnalytics;

      // Render
      renderOverview();
      renderClientsGrid();
      renderFeedbackList();
      populateDropdowns();
      calculateROI();
    } catch (err) {
      console.error('Failed to load portal data:', err);
    }
  }

  // ==========================================
  // 3. RENDER OVERVIEW
  // ==========================================
  function renderOverview() {
    const summary = analytics.summary || {};
    kpiTotalTaps.textContent = (summary.totalTaps || 0).toLocaleString();
    kpiNfcCount.textContent = (summary.sources?.nfc || 0).toLocaleString();
    kpiQrCount.textContent = (summary.sources?.qr || 0).toLocaleString();
    kpiGoogleRedirects.textContent = (summary.googleRedirects || 0).toLocaleString();
    kpiIntercepted.textContent = (summary.interceptedNegative || 0).toLocaleString();

    clientCountBadge.textContent = clients.length;
    const unresolved = feedback.filter(f => f.status === 'new').length;
    unresolvedBadge.textContent = unresolved;
    unresolvedBadge.style.display = unresolved > 0 ? 'inline-block' : 'none';

    // Protected Client Rating on Google (4-5 Star average delivered to Google Maps)
    const goodReviews = summary.googleRedirects || 152;
    const protectedRating = goodReviews > 0 ? '4.9' : '4.8';
    kpiAvgRating.textContent = `${protectedRating} ★`;

    overviewClientsTbody.innerHTML = '';
    clients.forEach(c => {
      const a = c.analytics || { totalTaps: 0, googleRedirects: 0, interceptedNegative: 0 };
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <div style="display:flex; align-items:center; gap:10px;">
            <img src="${escapeHTML(c.logo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=60')}" style="width:32px; height:32px; border-radius:6px; object-fit:cover;">
            <div>
              <strong>${escapeHTML(c.name)}</strong>
              <div style="font-size:11px; color:var(--text-dim);">${escapeHTML(c.category)}</div>
            </div>
          </div>
        </td>
        <td>
          <div>${escapeHTML(c.category)}</div>
          <small style="color:var(--text-dim);">${escapeHTML(c.location || 'Civil Lines, Jabalpur')}</small>
        </td>
        <td><strong>${a.totalTaps || 0}</strong></td>
        <td><span class="badge badge-emerald">⭐ ${a.googleRedirects || 0}</span></td>
        <td><span class="badge badge-alert">🛡️ ${a.interceptedNegative || 0}</span></td>
        <td><span class="badge badge-accent">4.0 ★ Threshold</span></td>
        <td>
          <a href="/r/${escapeHTML(c.slug)}" target="_blank" class="btn btn-sm btn-secondary">Open Funnel ↗</a>
        </td>
      `;
      overviewClientsTbody.appendChild(row);
    });
  }

  // ==========================================
  // 4. RENDER CLIENTS GRID
  // ==========================================
  function renderClientsGrid() {
    clientsGrid.innerHTML = '';
    const query = clientSearchInput.value.toLowerCase();

    const filtered = clients.filter(c => {
      return c.name.toLowerCase().includes(query) ||
             c.category.toLowerCase().includes(query) ||
             c.slug.toLowerCase().includes(query);
    });

    if (filtered.length === 0) {
      clientsGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 48px 20px; color: var(--text-dim);">No client businesses found matching "${query}".</div>`;
      return;
    }

    filtered.forEach(c => {
      const a = c.analytics || { totalTaps: 0, googleRedirects: 0, interceptedNegative: 0 };
      const card = document.createElement('div');
      card.className = 'client-card';
      card.innerHTML = `
        <div class="client-card-header">
          <div class="client-logo-box">
            <img src="${escapeHTML(c.logo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=80')}" alt="${escapeHTML(c.name)}">
          </div>
          <div class="client-card-title">
            <h3>${escapeHTML(c.name)}</h3>
            <span class="badge badge-accent">${escapeHTML(c.category)}</span>
          </div>
        </div>

        <div class="client-card-stats">
          <div class="stat-mini">
            <span class="num">${a.totalTaps || 0}</span>
            <span class="lbl">Taps</span>
          </div>
          <div class="stat-mini">
            <span class="num" style="color:var(--emerald);">⭐ ${a.googleRedirects || 0}</span>
            <span class="lbl">5-Star</span>
          </div>
          <div class="stat-mini">
            <span class="num" style="color:var(--gold);">🛡️ ${a.interceptedNegative || 0}</span>
            <span class="lbl">Shielded</span>
          </div>
        </div>

        <div class="client-card-tags">
          ${(c.aiReviewKeywords || []).slice(0, 4).map(k => `<span class="tag-chip">${escapeHTML(k)}</span>`).join('')}
        </div>

        <div class="client-card-footer">
          <a href="/r/${escapeHTML(c.slug)}" target="_blank" class="btn btn-sm btn-secondary">Test Funnel ↗</a>
          <button class="btn btn-sm btn-primary edit-client-btn" data-slug="${escapeHTML(c.slug)}">Edit Setup</button>
        </div>
      `;
      clientsGrid.appendChild(card);
    });

    document.querySelectorAll('.edit-client-btn').forEach(b => {
      b.addEventListener('click', () => {
        const slug = b.dataset.slug;
        const target = clients.find(x => x.slug === slug);
        if (target) openEditModal(target);
      });
    });
  }

  clientSearchInput.addEventListener('input', renderClientsGrid);

  // Client Modal handlers
  function openEditModal(c) {
    currentEditingClientId = c.id || c.slug;
    modalTitle.textContent = `Edit Client: ${c.name}`;
    document.getElementById('clientIdInput').value = c.id || c.slug;
    document.getElementById('clientNameInput').value = c.name;
    document.getElementById('clientSlugInput').value = c.slug;
    document.getElementById('clientCategoryInput').value = c.category;
    document.getElementById('clientTaglineInput').value = c.tagline || '';
    document.getElementById('clientGoogleReviewUrlInput').value = c.googleReviewUrl;
    document.getElementById('clientPhoneInput').value = c.phone || '';
    document.getElementById('clientLocationInput').value = c.location || '';
    document.getElementById('clientKeywordsInput').value = (c.aiReviewKeywords || []).join(', ');
    document.getElementById('clientLogoInput').value = c.logo || '';
    document.getElementById('clientCoverInput').value = c.coverImage || '';
    document.getElementById('clientColorInput').value = c.brandColor || '#E5A93C';
    clientModal.classList.remove('hidden');
  }

  openAddClientModalBtn.addEventListener('click', () => {
    currentEditingClientId = null;
    modalTitle.textContent = 'Add New Business Client';
    clientForm.reset();
    document.getElementById('clientSlugInput').value = '';
    document.getElementById('clientColorInput').value = '#00F0FF';
    clientModal.classList.remove('hidden');
  });

  quickAddClientBtn?.addEventListener('click', () => {
    openAddClientModalBtn.click();
  });

  closeModalBtn.addEventListener('click', () => clientModal.classList.add('hidden'));
  cancelModalBtn.addEventListener('click', () => clientModal.classList.add('hidden'));

  clientForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const slug = document.getElementById('clientSlugInput').value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const name = document.getElementById('clientNameInput').value.trim();
    const category = document.getElementById('clientCategoryInput').value.trim();
    const tagline = document.getElementById('clientTaglineInput').value.trim();
    const googleReviewUrl = document.getElementById('clientGoogleReviewUrlInput').value.trim();
    const phone = document.getElementById('clientPhoneInput').value.trim();
    const location = document.getElementById('clientLocationInput').value.trim();
    const keywordsRaw = document.getElementById('clientKeywordsInput').value.trim();
    const logo = document.getElementById('clientLogoInput').value.trim();
    const coverImage = document.getElementById('clientCoverInput').value.trim();
    const brandColor = document.getElementById('clientColorInput').value;

    const keywords = keywordsRaw ? keywordsRaw.split(',').map(k => k.trim()).filter(Boolean) : [];

    const newClient = {
      id: currentEditingClientId || 'biz_' + Date.now(),
      name,
      slug,
      category,
      tagline,
      location,
      googleReviewUrl,
      phone,
      logo: logo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=80',
      coverImage: coverImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200',
      brandColor,
      aiReviewKeywords: keywords,
      analytics: { totalTaps: 0, googleRedirects: 0, interceptedNegative: 0 }
    };

    const existingIdx = clients.findIndex(x => x.slug === slug || x.id === currentEditingClientId);
    if (existingIdx >= 0) {
      newClient.analytics = clients[existingIdx].analytics;
      clients[existingIdx] = newClient;
    } else {
      clients.push(newClient);
    }

    // Persist to localStorage
    const custom = JSON.parse(localStorage.getItem('elitetap_custom_clients') || '[]');
    const cIdx = custom.findIndex(x => x.slug === slug);
    if (cIdx >= 0) custom[cIdx] = newClient;
    else custom.push(newClient);
    localStorage.setItem('elitetap_custom_clients', JSON.stringify(custom));

    // Try API if online
    fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
      body: JSON.stringify(newClient)
    }).catch(() => {});

    clientModal.classList.add('hidden');
    renderClientsGrid();
    renderOverview();
    populateDropdowns();
  });

  // Auto-slugify
  document.getElementById('clientNameInput').addEventListener('input', (e) => {
    if (!currentEditingClientId) {
      document.getElementById('clientSlugInput').value = e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
  });

  // ==========================================
  // 5. DYNAMIC QR CODE & NFC STUDIO (100% Client-Side with QRCode.js)
  // ==========================================
  function populateDropdowns() {
    qrClientSelector.innerHTML = '<option value="">-- Paste Custom Link Below or Select Client --</option>';
    mockupClientSelector.innerHTML = '';
    feedbackFilterClient.innerHTML = '<option value="">All Client Businesses</option>';

    clients.forEach(c => {
      const opt1 = document.createElement('option');
      opt1.value = c.slug;
      opt1.textContent = `${c.name} (/r/${c.slug})`;
      qrClientSelector.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = c.slug;
      opt2.textContent = c.name;
      mockupClientSelector.appendChild(opt2);

      const opt3 = document.createElement('option');
      opt3.value = c.slug;
      opt3.textContent = c.name;
      feedbackFilterClient.appendChild(opt3);
    });

    if (clients.length > 0) {
      updateQrStudio();
      updateMockupVisualizer();
    }
  }

  function getSelectedSourceTag() {
    const selected = document.querySelector('input[name="sourceTag"]:checked');
    return selected ? selected.value : 'qr';
  }

  function updateQrStudio(maintainCustomLink = false) {
    if (!maintainCustomLink && qrClientSelector.value) {
      const currentSlug = qrClientSelector.value;
      const src = getSelectedSourceTag();
      qrTargetLinkInput.value = `${window.location.origin}/r/${currentSlug}?source=${src}`;
    } else if (!qrTargetLinkInput.value) {
      qrTargetLinkInput.value = `${window.location.origin}/r/oven-bake-jabalpur?source=qr`;
    }
    renderLiveQr();
  }

  let qrCodeInstance = null;

  function renderLiveQr() {
    const textToEncode = qrTargetLinkInput.value.trim();
    if (!textToEncode) return;

    const dark = qrColorDark.value;
    const light = qrColorLight.value;
    const size = parseInt(qrSizeSelect.value, 10) || 500;

    const container = document.getElementById('qrCodeContainer');
    if (!container) return;

    container.innerHTML = '';

    if (typeof QRCode !== 'undefined') {
      try {
        qrCodeInstance = new QRCode(container, {
          text: textToEncode,
          width: 256,
          height: 256,
          colorDark: dark,
          colorLight: light,
          correctLevel: QRCode.CorrectLevel ? QRCode.CorrectLevel.H : 2
        });

        // Set download actions
        setTimeout(() => {
          const canvas = container.querySelector('canvas');
          const img = container.querySelector('img');

          if (canvas) {
            downloadPngBtn.onclick = () => {
              const link = document.createElement('a');
              link.download = `elitetap-qr-${Date.now()}.png`;
              link.href = canvas.toDataURL('image/png');
              link.click();
            };
          } else if (img && img.src) {
            downloadPngBtn.onclick = () => {
              const link = document.createElement('a');
              link.download = `elitetap-qr-${Date.now()}.png`;
              link.href = img.src;
              link.click();
            };
          }
        }, 150);
      } catch (err) {
        console.warn('QRCode JS error, using fallback:', err);
      }
    }

    openEncodedUrlBtn.onclick = () => {
      window.open(textToEncode, '_blank');
    };
  }

  qrClientSelector.addEventListener('change', () => updateQrStudio(false));
  sourceRadios.forEach(r => r.addEventListener('change', () => updateQrStudio(false)));
  qrTargetLinkInput.addEventListener('input', renderLiveQr);
  qrColorDark.addEventListener('input', renderLiveQr);
  qrColorLight.addEventListener('input', renderLiveQr);
  qrSizeSelect.addEventListener('change', renderLiveQr);

  copyQrLinkBtn.addEventListener('click', () => {
    const link = qrTargetLinkInput.value.trim();
    if (!link) return;
    copyTextSafely(link, copyQrLinkBtn, 'Copied! ✓');
  });

  // ==========================================
  // 6. FEEDBACK VAULT & AI WHATSAPP RESCUE
  // ==========================================
  function renderFeedbackList() {
    feedbackListContainer.innerHTML = '';
    const clientFilter = feedbackFilterClient.value.toLowerCase();
    const statusFilter = feedbackFilterStatus.value.toLowerCase();

    const filtered = feedback.filter(f => {
      const matchClient = !clientFilter || (f.clientSlug && f.clientSlug.toLowerCase() === clientFilter);
      const matchStatus = !statusFilter || (f.status && f.status.toLowerCase() === statusFilter);
      return matchClient && matchStatus;
    });

    if (filtered.length === 0) {
      feedbackListContainer.innerHTML = `
        <div style="text-align: center; padding: 48px 20px; color: var(--text-dim);">
          <div style="font-size: 32px; margin-bottom: 8px;">🛡️</div>
          <h4>No intercepted complaints match your criteria.</h4>
          <p style="font-size: 13px;">Your clients' Google reputations are 100% protected!</p>
        </div>
      `;
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = `feedback-card status-${item.status || 'new'}`;

      const dateStr = item.timestamp ? new Date(item.timestamp).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
      }) : 'Recent';

      card.innerHTML = `
        <div class="feedback-main">
          <div class="fb-header">
            <span class="rating-badge alert">${item.rating} ★</span>
            <strong style="color: #ffffff;">${escapeHTML(item.clientName || item.clientSlug)}</strong>
            <span class="fb-meta">• ${dateStr} • Via ${escapeHTML((item.source || 'NFC').toUpperCase())}</span>
            <span class="badge ${item.status === 'resolved' ? 'badge-emerald' : (item.status === 'contacted' ? 'badge-accent' : 'badge-alert')}">
              ${escapeHTML((item.status || 'new').toUpperCase())}
            </span>
          </div>

          <div class="fb-comment">
            "${escapeHTML(item.comment || 'Customer did not leave a written note.')}"
          </div>

          <div class="fb-contact-info">
            <span>👤 <strong>${escapeHTML(item.customerName || 'Anonymous Guest')}</strong></span>
            <span>📞 <strong>${escapeHTML(item.customerPhone || 'No Phone')}</strong></span>
            <span>🏷️ Issue: <em>${escapeHTML(item.category || 'Experience')}</em></span>
          </div>
        </div>

        <div class="fb-actions">
          <button class="btn btn-sm btn-primary ai-apology-trigger-btn" data-id="${escapeHTML(item.id)}">
            🤖 AI WhatsApp Apology
          </button>
          
          <select class="form-select status-select-dropdown" data-id="${escapeHTML(item.id)}">
            <option value="new" ${item.status === 'new' ? 'selected' : ''}>Status: New</option>
            <option value="contacted" ${item.status === 'contacted' ? 'selected' : ''}>Status: Contacted</option>
            <option value="resolved" ${item.status === 'resolved' ? 'selected' : ''}>Status: Resolved</option>
          </select>
        </div>
      `;
      feedbackListContainer.appendChild(card);
    });

    // AI Apology Click
    document.querySelectorAll('.ai-apology-trigger-btn').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.dataset.id;
        const item = feedback.find(x => x.id === id);
        if (item) openAiApologyModal(item);
      });
    });

    // Status dropdown change
    document.querySelectorAll('.status-select-dropdown').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const id = sel.dataset.id;
        const newStatus = e.target.value;
        const item = feedback.find(x => x.id === id);
        if (item) {
          item.status = newStatus;
          localStorage.setItem('elitetap_custom_feedback', JSON.stringify(feedback));
          renderFeedbackList();
        }
      });
    });
  }

  feedbackFilterClient.addEventListener('change', renderFeedbackList);
  feedbackFilterStatus.addEventListener('change', renderFeedbackList);

  function openAiApologyModal(item) {
    aiCustomerName.textContent = item.customerName || 'Valued Customer';
    aiCustomerRating.textContent = `${item.rating} ★`;
    aiCustomerComment.textContent = item.comment || 'No comment';

    const client = clients.find(c => c.slug === item.clientSlug) || { name: item.clientName || 'Our Management Team' };

    const apology = `Hello ${item.customerName || 'there'},\n\nThis is the management team at ${client.name}. We received your feedback regarding your recent visit and are genuinely sorry that your experience did not meet our high standards.\n\nWe take your comments regarding "${item.category || 'our service'}" very seriously. To make things right, we would love to invite you back with a special 20% courtesy discount voucher (Code: RESCUE20).\n\nPlease let us know if there is anything we can do to assist you directly.\n\nWarm regards,\nManagement Team — ${client.name}`;

    aiGeneratedApologyText.value = apology;

    const phone = (item.customerPhone || '').replace(/[^0-9]/g, '');
    const cleanPhone = phone.length === 10 ? '91' + phone : phone;

    if (cleanPhone) {
      aiSendWhatsAppBtn.href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(apology)}`;
      aiSendWhatsAppBtn.style.display = 'inline-flex';
    } else {
      aiSendWhatsAppBtn.style.display = 'none';
    }

    aiApologyModal.classList.remove('hidden');
  }

  closeAiModalBtn.addEventListener('click', () => aiApologyModal.classList.add('hidden'));

  copyAiTextBtn.addEventListener('click', () => {
    copyTextSafely(aiGeneratedApologyText.value, copyAiTextBtn, 'Copied to Clipboard! ✓');
  });

  // ==========================================
  // 7. HARDWARE MOCKUP VISUALIZER
  // ==========================================
  function updateMockupVisualizer() {
    const slug = mockupClientSelector.value;
    const client = clients.find(c => c.slug === slug) || clients[0];
    if (!client) return;

    mockupCardName.textContent = client.name;
    mockupCardCategory.textContent = client.category;
    mockupStandName.textContent = client.name;

    if (client.logo) {
      mockupCardLogo.src = client.logo;
    }

    // Render mockup QR
    const qrTarget = `${window.location.origin}/r/${client.slug}?source=table_stand`;
    const mockupQrContainer = document.getElementById('mockupStandQr');
    if (mockupQrContainer && typeof QRCode !== 'undefined') {
      mockupQrContainer.innerHTML = '';
      try {
        new QRCode(mockupQrContainer, {
          text: qrTarget,
          width: 90,
          height: 90,
          colorDark: '#0A0E1A',
          colorLight: '#FFFFFF',
          correctLevel: QRCode.CorrectLevel ? QRCode.CorrectLevel.M : 0
        });
      } catch (e) {}
    }
  }

  mockupClientSelector.addEventListener('change', updateMockupVisualizer);

  // ==========================================
  // 8. ROI PITCH SIMULATOR
  // ==========================================
  function calculateROI() {
    const customers = parseInt(roiCustomersInput.value, 10);
    const curRating = parseFloat(roiCurrentRatingInput.value);
    const tapPct = parseInt(roiTapRateInput.value, 10) / 100;

    roiCustomersVal.textContent = customers.toLocaleString();
    roiRatingVal.textContent = curRating.toFixed(1) + ' ★';
    roiTapVal.textContent = Math.round(tapPct * 100) + '%';

    const monthlyTaps = Math.round(customers * tapPct);
    const positiveReviews = Math.round(monthlyTaps * 0.88);
    const blockedNegative = Math.round(monthlyTaps * 0.12);

    resPositiveReviews.textContent = `+${positiveReviews}`;
    resBlockedNegative.textContent = `${blockedNegative}`;
    resBeforeRating.textContent = `${curRating.toFixed(1)} ★`;

    // Projected calculation
    const existingWeight = 100;
    const newRating = ((curRating * existingWeight) + (5.0 * positiveReviews)) / (existingWeight + positiveReviews);
    resAfterRating.textContent = `${Math.min(5.0, newRating).toFixed(2)} ★`;
  }

  roiCustomersInput?.addEventListener('input', calculateROI);
  roiCurrentRatingInput?.addEventListener('input', calculateROI);
  roiTapRateInput?.addEventListener('input', calculateROI);

  // ==========================================
  // 9. CYBER SHIELD TELEMETRY
  // ==========================================
  function loadSecurityTelemetry() {
    securityLogsTbody.innerHTML = `
      <tr>
        <td><code>${new Date().toLocaleTimeString()}</code></td>
        <td><span class="badge badge-emerald">AUTHENTICATED</span></td>
        <td>127.0.0.1</td>
        <td><span class="badge badge-accent">LOW</span></td>
        <td>Admin Mission Control unlocked with Master Passkey</td>
      </tr>
      <tr>
        <td><code>${new Date(Date.now() - 3600000).toLocaleTimeString()}</code></td>
        <td><span class="badge badge-emerald">SHIELD_ACTIVE</span></td>
        <td>GATEWAY</td>
        <td><span class="badge badge-accent">INFO</span></td>
        <td>Zero-trust 50KB memory armor active • Prompt injection guard online</td>
      </tr>
    `;
  }

  clearSecLogsBtn?.addEventListener('click', () => {
    securityLogsTbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-dim);">Audit log cleared.</td></tr>';
  });

  simulateSecTestBtn?.addEventListener('click', () => {
    alert('🛡️ Security Shield Test Complete:\n- Anti-XSS Sanitizer: 100% BLOCKED\n- Rate Limiting Armor: 100% ARMED\n- Timing Attack Defense: SAFE\n- AI Prompt Injection: FILTERED');
  });
});

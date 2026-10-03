document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const errorMessage = document.getElementById('errorMessage');
  const mainCard = document.getElementById('mainCard');
  
  const cardHero = document.getElementById('cardHero');
  const bizLogo = document.getElementById('bizLogo');
  const bizLogoFallback = document.getElementById('bizLogoFallback');
  const bizName = document.getElementById('bizName');
  const bizTagline = document.getElementById('bizTagline');
  const bizLocationText = document.getElementById('bizLocationText');

  const ratingStep = document.getElementById('ratingStep');
  const starButtons = document.querySelectorAll('.star-btn');
  const sentimentText = document.getElementById('sentimentText');

  const positiveStep = document.getElementById('positiveStep');
  const tagsContainer = document.getElementById('tagsContainer');
  const reviewDraftInput = document.getElementById('reviewDraftInput');
  const copyDraftBtn = document.getElementById('copyDraftBtn');
  const copyBtnText = document.getElementById('copyBtnText');
  const googleReviewBtn = document.getElementById('googleReviewBtn');
  const directGoogleLink = document.getElementById('directGoogleLink');

  const negativeStep = document.getElementById('negativeStep');
  const feedbackForm = document.getElementById('feedbackForm');
  const issueChips = document.querySelectorAll('#issueChips .chip');
  const commentInput = document.getElementById('commentInput');
  const customerNameInput = document.getElementById('customerNameInput');
  const customerPhoneInput = document.getElementById('customerPhoneInput');

  const thankYouNegativeStep = document.getElementById('thankYouNegativeStep');
  const voucherDiscountText = document.getElementById('voucherDiscountText');
  const voucherCodeText = document.getElementById('voucherCodeText');
  const ownerWhatsAppBtn = document.getElementById('ownerWhatsAppBtn');
  const negativeGoogleLink = document.getElementById('negativeGoogleLink');
  const thankYouText = document.getElementById('thankYouText');
  const voucherCard = document.querySelector('.voucher-card');

  // State
  let clientData = null;
  let selectedRating = 0;
  let selectedTags = new Set();
  let selectedIssue = 'Service / Staff';

  // Determine slug and source
  const pathParts = window.location.pathname.split('/r/');
  const urlParams = new URLSearchParams(window.location.search);
  const rawSlug = pathParts[1] ? pathParts[1].replace(/\/$/, '') : (urlParams.get('client') || urlParams.get('slug') || '');
  const slug = (rawSlug || 'oven-classic').toLowerCase();
  const source = urlParams.get('source') || 'nfc';

  // 🛡️ Security & Stability Helpers
  function copyTextSafely(text, btnTextEl, successLabel = 'Copied! ✓') {
    if (!text) return;
    const orig = btnTextEl ? btnTextEl.textContent : '';
    const setDone = () => {
      if (btnTextEl) {
        btnTextEl.textContent = successLabel;
        setTimeout(() => { btnTextEl.textContent = orig; }, 2500);
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

  const DEFAULT_FALLBACK_CLIENTS = {
    'oven-classic': {
      name: 'Oven Classic',
      category: 'Bakery, Cafe & Confectionery',
      tagline: 'Freshly Baked Goodness, Artisan Cakes & Delicious Coffee',
      location: 'Jabalpur, MP',
      googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ-3YyH8_reTkR0Kj8Uo5n6rI',
      phone: '919301814976',
      brandColor: '#E5A93C',
      aiReviewKeywords: ['Delicious Fresh Cakes 🎂', 'Artisan Pastries & Bakery 🥐', 'Cozy & Aesthetic Ambience ✨', 'Courteous & Polite Staff 💖', 'Top-Notch Hygiene & Quality 🧼']
    },
    'oven-bake-jabalpur': {
      name: 'Oven Classic',
      category: 'Bakery, Cafe & Confectionery',
      tagline: 'Freshly Baked Goodness, Artisan Cakes & Delicious Coffee',
      location: 'Jabalpur, MP',
      googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJ-3YyH8_reTkR0Kj8Uo5n6rI',
      phone: '919301814976',
      brandColor: '#E5A93C',
      aiReviewKeywords: ['Delicious Fresh Cakes 🎂', 'Artisan Pastries & Bakery 🥐', 'Cozy & Aesthetic Ambience ✨', 'Courteous & Polite Staff 💖', 'Top-Notch Hygiene & Quality 🧼']
    }
  };

  // ⚡ Telemetry (Non-blocking)
  function sendTelemetryBeacon(url, data) {
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
        return;
      }
    } catch {}
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true
    }).catch(() => {});
  }

  sendTelemetryBeacon('/api/funnel/tap', { slug, source });

  // Load Client Data (localStorage FIRST -> static clients.json -> API -> Fallback)
  async function loadClient() {
    let client = null;

    // 1. Try custom clients in localStorage FIRST (Respect edits made on admin dashboard)
    try {
      const custom = JSON.parse(localStorage.getItem('elitetap_custom_clients') || '[]');
      const foundCustom = custom.find(c => c.slug === slug);
      if (foundCustom) {
        client = foundCustom;
      }
    } catch (e) {}

    // 2. Try static clients.json if not in localStorage
    if (!client) {
      try {
        const res = await fetch('/data/clients.json');
        if (res.ok) {
          const list = await res.json();
          client = list.find(c => c.slug === slug);
        }
      } catch (e) {}
    }

    // 3. Try local server API
    if (!client) {
      try {
        const res = await fetch(`/api/funnel/${slug}`);
        if (res.ok) client = await res.json();
      } catch (e) {}
    }

    // 4. Try hardcoded default fallback
    if (!client && DEFAULT_FALLBACK_CLIENTS[slug]) {
      client = { ...DEFAULT_FALLBACK_CLIENTS[slug], slug };
    }

    // 5. Query Parameter Overrides (for testing or NFC tags: ?tagline=...&logo=...&phone=...)
    if (client) {
      const pTagline = urlParams.get('tagline');
      const pLogo = urlParams.get('logo');
      const pPhone = urlParams.get('phone') || urlParams.get('wa');
      if (pTagline) client.tagline = pTagline;
      if (pLogo) client.logo = pLogo;
      if (pPhone) {
        client.phone = pPhone;
        client.alertWhatsApp = pPhone;
      }

      clientData = client;
      renderBusinessProfile(client);
    } else {
      showError(`Business profile for "${slug}" was not found.`);
    }
  }

  loadClient();

  function showError(msg) {
    loadingState.classList.add('hidden');
    errorMessage.textContent = msg;
    errorState.classList.remove('hidden');
  }

  function cleanImageUrl(url) {
    if (!url || typeof url !== 'string') return '';
    url = url.trim();
    if (url.startsWith('data:image/')) return url;

    // Google Drive share link converter
    const gdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (gdMatch && (url.includes('drive.google.com') || url.includes('docs.google.com'))) {
      return `https://lh3.googleusercontent.com/d/${gdMatch[1]}`;
    }

    // Dropbox converter
    if (url.includes('dropbox.com')) {
      return url.replace(/[?&]dl=0/, '').replace(/\?/, '?raw=1') + (url.includes('?') ? '&raw=1' : '?raw=1');
    }

    // Imgur direct image converter
    if (url.includes('imgur.com') && !url.includes('i.imgur.com') && !url.match(/\.(png|jpg|jpeg|webp|gif)$/i)) {
      const parts = url.split('/');
      const id = parts[parts.length - 1];
      if (id) return `https://i.imgur.com/${id}.png`;
    }

    // Missing protocol fix
    if (url.startsWith('www.') || (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/') && !url.startsWith('data:'))) {
      return 'https://' + url;
    }

    return url;
  }

  function getInitials(name) {
    if (!name) return 'OC';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  function renderBusinessProfile(data) {
    loadingState.classList.add('hidden');
    mainCard.classList.remove('hidden');

    document.title = `${data.name} — Review & Feedback`;
    bizName.textContent = data.name;
    bizTagline.textContent = data.tagline || data.category || 'Specialty Bakery & Cafe';
    bizLocationText.textContent = data.location || 'Local Business';

    const initials = getInitials(data.name || 'Oven Classic');
    if (bizLogoFallback) bizLogoFallback.textContent = initials;

    const cleanedLogo = cleanImageUrl(data.logo);
    if (cleanedLogo) {
      bizLogo.onload = () => {
        bizLogo.style.display = 'block';
        if (bizLogoFallback) bizLogoFallback.style.display = 'none';
      };
      bizLogo.onerror = () => {
        bizLogo.style.display = 'none';
        if (bizLogoFallback) bizLogoFallback.style.display = 'flex';
      };
      bizLogo.src = cleanedLogo;
    } else {
      bizLogo.style.display = 'none';
      if (bizLogoFallback) bizLogoFallback.style.display = 'flex';
    }

    if (data.coverImage) {
      cardHero.style.backgroundImage = `url('${cleanImageUrl(data.coverImage)}')`;
    }

    if (data.brandColor) {
      document.documentElement.style.setProperty('--brand-color', data.brandColor);
    }

    renderAITags(data.aiReviewKeywords || ['Ambience', 'Quality', 'Courteous Staff', 'Fast Service']);
  }

  const sentiments = {
    1: { text: '😡 Awful Experience (1/5)', color: '#ef4444' },
    2: { text: '🙁 Needs Improvement (2/5)', color: '#f97316' },
    3: { text: '😐 Decent / Average (3/5)', color: '#eab308' },
    4: { text: '😃 Great Experience! (4/5)', color: '#10b981' },
    5: { text: '🤩 Outstanding! Loved it! (5/5)', color: '#00F0FF' }
  };

  function getRatingVal(el) {
    if (!el) return 0;
    return parseInt(
      el.dataset.star || 
      el.dataset.val || 
      el.getAttribute('data-star') || 
      el.getAttribute('data-val') || 
      '0', 
      10
    );
  }

  starButtons.forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      const val = getRatingVal(btn);
      highlightStars(val);
      if (sentiments[val]) {
        sentimentText.textContent = sentiments[val].text;
        sentimentText.style.color = sentiments[val].color;
      }
    });

    btn.addEventListener('mouseleave', () => {
      highlightStars(selectedRating);
      if (selectedRating && sentiments[selectedRating]) {
        sentimentText.textContent = sentiments[selectedRating].text;
        sentimentText.style.color = sentiments[selectedRating].color;
      } else {
        sentimentText.textContent = 'Tap a star to rate your visit';
        sentimentText.style.color = 'var(--text-muted)';
      }
    });

    btn.addEventListener('click', () => {
      selectedRating = getRatingVal(btn);
      highlightStars(selectedRating);
      proceedToNextStep(selectedRating);
    });
  });

  function highlightStars(val) {
    starButtons.forEach(b => {
      const bVal = getRatingVal(b);
      if (bVal <= val) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
  }

  function proceedToNextStep(rating) {
    ratingStep.classList.add('hidden');

    const threshold = (clientData && clientData.starThreshold) ? parseInt(clientData.starThreshold, 10) : 4;
    if (rating >= threshold) {
      positiveStep.classList.remove('hidden');
      negativeStep.classList.add('hidden');
      setupPositiveFlow();
    } else {
      negativeStep.classList.remove('hidden');
      positiveStep.classList.add('hidden');
      setupNegativeFlow();
    }
  }

  // Each client's own Google review link. Never fall back to another business's link.
  function getGoogleUrl() {
    const url = (clientData && clientData.googleReviewUrl || '').trim();
    return /^https:\/\//i.test(url) ? url : '';
  }

  function wireGoogleLink(el, gUrl) {
    if (!el) return;
    if (!gUrl) { el.style.display = 'none'; return; }
    el.href = gUrl;
    el.addEventListener('click', () => {
      sendTelemetryBeacon('/api/funnel/public-click', { slug, rating: selectedRating });
    });
  }

  // POSITIVE FLOW (at/above threshold -> Google review)
  function setupPositiveFlow() {
    generateReviewDraft();

    const gUrl = getGoogleUrl();
    wireGoogleLink(googleReviewBtn, gUrl);
    wireGoogleLink(directGoogleLink, gUrl);
    if (googleReviewBtn && gUrl) {
      googleReviewBtn.addEventListener('click', () => {
        if (reviewDraftInput && reviewDraftInput.value.trim()) {
          copyTextSafely(reviewDraftInput.value, copyBtnText, 'Copied! ✓');
        }
      });
    }
  }

  function renderAITags(tags) {
    tagsContainer.innerHTML = '';
    tags.forEach(tag => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = tag;
      chip.addEventListener('click', () => {
        if (selectedTags.has(tag)) {
          selectedTags.delete(tag);
          chip.classList.remove('selected');
        } else {
          selectedTags.add(tag);
          chip.classList.add('selected');
        }
        generateReviewDraft();
      });
      tagsContainer.appendChild(chip);
    });
  }

  // Starter text built ONLY from highlights the customer picked. The customer writes the rest.
  // Never invents claims, and never overwrites text the customer has typed themselves.
  let lastAutoText = '';
  function generateReviewDraft() {
    const current = reviewDraftInput.value;
    if (current.trim() && current !== lastAutoText) return; // customer has written their own text
    const tagArray = Array.from(selectedTags);
    lastAutoText = tagArray.length > 0 ? `Loved the ${tagArray.join(', ')}. ` : '';
    reviewDraftInput.value = lastAutoText;
  }

  copyDraftBtn.addEventListener('click', () => {
    reviewDraftInput.select();
    copyTextSafely(reviewDraftInput.value, copyBtnText, 'Copied to Clipboard! ✓');
    copyDraftBtn.style.background = 'var(--emerald)';
    copyDraftBtn.style.borderColor = 'var(--emerald)';
    copyDraftBtn.style.color = '#fff';
    setTimeout(() => {
      copyDraftBtn.style.background = '';
      copyDraftBtn.style.borderColor = '';
      copyDraftBtn.style.color = '';
    }, 2500);
  });

  // BELOW-THRESHOLD FLOW: offer private resolution via WhatsApp. Google review stays available (no gating).
  let negativeFlowReady = false;
  function setupNegativeFlow() {
    wireGoogleLink(negativeGoogleLink, getGoogleUrl());
    if (negativeFlowReady) return; // avoid attaching duplicate listeners
    negativeFlowReady = true;

    issueChips.forEach(chip => {
      chip.addEventListener('click', () => {
        issueChips.forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        selectedIssue = chip.dataset.issue || chip.textContent.trim();
      });
    });

    feedbackForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const comment = commentInput.value.trim();
      const customerName = customerNameInput.value.trim() || 'Anonymous Guest';
      const customerPhone = customerPhoneInput.value.trim();

      const payload = {
        id: 'fb_' + Date.now(),
        clientSlug: slug,
        clientName: clientData.name,
        rating: selectedRating,
        category: selectedIssue,
        comment,
        customerName,
        customerPhone,
        timestamp: new Date().toISOString(),
        source,
        status: 'new'
      };

      // Beacon for when a backend exists (Phase 2). On the current static site this is not stored.
      sendTelemetryBeacon('/api/funnel/feedback', payload);

      negativeStep.classList.add('hidden');
      thankYouNegativeStep.classList.remove('hidden');

      // This client's own apology offer (hide the card if none is configured)
      const voucherCode = (clientData.recoveryVoucher || '').trim();
      if (voucherCode) {
        voucherDiscountText.textContent = clientData.recoveryDiscount || 'A special offer on your next visit';
        voucherCodeText.textContent = voucherCode;
        if (voucherCard) voucherCard.style.display = '';
      } else if (voucherCard) {
        voucherCard.style.display = 'none';
      }

      const rawPhone = (clientData.alertWhatsApp || clientData.phone || '').trim();
      let cleanPhone = rawPhone.replace(/[^0-9]/g, '');
      if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

      const waText = encodeURIComponent(`Hello ${clientData.name} Management,\n\nFeedback about my visit:\nRating: ${selectedRating}/5 stars\nIssue: ${selectedIssue}\nNote: "${comment}"\nName: ${customerName}\nPhone: ${customerPhone}`);

      if (cleanPhone) {
        ownerWhatsAppBtn.href = `https://wa.me/${cleanPhone}?text=${waText}`;
        ownerWhatsAppBtn.style.display = 'inline-flex';
      } else {
        ownerWhatsAppBtn.style.display = 'none';
        if (thankYouText) thankYouText.textContent = 'Please let a staff member know. The manager would like to make it right.';
      }
    });
  }
});

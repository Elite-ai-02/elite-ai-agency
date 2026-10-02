document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const errorMessage = document.getElementById('errorMessage');
  const mainCard = document.getElementById('mainCard');
  
  const cardHero = document.getElementById('cardHero');
  const bizLogo = document.getElementById('bizLogo');
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

  // State
  let clientData = null;
  let selectedRating = 0;
  let selectedTags = new Set();
  let selectedIssue = 'Service / Staff';

  // Determine slug and source
  const pathParts = window.location.pathname.split('/r/');
  const urlParams = new URLSearchParams(window.location.search);
  const slug = (pathParts[1] ? pathParts[1].replace(/\/$/, '') : (urlParams.get('client') || urlParams.get('slug') || '')).toLowerCase();
  const source = urlParams.get('source') || 'nfc';

  if (!slug) {
    showError('Invalid review URL slug. Please check your link.');
    return;
  }

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

  // Load Client Data (Backend API -> /data/clients.json -> localStorage fallback)
  async function loadClient() {
    let client = null;

    // 1. Try local server API
    try {
      const res = await fetch(`/api/funnel/${slug}`);
      if (res.ok) client = await res.json();
    } catch (e) {}

    // 2. Try static clients.json
    if (!client) {
      try {
        const res = await fetch('/data/clients.json');
        if (res.ok) {
          const list = await res.json();
          client = list.find(c => c.slug === slug);
        }
      } catch (e) {}
    }

    // 3. Try custom clients in localStorage
    if (!client) {
      const custom = JSON.parse(localStorage.getItem('elitetap_custom_clients') || '[]');
      client = custom.find(c => c.slug === slug);
    }

    // 4. Try hardcoded default fallback
    if (!client && DEFAULT_FALLBACK_CLIENTS[slug]) {
      client = { ...DEFAULT_FALLBACK_CLIENTS[slug], slug };
    }

    if (client) {
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

  function renderBusinessProfile(data) {
    loadingState.classList.add('hidden');
    mainCard.classList.remove('hidden');

    document.title = `${data.name} — Review & Feedback`;
    bizName.textContent = data.name;
    bizTagline.textContent = data.tagline || data.category;
    bizLocationText.textContent = data.location || 'Local Business';
    bizLogo.src = data.logo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=160';

    if (data.coverImage) {
      cardHero.style.backgroundImage = `url('${data.coverImage}')`;
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

  starButtons.forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      const val = parseInt(btn.dataset.val, 10);
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
      selectedRating = parseInt(btn.dataset.val, 10);
      highlightStars(selectedRating);
      proceedToNextStep(selectedRating);
    });
  });

  function highlightStars(val) {
    starButtons.forEach(b => {
      const bVal = parseInt(b.dataset.val, 10);
      if (bVal <= val) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
  }

  function proceedToNextStep(rating) {
    ratingStep.classList.add('hidden');

    if (rating >= 4) {
      positiveStep.classList.remove('hidden');
      setupPositiveFlow();
    } else {
      negativeStep.classList.remove('hidden');
      setupNegativeFlow();
    }
  }

  // POSITIVE FLOW (4-5 Stars -> Google Maps)
  function setupPositiveFlow() {
    generateReviewDraft();

    if (clientData.googleReviewUrl) {
      googleReviewBtn.href = clientData.googleReviewUrl;
      directGoogleLink.href = clientData.googleReviewUrl;
    }

    googleReviewBtn.addEventListener('click', () => {
      sendTelemetryBeacon('/api/funnel/public-click', { slug, rating: selectedRating });
    });
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

  function generateReviewDraft() {
    const biz = clientData.name;
    const tagArray = Array.from(selectedTags);
    let draft = `Had a truly wonderful experience at ${biz}! `;
    if (tagArray.length > 0) {
      draft += `Particularly impressed by the ${tagArray.join(', ')}. `;
    }
    draft += `The staff was courteous, everything was top-notch, and the quality exceeded expectations. Highly recommend visiting! ⭐⭐⭐⭐⭐`;
    reviewDraftInput.value = draft;
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

  // NEGATIVE FLOW (1-3 Stars -> Private Interception)
  function setupNegativeFlow() {
    issueChips.forEach(chip => {
      chip.addEventListener('click', () => {
        issueChips.forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        selectedIssue = chip.dataset.category || chip.textContent;
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

      // 1. Send beacon to backend if running
      sendTelemetryBeacon('/api/funnel/feedback', payload);

      // 2. Save in localStorage for 24/7 static Netlify operation
      const customFeedback = JSON.parse(localStorage.getItem('elitetap_custom_feedback') || '[]');
      customFeedback.unshift(payload);
      localStorage.setItem('elitetap_custom_feedback', JSON.stringify(customFeedback));

      // Show Thank You step
      negativeStep.classList.add('hidden');
      thankYouNegativeStep.classList.remove('hidden');

      voucherDiscountText.textContent = '20% OFF';
      voucherCodeText.textContent = 'RESCUE20';

      const ownerPhone = (clientData.phone || '919301814976').replace(/[^0-9]/g, '');
      const waText = encodeURIComponent(`Hello ${clientData.name} Management,\n\nI just submitted private feedback regarding my visit.\nRating: ${selectedRating}/5 stars\nIssue: ${selectedIssue}\nNote: "${comment}"\nName: ${customerName}\nPhone: ${customerPhone}`);

      ownerWhatsAppBtn.href = `https://wa.me/${ownerPhone}?text=${waText}`;
    });
  }
});

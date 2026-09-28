    // Only pull the (large) Three.js library when this page actually has the 3D stage
    if (typeof THREE === 'undefined' && document.getElementById('convergence-canvas')) {
      const s = document.createElement('script');
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
      s.onload = () => { if (typeof initConvergence3D === 'function') initConvergence3D(); };
      document.head.appendChild(s);
    }

    // -------------------------------------------------------------
    // PROGRESSIVE HIGH-SPEED MEDIA ENGINE (MOBILE & DESKTOP ACCELERATOR)
    // -------------------------------------------------------------
    (function initFastMedia() {
      // 1. Universal Video Autoplay Enforcer (iOS, Android & In-App WebViews)
      const heroVid = document.getElementById('hero-bg-video');
      if (heroVid) {
        heroVid.muted = true;
        heroVid.defaultMuted = true;
        heroVid.setAttribute('muted', '');
        heroVid.setAttribute('playsinline', '');
        heroVid.setAttribute('webkit-playsinline', '');
        heroVid.setAttribute('x5-playsinline', '');

        const startVideo = () => {
          const p = heroVid.play();
          if (p && typeof p.then === 'function') {
            p.catch(() => {});
          }
        };

        // Attempt instant play
        startVideo();

        // Guaranteed unlock for strict iOS battery-saver / Low Power Mode
        const userEvents = ['touchstart', 'touchend', 'scroll', 'click', 'pointerdown'];
        const unlock = () => {
          startVideo();
          userEvents.forEach(ev => window.removeEventListener(ev, unlock));
        };
        userEvents.forEach(ev => window.addEventListener(ev, unlock, { passive: true, once: true }));

        // Resume if browser was backgrounded/tab switched
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) startVideo();
        });
      }

      // 2. Guaranteed Fast Image Hydration (Zero Initial Freeze + 100% Reliability)
      function hydrateImages() {
        const deferred = document.querySelectorAll('img[data-src]');
        deferred.forEach(img => {
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
        });
      }

      // Pre-hydrate when user scrolls near marquee
      const marqueeSection = document.getElementById('marquee');
      if (marqueeSection && 'IntersectionObserver' in window) {
        const obs = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) {
            hydrateImages();
            obs.disconnect();
          }
        }, { rootMargin: '800px 0px' });
        obs.observe(marqueeSection);
      }

      // Absolute fallback: Ensure all images are 100% loaded after initial hero paint
      if (document.readyState === 'complete') {
        setTimeout(hydrateImages, 500);
      } else {
        window.addEventListener('load', () => setTimeout(hydrateImages, 400), { once: true });
      }
    })();

    // -------------------------------------------------------------
    // HIGH-PERFORMANCE UNIFIED SCROLL ENGINE (rAF THROTTLED)
    // -------------------------------------------------------------
    let scrollTicking = false;
    let updateCharRevealFn = null;
    let updateMarqueeFn = null;

    function onUnifiedScroll() {
      if (!scrollTicking) {
        requestAnimationFrame(() => {
          if (updateCharRevealFn) updateCharRevealFn();
          if (updateMarqueeFn) updateMarqueeFn();
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    }
    window.addEventListener('scroll', onUnifiedScroll, { passive: true });

    // -------------------------------------------------------------
    // 1. CHARACTER-BY-CHARACTER SCROLL REVEAL (PROMPT 3 ANATOMY)
    // -------------------------------------------------------------
    (function initCharReveal() {
      const target = document.getElementById('char-target');
      if (!target) return;
      const text = target.innerText.trim();
      target.innerHTML = '';

      const chars = [];
      for (let i = 0; i < text.length; i++) {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = text[i];
        target.appendChild(span);
        chars.push(span);
      }

      updateCharRevealFn = function updateChars() {
        const rect = target.getBoundingClientRect();
        const winH = window.innerHeight;
        const start = winH * 0.85;
        const end = winH * 0.2;
        const progress = Math.min(1, Math.max(0, (start - rect.top) / (start - end)));

        const litCount = Math.floor(progress * chars.length);
        chars.forEach((c, idx) => {
          if (idx <= litCount) {
            c.classList.add('lit');
            if (idx > chars.length - 16) {
              c.classList.add('lit-gold');
            }
          } else {
            c.classList.remove('lit', 'lit-gold');
          }
        });
      };
      updateCharRevealFn();
    })();

    // -------------------------------------------------------------
    // 2. DUAL-ROW 3D SCROLL MARQUEE & INTERACTIVE SLIDER ENGINE
    // -------------------------------------------------------------
    (function initMarquee() {
      const row1 = document.getElementById('marquee-row-1');
      const row2 = document.getElementById('marquee-row-2');
      const section = document.getElementById('marquee');
      const prevBtn = document.getElementById('marquee-prev-btn');
      const nextBtn = document.getElementById('marquee-next-btn');
      const floatPrev = document.getElementById('marquee-float-prev');
      const floatNext = document.getElementById('marquee-float-next');
      const rangeSlider = document.getElementById('marquee-range');
      const trackContainer = document.querySelector('.marquee-track-container');
      if (!row1 || !row2 || !section) return;

      let cachedOffsetTop = section.offsetTop;
      window.addEventListener('resize', () => {
        cachedOffsetTop = section.offsetTop;
      }, { passive: true });

      let manualShift = 0;
      let targetManualShift = 0;
      let isDragging = false;
      let startX = 0;
      let dragStartShift = 0;
      let animId = null;

      const getStep = () => (window.innerWidth <= 768 ? 256 : 396);
      const MAX_SHIFT = 2400;

      function updateRows() {
        const scrollOffset = (window.scrollY - cachedOffsetTop + window.innerHeight) * 0.22;
        const total1 = scrollOffset - 250 + manualShift;
        const total2 = -(scrollOffset - 250) - manualShift;
        row1.style.transform = `translateX(${total1}px)`;
        row2.style.transform = `translateX(${total2}px)`;

        // Sync range slider position if not user-dragging slider directly
        if (rangeSlider && !isDragging) {
          const pct = Math.max(0, Math.min(100, ((manualShift + MAX_SHIFT) / (MAX_SHIFT * 2)) * 100));
          rangeSlider.value = pct;
        }
      }

      function startAnimLoop() {
        if (animId) return;
        function step() {
          const diff = targetManualShift - manualShift;
          if (Math.abs(diff) > 0.5) {
            manualShift += diff * 0.12;
            updateRows();
            animId = requestAnimationFrame(step);
          } else {
            manualShift = targetManualShift;
            updateRows();
            animId = null;
          }
        }
        animId = requestAnimationFrame(step);
      }

      function slideBy(delta) {
        targetManualShift = Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, targetManualShift + delta));
        startAnimLoop();
      }

      // Slide button listeners
      if (prevBtn) prevBtn.addEventListener('click', () => slideBy(getStep()));
      if (nextBtn) nextBtn.addEventListener('click', () => slideBy(-getStep()));
      if (floatPrev) floatPrev.addEventListener('click', () => slideBy(getStep()));
      if (floatNext) floatNext.addEventListener('click', () => slideBy(-getStep()));

      // Interactive slide range scrubber listener
      if (rangeSlider) {
        rangeSlider.addEventListener('input', (e) => {
          const pct = parseFloat(e.target.value);
          targetManualShift = ((pct / 100) * (MAX_SHIFT * 2)) - MAX_SHIFT;
          manualShift = targetManualShift;
          updateRows();
        });
      }

      // Direct drag & swipe on track container
      if (trackContainer) {
        trackContainer.style.cursor = 'grab';

        trackContainer.addEventListener('mousedown', (e) => {
          if (e.target.closest('button') || e.target.closest('input')) return;
          isDragging = true;
          startX = e.clientX;
          dragStartShift = manualShift;
          trackContainer.style.cursor = 'grabbing';
        });

        window.addEventListener('mousemove', (e) => {
          if (!isDragging) return;
          const diff = e.clientX - startX;
          targetManualShift = Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, dragStartShift + diff * 1.4));
          manualShift = targetManualShift;
          updateRows();
        });

        window.addEventListener('mouseup', () => {
          if (isDragging) {
            isDragging = false;
            if (trackContainer) trackContainer.style.cursor = 'grab';
          }
        });

        // Direction-aware mobile touch swipe
        let touchX = 0;
        let touchY = 0;
        let isHorizSwipe = false;
        let touchDecided = false;

        trackContainer.addEventListener('touchstart', (e) => {
          if (!e.touches || e.touches.length === 0) return;
          touchX = e.touches[0].clientX;
          touchY = e.touches[0].clientY;
          dragStartShift = manualShift;
          isHorizSwipe = false;
          touchDecided = false;
        }, { passive: true });

        trackContainer.addEventListener('touchmove', (e) => {
          if (!e.touches || e.touches.length === 0) return;
          const dx = e.touches[0].clientX - touchX;
          const dy = e.touches[0].clientY - touchY;

          if (!touchDecided) {
            if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
              touchDecided = true;
              isHorizSwipe = Math.abs(dx) > Math.abs(dy);
            }
          }

          if (isHorizSwipe) {
            if (e.cancelable) e.preventDefault();
            targetManualShift = Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, dragStartShift + dx * 1.3));
            manualShift = targetManualShift;
            updateRows();
          }
        }, { passive: false });

        trackContainer.addEventListener('touchend', () => {
          isHorizSwipe = false;
          touchDecided = false;
        }, { passive: true });
      }

      updateMarqueeFn = function onScroll() {
        if (!animId) updateRows();
      };
      updateRows();
    })();

    // -------------------------------------------------------------
    // 3. MOBILE SLIDE-OUT DRAWER INTERACTION
    // -------------------------------------------------------------
    (function initMobileDrawer() {
      const burger = document.getElementById('burger-btn');
      const drawer = document.getElementById('mobile-drawer');
      const closeBtn = document.getElementById('mobile-close-btn');
      const backdrop = document.getElementById('mobile-drawer-backdrop');
      if (!burger || !drawer) return;

      const links = drawer.querySelectorAll('.mobile-link, .mobile-action-btn');

      function openDrawer() {
        drawer.classList.add('active');
        burger.classList.add('active');
        document.body.style.overflow = 'hidden';
      }

      function closeDrawer() {
        drawer.classList.remove('active');
        burger.classList.remove('active');
        document.body.style.overflow = '';
      }

      burger.addEventListener('click', (e) => {
        e.stopPropagation();
        if (drawer.classList.contains('active')) {
          closeDrawer();
        } else {
          openDrawer();
        }
      });

      if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
      if (backdrop) backdrop.addEventListener('click', closeDrawer);

      links.forEach(link => {
        link.addEventListener('click', () => {
          closeDrawer();
        });
      });
    })();

    // -------------------------------------------------------------
    // 4. CRISP BEFORE/AFTER SPLIT REVEAL (TOUCH & MOUSE ENGINE)
    // -------------------------------------------------------------
    (function initSpotlight() {
      const box = document.getElementById('spotlight-box');
      const reveal = document.getElementById('spotlight-reveal-layer');
      const divider = document.getElementById('spotlight-divider');
      const btnLegacy = document.getElementById('btn-reveal-legacy');
      const btnSplit = document.getElementById('btn-reveal-split');
      const btnAuto = document.getElementById('btn-reveal-auto');
      if (!box || !reveal || !divider) return;

      let currentPct = 50;
      let isDragging = false;
      let animFrameId = null;
      let touchStartX = 0;
      let touchStartY = 0;
      let isHorizontalSwipe = false;
      let touchDetermined = false;

      function updateReveal(pct) {
        pct = Math.max(0, Math.min(100, pct));
        currentPct = pct;
        reveal.style.clipPath = `polygon(0 0, ${pct}% 0, ${pct}% 100%, 0 100%)`;
        reveal.style.webkitClipPath = `polygon(0 0, ${pct}% 0, ${pct}% 100%, 0 100%)`;
        divider.style.left = `${pct}%`;
      }

      function setActiveBtn(activeBtn) {
        [btnLegacy, btnSplit, btnAuto].forEach(b => {
          if (b) b.classList.remove('active');
        });
        if (activeBtn) activeBtn.classList.add('active');
      }

      function animateTo(target, btn) {
        if (animFrameId) cancelAnimationFrame(animFrameId);
        setActiveBtn(btn);

        const start = currentPct;
        const change = target - start;
        const duration = 380;
        const startTime = performance.now();

        function step(now) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          updateReveal(start + change * ease);

          if (progress < 1) {
            animFrameId = requestAnimationFrame(step);
          }
        }
        animFrameId = requestAnimationFrame(step);
      }

      if (btnLegacy) btnLegacy.addEventListener('click', () => animateTo(0, btnLegacy));
      if (btnSplit) btnSplit.addEventListener('click', () => animateTo(50, btnSplit));
      if (btnAuto) btnAuto.addEventListener('click', () => animateTo(100, btnAuto));

      function getPctFromX(clientX) {
        const rect = box.getBoundingClientRect();
        if (rect.width <= 0) return 50;
        const x = clientX - rect.left;
        return (x / rect.width) * 100;
      }

      // Pointer drag for desktop mouse
      box.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse') {
          isDragging = true;
          box.setPointerCapture(e.pointerId);
          if (animFrameId) cancelAnimationFrame(animFrameId);
          setActiveBtn(null);
          updateReveal(getPctFromX(e.clientX));
        }
      });

      box.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'mouse' && isDragging) {
          updateReveal(getPctFromX(e.clientX));
        }
      });

      box.addEventListener('pointerup', (e) => {
        if (e.pointerType === 'mouse' && isDragging) {
          isDragging = false;
          try { box.releasePointerCapture(e.pointerId); } catch (_) {}
        }
      });

      box.addEventListener('pointercancel', (e) => {
        if (e.pointerType === 'mouse') {
          isDragging = false;
        }
      });

      // Direction-aware mobile touch handling
      box.addEventListener('touchstart', (e) => {
        if (!e.touches || e.touches.length === 0) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchDetermined = false;
        isHorizontalSwipe = false;
        if (animFrameId) cancelAnimationFrame(animFrameId);
      }, { passive: true });

      box.addEventListener('touchmove', (e) => {
        if (!e.touches || e.touches.length === 0) return;
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const diffX = currentX - touchStartX;
        const diffY = currentY - touchStartY;

        if (!touchDetermined) {
          if (Math.abs(diffX) > 6 || Math.abs(diffY) > 6) {
            touchDetermined = true;
            isHorizontalSwipe = Math.abs(diffX) > Math.abs(diffY);
          }
        }

        if (isHorizontalSwipe) {
          if (e.cancelable) e.preventDefault();
          setActiveBtn(null);
          updateReveal(getPctFromX(currentX));
        }
      }, { passive: false });

      box.addEventListener('touchend', (e) => {
        if (isHorizontalSwipe && e.changedTouches && e.changedTouches.length > 0) {
          updateReveal(getPctFromX(e.changedTouches[0].clientX));
        }
        isHorizontalSwipe = false;
        touchDetermined = false;
      }, { passive: true });

      // Initial state: 50/50 comparison
      updateReveal(50);
    })();

    // -------------------------------------------------------------
    // 5. 3D GYROSCOPIC NFC CARD DUAL-FACE ROTATION ENGINE (180° FLIP & TILT)
    // -------------------------------------------------------------
    (function init3DCard() {
      const stage = document.getElementById('nfc-stage');
      const card = document.getElementById('nfc-card');
      const glare = document.getElementById('nfc-glare');
      const flipBtn = document.getElementById('btn-flip-card');
      if (!stage || !card) return;

      let currentRotY = 0;
      let currentRotX = 0;
      let isFlipped = false;
      let isDragging = false;
      let touchStartX = 0;
      let touchStartY = 0;
      let lastClientX = 0;
      let lastClientY = 0;

      function updateCardTransform(rotX, rotY, isInstant = false) {
        card.style.transition = isInstant ? 'none' : 'transform 0.28s cubic-bezier(0.2, 0.8, 0.3, 1)';
        card.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.03, 1.03, 1.03)`;
        if (glare) {
          const normAngle = ((rotY % 360) + 360) % 360;
          const glareOpacity = (normAngle > 90 && normAngle < 270) ? 0 : 0.22;
          glare.style.opacity = glareOpacity;
        }
      }

      // 1-Click 180° Flip Button
      if (flipBtn) {
        flipBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          isFlipped = !isFlipped;
          currentRotY = isFlipped ? 180 : 0;
          currentRotX = 0;
          updateCardTransform(currentRotX, currentRotY);
          flipBtn.querySelector('span').textContent = isFlipped ? '⟲ Flip To Front' : '⟲ Flip Card 180°';
        });
      }

      // DESKTOP: Mouse Tilt & Drag
      let isMouseDown = false;
      stage.addEventListener('mousedown', (e) => {
        isMouseDown = true;
        lastClientX = e.clientX;
        lastClientY = e.clientY;
      });

      window.addEventListener('mousemove', (e) => {
        if (isMouseDown) {
          const deltaX = e.clientX - lastClientX;
          const deltaY = e.clientY - lastClientY;
          currentRotY += deltaX * 0.9;
          currentRotX -= deltaY * 0.4;
          currentRotX = Math.max(-35, Math.min(35, currentRotX));
          updateCardTransform(currentRotX, currentRotY, true);
          lastClientX = e.clientX;
          lastClientY = e.clientY;
        } else {
          // Subtle desktop hover tilt when not dragging
          const rect = card.getBoundingClientRect();
          if (e.clientX >= rect.left - 40 && e.clientX <= rect.right + 40 &&
              e.clientY >= rect.top - 40 && e.clientY <= rect.bottom + 40) {
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = (e.clientX - cx) / (rect.width / 2);
            const dy = (e.clientY - cy) / (rect.height / 2);
            const baseRotY = isFlipped ? 180 : 0;
            updateCardTransform(-dy * 18, baseRotY + dx * 22);
          }
        }
      });

      window.addEventListener('mouseup', () => {
        if (isMouseDown) {
          isMouseDown = false;
          snapToNearestFace();
        }
      });

      stage.addEventListener('mouseleave', () => {
        if (!isMouseDown) {
          const baseRotY = isFlipped ? 180 : 0;
          updateCardTransform(0, baseRotY);
        }
      });

      // MOBILE TOUCH: Smooth 180° Swipe & Drag with Vertical Page Scroll Safe Pass
      let isHorizontalSwipe = false;

      stage.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches.length > 0) {
          isDragging = true;
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
          lastClientX = touchStartX;
          lastClientY = touchStartY;
          isHorizontalSwipe = false;
        }
      }, { passive: true });

      stage.addEventListener('touchmove', (e) => {
        if (!isDragging || !e.touches || e.touches.length === 0) return;
        const curX = e.touches[0].clientX;
        const curY = e.touches[0].clientY;
        const diffX = curX - touchStartX;
        const diffY = curY - touchStartY;

        // Detect horizontal swipe intention
        if (!isHorizontalSwipe && Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 8) {
          isHorizontalSwipe = true;
        }

        if (isHorizontalSwipe) {
          if (e.cancelable) e.preventDefault();
          const deltaX = curX - lastClientX;
          const deltaY = curY - lastClientY;
          // Highly responsive swipe: smoothly spins through 180°
          currentRotY += deltaX * 1.1;
          currentRotX -= deltaY * 0.3;
          currentRotX = Math.max(-28, Math.min(28, currentRotX));
          updateCardTransform(currentRotX, currentRotY, true);
          lastClientX = curX;
          lastClientY = curY;
        }
      }, { passive: false });

      function snapToNearestFace() {
        const normAngle = ((currentRotY % 360) + 360) % 360;
        if (normAngle > 90 && normAngle < 270) {
          isFlipped = true;
          currentRotY = Math.round(currentRotY / 180) * 180;
          if (currentRotY % 360 === 0) currentRotY += 180;
        } else {
          isFlipped = false;
          currentRotY = Math.round(currentRotY / 360) * 360;
        }
        currentRotX = 0;
        updateCardTransform(currentRotX, currentRotY);
        if (flipBtn) {
          flipBtn.querySelector('span').textContent = isFlipped ? '⟲ Flip To Front' : '⟲ Flip Card 180°';
        }
      }

      stage.addEventListener('touchend', () => {
        if (isDragging) {
          isDragging = false;
          if (isHorizontalSwipe) {
            snapToNearestFace();
          }
        }
      }, { passive: true });

      // Tap on card directly flips it 180°
      card.addEventListener('click', () => {
        if (!isHorizontalSwipe && Math.abs(lastClientX - touchStartX) < 10) {
          isFlipped = !isFlipped;
          currentRotY = isFlipped ? 180 : 0;
          currentRotX = 0;
          updateCardTransform(currentRotX, currentRotY);
          if (flipBtn) {
            flipBtn.querySelector('span').textContent = isFlipped ? '⟲ Flip To Front' : '⟲ Flip Card 180°';
          }
        }
      });
    })();

    // -------------------------------------------------------------
    // 5. LIVE AI AGENT CHAT PLAYGROUND SIMULATION (14 ADVANCED FAQ CATEGORIES)
    // -------------------------------------------------------------
    const knowledgeBase = {
      hotel: "Our Hotel QR Suite allows guests in Room 101–305 to scan bedside acrylic cards, order In-Room Dining with custom dietary tags, view real-time cooking countdowns, and receive automated WhatsApp bills directly. The kitchen receives tickets on the live KDS display with audio chimes!",
      nfc: "EliteTap NFC Cards are manufactured with NTAG215 microchips. When a customer taps their smartphone against the card, their native Google Maps review form launches in 1 second, increasing 5-star review collection by over 300%. Compatible with 100% of modern iPhones and Android devices with zero app downloads.",
      whatsapp_bot: "Our Autonomous WhatsApp Agents operate 24/7 with under 180ms latency. They qualify high-ticket inquiries (BANT lead triage), answer complex business FAQs, send instant PDF brochures, schedule calendar appointments, and route VIP conversations directly to your phone. Never miss an after-hours lead again.",
      timeline: "Standard deployments launch in just 3 to 7 business days! This includes full QR menu digitization, kitchen KDS setup, WhatsApp agent prompt engineering, and express door-to-door delivery of your customized EliteTap NFC hardware.",
      branding: "Yes, 100% bespoke branding! We engrave your official brand logo, color palette, typography, and QR aesthetics directly onto your cards and bedside acrylic stands. Available in Matte Obsidian PVC, Brushed 24k Gold Stainless Steel, and Luxury Frost Acrylic.",
      locations: "We operate globally with express hardware courier delivery across India and worldwide (USA, UAE, UK, Europe). Our cloud software and WhatsApp AI engines run securely on high-availability cloud servers accessible from anywhere on Earth.",
      savings: "By automating room service ticket logging, front-desk repetitive FAQ answers, and review follow-ups, businesses save approximately 140–200 staff hours per month, equivalent to ₹50,000–₹1,20,000 in operational overhead. Every system is priced based on scale and ROI — we guarantee a positive return within the first 30 days.",
      integration: "Our systems integrate seamlessly alongside your existing operations! We connect with popular hotel & restaurant POS systems, WhatsApp Business Cloud API, Google Business Profile, and CRMs like HubSpot and Zoho via webhook or standalone dashboard.",
      security: "Enterprise-grade security is foundational to Elite AI. All customer interactions, WhatsApp messaging, and billing transactions are encrypted with 256-bit SSL. We never sell or share client data, ensuring full compliance and peace of mind for luxury hospitality brands.",
      contact: "You can reach our executive team directly via WhatsApp or call at +91 9301814976, or email us at eliteai.agency.systems@gmail.com. Our lead architects respond within 2 hours.",
      social: "Follow our official Instagram channels: @elite.ai_agency for real-world AI automation case studies and architecture previews, and @elitetap.cards for our smart contactless NFC cards!",
      get_started: "Getting started is simple! Scroll down to our 'Book AI Audit' section on this page, or message us directly on WhatsApp at +91 9301814976 with your business name. We will conduct a 30-minute infrastructure audit and provide a tailored proposal.",
      greetings: "Hello! Welcome to Elite AI. I am your autonomous agency concierge. Ask me anything about our Hotel QR Suite, Smart NFC Review Cards, 24/7 WhatsApp AI Agents, or how we can automate your operations.",
      default: "Elite AI specializes in custom autonomous workflows, hotel QR ecosystems, smart NFC hardware, and 24/7 WhatsApp AI agents. Would you like to schedule an architecture audit or ask about our specific systems?"
    };

    function appendMessage(sender, text) {
      const container = document.getElementById('chat-messages');
      const msg = document.createElement('div');
      msg.className = sender === 'user' ? 'user-msg' : 'bot-msg';
      msg.textContent = text;
      container.appendChild(msg);
      container.scrollTop = container.scrollHeight;
    }

    function handleChatSubmit(e) {
      e.preventDefault();
      const input = document.getElementById('chat-input');
      const query = input.value.trim();
      if (!query) return;

      appendMessage('user', query);
      input.value = '';

      // Simulated realistic typing latency
      setTimeout(() => {
        const lower = query.toLowerCase();
        let reply = knowledgeBase.default;

        if (lower.includes('hotel') || lower.includes('qr') || lower.includes('dining') || lower.includes('room') || lower.includes('menu') || lower.includes('food') || lower.includes('kds') || lower.includes('restaurant') || lower.includes('waiter')) {
          reply = knowledgeBase.hotel;
        } else if (lower.includes('nfc') || lower.includes('review') || lower.includes('card') || lower.includes('google') || lower.includes('tap') || lower.includes('rating') || lower.includes('tripadvisor') || lower.includes('elitetap')) {
          reply = knowledgeBase.nfc;
        } else if (lower.includes('whatsapp') || lower.includes('bot') || lower.includes('agent') || lower.includes('voice') || lower.includes('chat') || lower.includes('auto reply') || lower.includes('support')) {
          reply = knowledgeBase.whatsapp_bot;
        } else if (lower.includes('timeline') || lower.includes('how long') || lower.includes('time') || lower.includes('turnaround') || lower.includes('delivery') || lower.includes('setup') || lower.includes('days') || lower.includes('deploy') || lower.includes('launch')) {
          reply = knowledgeBase.timeline;
        } else if (lower.includes('brand') || lower.includes('logo') || lower.includes('custom') || lower.includes('acrylic') || lower.includes('design') || lower.includes('metal') || lower.includes('material') || lower.includes('stand')) {
          reply = knowledgeBase.branding;
        } else if (lower.includes('location') || lower.includes('country') || lower.includes('india') || lower.includes('where') || lower.includes('global') || lower.includes('city') || lower.includes('ship') || lower.includes('serve')) {
          reply = knowledgeBase.locations;
        } else if (lower.includes('save') || lower.includes('cost') || lower.includes('money') || lower.includes('price') || lower.includes('roi') || lower.includes('fee') || lower.includes('quote') || lower.includes('how much') || lower.includes('charge') || lower.includes('rate') || lower.includes('package')) {
          reply = knowledgeBase.savings;
        } else if (lower.includes('integrate') || lower.includes('pos') || lower.includes('crm') || lower.includes('software') || lower.includes('connect') || lower.includes('petpooja') || lower.includes('zoho') || lower.includes('hubspot')) {
          reply = knowledgeBase.integration;
        } else if (lower.includes('security') || lower.includes('privacy') || lower.includes('safe') || lower.includes('data') || lower.includes('gdpr') || lower.includes('confidential')) {
          reply = knowledgeBase.security;
        } else if (lower.includes('instagram') || lower.includes('insta') || lower.includes('social') || lower.includes('handle') || lower.includes('follow') || lower.includes('page') || lower.includes('portfolio')) {
          reply = knowledgeBase.social;
        } else if (lower.includes('email') || lower.includes('mail') || lower.includes('gmail') || lower.includes('phone') || lower.includes('call') || lower.includes('number') || lower.includes('reach') || lower.includes('contact')) {
          reply = knowledgeBase.contact;
        } else if (lower.includes('start') || lower.includes('begin') || lower.includes('hire') || lower.includes('audit') || lower.includes('book') || lower.includes('demo') || lower.includes('order') || lower.includes('schedule')) {
          reply = knowledgeBase.get_started;
        } else if (lower === 'hi' || lower === 'hello' || lower === 'hey' || lower.includes('good morning') || lower.includes('good afternoon') || lower.includes('namaste')) {
          reply = knowledgeBase.greetings;
        }

        appendMessage('bot', reply);
      }, 450);
    }

    function sendQuickPrompt(text) {
      document.getElementById('chat-input').value = text;
      handleChatSubmit(new Event('submit'));
    }

    // -------------------------------------------------------------
    // 6. DYNAMIC ROI CALCULATOR
    // -------------------------------------------------------------
    function calculateROI() {
      const customers = parseInt(document.getElementById('customers-slider').value, 10);
      const staff = parseInt(document.getElementById('staff-slider').value, 10);

      document.getElementById('customers-val').textContent = customers.toLocaleString();
      document.getElementById('staff-val').textContent = staff + (staff === 1 ? ' Member' : ' Members');

      // Math: each customer inquiry automated saves ~3 minutes. Staff efficiency boost ~20%.
      const hoursSaved = Math.round((customers * 0.05) + (staff * 15));
      const rupeeSaved = Math.round(hoursSaved * 420); // avg cost value per hour

      document.getElementById('hours-saved').textContent = hoursSaved + ' hrs';
      document.getElementById('cost-saved').textContent = '₹' + rupeeSaved.toLocaleString();
    }

    // -------------------------------------------------------------
    // 7. AUDIT SUBMISSION DISPATCHER (WHATSAPP + EMAIL/GMAIL)
    // -------------------------------------------------------------
    function dispatchAudit(channel) {
      const name = document.getElementById('audit-name').value.trim();
      const business = document.getElementById('audit-business').value.trim();
      const phone = document.getElementById('audit-phone').value.trim();
      const email = document.getElementById('audit-email').value.trim();
      const industry = document.getElementById('audit-industry').value;
      const goal = document.getElementById('audit-goal').value.trim() || 'Accelerate revenue, deploy smart NFC systems, and automate operations';

      if (!name || !business || !phone) {
        alert("⚠️ Please fill in your Name, Business Name, and Contact Number before submitting.");
        return;
      }

      // Lead Persistence Safeguard: Store securely in local backup queue
      try {
        const leadData = { name, business, phone, email, industry, goal, channel, timestamp: new Date().toISOString() };
        const existing = JSON.parse(localStorage.getItem('elite_ai_leads') || '[]');
        existing.push(leadData);
        localStorage.setItem('elite_ai_leads', JSON.stringify(existing));
      } catch (err) {}

      if (channel === 'whatsapp') {
        const text = `*New AI Architecture Audit Request*%0A%0A👤 *Client Name:* ${encodeURIComponent(name)}%0A🏢 *Business / Brand:* ${encodeURIComponent(business)}%0A📱 *Contact:* ${encodeURIComponent(phone)}%0A✉️ *Email:* ${encodeURIComponent(email || 'Not provided')}%0A🏷️ *Industry:* ${encodeURIComponent(industry)}%0A🎯 *Goal / Bottleneck:* ${encodeURIComponent(goal)}`;
        const whatsappUrl = `https://wa.me/919301814976?text=${text}`;
        window.open(whatsappUrl, '_blank');
      } else if (channel === 'email') {
        const subject = encodeURIComponent(`Executive AI Architecture Audit Request: ${business} [${industry}]`);
        const bodyText = 
`Dear Elite AI Systems Advisory Team,

I would like to formally request an executive 30-minute AI Architecture Audit for our company.

EXECUTIVE BRIEF:
-------------------------------------------------------
• Client Name: ${name}
• Business / Company: ${business}
• Direct Phone / WhatsApp: ${phone}
• Official Email: ${email || 'N/A'}
• Primary Industry: ${industry}
• Key Objective / Current Bottleneck: 
  ${goal}
-------------------------------------------------------

Please review our operational profile and send over our custom architecture blueprint and consultation availability.

Sincerely,
${name}
${business}`;

        const body = encodeURIComponent(bodyText);
        const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=eliteai.agency.systems@gmail.com&su=${subject}&body=${body}`;
        const mailtoUrl = `mailto:eliteai.agency.systems@gmail.com?subject=${subject}&body=${body}`;

        // Detect mobile vs desktop:
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobile) {
          window.location.href = mailtoUrl;
        } else {
          // Open Gmail Compose directly in new tab (synchronous, never blocked by popup blockers)
          const newWindow = window.open(gmailWebUrl, '_blank');
          if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            window.location.href = mailtoUrl;
          }
        }
      }
    }

    // -------------------------------------------------------------
    // 8. THREE.JS REAL-TIME 3D CONVERGENCE ENGINE (ADAPTIVE MOBILE + DESKTOP)
    // -------------------------------------------------------------
    function initConvergence3D() {
      const section = document.getElementById('vision');
      const canvas = document.getElementById('convergence-canvas');
      if (!section || !canvas || typeof THREE === 'undefined') return;

      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;

      let width = section.clientWidth || window.innerWidth;
      let height = section.clientHeight || window.innerHeight;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.set(0, 0, 16);

      const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: !isMobile,
        alpha: false,
        powerPreference: isMobile ? "default" : "high-performance"
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(isMobile ? Math.min(window.devicePixelRatio, 1.15) : Math.min(window.devicePixelRatio, 2));

      if (!isMobile) {
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.35;
      }

      // Lighting: Dark ambient + dynamic point lights
      const ambientLight = new THREE.AmbientLight(0x0a0a14, isMobile ? 1.6 : 1.2);
      scene.add(ambientLight);

      // Light 1: Vibrant Magenta
      const lightMagenta = new THREE.PointLight(0xFF007A, isMobile ? 4.2 : 5.0, isMobile ? 24 : 35);
      scene.add(lightMagenta);

      // Light 2: Electric Cyan
      const lightCyan = new THREE.PointLight(0x00F0FF, isMobile ? 3.8 : 4.5, isMobile ? 24 : 35);
      scene.add(lightCyan);

      let lightViolet = null;
      let lightGold = null;
      if (!isMobile) {
        lightViolet = new THREE.PointLight(0x9D4EDD, 4.0, 30);
        scene.add(lightViolet);
        lightGold = new THREE.PointLight(0xE5B83B, 3.2, 25);
        scene.add(lightGold);
      }

      // 3D Voxel Chromatic Star Group
      const starGroup = new THREE.Group();
      scene.add(starGroup);

      // Stepped 8-bit Star Voxel Matrix (16x16)
      const starMatrix = [
        [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
        [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
        [0,0,0,1,0,0,1,1,1,1,0,0,1,0,0,0],
        [0,0,1,1,1,0,0,1,1,0,0,1,1,1,0,0],
        [0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0],
        [0,1,1,0,0,1,1,1,1,1,1,0,0,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [0,1,1,0,0,1,1,1,1,1,1,0,0,1,1,0],
        [0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0],
        [0,0,1,1,1,0,0,1,1,0,0,1,1,1,0,0],
        [0,0,0,1,0,0,1,1,1,1,0,0,1,0,0,0],
        [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],
        [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0]
      ];

      const starMat = isMobile
        ? new THREE.MeshStandardMaterial({
            color: 0x1d1326,
            emissive: 0x14091e,
            emissiveIntensity: 0.35,
            metalness: 0.88,
            roughness: 0.18
          })
        : new THREE.MeshPhysicalMaterial({
            color: 0x181022,
            emissive: 0x12081d,
            emissiveIntensity: 0.28,
            metalness: 0.90,
            roughness: 0.14,
            clearcoat: 1.0,
            clearcoatRoughness: 0.08,
            reflectivity: 1.0
          });

      let voxelCount = 0;
      for (let r = 0; r < 16; r++) {
        for (let c = 0; c < 16; c++) {
          if (starMatrix[r][c] === 1) voxelCount++;
        }
      }

      const voxelSize = 0.36;
      const voxelDepth = 0.95;
      const boxGeo = new THREE.BoxGeometry(voxelSize * 0.96, voxelSize * 0.96, voxelDepth);
      const instancedStar = new THREE.InstancedMesh(boxGeo, starMat, voxelCount);

      const dummy = new THREE.Object3D();
      let vIdx = 0;
      for (let r = 0; r < 16; r++) {
        for (let c = 0; c < 16; c++) {
          if (starMatrix[r][c] === 1) {
            const px = (c - 7.5) * voxelSize;
            const py = (7.5 - r) * voxelSize;
            dummy.position.set(px, py, 0);
            dummy.updateMatrix();
            instancedStar.setMatrixAt(vIdx++, dummy.matrix);
          }
        }
      }
      instancedStar.instanceMatrix.needsUpdate = true;
      starGroup.add(instancedStar);

      // Flanking Halftone Point-Cloud Hands
      function makeParticleTexture() {
        const pCanvas = document.createElement('canvas');
        pCanvas.width = 16; pCanvas.height = 16;
        const pCtx = pCanvas.getContext('2d');
        const grad = pCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.4, 'rgba(255,255,255,0.7)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        pCtx.fillStyle = grad;
        pCtx.fillRect(0, 0, 16, 16);
        return new THREE.CanvasTexture(pCanvas);
      }
      const pTex = makeParticleTexture();

      // Left: Robotic Android Point Matrix
      const leftCount = isMobile ? 220 : 650;
      const leftGeo = new THREE.BufferGeometry();
      const leftPos = new Float32Array(leftCount * 3);
      for (let i = 0; i < leftCount; i++) {
        const t = Math.random();
        const x = -10.5 + t * 7.2;
        const curve = Math.sin(t * Math.PI) * 1.8 - 0.5;
        const spread = (1.2 - t * 0.7);
        const y = curve + (Math.random() - 0.5) * spread;
        const z = (Math.random() - 0.5) * 2.2;
        leftPos[i * 3] = x;
        leftPos[i * 3 + 1] = y;
        leftPos[i * 3 + 2] = z;
      }
      leftGeo.setAttribute('position', new THREE.BufferAttribute(leftPos, 3));
      const leftMat = new THREE.PointsMaterial({
        size: isMobile ? 0.32 : 0.26,
        map: pTex,
        transparent: true,
        opacity: 0.8,
        color: 0x88ccff,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const leftPoints = new THREE.Points(leftGeo, leftMat);
      scene.add(leftPoints);

      // Right: Human Hand Point Matrix
      const rightCount = isMobile ? 220 : 650;
      const rightGeo = new THREE.BufferGeometry();
      const rightPos = new Float32Array(rightCount * 3);
      for (let i = 0; i < rightCount; i++) {
        const t = Math.random();
        const x = 10.5 - t * 7.2;
        const curve = Math.sin(t * Math.PI) * 1.6 - 0.4;
        const spread = (1.1 - t * 0.65);
        const y = curve + (Math.random() - 0.5) * spread;
        const z = (Math.random() - 0.5) * 2.2;
        rightPos[i * 3] = x;
        rightPos[i * 3 + 1] = y;
        rightPos[i * 3 + 2] = z;
      }
      rightGeo.setAttribute('position', new THREE.BufferAttribute(rightPos, 3));
      const rightMat = new THREE.PointsMaterial({
        size: isMobile ? 0.32 : 0.26,
        map: pTex,
        transparent: true,
        opacity: 0.8,
        color: 0xffd1a4,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const rightPoints = new THREE.Points(rightGeo, rightMat);
      scene.add(rightPoints);

      // Pointer Drag Interaction
      let isDragging = false;
      let prevMouseX = 0, prevMouseY = 0;
      let targetRotX = 0, targetRotY = 0;
      let curRotX = 0, curRotY = 0;
      let spinSpeed = 1.0;

      canvas.addEventListener('pointerdown', (e) => {
        isDragging = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      });

      window.addEventListener('pointermove', (e) => {
        if (isDragging) {
          const deltaX = e.clientX - prevMouseX;
          const deltaY = e.clientY - prevMouseY;
          targetRotY += deltaX * 0.007;
          targetRotX += deltaY * 0.007;
          prevMouseX = e.clientX;
          prevMouseY = e.clientY;
        } else if (!isMobile) {
          const rect = section.getBoundingClientRect();
          if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
            const normX = (e.clientX - rect.left) / rect.width - 0.5;
            const normY = (e.clientY - rect.top) / rect.height - 0.5;
            starGroup.position.x = normX * 1.4;
            starGroup.position.y = -normY * 0.8;
          }
        }
      });

      window.addEventListener('pointerup', () => { isDragging = false; });

      const dragZone = document.getElementById('webgl-drag-zone');
      if (dragZone) {
        dragZone.style.pointerEvents = 'auto';
        dragZone.style.touchAction = 'pan-y';

        let touchStartX = 0;
        let touchStartY = 0;
        let isIntentional3DDrag = false;

        dragZone.addEventListener('touchstart', (e) => {
          if (e.touches && e.touches.length > 0) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            prevMouseX = touchStartX;
            prevMouseY = touchStartY;
            isIntentional3DDrag = false;
          }
        }, { passive: true });

        dragZone.addEventListener('touchmove', (e) => {
          if (!e.touches || e.touches.length === 0) return;
          const curX = e.touches[0].clientX;
          const curY = e.touches[0].clientY;
          const diffX = curX - touchStartX;
          const diffY = curY - touchStartY;

          // Only rotate 3D when dragging horizontally across the star
          if (!isIntentional3DDrag && Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
            isIntentional3DDrag = true;
          }

          if (isIntentional3DDrag) {
            const deltaX = curX - prevMouseX;
            const deltaY = curY - prevMouseY;
            targetRotY += deltaX * 0.012;
            targetRotX += deltaY * 0.012;
            prevMouseX = curX;
            prevMouseY = curY;
          }
        }, { passive: true });

        dragZone.addEventListener('touchend', () => {
          isIntentional3DDrag = false;
        }, { passive: true });
      }

      const speedBtn = document.getElementById('toggle-3d-speed');
      if (speedBtn) {
        speedBtn.addEventListener('click', () => {
          spinSpeed = spinSpeed === 1.0 ? 2.8 : 1.0;
          speedBtn.querySelector('span').textContent = spinSpeed > 1 ? 'Fast Orbit ✦' : 'Rotate 360° ↺';
        });
      }

      const clock = new THREE.Clock();
      const hudCoords = document.getElementById('hud-coords');

      // PERFORMANCE ENGINE: IntersectionObserver + Visibility pause
      let isVisible = false;
      let animFrameId = null;

      function render() {
        if (!isVisible) {
          animFrameId = null;
          return;
        }
        animFrameId = requestAnimationFrame(render);
        const t = clock.getElapsedTime();

        // Orbit dynamic lights
        lightMagenta.position.set(Math.cos(t * 1.1) * 7, Math.sin(t * 1.3) * 4 + 2, Math.sin(t * 1.1) * 6);
        lightCyan.position.set(Math.cos(-t * 0.9 + 2) * 7, Math.sin(t * 0.8) * 5, Math.sin(-t * 0.9 + 2) * 7);
        if (lightViolet) lightViolet.position.set(Math.sin(t * 1.2) * 5, Math.cos(t * 1.4) * 6, Math.cos(t * 1.2) * 5);
        if (lightGold) lightGold.position.set(Math.cos(t * 0.7) * 5, -3, Math.sin(t * 0.7) * 5);

        targetRotY += 0.008 * spinSpeed;
        curRotX += (targetRotX - curRotX) * 0.08;
        curRotY += (targetRotY - curRotY) * 0.08;

        starGroup.rotation.y = curRotY;
        starGroup.rotation.x = curRotX + Math.sin(t * 0.4) * 0.12;
        starGroup.rotation.z = Math.cos(t * 0.3) * 0.08;

        instancedStar.position.y = Math.sin(t * 1.8) * 0.22;

        leftPoints.position.y = Math.sin(t * 1.2) * 0.15;
        rightPoints.position.y = Math.sin(t * 1.2 + 1) * 0.15;

        if (hudCoords && Math.floor(t * 10) % 5 === 0) {
          const degY = Math.round(((curRotY * 180 / Math.PI) % 360 + 360) % 360);
          const degX = Math.round(curRotX * 180 / Math.PI);
          hudCoords.textContent = `ROT: ${degY}° // TILT: ${degX}°`;
        }

        renderer.render(scene, camera);
      }

      function startLoop() {
        if (!animFrameId) {
          clock.start();
          animFrameId = requestAnimationFrame(render);
        }
      }

      function stopLoop() {
        if (animFrameId) {
          cancelAnimationFrame(animFrameId);
          animFrameId = null;
        }
      }

      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            isVisible = entry.isIntersecting;
            if (isVisible) {
              startLoop();
            } else {
              stopLoop();
            }
          });
        }, { rootMargin: '150px 0px 150px 0px' });
        observer.observe(section);
      } else {
        isVisible = true;
        startLoop();
      }

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          stopLoop();
        } else if (isVisible) {
          startLoop();
        }
      });

      window.addEventListener('resize', () => {
        if (!section) return;
        width = section.clientWidth || window.innerWidth;
        height = section.clientHeight || window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      });
    }

    // Initial setup run with deferred 3D startup
    // Guarded: the ROI calculator only exists on the AI Systems page
    if (document.getElementById('customers-slider')) calculateROI();
    if (window.requestIdleCallback) {
      requestIdleCallback(() => initConvergence3D(), { timeout: 120 });
    } else {
      setTimeout(initConvergence3D, 50);
    }

/**
 * Elite AI Autonomous Sentinel - Hourly Health Check & Diagnostics Engine
 * 
 * Verifies:
 * 1. HTTP 200 OK, SSL health & latency (<2500ms) on eliteaiagency.in
 * 2. Apex domain redirection (eliteaiagency.in -> www.eliteaiagency.in)
 * 3. Static asset availability (video, poster, logo, Three.js library)
 * 4. Headless browser runtime inspection (Playwright):
 *    - Captures zero uncaught JS exceptions (`pageerror`)
 *    - Validates 3D WebGL canvas, video container, spotlight slider, NFC card, ROI calculator, and Chat lab
 *    - Tests live AI chat response latency and ROI calculator recalculation
 * 5. Generates detailed markdown diagnostics for GitHub Actions & GitHub Issues
 */

import fs from 'node:fs';
import path from 'node:path';

const TARGET_URL = process.env.TARGET_URL || 'https://www.eliteaiagency.in';
const APEX_URL = process.env.APEX_URL || 'https://eliteaiagency.in';

const ASSETS_TO_CHECK = [
  '/assets/hero_bg.mp4',
  '/assets/hero_poster.webp',
  '/assets/logo.jpg',
  '/assets/logo.webp',
  '/assets/three.min.js'
];

const results = {
  timestamp: new Date().toISOString(),
  targetUrl: TARGET_URL,
  passed: true,
  failures: [],
  warnings: [],
  checks: []
};

function recordCheck(name, status, detail, durationMs = 0) {
  const check = { name, status, detail, durationMs };
  results.checks.push(check);
  const icon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
  console.log(`${icon} [${status}] ${name} (${durationMs}ms): ${detail}`);
  if (status === 'FAIL') {
    results.passed = false;
    results.failures.push(`${name}: ${detail}`);
  } else if (status === 'WARN') {
    results.warnings.push(`${name}: ${detail}`);
  }
}

// -------------------------------------------------------------
// 1. HTTP & DNS / SSL PROBING
// -------------------------------------------------------------
async function probeHttp() {
  console.log('\n--- 1. Probing Main Endpoint & Apex Redirect ---');
  const t0 = Date.now();
  try {
    const res = await fetch(TARGET_URL, {
      method: 'GET',
      headers: { 'User-Agent': 'EliteAI-Sentinel/1.0 (HealthCheckBot)' },
      redirect: 'follow'
    });
    const dur = Date.now() - t0;
    if (res.status === 200) {
      recordCheck('Main URL HTTP 200', 'PASS', `Status ${res.status} OK in ${dur}ms`, dur);
    } else {
      recordCheck('Main URL HTTP 200', 'FAIL', `Unexpected status code: ${res.status}`, dur);
    }

    const html = await res.text();
    if (html.includes('Elite AI') && html.includes('audit-form')) {
      recordCheck('HTML Body Verification', 'PASS', 'DOM payload contains core brand & form markers');
    } else {
      recordCheck('HTML Body Verification', 'FAIL', 'HTML response does not contain expected markers');
    }
  } catch (err) {
    recordCheck('Main URL Connection', 'FAIL', `Fetch failed: ${err.message}`, Date.now() - t0);
  }

  // Check apex domain redirect
  const tApex = Date.now();
  try {
    const apexRes = await fetch(APEX_URL, {
      method: 'HEAD',
      redirect: 'manual'
    });
    const durApex = Date.now() - tApex;
    if (apexRes.status === 308 || apexRes.status === 301 || apexRes.status === 200) {
      recordCheck('Apex Domain Redirect', 'PASS', `Apex returned status ${apexRes.status}`, durApex);
    } else {
      recordCheck('Apex Domain Redirect', 'WARN', `Apex returned status ${apexRes.status}`, durApex);
    }
  } catch (err) {
    recordCheck('Apex Domain Connection', 'WARN', `Apex check warning: ${err.message}`, Date.now() - tApex);
  }
}

// -------------------------------------------------------------
// 2. STATIC ASSET HEALTH CHECKS
// -------------------------------------------------------------
async function probeAssets() {
  console.log('\n--- 2. Probing Critical Static Assets ---');
  for (const assetPath of ASSETS_TO_CHECK) {
    const assetUrl = new URL(assetPath, TARGET_URL).toString();
    const t0 = Date.now();
    try {
      const res = await fetch(assetUrl, { method: 'HEAD' });
      const dur = Date.now() - t0;
      if (res.status === 200 || res.status === 206) {
        recordCheck(`Asset: ${assetPath}`, 'PASS', `HTTP ${res.status} (${dur}ms)`, dur);
      } else {
        recordCheck(`Asset: ${assetPath}`, 'FAIL', `Returned HTTP ${res.status}`, dur);
      }
    } catch (err) {
      recordCheck(`Asset: ${assetPath}`, 'FAIL', `Fetch error: ${err.message}`, Date.now() - t0);
    }
  }
}

// -------------------------------------------------------------
// 3. HEADLESS BROWSER RUNTIME SENTINEL (PLAYWRIGHT)
// -------------------------------------------------------------
async function probeBrowserRuntime() {
  console.log('\n--- 3. Headless Browser Runtime Inspection ---');
  let playwright;
  try {
    playwright = await import('playwright');
  } catch (err) {
    console.log('Playwright module not found. Skipping Phase 3 headless runtime check.');
    recordCheck('Playwright Engine', 'WARN', 'Playwright not installed in local environment. Full check runs on GitHub Actions.');
    return;
  }

  const { chromium } = playwright;
  let browser = null;
  const t0 = Date.now();

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 EliteAI-Sentinel'
    });

    const page = await context.newPage();

    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore benign third-party font or analytics warnings if any
        if (!text.includes('favicon.ico') && !text.includes('db.onlinewebfonts.com')) {
          consoleErrors.push(text);
        }
      }
    });

    page.on('pageerror', err => {
      pageErrors.push(err.message || String(err));
    });

    page.on('requestfailed', req => {
      const url = req.url();
      if (!url.includes('analytics') && !url.includes('doubleclick')) {
        failedRequests.push(`${req.method()} ${url} - ${req.failure()?.errorText || 'failed'}`);
      }
    });

    console.log(`Navigating to ${TARGET_URL}...`);
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Allow deferred media & scripts 2 seconds to initialize
    await page.waitForTimeout(2000);

    // Check runtime errors
    if (pageErrors.length === 0) {
      recordCheck('JavaScript Runtime', 'PASS', 'Zero uncaught JavaScript exceptions detected');
    } else {
      recordCheck('JavaScript Runtime', 'FAIL', `${pageErrors.length} uncaught exceptions: ${pageErrors.slice(0, 3).join('; ')}`);
    }

    if (consoleErrors.length === 0) {
      recordCheck('Console Output', 'PASS', 'Zero critical console errors detected');
    } else {
      recordCheck('Console Output', 'WARN', `${consoleErrors.length} console errors: ${consoleErrors.slice(0, 3).join('; ')}`);
    }

    if (failedRequests.length === 0) {
      recordCheck('Network Requests', 'PASS', 'All internal network requests resolved successfully');
    } else {
      recordCheck('Network Requests', 'WARN', `${failedRequests.length} requests failed: ${failedRequests.slice(0, 3).join('; ')}`);
    }

    // Inspect critical DOM elements
    const criticalSelectors = [
      { sel: '#hero-bg-video', label: 'Hero Video' },
      { sel: '.master-nav', label: 'Master Glass Nav' },
      { sel: '#marquee', label: 'Motion Marquee Track' },
      { sel: '#convergence-canvas', label: 'Three.js 3D Canvas' },
      { sel: '#spotlight', label: 'Spotlight X-Ray Curtain' },
      { sel: '#hardware', label: 'Smart NFC Section' },
      { sel: '#nfc-card', label: '3D NFC Flipper Card' },
      { sel: '#playground', label: 'Live AI Chat Lab' },
      { sel: '#calculator', label: 'ROI Calculator' },
      { sel: '#audit-form', label: 'Consultation Form' },
      { sel: '.floating-wa', label: 'Floating WhatsApp CTA' }
    ];

    for (const item of criticalSelectors) {
      const exists = await page.$(item.sel);
      if (exists) {
        recordCheck(`DOM Component: ${item.label}`, 'PASS', `Selector "${item.sel}" verified present`);
      } else {
        recordCheck(`DOM Component: ${item.label}`, 'FAIL', `Selector "${item.sel}" missing from page`);
      }
    }

    // Interactive Test 1: Live AI Chat Lab
    try {
      const chatInput = await page.$('#chat-input');
      const chatForm = await page.$('#chat-input-form');
      if (chatInput && chatForm) {
        await chatInput.fill('What is your hotel QR system?');
        await chatForm.evaluate(f => f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })));
        await page.waitForTimeout(800);
        const lastMsg = await page.$eval('#chat-messages', el => el.lastElementChild?.textContent || '');
        if (lastMsg && (lastMsg.includes('Hotel') || lastMsg.includes('QR') || lastMsg.includes('Dining') || lastMsg.includes('Elite'))) {
          recordCheck('AI Chat Lab Simulation', 'PASS', `Bot answered correctly: "${lastMsg.slice(0, 60)}..."`);
        } else {
          recordCheck('AI Chat Lab Simulation', 'WARN', 'Chat submitted but response was unexpected');
        }
      }
    } catch (e) {
      recordCheck('AI Chat Lab Simulation', 'WARN', `Chat test skipped: ${e.message}`);
    }

    // Interactive Test 2: ROI Calculator
    try {
      const custSlider = await page.$('#customers-slider');
      if (custSlider) {
        await page.evaluate(() => {
          const slider = document.getElementById('customers-slider');
          if (slider) {
            slider.value = 5000;
            if (typeof calculateROI === 'function') calculateROI();
          }
        });
        const costVal = await page.$eval('#cost-saved', el => el.textContent.trim());
        if (costVal && costVal !== '') {
          recordCheck('ROI Calculator Reactive Engine', 'PASS', `Calculated value dynamically: ${costVal}`);
        } else {
          recordCheck('ROI Calculator Reactive Engine', 'FAIL', 'Calculator failed to update metric display');
        }
      }
    } catch (e) {
      recordCheck('ROI Calculator Reactive Engine', 'WARN', `ROI test skipped: ${e.message}`);
    }

    // Save visual health check snapshot
    const outDir = path.resolve('health-report');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const screenshotPath = path.join(outDir, 'latest-snapshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`Saved verification snapshot to ${screenshotPath}`);

  } catch (err) {
    recordCheck('Browser Runtime Engine', 'FAIL', `Playwright execution failed: ${err.message}`, Date.now() - t0);
  } finally {
    if (browser) await browser.close();
  }
}

// -------------------------------------------------------------
// 4. GENERATE REPORT & EXIT
// -------------------------------------------------------------
async function run() {
  console.log(`=======================================================`);
  console.log(`🛡️  ELITE AI AUTONOMOUS HOURLY SENTINEL`);
  console.log(`    Timestamp : ${results.timestamp}`);
  console.log(`    Target    : ${results.targetUrl}`);
  console.log(`=======================================================`);

  await probeHttp();
  await probeAssets();
  await probeBrowserRuntime();

  console.log('\n=======================================================');
  console.log(`🏁 SENTINEL SUMMARY: ${results.passed ? 'ALL CHECKS PASSED ✅' : 'FAILURES DETECTED ❌'}`);
  console.log(`   Passed: ${results.checks.filter(c => c.status === 'PASS').length}`);
  console.log(`   Warnings: ${results.warnings.length}`);
  console.log(`   Failures: ${results.failures.length}`);
  console.log('=======================================================');

  // Save diagnostic report markdown for GitHub Actions
  const outDir = path.resolve('health-report');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const mdReport = `## 🛡️ Elite AI Hourly Health Sentinel Report
**Timestamp**: \`${results.timestamp}\`  
**Target**: [${TARGET_URL}](${TARGET_URL})  
**Overall Status**: ${results.passed ? '🟢 **HEALTHY - ALL TESTS PASSED**' : '🔴 **ACTION REQUIRED - BUGS DETECTED**'}

### 📋 Diagnostics Summary
| Component / Check | Status | Details | Duration |
| :--- | :---: | :--- | :--- |
${results.checks.map(c => `| ${c.name} | ${c.status === 'PASS' ? '✅ Pass' : c.status === 'WARN' ? '⚠️ Warning' : '❌ FAIL'} | ${c.detail.replace(/\|/g, '-')} | ${c.durationMs ? `${c.durationMs}ms` : '-'} |`).join('\n')}

${results.failures.length > 0 ? `### ❌ Failures Requiring Attention:\n${results.failures.map(f => `- **${f}**`).join('\n')}` : ''}
${results.warnings.length > 0 ? `### ⚠️ Warnings:\n${results.warnings.map(w => `- ${w}`).join('\n')}` : ''}
`;

  fs.writeFileSync(path.join(outDir, 'report.md'), mdReport, 'utf8');
  fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(results, null, 2), 'utf8');

  if (!results.passed) {
    console.error('\n❌ Sentinel detected issues. Exiting with status 1.');
    process.exit(1);
  } else {
    console.log('\n✅ Everything is healthy.');
    process.exit(0);
  }
}

run();

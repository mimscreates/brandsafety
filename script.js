// ══════════════════════════════════════
//  Brand Safety Filter – Full state
// ══════════════════════════════════════

// Category metadata (order matches badge row)
const BS_CATEGORIES = [
  { key: 'violence',        label: 'Violence',        icon: 'fa-solid fa-gun' },
  { key: 'misinformation',  label: 'Misinformation',  icon: 'fa-solid fa-face-meh' },
  { key: 'extremism',       label: 'Extremism',       icon: 'fa-solid fa-burst' },
  { key: 'gambling',        label: 'Gambling',         icon: 'fa-solid fa-dice' },
  { key: 'adult',           label: 'Adult content',    icon: 'fa-solid fa-vest' },
  { key: 'sensitive',       label: 'Sensitive',        icon: 'fa-solid fa-scale-balanced' },
];

// Risk hierarchy for comparison
const RISK_LEVELS = { none: 0, low: 1, medium: 2, high: 3 };

// ── Global state: { categoryKey: toleranceLevel } ──
// e.g. { violence: 'low', misinformation: 'high' }
const bsFilterState = {};

// ══════════════════════════════════════
//  DOM Ready
// ══════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('more-filters-btn');
  const dropdown = document.getElementById('filters-dropdown');
  const backdrop = document.getElementById('filters-backdrop');

  if (!btn || !dropdown || !backdrop) return;

  // ────────────────────────────────────
  //  Main dropdown open/close
  // ────────────────────────────────────
  function openMain() {
    dropdown.classList.add('open');
    backdrop.classList.add('open');
  }
  function closeMain() {
    dropdown.classList.remove('open');
    backdrop.classList.remove('open');
  }
  function toggleMain() {
    dropdown.classList.contains('open') ? closeMain() : openMain();
  }

  // ────────────────────────────────────
  //  Events: main dropdown
  // ────────────────────────────────────
  btn.addEventListener('click', (e) => { e.stopPropagation(); toggleMain(); });
  backdrop.addEventListener('click', closeMain);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMain();
  });

  dropdown.addEventListener('click', (e) => { e.stopPropagation(); });

  // ────────────────────────────────────
  //  Anchor navigation: smooth scroll + active state
  // ────────────────────────────────────
  const filtersBody = document.getElementById('filters-body-scroll');
  const anchorLinks = dropdown && dropdown.querySelectorAll('.filters-anchor');
  const sectionIds = ['filter-section-creator-infos', 'filter-section-audience', 'filter-section-brand-safety', 'filter-section-lists'];

  if (filtersBody && anchorLinks && anchorLinks.length) {
    anchorLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const id = link.getAttribute('href');
        if (!id || id === '#') return;
        const section = document.getElementById(id.slice(1));
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    const setActiveAnchor = (activeId) => {
      anchorLinks.forEach((a) => {
        const href = a.getAttribute('href') || '';
        const id = href.slice(1);
        a.classList.toggle('active', id === activeId);
      });
    };

    const updateActiveFromScroll = () => {
      const scrollTop = filtersBody.scrollTop;
      const navHeight = dropdown.querySelector('.filters-sticky-header')?.offsetHeight || 0;
      const trigger = scrollTop + navHeight + 40;
      let activeId = sectionIds[0];
      sectionIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= trigger) activeId = id;
      });
      setActiveAnchor(activeId);
    };

    filtersBody.addEventListener('scroll', updateActiveFromScroll);
    updateActiveFromScroll();
  }

  // ────────────────────────────────────
  //  Toggle buttons (Gender, Creator was added)
  // ────────────────────────────────────
  dropdown.querySelectorAll('.fi-toggle-group').forEach(group => {
    group.querySelectorAll('.fi-toggle-btn').forEach(b => {
      b.addEventListener('click', () => {
        group.querySelectorAll('.fi-toggle-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
      });
    });
  });

  // ── Pill buttons (Age brackets) ──
  dropdown.querySelectorAll('.fi-pill-group').forEach(group => {
    group.querySelectorAll('.fi-pill').forEach(pill => {
      pill.addEventListener('click', () => pill.classList.toggle('active'));
    });
  });

  // ── Switch toggle ──
  dropdown.querySelectorAll('.fi-switch').forEach(sw => {
    sw.addEventListener('click', () => sw.classList.toggle('on'));
  });

  // ══════════════════════════════════════
  //  Brand Safety Threshold (Figma design)
  // ══════════════════════════════════════
  const TOL_STEPS = ['none', 'low', 'medium', 'high'];
  const TOL_TAG_LABELS = { none: 'None', low: 'Low', medium: 'Medium', high: 'High' };

  // Initialize bsFilterState from threshold cards (default step 4 = high)
  BS_CATEGORIES.forEach(c => { bsFilterState[c.key] = 'high'; });

  function applyBsFilter() {
    const creatorsData = window.creators || [];
    const cards = document.querySelectorAll('.creator-card');

    cards.forEach(card => {
      const idx = parseInt(card.dataset.creatorIndex, 10);
      const creator = creatorsData[idx];
      if (!creator) return;

      let excluded = false;
      for (const [catKey, tolerance] of Object.entries(bsFilterState)) {
        const creatorRisk = creator.brandSafety ? creator.brandSafety[catKey] : 'none';
        const creatorLevel = RISK_LEVELS[creatorRisk] || 0;
        const toleranceLevel = RISK_LEVELS[tolerance] ?? 3; /* high = accept all */
        /* Exclude if creator risk is above the selected tolerance */
        if (creatorLevel > toleranceLevel) {
          excluded = true;
          break;
        }
      }

      card.classList.toggle('hidden-by-filter', excluded);
    });
  }

  function setThresholdStep(cardEl, step) {
    const cat = cardEl.dataset.bsCat;
    if (!cat) return;
    const tol = TOL_STEPS[step - 1];
    bsFilterState[cat] = tol;
    cardEl.dataset.step = String(step);
      cardEl.removeAttribute('data-dragging');
    cardEl.removeAttribute('data-drag-step');
    cardEl.style.removeProperty('--bs-drag-pct');
    const tagEl = cardEl.querySelector('[data-tag]');
    if (tagEl) tagEl.textContent = TOL_TAG_LABELS[tol];
    applyBsFilter();
  }

  function percentToStep(pct) {
    if (pct <= 0.166) return 1;
    if (pct <= 0.5) return 2;
    if (pct <= 0.833) return 3;
    return 4;
  }

  function stepToPercent(step) {
    return step === 1 ? 0 : step === 2 ? 33.33 : step === 3 ? 66.66 : 100;
  }

  document.querySelectorAll('.bs-threshold-card').forEach(card => {
    card.dataset.step = '4'; // default High
    const tagEl = card.querySelector('[data-tag]');
    if (tagEl) tagEl.textContent = 'High';

    const track = card.querySelector('.bs-threshold-track');
    const handle = card.querySelector('[data-handle]');
    if (!track) return;

    function getPercent(clientX) {
      const r = track.getBoundingClientRect();
      const x = clientX - r.left;
      return Math.max(0, Math.min(1, x / r.width));
    }

    function onPointerDown(e) {
      e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      card.dataset.dragging = 'true';
      const updateDrag = (x) => {
        const pct = getPercent(x);
        const step = percentToStep(pct);
        card.dataset.dragStep = String(step);
        card.style.setProperty('--bs-drag-pct', String(stepToPercent(step)));
      };
      updateDrag(clientX);
      const onMove = (e2) => {
        const x = e2.touches ? e2.touches[0].clientX : e2.clientX;
        updateDrag(x);
      };
      const onUp = (e2) => {
        const x = e2.changedTouches ? e2.changedTouches[0].clientX : e2.clientX;
        const pct = getPercent(x);
        const step = percentToStep(pct);
        setThresholdStep(card, step);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchmove', onMove, { passive: true });
        document.removeEventListener('touchend', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      document.addEventListener('touchmove', onMove, { passive: true });
      document.addEventListener('touchend', onUp, { once: true });
    }

    track.addEventListener('mousedown', onPointerDown);
    track.addEventListener('touchstart', onPointerDown, { passive: false });

    card.querySelectorAll('.bs-threshold-seg').forEach(seg => {
      seg.addEventListener('click', (e) => {
        e.stopPropagation();
        const step = parseInt(seg.dataset.step, 10);
        if (step >= 1 && step <= 4) setThresholdStep(card, step);
      });
    });
  });

  // ══════════════════════════════════════
  //  Creator Side Panel (Drawer)
  // ══════════════════════════════════════
  const drawer = document.getElementById('creator-drawer');
  const drawerOverlay = document.getElementById('drawer-overlay');
  const drawerClose = document.getElementById('drawer-close');

  const RISK_BADGE_MAP = {
    safe:   { img: 'Assets/Signal risk badges/RISK=Healthy.svg', text: 'Nothing to signal' },
    low:    { img: 'Assets/Signal risk badges/RISK=Low.svg',     text: 'Low risk detected' },
    medium: { img: 'Assets/Signal risk badges/RISK=Low.svg',     text: 'Medium risk detected' },
    high:   { img: 'Assets/Signal risk badges/RISK=High.svg',    text: 'High risk detected' },
  };

  function openDrawer(creatorIdx) {
    const creatorsData = window.creators || [];
    const c = creatorsData[creatorIdx];
    if (!c) return;

    // Populate header
    const avatarEl = document.getElementById('drawer-avatar');
    if (avatarEl) avatarEl.innerHTML = `<img src="${c.avatar}" alt="${c.name}" />`;

    const nameEl = document.getElementById('drawer-name');
    if (nameEl) nameEl.textContent = c.name;

    // Split name heuristic
    const parts = c.name.replace(/[_\d]/g, '').match(/^([A-Z][a-z]+)([A-Z][a-z]+)?/) || [c.name, c.name, ''];
    const fn = document.getElementById('drawer-firstname');
    const ln = document.getElementById('drawer-lastname');
    if (fn) fn.textContent = parts[1] || c.name;
    if (ln) ln.textContent = parts[2] || '';

    const emailEl = document.getElementById('drawer-email');
    if (emailEl) emailEl.textContent = c.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '@campaign.com';

    const locEl = document.getElementById('drawer-location');
    if (locEl) locEl.textContent = c.location;

    const labelEl = document.getElementById('drawer-label');
    if (labelEl) labelEl.textContent = c.label || 'LDA';

    // Tags (Figma: trophy icon)
    const tagsEl = document.getElementById('drawer-tags');
    if (tagsEl) {
      tagsEl.innerHTML = c.categories.map(cat =>
        `<span class="drawer-tag"><i class="fa-solid fa-trophy"></i>${cat}</span>`
      ).join('');
    }

    // Risk overview in header (from creator.brandSafety)
    const riskPct = { none: 0, low: 33, medium: 66, high: 88 };
    const riskLabel = { none: 'None', low: 'Low', medium: 'Medium', high: 'High' };
    const bs = c.brandSafety || {};
    ['violence', 'misinformation', 'extremism'].forEach((key, i) => {
      const level = bs[key] || 'none';
      const fillEl = document.getElementById('drawer-risk-' + key);
      const valEl = document.getElementById('drawer-risk-' + key + '-val');
      if (fillEl) { fillEl.style.width = riskPct[level] + '%'; fillEl.classList.toggle('medium', level === 'medium'); }
      if (valEl) valEl.textContent = riskLabel[level];
    });

    // Brand Safety tab: score label + ring gradient follow creator risk (low / medium / high)
    const scoreLabels = { low: 'Low risk', medium: 'Medium risk', high: 'High risk' };
    const scoreLabelEl = document.getElementById('drawer-bst-score-label');
    if (scoreLabelEl) {
      scoreLabelEl.textContent = scoreLabels[c.risk] || 'Low risk';
      scoreLabelEl.classList.remove('risk-low', 'risk-medium', 'risk-high');
      if (c.risk === 'low' || c.risk === 'medium' || c.risk === 'high') scoreLabelEl.classList.add('risk-' + c.risk);
    }
    const ringColors = {
      low:    { start: '#22c55e', end: '#4ade80' },
      medium: { start: '#f59e0b', end: '#fbbf24' },
      high:   { start: '#ef4444', end: '#f87171' }
    };
    const colors = ringColors[c.risk] || ringColors.low;
    const stop1 = document.getElementById('bst-ring-stop1');
    const stop2 = document.getElementById('bst-ring-stop2');
    if (stop1) stop1.setAttribute('stop-color', colors.start);
    if (stop2) stop2.setAttribute('stop-color', colors.end);

    // Brand Safety tab is always visible. When risk is safe, show safe-state content inside the tab.
    const bsTabContent = document.getElementById('drawer-tab-brand-safety');
    if (bsTabContent) {
      bsTabContent.setAttribute('data-brand-safe', c.risk === 'safe' ? 'true' : 'false');
    }

    // Always reset to Channels tab when opening
    document.querySelectorAll('.drawer-tab').forEach(t => t.classList.remove('active'));
    const chTab = document.querySelector('.drawer-tab[data-drawer-tab="channels"]');
    if (chTab) chTab.classList.add('active');
    document.querySelectorAll('.drawer-tab-content').forEach(el => el.classList.remove('active'));
    const channelsContent = document.getElementById('drawer-tab-channels');
    if (channelsContent) channelsContent.classList.add('active');
    document.querySelector('.drawer-body')?.classList.remove('brand-safety-active');

    // Show
    drawer.classList.add('open');
    drawerOverlay.classList.add('open');
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    drawerOverlay.classList.remove('open');
  }

  // Wire close
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

  // ESC closes drawer (only if main filters dropdown isn't open)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer && drawer.classList.contains('open')) {
      if (!dropdown.classList.contains('open')) closeDrawer();
    }
  });

  // Wire card clicks → open drawer
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.creator-card');
    if (!card) return;
    // Don't open drawer if clicking on action buttons inside the card
    if (e.target.closest('button')) return;
    const idx = parseInt(card.dataset.creatorIndex, 10);
    if (!isNaN(idx)) openDrawer(idx);
  });

  // ══════════════════════════════════════
  //  Drawer Tab Switching
  // ══════════════════════════════════════
  const drawerTabs = document.querySelectorAll('.drawer-tab');
  const tabContentIds = {
    'channels': 'drawer-tab-channels',
    'brand-safety': 'drawer-tab-brand-safety',
    'emails': 'drawer-tab-emails',
    'notes': 'drawer-tab-notes',
    'profile': 'drawer-tab-profile',
  };

  drawerTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      drawerTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const tabKey = tab.getAttribute('data-drawer-tab') || 'channels';
      const contentId = tabContentIds[tabKey] || tabContentIds['channels'];
      document.querySelectorAll('.drawer-tab-content').forEach(el => { el.classList.remove('active'); });
      const contentEl = document.getElementById(contentId);
      if (contentEl) contentEl.classList.add('active');
      document.body.dispatchEvent(new CustomEvent('drawerTabChange', { detail: { tab: tab.getAttribute('data-drawer-tab') } }));
      const drawerBody = document.querySelector('.drawer-body');
      if (drawerBody) {
        if (tab.getAttribute('data-drawer-tab') === 'brand-safety') drawerBody.classList.add('brand-safety-active');
        else drawerBody.classList.remove('brand-safety-active');
      }
    });
  });

  // "See more" in Risk overview → switch to Brand Safety tab and scroll to content
  const seeMoreLink = document.querySelector('.drawer-risk-seemore');
  if (seeMoreLink) {
    seeMoreLink.addEventListener('click', function (e) {
      e.preventDefault();
      const bsTab = document.querySelector('.drawer-tab[data-drawer-tab="brand-safety"]');
      const bsContent = document.getElementById('drawer-tab-brand-safety');
      if (bsTab && bsContent) {
        drawerTabs.forEach(t => t.classList.remove('active'));
        bsTab.classList.add('active');
        document.querySelectorAll('.drawer-tab-content').forEach(el => el.classList.remove('active'));
        bsContent.classList.add('active');
        document.body.dispatchEvent(new CustomEvent('drawerTabChange', { detail: { tab: 'brand-safety' } }));
        const drawerBody = document.querySelector('.drawer-body');
        if (drawerBody) drawerBody.classList.add('brand-safety-active');
        requestAnimationFrame(() => {
          bsContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    });
  }

  // AI banner (Brand Safety): expandable / collapsible
  const bstAiBanner = document.getElementById('bst-ai-banner');
  const bstAiBannerToggle = document.getElementById('bst-ai-banner-toggle');
  if (bstAiBanner && bstAiBannerToggle) {
    bstAiBannerToggle.addEventListener('click', () => {
      const expanded = bstAiBanner.classList.toggle('expanded');
      bstAiBannerToggle.setAttribute('aria-expanded', expanded);
    });
  }

  // ══════════════════════════════════════
  //  Brand Safety Tab: Accordions (collapsed by default; only toggle clicked one)
  // ══════════════════════════════════════
  document.querySelectorAll('#drawer-tab-brand-safety [data-accordion-toggle]').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const accordion = toggle.closest('[data-accordion]');
      if (!accordion) return;
      accordion.classList.toggle('open');
      // Chevron rotation is handled by CSS (.bst-accordion.open .bst-accordion-chevron)
    });
  });

  // ══════════════════════════════════════
  //  Brand Safety Tab: Platform pills + dynamic radar
  // ══════════════════════════════════════
  // Radar: 6 axes (Harm, Extremism, Adult, Gambling, Sensitive, Sensitive). Order: 0°=top, 60°, 120°, 180°, 240°, 300°
  const BST_RADAR_CX = 135;
  const BST_RADAR_CY = 112;
  const BST_RADAR_R = 78;

  function bstRadarAngles() {
    const out = [];
    for (let i = 0; i < 6; i++) out.push((i * 60 - 90) * Math.PI / 180);
    return out;
  }

  function bstRadarValuesToPoints(values) {
    const angles = bstRadarAngles();
    return values.map((v, i) => {
      const r = Math.max(0, Math.min(1, v)) * BST_RADAR_R;
      const x = BST_RADAR_CX + r * Math.cos(angles[i]);
      const y = BST_RADAR_CY + r * Math.sin(angles[i]);
      return `${Number(x).toFixed(2)},${Number(y).toFixed(2)}`;
    }).join(' ');
  }

  // Mock data per platform. Order matches SVG axes: Harm, Extremism, Sensitive(right), Gambling, Sensitive(left), Adult
  const BST_RADAR_BY_PLATFORM = {
    all:      [0.85, 0.65, 0.5, 0.2, 0.4, 0.35],
    instagram: [0.7, 0.5, 0.6, 0.1, 0.35, 0.4],
    tiktok:   [0.6, 0.45, 0.55, 0.15, 0.5, 0.25],
    youtube:  [0.75, 0.7, 0.45, 0.3, 0.4, 0.2],
    twitch:   [0.5, 0.4, 0.3, 0.6, 0.25, 0.8],
  };

  function bstGetRadarData(platforms) {
    if (!platforms.length || platforms.includes('all')) return BST_RADAR_BY_PLATFORM.all;
    const set = new Set(platforms);
    const vals = [0, 0, 0, 0, 0, 0];
    let n = 0;
    ['instagram', 'tiktok', 'youtube', 'twitch'].forEach(p => {
      if (!set.has(p)) return;
      const d = BST_RADAR_BY_PLATFORM[p];
      if (!d) return;
      n++;
      d.forEach((v, i) => { vals[i] += v; });
    });
    if (n === 0) return BST_RADAR_BY_PLATFORM.all;
    return vals.map(v => v / n);
  }

  function bstIsBrandSafe() {
    const tab = document.getElementById('drawer-tab-brand-safety');
    return tab && tab.getAttribute('data-brand-safe') === 'true';
  }

  // Per-row dominant platform (single network only). When filter is one platform, all rows show that platform.
  const BST_TOP_PLATFORMS = {
    harm: 'Mainly Twitter',
    misinfo: 'Mainly TikTok',
    hate: 'Mainly Twitter',
  };
  const BST_OTHER_PLATFORMS = {
    adult: 'Mainly Twitch',
    reg: 'Mainly Youtube',
    sens: 'Mainly Youtube',
    misinfo: '-',
  };
  const BST_PLATFORM_SINGLE = {
    instagram: 'Mainly Instagram',
    tiktok: 'Mainly TikTok',
    youtube: 'Mainly Youtube',
    twitch: 'Mainly Twitch',
  };

  // Radar colors per platform (stroke + fill gradient). Layout/labels unchanged; only color adapts.
  const BST_RADAR_COLORS = {
    all:       { stroke: '#f59e0b', fillStart: 'rgba(251,191,36,0.5)', fillEnd: 'rgba(245,158,11,0.2)' },
    instagram: { stroke: '#c13584', fillStart: 'rgba(193,53,132,0.45)', fillEnd: 'rgba(193,53,132,0.18)' },
    tiktok:    { stroke: '#00f2ea', fillStart: 'rgba(0,242,234,0.45)', fillEnd: 'rgba(0,242,234,0.18)' },
    youtube:   { stroke: '#cd201f', fillStart: 'rgba(205,32,31,0.45)', fillEnd: 'rgba(205,32,31,0.18)' },
    twitch:    { stroke: '#6441a5', fillStart: 'rgba(100,65,165,0.45)', fillEnd: 'rgba(100,65,165,0.18)' },
  };

  function bstUpdateRadarAndContrib(platformKey) {
    const tab = document.getElementById('drawer-tab-brand-safety');
    const isSafe = tab && tab.getAttribute('data-brand-safe') === 'true';
    const platforms = platformKey === 'all' ? ['all'] : [platformKey];
    const data = isSafe
      ? [0.05, 0.05, 0.02, 0.02, 0.05, 0.05]
      : bstGetRadarData(platforms);
    const polygon = document.getElementById('bst-radar-polygon');
    if (polygon) polygon.setAttribute('points', bstRadarValuesToPoints(data));

    const colors = BST_RADAR_COLORS[platformKey] || BST_RADAR_COLORS.all;
    if (polygon) polygon.setAttribute('stroke', colors.stroke);
    const stop1 = document.getElementById('bst-radar-stop1');
    const stop2 = document.getElementById('bst-radar-stop2');
    if (stop1) stop1.setAttribute('stop-color', colors.fillStart);
    if (stop2) stop2.setAttribute('stop-color', colors.fillEnd);

    const singleLabel = BST_PLATFORM_SINGLE[platformKey];
    if (singleLabel) {
      document.querySelectorAll('#drawer-tab-brand-safety .bst-contrib-platform').forEach(el => { el.textContent = singleLabel; });
    } else {
      const el = (id) => document.getElementById(id);
      if (el('bst-top-harm-platform')) el('bst-top-harm-platform').textContent = BST_TOP_PLATFORMS.harm;
      if (el('bst-top-misinfo-platform')) el('bst-top-misinfo-platform').textContent = BST_TOP_PLATFORMS.misinfo;
      if (el('bst-top-hate-platform')) el('bst-top-hate-platform').textContent = BST_TOP_PLATFORMS.hate;
      if (el('bst-other-adult-platform')) el('bst-other-adult-platform').textContent = BST_OTHER_PLATFORMS.adult;
      if (el('bst-other-reg-platform')) el('bst-other-reg-platform').textContent = BST_OTHER_PLATFORMS.reg;
      if (el('bst-other-sens-platform')) el('bst-other-sens-platform').textContent = BST_OTHER_PLATFORMS.sens;
      if (el('bst-other-misinfo-platform')) el('bst-other-misinfo-platform').textContent = BST_OTHER_PLATFORMS.misinfo;
    }
  }

  const BST_AI_RISK_SUMMARY = 'This creator shows a high brand safety risk profile based on automated content analysis.';
  const BST_AI_SAFE_SUMMARY = 'No brand safety concerns detected for this creator.';

  function bstApplySafeState() {
    const tab = document.getElementById('drawer-tab-brand-safety');
    const safeMessage = document.getElementById('bst-safe-message');
    const aiBanner = document.getElementById('bst-ai-banner');
    const aiSummary = document.getElementById('bst-ai-summary');
    const isSafe = tab && tab.getAttribute('data-brand-safe') === 'true';
    if (!tab) return;

    if (aiBanner) {
      aiBanner.setAttribute('data-bst-banner-state', isSafe ? 'safe' : 'risk');
      if (aiSummary) aiSummary.textContent = isSafe ? BST_AI_SAFE_SUMMARY : BST_AI_RISK_SUMMARY;
      if (isSafe) {
        aiBanner.classList.remove('expanded');
        aiBanner.querySelector('[aria-controls="bst-ai-banner-body"]')?.setAttribute('aria-expanded', 'false');
      }
    }

    if (isSafe) {
      tab.classList.add('brand-safe-state');
      if (safeMessage) safeMessage.style.display = 'block';
      tab.querySelectorAll('[data-accordion]').forEach(acc => {
        const sub = acc.querySelector('.bst-accordion-sub');
        if (sub) {
          if (!acc.dataset.originalSub) acc.dataset.originalSub = sub.textContent;
          sub.textContent = '0 sensitive content detected';
        }
        const badge = acc.querySelector('.bst-risk-badge');
        if (badge) {
          if (!acc.dataset.originalBadge) acc.dataset.originalBadge = badge.textContent;
          if (!acc.dataset.originalBadgeClass) acc.dataset.originalBadgeClass = badge.className;
          badge.textContent = 'No risk';
          badge.className = 'bst-risk-badge bst-risk-none';
        }
        const body = acc.querySelector('.bst-accordion-body');
        if (body) {
          if (!body.dataset.originalContent) body.dataset.originalContent = body.innerHTML;
          body.innerHTML = '<p class="bst-accordion-empty">No flagged items.</p>';
        }
      });
      bstUpdateRadarAndContrib(document.querySelector('#bst-platform-pills .bst-pill.active')?.getAttribute('data-platform') || 'all');
    } else {
      tab.classList.remove('brand-safe-state');
      if (safeMessage) safeMessage.style.display = 'none';
      tab.querySelectorAll('[data-accordion]').forEach(acc => {
        const sub = acc.querySelector('.bst-accordion-sub');
        if (sub && acc.dataset.originalSub) sub.textContent = acc.dataset.originalSub;
        const badge = acc.querySelector('.bst-risk-badge');
        if (badge && acc.dataset.originalBadge) {
          badge.textContent = acc.dataset.originalBadge;
          if (acc.dataset.originalBadgeClass) badge.className = acc.dataset.originalBadgeClass;
        }
        const body = acc.querySelector('.bst-accordion-body');
        if (body && body.dataset.originalContent) body.innerHTML = body.dataset.originalContent;
      });
      bstSyncNoRiskAccordions(tab);
    }
  }

  function bstSyncNoRiskAccordions(tab) {
    if (!tab) return;
    tab.querySelectorAll('[data-accordion]').forEach(acc => {
      const body = acc.querySelector('.bst-accordion-body');
      const badge = acc.querySelector('.bst-risk-badge');
      const sub = acc.querySelector('.bst-accordion-sub');
      const hasFlaggedItems = body && body.querySelectorAll('.bst-flagged-item').length > 0;
      if (!hasFlaggedItems && body && badge && sub) {
        sub.textContent = '0 sensitive content detected';
        badge.textContent = 'No risk';
        badge.className = 'bst-risk-badge bst-risk-none';
        body.innerHTML = '<p class="bst-accordion-empty">No flagged items.</p>';
      }
    });
  }

  // Store original accordion content once so we can restore when risk > 0
  document.querySelectorAll('#drawer-tab-brand-safety .bst-accordion-body').forEach(body => {
    if (!body.dataset.originalContent) body.dataset.originalContent = body.innerHTML;
  });
  document.querySelectorAll('#drawer-tab-brand-safety [data-accordion]').forEach(acc => {
    const sub = acc.querySelector('.bst-accordion-sub');
    const badge = acc.querySelector('.bst-risk-badge');
    if (sub && !acc.dataset.originalSub) acc.dataset.originalSub = sub.textContent;
    if (badge && !acc.dataset.originalBadge) acc.dataset.originalBadge = badge.textContent;
    if (badge && !acc.dataset.originalBadgeClass) acc.dataset.originalBadgeClass = badge.className;
  });

  const bstPlatformPills = document.getElementById('bst-platform-pills');
  if (bstPlatformPills) {
    bstPlatformPills.querySelectorAll('.bst-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        bstPlatformPills.querySelectorAll('.bst-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const platform = pill.getAttribute('data-platform') || 'all';
        bstUpdateRadarAndContrib(platform);
      });
    });
    bstUpdateRadarAndContrib('all');
  }

  bstApplySafeState();
  document.body.addEventListener('drawerTabChange', () => {
    if (document.querySelector('.drawer-tab[data-drawer-tab="brand-safety"].active')) bstApplySafeState();
  });
});

// Export PDF button (drawer top actions)
(function () {
  const btn = document.getElementById('drawer-export-pdf');
  if (btn) btn.addEventListener('click', function () {
    window.print();
  });
})();

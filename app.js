/**
 * Personal Study Reader App
 * Premium SPA with progress tracking, search, dark mode, and swipe navigation
 */

(function () {
  'use strict';

  // ── State ──
  const STATE_KEY = 'grammar-in-use-state';
  let bookData = null;
  let allUnits = [];      // flat list of all units
  let state = {
    completed: [],        // array of completed unit IDs
    lastUnit: null,       // last viewed unit ID
    lastTab: 'explanation',
    theme: 'light',
    scrollPositions: {},  // { unitId: scrollY }
  };

  // ── DOM References ──
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const splash = $('#splash');
  const dashboard = $('#dashboard');
  const reader = $('#reader');
  const extrasReader = $('#extras-reader');

  // ── Persistence ──
  function loadState() {
    try {
      const saved = localStorage.getItem(STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        state = { ...state, ...parsed };
      }
    } catch (e) {
      console.warn('Could not load state', e);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not save state', e);
    }
  }

  // ── Theme ──
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    state.theme = theme;

    const sunIcon = $('.theme-icon-sun');
    const moonIcon = $('.theme-icon-moon');
    if (theme === 'dark') {
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
    } else {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
    }

    // Update meta theme-color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.content = theme === 'dark' ? '#1E1B16' : '#2A7F6F';
    }

    saveState();
  }

  function toggleTheme() {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  }

  // ── Toast ──
  let toastTimeout;
  function showToast(msg) {
    const toast = $('#toast');
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('visible'), 2500);
  }

  // ── Data Loading ──
  async function loadBookData() {
    const res = await fetch('units.json');
    bookData = await res.json();

    // Build flat list of units
    allUnits = [];
    for (const section of bookData.sections) {
      for (const unit of section.units) {
        unit._sectionTitle = section.title;
        unit._sectionColor = section.color;
        unit._sectionIcon = section.icon;
        allUnits.push(unit);
      }
    }
  }

  // ── Dashboard Rendering ──
  function renderDashboard() {
    renderHero();
    renderStats();
    renderSections();
    renderExtras();
  }

  function renderHero() {
    const heroArea = $('#hero-area');
    const completedCount = state.completed.length;
    const pct = Math.round((completedCount / 145) * 100);

    if (state.lastUnit) {
      const unit = allUnits.find(u => u.id === state.lastUnit);
      if (unit) {
        heroArea.innerHTML = `
          <div class="hero-card fade-in" id="hero-continue" data-unit="${unit.id}">
            <div class="hero-card__label">Continue reading</div>
            <h2 class="hero-card__title">Unit ${unit.id}: ${unit.title}</h2>
            <p class="hero-card__subtitle">${unit._sectionTitle}</p>
            <div class="hero-card__progress-bar">
              <div class="hero-card__progress-fill" style="width: ${pct}%"></div>
            </div>
            <div class="hero-card__progress-text">
              <span>${completedCount} of 145 completed</span>
              <span>${pct}%</span>
            </div>
            <div class="hero-card__arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </div>`;
        $('#hero-continue').addEventListener('click', () => openUnit(unit.id));
        return;
      }
    }

    // No last unit — show welcome
    heroArea.innerHTML = `
      <div class="hero-card fade-in" id="hero-start" data-unit="1">
        <div class="hero-card__label">Welcome</div>
        <h2 class="hero-card__title">Study Reader</h2>
        <p class="hero-card__subtitle">Personal Reference Guide — Start learning!</p>
        <div class="hero-card__progress-bar">
          <div class="hero-card__progress-fill" style="width: 0%"></div>
        </div>
        <div class="hero-card__progress-text">
          <span>0 of 145 completed</span>
          <span>0%</span>
        </div>
        <div class="hero-card__arrow">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>`;
    $('#hero-start').addEventListener('click', () => openUnit(1));
  }

  function renderStats() {
    $('#stat-completed').textContent = state.completed.length;
    $('#stat-total').textContent = bookData.total_units;
    $('#stat-sections').textContent = bookData.sections.length;
  }

  function renderSections() {
    const container = $('#sections-list');
    container.innerHTML = '';

    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'section-header';
    sectionHeader.innerHTML = `<h2 class="section-header__title">Grammar Sections</h2>`;
    container.appendChild(sectionHeader);

    bookData.sections.forEach((section, idx) => {
      const completedInSection = section.units.filter(u => state.completed.includes(u.id)).length;
      const totalInSection = section.units.length;
      const progressPct = totalInSection > 0 ? Math.round((completedInSection / totalInSection) * 100) : 0;

      const card = document.createElement('div');
      card.className = 'section-card fade-in';
      card.style.animationDelay = `${idx * 40}ms`;

      card.innerHTML = `
        <div class="section-card__header" data-section="${section.id}">
          <div class="section-card__icon" style="background: ${section.color}15; color: ${section.color};">
            ${section.icon}
          </div>
          <div class="section-card__info">
            <div class="section-card__title">${section.title}</div>
            <div class="section-card__meta">
              <span>${completedInSection}/${totalInSection} units</span>
              <div class="section-card__progress-mini">
                <div class="section-card__progress-mini-fill" style="width: ${progressPct}%;"></div>
              </div>
            </div>
          </div>
          <svg class="section-card__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        <div class="section-card__body">
          <div class="section-card__units">
            ${section.units.map(unit => {
              const isCompleted = state.completed.includes(unit.id);
              return `
                <div class="unit-item" data-unit="${unit.id}">
                  <div class="unit-item__number">${unit.id}</div>
                  <div class="unit-item__title">${unit.title}</div>
                  <div class="unit-item__check ${isCompleted ? 'completed' : ''}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>`;

      // Toggle section
      const header = card.querySelector('.section-card__header');
      header.addEventListener('click', () => {
        card.classList.toggle('open');
      });

      // Unit click handlers
      card.querySelectorAll('.unit-item').forEach(item => {
        item.addEventListener('click', (e) => {
          // Prevent if clicking the check
          if (e.target.closest('.unit-item__check')) {
            e.stopPropagation();
            const unitId = parseInt(item.dataset.unit);
            toggleComplete(unitId);
            return;
          }
          openUnit(parseInt(item.dataset.unit));
        });
      });

      container.appendChild(card);
    });
  }

  function renderExtras() {
    const grid = $('#extras-grid');
    grid.innerHTML = '';

    if (!bookData.extras) return;

    bookData.extras.forEach(extra => {
      const card = document.createElement('a');
      card.className = 'extra-card fade-in';
      card.href = '#';
      card.innerHTML = `
        <div class="extra-card__icon">${extra.icon}</div>
        <div class="extra-card__title">${extra.title}</div>`;
      card.addEventListener('click', (e) => {
        e.preventDefault();
        openExtras(extra);
      });
      grid.appendChild(card);
    });
  }

  // ── Unit Navigation ──
  function openUnit(unitId) {
    const unit = allUnits.find(u => u.id === unitId);
    if (!unit) return;

    state.lastUnit = unitId;
    saveState();

    // Update reader UI
    $('#reader-unit-num').textContent = `Unit ${unit.id}`;
    $('#reader-unit-title').textContent = unit.title;

    // Set completion button
    updateCompleteButton(unitId);

    // Set active tab
    showTab(state.lastTab || 'explanation', unit);

    // Update nav buttons
    updateNavButtons(unitId);

    // Show reader, hide dashboard
    dashboard.classList.add('hidden');
    extrasReader.classList.remove('active');
    reader.classList.add('active');

    // Scroll to top
    window.scrollTo(0, 0);

    // Update page indicator
    updatePageIndicator(unitId);
  }

  function showTab(tabName, unit) {
    unit = unit || allUnits.find(u => u.id === state.lastUnit);
    if (!unit) return;

    state.lastTab = tabName;
    saveState();

    setZoom(100);

    // Update tab buttons
    $$('.reader__tab').forEach(t => t.classList.remove('active'));
    $(`[data-tab="${tabName}"]`).classList.add('active');

    // Show page image
    const pageImg = $('#page-img');
    const pageIdx = tabName === 'explanation' ? 0 : 1;
    const imgPath = unit.page_images[pageIdx];

    if (pageImg) {
      pageImg.classList.add('loading');
      pageImg.onload = () => pageImg.classList.remove('loading');
      pageImg.onerror = () => {
        pageImg.classList.remove('loading');
        pageImg.alt = 'Page not available';
      };
      pageImg.src = imgPath;
      pageImg.alt = `Unit ${unit.id} - ${tabName === 'explanation' ? 'Explanation' : 'Exercises'}`;
    }

    // Load words overlay
    const pageNum = unit.pages[pageIdx];
    loadWordOverlay(pageNum);
  }

  function updateCompleteButton(unitId) {
    const btn = $('#reader-complete-btn');
    const isComplete = state.completed.includes(unitId);
    btn.classList.toggle('completed', isComplete);
    btn.title = isComplete ? 'Mark as not completed' : 'Mark as completed';
  }

  function updateNavButtons(unitId) {
    const idx = allUnits.findIndex(u => u.id === unitId);
    const prevBtn = $('#btn-prev-unit');
    const nextBtn = $('#btn-next-unit');

    prevBtn.disabled = idx <= 0;
    nextBtn.disabled = idx >= allUnits.length - 1;
  }

  function updatePageIndicator(unitId) {
    const idx = allUnits.findIndex(u => u.id === unitId);
    $('#page-indicator').textContent = `${idx + 1} / ${allUnits.length}`;
  }

  function navigateUnit(direction) {
    const idx = allUnits.findIndex(u => u.id === state.lastUnit);
    const newIdx = idx + direction;
    if (newIdx >= 0 && newIdx < allUnits.length) {
      openUnit(allUnits[newIdx].id);
    }
  }

  function toggleComplete(unitId) {
    const idx = state.completed.indexOf(unitId);
    if (idx === -1) {
      state.completed.push(unitId);
      showToast(`Unit ${unitId} completed! ✓`);
    } else {
      state.completed.splice(idx, 1);
      showToast(`Unit ${unitId} unmarked`);
    }
    saveState();
    updateCompleteButton(unitId);
    renderDashboard(); // re-render to update progress
  }

  function goBackToDashboard() {
    reader.classList.remove('active');
    extrasReader.classList.remove('active');
    dashboard.classList.remove('hidden');
    reader.classList.remove('hide-controls');
    hidePopover();
    window.scrollTo(0, 0);
    renderDashboard();
  }

  // ── Extras Reader ──
  function openExtras(extra) {
    $('#extras-reader-title').textContent = extra.title;
    $('#extras-reader-label').textContent = extra.icon;

    const list = $('#extras-pages-list');
    list.innerHTML = '';

    // Filter valid pages
    const validPages = extra.page_images.filter((_, i) => {
      const pageNum = extra.pages[i];
      return pageNum <= (bookData.total_pages || 999);
    });

    validPages.forEach((imgPath, i) => {
      const img = document.createElement('img');
      img.src = imgPath;
      img.alt = `${extra.title} - Page ${i + 1}`;
      img.loading = 'lazy';
      list.appendChild(img);
    });

    dashboard.classList.add('hidden');
    reader.classList.remove('active');
    extrasReader.classList.add('active');
    window.scrollTo(0, 0);
  }

  // ── Search ──
  function initSearch() {
    const input = $('#search-input');
    const resultsContainer = $('#search-results');
    let debounceTimer;

    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const query = input.value.trim().toLowerCase();
        if (query.length < 2) {
          resultsContainer.classList.remove('active');
          return;
        }

        const matches = allUnits.filter(u =>
          u.title.toLowerCase().includes(query) ||
          `unit ${u.id}`.includes(query) ||
          (u.search_text && u.search_text.toLowerCase().includes(query))
        ).slice(0, 10);

        if (matches.length === 0) {
          resultsContainer.innerHTML = `<div class="search-results__empty">No units found</div>`;
        } else {
          resultsContainer.innerHTML = matches.map(u => `
            <div class="search-results__item" data-unit="${u.id}">
              <div class="search-results__unit-num">${u.id}</div>
              <div class="search-results__title">${highlightMatch(u.title, query)}</div>
            </div>
          `).join('');

          resultsContainer.querySelectorAll('.search-results__item').forEach(item => {
            item.addEventListener('click', () => {
              openUnit(parseInt(item.dataset.unit));
              input.value = '';
              resultsContainer.classList.remove('active');
            });
          });
        }

        resultsContainer.classList.add('active');
      }, 200);
    });

    // Close on blur
    input.addEventListener('blur', () => {
      setTimeout(() => resultsContainer.classList.remove('active'), 200);
    });

    input.addEventListener('focus', () => {
      if (input.value.trim().length >= 2) {
        resultsContainer.classList.add('active');
      }
    });
  }

  function highlightMatch(text, query) {
    const idx = text.toLowerCase().indexOf(query);
    if (idx === -1) return text;
    return text.slice(0, idx) +
      '<strong style="color:var(--primary-500)">' +
      text.slice(idx, idx + query.length) +
      '</strong>' +
      text.slice(idx + query.length);
  }

  // ── Touch / Swipe ──
  function initSwipe() {
    let startX = 0;
    let startY = 0;
    let isSwiping = false;

    const content = $('#reader-content');

    content.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isSwiping = true;
    }, { passive: true });

    content.addEventListener('touchend', (e) => {
      if (!isSwiping) return;
      isSwiping = false;

      // Ignore swipes if image is zoomed to allow panning
      const pageImg = $('#page-img');
      if (pageImg && pageImg.classList.contains('zoomed')) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - startX;
      const diffY = endY - startY;

      // Only trigger if horizontal swipe is dominant and significant
      if (Math.abs(diffX) > 60 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
        if (diffX > 0) {
          // Swipe Right (Go back / Prev page)
          if (state.lastTab === 'exercises') {
            showTab('explanation');
          } else {
            const idx = allUnits.findIndex(u => u.id === state.lastUnit);
            if (idx > 0) {
              state.lastTab = 'exercises';
              openUnit(allUnits[idx - 1].id);
            }
          }
        } else {
          // Swipe Left (Go forward / Next page)
          if (state.lastTab === 'explanation') {
            showTab('exercises');
          } else {
            const idx = allUnits.findIndex(u => u.id === state.lastUnit);
            if (idx < allUnits.length - 1) {
              state.lastTab = 'explanation';
              openUnit(allUnits[idx + 1].id);
            }
          }
        }
      }
    }, { passive: true });
  }

  // ── Step Zoom Functionality ──
  let currentZoom = 100; // 100, 125, 150, 175, 200

  function setZoom(level) {
    currentZoom = Math.max(100, Math.min(200, level));
    hidePopover();
    
    // Update image scale
    const pageImg = $('#page-img');
    if (pageImg) {
      if (currentZoom === 100) {
        pageImg.classList.remove('zoomed');
        pageImg.style.width = '';
        pageImg.style.maxWidth = '';
      } else {
        pageImg.classList.add('zoomed');
        pageImg.style.width = `${currentZoom}%`;
        pageImg.style.maxWidth = 'none';
      }
    }

    // Update zoom label
    const label = $('#zoom-level-text');
    if (label) label.textContent = `${currentZoom}%`;

    // Update buttons disabled state
    const btnIn = $('#btn-zoom-in');
    const btnOut = $('#btn-zoom-out');
    if (btnIn) btnIn.disabled = currentZoom >= 200;
    if (btnOut) btnOut.disabled = currentZoom <= 100;
  }

  // ── Word Overlay, Pronunciation and Translation ──
  let ocrCache = {};
  let activeTranslationController = null;

  async function loadWordOverlay(pageNum) {
    const overlay = $('#reader-word-overlay');
    if (!overlay) return;
    overlay.innerHTML = '';
    
    hidePopover();

    if (pageNum < 14 || pageNum > 303) return;

    try {
      let words = ocrCache[pageNum];
      if (!words) {
        const res = await fetch(`pages/words/page_${String(pageNum).padStart(3, '0')}.json`);
        if (!res.ok) throw new Error('Failed to fetch words JSON');
        words = await res.json();
        ocrCache[pageNum] = words;
      }

      const fragment = document.createDocumentFragment();
      words.forEach(([wordText, x0, y0, x1, y1]) => {
        const wordEl = document.createElement('span');
        wordEl.className = 'overlay-word';
        wordEl.style.left = `${x0 * 100}%`;
        wordEl.style.top = `${y0 * 100}%`;
        wordEl.style.width = `${(x1 - x0) * 100}%`;
        wordEl.style.height = `${(y1 - y0) * 100}%`;
        
        const cleanWord = wordText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’“”]/g, "").trim();
        wordEl.dataset.word = cleanWord;

        wordEl.addEventListener('click', (e) => {
          e.stopPropagation();
          showTranslationPopover(wordEl, cleanWord);
        });

        fragment.appendChild(wordEl);
      });
      overlay.appendChild(fragment);
    } catch (err) {
      console.warn(`No word overlay for page ${pageNum}:`, err);
    }
  }

  function showTranslationPopover(wordEl, word) {
    const popover = $('#translation-popover');
    if (!popover) return;

    const originalWordText = $('#popover-original-word');
    const translationText = $('#popover-translation-text');
    const btnPronounce = $('#btn-pronounce');

    if (originalWordText) originalWordText.textContent = word;
    if (translationText) translationText.textContent = 'Translating...';

    popover.style.display = 'block';

    const rect = wordEl.getBoundingClientRect();
    const popoverWidth = popover.offsetWidth;
    const popoverHeight = popover.offsetHeight;

    let left = rect.left + rect.width / 2 - popoverWidth / 2;
    let top = rect.top + window.scrollY - popoverHeight - 8;

    left = Math.max(8, Math.min(window.innerWidth - popoverWidth - 8, left));

    if (rect.top - popoverHeight - 8 < 0) {
      top = rect.bottom + window.scrollY + 8;
      popover.classList.add('popover--below');
    } else {
      popover.classList.remove('popover--below');
    }

    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;

    btnPronounce.onclick = (e) => {
      e.stopPropagation();
      pronounceWord(word);
    };

    translateWord(word, translationText);
  }

  function hidePopover() {
    const popover = $('#translation-popover');
    if (popover) popover.style.display = 'none';
    if (activeTranslationController) {
      activeTranslationController.abort();
      activeTranslationController = null;
    }
  }

  function pronounceWord(word) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      
      const voices = window.speechSynthesis.getVoices();
      const engVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Siri')));
      if (engVoice) utterance.voice = engVoice;
      
      window.speechSynthesis.speak(utterance);
    } else {
      showToast('Pronunciation not supported');
    }
  }

  async function translateWord(word, targetEl) {
    if (activeTranslationController) {
      activeTranslationController.abort();
    }
    activeTranslationController = new AbortController();

    const query = encodeURIComponent(word.toLowerCase());
    const url = `https://api.mymemory.translated.net/get?q=${query}&langpair=en|es`;

    try {
      const res = await fetch(url, { signal: activeTranslationController.signal });
      if (!res.ok) throw new Error('API response error');
      const data = await res.json();
      
      if (data && data.responseData && data.responseData.translatedText) {
        let translatedText = data.responseData.translatedText;
        if (translatedText.toLowerCase() === word.toLowerCase()) {
          targetEl.textContent = "Word not found";
        } else {
          if (word[0] === word[0].toUpperCase()) {
            translatedText = translatedText[0].toUpperCase() + translatedText.slice(1);
          }
          targetEl.textContent = translatedText;
        }
      } else {
        targetEl.textContent = 'Translation not found';
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Translation error:', err);
        targetEl.textContent = 'Connection error';
      }
    } finally {
      activeTranslationController = null;
    }
  }

  // ── Double-Tap / Double-Click to Zoom ──
  function initZoom() {
    const pageImg = $('#page-img');
    if (!pageImg) return;

    // Double click (desktop)
    pageImg.addEventListener('dblclick', () => {
      setZoom(currentZoom === 100 ? 150 : 100);
    });

    // Double tap (mobile)
    let lastTap = 0;
    pageImg.addEventListener('touchend', (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      if (tapLength < 300 && tapLength > 0) {
        setZoom(currentZoom === 100 ? 150 : 100);
        e.preventDefault();
      }
      lastTap = currentTime;
    });

    // Step Zoom Buttons
    const btnIn = $('#btn-zoom-in');
    const btnOut = $('#btn-zoom-out');
    if (btnIn) {
      btnIn.addEventListener('click', () => setZoom(currentZoom + 25));
    }
    if (btnOut) {
      btnOut.addEventListener('click', () => setZoom(currentZoom - 25));
    }
  }

  // ── Auto-hide Toolbars on Scroll ──
  function initScrollControls() {
    let lastScrollY = window.scrollY;
    let isControlsHidden = false;

    window.addEventListener('scroll', () => {
      if (!reader.classList.contains('active')) return;

      const currentScrollY = window.scrollY;
      const scrollDifference = currentScrollY - lastScrollY;

      // Only trigger if scroll is significant to avoid jitter
      if (Math.abs(scrollDifference) > 15) {
        if (scrollDifference > 0 && currentScrollY > 100) {
          // Scroll down: hide controls
          if (!isControlsHidden) {
            reader.classList.add('hide-controls');
            isControlsHidden = true;
          }
        } else if (scrollDifference < -15) {
          // Scroll up: show controls
          if (isControlsHidden) {
            reader.classList.remove('hide-controls');
            isControlsHidden = false;
          }
        }
      }
      lastScrollY = currentScrollY;
    }, { passive: true });

    // Tap/click on container to toggle controls when hidden
    const pageContainer = $('#page-container');
    pageContainer.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      
      const pageImg = $('#page-img');
      if (pageImg && pageImg.classList.contains('zoomed')) return; // Ignore if zoomed to avoid conflict with panning

      if (isControlsHidden) {
        reader.classList.remove('hide-controls');
        isControlsHidden = false;
      } else {
        // Only hide if we have scrolled down a bit
        if (window.scrollY > 50) {
          reader.classList.add('hide-controls');
          isControlsHidden = true;
        }
      }
    });
  }

  // ── Keyboard Shortcuts ──
  function initKeyboard() {
    document.addEventListener('keydown', (e) => {
      // Don't capture if typing in search
      if (e.target.tagName === 'INPUT') return;

      if (reader.classList.contains('active')) {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            navigateUnit(-1);
            break;
          case 'ArrowRight':
            e.preventDefault();
            navigateUnit(1);
            break;
          case 'Escape':
            goBackToDashboard();
            break;
          case 'e':
            showTab('explanation');
            break;
          case 'x':
            showTab('exercises');
            break;
          case 'c':
            if (state.lastUnit) toggleComplete(state.lastUnit);
            break;
        }
      }

      // Global shortcuts
      if (e.key === 'd' && !e.ctrlKey && !e.metaKey) {
        // Only toggle theme if not in an input
        if (e.target.tagName !== 'INPUT') {
          toggleTheme();
        }
      }
    });
  }

  // ── Event Binding ──
  function bindEvents() {
    // Theme toggle
    $('#theme-toggle').addEventListener('click', toggleTheme);

    // Reader back button
    $('#reader-back').addEventListener('click', goBackToDashboard);
    $('#extras-reader-back').addEventListener('click', goBackToDashboard);

    // Reader tabs
    $('#tab-explanation').addEventListener('click', () => showTab('explanation'));
    $('#tab-exercises').addEventListener('click', () => showTab('exercises'));

    // Complete button
    $('#reader-complete-btn').addEventListener('click', () => {
      if (state.lastUnit) toggleComplete(state.lastUnit);
    });

    // Nav buttons
    $('#btn-prev-unit').addEventListener('click', () => navigateUnit(-1));
    $('#btn-next-unit').addEventListener('click', () => navigateUnit(1));

    // Brand click = go home
    $('#nav-brand').addEventListener('click', (e) => {
      e.preventDefault();
      goBackToDashboard();
    });

    // Close popover on cross click
    const closePopoverBtn = $('#btn-close-popover');
    if (closePopoverBtn) {
      closePopoverBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        hidePopover();
      });
    }

    // Close popover if clicking anywhere else
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#translation-popover') && !e.target.closest('.overlay-word')) {
        hidePopover();
      }
    });

    // Close popover on scroll
    window.addEventListener('scroll', hidePopover, { passive: true });
  }

  // ── Splash Screen ──
  function hideSplash() {
    setTimeout(() => {
      splash.classList.add('hidden');
      setTimeout(() => splash.remove(), 600);
    }, 1600);
  }

  // ── Service Worker Registration ──
  function registerSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(err => {
        console.warn('SW registration failed:', err);
      });
    }
  }

  // ── Init ──
  async function init() {
    loadState();
    applyTheme(state.theme);

    try {
      await loadBookData();
      renderDashboard();
      initSearch();
      initSwipe();
      initZoom();
      initScrollControls();
      initKeyboard();
      bindEvents();
      hideSplash();
      registerSW();
    } catch (err) {
      console.error('Failed to load book data:', err);
      splash.querySelector('.splash__subtitle').textContent = 'Error loading data. Please refresh.';
    }
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/**
 * SuleimanBioinformatics Frontend Web Application Main Script
 * Manages theme switching, interactive tabs, dynamic curricula search, and presets.
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initToolTabs();
  initGenomicTool();
  initHydropathyTool();
  initProteinViewer();
  initCurriculaExplorer();
  initMobileNav();
});

// ==========================================
// 1. THEME SWITCHER
// ==========================================
function initThemeToggle() {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (!themeToggleBtn) return;

  const savedTheme = localStorage.getItem('sb-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('sb-theme', newTheme);
    updateThemeIcon(newTheme);
  });
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('themeToggleBtn');
  if (!btn) return;
  if (theme === 'light') {
    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    btn.setAttribute('aria-label', 'Switch to dark theme');
  } else {
    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    btn.setAttribute('aria-label', 'Switch to light theme');
  }
}

// ==========================================
// 2. INTERACTIVE TOOL TABS
// ==========================================
function initToolTabs() {
  const tabBtns = document.querySelectorAll('.tool-tab-btn');
  const panels = document.querySelectorAll('.tool-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-target');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });
}

// ==========================================
// 3. GENOMIC ANALYZER TOOL
// ==========================================
function initGenomicTool() {
  const seqInput = document.getElementById('genomicSeqInput');
  const windowSlider = document.getElementById('gcWindowSlider');
  const windowValDisplay = document.getElementById('gcWindowVal');
  const presetBtns = document.querySelectorAll('[data-dna-preset]');

  const dnaPresets = {
    ecoli_ori: `>E.coli_K12_oriC_region
AGCTCTTGTTCAATGTACTCACCCTCTCGAGAGATCAGTGACGCATCACCACAAGGCATTATTCGGTAT
CCTTGTTCGTTCACCCAGTCGCAGCACCATTTTCACCATCAGCCACTAGTGTTTGATGATGAGCCATTT
CTGGAGTTTCCGTTCTTTGAGTTACTACGGTACTTTCGTTCGTTGAAAGTATTTGTTCACCCTTTTTTT
ATGTCAGAGTTTTACTATCATCAGCACCATTTCCACGATCAGCCACTAGTGTTTGATGATGAGCCATTT`,
    tnbc_exon: `>TNBC_Candidate_Exon_Fragment
ATGGACTACAAGGACGACGATGACAAGATGGCCAGCTCCCGTGCCCGGAGCAACACCACGCTGGCCGAG
GAGGTCATGGCCCTGGTGGAGATCGTGGCCAGCAAGGGCGGCGCCATCGTCGCCAGCACCGACACCACC
ACCGCCGCCAGCACCGGCGGCCGCCTCTACTTCAAGGTGGCCGCCGACGTGAAGAACCGCTGCCTGCGC`,
    synthetic_skew: `>Synthetic_High_Skew_Strand
CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC
CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC
GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG
GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG`
  };

  const update = () => {
    if (!seqInput) return;
    const cleanSeq = GenomicAnalyzer.cleanSequence(seqInput.value);
    const windowSize = parseInt(windowSlider ? windowSlider.value : 50, 10);
    if (windowValDisplay) windowValDisplay.textContent = `${windowSize} bp`;

    const metrics = GenomicAnalyzer.analyzeMetrics(cleanSeq);
    document.getElementById('metricSeqLen').textContent = metrics.len.toLocaleString();
    document.getElementById('metricGCContent').textContent = `${metrics.gcContent}%`;
    document.getElementById('metricGCSkew').textContent = metrics.gcSkew;
    document.getElementById('metricBaseCounts').textContent = `A:${metrics.a} T:${metrics.t} G:${metrics.g} C:${metrics.c}`;

    // Render SVG Plot
    const skewData = GenomicAnalyzer.computeSlidingGCSkew(cleanSeq, windowSize, Math.max(5, Math.floor(windowSize / 5)));
    GenomicAnalyzer.renderGCSkewSVG('gcSkewChartBox', skewData);
  };

  if (seqInput) {
    seqInput.addEventListener('input', update);
  }
  if (windowSlider) {
    windowSlider.addEventListener('input', update);
  }

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-dna-preset');
      if (dnaPresets[key] && seqInput) {
        seqInput.value = dnaPresets[key];
        update();
      }
    });
  });

  // Load default preset on start
  if (seqInput && !seqInput.value) {
    seqInput.value = dnaPresets.ecoli_ori;
    update();
  }
}

// ==========================================
// 4. HYDROPATHY TOOL
// ==========================================
function initHydropathyTool() {
  const peptideInput = document.getElementById('peptideSeqInput');
  const windowSlider = document.getElementById('kdWindowSlider');
  const windowValDisplay = document.getElementById('kdWindowVal');
  const presetBtns = document.querySelectorAll('[data-pep-preset]');

  const pepPresets = {
    insulin_a: `>Insulin_Chain_A_Human
GIVEQCCTSICSLYQLENYCN`,
    transmembrane: `>GPCR_Transmembrane_Domain_Sample
WLFSFLVLLFLLLVLYAFISLFLWLFVALVLYAFLLVIL`,
    signal_peptide: `>Secretory_Signal_Hydrophobic_Core
MKWVTFISLLLLFSSAYSRGVFRRDTHKSEIAHRFNDLV`
  };

  const update = () => {
    if (!peptideInput) return;
    const cleanPep = HydropathyAnalyzer.cleanPeptide(peptideInput.value);
    const windowSize = parseInt(windowSlider ? windowSlider.value : 9, 10);
    if (windowValDisplay) windowValDisplay.textContent = `${windowSize} aa`;

    const profile = HydropathyAnalyzer.computeProfile(cleanPep, windowSize);
    
    // Average score
    const avgScore = profile.length > 0 
      ? (profile.reduce((acc, p) => acc + p.score, 0) / profile.length).toFixed(2)
      : '0.00';
    
    // Max Hydrophobic peak
    let maxPeak = -5.0;
    profile.forEach(p => { if (p.score > maxPeak) maxPeak = p.score; });

    document.getElementById('metricPepLen').textContent = cleanPep.length;
    document.getElementById('metricAvgHydropathy').textContent = avgScore;
    document.getElementById('metricMaxPeak').textContent = maxPeak > -5 ? maxPeak.toFixed(2) : '0.00';

    HydropathyAnalyzer.renderHydropathySVG('hydropathyChartBox', profile);
  };

  if (peptideInput) {
    peptideInput.addEventListener('input', update);
  }
  if (windowSlider) {
    windowSlider.addEventListener('input', update);
  }

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-pep-preset');
      if (pepPresets[key] && peptideInput) {
        peptideInput.value = pepPresets[key];
        update();
      }
    });
  });

  if (peptideInput && !peptideInput.value) {
    peptideInput.value = pepPresets.insulin_a;
    update();
  }
}

// ==========================================
// 5. 3D BIOMOLECULAR STRUCTURE VIEWER
// ==========================================
let molecularViewer = null;

function initProteinViewer() {
  const canvas = document.getElementById('proteinCanvas3D');
  if (!canvas) return;

  molecularViewer = new BiomolecularViewer3D('proteinCanvas3D');

  const presetBtns = document.querySelectorAll('[data-struct-preset]');
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const struct = btn.getAttribute('data-struct-preset');
      if (molecularViewer) {
        molecularViewer.loadStructure(struct);
        document.getElementById('viewerStructLabel').textContent = btn.textContent;
      }
    });
  });

  const resetBtn = document.getElementById('resetViewBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (molecularViewer) molecularViewer.resetView();
    });
  }
}

// ==========================================
// 6. CURRICULA & RESEARCH WIKI EXPLORER
// ==========================================
let allCurricula = [];

async function initCurriculaExplorer() {
  const grid = document.getElementById('curriculaCardsGrid');
  const searchInput = document.getElementById('curriculaSearchInput');
  const filterChips = document.querySelectorAll('.filter-chip');

  try {
    const res = await fetch('data/curricula.json');
    allCurricula = await res.json();
    renderCurricula(allCurricula);
  } catch (err) {
    console.error('Failed to load curricula.json', err);
  }

  let activeCategory = 'All';

  const filterAndRender = () => {
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const filtered = allCurricula.filter(item => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchesQuery = !query ||
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags.some(t => t.toLowerCase().includes(query));
      return matchesCategory && matchesQuery;
    });
    renderCurricula(filtered);
  };

  if (searchInput) {
    searchInput.addEventListener('input', filterAndRender);
  }

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeCategory = chip.getAttribute('data-category');
      filterAndRender();
    });
  });
}

function renderCurricula(items) {
  const grid = document.getElementById('curriculaCardsGrid');
  if (!grid) return;

  if (items.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
        <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">No modules or syntheses found matching your query.</p>
        <p style="font-size: 0.85rem;">Try a broader keyword or switch categories.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = items.map(item => `
    <article class="curricula-card">
      <div class="card-category-badge">${item.category}</div>
      <h3 class="card-title">${item.title}</h3>
      <p class="card-desc">${item.description}</p>
      <div class="card-tags">
        ${item.tags.map(t => `<span class="tag-badge">#${t}</span>`).join('')}
      </div>
      <div class="card-footer">
        <span class="level-badge">${item.level}</span>
        <a href="${item.repo}" target="_blank" rel="noopener noreferrer" class="card-action-link">
          Explore Code
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
      </div>
    </article>
  `).join('');
}

// ==========================================
// 7. MOBILE NAVIGATION
// ==========================================
function initMobileNav() {
  const toggleBtn = document.querySelector('.mobile-nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (!toggleBtn || !navLinks) return;

  toggleBtn.addEventListener('click', () => {
    const isVisible = navLinks.style.display === 'flex';
    navLinks.style.display = isVisible ? 'none' : 'flex';
    if (!isVisible) {
      navLinks.style.position = 'absolute';
      navLinks.style.top = '72px';
      navLinks.style.left = '0';
      navLinks.style.width = '100%';
      navLinks.style.flexDirection = 'column';
      navLinks.style.background = 'var(--bg-card)';
      navLinks.style.padding = '1.5rem';
      navLinks.style.borderBottom = '1px solid var(--border-subtle)';
    }
  });
}

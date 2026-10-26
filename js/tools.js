/**
 * SuleimanBioinformatics Interactive Scientific Tools
 * - Genomic GC-Skew & Base Analyzer
 * - Kyte-Doolittle Hydropathy Profile Calculator
 * - 3D Biomolecular Structure Canvas Engine
 */

// ==========================================
// 1. GENOMIC GC-SKEW & SEQUENCE ANALYZER
// ==========================================

const GenomicAnalyzer = {
  // Cleans sequence from FASTA headers or whitespace
  cleanSequence(raw) {
    if (!raw) return "";
    return raw
      .replace(/^>.*$/gm, "") // remove FASTA header
      .replace(/[^A-Za-z]/g, "") // keep letters only
      .toUpperCase();
  },

  // Compute basic metrics
  analyzeMetrics(seq) {
    const len = seq.length;
    if (len === 0) {
      return { len: 0, a: 0, t: 0, g: 0, c: 0, gcContent: 0, atContent: 0, gcSkew: 0, atSkew: 0 };
    }

    let a = 0, t = 0, g = 0, c = 0, n = 0;
    for (let i = 0; i < len; i++) {
      const char = seq[i];
      if (char === 'A') a++;
      else if (char === 'T') t++;
      else if (char === 'G') g++;
      else if (char === 'C') c++;
      else n++;
    }

    const gcContent = ((g + c) / len) * 100;
    const atContent = ((a + t) / len) * 100;
    const gcSkew = (c + g) > 0 ? (c - g) / (c + g) : 0;
    const atSkew = (a + t) > 0 ? (a - t) / (a + t) : 0;

    return {
      len,
      a, t, g, c, n,
      gcContent: gcContent.toFixed(2),
      atContent: atContent.toFixed(2),
      gcSkew: gcSkew.toFixed(4),
      atSkew: atSkew.toFixed(4)
    };
  },

  // Calculate sliding-window GC Skew: (C - G) / (C + G)
  computeSlidingGCSkew(seq, windowSize = 50, step = 10) {
    const data = [];
    const len = seq.length;
    if (len < windowSize) {
      // Single window
      const metrics = this.analyzeMetrics(seq);
      return [{ pos: 0, skew: parseFloat(metrics.gcSkew) }];
    }

    for (let i = 0; i <= len - windowSize; i += step) {
      const windowStr = seq.substring(i, i + windowSize);
      let g = 0, c = 0;
      for (let j = 0; j < windowSize; j++) {
        if (windowStr[j] === 'G') g++;
        else if (windowStr[j] === 'C') c++;
      }
      const skew = (c + g) > 0 ? (c - g) / (c + g) : 0;
      data.push({ pos: i + Math.floor(windowSize / 2), skew });
    }
    return data;
  },

  // Reverse complement
  reverseComplement(seq) {
    const complement = { 'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C', 'N': 'N' };
    return seq.split('').reverse().map(b => complement[b] || b).join('');
  },

  // Transcribe to mRNA
  transcribe(seq) {
    return seq.replace(/T/g, 'U');
  },

  // Render SVG Chart for GC Skew
  renderGCSkewSVG(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!data || data.length === 0) {
      container.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:2rem;">Enter a DNA sequence to compute GC-skew</div>';
      return;
    }

    const width = 500;
    const height = 180;
    const padX = 40;
    const padY = 25;
    const chartW = width - padX * 2;
    const chartH = height - padY * 2;

    const maxPos = data[data.length - 1].pos || 1;
    let minSkew = -0.5;
    let maxSkew = 0.5;

    data.forEach(d => {
      if (d.skew < minSkew) minSkew = d.skew;
      if (d.skew > maxSkew) maxSkew = d.skew;
    });

    // Add buffer
    minSkew = Math.min(-0.2, minSkew - 0.05);
    maxSkew = Math.max(0.2, maxSkew + 0.05);

    const getX = pos => padX + (pos / maxPos) * chartW;
    const getY = skew => padY + chartH - ((skew - minSkew) / (maxSkew - minSkew)) * chartH;
    const zeroY = getY(0);

    // Build path points
    let points = data.map(d => `${getX(d.pos).toFixed(1)},${getY(d.skew).toFixed(1)}`).join(' ');
    let areaPoints = `${getX(data[0].pos)},${zeroY} ` + points + ` ${getX(data[data.length - 1].pos)},${zeroY}`;

    const svg = `
      <svg viewBox="0 0 ${width} ${height}" class="svg-chart" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gcGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#00f2fe" stop-opacity="0.5" />
            <stop offset="100%" stop-color="#00f2fe" stop-opacity="0.02" />
          </linearGradient>
        </defs>
        <!-- Zero baseline -->
        <line x1="${padX}" y1="${zeroY}" x2="${width - padX}" y2="${zeroY}" stroke="rgba(255,255,255,0.2)" stroke-dasharray="3 3" />
        <text x="${padX - 8}" y="${zeroY + 4}" fill="#94a3b8" font-size="10" text-anchor="end" font-family="monospace">0.0</text>

        <!-- Area Fill -->
        <polygon points="${areaPoints}" fill="url(#gcGrad)" />

        <!-- Line Plot -->
        <polyline points="${points}" fill="none" stroke="#00f2fe" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

        <!-- Top / Bottom label -->
        <text x="${padX - 8}" y="${padY + 8}" fill="#38bdf8" font-size="9" text-anchor="end" font-family="monospace">+C</text>
        <text x="${padX - 8}" y="${height - padY}" fill="#f43f5e" font-size="9" text-anchor="end" font-family="monospace">+G</text>

        <!-- X Axis coordinate labels -->
        <text x="${padX}" y="${height - 6}" fill="#64748b" font-size="9" font-family="monospace">0 bp</text>
        <text x="${width - padX}" y="${height - 6}" fill="#64748b" font-size="9" text-anchor="end" font-family="monospace">${maxPos} bp</text>
      </svg>
    `;
    container.innerHTML = svg;
  }
};

// ==========================================
// 2. KYTE-DOOLITTLE HYDROPATHY ANALYZER
// ==========================================

const HydropathyAnalyzer = {
  // Official Kyte-Doolittle hydropathy values (J. Mol. Biol. 1982)
  scale: {
    'A': 1.8, 'R': -4.5, 'N': -3.5, 'D': -3.5, 'C': 2.5,
    'Q': -3.5, 'E': -3.5, 'G': -0.4, 'H': -3.2, 'I': 4.5,
    'L': 3.8, 'K': -3.9, 'M': 1.9, 'F': 2.8, 'P': -1.6,
    'S': -0.8, 'T': -0.7, 'W': -0.9, 'Y': -1.3, 'V': 4.2
  },

  cleanPeptide(raw) {
    if (!raw) return "";
    return raw
      .replace(/^>.*$/gm, "")
      .replace(/[^A-Za-z]/g, "")
      .toUpperCase();
  },

  computeProfile(seq, windowSize = 9) {
    const scores = [];
    const len = seq.length;
    if (len < windowSize) {
      let sum = 0, count = 0;
      for (let i = 0; i < len; i++) {
        const val = this.scale[seq[i]];
        if (val !== undefined) {
          sum += val;
          count++;
        }
      }
      const avg = count > 0 ? sum / count : 0;
      return [{ pos: 1, score: avg }];
    }

    const radius = Math.floor(windowSize / 2);
    for (let i = radius; i < len - radius; i++) {
      let sum = 0, count = 0;
      for (let j = -radius; j <= radius; j++) {
        const val = this.scale[seq[i + j]];
        if (val !== undefined) {
          sum += val;
          count++;
        }
      }
      scores.push({
        pos: i + 1,
        score: count > 0 ? sum / count : 0
      });
    }
    return scores;
  },

  renderHydropathySVG(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!data || data.length === 0) {
      container.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:2rem;">Enter amino acid sequence to generate profile</div>';
      return;
    }

    const width = 500;
    const height = 180;
    const padX = 40;
    const padY = 25;
    const chartW = width - padX * 2;
    const chartH = height - padY * 2;

    const minScore = -4.5;
    const maxScore = 4.5;
    const minPos = data[0].pos;
    const maxPos = data[data.length - 1].pos;

    const getX = pos => padX + ((pos - minPos) / Math.max(1, maxPos - minPos)) * chartW;
    const getY = score => padY + chartH - ((score - minScore) / (maxScore - minScore)) * chartH;
    const zeroY = getY(0);
    const tmY = getY(1.6); // Transmembrane cutoff

    let points = data.map(d => `${getX(d.pos).toFixed(1)},${getY(d.score).toFixed(1)}`).join(' ');

    const svg = `
      <svg viewBox="0 0 ${width} ${height}" class="svg-chart" xmlns="http://www.w3.org/2000/svg">
        <!-- Zero baseline -->
        <line x1="${padX}" y1="${zeroY}" x2="${width - padX}" y2="${zeroY}" stroke="rgba(255,255,255,0.2)" stroke-dasharray="3 3" />
        <text x="${padX - 8}" y="${zeroY + 4}" fill="#94a3b8" font-size="9" text-anchor="end" font-family="monospace">0.0</text>

        <!-- Transmembrane Threshold Line (+1.6) -->
        <line x1="${padX}" y1="${tmY}" x2="${width - padX}" y2="${tmY}" stroke="#10b981" stroke-dasharray="4 2" opacity="0.8" />
        <text x="${width - padX}" y="${tmY - 4}" fill="#10b981" font-size="8" text-anchor="end" font-family="monospace">TM Cutoff (+1.6)</text>

        <!-- Hydropathy Curve -->
        <polyline points="${points}" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

        <!-- Hydrophobic / Hydrophilic indicators -->
        <text x="${padX - 8}" y="${padY + 8}" fill="#00f2fe" font-size="8" text-anchor="end" font-family="monospace">Hydrophobic</text>
        <text x="${padX - 8}" y="${height - padY}" fill="#f43f5e" font-size="8" text-anchor="end" font-family="monospace">Hydrophilic</text>

        <!-- X Axis labels -->
        <text x="${padX}" y="${height - 6}" fill="#64748b" font-size="9" font-family="monospace">Residue ${minPos}</text>
        <text x="${width - padX}" y="${height - 6}" fill="#64748b" font-size="9" text-anchor="end" font-family="monospace">Residue ${maxPos}</text>
      </svg>
    `;
    container.innerHTML = svg;
  }
};

// ==========================================
// 3. 3D BIOMOLECULAR STRUCTURE CANVAS VIEWER
// ==========================================

class BiomolecularViewer3D {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.rotX = 0.4;
    this.rotY = -0.5;
    this.zoom = 1.0;
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.currentStructure = 'insulin';
    this.displayMode = 'ribbon'; // 'ribbon', 'atoms', 'spacefill'

    this.initCanvasSize();
    this.initListeners();
    this.loadStructure(this.currentStructure);
    this.animate();
  }

  initCanvasSize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.width = rect.width;
    this.height = rect.height;
    this.ctx.scale(dpr, dpr);
  }

  initListeners() {
    window.addEventListener('resize', () => {
      this.initCanvasSize();
      this.render();
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.rotY += dx * 0.01;
      this.rotX += dy * 0.01;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.render();
    });

    // Touch support
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.lastMouseX = e.touches[0].clientX;
        this.lastMouseY = e.touches[0].clientY;
      }
    });

    window.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    window.addEventListener('touchmove', (e) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - this.lastMouseX;
      const dy = e.touches[0].clientY - this.lastMouseY;
      this.rotY += dx * 0.01;
      this.rotX += dy * 0.01;
      this.lastMouseX = e.touches[0].clientX;
      this.lastMouseY = e.touches[0].clientY;
      this.render();
    });

    // Zoom on wheel
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.zoom *= e.deltaY < 0 ? 1.08 : 0.92;
      this.zoom = Math.max(0.4, Math.min(3.0, this.zoom));
      this.render();
    }, { passive: false });
  }

  // Generate 3D atomic coordinates for representative biomolecules
  loadStructure(name) {
    this.currentStructure = name;
    this.atoms = [];

    if (name === 'insulin') {
      // Synthetic Alpha/Beta coordinate chains mimicking 1COH
      // Chain A: 21 residues, Chain B: 30 residues
      for (let i = 0; i < 21; i++) {
        const t = i * 0.35;
        this.atoms.push({
          x: Math.sin(t * 1.8) * 35 + 15,
          y: (i - 10) * 8,
          z: Math.cos(t * 1.8) * 35,
          chain: 'A',
          res: i + 1,
          color: '#00f2fe'
        });
      }
      for (let i = 0; i < 30; i++) {
        const t = i * 0.28;
        this.atoms.push({
          x: Math.cos(t * 1.5) * 45 - 20,
          y: (i - 15) * 7.5,
          z: Math.sin(t * 1.5) * 45,
          chain: 'B',
          res: i + 1,
          color: '#f43f5e'
        });
      }
    } else if (name === 'helix') {
      // Classic Alpha-Helix (3.6 residues per turn, pitch 5.4 A)
      for (let i = 0; i < 36; i++) {
        const theta = i * (Math.PI * 2 / 3.6);
        this.atoms.push({
          x: Math.cos(theta) * 30,
          y: (i - 18) * 6,
          z: Math.sin(theta) * 30,
          chain: 'H',
          res: i + 1,
          color: i % 2 === 0 ? '#38bdf8' : '#818cf8'
        });
      }
    } else if (name === 'dna') {
      // Double Helix DNA
      for (let i = 0; i < 28; i++) {
        const theta = i * 0.55;
        const y = (i - 14) * 11;
        // Strand 1
        this.atoms.push({
          x: Math.cos(theta) * 50,
          y: y,
          z: Math.sin(theta) * 50,
          chain: 'S1',
          res: i + 1,
          color: '#00f2fe'
        });
        // Strand 2 (offset by PI)
        this.atoms.push({
          x: Math.cos(theta + Math.PI) * 50,
          y: y,
          z: Math.sin(theta + Math.PI) * 50,
          chain: 'S2',
          res: i + 1,
          color: '#ec4899'
        });
      }
    }
    this.render();
  }

  project(p) {
    // 3D rotation around Y and X axes
    let radY = this.rotY;
    let x1 = p.x * Math.cos(radY) + p.z * Math.sin(radY);
    let z1 = -p.x * Math.sin(radY) + p.z * Math.cos(radY);

    let radX = this.rotX;
    let y2 = p.y * Math.cos(radX) - z1 * Math.sin(radX);
    let z2 = p.y * Math.sin(radX) + z1 * Math.cos(radX);

    // Perspective projection
    const fov = 400;
    const distance = 350;
    const factor = fov / (distance + z2);

    return {
      x: this.width / 2 + x1 * factor * this.zoom,
      y: this.height / 2 + y2 * factor * this.zoom,
      z: z2,
      scale: factor * this.zoom,
      chain: p.chain,
      res: p.res,
      color: p.color
    };
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Subtle background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < this.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // Project coordinates
    const projected = this.atoms.map(a => this.project(a));

    // Group by chain for continuous ribbons / bonds
    const chains = {};
    projected.forEach(p => {
      if (!chains[p.chain]) chains[p.chain] = [];
      chains[p.chain].push(p);
    });

    // Draw connecting backbone ribbons / bonds
    Object.keys(chains).forEach(ch => {
      const pts = chains[ch];
      if (pts.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        // Curve through midpoint
        const xc = (pts[i].x + pts[i - 1].x) / 2;
        const yc = (pts[i].y + pts[i - 1].y) / 2;
        ctx.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, xc, yc);
      }
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);

      ctx.strokeStyle = pts[0].color;
      ctx.lineWidth = 3.5 * this.zoom;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = pts[0].color;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // If DNA, connect cross rungs (hydrogen bonds)
    if (this.currentStructure === 'dna') {
      const s1 = chains['S1'] || [];
      const s2 = chains['S2'] || [];
      const minLen = Math.min(s1.length, s2.length);
      for (let i = 0; i < minLen; i += 2) {
        ctx.beginPath();
        ctx.moveTo(s1[i].x, s1[i].y);
        ctx.lineTo(s2[i].x, s2[i].y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5 * this.zoom;
        ctx.stroke();
      }
    }

    // Depth-sort atom spheres for painter's algorithm
    const sorted = [...projected].sort((a, b) => b.z - a.z);

    // Draw atom nodes
    sorted.forEach(p => {
      const radius = Math.max(2, (this.displayMode === 'spacefill' ? 14 : 6) * p.scale);
      
      // Radial glow gradient for 3D sphere look
      const grad = ctx.createRadialGradient(
        p.x - radius * 0.3, p.y - radius * 0.3, radius * 0.1,
        p.x, p.y, radius
      );
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, p.color);
      grad.addColorStop(1, '#090d16');

      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Outline
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });
  }

  animate() {
    // Slow auto-rotation when not dragging
    if (!this.isDragging) {
      this.rotY += 0.003;
      this.render();
    }
    requestAnimationFrame(() => this.animate());
  }

  resetView() {
    this.rotX = 0.4;
    this.rotY = -0.5;
    this.zoom = 1.0;
    this.render();
  }
}

// Global exposure
window.GenomicAnalyzer = GenomicAnalyzer;
window.HydropathyAnalyzer = HydropathyAnalyzer;
window.BiomolecularViewer3D = BiomolecularViewer3D;

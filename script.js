(() => {
  const fileInput = document.getElementById('fileInput');
  const filterSelect = document.getElementById('filterSelect');
  const canvas = document.getElementById('canvas');
  const hint = document.getElementById('hint');
  const downloadBtn = document.getElementById('downloadBtn');
  const resetBtn = document.getElementById('resetBtn');

  const blurControl = document.getElementById('blurControl');
  const blurRange = document.getElementById('blurRange');
  const blurValue = document.getElementById('blurValue');

  const brightnessControl = document.getElementById('brightnessControl');
  const brightnessRange = document.getElementById('brightnessRange');
  const brightnessValue = document.getElementById('brightnessValue');

  const contrastControl = document.getElementById('contrastControl');
  const contrastRange = document.getElementById('contrastRange');
  const contrastValue = document.getElementById('contrastValue');

  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  let originalImageData = null;
  let originalWidth = 0;
  let originalHeight = 0;

  function clampByte(v) {
    return Math.max(0, Math.min(255, v));
  }

  function setControlsEnabled(enabled) {
    filterSelect.disabled = !enabled;
    blurRange.disabled = !enabled;
    brightnessRange.disabled = !enabled;
    contrastRange.disabled = !enabled;
    downloadBtn.disabled = !enabled;
    resetBtn.disabled = !enabled;
  }

  function resetControls() {
    filterSelect.value = 'none';

    blurRange.value = '0';
    blurValue.textContent = '0';

    brightnessRange.value = '0';
    brightnessValue.textContent = '0';

    contrastRange.value = '0';
    contrastValue.textContent = '0';

    updateControlVisibility();
  }

  function updateControlVisibility() {
    const v = filterSelect.value;

    blurControl.hidden = v !== 'blur';
    brightnessControl.hidden = v !== 'brightness';
    contrastControl.hidden = v !== 'contrast';
  }

  function fitImageToCanvas(img) {
    const maxW = 980;
    const maxH = 650;

    const scale = Math.min(maxW / img.width, maxH / img.height, 1);
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    canvas.width = w;
    canvas.height = h;

    return { w, h };
  }

  function drawImageToCanvas(img) {
    const { w, h } = fitImageToCanvas(img);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    originalWidth = w;
    originalHeight = h;
    originalImageData = ctx.getImageData(0, 0, w, h);
  }

  function copyImageData(imageData) {
    return new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);
  }

  function applyGrayscale(imageData) {
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      const y = 0.299 * r + 0.587 * g + 0.114 * b;
      d[i] = d[i + 1] = d[i + 2] = y;
    }
    return imageData;
  }

  function applySepia(imageData) {
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];

      d[i] = clampByte(0.393 * r + 0.769 * g + 0.189 * b);
      d[i + 1] = clampByte(0.349 * r + 0.686 * g + 0.168 * b);
      d[i + 2] = clampByte(0.272 * r + 0.534 * g + 0.131 * b);
    }
    return imageData;
  }

  function applyInvert(imageData) {
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = 255 - d[i];
      d[i + 1] = 255 - d[i + 1];
      d[i + 2] = 255 - d[i + 2];
    }
    return imageData;
  }

  function applyBrightness(imageData, amount) {
    const d = imageData.data;
    const delta = Number(amount) || 0;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = clampByte(d[i] + delta);
      d[i + 1] = clampByte(d[i + 1] + delta);
      d[i + 2] = clampByte(d[i + 2] + delta);
    }
    return imageData;
  }

  function applyContrast(imageData, amount) {
    const d = imageData.data;
    const a = Number(amount) || 0;

    const factor = (259 * (a + 255)) / (255 * (259 - a));
    for (let i = 0; i < d.length; i += 4) {
      d[i] = clampByte(factor * (d[i] - 128) + 128);
      d[i + 1] = clampByte(factor * (d[i + 1] - 128) + 128);
      d[i + 2] = clampByte(factor * (d[i + 2] - 128) + 128);
    }
    return imageData;
  }

  function applyVintage(imageData) {
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];

      d[i] = clampByte(0.5 * r + 0.4 * g + 0.1 * b + 20);
      d[i + 1] = clampByte(0.3 * r + 0.5 * g + 0.2 * b + 10);
      d[i + 2] = clampByte(0.2 * r + 0.3 * g + 0.5 * b);
    }
    return imageData;
  }

  function applyCold(imageData) {
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = clampByte(d[i] * 0.9);
      d[i + 1] = clampByte(d[i + 1] * 1.0);
      d[i + 2] = clampByte(d[i + 2] * 1.3);
    }
    return imageData;
  }

  function applyWarm(imageData) {
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = clampByte(d[i] * 1.3);
      d[i + 1] = clampByte(d[i + 1] * 1.1);
      d[i + 2] = clampByte(d[i + 2] * 0.8);
    }
    return imageData;
  }

  function applyDramatic(imageData) {
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = clampByte((d[i] - 128) * 1.5 + 128);
      d[i + 1] = clampByte((d[i + 1] - 128) * 1.2 + 128);
      d[i + 2] = clampByte((d[i + 2] - 128) * 0.8 + 128);
    }
    return imageData;
  }

  function applyBlackWhite(imageData) {
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];
      const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const bw = gray > 128 ? 255 : 0;
      d[i] = d[i + 1] = d[i + 2] = bw;
    }
    return imageData;
  }

  function applySunset(imageData) {
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];

      d[i] = clampByte(r * 1.2 + 30);
      d[i + 1] = clampByte(g * 0.8 + 20);
      d[i + 2] = clampByte(b * 0.5 - 20);
    }
    return imageData;
  }

  function applyOcean(imageData) {
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];

      d[i] = clampByte(r * 0.7);
      d[i + 1] = clampByte(g * 0.9 + 10);
      d[i + 2] = clampByte(b * 1.4 + 20);
    }
    return imageData;
  }

  function applyForest(imageData) {
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];

      d[i] = clampByte(r * 0.8);
      d[i + 1] = clampByte(g * 1.3 + 15);
      d[i + 2] = clampByte(b * 0.6);
    }
    return imageData;
  }

  function applyPolaroid(imageData) {
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];

      d[i] = clampByte(1.438 * r - 0.122 * g - 0.016 * b + 10);
      d[i + 1] = clampByte(-0.062 * r + 1.378 * g - 0.016 * b + 5);
      d[i + 2] = clampByte(-0.062 * r - 0.122 * g + 1.383 * b - 5);
    }
    return imageData;
  }
    function boxBlur(imageData, radius) {
    const r = Math.max(0, Math.min(20, Number(radius) || 0));
    if (r === 0) return imageData;

    const { width: w, height: h, data: src } = imageData;
    const dst = new Uint8ClampedArray(src.length);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let rr = 0;
        let gg = 0;
        let bb = 0;
        let aa = 0;
        let count = 0;

        const yMin = Math.max(0, y - r);
        const yMax = Math.min(h - 1, y + r);
        const xMin = Math.max(0, x - r);
        const xMax = Math.min(w - 1, x + r);

        for (let yy = yMin; yy <= yMax; yy++) {
          const row = yy * w;
          for (let xx = xMin; xx <= xMax; xx++) {
            const idx = (row + xx) * 4;
            rr += src[idx];
            gg += src[idx + 1];
            bb += src[idx + 2];
            aa += src[idx + 3];
            count++;
          }
        }

        const o = (y * w + x) * 4;
        dst[o] = rr / count;
        dst[o + 1] = gg / count;
        dst[o + 2] = bb / count;
        dst[o + 3] = aa / count;
      }
    }

    return new ImageData(dst, w, h);
  }

  function render() {
    if (!originalImageData) return;

    updateControlVisibility();

    const filter = filterSelect.value;
    let img = copyImageData(originalImageData);

    if (filter === 'grayscale') {
      img = applyGrayscale(img);
    } else if (filter === 'sepia') {
      img = applySepia(img);
    } else if (filter === 'invert') {
      img = applyInvert(img);
    } else if (filter === 'brightness') {
      img = applyBrightness(img, brightnessRange.value);
    } else if (filter === 'contrast') {
      img = applyContrast(img, contrastRange.value);
    } else if (filter === 'blur') {
      img = boxBlur(img, blurRange.value);
    } else if (filter === 'vintage') {
      img = applyVintage(img);
    } else if (filter === 'cold') {
      img = applyCold(img);
    } else if (filter === 'warm') {
      img = applyWarm(img);
    } else if (filter === 'dramatic') {
      img = applyDramatic(img);
    } else if (filter === 'blackwhite') {
      img = applyBlackWhite(img);
    } else if (filter === 'sunset') {
      img = applySunset(img);
    } else if (filter === 'ocean') {
      img = applyOcean(img);
    } else if (filter === 'forest') {
      img = applyForest(img);
    } else if (filter === 'polaroid') {
      img = applyPolaroid(img);
    }

    ctx.putImageData(img, 0, 0);
  }

  function setHintVisible(visible) {
    hint.style.display = visible ? 'grid' : 'none';
  }

  async function loadFile(file) {
    if (!file) return;

    const url = URL.createObjectURL(file);
    const img = new Image();

    try {
      await new Promise((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = url;
      });

      drawImageToCanvas(img);
      setHintVisible(false);

      resetControls();
      setControlsEnabled(true);
      render();
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function download() {
    if (!originalImageData) return;

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'filtered-image.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    loadFile(file).catch((err) => {
      console.error(err);
      setControlsEnabled(false);
      setHintVisible(true);
    });
  });

  filterSelect.addEventListener('change', () => {
    render();
  });

  blurRange.addEventListener('input', () => {
    blurValue.textContent = blurRange.value;
    render();
  });

  brightnessRange.addEventListener('input', () => {
    brightnessValue.textContent = brightnessRange.value;
    render();
  });

  contrastRange.addEventListener('input', () => {
    contrastValue.textContent = contrastRange.value;
    render();
  });

  resetBtn.addEventListener('click', () => {
    if (!originalImageData) return;
    resetControls();
    ctx.putImageData(copyImageData(originalImageData), 0, 0);
  });

  downloadBtn.addEventListener('click', () => {
    download();
  });

  setControlsEnabled(false);
  setHintVisible(true);
})();

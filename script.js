(() => {
  const fileInput = document.getElementById('fileInput');
  const filterSelect = document.getElementById('filterSelect');
  const shapeSelect = document.getElementById('shapeSelect');
  const formatSelect = document.getElementById('formatSelect');
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

  const qualityControl = document.getElementById('qualityControl');
  const qualityInput = document.getElementById('qualityInput');

  const flipHorizontalBtn = document.getElementById('flipHorizontalBtn');
  const flipVerticalBtn = document.getElementById('flipVerticalBtn');
  const rotateLeftBtn = document.getElementById('rotateLeftBtn');
  const rotateRightBtn = document.getElementById('rotateRightBtn');

  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  let originalImageData = null;
  let originalWidth = 0;
  let originalHeight = 0;

  function clampByte(v) {
    return Math.max(0, Math.min(255, v));
  }

  function setControlsEnabled(enabled) {
    filterSelect.disabled = !enabled;
    shapeSelect.disabled = !enabled;
    formatSelect.disabled = !enabled;
    qualityInput.disabled = !enabled;
    blurRange.disabled = !enabled;
    brightnessRange.disabled = !enabled;
    contrastRange.disabled = !enabled;
    flipHorizontalBtn.disabled = !enabled;
    flipVerticalBtn.disabled = !enabled;
    rotateLeftBtn.disabled = !enabled;
    rotateRightBtn.disabled = !enabled;
    downloadBtn.disabled = !enabled;
    resetBtn.disabled = !enabled;
  }

  function resetControls() {
    filterSelect.value = 'none';
    shapeSelect.value = 'none';
    formatSelect.value = 'png';

    qualityInput.value = '90';

    blurRange.value = '0';
    blurValue.textContent = '0';

    brightnessRange.value = '0';
    brightnessValue.textContent = '0';

    contrastRange.value = '0';
    contrastValue.textContent = '0';

    updateControlVisibility();
  }

  function updateControlVisibility() {
    const filter = filterSelect.value;
    const format = formatSelect.value;

    blurControl.hidden = filter !== 'blur';
    brightnessControl.hidden = filter !== 'brightness';
    contrastControl.hidden = filter !== 'contrast';
    
    // Show quality control for JPEG and WebP formats
    qualityControl.hidden = (format !== 'jpeg' && format !== 'webp');
    
    console.log('Format:', format, 'Quality Control Hidden:', qualityControl.hidden); // Debug log
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

  function applyCircle(imageData) {
    const { width, height, data } = imageData;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.45; // Slightly smaller for better fit
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        if (distance > radius) {
          const index = (y * width + x) * 4;
          data[index] = 0;
          data[index + 1] = 0;
          data[index + 2] = 0;
          data[index + 3] = 0;
        }
      }
    }
    return imageData;
  }

  function applyRounded(imageData) {
    const { width, height, data } = imageData;
    const cornerRadius = Math.min(width, height) * 0.15;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let inCorner = false;
        
        // Top-left corner
        if (x < cornerRadius && y < cornerRadius) {
          const distance = Math.sqrt(Math.pow(x - cornerRadius, 2) + Math.pow(y - cornerRadius, 2));
          inCorner = distance > cornerRadius;
        }
        // Top-right corner
        else if (x > width - cornerRadius && y < cornerRadius) {
          const distance = Math.sqrt(Math.pow(x - (width - cornerRadius), 2) + Math.pow(y - cornerRadius, 2));
          inCorner = distance > cornerRadius;
        }
        // Bottom-left corner
        else if (x < cornerRadius && y > height - cornerRadius) {
          const distance = Math.sqrt(Math.pow(x - cornerRadius, 2) + Math.pow(y - (height - cornerRadius), 2));
          inCorner = distance > cornerRadius;
        }
        // Bottom-right corner
        else if (x > width - cornerRadius && y > height - cornerRadius) {
          const distance = Math.sqrt(Math.pow(x - (width - cornerRadius), 2) + Math.pow(y - (height - cornerRadius), 2));
          inCorner = distance > cornerRadius;
        }
        
        if (inCorner) {
          const index = (y * width + x) * 4;
          data[index] = 0;
          data[index + 1] = 0;
          data[index + 2] = 0;
          data[index + 3] = 0;
        }
      }
    }
    return imageData;
  }

  function applyStar(imageData) {
    const { width, height, data } = imageData;
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(width, height) * 0.45; // Centered and properly sized
    const innerRadius = outerRadius * 0.4;
    const points = 5;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const angle = Math.atan2(y - centerY, x - centerX);
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        
        const normalizedAngle = (angle + Math.PI * 2) % (Math.PI * 2);
        const pointAngle = (normalizedAngle / (Math.PI * 2)) * points * 2;
        const pointIndex = Math.floor(pointAngle);
        
        const isOuter = pointIndex % 2 === 0;
        const threshold = isOuter ? outerRadius : innerRadius;
        
        if (distance > threshold) {
          const index = (y * width + x) * 4;
          data[index] = 0;
          data[index + 1] = 0;
          data[index + 2] = 0;
          data[index + 3] = 0;
        }
      }
    }
    return imageData;
  }

  function applyHeart(imageData) {
    const { width, height, data } = imageData;
    const centerX = width / 2;
    const centerY = height / 2;
    const size = Math.min(width, height) * 0.35; // Smaller and centered
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = (x - centerX) / size;
        const ny = (y - centerY + size * 0.2) / size; // Adjusted for centering
        
        // Heart equation: (x² + y² - 1)³ - x²y³ ≤ 0
        const heart = Math.pow(nx * nx + ny * ny - 1, 3) - nx * nx * ny * ny * ny;
        
        if (heart > 0) {
          const index = (y * width + x) * 4;
          data[index] = 0;
          data[index + 1] = 0;
          data[index + 2] = 0;
          data[index + 3] = 0;
        }
      }
    }
    return imageData;
  }

  function applyHexagon(imageData) {
    const { width, height, data } = imageData;
    const centerX = width / 2;
    const centerY = height / 2;
    const size = Math.min(width, height) * 0.45; // Centered and properly sized
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = Math.abs(x - centerX);
        const ny = Math.abs(y - centerY);
        
        if (nx > size * 0.866 || ny > size || (nx > size * 0.5 && ny > size * 0.866)) {
          const index = (y * width + x) * 4;
          data[index] = 0;
          data[index + 1] = 0;
          data[index + 2] = 0;
          data[index + 3] = 0;
        }
      }
    }
    return imageData;
  }

  function applyDiamond(imageData) {
    const { width, height, data } = imageData;
    const centerX = width / 2;
    const centerY = height / 2;
    const size = Math.min(width, height) * 0.45; // Centered and properly sized
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = Math.abs(x - centerX);
        const ny = Math.abs(y - centerY);
        
        if (nx / size + ny / size > 1) {
          const index = (y * width + x) * 4;
          data[index] = 0;
          data[index + 1] = 0;
          data[index + 2] = 0;
          data[index + 3] = 0;
        }
      }
    }
    return imageData;
  }

  function applyTriangle(imageData) {
    const { width, height, data } = imageData;
    const centerX = width / 2;
    const centerY = height / 2;
    const size = Math.min(width, height) * 0.4; // Centered and properly sized
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = (x - centerX) / size;
        const ny = (y - centerY) / size;
        
        if (ny < -0.3 || ny > 0.5 || Math.abs(nx) > (0.5 - ny - 0.2)) {
          const index = (y * width + x) * 4;
          data[index] = 0;
          data[index + 1] = 0;
          data[index + 2] = 0;
          data[index + 3] = 0;
        }
      }
    }
    return imageData;
  }

  function applyPentagon(imageData) {
    const { width, height, data } = imageData;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.45; // Centered and properly sized
    const sides = 5;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const angle = Math.atan2(y - centerY, x - centerX);
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        
        let maxRadius = radius;
        for (let i = 0; i < sides; i++) {
          const sideAngle = (i * 2 * Math.PI) / sides - Math.PI / 2;
          const nextAngle = ((i + 1) * 2 * Math.PI) / sides - Math.PI / 2;
          
          const x1 = Math.cos(sideAngle) * radius;
          const y1 = Math.sin(sideAngle) * radius;
          const x2 = Math.cos(nextAngle) * radius;
          const y2 = Math.sin(nextAngle) * radius;
          
          const distToLine = Math.abs((y2 - y1) * (x - centerX) - (x2 - x1) * (y - centerY) + x2 * y1 - y2 * x1) / 
                           Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));
          
          maxRadius = Math.min(maxRadius, distToLine);
        }
        
        if (distance > maxRadius) {
          const index = (y * width + x) * 4;
          data[index] = 0;
          data[index + 1] = 0;
          data[index + 2] = 0;
          data[index + 3] = 0;
        }
      }
    }
    return imageData;
  }

  function applyCross(imageData) {
    const { width, height, data } = imageData;
    const centerX = width / 2;
    const centerY = height / 2;
    const thickness = Math.min(width, height) * 0.15; // Centered and properly sized
    const armLength = Math.min(width, height) * 0.35;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = Math.abs(x - centerX);
        const ny = Math.abs(y - centerY);
        
        const inHorizontal = ny <= thickness / 2 && nx <= armLength;
        const inVertical = nx <= thickness / 2 && ny <= armLength;
        
        if (!inHorizontal && !inVertical) {
          const index = (y * width + x) * 4;
          data[index] = 0;
          data[index + 1] = 0;
          data[index + 2] = 0;
          data[index + 3] = 0;
        }
      }
    }
    return imageData;
  }

  function applyEllipse(imageData) {
    const { width, height, data } = imageData;
    const centerX = width / 2;
    const centerY = height / 2;
    const radiusX = width * 0.45; // Centered and properly sized
    const radiusY = height * 0.45;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = (x - centerX) / radiusX;
        const ny = (y - centerY) / radiusY;
        
        if (nx * nx + ny * ny > 1) {
          const index = (y * width + x) * 4;
          data[index] = 0;
          data[index + 1] = 0;
          data[index + 2] = 0;
          data[index + 3] = 0;
        }
      }
    }
    return imageData;
  }

  function flipHorizontal(imageData) {
    const { width, height, data } = imageData;
    const flipped = new Uint8ClampedArray(data.length);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIndex = (y * width + x) * 4;
        const destX = width - 1 - x;
        const destIndex = (y * width + destX) * 4;
        
        flipped[destIndex] = data[srcIndex];
        flipped[destIndex + 1] = data[srcIndex + 1];
        flipped[destIndex + 2] = data[srcIndex + 2];
        flipped[destIndex + 3] = data[srcIndex + 3];
      }
    }
    
    return new ImageData(flipped, width, height);
  }

  function flipVertical(imageData) {
    const { width, height, data } = imageData;
    const flipped = new Uint8ClampedArray(data.length);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIndex = (y * width + x) * 4;
        const destY = height - 1 - y;
        const destIndex = (destY * width + x) * 4;
        
        flipped[destIndex] = data[srcIndex];
        flipped[destIndex + 1] = data[srcIndex + 1];
        flipped[destIndex + 2] = data[srcIndex + 2];
        flipped[destIndex + 3] = data[srcIndex + 3];
      }
    }
    
    return new ImageData(flipped, width, height);
  }

  function rotate90(imageData, clockwise = true) {
    const { width, height, data } = imageData;
    const newWidth = height;
    const newHeight = width;
    const rotated = new Uint8ClampedArray(newWidth * newHeight * 4);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIndex = (y * width + x) * 4;
        
        let newX, newY;
        if (clockwise) {
          newX = height - 1 - y;
          newY = x;
        } else {
          newX = y;
          newY = width - 1 - x;
        }
        
        const destIndex = (newY * newWidth + newX) * 4;
        
        rotated[destIndex] = data[srcIndex];
        rotated[destIndex + 1] = data[srcIndex + 1];
        rotated[destIndex + 2] = data[srcIndex + 2];
        rotated[destIndex + 3] = data[srcIndex + 3];
      }
    }
    
    return new ImageData(rotated, newWidth, newHeight);
  }
    function render() {
    console.log('Render called');
    if (!originalImageData) {
      console.log('No originalImageData in render');
      return;
    }

    updateControlVisibility();

    const filter = filterSelect.value;
    const shape = shapeSelect.value;
    console.log('Current canvas size:', canvas.width, 'x', canvas.height);
    console.log('Image data size:', originalImageData.width, 'x', originalImageData.height);
    
    let img = copyImageData(originalImageData);

    // Apply filter first
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

    // Apply shape
    if (shape === 'circle') {
      img = applyCircle(img);
    } else if (shape === 'rounded') {
      img = applyRounded(img);
    } else if (shape === 'star') {
      img = applyStar(img);
    } else if (shape === 'heart') {
      img = applyHeart(img);
    } else if (shape === 'hexagon') {
      img = applyHexagon(img);
    } else if (shape === 'diamond') {
      img = applyDiamond(img);
    } else if (shape === 'triangle') {
      img = applyTriangle(img);
    } else if (shape === 'pentagon') {
      img = applyPentagon(img);
    } else if (shape === 'cross') {
      img = applyCross(img);
    } else if (shape === 'ellipse') {
      img = applyEllipse(img);
    }

    console.log('Final image size:', img.width, 'x', img.height);
    
    // Update canvas size if needed and put image data
    if (canvas.width !== img.width || canvas.height !== img.height) {
      console.log('Resizing canvas from', canvas.width, 'x', canvas.height, 'to', img.width, 'x', img.height);
      canvas.width = img.width;
      canvas.height = img.height;
    }
    
    ctx.putImageData(img, 0, 0);
    console.log('Render completed');
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

    const format = formatSelect.value;
    const quality = qualityInput.value / 100; // Convert to 0-1 range
    let mimeType, extension;

    switch (format) {
      case 'jpeg':
        mimeType = 'image/jpeg';
        extension = 'jpg';
        break;
      case 'webp':
        mimeType = 'image/webp';
        extension = 'webp';
        break;
      case 'bmp':
        mimeType = 'image/bmp';
        extension = 'bmp';
        break;
      default:
        mimeType = 'image/png';
        extension = 'png';
    }

    const a = document.createElement('a');
    
    if (format === 'jpeg' || format === 'webp') {
      a.href = canvas.toDataURL(mimeType, quality);
    } else {
      a.href = canvas.toDataURL(mimeType);
    }
    
    a.download = `filtered-image.${extension}`;
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

  shapeSelect.addEventListener('change', () => {
    render();
  });

  flipHorizontalBtn.addEventListener('click', () => {
    console.log('Flip Horizontal clicked');
    if (!originalImageData) {
      console.log('No original image data');
      return;
    }
    console.log('Before flip:', originalImageData.width, 'x', originalImageData.height);
    originalImageData = flipHorizontal(originalImageData);
    console.log('After flip:', originalImageData.width, 'x', originalImageData.height);
    render();
  });

  flipVerticalBtn.addEventListener('click', () => {
    console.log('Flip Vertical clicked');
    if (!originalImageData) {
      console.log('No original image data');
      return;
    }
    console.log('Before flip:', originalImageData.width, 'x', originalImageData.height);
    originalImageData = flipVertical(originalImageData);
    console.log('After flip:', originalImageData.width, 'x', originalImageData.height);
    render();
  });

  rotateLeftBtn.addEventListener('click', () => {
    console.log('Rotate Left clicked');
    if (!originalImageData) {
      console.log('No original image data');
      return;
    }
    console.log('Before rotate:', originalImageData.width, 'x', originalImageData.height);
    originalImageData = rotate90(originalImageData, false);
    console.log('After rotate:', originalImageData.width, 'x', originalImageData.height);
    render();
  });

  rotateRightBtn.addEventListener('click', () => {
    console.log('Rotate Right clicked');
    if (!originalImageData) {
      console.log('No original image data');
      return;
    }
    console.log('Before rotate:', originalImageData.width, 'x', originalImageData.height);
    originalImageData = rotate90(originalImageData, true);
    console.log('After rotate:', originalImageData.width, 'x', originalImageData.height);
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

  // Feature explanation modal functionality
  const featureModal = document.getElementById('featureModal');
  const featureModalLabel = document.getElementById('featureModalLabel');
  const featureModalBody = document.getElementById('featureModalBody');
  const modalClose = featureModal.querySelector('.btn-close, .btn-secondary');

  // Simple modal functions
  function showModal() {
    featureModal.style.display = 'block';
    featureModal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function hideModal() {
    featureModal.style.display = 'none';
    featureModal.classList.remove('show');
    document.body.style.overflow = '';
  }

  // Close modal events
  modalClose.addEventListener('click', hideModal);
  featureModal.addEventListener('click', (e) => {
    if (e.target === featureModal) {
      hideModal();
    }
  });

  // Escape key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && featureModal.classList.contains('show')) {
      hideModal();
    }
  });

  const featureExplanations = {
    filters: {
      title: '🎨 All Image Filters',
      content: `
        <h6>Professional Image Filters</h6>
        <p>Our image editor includes <strong>15+ professional filters</strong> to transform your photos:</p>
        <ul>
          <li><strong>Grayscale:</strong> Convert to classic black and white</li>
          <li><strong>Sepia:</strong> Warm vintage tone effect</li>
          <li><strong>Invert:</strong> Reverse all colors for artistic effect</li>
          <li><strong>Blur:</strong> Soften focus with adjustable intensity</li>
          <li><strong>Brightness:</strong> Lighten or darken your images</li>
          <li><strong>Contrast:</strong> Enhance difference between light and dark areas</li>
          <li><strong>Vintage:</strong> Classic retro photo appearance</li>
          <li><strong>Cold/Warm:</strong> Adjust color temperature</li>
          <li><strong>Dramatic:</strong> High contrast artistic effect</li>
          <li><strong>Black & White:</strong> Pure monochrome conversion</li>
          <li><strong>Sunset/Ocean/Forest:</strong> Themed color grading</li>
          <li><strong>Polaroid:</strong> Instant camera style effect</li>
        </ul>
        <p><strong>Perfect for:</strong> Social media posts, artistic projects, photo enhancement</p>
      `
    },
    shapes: {
      title: '✂️ Shape Masks',
      content: `
        <h6>Crop Images into Shapes</h6>
        <p>Transform your photos into <strong>11 different shapes</strong> for creative designs:</p>
        <ul>
          <li><strong>Circle:</strong> Perfect for profile pictures</li>
          <li><strong>Rounded:</strong> Soft cornered rectangles</li>
          <li><strong>Star:</strong> Eye-catching five-pointed star</li>
          <li><strong>Heart:</strong> Romantic heart shape</li>
          <li><strong>Hexagon:</strong> Modern six-sided shape</li>
          <li><strong>Diamond:</strong> Elegant diamond cutout</li>
          <li><strong>Triangle:</strong> Dynamic triangular shape</li>
          <li><strong>Pentagon:</strong> Five-sided geometric shape</li>
          <li><strong>Cross:</strong> Religious or decorative design</li>
          <li><strong>Ellipse:</strong> Stretched oval shape</li>
        </ul>
        <p><strong>Use cases:</strong> Logos, avatars, badges, decorative elements</p>
      `
    },
    transform: {
      title: '🔄 Transform Tools',
      content: `
        <h6>Image Transformation Tools</h6>
        <p><strong>Flip and rotate</strong> your images with precision controls:</p>
        <ul>
          <li><strong>Flip Horizontal:</strong> Mirror image left to right</li>
          <li><strong>Flip Vertical:</strong> Mirror image top to bottom</li>
          <li><strong>Rotate Left:</strong> 90-degree counter-clockwise rotation</li>
          <li><strong>Rotate Right:</strong> 90-degree clockwise rotation</li>
        </ul>
        <p><strong>Applications:</strong></p>
        <ul>
          <li>Correct photo orientation</li>
          <li>Create mirror effects</li>
          <li>Adjust scanned images</li>
          <li>Design symmetrical patterns</li>
        </ul>
        <p><strong>Tip:</strong> Combine multiple transformations for unique effects!</p>
      `
    },
    formats: {
      title: '💾 Format Options',
      content: `
        <h6>Output Format Guide</h6>
        <p>Choose the <strong>best format</strong> for your specific needs:</p>
        <div class="row">
          <div class="col-md-6">
            <h6>🖼️ PNG</h6>
            <ul>
              <li>Best image quality</li>
              <li>Supports transparency</li>
              <li>Lossless compression</li>
              <li>Larger file sizes</li>
            </ul>
            <p><strong>Best for:</strong> Logos, graphics, images with transparency</p>
          </div>
          <div class="col-md-6">
            <h6>📄 JPEG</h6>
            <ul>
              <li>Smaller file sizes</li>
              <li>No transparency support</li>
              <li>Adjustable quality</li>
              <li>Good compression</li>
            </ul>
            <p><strong>Best for:</strong> Photos, web images, email attachments</p>
          </div>
          <div class="col-md-6">
            <h6>🌐 WebP</h6>
            <ul>
              <li>Modern web format</li>
              <li>Best compression ratio</li>
              <li>Supports transparency</li>
              <li>Smaller than PNG/JPEG</li>
            </ul>
            <p><strong>Best for:</strong> Modern websites, faster loading</p>
          </div>
          <div class="col-md-6">
            <h6>🎨 BMP</h6>
            <ul>
              <li>Uncompressed quality</li>
              <li>No quality loss</li>
              <li>Very large files</li>
              <li>Universal compatibility</li>
            </ul>
            <p><strong>Best for:</strong> Professional printing, archival</p>
          </div>
        </div>
      `
    },
    vintage: {
      title: '📷 Vintage Filter',
      content: `
        <h6>Vintage Photo Effect</h6>
        <p>Transform your modern photos into <strong>timeless vintage images</strong> with warm tones and classic film characteristics.</p>
        <h6>What it does:</h6>
        <ul>
          <li>Adds warm color grading</li>
          <li>Creates film-like color shifts</li>
          <li>Subtle vignetting effect</li>
          <li>Reduces digital harshness</li>
        </ul>
        <p><strong>Perfect for:</strong> Instagram posts, retro designs, family photos, artistic projects</p>
      `
    },
    blackwhite: {
      title: '⚫ Black & White Filter',
      content: `
        <h6>Professional Black & White Conversion</h6>
        <p>Convert your color photos to <strong>stunning monochrome</strong> with intelligent contrast preservation.</p>
        <h6>Features:</h6>
        <ul>
          <li>Smart tonal range preservation</li>
          <li>Enhanced contrast for impact</li>
          <li>Professional darkroom look</li>
          <li>Better than simple grayscale</li>
        </ul>
        <p><strong>Great for:</strong> Portraits, architecture, artistic photography, dramatic effects</p>
      `
    },
    blur: {
      title: '💫 Blur Effect',
      content: `
        <h6>Adjustable Blur Effect</h6>
        <p>Add <strong>professional blur effects</strong> with 9 intensity levels for creative control.</p>
        <h6>Blur Levels:</h6>
        <ul>
          <li><strong>Levels 1-3:</strong> Subtle softening</li>
          <li><strong>Levels 4-6:</strong> Moderate blur</li>
          <li><strong>Levels 7-9:</strong> Heavy blur effect</li>
        </ul>
        <p><strong>Applications:</strong></p>
        <ul>
          <li>Background softening</li>
          <li>Dreamy effects</li>
          <li>Privacy protection</li>
          <li>Artistic focus</li>
        </ul>
      `
    },
    brightness: {
      title: '☀️ Brightness Control',
      content: `
        <h6>Brightness Adjustment Tool</h6>
        <p>Fine-tune your image brightness with <strong>200 levels of control</strong> (-100 to +100).</p>
        <h6>Usage:</h6>
        <ul>
          <li><strong>Negative values:</strong> Darken underexposed photos</li>
          <li><strong>Positive values:</strong> Brighten dark images</li>
          <li><strong>Range:</strong> -100 (completely dark) to +100 (completely bright)</li>
        </ul>
        <p><strong>Perfect for:</strong> Fixing lighting issues, enhancing mood, correcting exposure</p>
      `
    },
    contrast: {
      title: '◐ Contrast Adjustment',
      content: `
        <h6>Contrast Enhancement Tool</h6>
        <p>Adjust image contrast with <strong>200 precision levels</strong> for professional results.</p>
        <h6>How it works:</h6>
        <ul>
          <li><strong>Increase contrast:</strong> Makes dark areas darker, light areas brighter</li>
          <li><strong>Decrease contrast:</strong> Flattens tonal range for softer look</li>
          <li><strong>Range:</strong> -100 (flat) to +100 (high contrast)</li>
        </ul>
        <p><strong>Ideal for:</strong> Making photos pop, fixing flat images, creating dramatic effects</p>
      `
    }
  };

  // Add click handlers to feature links
  document.querySelectorAll('.feature-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const feature = link.getAttribute('data-feature');
      const explanation = featureExplanations[feature];
      
      if (explanation) {
        featureModalLabel.textContent = explanation.title;
        featureModalBody.innerHTML = explanation.content;
        showModal();
      }
    });
  });

  setControlsEnabled(false);
  setHintVisible(true);
})();

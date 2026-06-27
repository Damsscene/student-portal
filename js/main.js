/* ==========================================================================
   MAIN JAVASCRIPT (THEMING, SIDEBAR NAV, IMAGE CANVAS PROCESSING)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initThemeCustomizer();
  initPhotoUpscaler();
});

/* ==========================================================================
   1. NAVIGATION & RESPONSIVE MOBILE MENU
   ========================================================================== */
function initNavigation() {
  const burger = document.querySelector('.burger');
  const navLinks = document.querySelector('.nav-links');
  const links = document.querySelectorAll('.nav-links a');

  if (burger && navLinks) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('active');
      navLinks.classList.toggle('active');
    });

    // Close menu when clicking links
    links.forEach(link => {
      link.addEventListener('click', () => {
        burger.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });

    // Close mobile menu on click outside
    document.addEventListener('click', (e) => {
      if (!burger.contains(e.target) && !navLinks.contains(e.target)) {
        burger.classList.remove('active');
        navLinks.classList.remove('active');
      }
    });
  }

  // Highlight active link based on current path
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  links.forEach(link => {
    const linkPath = link.getAttribute('href');
    if (linkPath === currentPath) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/* ==========================================================================
   2. THEME PALETTE CUSTOMIZER
   ========================================================================== */
function initThemeCustomizer() {
  // Inject Customizer HTML structure dynamically if it doesn't exist
  if (!document.querySelector('.customizer-toggle')) {
    const customizerHTML = `
      <button class="customizer-toggle" title="Customize Colors" aria-label="Customize Colors">
        <svg viewBox="0 0 24 24"><path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.47,5.34 14.86,5.08L14.47,2.42C14.43,2.18 14.22,2 13.97,2H9.97C9.72,2 9.51,2.18 9.47,2.42L9.08,5.08C8.47,5.34 7.9,5.66 7.38,6.05L4.89,5.05C4.67,4.96 4.4,5.05 4.27,5.27L2.27,8.73C2.15,8.95 2.2,9.22 2.39,9.37L4.5,11C4.46,11.34 4.44,11.67 4.44,12C4.44,12.33 4.46,12.65 4.5,12.97L2.39,14.63C2.2,14.78 2.15,15.05 2.27,15.27L4.27,18.73C4.4,18.95 4.67,19.04 4.89,18.95L7.38,17.95C7.9,18.34 8.47,18.66 9.08,18.92L9.47,21.58C9.51,21.82 9.72,22 9.97,22H13.97C14.22,22 14.43,21.82 14.47,21.58L14.86,18.92C15.47,18.66 16.04,18.34 16.56,17.95L19.05,18.95C19.27,19.04 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/></svg>
      </button>
      <div class="customizer-panel">
        <div class="customizer-header">Color Customizer</div>
        
        <div class="customizer-section">
          <div class="customizer-section-title">Theme Preset</div>
          <div class="preset-colors-row">
            <button class="color-preset-btn active" data-preset="obsidian" style="background: #080c14; border: 1px solid #6366f1;" title="Obsidian Dark"></button>
            <button class="color-preset-btn" data-preset="teal" style="background: #040d12; border: 1px solid #14b8a6;" title="Ocean Teal"></button>
            <button class="color-preset-btn" data-preset="coral" style="background: #0f0a0a; border: 1px solid #f43f5e;" title="Sunset Coral"></button>
            <button class="color-preset-btn" data-preset="light" style="background: #f1f5f9; border: 1px solid #4f46e5;" title="Crystal Light"></button>
          </div>
        </div>

        <div class="customizer-section">
          <div class="customizer-section-title">Color Tuning</div>
          <div class="color-picker-row">
            <div class="color-picker-item">
              <label>Background</label>
              <div class="color-picker-input-wrapper">
                <input type="color" class="color-input-wheel" id="picker-bg" value="#080c14">
              </div>
            </div>
            <div class="color-picker-item">
              <label>Text</label>
              <div class="color-picker-input-wrapper">
                <input type="color" class="color-input-wheel" id="picker-text" value="#f8fafc">
              </div>
            </div>
            <div class="color-picker-item">
              <label>Primary</label>
              <div class="color-picker-input-wrapper">
                <input type="color" class="color-input-wheel" id="picker-accent" value="#6366f1">
              </div>
            </div>
            <div class="color-picker-item">
              <label>Secondary</label>
              <div class="color-picker-input-wrapper">
                <input type="color" class="color-input-wheel" id="picker-secondary" value="#a855f7">
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', customizerHTML);
  }

  const toggle = document.querySelector('.customizer-toggle');
  const panel = document.querySelector('.customizer-panel');
  const presets = document.querySelectorAll('.color-preset-btn');

  const bgPicker = document.getElementById('picker-bg');
  const textPicker = document.getElementById('picker-text');
  const accentPicker = document.getElementById('picker-accent');
  const secPicker = document.getElementById('picker-secondary');

  // Toggle Customizer Panel
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && !toggle.contains(e.target)) {
      panel.classList.remove('active');
    }
  });

  // Presets Mapping
  const presetConfig = {
    obsidian: {
      theme: 'dark',
      bg: '#080c14',
      text: '#f8fafc',
      accent: '#6366f1',
      sec: '#a855f7',
      card: 'rgba(15, 21, 36, 0.6)',
      border: 'rgba(255, 255, 255, 0.08)',
      input: 'rgba(15, 21, 36, 0.8)'
    },
    teal: {
      theme: 'dark',
      bg: '#040d12',
      text: '#f1f5f9',
      accent: '#14b8a6',
      sec: '#06b6d4',
      card: 'rgba(20, 30, 25, 0.65)',
      border: 'rgba(20, 184, 166, 0.12)',
      input: 'rgba(10, 15, 12, 0.8)'
    },
    coral: {
      theme: 'dark',
      bg: '#0f0a0a',
      text: '#fdf4f5',
      accent: '#f43f5e',
      sec: '#fb7185',
      card: 'rgba(30, 15, 15, 0.55)',
      border: 'rgba(244, 63, 94, 0.15)',
      input: 'rgba(15, 10, 10, 0.8)'
    },
    light: {
      theme: 'light',
      bg: '#f1f5f9',
      text: '#0f172a',
      accent: '#4f46e5',
      sec: '#7c3aed',
      card: 'rgba(255, 255, 255, 0.65)',
      border: 'rgba(15, 23, 42, 0.08)',
      input: 'rgba(255, 255, 255, 0.8)'
    }
  };

  // Load Saved Palette
  let savedPalette = null;
  try {
    const stored = localStorage.getItem('custom-palette');
    if (stored) {
      savedPalette = JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error loading theme palette:', e);
  }

  if (savedPalette && typeof savedPalette === 'object') {
    applyPalette(savedPalette);
    updatePickersUI(savedPalette);
    setActivePreset(savedPalette.preset || 'custom');
  } else {
    // Apply obsidian as default
    applyPalette(presetConfig.obsidian);
  }

  // Preset button click
  presets.forEach(btn => {
    btn.addEventListener('click', () => {
      const presetKey = btn.getAttribute('data-preset');
      const config = presetConfig[presetKey];
      if (config) {
        config.preset = presetKey;
        applyPalette(config);
        updatePickersUI(config);
        setActivePreset(presetKey);
        localStorage.setItem('custom-palette', JSON.stringify(config));
      }
    });
  });

  // Color picker inputs changes
  [bgPicker, textPicker, accentPicker, secPicker].forEach(picker => {
    picker.addEventListener('input', () => {
      const config = {
        preset: 'custom',
        theme: bgPicker.value === '#f1f5f9' ? 'light' : 'dark', // crude light/dark detector
        bg: bgPicker.value,
        text: textPicker.value,
        accent: accentPicker.value,
        sec: secPicker.value,
        card: bgPicker.value === '#f1f5f9' ? 'rgba(255, 255, 255, 0.65)' : 'rgba(20, 25, 35, 0.6)',
        border: bgPicker.value === '#f1f5f9' ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.08)',
        input: bgPicker.value === '#f1f5f9' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(15, 20, 30, 0.8)'
      };
      applyPalette(config);
      setActivePreset('custom');
      localStorage.setItem('custom-palette', JSON.stringify(config));
    });
  });

  function applyPalette(config) {
    document.body.setAttribute('data-theme', config.theme);

    // Set custom CSS variables
    document.documentElement.style.setProperty('--bg-primary', config.bg);
    document.documentElement.style.setProperty('--text-primary', config.text);
    document.documentElement.style.setProperty('--accent-color', config.accent);
    document.documentElement.style.setProperty('--accent-secondary', config.sec);
    document.documentElement.style.setProperty('--card-bg', config.card);
    document.documentElement.style.setProperty('--card-border', config.border);
    document.documentElement.style.setProperty('--input-bg', config.input);
    document.documentElement.style.setProperty('--accent-glow', convertHexToRgba(config.accent, 0.3));
  }

  function updatePickersUI(config) {
    bgPicker.value = config.bg;
    textPicker.value = config.text;
    accentPicker.value = config.accent;
    secPicker.value = config.sec;
  }

  function setActivePreset(presetKey) {
    presets.forEach(btn => {
      if (btn.getAttribute('data-preset') === presetKey) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Convert Hex string to RGBA string for shadows
  function convertHexToRgba(hex, alpha) {
    let c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
      c = hex.substring(1).split('');
      if (c.length === 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      c = '0x' + c.join('');
      return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',')},${alpha})`;
    }
    return hex;
  }
}

/* ==========================================================================
   3. PHOTO UPLOADER & CANVAS EDGE-SHARPENING (UPSCALER)
   ========================================================================== */
function initPhotoUpscaler() {
  const uploadInput = document.getElementById('file-upload-input');
  const avatarPlaceholder = document.querySelector('.avatar-placeholder');
  const avatarImg = document.getElementById('avatar-preview-img');
  const upscaleBtn = document.getElementById('btn-upscale-photo');
  const canvas = document.getElementById('upscale-canvas');

  if (!uploadInput) return; // Only execute on pages containing this HTML

  // Load Saved Image if exists
  const savedAvatar = localStorage.getItem('user-avatar');
  if (savedAvatar) {
    avatarPlaceholder.style.display = 'none';
    avatarImg.style.display = 'block';
    avatarImg.src = savedAvatar;
    upscaleBtn.style.display = 'inline-block';
  }

  avatarPlaceholder.addEventListener('click', () => uploadInput.click());
  avatarImg.addEventListener('click', () => uploadInput.click());

  uploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      // 1. Validation Check: Size limit to 3MB
      const maxSizeBytes = 3 * 1024 * 1024; // 3MB
      if (file.size > maxSizeBytes) {
        alert("The selected file exceeds the 3MB size limit. Please upload a smaller image.");
        uploadInput.value = ""; // Reset file input
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          // 2. Web compression: Resize to max 800px width/height to protect localStorage quota
          const maxDim = 800;
          let width = img.width;
          let height = img.height;
          
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = width;
          tempCanvas.height = height;
          const tempCtx = tempCanvas.getContext('2d');
          tempCtx.drawImage(img, 0, 0, width, height);

          // Compress as JPEG with 0.8 quality (scales a 2.9MB file down to ~60KB-100KB)
          const compressedDataUrl = tempCanvas.toDataURL('image/jpeg', 0.8);

          avatarPlaceholder.style.display = 'none';
          avatarImg.style.display = 'block';
          avatarImg.src = compressedDataUrl;
          upscaleBtn.style.display = 'inline-block';
          upscaleBtn.innerText = 'Enhance & Upscale Photo';
          upscaleBtn.disabled = false;
          
          // Hide previous canvas if any
          canvas.style.display = 'none';
          
          // Save compressed upload in localStorage
          try {
            localStorage.setItem('user-avatar', compressedDataUrl);
          } catch (storageError) {
            console.error('Local storage full:', storageError);
          }
        };
      };
      reader.readAsDataURL(file);
    }
  });

  upscaleBtn.addEventListener('click', () => {
    if (!avatarImg.src) return;

    upscaleBtn.innerText = 'Upscaling...';
    upscaleBtn.disabled = true;

    // Simulate processing delay for visual feedback
    setTimeout(() => {
      try {
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = avatarImg.src;

        img.onload = () => {
          // 1. Double the resolution on the canvas (Simulated Upscaling)
          const targetWidth = img.naturalWidth * 2;
          const targetHeight = img.naturalHeight * 2;

          canvas.width = targetWidth;
          canvas.height = targetHeight;

          // Draw image expanded
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          // 2. Perform Image Sharpening using Convolution Matrix
          // Convolution Kernel for Sharpening:
          //  [  0, -1,  0 ]
          //  [ -1,  5, -1 ]
          //  [  0, -1,  0 ]
          const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
          const sharpenedData = applySharpenFilter(imgData, targetWidth, targetHeight);

          // Put sharpened image back to canvas
          ctx.putImageData(sharpenedData, 0, 0);

          // Replace main image preview source with high-res Canvas export
          const upscaledDataUrl = canvas.toDataURL('image/jpeg', 0.9);
          avatarImg.src = upscaledDataUrl;
          localStorage.setItem('user-avatar', upscaledDataUrl);

          // Alert notification
          alert('Photo successfully upscaled and details enhanced using Canvas Processing!');
          upscaleBtn.innerText = 'Upscaled ✓';
        }
      } catch (err) {
        console.error('Canvas processing failed:', err);
        alert('Could not upscale image due to browser cross-origin policy or dimensions.');
        upscaleBtn.innerText = 'Upscale Photo';
        upscaleBtn.disabled = false;
      }
    }, 1200);
  });

  // Convolution Sharpening Algorithm
  function applySharpenFilter(imageData, w, h) {
    const weights = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];
    const side = Math.round(Math.sqrt(weights.length));
    const halfSide = Math.floor(side / 2);
    const src = imageData.data;
    const canvasWidth = w;
    const canvasHeight = h;

    // Create new image data output array
    const output = document.createElement('canvas').getContext('2d').createImageData(w, h);
    const dst = output.data;

    // Run pixel loop
    for (let y = 0; y < canvasHeight; y++) {
      for (let x = 0; x < canvasWidth; x++) {
        const sy = y;
        const sx = x;
        const dstOff = (y * canvasWidth + x) * 4;

        let r = 0, g = 0, b = 0;

        // Matrix multiplication
        for (let cy = 0; cy < side; cy++) {
          for (let cx = 0; cx < side; cx++) {
            const scy = sy + cy - halfSide;
            const scx = sx + cx - halfSide;

            // Check boundary limits
            if (scy >= 0 && scy < canvasHeight && scx >= 0 && scx < canvasWidth) {
              const srcOff = (scy * canvasWidth + scx) * 4;
              const wt = weights[cy * side + cx];
              r += src[srcOff] * wt;
              g += src[srcOff + 1] * wt;
              b += src[srcOff + 2] * wt;
            }
          }
        }

        // Write outputs clamping between 0-255
        dst[dstOff] = Math.min(Math.max(r, 0), 255);
        dst[dstOff + 1] = Math.min(Math.max(g, 0), 255);
        dst[dstOff + 2] = Math.min(Math.max(b, 0), 255);
        dst[dstOff + 3] = src[dstOff + 3]; // Alpha remains same
      }
    }
    return output;
  }
}

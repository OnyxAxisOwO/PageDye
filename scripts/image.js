// Local image preparation shared by the popup and options page. Images are
// bounded before and after compression so a decoder failure cannot fall back
// to storing an unexpectedly huge original file.
(() => {
  const MAX_DIMENSION = 2560;
  const MAX_INPUT_IMAGE_BYTES = 32 * 1024 * 1024;
  const MAX_STORED_IMAGE_BYTES = 8 * 1024 * 1024;
  const WEBP_QUALITIES = [0.86, 0.72, 0.58];

  function readAsDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('Unable to read image'));
      reader.readAsDataURL(blob);
    });
  }

  function loadImage(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const image = new Image();
      image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Unable to decode image')); };
      image.src = url;
    });
  }

  function canvasToBlob(canvas, quality) {
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
  }

  function tooLargeError() {
    return new Error('Image is too large to store. Please choose a smaller image.');
  }

  async function originalResult(file, error) {
    if (file.size > MAX_STORED_IMAGE_BYTES) throw tooLargeError();
    return {
      dataUrl: await readAsDataUrl(file),
      name: file.name,
      originalBytes: file.size,
      storedBytes: file.size,
      compressed: false,
      ...(error ? { error } : {})
    };
  }

  async function prepareImage(file) {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      throw new Error('Please choose an image file');
    }
    if (!Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_INPUT_IMAGE_BYTES) {
      throw tooLargeError();
    }

    try {
      const image = await loadImage(file);
      const naturalWidth = image.naturalWidth || image.width;
      const naturalHeight = image.naturalHeight || image.height;
      if (!naturalWidth || !naturalHeight) throw new Error('Unable to decode image dimensions');
      const scale = Math.min(1, MAX_DIMENSION / Math.max(naturalWidth, naturalHeight));
      const width = Math.max(1, Math.round(naturalWidth * scale));
      const height = Math.max(1, Math.round(naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { alpha: true });
      if (!context) throw new Error('Unable to create image canvas');
      context.drawImage(image, 0, 0, width, height);

      let bestWebp = null;
      for (const quality of WEBP_QUALITIES) {
        const candidate = await canvasToBlob(canvas, quality);
        if (candidate && (!bestWebp || candidate.size < bestWebp.size)) bestWebp = candidate;
        if (candidate && candidate.size <= MAX_STORED_IMAGE_BYTES) break;
      }

      const useWebp = bestWebp && bestWebp.size <= MAX_STORED_IMAGE_BYTES &&
        (file.size > MAX_STORED_IMAGE_BYTES || bestWebp.size < file.size);
      if (!useWebp) return originalResult(file);

      const baseName = file.name.replace(/\.[^.]+$/, '') || 'wallpaper';
      return {
        dataUrl: await readAsDataUrl(bestWebp),
        name: `${baseName}.webp`,
        originalBytes: file.size,
        storedBytes: bestWebp.size,
        compressed: true
      };
    } catch (error) {
      // Decoder/canvas edge cases may retain the original only when it is
      // independently within the stored-image limit.
      return originalResult(file, error);
    }
  }

  window.PageDyeImage = {
    prepareImage,
    MAX_DIMENSION,
    MAX_INPUT_IMAGE_BYTES,
    MAX_STORED_IMAGE_BYTES
  };
})();

// Local image preparation shared by the popup and options page.  Keeping
// images reasonably sized before storing them as data URLs prevents a single
// wallpaper from needlessly consuming several megabytes of extension storage.
(() => {
  const MAX_DIMENSION = 2560;
  const WEBP_QUALITY = 0.86;

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

  function canvasToBlob(canvas) {
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY));
  }

  async function prepareImage(file) {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      throw new Error('Please choose an image file');
    }

    try {
      const image = await loadImage(file);
      const scale = Math.min(1, MAX_DIMENSION / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
      const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
      const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { alpha: true });
      context.drawImage(image, 0, 0, width, height);
      const webp = await canvasToBlob(canvas);

      // Some browsers can decline WebP encoding.  Also retain a smaller
      // original file rather than making it larger just for its format.
      if (!webp || webp.size >= file.size) {
        return { dataUrl: await readAsDataUrl(file), name: file.name, originalBytes: file.size, storedBytes: file.size, compressed: false };
      }
      const baseName = file.name.replace(/\.[^.]+$/, '') || 'wallpaper';
      return {
        dataUrl: await readAsDataUrl(webp),
        name: `${baseName}.webp`,
        originalBytes: file.size,
        storedBytes: webp.size,
        compressed: true
      };
    } catch (error) {
      // A usable original is better than rejecting a browser-supported image
      // because its decoder or canvas implementation has an edge case.
      return { dataUrl: await readAsDataUrl(file), name: file.name, originalBytes: file.size, storedBytes: file.size, compressed: false, error };
    }
  }

  window.PageDyeImage = { prepareImage, MAX_DIMENSION };
})();

// Local image preparation shared by the popup and options page. Images are
// bounded before and after compression so a decoder failure cannot fall back
// to storing an unexpectedly huge original file.
(() => {
  const MAX_DIMENSION = 2560;
  const MAX_INPUT_IMAGE_BYTES = 32 * 1024 * 1024;
  const MAX_STORED_IMAGE_BYTES = 8 * 1024 * 1024;
  const WEBP_QUALITIES = [0.86, 0.72, 0.58];
  const RECOMPRESSIBLE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/bmp']);

  // An image on its way to a model is a different job from an image on its way
  // to a page: it is re-encoded much smaller because the model reads colour and
  // composition, not detail, and because every attachment is re-sent — and
  // re-billed — on every later turn of the conversation.
  const CHAT_MAX_DIMENSION = 1024;
  const CHAT_MAX_BYTES = 1024 * 1024;
  const CHAT_QUALITIES = [0.82, 0.68, 0.52];
  // What both provider shapes accept. A canvas that cannot encode the type it
  // was asked for silently hands back a PNG, so the result is checked against
  // this rather than assumed.
  const CHAT_MEDIA_TYPES = ['image/webp', 'image/jpeg', 'image/png'];

  // A cursor image is a third job again. It is drawn at 12-48 CSS px, it rides
  // along in the settings object of every site it is set on, and its
  // transparency is the whole point — a pointer sitting on an opaque tile is
  // unusable. So it is bounded to a small square and re-encoded as WebP *with*
  // alpha, instead of being kept at its original size the way a wallpaper can.
  const CURSOR_MAX_DIMENSION = 128;
  const CURSOR_MAX_BYTES = 192 * 1024;
  const CURSOR_QUALITIES = [0.9, 0.75, 0.6];
  // Rasterizing either of these would throw away the reason for picking it —
  // an SVG's resolution independence, a GIF's animation — so they are stored
  // untouched, but only while they already fit the budget above.
  const CURSOR_PASSTHROUGH_TYPES = new Set(['image/svg+xml', 'image/gif']);

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

  function dataUrlToBlob(dataUrl) {
    if (typeof dataUrl !== 'string' || !/^data:image\//i.test(dataUrl)) {
      throw new Error('Invalid local image data');
    }
    const comma = dataUrl.indexOf(',');
    if (comma < 0) throw new Error('Invalid local image data');
    const header = dataUrl.slice(0, comma);
    const mime = header.match(/^data:([^;,]+)/i)?.[1]?.toLowerCase() || 'application/octet-stream';
    const payload = dataUrl.slice(comma + 1);
    let bytes;
    if (/;base64(?:;|$)/i.test(header)) {
      const binary = atob(payload.replace(/\s/g, ''));
      bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    } else {
      bytes = new TextEncoder().encode(decodeURIComponent(payload));
    }
    return new Blob([bytes], { type: mime });
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

  // Prepares one attachment for the AI chat. Unlike prepareImage there is no
  // "keep the original" fallback: an image the canvas cannot decode is one we
  // cannot bound, and an unbounded attachment would be re-sent on every turn.
  async function prepareChatImage(file) {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      throw new Error('Please choose an image file');
    }
    if (!Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_INPUT_IMAGE_BYTES) {
      throw tooLargeError();
    }

    const image = await loadImage(file);
    const naturalWidth = image.naturalWidth || image.width;
    const naturalHeight = image.naturalHeight || image.height;
    if (!naturalWidth || !naturalHeight) throw new Error('Unable to decode image dimensions');
    const scale = Math.min(1, CHAT_MAX_DIMENSION / Math.max(naturalWidth, naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(naturalHeight * scale));
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Unable to create image canvas');
    // Transparency has no meaning to the model and turns black under JPEG, so
    // it is flattened onto white before anything else looks at the pixels.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    let best = null;
    for (const mediaType of CHAT_MEDIA_TYPES) {
      for (const quality of CHAT_QUALITIES) {
        const candidate = await new Promise((resolve) => canvas.toBlob(resolve, mediaType, quality));
        if (!candidate || !CHAT_MEDIA_TYPES.includes(candidate.type)) continue;
        if (!best || candidate.size < best.size) best = candidate;
        if (candidate.size <= CHAT_MAX_BYTES) break;
        // PNG ignores quality, so retrying it at a lower one is wasted work.
        if (candidate.type === 'image/png') break;
      }
      if (best && best.size <= CHAT_MAX_BYTES) break;
    }
    if (!best) throw new Error('Unable to encode image');
    if (best.size > CHAT_MAX_BYTES) throw tooLargeError();

    return {
      dataUrl: await readAsDataUrl(best),
      name: (file.name || 'image').slice(0, 80),
      mediaType: best.type,
      width: canvas.width,
      height: canvas.height,
      bytes: best.size
    };
  }

  // Prepares one image to be used as the page's mouse cursor. Like
  // prepareChatImage there is no "keep the original" fallback: an image the
  // canvas cannot decode is one whose size cannot be bounded, and this one is
  // stored per site.
  async function prepareCursorImage(file) {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      throw new Error('Please choose an image file');
    }
    if (!Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_INPUT_IMAGE_BYTES) {
      throw tooLargeError();
    }

    if (CURSOR_PASSTHROUGH_TYPES.has(file.type)) {
      if (file.size > CURSOR_MAX_BYTES) throw tooLargeError();
      return {
        dataUrl: await readAsDataUrl(file),
        name: (file.name || 'cursor').slice(0, 80),
        mediaType: file.type,
        bytes: file.size
      };
    }

    const image = await loadImage(file);
    const naturalWidth = image.naturalWidth || image.width;
    const naturalHeight = image.naturalHeight || image.height;
    if (!naturalWidth || !naturalHeight) throw new Error('Unable to decode image dimensions');
    const scale = Math.min(1, CURSOR_MAX_DIMENSION / Math.max(naturalWidth, naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(naturalHeight * scale));
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) throw new Error('Unable to create image canvas');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    let best = null;
    for (const quality of CURSOR_QUALITIES) {
      const candidate = await canvasToBlob(canvas, quality);
      if (candidate && (!best || candidate.size < best.size)) best = candidate;
      if (best && best.size <= CURSOR_MAX_BYTES) break;
    }
    if (!best) throw new Error('Unable to encode image');
    if (best.size > CURSOR_MAX_BYTES) throw tooLargeError();

    const baseName = (file.name || '').replace(/\.[^.]+$/, '') || 'cursor';
    return {
      dataUrl: await readAsDataUrl(best),
      name: `${baseName.slice(0, 72)}.webp`,
      mediaType: best.type,
      bytes: best.size,
      width: canvas.width,
      height: canvas.height
    };
  }

  async function recompressDataUrl(dataUrl, options = {}) {
    const source = dataUrlToBlob(dataUrl);
    if (!RECOMPRESSIBLE_TYPES.has(source.type)) {
      return {
        dataUrl,
        originalBytes: source.size,
        storedBytes: source.size,
        compressed: false,
        skippedReason: 'format'
      };
    }

    const quality = Math.max(0.4, Math.min(0.9, Number(options.quality) || 0.72));
    const maxDimension = Math.max(640, Math.min(MAX_DIMENSION, Number(options.maxDimension) || 2048));
    const image = await loadImage(source);
    const naturalWidth = image.naturalWidth || image.width;
    const naturalHeight = image.naturalHeight || image.height;
    if (!naturalWidth || !naturalHeight) throw new Error('Unable to decode image dimensions');
    const scale = Math.min(1, maxDimension / Math.max(naturalWidth, naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(naturalHeight * scale));
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) throw new Error('Unable to create image canvas');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const candidate = await canvasToBlob(canvas, quality);
    if (!candidate) throw new Error('Unable to encode image');
    const minimumSaving = Math.max(1024, Math.round(source.size * 0.03));
    if (candidate.size > MAX_STORED_IMAGE_BYTES || source.size - candidate.size < minimumSaving) {
      return {
        dataUrl,
        originalBytes: source.size,
        storedBytes: source.size,
        compressed: false,
        skippedReason: 'no-saving',
        width: canvas.width,
        height: canvas.height
      };
    }

    return {
      dataUrl: await readAsDataUrl(candidate),
      originalBytes: source.size,
      storedBytes: candidate.size,
      compressed: true,
      width: canvas.width,
      height: canvas.height
    };
  }

  window.PageDyeImage = {
    prepareImage,
    prepareChatImage,
    prepareCursorImage,
    recompressDataUrl,
    MAX_DIMENSION,
    MAX_INPUT_IMAGE_BYTES,
    MAX_STORED_IMAGE_BYTES,
    CHAT_MAX_DIMENSION,
    CHAT_MAX_BYTES,
    CHAT_MEDIA_TYPES,
    CURSOR_MAX_DIMENSION,
    CURSOR_MAX_BYTES
  };
})();

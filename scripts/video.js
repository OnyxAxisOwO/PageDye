// Local video preparation shared by the popup and options page. Unlike
// scripts/image.js there is no canvas-based re-encode/compress step -- there
// is no browser-native equivalent for video, so a decodable file is stored
// as-is (subject to a hard input-size cap) and users are expected to trim or
// compress a clip externally before choosing it.
(() => {
  // 40 MB is the practical ceiling for the current data-URL-in-storage.local
  // design: base64 inflates by 4/3 (40 MB -> ~56M chars), which must fit both
  // the schema's per-value cap (MAX_IMAGE_VALUE_CHARS) and Chrome's ~64 MB
  // runtime message limit on the URL-rule save path. Going higher needs a
  // different storage mechanism (e.g. IndexedDB blobs), not a bigger number.
  const MAX_INPUT_VIDEO_BYTES = 40 * 1024 * 1024;
  const ACCEPTED_VIDEO_TYPES = new Set(['video/mp4', 'video/webm']);

  function readAsDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('Unable to read video'));
      reader.readAsDataURL(blob);
    });
  }

  // Decoding is the only reliable way to know a browser can actually play a
  // given file -- MIME sniffing alone can't catch an unsupported codec
  // packaged in an otherwise-valid mp4/webm container.
  function loadVideo(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      const cleanup = () => {
        video.onloadedmetadata = null;
        video.onerror = null;
        URL.revokeObjectURL(url);
      };
      video.onloadedmetadata = () => {
        const result = { duration: video.duration, width: video.videoWidth, height: video.videoHeight };
        cleanup();
        resolve(result);
      };
      video.onerror = () => {
        cleanup();
        reject(new Error('Unable to decode video'));
      };
      video.src = url;
    });
  }

  function tooLargeError() {
    return new Error('Video is too large to store. Please trim or compress it first.');
  }

  async function prepareVideo(file) {
    if (!file || !ACCEPTED_VIDEO_TYPES.has(file.type)) {
      throw new Error('Please choose an MP4 or WebM video file');
    }
    if (!Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_INPUT_VIDEO_BYTES) {
      throw tooLargeError();
    }

    const meta = await loadVideo(file);
    if (!meta.width || !meta.height || !Number.isFinite(meta.duration)) {
      throw new Error('Unable to decode video dimensions');
    }

    return {
      dataUrl: await readAsDataUrl(file),
      name: file.name,
      mime: file.type,
      bytes: file.size,
      duration: meta.duration,
      width: meta.width,
      height: meta.height
    };
  }

  window.PageDyeVideo = {
    prepareVideo,
    MAX_INPUT_VIDEO_BYTES,
    ACCEPTED_VIDEO_TYPES
  };
})();

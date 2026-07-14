document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const manager = window.PageDyeStorageManager;
  const schema = window.PageDyeStorage;
  const imageApi = window.PageDyeImage;
  const section = document.getElementById('section-storage');
  if (!manager || !schema || !imageApi || !section) return;

  const zh = (navigator.language || '').toLowerCase().startsWith('zh');
  const messages = {
    en: {
      nav: 'Storage Space', title: 'Storage Space',
      subtitle: 'See how much space PageDye uses and safely remove images you no longer need.',
      refresh: 'Refresh', currentUsage: 'PageDye is using', calculating: 'Calculating...',
      localImages: 'Used by images', reclaimable: 'Ready to clean up', uniqueImages: 'Different images',
      cleanupTitle: 'Free up space', cleanupHint: 'Remove images that are no longer used by any saved background. Images in use stay untouched.',
      detailsTitle: 'Detailed image tools', detailsHint: 'Review individual images, find extra copies, or reduce image file sizes.',
      sortBy: 'Sort images', sortLargest: 'Largest first', sortSmallest: 'Smallest first', sortSource: 'Source',
      show: 'Show', filterAll: 'All images', filterDuplicates: 'Duplicates', filterUnused: 'Unused',
      compressionQuality: 'Image quality', qualityHigh: 'Keep more detail', qualityBalanced: 'Balanced', qualitySmall: 'Save more space',
      findDuplicates: 'Show extra copies', deleteUnused: 'Clean Up Unused Images', recompress: 'Reduce Image Sizes',
      preview: 'Preview', source: 'Used by', status: 'Use', imageSize: 'Space', noImages: 'No images match this view.',
      sourceUsage: 'Space used by each website', sourceUsageHint: 'A detailed breakdown of saved backgrounds and PageDye tools.',
      sourceType: 'Type', images: 'Images', totalSize: 'Total size', backupCalculating: 'Calculating backup size...',
      backupEstimate: 'Estimated backup size: {size}, including {count} images',
      quota: '{percent}% of the browser limit ({quota})', exactUsage: 'Measured by your browser',
      imageDetail: '{count} saved images · {percent}% of PageDye space',
      unusedDetail: '{count} images are no longer used', duplicateDetail: '{count} sets of extra copies · {size}',
      referenced: 'In use', unused: 'Not used', duplicate: '{count} copies', imageMeta: '{format} image',
      listSummary: 'Showing {shown} of {total} images',
      typeSite: 'Website', typeRule: 'Page rule', typeDefault: 'Default background', typePreset: 'Preset', typeAppearance: 'Interface', typeOther: 'Other',
      duplicateResult: 'Found {count} sets of extra copies using {size}.',
      noDuplicates: 'No extra copies found.',
      deleteConfirm: 'Clean up {count} images that are no longer used and free about {size}? Current website backgrounds will not be affected.',
      deleteDone: 'Cleaned up {count} unused images and freed about {size}.',
      compressConfirm: 'Try to reduce the size of {count} images? PageDye will keep an image only when the new version is smaller.',
      compressProgress: 'Optimizing image {current} of {total}...',
      compressDone: 'Reduced {count} images and saved about {size}. {skipped} images were already small enough or could not be changed.',
      compressNoSaving: 'These images are already compact. No changes were needed.',
      operationFailed: 'The storage task could not be completed: {error}'
    },
    zh: {
      nav: '存储空间', title: '存储空间',
      subtitle: '查看 PageDye 使用了多少空间，并安全清理不再需要的图片。',
      refresh: '刷新', currentUsage: 'PageDye 已使用', calculating: '正在计算...',
      localImages: '其中图片占用', reclaimable: '可以清理', uniqueImages: '不同图片',
      cleanupTitle: '释放空间', cleanupHint: '清理已经没有任何背景使用的图片，正在使用的图片不会受影响。',
      detailsTitle: '图片详细管理', detailsHint: '逐张查看图片、找出多余副本，或进一步减小图片体积。',
      sortBy: '图片排序', sortLargest: '最大的在前', sortSmallest: '最小的在前', sortSource: '按使用位置',
      show: '查看', filterAll: '全部图片', filterDuplicates: '多余副本', filterUnused: '已经不用',
      compressionQuality: '图片画质', qualityHigh: '保留更多细节', qualityBalanced: '均衡', qualitySmall: '节省更多空间',
      findDuplicates: '查看多余副本', deleteUnused: '清理不用的图片', recompress: '减小图片体积',
      preview: '预览', source: '使用位置', status: '用途', imageSize: '占用', noImages: '这里没有符合条件的图片。',
      sourceUsage: '各网站使用的空间', sourceUsageHint: '详细列出网站背景和 PageDye 工具占用的空间。',
      sourceType: '类型', images: '图片', totalSize: '总大小', backupCalculating: '正在计算备份大小...',
      backupEstimate: '预计备份大小：{size}，包含 {count} 张图片',
      quota: '占浏览器可用上限 {quota} 的 {percent}%', exactUsage: '由浏览器直接统计',
      imageDetail: '共 {count} 张图片 · 占 PageDye 空间 {percent}%',
      unusedDetail: '{count} 张图片已经不再使用', duplicateDetail: '{count} 组多余副本 · {size}',
      referenced: '正在使用', unused: '已经不用', duplicate: '{count} 个副本', imageMeta: '{format} 图片',
      listSummary: '显示 {shown} / {total} 张图片',
      typeSite: '网站', typeRule: '页面规则', typeDefault: '默认背景', typePreset: '预设', typeAppearance: '界面外观', typeOther: '其他',
      duplicateResult: '找到 {count} 组多余副本，共占用 {size}。',
      noDuplicates: '没有发现多余副本。',
      deleteConfirm: '清理 {count} 张已经不用的图片并释放约 {size} 吗？当前正在使用的网站背景不会受影响。',
      deleteDone: '已清理 {count} 张不用的图片，释放约 {size}。',
      compressConfirm: '尝试减小 {count} 张图片的体积吗？只有新版本确实更小时才会替换原图。',
      compressProgress: '正在优化第 {current} / {total} 张图片...',
      compressDone: '已减小 {count} 张图片，节省约 {size}；另有 {skipped} 张已经足够小或无法调整。',
      compressNoSaving: '这些图片已经足够精简，不需要更改。',
      operationFailed: '操作没有完成：{error}'
    }
  }[zh ? 'zh' : 'en'];

  const elements = {
    refresh: document.getElementById('storage-refresh-btn'),
    total: document.getElementById('storage-total-value'),
    quotaText: document.getElementById('storage-quota-text'),
    quota: document.getElementById('storage-quota'),
    quotaBar: document.getElementById('storage-quota-bar'),
    imageValue: document.getElementById('storage-images-value'),
    imageDetail: document.getElementById('storage-images-detail'),
    reclaimableValue: document.getElementById('storage-reclaimable-value'),
    reclaimableDetail: document.getElementById('storage-reclaimable-detail'),
    uniqueValue: document.getElementById('storage-unique-value'),
    duplicatesDetail: document.getElementById('storage-duplicates-detail'),
    sort: document.getElementById('storage-sort-select'),
    filter: document.getElementById('storage-filter-select'),
    quality: document.getElementById('storage-quality-select'),
    findDuplicates: document.getElementById('storage-find-duplicates-btn'),
    deleteUnused: document.getElementById('storage-delete-unused-btn'),
    recompress: document.getElementById('storage-recompress-btn'),
    operationStatus: document.getElementById('storage-operation-status'),
    imagesBody: document.getElementById('storage-images-body'),
    imagesEmpty: document.getElementById('storage-images-empty'),
    listSummary: document.getElementById('storage-list-summary'),
    sourcesBody: document.getElementById('storage-sources-body'),
    backupEstimate: document.getElementById('backup-size-estimate')
  };

  let storageData = {};
  let analysis = null;
  let busy = false;
  let refreshTimer = null;
  const MAX_IMAGE_ROWS = 150;
  const MAX_SOURCE_ROWS = 500;

  function text(key, values = {}) {
    return Object.entries(values).reduce((result, [name, value]) => result.replace(`{${name}}`, value), messages[key] || key);
  }

  function translate() {
    document.querySelectorAll('[data-storage-i18n]').forEach((node) => {
      node.textContent = text(node.dataset.storageI18n);
    });
  }

  function setOperationStatus(message, error = false) {
    elements.operationStatus.textContent = message;
    elements.operationStatus.classList.remove('hidden');
    elements.operationStatus.classList.toggle('error', error);
  }

  function clearOperationStatus() {
    elements.operationStatus.classList.add('hidden');
    elements.operationStatus.classList.remove('error');
  }

  async function confirmAction(message) {
    if (typeof window.PageDyeOptionsConfirm === 'function') return window.PageDyeOptionsConfirm(message);
    return window.confirm(message);
  }

  function percent(part, total) {
    if (!total) return '0';
    const value = Math.min(100, part / total * 100);
    return value < 0.1 && value > 0 ? '<0.1' : value.toFixed(value >= 10 ? 1 : 2);
  }

  async function exactBytesInUse() {
    try {
      return await chrome.storage.local.getBytesInUse(null);
    } catch (_) {
      return manager.jsonBytes(storageData);
    }
  }

  async function quotaEstimate() {
    try {
      const estimate = await navigator.storage?.estimate?.();
      return estimate && Number.isFinite(estimate.quota) ? estimate.quota : 0;
    } catch (_) {
      return 0;
    }
  }

  function renderMetrics(actualBytes, quotaBytes) {
    const stats = analysis.stats;
    elements.total.textContent = manager.formatBytes(actualBytes);
    elements.imageValue.textContent = manager.formatBytes(stats.imageStorageBytes);
    elements.imageDetail.textContent = text('imageDetail', {
      count: stats.imageCount,
      percent: percent(stats.imageStorageBytes, actualBytes)
    });
    elements.reclaimableValue.textContent = manager.formatBytes(stats.unusedBytes);
    elements.reclaimableDetail.textContent = text('unusedDetail', { count: stats.unusedCount });
    elements.uniqueValue.textContent = String(stats.uniqueImageCount);
    elements.duplicatesDetail.textContent = text('duplicateDetail', {
      count: stats.duplicateGroupCount,
      size: manager.formatBytes(stats.duplicateBytes)
    });
    elements.deleteUnused.disabled = stats.unusedCount === 0 || busy;
    elements.recompress.disabled = stats.uniqueImageCount === 0 || busy;

    if (quotaBytes > 0) {
      const quotaPercent = Math.min(100, actualBytes / quotaBytes * 100);
      elements.quota.hidden = false;
      elements.quotaBar.style.width = `${Math.max(quotaPercent > 0 ? 0.25 : 0, quotaPercent)}%`;
      elements.quotaText.textContent = text('quota', {
        percent: quotaPercent < 0.1 && quotaPercent > 0 ? '<0.1' : quotaPercent.toFixed(quotaPercent >= 10 ? 1 : 2),
        quota: manager.formatBytes(quotaBytes)
      });
    } else {
      elements.quota.hidden = true;
      elements.quotaText.textContent = text('exactUsage');
    }
  }

  function filteredImages() {
    const filter = elements.filter.value;
    const rows = analysis.images.filter((image) => {
      if (filter === 'duplicates') return image.duplicateCount > 1;
      if (filter === 'unused') return !image.referenced;
      return true;
    });
    const sort = elements.sort.value;
    rows.sort((a, b) => {
      if (sort === 'size-asc') return a.bytes - b.bytes;
      if (sort === 'source') return a.owner.localeCompare(b.owner) || b.bytes - a.bytes;
      return b.bytes - a.bytes;
    });
    return rows;
  }

  function renderImages() {
    const images = filteredImages();
    const shown = images.slice(0, MAX_IMAGE_ROWS);
    elements.imagesBody.replaceChildren();
    shown.forEach((record) => {
      const row = document.createElement('tr');
      const previewCell = document.createElement('td');
      const preview = document.createElement('img');
      preview.className = 'storage-image-preview';
      preview.loading = 'lazy';
      preview.alt = '';
      preview.src = record.dataUrl;
      previewCell.appendChild(preview);

      const sourceCell = document.createElement('td');
      sourceCell.className = 'storage-source-cell';
      const sourceName = document.createElement('strong');
      sourceName.textContent = record.owner;
      const location = document.createElement('small');
      location.textContent = text('imageMeta', { format: record.mime.replace('image/', '').toUpperCase() });
      sourceCell.append(sourceName, location);

      const statusCell = document.createElement('td');
      const tags = document.createElement('div');
      tags.className = 'storage-status-tags';
      const usageTag = document.createElement('span');
      usageTag.className = `storage-tag ${record.referenced ? '' : 'unused'}`.trim();
      usageTag.textContent = text(record.referenced ? 'referenced' : 'unused');
      tags.appendChild(usageTag);
      if (record.duplicateCount > 1) {
        const duplicateTag = document.createElement('span');
        duplicateTag.className = 'storage-tag duplicate';
        duplicateTag.textContent = text('duplicate', { count: record.duplicateCount });
        tags.appendChild(duplicateTag);
      }
      statusCell.appendChild(tags);

      const sizeCell = document.createElement('td');
      sizeCell.className = 'storage-size-cell';
      sizeCell.textContent = manager.formatBytes(record.bytes);
      row.append(previewCell, sourceCell, statusCell, sizeCell);
      elements.imagesBody.appendChild(row);
    });
    elements.imagesEmpty.classList.toggle('hidden', images.length > 0);
    elements.listSummary.textContent = text('listSummary', { shown: shown.length, total: images.length });
  }

  function renderSources() {
    elements.sourcesBody.replaceChildren();
    analysis.owners.slice(0, MAX_SOURCE_ROWS).forEach((owner) => {
      const row = document.createElement('tr');
      const sourceCell = document.createElement('td');
      sourceCell.className = 'storage-source-cell';
      const sourceName = document.createElement('strong');
      sourceName.textContent = owner.label;
      sourceCell.appendChild(sourceName);
      const typeCell = document.createElement('td');
      const typeKey = `type${owner.type.charAt(0).toUpperCase()}${owner.type.slice(1)}`;
      typeCell.textContent = text(typeKey);
      const imagesCell = document.createElement('td');
      imagesCell.textContent = owner.imageCount ? `${owner.imageCount} · ${manager.formatBytes(owner.imageBytes)}` : '0';
      const totalCell = document.createElement('td');
      totalCell.className = 'storage-size-cell';
      totalCell.textContent = manager.formatBytes(owner.totalBytes);
      row.append(sourceCell, typeCell, imagesCell, totalCell);
      elements.sourcesBody.appendChild(row);
    });
  }

  function renderBackupEstimate() {
    try {
      const backup = schema.buildBackup(storageData, chrome.runtime.getManifest().version);
      const size = manager.utf8Bytes(JSON.stringify(backup, null, 2));
      const imageCount = analysis.images.filter((image) => image.ownerType !== 'appearance').length;
      elements.backupEstimate.textContent = text('backupEstimate', {
        size: manager.formatBytes(size),
        count: imageCount
      });
    } catch (_) {
      elements.backupEstimate.textContent = text('backupCalculating');
    }
  }

  async function load() {
    if (busy) return;
    elements.refresh.disabled = true;
    try {
      storageData = await chrome.storage.local.get(null);
      analysis = manager.analyze(storageData, schema);
      const [actualBytes, quotaBytes] = await Promise.all([exactBytesInUse(), quotaEstimate()]);
      renderMetrics(actualBytes, quotaBytes);
      renderImages();
      renderSources();
      renderBackupEstimate();
    } catch (error) {
      setOperationStatus(text('operationFailed', { error: error.message || String(error) }), true);
    } finally {
      elements.refresh.disabled = false;
    }
  }

  async function findDuplicates() {
    elements.filter.value = 'duplicates';
    renderImages();
    if (analysis.stats.duplicateGroupCount) {
      setOperationStatus(text('duplicateResult', {
        count: analysis.stats.duplicateGroupCount,
        size: manager.formatBytes(analysis.stats.duplicateBytes)
      }));
    } else {
      setOperationStatus(text('noDuplicates'));
    }
  }

  async function deleteUnused() {
    if (!analysis.stats.unusedCount) return;
    const confirmed = await confirmAction(text('deleteConfirm', {
      count: analysis.stats.unusedCount,
      size: manager.formatBytes(analysis.stats.unusedBytes)
    }));
    if (!confirmed) return;
    busy = true;
    try {
      const result = manager.removeUnreferenced(storageData, null, schema);
      if (Object.keys(result.write).length) await chrome.storage.local.set(result.write);
      setOperationStatus(text('deleteDone', {
        count: result.removedCount,
        size: manager.formatBytes(result.removedBytes)
      }));
    } catch (error) {
      setOperationStatus(text('operationFailed', { error: error.message || String(error) }), true);
    } finally {
      busy = false;
      await load();
    }
  }

  function setBusyButtons(value) {
    [elements.refresh, elements.findDuplicates, elements.deleteUnused, elements.recompress].forEach((button) => {
      button.disabled = value;
    });
  }

  async function recompressImages() {
    const unique = [...new Map(analysis.images.map((record) => [record.dataUrl, record])).values()];
    if (!unique.length) return;
    if (!(await confirmAction(text('compressConfirm', { count: unique.length })))) return;

    busy = true;
    setBusyButtons(true);
    const replacements = new Map();
    let skipped = 0;
    try {
      for (let index = 0; index < unique.length; index += 1) {
        setOperationStatus(text('compressProgress', { current: index + 1, total: unique.length }));
        try {
          const result = await imageApi.recompressDataUrl(unique[index].dataUrl, {
            quality: Number(elements.quality.value),
            maxDimension: 2048
          });
          if (result.compressed) replacements.set(unique[index].dataUrl, result.dataUrl);
          else skipped += 1;
        } catch (_) {
          skipped += 1;
        }
        if (index % 3 === 2) await new Promise((resolve) => requestAnimationFrame(resolve));
      }

      if (!replacements.size) {
        setOperationStatus(text('compressNoSaving'));
        return;
      }
      const patch = manager.replaceImages(storageData, replacements, schema);
      await chrome.storage.local.set(patch.write);
      const saved = Math.max(0, patch.originalBytes - patch.replacementBytes);
      setOperationStatus(text('compressDone', {
        count: replacements.size,
        size: manager.formatBytes(saved),
        skipped
      }));
    } catch (error) {
      setOperationStatus(text('operationFailed', { error: error.message || String(error) }), true);
    } finally {
      busy = false;
      setBusyButtons(false);
      await load();
    }
  }

  translate();
  elements.refresh.addEventListener('click', () => { clearOperationStatus(); load(); });
  elements.sort.addEventListener('change', renderImages);
  elements.filter.addEventListener('change', renderImages);
  elements.findDuplicates.addEventListener('click', findDuplicates);
  elements.deleteUnused.addEventListener('click', deleteUnused);
  elements.recompress.addEventListener('click', recompressImages);

  chrome.storage.onChanged.addListener((_changes, area) => {
    if (area !== 'local' || busy) return;
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(load, 180);
  });

  if (location.hash === '#section-storage') {
    document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.target === 'section-storage'));
    document.querySelectorAll('.content-section').forEach((item) => item.classList.toggle('active', item.id === 'section-storage'));
  }
  load();
});

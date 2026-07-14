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
      nav: 'Storage', title: 'Storage Management',
      subtitle: 'Inspect local images, reclaim unused data, and keep backups under control.',
      refresh: 'Refresh', currentUsage: 'Current usage', calculating: 'Calculating...',
      localImages: 'Local images', reclaimable: 'Immediately reclaimable', uniqueImages: 'Unique images',
      sortBy: 'Sort images', sortLargest: 'Largest first', sortSmallest: 'Smallest first', sortSource: 'Source',
      show: 'Show', filterAll: 'All images', filterDuplicates: 'Duplicates', filterUnused: 'Unused',
      compressionQuality: 'Compression', qualityHigh: 'High quality', qualityBalanced: 'Balanced', qualitySmall: 'Smaller files',
      findDuplicates: 'Find duplicates', deleteUnused: 'Delete unused', recompress: 'Recompress images',
      preview: 'Preview', source: 'Site / source', status: 'Status', imageSize: 'Image size', noImages: 'No matching local images.',
      sourceUsage: 'Usage by site and source', sourceUsageHint: 'Includes configuration data and embedded image strings. Rule and preset rows are shown separately.',
      sourceType: 'Type', images: 'Images', totalSize: 'Total size', backupCalculating: 'Calculating backup size...',
      backupEstimate: 'Estimated backup: {size} · {count} local image references',
      quota: '{percent}% of estimated {quota} quota', exactUsage: 'Exact browser storage usage',
      imageDetail: '{count} references · {percent}% of storage',
      unusedDetail: '{count} unused image references', duplicateDetail: '{count} duplicate groups · {size} repeated data',
      referenced: 'In use', unused: 'Unused', duplicate: 'Duplicate ×{count}',
      listSummary: 'Showing {shown} of {total} images',
      typeSite: 'Site', typeRule: 'URL rule', typeDefault: 'Default', typePreset: 'Preset', typeAppearance: 'Appearance', typeOther: 'Other',
      duplicateResult: '{count} duplicate groups found, using {size} in repeated Base64 data.',
      noDuplicates: 'No duplicate images found.',
      deleteConfirm: 'Delete {count} unused image references and reclaim about {size}? Only image data left in fields no longer configured as images will be cleared. This cannot be undone.',
      deleteDone: 'Deleted {count} unused image references and reclaimed about {size}.',
      compressConfirm: 'Recompress {count} unique images? Animated GIF and SVG images are skipped. Only smaller results will be saved.',
      compressProgress: 'Compressing {current} of {total}...',
      compressDone: 'Recompressed {count} unique images and saved about {size}. {skipped} images were unchanged or skipped.',
      compressNoSaving: 'All images are already efficient; no smaller replacements were found.',
      operationFailed: 'Storage operation failed: {error}'
    },
    zh: {
      nav: '存储空间', title: '存储空间管理',
      subtitle: '检查本地图片占用，清理无效数据，并控制备份文件大小。',
      refresh: '刷新', currentUsage: '当前存储占用', calculating: '正在计算...',
      localImages: '本地图片占用', reclaimable: '可立即回收', uniqueImages: '唯一图片',
      sortBy: '图片排序', sortLargest: '从大到小', sortSmallest: '从小到大', sortSource: '按来源',
      show: '显示范围', filterAll: '全部图片', filterDuplicates: '重复图片', filterUnused: '未引用图片',
      compressionQuality: '压缩档位', qualityHigh: '高画质', qualityBalanced: '均衡', qualitySmall: '更小体积',
      findDuplicates: '查找重复图片', deleteUnused: '删除未引用图片', recompress: '重新压缩已有图片',
      preview: '预览', source: '站点 / 来源', status: '状态', imageSize: '图片大小', noImages: '没有符合条件的本地图片。',
      sourceUsage: '各站点与来源占用', sourceUsageHint: '包含配置数据和内嵌图片字符串；URL 规则与预设会单独列出。',
      sourceType: '类型', images: '图片', totalSize: '总大小', backupCalculating: '正在计算备份大小...',
      backupEstimate: '预计备份：{size} · {count} 个本地图片引用',
      quota: '约占 {quota} 配额的 {percent}%', exactUsage: '浏览器报告的精确存储占用',
      imageDetail: '{count} 个引用 · 占总存储 {percent}%',
      unusedDetail: '{count} 个未引用图片字段', duplicateDetail: '{count} 组重复 · 重复数据 {size}',
      referenced: '正在使用', unused: '未引用', duplicate: '重复 ×{count}',
      listSummary: '显示 {shown} / {total} 张图片',
      typeSite: '站点', typeRule: 'URL 规则', typeDefault: '全站默认', typePreset: '预设', typeAppearance: '控制面板外观', typeOther: '其他',
      duplicateResult: '找到 {count} 组重复图片，重复 Base64 数据占用 {size}。',
      noDuplicates: '未发现重复图片。',
      deleteConfirm: '确定删除 {count} 个未引用图片字段并回收约 {size} 吗？只会清除已不再配置为图片、但仍残留图片数据的字段；此操作无法撤销。',
      deleteDone: '已删除 {count} 个未引用图片字段，回收约 {size}。',
      compressConfirm: '确定重新压缩 {count} 张唯一图片吗？GIF 动图和 SVG 会自动跳过，只有体积确实变小的结果才会写回。',
      compressProgress: '正在压缩第 {current} / {total} 张...',
      compressDone: '已重新压缩 {count} 张唯一图片，节省约 {size}；{skipped} 张保持不变或已跳过。',
      compressNoSaving: '现有图片已经足够精简，没有找到更小的替换结果。',
      operationFailed: '存储操作失败：{error}'
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
      location.textContent = `${record.location} · ${record.mime.replace('image/', '').toUpperCase()} · ${record.fingerprint.slice(0, 8)}`;
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

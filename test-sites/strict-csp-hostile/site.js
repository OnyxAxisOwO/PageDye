(() => {
  const guardStatus = document.getElementById('guard-status');
  const blockedNames = [
    'pagedye',
    'page-dye',
    'wallpaper',
    'custom-css',
    'frosted'
  ];

  function looksLikeVisualInjection(node) {
    if (!(node instanceof Element)) return false;

    const id = (node.id || '').toLowerCase();
    const className = String(node.className || '').toLowerCase();
    const tag = node.tagName.toLowerCase();
    const marker = `${id} ${className}`;

    if (blockedNames.some((name) => marker.includes(name))) return true;
    if (tag === 'style' && /pagedye|background|wallpaper|frosted/i.test(node.textContent || '')) return true;
    if (tag === 'iframe') return true;

    const position = getComputedStyle(node).position;
    const zIndex = Number.parseInt(getComputedStyle(node).zIndex, 10);
    return position === 'fixed' && Number.isFinite(zIndex) && Math.abs(zIndex) > 1000000;
  }

  function removeHostileTargets(nodes) {
    let removed = 0;
    nodes.forEach((node) => {
      if (looksLikeVisualInjection(node)) {
        node.remove();
        removed += 1;
      }
      if (node instanceof Element) {
        node.querySelectorAll('style, iframe, [id], [class]').forEach((child) => {
          if (looksLikeVisualInjection(child)) {
            child.remove();
            removed += 1;
          }
        });
      }
    });

    if (removed && guardStatus) {
      guardStatus.textContent = `Removed ${removed}`;
    }
  }

  const observer = new MutationObserver((mutations) => {
    const added = [];
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => added.push(node));
    });
    removeHostileTargets(added);
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  window.setInterval(() => {
    document.documentElement.classList.toggle('repaint-tick');
    document.body.classList.toggle('repaint-tick');
    removeHostileTargets(Array.from(document.querySelectorAll('style, iframe, [id*="pagedye" i], [class*="pagedye" i]')));
    if (guardStatus && guardStatus.textContent === 'Starting') {
      guardStatus.textContent = 'Armed';
    }
  }, 1200);
})();

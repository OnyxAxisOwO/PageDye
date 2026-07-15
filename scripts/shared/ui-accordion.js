// Accordion expand/collapse animation shared verbatim between popup/popup.js and
// options/options.js. Operates generically on whatever <details class="accordion">
// element is passed in — no hardcoded ids — so it needed no parameterization to share.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.PageDyeAccordion = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function setAccordionOpen(details, open, animate = true) {
    const content = details && details.querySelector(':scope > .accordion-content');
    if (!details || !content) return;

    if (details.open === open && !details.classList.contains('accordion-animating')) return;
    details._pagedyeAccordionOpenTarget = open;

    if (details._pagedyeAccordionAnimation) {
      details._pagedyeAccordionAnimation.cancel();
      details._pagedyeAccordionAnimation = null;
    }

    const shouldAnimate = animate && !document.documentElement.classList.contains('pagedye-no-animation') && content.animate;
    if (!shouldAnimate) {
      details.open = open;
      content.style.height = '';
      content.style.overflow = '';
      content.style.opacity = '';
      details.classList.remove('accordion-animating');
      return;
    }

    details.classList.add('accordion-animating');

    if (open) {
      content.style.height = '0px';
      content.style.overflow = 'hidden';
      details.open = true;
      const targetHeight = content.scrollHeight;
      details._pagedyeAccordionAnimation = content.animate(
        [{ height: '0px', opacity: 0.35 }, { height: targetHeight + 'px', opacity: 1 }],
        { duration: 220, easing: 'cubic-bezier(.22,1,.36,1)' }
      );
    } else {
      const startHeight = content.scrollHeight;
      content.style.height = startHeight + 'px';
      content.style.overflow = 'hidden';
      details._pagedyeAccordionAnimation = content.animate(
        [{ height: startHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0.35 }],
        { duration: 170, easing: 'ease' }
      );
    }

    details._pagedyeAccordionAnimation.onfinish = () => {
      details.open = open;
      content.style.height = '';
      content.style.overflow = '';
      content.style.opacity = '';
      details.classList.remove('accordion-animating');
      details._pagedyeAccordionAnimation = null;
      details._pagedyeAccordionOpenTarget = open;
    };
  }

  function handleAccordionSummaryClick(e) {
    const summary = e.target.closest('.accordion-summary');
    if (!summary) return;
    const details = summary.closest('.accordion');
    if (!details || !details.contains(summary)) return;
    e.preventDefault();
    const currentTarget = typeof details._pagedyeAccordionOpenTarget === 'boolean'
      ? details._pagedyeAccordionOpenTarget
      : details.open;
    setAccordionOpen(details, !currentTarget);
  }

  return { setAccordionOpen, handleAccordionSummaryClick };
});

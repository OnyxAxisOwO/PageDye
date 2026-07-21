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

    if (details.open === open && !details.classList.contains('accordion-animating')) {
      content.hidden = !open;
      return;
    }
    details._pagedyeAccordionOpenTarget = open;

    const runningAnimation = details._pagedyeAccordionAnimation;
    let startHeight = details.open ? content.getBoundingClientRect().height : 0;
    let startOpacity = details.open ? Number.parseFloat(getComputedStyle(content).opacity) || 1 : 0;
    if (runningAnimation) {
      // Freeze the currently painted frame before cancelling. Without this,
      // a rapid direction change briefly snaps to the old endpoint.
      startHeight = content.getBoundingClientRect().height;
      startOpacity = Number.parseFloat(getComputedStyle(content).opacity);
      runningAnimation.onfinish = null;
      runningAnimation.oncancel = null;
      runningAnimation.cancel();
      details._pagedyeAccordionAnimation = null;
    }

    const reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const shouldAnimate = animate && !reduceMotion && !document.documentElement.classList.contains('pagedye-no-animation') && content.animate;
    if (!shouldAnimate) {
      details.open = open;
      content.hidden = !open;
      content.style.height = '';
      content.style.overflow = '';
      content.style.opacity = '';
      details.classList.remove('accordion-animating');
      return;
    }

    details.classList.add('accordion-animating');
    content.style.height = startHeight + 'px';
    content.style.overflow = 'hidden';
    content.style.opacity = String(Number.isFinite(startOpacity) ? startOpacity : (open ? 0 : 1));
    // <details> must stay open while its contents animate closed. When opening,
    // setting the zero-height inline style first avoids one full-height frame.
    details.open = true;
    content.hidden = false;
    const targetHeight = open ? content.scrollHeight : 0;
    const targetOpacity = open ? 1 : 0;
    const animation = content.animate(
      [
        { height: startHeight + 'px', opacity: Number.isFinite(startOpacity) ? startOpacity : (open ? 0 : 1) },
        { height: targetHeight + 'px', opacity: targetOpacity }
      ],
      {
        duration: open ? 220 : 170,
        easing: open ? 'cubic-bezier(.22,1,.36,1)' : 'cubic-bezier(.4,0,.2,1)',
        fill: 'both'
      }
    );
    details._pagedyeAccordionAnimation = animation;

    animation.onfinish = () => {
      if (details._pagedyeAccordionAnimation !== animation) return;
      animation.onfinish = null;
      animation.oncancel = null;
      // Pin the endpoint before removing the animation. On collapse, hide the
      // content before clearing styles and closing <details>, preventing one
      // natural-height frame from being painted between those two states.
      content.style.height = targetHeight + 'px';
      content.style.opacity = String(targetOpacity);
      if (!open) content.hidden = true;
      details.open = open;
      animation.cancel();
      content.style.height = '';
      content.style.overflow = '';
      content.style.opacity = '';
      details.classList.remove('accordion-animating');
      details._pagedyeAccordionAnimation = null;
      details._pagedyeAccordionOpenTarget = open;
    };
    animation.oncancel = () => {
      if (details._pagedyeAccordionAnimation !== animation) return;
      details._pagedyeAccordionAnimation = null;
      details.classList.remove('accordion-animating');
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

// Owns the "frosted glass" entry list widget in the site editor: legacy-shape
// normalization, the state array, rendering the cards, and collecting them
// back into a settings array. `t` (i18n), `showStatus`, the whole-form
// `getCurrentLayer` collector, and the save-timing callbacks are injected by
// the caller (options.js) rather than assumed global, since this file loads
// before options.js defines them and some (like the current form layer) are
// owned by the editor core, not this widget.
(function (root) {
  let state = [];

  // Older saved settings stored frostedGlass as a single { selector, blur,
  // opacity } object. Upgrade that shape to a one-entry array transparently.
  function normalize(fg) {
    if (Array.isArray(fg)) return fg;
    if (fg && typeof fg === 'object' && fg.selector) return [fg];
    return [];
  }

  // Rebuilds the frosted-entry list from scratch, one card per element, so
  // saving a new element never clobbers the others.
  function render(list, t) {
    state = list.map(f => ({
      selector: f.selector || '',
      blur: f.blur !== undefined ? f.blur : 12,
      opacity: f.opacity !== undefined ? f.opacity : 55,
      color: f.color || null
    }));
    const container = document.getElementById('edit-frosted-list');
    container.innerHTML = '';

    state.forEach((entry, idx) => {
      const row = document.createElement('div');
      row.className = 'frosted-entry';
      row.dataset.index = idx;

      const selectorRow = document.createElement('div');
      selectorRow.className = 'selector-row';

      const selectorInput = document.createElement('input');
      selectorInput.type = 'text';
      selectorInput.className = 'frosted-entry-selector';
      selectorInput.placeholder = '.card, main';
      selectorInput.value = entry.selector;

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'frosted-entry-remove';
      removeBtn.textContent = '×';
      removeBtn.title = t ? t('gradientRemoveStop') : '';

      selectorRow.appendChild(selectorInput);
      selectorRow.appendChild(removeBtn);

      const blurLabelRow = document.createElement('div');
      blurLabelRow.className = 'label-row';
      const blurLabel = document.createElement('label');
      blurLabel.textContent = t ? t('frostedBlur') : '';
      const blurVal = document.createElement('span');
      blurVal.className = 'val-badge frosted-entry-blur-val';
      blurVal.textContent = `${entry.blur}px`;
      blurLabelRow.appendChild(blurLabel);
      blurLabelRow.appendChild(blurVal);

      const blurInput = document.createElement('input');
      blurInput.type = 'range';
      blurInput.className = 'frosted-entry-blur';
      blurInput.min = '0';
      blurInput.max = '30';
      blurInput.step = '0.1';
      blurInput.value = entry.blur;

      const opacityLabelRow = document.createElement('div');
      opacityLabelRow.className = 'label-row';
      const opacityLabel = document.createElement('label');
      opacityLabel.textContent = t ? t('frostedOpacity') : '';
      const opacityVal = document.createElement('span');
      opacityVal.className = 'val-badge frosted-entry-opacity-val';
      opacityVal.textContent = `${entry.opacity}%`;
      opacityLabelRow.appendChild(opacityLabel);
      opacityLabelRow.appendChild(opacityVal);

      const opacityInput = document.createElement('input');
      opacityInput.type = 'range';
      opacityInput.className = 'frosted-entry-opacity';
      opacityInput.min = '0';
      opacityInput.max = '100';
      opacityInput.value = entry.opacity;

      const colorRow = document.createElement('div');
      colorRow.className = 'frosted-entry-color-row';

      const colorToggleLabel = document.createElement('label');
      colorToggleLabel.className = 'checkbox-label';
      const colorToggle = document.createElement('input');
      colorToggle.type = 'checkbox';
      colorToggle.className = 'frosted-entry-color-toggle';
      colorToggle.checked = !!entry.color;
      const colorToggleText = document.createElement('span');
      colorToggleText.textContent = t ? t('frostedCustomColor') : '';
      colorToggleLabel.appendChild(colorToggle);
      colorToggleLabel.appendChild(colorToggleText);

      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.className = 'frosted-entry-color';
      colorInput.value = entry.color || '#ffffff';
      colorInput.disabled = !entry.color;

      // Seeds the picker from whatever the background is made of. It only
      // fills in a starting value — the picker stays right beside it, because
      // a tint derived from the wallpaper cannot know the color of the text it
      // will end up sitting behind.
      const tintBtn = document.createElement('button');
      tintBtn.type = 'button';
      tintBtn.className = 'frosted-entry-tint';
      tintBtn.textContent = t ? t('frostedTintFromBg') : '';

      colorRow.appendChild(colorToggleLabel);
      colorRow.appendChild(colorInput);
      colorRow.appendChild(tintBtn);

      row.appendChild(selectorRow);
      row.appendChild(blurLabelRow);
      row.appendChild(blurInput);
      row.appendChild(opacityLabelRow);
      row.appendChild(opacityInput);
      row.appendChild(colorRow);
      container.appendChild(row);
    });
  }

  function collect() {
    return state.map(f => ({
      selector: f.selector.trim(),
      blur: f.blur,
      opacity: f.opacity,
      color: f.color || null
    }));
  }

  // The options-page half of the popup's applyFrostedTint; the derivation
  // itself lives in scripts/gradient.js so the two cannot drift.
  async function applyTint(index, button, { t, showStatus, getCurrentLayer, onSaved }) {
    const entry = state[index];
    if (!entry) return;

    const layer = getCurrentLayer();
    button.disabled = true;
    const result = await window.PageDyeGradient.extractLayerPalette(layer);
    button.disabled = false;

    const tint = result.ok ? window.PageDyeGradient.frostedTintFromColors(result.colors) : null;
    if (!tint) {
      showStatus(t('frostedTintFailed'), true);
      return;
    }

    entry.color = tint;
    render(state, t);
    if (onSaved) onSaved();
  }

  function attachHandlers({ t, showStatus, getCurrentLayer, onFieldChange, onStructuralChange } = {}) {
    const list = document.getElementById('edit-frosted-list');

    list.addEventListener('input', (e) => {
      const row = e.target.closest('.frosted-entry');
      if (!row) return;
      const idx = parseInt(row.dataset.index, 10);
      if (e.target.classList.contains('frosted-entry-selector')) {
        state[idx].selector = e.target.value;
      } else if (e.target.classList.contains('frosted-entry-blur')) {
        state[idx].blur = parseFloat(e.target.value) || 0;
        row.querySelector('.frosted-entry-blur-val').textContent = `${e.target.value}px`;
      } else if (e.target.classList.contains('frosted-entry-opacity')) {
        state[idx].opacity = parseInt(e.target.value, 10);
        row.querySelector('.frosted-entry-opacity-val').textContent = `${e.target.value}%`;
      } else if (e.target.classList.contains('frosted-entry-color-toggle')) {
        const colorInput = row.querySelector('.frosted-entry-color');
        colorInput.disabled = !e.target.checked;
        state[idx].color = e.target.checked ? colorInput.value : null;
      } else if (e.target.classList.contains('frosted-entry-color')) {
        state[idx].color = e.target.value;
      }
      if (onFieldChange) onFieldChange();
    });

    list.addEventListener('click', (e) => {
      const tintBtn = e.target.closest('.frosted-entry-tint');
      if (tintBtn) {
        const idx = parseInt(tintBtn.closest('.frosted-entry').dataset.index, 10);
        applyTint(idx, tintBtn, { t, showStatus, getCurrentLayer, onSaved: onStructuralChange });
        return;
      }
      const removeBtn = e.target.closest('.frosted-entry-remove');
      if (!removeBtn) return;
      const idx = parseInt(removeBtn.closest('.frosted-entry').dataset.index, 10);
      state.splice(idx, 1);
      render(state, t);
      if (onStructuralChange) onStructuralChange();
    });

    document.getElementById('edit-frosted-add-btn').addEventListener('click', () => {
      state.push({ selector: '', blur: 12, opacity: 55, color: null });
      render(state, t);
      if (onStructuralChange) onStructuralChange();
    });
  }

  root.PageDyeEditorFrosted = { normalize, render, collect, attachHandlers };
})(window);

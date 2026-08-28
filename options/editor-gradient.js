// Owns the gradient "stops" list widget in the site editor: the color-stop
// rows, their in-memory state, and reading the whole gradient panel
// (kind/angle/shape/stops/animated/speed) back into a settings object.
// Depends on window.PageDyeGradient (scripts/gradient.js) for MIN/MAX_STOPS.
// `t` (i18n lookup) and the save/preview callbacks are injected by the
// caller rather than assumed global, since this file loads before
// options.js defines them.
(function (root) {
  let stopsState = [];

  function normalize(stops) {
    return stops.map(s => ({ color: s.color, position: s.position }));
  }

  // Rebuilds the stop-row list from scratch; listeners are delegated on the
  // parent (see attachStopsListHandlers) since rows are recreated on every
  // add/remove.
  function render(stops, t) {
    stopsState = normalize(stops);
    const list = document.getElementById('edit-gradient-stops-list');
    list.innerHTML = '';

    stopsState.forEach((stop, idx) => {
      const row = document.createElement('div');
      row.className = 'gradient-stop-row';
      row.dataset.index = idx;

      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.className = 'gradient-stop-color';
      colorInput.value = stop.color;

      const hexInput = document.createElement('input');
      hexInput.type = 'text';
      hexInput.className = 'gradient-stop-hex';
      hexInput.value = stop.color;

      const posInput = document.createElement('input');
      posInput.type = 'number';
      posInput.className = 'gradient-stop-pos';
      posInput.min = '0';
      posInput.max = '100';
      posInput.value = stop.position;

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'gradient-stop-remove';
      removeBtn.textContent = '×';
      removeBtn.title = t ? t('gradientRemoveStop') : '';
      removeBtn.disabled = stopsState.length <= window.PageDyeGradient.MIN_STOPS;

      row.appendChild(colorInput);
      row.appendChild(hexInput);
      row.appendChild(posInput);
      row.appendChild(removeBtn);
      list.appendChild(row);
    });

    document.getElementById('edit-gradient-add-stop').disabled = stopsState.length >= window.PageDyeGradient.MAX_STOPS;
  }

  function getStops() {
    return normalize(stopsState);
  }

  function collect() {
    const kindRadio = document.querySelector('input[name="edit-gradientKind"]:checked');
    return {
      kind: kindRadio ? kindRadio.value : 'linear',
      angle: parseInt(document.getElementById('edit-gradient-angle').value, 10),
      shape: document.getElementById('edit-gradient-shape').value,
      stops: getStops(),
      animated: document.getElementById('edit-gradient-animated').checked,
      speed: parseInt(document.getElementById('edit-gradient-speed').value, 10)
    };
  }

  // onFieldChange fires after an in-place edit (color/hex/position typed into
  // an existing row) — same debounced-save timing the rest of the form uses.
  // onStructuralChange fires after a row is added or removed — these have
  // always saved immediately rather than waiting on the debounce.
  function attachStopsListHandlers({ t, onFieldChange, onStructuralChange } = {}) {
    document.getElementById('edit-gradient-add-stop').addEventListener('click', () => {
      if (stopsState.length >= window.PageDyeGradient.MAX_STOPS) return;
      const lastPos = stopsState.length ? stopsState[stopsState.length - 1].position : 0;
      stopsState.push({ color: '#ffffff', position: Math.min(100, lastPos + 10) });
      render(stopsState, t);
      if (onStructuralChange) onStructuralChange();
    });

    const list = document.getElementById('edit-gradient-stops-list');

    list.addEventListener('input', (e) => {
      const row = e.target.closest('.gradient-stop-row');
      if (!row) return;
      const idx = parseInt(row.dataset.index, 10);
      if (e.target.classList.contains('gradient-stop-color')) {
        row.querySelector('.gradient-stop-hex').value = e.target.value;
        stopsState[idx].color = e.target.value;
      } else if (e.target.classList.contains('gradient-stop-hex')) {
        row.querySelector('.gradient-stop-color').value = e.target.value;
        stopsState[idx].color = e.target.value;
      } else if (e.target.classList.contains('gradient-stop-pos')) {
        stopsState[idx].position = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
      }
      if (onFieldChange) onFieldChange();
    });

    list.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.gradient-stop-remove');
      if (!removeBtn) return;
      if (stopsState.length <= window.PageDyeGradient.MIN_STOPS) return;
      const idx = parseInt(removeBtn.closest('.gradient-stop-row').dataset.index, 10);
      stopsState.splice(idx, 1);
      render(stopsState, t);
      if (onStructuralChange) onStructuralChange();
    });
  }

  root.PageDyeEditorGradientStops = { render, collect, getStops, attachStopsListHandlers };
})(window);

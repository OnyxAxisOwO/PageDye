// Single source of truth for the 5 "advanced filter" sliders in the site
// editor (brightness/contrast/grayscale/hue/invert). Previously this list
// only drove the live-update listener; populate/collect/reset each
// re-implemented the same 5 fields by hand and could drift out of sync.
(function (root) {
  const FILTER_DEFS = [
    { key: 'brightness', id: 'edit-filter-brightness', valId: 'edit-filter-brightness-val', unit: '%',   default: 100, cssFn: 'brightness' },
    { key: 'contrast',   id: 'edit-filter-contrast',   valId: 'edit-filter-contrast-val',   unit: '%',   default: 100, cssFn: 'contrast' },
    { key: 'grayscale',  id: 'edit-filter-grayscale',  valId: 'edit-filter-grayscale-val',  unit: '%',   default: 0,   cssFn: 'grayscale' },
    { key: 'hue',        id: 'edit-filter-hue',        valId: 'edit-filter-hue-val',        unit: 'deg', default: 0,   cssFn: 'hue-rotate' },
    { key: 'invert',     id: 'edit-filter-invert',     valId: 'edit-filter-invert-val',     unit: '%',   default: 0,   cssFn: 'invert' }
  ];

  function populate(filters) {
    const f = filters || {};
    FILTER_DEFS.forEach(({ key, id, valId, unit, default: def }) => {
      const val = f[key] !== undefined ? f[key] : def;
      document.getElementById(id).value = val;
      document.getElementById(valId).textContent = `${val}${unit}`;
    });
  }

  function collect() {
    const out = {};
    FILTER_DEFS.forEach(({ key, id }) => {
      out[key] = parseInt(document.getElementById(id).value, 10);
    });
    return out;
  }

  function reset() {
    FILTER_DEFS.forEach(({ id, valId, unit, default: def }) => {
      document.getElementById(id).value = def;
      document.getElementById(valId).textContent = `${def}${unit}`;
    });
  }

  function attachLiveUpdate(onChange) {
    FILTER_DEFS.forEach(({ id, valId, unit }) => {
      document.getElementById(id).addEventListener('input', (e) => {
        document.getElementById(valId).textContent = `${e.target.value}${unit}`;
        onChange();
      });
    });
  }

  // Builds the non-default css filter() functions for the given values,
  // in the same fixed order the preview has always used. Blur is a
  // separate field (not part of this slider group) and stays the caller's
  // responsibility.
  function buildCssFilterList(values) {
    return FILTER_DEFS.map(({ key, default: def, cssFn }) => {
      const val = values[key];
      return val !== def ? `${cssFn}(${val}${key === 'hue' ? 'deg' : '%'})` : '';
    });
  }

  root.PageDyeEditorFilters = { FILTER_DEFS, populate, collect, reset, attachLiveUpdate, buildCssFilterList };
})(window);

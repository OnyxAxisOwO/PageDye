# Changelog

All notable changes to PageDye are documented here.

## [0.7] - 2026-07-07

### Fixed
- **Deep Compatibility Mode did nothing on sites tiled with many small opaque cards (e.g. Google's mobile search results)**: the scan only neutralized a single element that alone covered at least half the viewport, so on pages where the cover is instead a mosaic of small individually-opaque cards (each well under that threshold, as Google's own result cards are), nothing ever qualified and the background stayed hidden behind them. The scan now also tracks, per sampled grid point, the frontmost qualifying element regardless of its own size; if most sampled points land on some opaque element, every one of those frontmost elements is neutralized too, catching tiled covers the single-dominant-wrapper check couldn't see. Ported to both the extension and PageDye Lite.

## [0.6.3] - 2026-07-07

### Added
- **Deep Compatibility Mode**: an opt-in per-site toggle (extension and PageDye Lite) for sites like Google's mobile pages where several stacked opaque containers hide the background no matter which mode is used, because there's always another opaque layer sitting above whatever PageDye painted. Samples a grid of points across the viewport, finds elements whose background is opaque and whose box covers most of the viewport, and forces those backgrounds transparent — re-scanning on scroll, resize and DOM changes to keep up with dynamic pages. An optional exclude-selector field protects any element that turns out to need its background for contrast (e.g. a modal). Not available in the site's demo widget in this release.

## [0.6.2] - 2026-07-03

### Fixed
- **PageDye Lite panel could be covered by page dialogs/popovers and steal clicks**: the panel already re-parented itself to win z-index ties, but native `<dialog>` and Popover API elements (cookie banners, site modals) render in the browser's top layer, which always wins over z-index regardless of value. The panel now also enters the top layer itself (via the Popover API where supported) and re-asserts its position every time it opens, so it stays clickable above such overlays.
- **PageDye Lite panel background was translucent with a blur**: switched to a fully opaque background and removed the backdrop blur, so page content behind the panel can no longer bleed through or be mistaken for panel controls.

## [0.6.1] - 2026-07-02

### Changed
- **PageDye Lite's settings panel now matches the site demo widget's UI**: flat tabs and emoji icons are replaced with the same collapsible accordion sections, pill-style segmented controls, and outline SVG icons used by the widget — same panel header with a close button, same "start from a template" grouping (mode & slideshow / background / target element & custom CSS under the Wallpaper tab; frosted glass under its own tab; button appearance / drag & edge-snap / backup under Advanced). No settings, storage format, or feature was removed — this is a visual-only rebuild, and Lite's backup files remain interchangeable with the extension and the site widget's.

## [0.6.0] - 2026-07-02

### Added
- **Custom Effects API (extension only)**: write your own animated Canvas wallpaper and use it on any site next to the 16 built-in effects. A new "Custom Effects" page in the dashboard gives you a code editor with a live preview, two starter templates ported from the real Waves/Particles engines, and per-effect JSON export/import for sharing. Effects are authored as a plain `{init, resize, draw, onMouseMove?}` object — the same shape and `cfg`/density/speed/color controls as the built-ins — compiled locally, never fetched remotely.
- A broken custom effect fails safe: a runtime error freezes the wallpaper on its last good frame and stops instead of spamming errors or crashing the page.
- Not available in PageDye Lite (userscript) or the site's demo widget in this release.

## [0.5.6] - 2026-07-02

### Added
- **11 new animated wallpaper effects**: Aurora, Snow, Bubbles, Constellation, Fireflies, Grid Pulse, Rain, Confetti, Plasma, Vortex, and Typewriter (with a configurable text field) join the original five, across the extension, PageDye Lite, and the site's live demo widget — bringing the total to 16.
- **Site "三种使用方式" section**: the marketing site now explains the differences between the live demo widget, PageDye Lite, and the full extension, with a direct link to try the demo widget in place.

## [0.5.5] - 2026-07-02

### Fixed
- **PageDye Lite floating panel got covered by page content**: the gear button/panel now re-parents itself to stay the last element in the DOM (winning z-index ties against page overlays added afterward) and moves into the active fullscreen element when one is present, instead of relying solely on a static max z-index.
- **PageDye Lite settings panel was always dark**: the panel now follows `prefers-color-scheme` with light/dark CSS variables, matching the popup/options theming, instead of being hardcoded to a dark palette.
- **PageDye Lite: deleting an earlier slideshow frame could silently swap the live wallpaper**: removing a slide now shifts the "currently displayed" pointer along with the panel's edit cursor, instead of only adjusting the latter.
- **Wallpaper grid delete button unreachable on touch devices**: it only appeared on `:hover`, which touchscreens don't have; now also shown unconditionally on hover-incapable devices.
- **Settings import could wipe existing config on partial failure**: import now writes the new config and only then removes keys the backup doesn't mention, instead of clearing storage before validating the write succeeded.

### Added
- **Background color for animated effects**: Matrix/Particles/Waves/Starfield/Ripple effects had a hardcoded black canvas background regardless of the configured line/particle color. Added an independent "Background Color" control (extension popup, options page, and PageDye Lite) so these effects can be styled for light backgrounds too.

## [0.5.4] - 2026-07-02

### Fixed
- **PageDye Lite: no way to remove an uploaded image**: On touch devices (iPad, etc.) there was no equivalent of the full extension's "remove image" button once a local image was uploaded. Added a "✕ 删除当前图片" button under the image type editor that clears the current image.

## [0.5.3] - 2026-07-02

### Added
- **Mobile install docs**: README now covers installing PageDye Lite on Android (Edge / Firefox, both of which now support installing Tampermonkey from their extension stores) and iOS/iPadOS Safari (via the Userscripts app).

### Changed
- **PageDye Lite**: renamed the button-customization tab to "高级设置" (Advanced Settings) and moved backup export/import/reset and the about/version line into it; split "allow dragging" from "edge-snap hide" into independent toggles; fixed edge-snap hiding to dock flush against the screen edge instead of a barely-visible transform; capped the settings panel height so it stays a compact scrollable sheet on phones.

## [0.5.2] - 2026-07-02

### Added
- **Firefox Support**: PageDye now runs natively in Firefox 140+ and Firefox for Android 142+, alongside Chrome, Edge and other Chromium browsers. Added `browser_specific_settings.gecko` manifest keys, `::-moz-range-thumb` styling for range sliders, and standard `scrollbar-width`/`scrollbar-color` for cross-browser scrollbar styling.

## [0.5.1] - 2026-07-02

### Fixed
- **Settings Dashboard Unresponsive**: The full-page options dashboard ("PageDye 控制面板") was completely non-interactive — sidebar navigation, search, export/import, delete, and site editing all silently failed. Root cause: a variable was used before its `let` declaration in the same scope, throwing a `ReferenceError` during setup that aborted nearly all event listener registration. Also fixed several dangling references uncovered alongside it (missing Reset button listener, a status toast element that was never added to the page, and stale element IDs from the advanced-settings auto-expand logic).

## [0.5.0] - 2026-07-01

### Added
- **Frosted Glass (磨砂玻璃)**: Pick a card/container element and PageDye turns its background semi-transparent with a `backdrop-filter` blur, so the wallpaper shows through underneath — with its own selector, blur and tint controls, independent of the main background.
- **Effects (动效)**: A fourth background type alongside Color/Image — five minimalist black & white Canvas 2D animated wallpapers: Matrix rain, Particles (mouse-repel), Waves, Starfield and Ripple. Each has a customizable color, density and speed. Rendering pauses automatically when the tab is hidden or `prefers-reduced-motion` is set, to avoid wasting battery.
- **Tabbed popup/options layout**: The popup and options editor now split into "Wallpaper" and "Frosted Glass" tabs instead of one long scrolling list of accordions.

## [0.3.0] - 2026-07-01

### Added
- **Slideshow / Wallpaper Rotation (幻灯轮换)**: Configure multiple wallpapers that rotate automatically. Supports per-open, 15-minute, 30-minute, 1-hour and 1-day intervals, with optional random order.
- **Auto Light/Dark Wallpapers (昼夜双态联动)**: Configure separate backgrounds for Light and Dark modes. The extension automatically reads `prefers-color-scheme` and switches wallpapers when the system theme changes.
- **Advanced Image Filters (高级图片滤镜)**: Full CSS filter chain for image backgrounds — Brightness, Contrast, Grayscale, Hue-Rotate and Invert. Available in both the popup and the options dashboard. Each filter has a live-preview slider and a one-click Reset button.

### Fixed
- **Image Lost After Type Switch**: Switching background type Image → Color → Image no longer loses the previously uploaded image. The base64 data is now correctly restored from the in-memory settings when returning to the Image type.
- **Save Failure After Type Switch**: The auto-save triggered after switching back to Image type no longer overwrites the stored image with an empty value.
- **Popup / Options Data Sync**: `popup.js` now writes and reads the same `filters` sub-object structure as `options.js`, preventing mismatched storage data between the two interfaces.


## [0.2.7]

### Added
- **Interactive Domain Copying**: Click on the domain badge in the popup header to copy the active domain name directly to the clipboard.
- **Custom Styled Checkboxes**: Custom styled, premium checkboxes with smooth scale transitions, borders, and theme contrast integration across all interfaces.

### Fixed
- **Mobile Responsive Layouts**: Removed verbose "Back to Sites" text on mobile back-buttons for a clean square arrow icon layout. Prevented table cell text wrapping for background badge labels ("图片" / "纯色") and headers on small screens.
- **Fixed Position Label Wrapping**: Added wrapping prevention and flex-shrink rules on checkbox labels inside row control groups.

## [0.2.6]

### Added
- **Deep Site Customization**: Added support for clicking on any configured site domain name in the dashboard sites table to open a full settings editing page to perform deep customization and custom CSS.

### Fixed
- **Preview Opacity**: Fixed a bug where the opacity slider did not affect the image preview box inside the popup and options interfaces.

## [0.2.5]

### Changed
- **Responsive Settings Layout**: Adapted the options dashboard page to work beautifully on mobile with a top-bar tab navigation UI, and on desktop with a centered container wrapper.
- **Pure Black-and-White Theme**: Redesigned options page and popup UI color schemes to a pure black and white theme.
- **Scrollbar Styling**: Customized scrollbars for a cleaner, modern, and premium aesthetic.

## [0.2.4]

### Added
- **Options Dashboard Page**: A separate, full-page dashboard settings interface containing site management, backup/restore, and info.
- **Dark Mode Support**: Full support for prefers-color-scheme browser dark mode across all interfaces.
- **Backup & Restore**: One-click configuration backup and restore (including base64-encoded local images).

## [0.2.3]

### Fixed
- **Background Selector**: blur/opacity were lost after a page reload (they only
  showed right after picking/applying). Root cause: the content script runs at
  `document_start`, so its `<style>` is injected *before* the page's own
  stylesheets — and with equal specificity + `!important`, CSS breaks the tie by
  document order, letting the site's background win after a reload. The site's
  opaque background then covered the image/blur layer (which sits behind it).
  PageDye now scopes its selector-mode rules with `:root` to win on specificity
  regardless of stylesheet order, so blur/opacity survive reloads. The popup
  also re-injects the latest content script before saving, so an already-open
  tab can't keep applying stale logic.

## [0.2.2]

### Fixed
- **Background Selector**: blur/opacity were lost after a page reload (they
  worked right after applying, but not on refresh). Because the content script
  runs at `document_start`, our injected styles landed before the page's own
  stylesheets and lost the CSS document-order tiebreak to same-specificity
  `!important` site rules. The background is now re-applied once the document is
  ready so our styles end up last.

## [0.2.1]

### Fixed
- **Background Selector**: opacity, blur and fixed-position now work for image
  backgrounds in selector mode. The image is painted on a `::before` layer
  behind the element's content, so these effects no longer require dimming or
  blurring the element's own text/children (previously they were skipped).

## [0.2.0]

### Added
- **Background Selector** (advanced settings): pick an element with an
  AdGuard-style **element picker** (or type a CSS selector) and PageDye applies
  your color/image directly to *that element's* background with `!important`,
  instead of the full-page overlay. Useful when a site's own CSS makes the page
  background unreachable. The picked element updates immediately — no need to
  reopen the popup.
- **Custom CSS**: inject arbitrary CSS into the current site.
- **Clear All Sites**: remove the saved settings for every website in one click.
- Extension **version shown in the popup footer**.

### Changed
- The popup ensures the latest content script is running before picking, and the
  content script now reacts to `chrome.storage` changes, so settings (including
  "Clear All") apply live across open tabs without a reload.

## [0.0.1]

### Added
- Per-site custom backgrounds (solid color or image via local file / URL).
- Opacity, blur, fixed/scroll, size and repeat controls.
- English / Chinese UI based on browser language.

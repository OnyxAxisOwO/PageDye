# Changelog

All notable changes to PageDye are documented here.

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

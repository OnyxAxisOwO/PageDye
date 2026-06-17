# Changelog

All notable changes to PageDye are documented here.

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

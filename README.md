# PageDye

PageDye is an open-source browser extension that allows you to set custom backgrounds (images or solid colors) for any website.

## Features

- **Custom Backgrounds**: Set a background image (URL or local file) or a solid color for any domain.
- **Per-Site Settings**: Configurations are saved independently for each website.
- **Style Controls**: Adjust opacity, blur (image mode only), and fixed/scroll behavior.
- **Background Selector**: On sites where the page background is hard to reach (covered by another element's CSS), use the **element picker** (AdGuard-style) to click an element — PageDye then applies your color/image directly to *that element's* background with `!important`, instead of the full-page layer. You can also type a CSS selector manually.
- **Custom CSS**: Inject your own CSS into any site for fine-grained tweaks.
- **Clear All**: One click wipes the saved settings for every website.
- **i18n Support**: Automatically switches between English and Chinese based on browser language.
- **Privacy Focused**: No tracking, no ads, no internet permissions required for core functionality (images are stored locally).

## Installation

### Chrome / Edge / Brave

1.  Download or clone this repository.
2.  Open your browser's extensions page (`chrome://extensions`).
3.  Enable **Developer mode** in the top right corner.
4.  Click **Load unpacked**.
5.  Select the folder containing this project.

### Firefox

1.  Open `about:debugging#/runtime/this-firefox`.
2.  Click **Load Temporary Add-on...**.
3.  Select the `manifest.json` file from this project.

## Usage

1.  Go to any website (e.g., google.com).
2.  Click the PageDye extension icon.
3.  Choose **Color** or **Image**.
    *   **Color**: Pick a solid color.
    *   **Image**: Drag & drop a local file (default) or paste an image URL.
4.  Adjust **Opacity** and **Blur** (for images) to your liking.
5.  Click **Save**.

### Advanced

Open the **Advanced** section at the bottom of the popup for:

-   **Background Selector**: Choose a color or image, then click **Pick** and click an element on the page — PageDye applies the background directly to that element (rather than the whole page), and the change shows immediately. (You can also enter a CSS selector by hand, e.g. `#app, .layout-bg`.) Note: in selector mode, opacity applies to colors only; blur is not applied. Leave the selector empty for a full-page background with full opacity/blur control.
-   **Custom CSS**: Write CSS that gets injected into the current site.
-   **Clear All Sites**: Remove every saved PageDye configuration in one click.

## Releases

Tagged releases are built automatically by [GitHub Actions](.github/workflows/release.yml): pushing a `vX.Y.Z` tag (matching the `manifest.json` version) packages the extension into a `.zip` and publishes it as a GitHub Release. See the [CHANGELOG](CHANGELOG.md) for what changed.

## License

Released under the [MIT License](LICENSE).

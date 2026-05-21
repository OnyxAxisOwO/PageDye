# PageDye

PageDye is an open-source browser extension that allows you to set custom backgrounds (images or solid colors) for any website.

## Features

- **Custom Backgrounds**: Set a background image (URL or local file) or a solid color for any domain.
- **Per-Site Settings**: Configurations are saved independently for each website.
- **Style Controls**: Adjust opacity, blur (image mode only), and fixed/scroll behavior.
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

## License

MIT

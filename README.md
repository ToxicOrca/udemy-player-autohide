# Udemy Player Auto-Hide

> **Disclaimer:** This is an unofficial, community-built extension. It is not affiliated with, endorsed by, or associated with Udemy, Inc. in any way. "Udemy" is a trademark of Udemy, Inc., used here solely to describe the site this extension targets.

Chrome extension (Manifest V3) that auto-hides the Udemy video player controls and mouse cursor after 2.5 seconds of inactivity during playback. Udemy's built-in auto-hide doesn't always work, leaving the control bar visible throughout lectures — this extension fixes that.

## Features

- **Auto-hide controls + cursor** after ~2.5s of no mouse movement while a video is playing
- **Prev/next lecture arrows** also fade out with the controls
- **Instant reveal** on any mouse movement, with a smooth opacity transition
- **Pause-aware** — controls stay visible whenever the video is paused or ended
- **Fullscreen support** — works in both normal and fullscreen mode
- **SPA-safe** — re-initializes automatically when navigating between lectures
- **Toggle on/off** via the extension popup icon

## Install (Load Unpacked)

Works on any Chromium-based browser — Chrome, Edge, and Brave — since they all support unpacked Manifest V3 extensions.

1. Clone the repository (or download the ZIP):
   ```
   git clone https://github.com/ToxicOrca/udemy-player-autohide.git
   ```
2. Open Chrome, Edge, Brave, or any Chromium-based browser and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked**
5. Select the extension folder
6. Navigate to any Udemy course lecture — the extension activates automatically

## Privacy

This extension:
- Makes **zero network requests**
- Collects and transmits **no user data**
- Only uses `chrome.storage.local` to persist the on/off toggle
- Runs exclusively on `udemy.com/course/*` pages

## Troubleshooting

If the control bar isn't hiding, Udemy may have changed their DOM structure. Open DevTools on a lecture page, inspect the control bar element, and check whether the extension's `.udemy-autohide-target` class is being applied to it. If not, the control-bar discovery logic in `content.js` may need updating.

## Files

| File | Purpose |
|------|---------|
| `manifest.json` | Extension manifest (MV3) |
| `content.js` | Content script — finds video, manages hide timer, tags control elements |
| `content.css` | Injected styles — opacity transitions driven by `.uphide-controls-hidden` and `body.uphide-idle` |
| `popup.html/js` | Toggle switch popup |
| `icons/` | Extension icons, 16/48/128px |
| `.gitignore` | Ignored files for git |
| `LICENSE` | MIT License |

## License

[MIT](LICENSE)

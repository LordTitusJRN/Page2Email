# Page2Email

> **Capture the current page as a screenshot or PDF and email it instantly.**

![Page2Email popup UI](https://github.com/user-attachments/assets/3dbfc521-0fbd-43b0-a47c-cc106b1f8b7a)

Never lose the "confirmation page" again. With one click, Page2Email saves the
active tab as a PNG screenshot or triggers your browser's PDF print dialog, then
opens your preferred mail compose window (default mail app, Gmail, or Outlook
Web) with the subject and body pre-filled so you can send receipts, payment
confirmations, submitted forms, and bookings to yourself or your team in
seconds.

---

## Features

| Feature | Details |
|---|---|
| **Screenshot capture** | Captures the visible tab area as a PNG using `chrome.tabs.captureVisibleTab` and downloads it automatically |
| **PDF capture** | Triggers the browser's built-in print dialog so you can choose *Save as PDF* |
| **Default mail app** | Opens a `mailto:` link with subject + body pre-filled |
| **Gmail** | Opens Gmail compose in a new tab with subject, body, and To pre-filled |
| **Outlook Web** | Opens Outlook Web compose in a new tab with subject, body, and To pre-filled |
| **Auto-generated subject** | `{Page title} – {hostname} – {Date}` |
| **Notes / body** | Add expense codes, ticket numbers, or any freeform text |
| **"Send to me"** | Save your own address once; press *Me* to fill the To field instantly |
| **Persistent settings** | Recipients and your email are saved via `chrome.storage.sync` |

---

## Installation (development / unpacked)

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the repository root folder.
5. The Page2Email icon appears in your toolbar.

---

## Usage

1. Navigate to any page you want to capture (receipt, confirmation, form, etc.).
2. Click the **Page2Email** toolbar icon.
3. Choose **Capture format**: *Screenshot* (PNG) or *PDF* (print dialog).
4. Choose **Send via**: *Default email app*, *Gmail*, or *Outlook*.
5. Fill in recipients, adjust the subject, and add any notes.
6. Click **📸 Capture & Send** (or **📄 Print to PDF & Send**).
   - For screenshots: the PNG is downloaded automatically; attach it in the
     compose window that opens.
   - For PDF: choose *Save as PDF* in the print dialog, then attach the saved
     file in the compose window.

---

## Project structure

```
manifest.json          Chrome Extension Manifest V3
src/
  popup.html           Extension popup UI
  popup.css            Popup styles
  popup.js             Popup logic (capture + email dispatch)
  background.js        MV3 service worker
  content.js           Content script (triggers print dialog for PDF)
  utils.js             Pure helper functions (subject, URL, filename builders)
icons/
  icon16.png
  icon32.png
  icon48.png
  icon128.png
tests/
  utils.test.js        Jest unit tests for src/utils.js
package.json
```

---

## Running tests

```bash
npm install
npm test
```

All utility functions (`generateSubject`, `buildMailtoUrl`, `buildGmailUrl`,
`buildOutlookUrl`, `generateFilename`) are covered by Jest unit tests with no
browser-API dependencies.

---

## Permissions used

| Permission | Reason |
|---|---|
| `activeTab` | Read the current tab's title and URL |
| `tabs` | Call `captureVisibleTab` for screenshots |
| `scripting` | Inject content script on demand |
| `downloads` | Save the screenshot PNG to disk |
| `storage` | Persist "my email" and last recipients via `chrome.storage.sync` |

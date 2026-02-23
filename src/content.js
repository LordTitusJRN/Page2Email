/**
 * content.js – Page2Email content script.
 *
 * Listens for messages from the popup and triggers browser print dialog
 * when a PDF capture is requested.
 */

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message && message.type === 'PAGE2EMAIL_PRINT') {
    window.print();
    sendResponse({ ok: true });
  }
  // Return true to keep the message channel open for async sendResponse
  return true;
});

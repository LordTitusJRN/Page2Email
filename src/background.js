/**
 * background.js – Page2Email MV3 service worker.
 *
 * Currently minimal: the main capture logic lives in popup.js.
 * The service worker is registered so Chrome can handle any future
 * background events (e.g. context menus, keyboard shortcuts).
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Page2Email] Extension installed / updated.');
});

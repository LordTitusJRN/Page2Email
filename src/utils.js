/**
 * Pure utility functions for Page2Email.
 * These functions have no browser-API dependencies so they can be unit-tested
 * with Node.js / Jest without any mocking.
 */

/**
 * Generate an email subject line from the page title, host and date.
 * @param {string} title  – document.title of the captured tab
 * @param {string} url    – full URL of the captured tab
 * @param {Date}   [date] – capture timestamp (defaults to now)
 * @returns {string}
 */
function generateSubject(title, url, date = new Date()) {
  const dateStr = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const host = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  })();
  const safeTitle = (title || host || 'Page').trim().slice(0, 80);
  return `${safeTitle} – ${host} – ${dateStr}`;
}

/**
 * Build a mailto: URL with pre-filled subject and body.
 * @param {string[]} recipients
 * @param {string}   subject
 * @param {string}   body
 * @returns {string}
 */
function buildMailtoUrl(recipients, subject, body) {
  const to = recipients.filter(Boolean).join(',');
  const params = new URLSearchParams({ subject, body });
  // URLSearchParams uses '+' for spaces; mailto needs '%20'
  return `mailto:${encodeURIComponent(to)}?${params.toString().replace(/\+/g, '%20')}`;
}

/**
 * Build a Gmail compose URL with pre-filled fields.
 * @param {string[]} recipients
 * @param {string}   subject
 * @param {string}   body
 * @returns {string}
 */
function buildGmailUrl(recipients, subject, body) {
  const to = recipients.filter(Boolean).join(',');
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to,
    su: subject,
    body,
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

/**
 * Build an Outlook Web compose URL with pre-filled fields.
 * @param {string[]} recipients
 * @param {string}   subject
 * @param {string}   body
 * @returns {string}
 */
function buildOutlookUrl(recipients, subject, body) {
  const to = recipients.filter(Boolean).join(';');
  const params = new URLSearchParams({
    subject,
    body,
    to,
  });
  return `https://outlook.office.com/mail/deeplink/compose?${params.toString()}`;
}

/**
 * Generate a safe filename for the captured file.
 * @param {string} title   – document.title
 * @param {'screenshot'|'pdf'} format
 * @param {Date}   [date]
 * @returns {string}  e.g. "My-Page-2025-01-15.png"
 */
function generateFilename(title, format, date = new Date()) {
  const dateStr = date.toISOString().slice(0, 10); // YYYY-MM-DD
  const safeName = (title || 'page')
    .trim()
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60);
  const ext = format === 'pdf' ? 'pdf' : 'png';
  return `${safeName}-${dateStr}.${ext}`;
}

// Export for Node.js / Jest environments; no-op in browser extension context.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateSubject, buildMailtoUrl, buildGmailUrl, buildOutlookUrl, generateFilename };
}

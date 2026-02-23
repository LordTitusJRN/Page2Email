/**
 * popup.js – Page2Email popup logic.
 *
 * Relies on utils.js being loaded before this script (via popup.html script order).
 */

/* ─── DOM references ─────────────────────────────────────────────── */
const fmtScreenshot = document.getElementById('fmt-screenshot');
const fmtPdf = document.getElementById('fmt-pdf');
const methodMailto = document.getElementById('method-mailto');
const methodGmail = document.getElementById('method-gmail');
const methodOutlook = document.getElementById('method-outlook');
const recipientsInput = document.getElementById('recipients');
const subjectInput = document.getElementById('subject');
const notesInput = document.getElementById('notes');
const btnCapture = document.getElementById('btn-capture');
const btnCaptureText = document.getElementById('btn-capture-text');
const btnSpinner = document.getElementById('btn-spinner');
const btnSendToMe = document.getElementById('btn-send-to-me');
const btnToggleSettings = document.getElementById('btn-toggle-settings');
const sectionSaveMe = document.getElementById('section-save-me');
const myEmailInput = document.getElementById('my-email');
const btnSaveMe = document.getElementById('btn-save-me');
const saveMeStatus = document.getElementById('save-me-status');
const statusEl = document.getElementById('status');

/* ─── Initialise popup ───────────────────────────────────────────── */
async function init() {
  // Restore saved "my email" and pre-fill subject from active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const stored = await chrome.storage.sync.get(['myEmail', 'lastRecipients']);

  if (stored.myEmail) {
    myEmailInput.value = stored.myEmail;
  }
  if (stored.lastRecipients) {
    recipientsInput.value = stored.lastRecipients;
  }

  if (tab) {
    subjectInput.value = generateSubject(tab.title || '', tab.url || '');
  }

  updateCaptureButton();
}

/* ─── Update capture button label ───────────────────────────────── */
function updateCaptureButton() {
  const format = fmtPdf.checked ? 'pdf' : 'screenshot';
  btnCaptureText.textContent = format === 'pdf' ? '📄 Print to PDF & Send' : '📸 Capture & Send';
}

fmtScreenshot.addEventListener('change', updateCaptureButton);
fmtPdf.addEventListener('change', updateCaptureButton);

/* ─── "Send to me" ───────────────────────────────────────────────── */
btnSendToMe.addEventListener('click', async () => {
  const stored = await chrome.storage.sync.get('myEmail');
  if (stored.myEmail) {
    recipientsInput.value = stored.myEmail;
  } else {
    sectionSaveMe.hidden = false;
    myEmailInput.focus();
    showStatus('Enter your email address below and click Save.', 'info');
  }
});

/* ─── Settings panel ─────────────────────────────────────────────── */
btnToggleSettings.addEventListener('click', () => {
  sectionSaveMe.hidden = !sectionSaveMe.hidden;
  if (!sectionSaveMe.hidden) myEmailInput.focus();
});

btnSaveMe.addEventListener('click', async () => {
  const email = myEmailInput.value.trim();
  if (!email) {
    saveMeStatus.textContent = 'Please enter an email address.';
    return;
  }
  await chrome.storage.sync.set({ myEmail: email });
  saveMeStatus.textContent = '✅ Saved!';
  setTimeout(() => { saveMeStatus.textContent = ''; }, 2000);
});

/* ─── Main capture & send flow ───────────────────────────────────── */
btnCapture.addEventListener('click', async () => {
  try {
    setLoading(true);
    clearStatus();

    const format = fmtPdf.checked ? 'pdf' : 'screenshot';
    const method = methodGmail.checked ? 'gmail' : methodOutlook.checked ? 'outlook' : 'mailto';
    const recipients = recipientsInput.value
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const subject = subjectInput.value.trim() || 'Page capture';
    const notes = notesInput.value.trim();

    // Persist recipients for next time
    if (recipients.length) {
      await chrome.storage.sync.set({ lastRecipients: recipientsInput.value.trim() });
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) throw new Error('No active tab found.');

    if (format === 'pdf') {
      await handlePdfCapture(tab, method, recipients, subject, notes);
    } else {
      await handleScreenshotCapture(tab, method, recipients, subject, notes);
    }
  } catch (err) {
    showStatus(`❌ ${err.message}`, 'error');
  } finally {
    setLoading(false);
  }
});

/* ─── Screenshot capture ─────────────────────────────────────────── */
async function handleScreenshotCapture(tab, method, recipients, subject, notes) {
  // Capture visible tab as PNG data URL
  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });

  // Download the PNG file
  const filename = generateFilename(tab.title || 'page', 'screenshot');
  const downloadId = await new Promise((resolve, reject) => {
    chrome.downloads.download(
      { url: dataUrl, filename, saveAs: false },
      (id) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(id);
        }
      }
    );
  });

  // Build body text
  const body = buildEmailBody(tab, notes, filename);

  // Open compose window
  openCompose(method, recipients, subject, body);

  showStatus(
    `✅ Screenshot saved as <strong>${filename}</strong>.<br>Compose window opened — attach the downloaded file to send it.`,
    'success'
  );
}

/* ─── PDF capture ────────────────────────────────────────────────── */
async function handlePdfCapture(tab, method, recipients, subject, notes) {
  // Trigger the system print dialog via a content script message so the user
  // can choose "Save as PDF" in their OS print dialog.
  await chrome.tabs.sendMessage(tab.id, { type: 'PAGE2EMAIL_PRINT' });

  // Build body text
  const filename = generateFilename(tab.title || 'page', 'pdf');
  const body = buildEmailBody(tab, notes, filename);

  // Open compose window after a brief delay to let the print dialog settle
  setTimeout(() => openCompose(method, recipients, subject, body), 600);

  showStatus(
    '📄 Print dialog opened — choose <strong>Save as PDF</strong>, then attach the saved file to your email.',
    'info'
  );
}

/* ─── Helpers ────────────────────────────────────────────────────── */
function buildEmailBody(tab, notes, filename) {
  const lines = [
    `Page: ${tab.title || '(no title)'}`,
    `URL: ${tab.url || ''}`,
    `Captured: ${new Date().toLocaleString()}`,
    '',
    notes ? `Notes:\n${notes}` : '',
    '',
    `Attachment: ${filename}`,
    '',
    '—',
    'Sent with Page2Email Chrome Extension',
  ];
  return lines.filter(Boolean).join('\n');
}

function openCompose(method, recipients, subject, body) {
  let url;
  if (method === 'gmail') {
    url = buildGmailUrl(recipients, subject, body);
  } else if (method === 'outlook') {
    url = buildOutlookUrl(recipients, subject, body);
  } else {
    url = buildMailtoUrl(recipients, subject, body);
  }

  if (method === 'mailto') {
    // mailto opens the default mail client; use window.location for same context
    window.location.href = url;
  } else {
    chrome.tabs.create({ url });
  }
}

function setLoading(loading) {
  btnCapture.disabled = loading;
  btnCaptureText.hidden = loading;
  btnSpinner.hidden = !loading;
}

function showStatus(html, type = 'info') {
  statusEl.innerHTML = html;
  statusEl.className = `status ${type}`;
  statusEl.hidden = false;
}

function clearStatus() {
  statusEl.hidden = true;
  statusEl.innerHTML = '';
  statusEl.className = 'status';
}

/* ─── Boot ───────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', init);

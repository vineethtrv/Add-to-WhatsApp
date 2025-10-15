const mobileNumberEl = document.getElementById('mobile-number');
const sendBtn = document.getElementById('send-btn');

const DEFAULT_CC = '91'; // India default

// --- Helpers ---

/** Normalize Unicode to ASCII and keep only 0-9. */
function sanitizeToDigits(raw) {
  if (!raw) return '';
  return String(raw)
    .normalize('NFKC')     // converts full-width characters (e.g., １２３＋) to ASCII
    .replace(/\D+/g, '');  // remove anything not 0-9 (spaces, +, punctuation, NBSP, etc.)
}

/** Sanitize the whole value and preserve caret relative to digits. */
function sanitizeInputValuePreserveCaret(el) {
  const prev = el.value ?? '';
  let selStart = el.selectionStart;
  let selEnd = el.selectionEnd;

  // Fall back if selection not supported (rare)
  if (selStart == null || selEnd == null) {
    selStart = selEnd = prev.length;
  }

  // Split into before/selected/after ranges to compute new caret correctly
  const before = prev.slice(0, selStart);
  const selected = prev.slice(selStart, selEnd);
  const after = prev.slice(selEnd);

  const sanitizedBefore = sanitizeToDigits(before);
  const sanitizedSelected = sanitizeToDigits(selected);
  const sanitizedAfter = sanitizeToDigits(after);

  const next = sanitizedBefore + sanitizedSelected + sanitizedAfter;
  const newCaret = (sanitizedBefore + sanitizedSelected).length;

  if (prev !== next) {
    el.value = next;
    // Restore caret
    try { el.setSelectionRange(newCaret, newCaret); } catch {}
  }
  return next;
}

/**
 * Convert user-entered text to a wa.me-friendly number (digits only).
 * Rules:
 * - Remove '00' international prefix.
 * - If it's 10 digits (Indian mobile), prepend DEFAULT_CC.
 * - If it's 11 digits and starts with '0' followed by 10-digit mobile, drop 0 and prepend DEFAULT_CC.
 */
function normalizeForWhatsApp(raw) {
  let n = sanitizeToDigits(raw);

  // Handle '00' international prefix
  if (n.startsWith('00')) n = n.slice(2);

  // If starts with default CC and then 10 digits, keep as-is
  if (n.startsWith(DEFAULT_CC) && /^\d{12}$/.test(n)) {
    return n;
  }

  // Handle Indian trunk prefix "0" before mobile number (e.g., 09876543210)
  if (n.length === 11 && n.startsWith('0') && /^[6-9]\d{9}$/.test(n.slice(1))) {
    n = DEFAULT_CC + n.slice(1);
    return n;
  }

  // If user typed 10 digits (typical Indian mobile), prepend default country code
  if (n.length === 10 && /^[6-9]\d{9}$/.test(n)) {
    n = DEFAULT_CC + n;
  }

  return n;
}

// Strict-ish India validation (E.164 without '+')
function isValidIndianNumber(n) {
  // 91 + 10 digits starting with 6-9
  return /^91[6-9]\d{9}$/.test(n);
}

function updateBtnStateFromCurrentValue() {
  const n = normalizeForWhatsApp(mobileNumberEl.value);
  sendBtn.disabled = !isValidIndianNumber(n);
}

function updateOnInput() {
  sanitizeInputValuePreserveCaret(mobileNumberEl);
  updateBtnStateFromCurrentValue();
}

function openWhatsApp() {
  // Final sanitize/normalize just before navigation
  sanitizeInputValuePreserveCaret(mobileNumberEl);
  const number = normalizeForWhatsApp(mobileNumberEl.value);

  if (!isValidIndianNumber(number)) {
    alert('Please enter a valid Indian mobile number with/without country code.');
    return;
  }

  const url = `https://wa.me/${number}`;

  // Prefer same-tab navigation (reliable on iOS & PWA)
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone;

  if (isStandalone) {
    window.location.href = url;
  } else {
    // Same-tab is more reliable on iOS than window.open
    window.location.href = url;
  }
}

// --- Events ---

// Clean as the user types or pastes
mobileNumberEl.addEventListener('input', updateOnInput);

// Robust paste handling: manually insert sanitized clipboard (works well on iOS)
mobileNumberEl.addEventListener('paste', (e) => {
  // Prevent default paste; we'll insert a cleaned version ourselves.
  e.preventDefault();

  let text = '';

  // Modern browsers (including iOS 15+ Safari)
  if (e.clipboardData && e.clipboardData.getData) {
    text = e.clipboardData.getData('text');
  // Legacy IE (not needed on iOS, kept for completeness)
  } else if (window.clipboardData && window.clipboardData.getData) {
    text = window.clipboardData.getData('Text');
  }

  // As a fallback, if clipboard inaccessible, defer sanitize to input handler
  if (typeof text !== 'string') {
    // Let the default paste go through in next tick (shouldn't happen often)
    requestAnimationFrame(updateOnInput);
    return;
  }

  const insert = sanitizeToDigits(text);

  const el = mobileNumberEl;

  // Current selection/caret
  let start = el.selectionStart ?? el.value.length;
  let end = el.selectionEnd ?? el.value.length;

  // Build new value explicitly; also sanitize the non-selected parts
  const before = sanitizeToDigits(el.value.slice(0, start));
  const after = sanitizeToDigits(el.value.slice(end));

  const next = before + insert + after;
  el.value = next;

  // Place caret after inserted content
  const newCaret = (before + insert).length;
  try { el.setSelectionRange(newCaret, newCaret); } catch {}

  updateBtnStateFromCurrentValue();
});

// Optional: type filter for *keyboard typing only* (do NOT block paste)
mobileNumberEl.addEventListener('beforeinput', (e) => {
  // Allow deletes and system edits
  if (!e.inputType) return;

  // Only gate raw text insertions; let paste/compositions go through
  if (e.inputType === 'insertText' || e.inputType === 'insertCompositionText') {
    const data = typeof e.data === 'string' ? e.data.normalize('NFKC') : '';
    if (data && /\D/.test(data)) {
      e.preventDefault(); // block non-digits typed from keyboard
    }
  }
});

mobileNumberEl.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === 'Go') && !sendBtn.disabled) {
    e.preventDefault();
    openWhatsApp();
  }
});

// If input is inside a <form>, prevent default submit and open WhatsApp
const form = mobileNumberEl.closest('form');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    openWhatsApp();
  });
}

sendBtn.addEventListener('click', (e) => {
  e.preventDefault();
  openWhatsApp();
});

// --- Placeholder Animation (unchanged, minor tidy) ---
let wordIndex = 0;
let pctIndex = 0;
const placeholderTexts = ['Enter Phone Number', 'With Dial Code...', '91 9876543210'];

setInterval(() => {
  if ((placeholderTexts[pctIndex].length - 1) >= wordIndex) {
    wordIndex++;
  } else {
    wordIndex = 0;
    pctIndex = (pctIndex + 1) % placeholderTexts.length;
  }
  mobileNumberEl.placeholder = placeholderTexts[pctIndex].substr(0, wordIndex);
}, 200);
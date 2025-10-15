const mobileNumberEl = document.getElementById('mobile-number');
const sendBtn = document.getElementById('send-btn');

const DEFAULT_CC = '91'; // India default

// --- Helpers ---

/**
 * Normalize Unicode to ASCII (NFKC) and keep only 0-9.
 * This removes spaces, +, punctuation, NBSP, narrow NBSP, etc.
 * Also converts full-width digits (０１２…) to ASCII (012…).
 */
function sanitizeToDigits(raw) {
  if (!raw) return '';
  return raw
    .normalize('NFKC')     // convert full-width chars to ASCII
    .replace(/\D+/g, '');  // drop anything that's not 0-9
}

/**
 * Sanitize the input element value in-place, return sanitized value.
 * Call this on input/paste to visually remove spaces/+ on iPhone.
 */
function sanitizeInputValue() {
  const prev = mobileNumberEl.value;
  const next = sanitizeToDigits(prev);
  if (prev !== next) {
    const selEnd = mobileNumberEl.selectionEnd;
    mobileNumberEl.value = next;
    // Move caret to end (simple, robust)
    mobileNumberEl.setSelectionRange(next.length, next.length);
  }
  return mobileNumberEl.value;
}

function normalizeForWhatsApp(raw) {
  let n = sanitizeToDigits(raw);

  // Handle '00' international prefix
  if (n.startsWith('00')) n = n.slice(2);

  // If user typed 10 digits (typical Indian mobile), prepend default country code
  if (n.length === 10) n = DEFAULT_CC + n;

  return n;
}

// Strict-ish India validation. Adjust by market if needed.
function isValidIndianNumber(n) {
  // 91 + 10 digits starting with 6-9
  return /^91[6-9]\d{9}$/.test(n);
}

function updateBtnState() {
  // Sanitize the visible input first (so iPhone shows cleaned value)
  sanitizeInputValue();
  const n = normalizeForWhatsApp(mobileNumberEl.value);
  sendBtn.disabled = !isValidIndianNumber(n);
}

function openWhatsApp() {
  // Final sanitize/normalize
  sanitizeInputValue();
  const number = normalizeForWhatsApp(mobileNumberEl.value);

  if (!isValidIndianNumber(number)) {
    alert('Please enter a valid Indian mobile number with/without country code.');
    return;
  }

  const url = `https://wa.me/${number}`;

  // In standalone PWA mode, prefer same-tab navigation (avoids popup blocks)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (isStandalone) {
    window.location.href = url;
  } else {
    // Same-tab also works well on iOS; but if you prefer a new tab:
    // window.open(url, '_blank', 'noopener,noreferrer');
    window.location.href = url;
  }
}

// --- Events ---

// Clean as the user types or pastes (iPhone-safe)
mobileNumberEl.addEventListener('input', updateBtnState);
mobileNumberEl.addEventListener('paste', (e) => {
  // Delay to let paste complete, then sanitize & validate
  requestAnimationFrame(updateBtnState);
});

// Optional: Block non-digits before they enter (best-effort)
mobileNumberEl.addEventListener('beforeinput', (e) => {
  // e.data can be null (delete), so guard
  if (typeof e.data === 'string' && /\D/.test(e.data.normalize('NFKC'))) {
    e.preventDefault();
  }
});

mobileNumberEl.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === 'Go') && !sendBtn.disabled) {
    e.preventDefault();
    openWhatsApp();
  }
});

// If your input sits inside a <form>, also catch submit:
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
``
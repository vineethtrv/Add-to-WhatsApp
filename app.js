const mobileNumberEl = document.getElementById('mobile-number');
const sendBtn = document.getElementById('send-btn');

const DEFAULT_CC = '91'; // India as default

// --- Helpers ---
const digitsOnly = (s) => s.replace(/[^\d]/g, ''); // strip everything except 0-9

function normalizeForWhatsApp(raw) {
  let n = digitsOnly(raw);

  // Handle international prefix '00'
  if (n.startsWith('00')) n = n.slice(2);

  // If user typed 10 digits (typical Indian mobile), prepend default country code
  if (n.length === 10) n = DEFAULT_CC + n;

  return n;
}

// Strict-ish India validation. Adjust as per your target markets.
function isValidIndianNumber(n) {
  // 91 + 10 digits starting with 6-9
  return /^91[6-9]\d{9}$/.test(n);
}

// If you want to allow any country (loosely), use this instead:
// function isValidIntl(n) { return /^\d{8,15}$/.test(n); } // WhatsApp generally expects international format (no +)

/**
 * Enable/disable send button based on validity
 */
function updateBtnState() {
  const n = normalizeForWhatsApp(mobileNumberEl.value);
  sendBtn.disabled = !isValidIndianNumber(n);
}

function openWhatsApp() {
  const number = normalizeForWhatsApp(mobileNumberEl.value);

  if (!isValidIndianNumber(number)) {
    // Guard: should not happen if button state is managed, but just in case
    alert('Please enter a valid Indian mobile number with/without country code.');
    return;
  }

  // Optional preset message
  // const text = encodeURIComponent('Hi!');
  // const url = `https://wa.me/${number}?text=${text}`;

  const url = `https://wa.me/${number}`;

  // In standalone PWA mode, prefer same-tab navigation
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (isStandalone) {
    window.location.href = url;
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

// --- Events ---
mobileNumberEl.addEventListener('input', updateBtnState);

mobileNumberEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !sendBtn.disabled) {
    e.preventDefault();
    openWhatsApp();
  }
});

sendBtn.addEventListener('click', (e) => {
  e.preventDefault();
  openWhatsApp();
});

// --- Placeholder Animation (fixed) ---
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
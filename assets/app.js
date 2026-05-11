// ============================================================================
// Funil de estudo — landing page (Funil Solo)
// Modal de lead + captura de UTMs + redirect para checkout Kiwify
// ============================================================================

// >>> TROQUE PELO SEU LINK DE CHECKOUT KIWIFY <<<
const KIWIFY_CHECKOUT_URL = "https://pay.kiwify.com.br/SEU_LINK_AQUI";

const TRACKING_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "fbclid",
  "gclid",
  "ttclid",
  "s1",
  "s2",
  "s3",
  "s4",
];

const LS_TRACKING = "funil:tracking";
const LS_LEAD = "funil:lead";

// ---------- Tracking ---------------------------------------------------------

function captureTracking() {
  const url = new URL(window.location.href);
  const captured = {};
  for (const key of TRACKING_KEYS) {
    const value = url.searchParams.get(key);
    if (value) captured[key] = value;
  }

  if (Object.keys(captured).length === 0) return loadTracking();

  const merged = { ...loadTracking(), ...captured, _ts: Date.now() };
  if (document.referrer && !merged.referrer) merged.referrer = document.referrer;

  try {
    localStorage.setItem(LS_TRACKING, JSON.stringify(merged));
  } catch (_) {
    /* localStorage indisponível — segue só com a sessão */
  }
  return merged;
}

function loadTracking() {
  try {
    return JSON.parse(localStorage.getItem(LS_TRACKING) || "{}");
  } catch (_) {
    return {};
  }
}

// ---------- Helpers ----------------------------------------------------------

function normalizePhone(raw) {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55")) return digits;
  return "55" + digits;
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function setInvalid(input, invalid) {
  input.setAttribute("aria-invalid", invalid ? "true" : "false");
}

function buildCheckoutUrl(lead, tracking) {
  const url = new URL(KIWIFY_CHECKOUT_URL);
  url.searchParams.set("name", lead.name);
  url.searchParams.set("email", lead.email);
  url.searchParams.set("phone", lead.phone);
  for (const [key, value] of Object.entries(tracking)) {
    if (key.startsWith("_")) continue;
    if (typeof value === "string" && value) url.searchParams.set(key, value);
  }
  return url.toString();
}

// ---------- Modal ------------------------------------------------------------

const modal = document.getElementById("lead-modal");
const openBtns = document.querySelectorAll("[data-open-modal]");
const closeBtns = document.querySelectorAll("[data-close-modal]");
let lastFocused = null;

function focusableElements() {
  if (!modal) return [];
  return modal.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
}

function openModal() {
  if (!modal) return;
  lastFocused = document.activeElement;
  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  // Focar o primeiro input em vez do botão fechar
  const firstInput = modal.querySelector("input");
  (firstInput || modal.querySelector("button")).focus();
}

function closeModal() {
  if (!modal) return;
  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
}

openBtns.forEach((btn) => btn.addEventListener("click", openModal));
closeBtns.forEach((btn) => btn.addEventListener("click", closeModal));

// Click no backdrop (fora do .modal) fecha
if (modal) {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
}

// ESC fecha; Tab faz trap dentro do modal
document.addEventListener("keydown", (e) => {
  if (modal && modal.hidden) return;
  if (e.key === "Escape") {
    closeModal();
    return;
  }
  if (e.key === "Tab") {
    const focusables = focusableElements();
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});

// ---------- Form -------------------------------------------------------------

function handleSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const submitBtn = document.getElementById("submit-btn");

  const nameInput = form.elements.name;
  const emailInput = form.elements.email;
  const phoneInput = form.elements.phone;

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const phoneRaw = phoneInput.value.trim();

  let valid = true;
  let firstInvalid = null;

  if (name.length < 2) {
    setInvalid(nameInput, true);
    valid = false;
    firstInvalid = firstInvalid || nameInput;
  } else setInvalid(nameInput, false);

  if (!isEmail(email)) {
    setInvalid(emailInput, true);
    valid = false;
    firstInvalid = firstInvalid || emailInput;
  } else setInvalid(emailInput, false);

  const phone = normalizePhone(phoneRaw);
  if (phone.length < 12 || phone.length > 13) {
    setInvalid(phoneInput, true);
    valid = false;
    firstInvalid = firstInvalid || phoneInput;
  } else setInvalid(phoneInput, false);

  if (!valid) {
    if (firstInvalid) firstInvalid.focus();
    return;
  }

  const tracking = captureTracking();
  const lead = { name, email, phone, _ts: Date.now() };

  try {
    localStorage.setItem(LS_LEAD, JSON.stringify({ ...lead, tracking }));
  } catch (_) {
    /* segue sem persistir */
  }

  // Hook opcional para webhook (Make/Zapier/n8n):
  // fetch("https://hook.exemplo.com/lead", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ ...lead, tracking }),
  //   keepalive: true,
  // }).catch(() => {});

  submitBtn.disabled = true;
  submitBtn.textContent = "Abrindo checkout...";

  window.location.href = buildCheckoutUrl(lead, tracking);
}

// ---------- Init -------------------------------------------------------------

captureTracking();

const form = document.getElementById("lead-form");
if (form) form.addEventListener("submit", handleSubmit);

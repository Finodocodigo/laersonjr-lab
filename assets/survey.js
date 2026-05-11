// ============================================================================
// Funil de estudo — página de obrigado
// Saúda pelo nome, coleta pesquisa Lost Chapter (Hormozi) num fluxo sequencial
// estilo typeform (uma pergunta por vez, multiple choice em cards), salva local
// ============================================================================

// >>> Opcional: webhook para receber as respostas (Make/Zapier/n8n) <<<
// Deixe vazio para não enviar (modo estudo — fica só no localStorage)
const SURVEY_WEBHOOK_URL = "";

const LS_LEAD = "funil:lead";
const LS_SURVEY = "funil:survey";

const AUTO_ADVANCE_DELAY = 320; // ms — feedback visual antes de avançar

function loadLead() {
  try {
    return JSON.parse(localStorage.getItem(LS_LEAD) || "{}");
  } catch (_) {
    return {};
  }
}

function greetByName() {
  const lead = loadLead();
  const nameEl = document.getElementById("greet-name");
  if (!nameEl) return;
  const first = (lead.name || "").trim().split(/\s+/)[0];
  if (first) nameEl.textContent = ", " + first;
}

function formToObject(form) {
  const data = {};
  const fd = new FormData(form);
  for (const [key, value] of fd.entries()) {
    data[key] = typeof value === "string" ? value.trim() : value;
  }
  return data;
}

// ---------- Fluxo sequencial -------------------------------------------------

const form = document.getElementById("survey-form");
const steps = form ? Array.from(form.querySelectorAll(".step")) : [];
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const submitBtn = document.getElementById("survey-submit");

let current = 0;
let advanceTimer = null;

function getRadios(step) {
  return Array.from(step.querySelectorAll('input[type="radio"]'));
}

function getInputCtrl(step) {
  return step.querySelector("input:not([type=radio]), select, textarea");
}

function focusable(step) {
  const radios = getRadios(step);
  if (radios.length) {
    return radios.find((r) => r.checked) || radios[0];
  }
  return getInputCtrl(step);
}

function isStepValid(step) {
  const radios = getRadios(step);
  if (radios.length) {
    const required = radios.some((r) => r.hasAttribute("required"));
    if (!required) return true;
    return radios.some((r) => r.checked);
  }
  const ctrl = getInputCtrl(step);
  if (!ctrl) return true;
  if (!ctrl.hasAttribute("required")) return true;
  return ctrl.value && ctrl.value.trim() !== "";
}

function flagStep(step, invalid) {
  const radios = getRadios(step);
  if (radios.length) {
    const fieldset = step.querySelector("fieldset.choices");
    if (fieldset) fieldset.setAttribute("aria-invalid", invalid ? "true" : "false");
    return;
  }
  const ctrl = getInputCtrl(step);
  if (!ctrl) return;
  ctrl.setAttribute("aria-invalid", invalid ? "true" : "false");
}

function showStep(i) {
  clearTimeout(advanceTimer);
  steps.forEach((s, idx) => {
    const isActive = idx === i;
    s.classList.toggle("active", isActive);
    s.hidden = !isActive;
  });
  current = i;

  if (prevBtn) prevBtn.disabled = i === 0;

  const isLast = i === steps.length - 1;
  if (nextBtn) nextBtn.hidden = isLast;
  if (submitBtn) submitBtn.hidden = !isLast;

  const target = focusable(steps[i]);
  if (target) setTimeout(() => target.focus({ preventScroll: true }), 30);
}

function goNext() {
  const step = steps[current];
  if (!isStepValid(step)) {
    flagStep(step, true);
    const target = focusable(step);
    if (target) target.focus();
    return;
  }
  flagStep(step, false);
  if (current < steps.length - 1) showStep(current + 1);
}

function goPrev() {
  if (current > 0) showStep(current - 1);
}

if (prevBtn) prevBtn.addEventListener("click", goPrev);
if (nextBtn) nextBtn.addEventListener("click", goNext);

// Auto-avançar ao escolher uma opção de radio (typeform-style)
if (form) {
  form.addEventListener("change", (e) => {
    if (!(e.target instanceof HTMLInputElement)) return;
    if (e.target.type !== "radio") return;
    flagStep(steps[current], false);
    clearTimeout(advanceTimer);
    advanceTimer = setTimeout(() => {
      if (current === steps.length - 1) {
        if (isStepValid(steps[current])) form.requestSubmit();
      } else {
        goNext();
      }
    }, AUTO_ADVANCE_DELAY);
  });

  // Enter avança (exceto em textarea, onde mantém quebra de linha)
  form.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "textarea") return;
    e.preventDefault();
    if (current === steps.length - 1) {
      if (isStepValid(steps[current])) form.requestSubmit();
      else {
        flagStep(steps[current], true);
        const target = focusable(steps[current]);
        if (target) target.focus();
      }
    } else {
      goNext();
    }
  });
}

// ---------- Submit -----------------------------------------------------------

async function handleSubmit(event) {
  event.preventDefault();
  const step = steps[current];
  if (!isStepValid(step)) {
    flagStep(step, true);
    const target = focusable(step);
    if (target) target.focus();
    return;
  }

  const answers = formToObject(form);
  const lead = loadLead();
  const payload = {
    lead: {
      name: lead.name || null,
      email: lead.email || null,
      phone: lead.phone || null,
    },
    tracking: lead.tracking || {},
    answers,
    _ts: Date.now(),
  };

  try {
    localStorage.setItem(LS_SURVEY, JSON.stringify(payload));
  } catch (_) {
    /* segue sem persistir */
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Enviando...";

  if (SURVEY_WEBHOOK_URL) {
    try {
      await fetch(SURVEY_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    } catch (_) {
      /* falhou o webhook — temos backup no localStorage */
    }
  }

  form.hidden = true;
  const thanks = document.getElementById("thanks-block");
  if (thanks) {
    thanks.hidden = false;
    thanks.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// ---------- Init -------------------------------------------------------------

greetByName();
if (form) form.addEventListener("submit", handleSubmit);
if (steps.length > 0) showStep(0);

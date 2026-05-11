// ============================================================================
// Funil de estudo — página de obrigado
// Saúda pelo nome, coleta pesquisa Lost Chapter (Hormozi) e salva localmente
// ============================================================================

// >>> Opcional: webhook para receber as respostas (Make/Zapier/n8n) <<<
// Deixe vazio para não enviar (modo estudo — fica só no localStorage)
const SURVEY_WEBHOOK_URL = "";

const LS_LEAD = "funil:lead";
const LS_SURVEY = "funil:survey";

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

function validateRequired(form) {
  let firstInvalid = null;
  for (const el of form.querySelectorAll("[required]")) {
    const ok = el.value && el.value.trim() !== "";
    el.setAttribute("aria-invalid", ok ? "false" : "true");
    if (!ok && !firstInvalid) firstInvalid = el;
  }
  if (firstInvalid) {
    firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
    firstInvalid.focus({ preventScroll: true });
    return false;
  }
  return true;
}

async function handleSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const btn = document.getElementById("survey-submit");

  if (!validateRequired(form)) return;

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

  btn.disabled = true;
  btn.textContent = "Enviando...";

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

greetByName();

const form = document.getElementById("survey-form");
if (form) form.addEventListener("submit", handleSubmit);

# laersonjr-lab — funil-estudo

Ambiente pessoal de testes e estudos de funis, copy e marketing digital do [@laersonjr](https://instagram.com/laersonjr).

**Não é projeto de cliente. Não é oferta comercial real.** As páginas servem para estudo de landing, checkout, captura de lead, sequência de e-mail e pesquisa de avatar.

## Rotas

| URL | Conteúdo |
| --- | --- |
| `/` | Aviso de ambiente de testes + atalho pro Instagram e pro funil. |
| `/funil-estudo` | Landing principal do estudo "Funil Solo" (R$ 97 — placeholder). |
| `/obg-funil-estudo` | Página de obrigado + pesquisa Lost Chapter (Hormozi). |

## Estrutura

```
.
├── index.html                  # aviso @laersonjr
├── assets/
│   ├── styles.css              # CSS dark, mobile-first, sem framework
│   ├── app.js                  # modal + UTMs + redirect Kiwify (landing)
│   └── survey.js               # coleta da pesquisa (página obrigado)
├── funil-estudo/
│   └── index.html              # landing (copy completa, CTA -> modal)
├── obg-funil-estudo/
│   └── index.html              # thank-you + pesquisa
└── README.md
```

## Deploy — Cloudflare Pages

Hospedado no Cloudflare Pages com integração direta ao GitHub.

- **Repositório:** `laersonjr-lab`
- **Branch de produção:** `main`
- **Build command:** _(nenhum — site estático)_
- **Output directory:** `/` (raiz do repo)

Cada push em `main` republica automaticamente.

### Por que pastas com `index.html`

Cloudflare Pages serve `/foo` → `/foo/index.html` sem nenhuma config. Mantém URLs limpas (`/funil-estudo`, `/obg-funil-estudo`) e não depende de feature de _redirects.

## Fluxo do funil

1. **Anúncio** envia para `/funil-estudo?utm_source=...&utm_medium=...&utm_campaign=...`.
2. **`assets/app.js`** captura UTMs (e `fbclid`, `gclid`, `ttclid`, `s1-s4`) em `localStorage` (chave `funil:tracking`).
3. A landing só tem botões CTA. Clicar em qualquer um abre o **modal** com nome / e-mail / WhatsApp.
4. Submit do modal valida → salva lead em `localStorage` (chave `funil:lead`) → redireciona para a URL Kiwify com `name`, `email`, `phone` e UTMs todos na querystring.
5. **Kiwify** processa pagamento. No painel do produto, configure a "Página de obrigado" para `https://<dominio>/obg-funil-estudo`.
6. **`assets/survey.js`** lê o nome do lead, saúda, coleta a pesquisa Lost Chapter e salva em `funil:survey`. Opcionalmente envia para um webhook.

## Configuração obrigatória

### 1. URL do checkout Kiwify

Edite [`assets/app.js`](assets/app.js):

```js
const KIWIFY_CHECKOUT_URL = "https://pay.kiwify.com.br/SEU_LINK_AQUI";
```

### 2. (Opcional) Webhook da pesquisa

Edite [`assets/survey.js`](assets/survey.js) se quiser receber as respostas em algum lugar (Make, Zapier, n8n, Google Apps Script, sua API):

```js
const SURVEY_WEBHOOK_URL = "https://hook.exemplo.com/survey";
```

Deixe vazio (`""`) para modo estudo puro — fica só no `localStorage` do navegador.

### 3. URL de obrigado dentro da Kiwify

Painel Kiwify → produto → "Página de obrigado" → cole `https://<dominio>/obg-funil-estudo`.

## Rodar localmente

```bash
cd <repo>
python3 -m http.server 8000
# http://localhost:8000/                                            -> aviso
# http://localhost:8000/funil-estudo/?utm_source=teste&utm_medium=demo
# http://localhost:8000/obg-funil-estudo/
```

Para testar a página de obrigado sem passar pelo Kiwify, submeta o form do modal na landing primeiro (assim o nome do lead já estará no `localStorage`).

## Inspecionar dados capturados

No DevTools do navegador (Console):

```js
JSON.parse(localStorage.getItem("funil:tracking")); // UTMs e click IDs
JSON.parse(localStorage.getItem("funil:lead"));     // lead + tracking
JSON.parse(localStorage.getItem("funil:survey"));   // respostas da pesquisa
```

## Oferta (placeholder didático)

Aplicado o framework $100M Offers (Hormozi):

- **Core**: 7 módulos — oferta, checkout, entrega, landing, captura, e-mail, tráfego
- **Bônus**: Pasta Cola Pronta, Mapa de Custos, SOS Travei, Mesa de Apoio (Telegram 30 dias), Auditoria
- **Stack visível**: R$ 1.232 → R$ 97
- **Garantia nomeada**: "Sem Conversa Mole" — 7 dias incondicional
- **Urgência**: 2 bônus saem do ar em prazo declarado
- **Mecanismo único**: "A Sequência do Funil" (a ordem correta das 7 peças)

## Pesquisa — metodologia Lost Chapter (Hormozi)

As perguntas cobrem as 4 categorias canônicas:

- **Parte 1 — Demographics**: idade, gênero, estado, situação familiar, solo vs equipe
- **Parte 2 — Business stats**: tipo de negócio, faturamento, tempo, presença online atual, gasto prévio com agência, histórico de cursos
- **Parte 3 — Aspirations**: problema, resultado de 30 dias, definição de sucesso em 90 dias
- **Parte 4 — Buying process**: gatilho, tempo de relacionamento, primeiro contato, conteúdo consumido, indicação, maior dúvida, motivo de quase-não-comprar

Depois de 50+ compradores, exporte as respostas, ordene pelo top 20% (quem gastou mais + ficou mais tempo + que você mais gosta) e extraia 3 a 5 **qualificadores em comum**. Reescreva ads e LP para falar para esses qualificadores explicitamente.

## Limitações (assumidas — projeto de estudo)

- Sem backend: respostas ficam no navegador do cliente até configurar um webhook.
- Sem reCAPTCHA / anti-bot.
- Sem analytics (sem GA/Meta Pixel). Adicione conforme precisar.
- Validação de telefone aceita formatos BR (12-13 dígitos com `55`). Outros países precisam de ajuste em `normalizePhone` em [`assets/app.js`](assets/app.js).

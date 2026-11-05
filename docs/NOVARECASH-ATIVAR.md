# NovareCash — como ligar (checklist do dono)

O código está pronto. O que falta são chaves e decisões que só o dono tem. Faça na ordem: cada passo
funciona sozinho. Sem o link da Hotmart, o botão de assinar abre o WhatsApp da casa.

> FINCASH continua **grátis**. NovareCash é o produto **pago** (IA + WhatsApp + conexão com banco).
> Preço, datas da Black e "o que está no ar" moram num arquivo só: `src/lib/novarecash/config.ts`.

---

## 1. Banco de dados (5 min) — SQL Editor do projeto `hjikeevfzfswqydduars`

Nesta ordem (todos podem ser rodados de novo sem estragar nada):

1. `supabase/novarecash.sql` — assinantes, diário da Hotmart e a regra de acesso.
2. `supabase/novarecash_app.sql` — cota da IA.
3. `supabase/novarecash_dados.sql` — contas, extrato e orçamento próprios.
4. `supabase/novarecash_whatsapp.sql` — o WhatsApp gravando no NovareCash.
5. `supabase/novarecash_compartilhar.sql` — conta compartilhada e a regra única `ncash_pode`.
6. `supabase/novarecash_cartoes.sql` — cartões com fatura, parcelas, contas a pagar, lembretes.
7. `supabase/novarecash_insights.sql` — alertas dispensados e metas.
8. `supabase/novarecash_extras.sql` — importação, categorias personalizadas, investimentos.

Confere: a última consulta de cada arquivo devolve tudo `true`.

## 1b. Lembrete de contas no WhatsApp (todo dia às 9h)

- Criar **`CRON_SECRET`** na Vercel (qualquer texto longo e secreto). ⚠️ Tem de ser esse nome: é o
  único que a Vercel manda sozinha para o cron. Sem ele, a rota `/api/novarecash/lembretes` recusa.
- Pedir à Meta a aprovação do **modelo** (categoria Utilidade, idioma pt_BR, nome sugerido
  `novarecash_lembrete_contas`):
  > Olá! Lembrete do NovareCash: amanhã, {{1}}, você tem {{2}} para pagar, no total de {{3}}: {{4}}.
  > Depois de pagar, marque como paga no app, em Contas a pagar.

  Exemplos: {{1}} = 05/11 · {{2}} = 2 contas · {{3}} = R$ 1.680,00 · {{4}} = Aluguel (R$ 1.500,00); Luz (R$ 180,00)
- Aprovado: criar `WHATSAPP_TEMPLATE_LEMBRETE` com o nome do modelo. Antes disso a rota roda em modo de
  teste (devolve o que mandaria, sem mandar). Teste manual: `/api/novarecash/lembretes?teste=1`.

## 2. Preço e datas da Black — `src/lib/novarecash/config.ts`

- **Definido em 05/11/2026:** **três planos** (`PLANOS`), como o Pierre e o Organizze, cada um em **dois
  prazos**: **mensal** (cobrado todo mês) e **anual** (os 12 meses pagos de uma vez, mais barato por mês).
  Todos têm **todos os recursos**; muda só quantos bancos dá para conectar pelo Open Finance.
  Valores **por mês**:

  | Plano | Bancos | Mensal cheio | Mensal Black | Anual cheio (por mês) | Anual Black (por mês) |
  |---|---|---|---|---|---|
  | Essencial | 1 | R$ 59,90 | R$ 29,90 | R$ 49,90 (R$ 598,80/ano) | R$ 24,90 (R$ 298,80/ano) |
  | **Plus** (selo "Recomendado", em destaque) | 3 | R$ 79,90 | R$ 39,90 | R$ 69,90 (R$ 838,80/ano) | R$ 34,90 (R$ 418,80/ano) |
  | Premium | 10 | R$ 119,90 | R$ 59,90 | R$ 109,90 (R$ 1.318,80/ano) | R$ 54,90 (R$ 658,80/ano) |

  - O anual é **cobrado de uma vez**: valor por mês × 12 (`totalAnual`). Economia do anual contra o mensal,
    no mesmo período (`economiaAnual`): R$ 60/ano na Black e R$ 120/ano depois.
  - ⚠️ O **cheio é o preço real** cobrado depois da Black: riscar um valor que nunca se cobra é preço de
    referência falso (CDC). Em 1º/12 a página volta sozinha ao cheio. No anual, o valor riscado é o
    **mensal cheio** do mesmo plano (também preço real), e o % OFF é contra ele.
  - ⚠️ **R$ 29,90 é o PISO do dono — só no MENSAL**: nenhuma campanha desce disso no mensal. O anual pode ficar
    abaixo (R$ 24,90/mês na Black do Essencial).
  - A página abre os planos no **anual**, com a chave "Mensal | Anual" no topo e o selo "economize R$ X por
    ano". Herói, pop-up e barra do celular mostram "a partir de" o menor preço por mês (o anual do
    Essencial), com "no anual" ao lado. Enquanto o Open Finance não está no ar, os planos dizem: "A conexão
    com bancos libera em {data}; até lá, todos os recursos que já funcionam vêm em qualquer plano".
  - O limite de bancos de cada assinante sai de `bancosDoPlano(plano)` (plano desconhecido = 1, o do Essencial).
  - Sem Lista VIP. Histórico: em 04/11 era um mensal só (R$ 34,90, Black R$ 29,90), pela pesquisa de mercado
    (Pierre Pro R$ 39, Organizze Conectado R$ 39,90, Mobills mensal R$ 42,90, Meu Planner Premium 12x R$ 34,90).
- Enquanto o link da Hotmart de um plano não estiver na Vercel, o botão daquele plano abre o **WhatsApp da
  casa** com a mensagem "Quero assinar o NovareCash {Plano}" (no anual, "… {Plano} anual") — quem atende libera o acesso (Admin → NovareCash
  mostra quem pagou pela Hotmart; venda pelo WhatsApp precisa do link de pagamento da Hotmart enviado à pessoa).
- Mudar preço/datas: me passe os números — preço escrito em outro lugar é preço que diverge.

## 3. Hotmart (15 min)

1. Criar o produto **NovareCash** como assinatura, com **seis planos/ofertas** — 3 planos × 2 prazos. O
   **nome** de cada um tem de conter a palavra do plano e, no anual, a palavra **Anual**:

   | Nome do plano/oferta na Hotmart | Recorrência | Preço até 30/11 (Black) | Preço de 1º/12 | Env do link na Vercel |
   |---|---|---|---|---|
   | `Plano Essencial` | mensal | R$ 29,90/mês | R$ 59,90/mês | `NEXT_PUBLIC_NOVARECASH_CHECKOUT_ESSENCIAL` |
   | `Plano Plus` | mensal | R$ 39,90/mês | R$ 79,90/mês | `NEXT_PUBLIC_NOVARECASH_CHECKOUT_PLUS` |
   | `Plano Premium` | mensal | R$ 59,90/mês | R$ 119,90/mês | `NEXT_PUBLIC_NOVARECASH_CHECKOUT_PREMIUM` |
   | `Plano Essencial Anual` | anual | R$ 298,80/ano | R$ 598,80/ano | `NEXT_PUBLIC_NOVARECASH_CHECKOUT_ESSENCIAL_ANUAL` |
   | `Plano Plus Anual` | anual | R$ 418,80/ano | R$ 838,80/ano | `NEXT_PUBLIC_NOVARECASH_CHECKOUT_PLUS_ANUAL` |
   | `Plano Premium Anual` | anual | R$ 658,80/ano | R$ 1.318,80/ano | `NEXT_PUBLIC_NOVARECASH_CHECKOUT_PREMIUM_ANUAL` |

   - ⚠️ Até 30/11 o link de cada plano tem de COBRAR o preço da Black. Em 1º/12 a página passa sozinha ao
     cheio, mas o link da Hotmart não: troque os seis links na Vercel (ou o preço das ofertas na Hotmart) no
     mesmo dia, senão a página mostra um preço e o checkout cobra outro.
   - A rota grava em `ncash_assinantes.plano` o valor `essencial`, `plus` ou `premium`, lendo nesta ordem o
     nome do plano da assinatura, o nome da oferta, o código da oferta e o nome do produto (sem acento e sem
     diferenciar maiúsculas). **Não reconheceu: grava `essencial`** (o menor limite de bancos).
   - O **prazo** sai, à parte, do nome do plano, do nome da oferta ou do código da oferta: com **"Anual"**
     (ou "ano", "annual", "12 meses", palavra inteira), a validade é de um ano; sem, de um mês. Na prática a
     validade vem da próxima cobrança que a Hotmart informa (+3 dias); sem ela, 370 dias no anual e 35 no
     mensal. Não há coluna de prazo: a validade (`expira_em`) já basta. "Plano Plus Anual" vira `plus` + anual.
   - ⚠️ Não ponha "Anual" no nome do **produto** (ele é o mesmo para os seis; a rota não o lê para o prazo de
     propósito) nem nos nomes dos planos **mensais**: a rota daria um ano a quem pagou um mês.
   - Lógica testável em `src/lib/novarecash/hotmart-plano.ts`.
2. Garantia de 7 dias.
3. Em **Ferramentas → Webhook (API e notificações)**: nova configuração com
   - URL: `https://hub.novareapp.com.br/api/novarecash/hotmart`
   - eventos: compra aprovada, completa, cancelada, reembolsada, chargeback, protesto, atrasada,
     cancelamento de assinatura
   - copie o **hottok** que a Hotmart mostra.
4. Na Vercel (projeto `novare-workspace` → Settings → Environment Variables → Production):

| Variável | O que é |
|---|---|
| `HOTMART_HOTTOK` | o hottok do passo 3 — **sem ele a rota recusa tudo** (de propósito) |
| `HOTMART_PRODUTO_NOVARECASH` | id do produto na Hotmart (opcional: ignora aviso de outro produto) |
| `NEXT_PUBLIC_NOVARECASH_CHECKOUT_ESSENCIAL` | link de pagamento do plano Essencial |
| `NEXT_PUBLIC_NOVARECASH_CHECKOUT_PLUS` | link de pagamento do plano Plus |
| `NEXT_PUBLIC_NOVARECASH_CHECKOUT_PREMIUM` | link de pagamento do plano Premium |
| `NEXT_PUBLIC_NOVARECASH_CHECKOUT_ESSENCIAL_ANUAL` | link de pagamento do Essencial Anual |
| `NEXT_PUBLIC_NOVARECASH_CHECKOUT_PLUS_ANUAL` | link de pagamento do Plus Anual |
| `NEXT_PUBLIC_NOVARECASH_CHECKOUT_PREMIUM_ANUAL` | link de pagamento do Premium Anual |

   (As antigas `NEXT_PUBLIC_NOVARECASH_CHECKOUT_MENSAL` e `NEXT_PUBLIC_NOVARECASH_CHECKOUT_ANUAL`, sem o nome do
   plano, não são mais lidas: pode apagar.)
   ⚠️ São `NEXT_PUBLIC_…`: entram no código do navegador **no build**. Criou ou trocou um link? Novo deploy.

5. Novo deploy. Teste: compra de teste na Hotmart → o e-mail aparece em **Admin → NovareCash** e, logado
   com esse e-mail, `/novarecash/app` abre.

**Regra do acesso:** a chave é o **e-mail da compra**. Quem comprou e ainda não tem conta cria a conta com o
mesmo e-mail e já entra. Cancelou a renovação → usa até o fim do período. Reembolso/chargeback → corta na hora.
A equipe (admin/equipe) sempre entra, para dar suporte.

## 4. IA

Já funciona com a `OPENAI_API_KEY` que existe. Se quiser o Claude (recomendado), crie `ANTHROPIC_API_KEY`
na Vercel — o app passa a usá-lo sozinho.

## 5. WhatsApp — "passo no final"

Precisa de: um **número só para o NovareCash** (chip novo, que não esteja no WhatsApp comum) e a conta
**Meta Business** da Novare. No Meta for Developers: app → WhatsApp → número → token **permanente** de
usuário de sistema → assinar o campo `messages` → webhook
`https://hub.novareapp.com.br/api/whatsapp/webhook`.

Variáveis: ver a lista completa no fim deste arquivo. Depois: em `config.ts`, `RECURSOS` → `whatsapp.noAr = true`.

## 6. Conexão com banco (Open Finance) — "passo no final"

Já está integrada pela função `rapid-responder` (Banco MCP), a mesma do Novare App. **O plano atual só
permite 1 conexão no total.** Pedir ao Banco MCP um plano com uma conexão **por cliente** (e o preço por
conexão — ele entra no custo de cada assinante). Liberado o plano: em `config.ts`, `banco.noAr = true`.
Até lá, só a equipe vê a tela funcionando (para testar); o cliente vê "em ativação".

---

## Variáveis de ambiente — a lista completa (só nomes; valores ficam na Vercel)

| Variável | Onde | Se faltar |
|---|---|---|
| `HOTMART_HOTTOK` | Vercel | a rota da Hotmart recusa tudo (503) — ninguém é liberado |
| `HOTMART_PRODUTO_NOVARECASH` | Vercel (opcional) | aceita aviso de qualquer produto da conta |
| `NEXT_PUBLIC_NOVARECASH_CHECKOUT_ESSENCIAL` / `_PLUS` / `_PREMIUM` (mensal) | Vercel | o botão daquele plano abre o WhatsApp da casa em vez do pagamento |
| `NEXT_PUBLIC_NOVARECASH_CHECKOUT_ESSENCIAL_ANUAL` / `_PLUS_ANUAL` / `_PREMIUM_ANUAL` | Vercel | o mesmo, no anual ("Quero assinar o NovareCash {Plano} anual") |
| `ANTHROPIC_API_KEY` | Vercel (opcional) | a IA usa a OpenAI |
| `OPENAI_API_KEY` | Vercel (já existe) | sem ela E sem a Anthropic, a IA mostra "em ativação"; o WhatsApp não lê áudio/foto |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel (já existe) | webhooks da Hotmart e do WhatsApp não gravam |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | Vercel | o assistente recebe mas não responde; o app mostra "sendo ligado" |
| `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN` | Vercel | o webhook da Meta não verifica/não aceita mensagens |
| `WHATSAPP_API_VERSION`, `WHATSAPP_PROVEDOR`, `FINCASH_MIDIA_TETO_MES` | Vercel (opcionais) | usam o padrão |
| `NEXT_PUBLIC_WHATSAPP_NUMERO` | Vercel | a tela do WhatsApp diz que o número ainda não foi publicado |
| `BANCO_MCP_KEY` | **Supabase** (secret da Edge Function, já existe) | a tela do Banco diz "conexão sendo configurada" |

## Limites conhecidos

- A mesma transação importada por arquivo OFX **e** depois pelo Open Finance pode entrar duas vezes (as
  chaves de origem são diferentes). O "desfazer importação" do FINCASH desfaz qualquer uma das duas.
- Os nomes de campo das respostas do Banco MCP (contas, saldo, transações) foram tratados com
  alternativas, mas só serão confirmados no primeiro teste real — faça logado como equipe.

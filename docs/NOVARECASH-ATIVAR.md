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

- **Definido em 04/11/2026:** só o **mensal** é vendido — **R$ 34,90/mês** (cheio) e **R$ 29,90/mês** na
  Black Novare, de **04/11 a 30/11** (14% OFF; R$ 29,90 é o PISO do dono). Em 1º/12 volta sozinho ao cheio. Sem Lista VIP.
  Base: pesquisa de mercado (Pierre Pro R$ 39, Organizze Conectado R$ 39,90, Mobills mensal R$ 42,90,
  Meu Planner Premium 12x R$ 34,90) — os números estão no comentário de `PRECOS`.
- Enquanto o link da Hotmart não estiver na Vercel, o botão "Assinar" abre o **WhatsApp da casa** com a
  mensagem "Quero assinar o NovareCash" — quem atende libera o acesso (Admin → NovareCash mostra quem pagou
  pela Hotmart; venda pelo WhatsApp precisa do link de pagamento da Hotmart enviado à pessoa).
- Mudar preço/datas: me passe os números — preço escrito em outro lugar é preço que diverge.

## 3. Hotmart (15 min)

1. Criar o produto **NovareCash** como **assinatura**, com dois planos: um com "mensal" no nome e outro
   com "anual" no nome (a rota lê o nome para saber a validade).
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
| `NEXT_PUBLIC_NOVARECASH_CHECKOUT_MENSAL` | link de pagamento do plano mensal |
| `NEXT_PUBLIC_NOVARECASH_CHECKOUT_ANUAL` | link de pagamento do plano anual |

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
| `NEXT_PUBLIC_NOVARECASH_CHECKOUT_MENSAL` / `_ANUAL` | Vercel | o botão de comprar daquele plano não aparece |
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

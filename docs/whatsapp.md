# Assistente de WhatsApp do FINCASH

Como plugar a API de WhatsApp no que já está construído — e o que ainda falta
depois disso.

> **Estado hoje:** o assistente está inteiro, menos a conta no provedor. Ele
> interpreta a mensagem, grava o lançamento na conta certa, responde, e nada
> disso depende de credencial para ser testado. O que falta é ligar o cano.

---

## 1. O que existe

| Arquivo | O que faz |
|---|---|
| `supabase/fincash_whatsapp.sql` | as duas tabelas (`fin_whatsapp_contas`, `fin_whatsapp_mensagens`), o RLS e a função que gera o código de vínculo |
| `src/app/api/whatsapp/webhook/route.ts` | `GET` (handshake) e `POST` (recebimento); assinatura, teto por IP e sempre 200 |
| `src/app/api/whatsapp/vincular/route.ts` | o lado do app: gera código, mostra o estado, desliga |
| `src/lib/fincash/whatsapp.ts` | o interpretador — **funções puras**, sem banco e sem rede |
| `src/lib/fincash/whatsapp-provedor.ts` | tradutor do formato do provedor + verificação de assinatura |
| `src/lib/fincash/whatsapp-servidor.ts` | banco, vínculo, idempotência, respostas |
| `src/lib/fincash/whatsapp-envio.ts` | o cliente de envio (mesmo desenho de `lib/email.ts`) |
| `src/lib/fincash/whatsapp-midia.ts` | mídia: download em memória, tetos de tamanho e o teto mensal por usuário |
| `src/lib/fincash/whatsapp-audio.ts` | áudio → transcrição (Whisper) → o **mesmo** interpretador do texto |
| `src/lib/fincash/whatsapp-foto.ts` | foto → NFC-e (quando dá) ou visão → **proposta**, nunca lançamento direto |

O que o assistente entende hoje, por texto:

- **Gasto** — “Uber 35”, “mercado R$ 280 ontem”, “farmácia 47,90 no nubank”
- **Entrada** — “recebi 5000 de salário”
- **Consulta** — “quanto gastei com alimentação esse mês?”, “saldo”, “resumo”
- **Correção** — “desfazer” apaga o último lançamento que ele criou
- **Ajuda** — “ajuda”, “menu”, “oi”

E mais duas coisas que o concorrente cobra e que já estão aqui: o **alerta de
estouro de orçamento** (sai junto com a confirmação, no gasto que cruzou o
limite) e o vínculo com **confirmação por código**.

---

## 2. Rodar o SQL

No SQL Editor do Supabase (projeto `hjikeevfzfswqydduars`), **depois** de
`fincash.sql` e `fincash_orcamento.sql`:

```
supabase/fincash_whatsapp.sql
```

É idempotente. No fim ele lista as duas tabelas com as policies — se aparecerem,
está feito.

---

## 3. Criar o app na Meta

O provedor mais provável é a **Cloud API da Meta** (é a oficial, tem 1.000
conversas de serviço grátis por mês e não cobra intermediário). O passo a passo:

1. **developers.facebook.com** → *Meus apps* → *Criar app* → tipo **Empresa**.
2. No app, adicione o produto **WhatsApp**.
3. Em *WhatsApp → Configuração da API*, a Meta já dá um **número de teste** e um
   token temporário de 24h. Serve para testar tudo antes de comprometer o número
   da Novare.
4. **Número definitivo**: em *Gerenciador do WhatsApp*, adicione o número real.
   ⚠️ Um número que já tem WhatsApp comum ou Business precisa ser **apagado de
   lá antes** — e a conversa antiga não volta. Use um chip novo.
5. **Token permanente** (o temporário vence em 24h e o assistente cai sem aviso):
   *Configurações do negócio* → *Usuários do sistema* → criar um usuário de
   sistema **Admin** → *Gerar token* → escolher o app → marcar
   `whatsapp_business_messaging` e `whatsapp_business_management` → **sem
   expiração**.

Anote: **Phone Number ID** (não é o telefone — é o id numérico ao lado dele) e o
**App Secret** (*Configurações do app → Básico → Chave secreta do app*).

---

## 4. Preencher as variáveis

Em `.env.local` (nunca no `.env.local.example`, nunca no git):

```
SUPABASE_SERVICE_ROLE_KEY=   # Supabase → Settings → API → service_role
WHATSAPP_PROVEDOR=meta
WHATSAPP_VERIFY_TOKEN=       # você inventa; repete no painel da Meta
WHATSAPP_APP_SECRET=         # Meta → Básico → Chave secreta do app
WHATSAPP_TOKEN=              # o token permanente do usuário de sistema
WHATSAPP_PHONE_NUMBER_ID=    # o id numérico, não o telefone
WHATSAPP_API_VERSION=v21.0
NEXT_PUBLIC_WHATSAPP_NUMERO= # o telefone, só para a tela mostrar
```

Na Vercel, as mesmas em *Settings → Environment Variables*.

> **A `SUPABASE_SERVICE_ROLE_KEY` passa por cima de todo o RLS.** Ela é o motivo
> de o webhook conseguir escrever na conta de um cliente sem estar logado como
> ele. Se ela vazar, vaza o FINCASH inteiro de todo mundo. Não prefixe com
> `NEXT_PUBLIC_`, não use fora de `whatsapp-servidor.ts`.

---

## 5. Apontar o webhook

URL: `https://SEU-DOMINIO/api/whatsapp/webhook`

No painel: *WhatsApp → Configuração → Webhook → Editar*.
Cole a URL, cole o **mesmo** `WHATSAPP_VERIFY_TOKEN`, salve. A Meta faz um `GET`
com `hub.challenge` na hora; se a variável estiver certa, ela aceita.

Depois, em *Gerenciar*, assine o campo **`messages`**. Sem isso a URL fica
verificada mas nunca chega mensagem — é o erro mais comum.

---

## 6. Testar

### Sem a Meta (só o assistente)

Em desenvolvimento, o webhook aceita corpo sem assinatura (em produção, não).
Com o servidor de dev rodando:

```bash
curl -X POST http://localhost:3000/api/whatsapp/webhook \
  -H 'Content-Type: application/json' \
  -d '{"entry":[{"changes":[{"field":"messages","value":{"messages":[
        {"from":"5519999999999","id":"wamid.TESTE1","timestamp":"1757300000",
         "type":"text","text":{"body":"mercado 280 ontem"}}]}}]}]}'
```

Depois confira no Supabase:

```sql
select direcao, texto, erro from fin_whatsapp_mensagens order by criado_em desc limit 4;
select descricao, valor, tipo, data from fin_lancamentos order by criado_em desc limit 4;
```

Repita o **mesmo** `curl`, com o mesmo `wamid.TESTE1`: nada deve acontecer. É a
idempotência funcionando.

### Com a Meta

1. Abra o FINCASH → *Assistente do WhatsApp* → **gerar código**.
2. Mande os 6 dígitos, do seu celular, para o número do assistente.
3. Ele responde confirmando o vínculo.
4. Mande `Uber 35`. Deve responder com a confirmação e o lançamento aparece no
   app.

### Webhook local com a Meta

A Meta só chama URL pública com HTTPS. Use um túnel:

```bash
npx localtunnel --port 3000     # ou ngrok http 3000
```

E aponte o webhook para a URL do túnel. **Reaponte para produção depois** — túnel
esquecido no painel é o motivo clássico de "parou de funcionar sozinho".

---

## 7. O que ainda falta para ficar completo

Em ordem de importância.

### 7.1 A tela no app *(não é minha — é do FINCASH)*
A rota `/api/whatsapp/vincular` está pronta e responde:

- `GET` → `{ vinculado, final, ativo, conta_padrao_id, cartao_padrao_id, numeroDoAssistente }`
- `POST` → `{ codigo, expira_em, numeroDoAssistente }`
- `DELETE` → desliga o vínculo

Falta a tela que chama isso e, principalmente, **o seletor de conta padrão**. Sem
ele, quem tem mais de uma conta ouve “de qual conta saiu?” em toda mensagem —
porque o assistente se recusa a chutar em qual conta o dinheiro entra.

### 7.2 Foto de nota fiscal e áudio *(implementado — falta ligar)*
Os dois estão escritos e testados (`node scripts/testar-whatsapp-midia.mjs`).
Ligam sozinhos quando `OPENAI_API_KEY` existe e `FINCASH_MIDIA_TETO_MES` não é
`0`. Sem chave, o assistente volta a pedir texto — sem `if` novo em lugar nenhum.

**Áudio.** OGG/Opus do WhatsApp vai direto para o Whisper (`whisper-1`,
`language: "pt"`), sem ffmpeg e sem arquivo temporário. O texto transcrito entra
em `interpretar()` de `whatsapp.ts` — **o mesmo interpretador do texto digitado**.
Não existe, e não pode passar a existir, um segundo interpretador para voz: no
dia em que existir, “mercado 280” escrito e falado começam a divergir e ninguém
sabe dizer qual dos dois está certo. Efeito colateral bom: a regra do número por
extenso vale para a voz também — “duzentos e oitenta” continua virando pergunta.
A resposta **mostra a transcrição** (“🎤 Ouvi: …”), porque quem foi transcrito
errado precisa ver o erro na hora, não no gráfico do fim do mês.

**Foto.** Dois caminhos, nesta ordem:

1. **NFC-e.** Quando a URL do QR chega em **texto** (legenda da foto, ou o link
   que o leitor de QR do celular copia), a chave de 44 dígitos é validada e o
   valor sai dela — exato, oficial, custo zero.
2. **Visão** (`gpt-4o-mini`, imagem em `detail: "low"`), pedindo **três campos e
   só três**: valor total, estabelecimento e data. A lista de itens é proibida no
   prompt — é onde o modelo inventa, e item inventado vira categoria errada.
   O que volta é **validado**: valor entre R$ 0,50 e R$ 50.000 (as duas pontas
   são modos de falha reais: total confundido com troco, e ponto decimal perdido
   transformando R$ 17,80 em R$ 1.780,00), data existente, não futura e de no
   máximo um ano atrás.

**A foto nunca grava direto.** Ela responde com uma proposta e espera um “sim”.
A proposta fica no `interpretacao` (jsonb) da própria linha da foto em
`fin_whatsapp_mensagens`, vale **15 minutos** e some no instante em que vira
lançamento — `lancamento_id` deixa de ser nulo e o “sim” repetido não duplica
nada. Quinze minutos porque “sim” é palavra perigosa: passada a conversa, um
“sim” solto sobre outro assunto gravaria um gasto que ninguém propôs. Responder
com um valor em texto (“mercado 280”) corrige a proposta pelo caminho normal.

#### O QR da NFC-e a partir dos PIXELS — não foi feito, e por quê
Decodificar QR de um JPEG em Node pede **duas dependências novas de runtime**
(um decodificador de imagem para produzir RGBA + um leitor tipo jsQR/zxing). O
`qrcode` que o projeto já tem só **gera** QR, e é `devDependency` — não existe em
produção. Instalar duas dependências é decisão do dono, não do código, então
ficou o encaixe pronto: `decodificarQrDaImagem()` em `whatsapp-foto.ts` devolve
`null` e o fluxo segue para a visão. Trocar o corpo dessa função liga o caminho
inteiro, sem mexer em mais nada.

Vale saber antes de começar: decodificar é metade do trabalho. A outra metade é
consultar a SEFAZ — **27 portais diferentes**, vários só com HTML para raspar,
alguns com captcha. O valor embutido no próprio QR (modo online) é o que dá
retorno rápido; a consulta completa é projeto à parte.

### 7.2.1 Custo e o teto mensal — **decisão de negócio pendente**
Ordem de grandeza, aos preços de referência:

| | por mensagem | 60 por mês |
|---|---|---|
| Áudio (Whisper, ~15s) | ~US$ 0,0015 | ~US$ 0,09 |
| Foto (visão, `detail: low`) | ~US$ 0,0003 | ~US$ 0,02 |

Ou seja: **poucos centavos de dólar por assinante/mês** no teto cheio. O risco
não é o preço unitário, é o uso sem limite — um único cliente que fotografa todo
comprovante do dia, todo dia, define a margem do produto.

Por isso existe `FINCASH_MIDIA_TETO_MES`, **60 por padrão** (áudio + foto
somados, por usuário, mês civil de São Paulo). O número é defensável — são ~2 por
dia, e quem usa o assistente a sério lança de 3 a 5 coisas por dia sendo a
maioria texto, que é grátis — mas **é provisório**: o definitivo depende do preço
da assinatura. `0` desliga mídia sem remover código.

O consumo é contado no próprio log (`fin_whatsapp_mensagens`, linhas de entrada
com `tipo` em `audio`/`imagem`) e o custo estimado vai em `interpretacao.custo_centavos`
— dá para responder “quanto o assistente custou este mês” com uma consulta ao
banco, em vez de conferindo fatura da OpenAI.

### 7.2.2 Privacidade da mídia
- O arquivo é baixado **em memória** e descartado. Nunca toca disco do servidor,
  nunca vira URL pública, nunca é reenviado para lugar nenhum além da OpenAI
  (a imagem vai como data URL **no corpo** da requisição, não como link).
- **Não se guarda o arquivo. Guarda-se o que foi extraído**: a transcrição do
  áudio, ou valor/estabelecimento/data do comprovante.
- Teto de tamanho **antes** da chamada paga: 6 MB para áudio, 5 MB para imagem,
  8 MB no download. Vídeo e documento continuam fora.
- ⚠️ **A política de privacidade precisa de uma frase sobre isto** (seção 4 de
  `src/app/privacidade/page.tsx`): que áudio e foto são processados e
  descartados, e que o que fica é o texto extraído. Não editei a política — é
  trabalho de outra pessoa.

### 7.3 Lembrete semanal e alerta fora da conversa
O alerta de orçamento já sai — mas junto da confirmação, dentro da conversa.

Mensagem que a Novare inicia (o lembrete de segunda-feira com as contas a vencer,
ou o alerta que chega sem a pessoa ter escrito) cai na **regra das 24h da Meta**:
fora da janela desde a última mensagem da pessoa, só passa **template aprovado**.
Então falta:

1. Cadastrar os templates em *Gerenciador do WhatsApp → Modelos de mensagem* e
   esperar a aprovação (costuma sair em horas).
2. Uma função de envio de template em `whatsapp-envio.ts` (hoje só existe texto).
3. Um agendador. A Vercel tem Cron Jobs; a rota nova viveria em
   `src/app/api/whatsapp/lembretes/` e precisa de segredo próprio — cron sem
   proteção é rota pública que dispara mensagem para a base inteira.

### 7.4 Limite compartilhado entre instâncias
O teto por IP de `api-security.ts` é por processo — cada instância serverless tem
o seu. Segura abuso casual, não ataque distribuído. A observação já está no
próprio `api-security.ts` (Upstash Redis é o caminho anotado lá).

### 7.5 Política de privacidade
Mesma pendência que `fincash.sql` já registra, agora um pouco maior: o log
guarda o **texto cru** do que a pessoa escreve no WhatsApp. A política precisa
dizer isso, e dizer por quanto tempo. Uma faxina periódica de
`fin_whatsapp_mensagens` (90 dias, por exemplo) é fácil de fazer e reduz o que
existe para vazar — só não decidi o prazo no lugar de quem responde por ele.

---

## 8. Decisões que valem conhecer antes de mexer

**Valor é sempre positivo.** O sinal vem de `tipo`. Está no `modelo.ts`, está no
`fincash.sql` e está repetido em `whatsapp-servidor.ts` porque é a regra que
quebra o saldo do app inteiro se alguém esquecer.

**Áudio grava; foto propõe.** A diferença não é técnica: no texto e no áudio
quem ditou o número foi a pessoa; na foto, quem ditou foi o modelo. Por isso a
foto sempre pede um “sim” antes de virar lançamento.

**Um interpretador só.** Áudio vira texto e passa por `interpretar()`; a proposta
da foto vira frase e passa por `interpretar()`. Categoria, conta padrão e data
saem do mesmo lugar em todos os canais — dois caminhos até o banco seria duas
verdades sobre a mesma frase.

**Ambiguidade não vira chute.** Sem valor, sem descrição ou sem saber a conta, o
assistente pergunta. Nunca escolhe a conta mais provável. Registro errado custa
mais caro que uma mensagem a mais.

**Número por extenso não é interpretado.** “mil e duzentos” não vira 1200 — vira
pergunta. Um parser de número escrito em português acerta ~90%, e 90% num app de
dinheiro é gravar valor errado uma vez a cada dez. (“mil” sozinho é a exceção:
não tem dois sentidos.)

**Parcelamento ficou de fora.** “300 em 3x” pelo WhatsApp geraria três
lançamentos, e o “desfazer” — que hoje é uma promessa simples e verdadeira —
teria de apagar os três. Parcelamento se faz na tela, onde dá para conferir.

**Categoria vem das que o cliente cadastrou.** A tabela de pistas em
`whatsapp.ts` (“uber” → transporte) só expande a **busca**; o alvo continua sendo
a lista dele. Quem não tiver categoria parecida recebe o lançamento **sem
categoria** e um aviso — melhor que um gráfico que mente.

**Sempre 200, menos assinatura inválida.** Provedor reenvia quando não recebe 200
rápido. Quem protege contra duplicata é o índice único
`(provedor, provedor_msg_id)`, não o status code.

**O “hoje” é o de São Paulo, não o do servidor.** A Vercel roda em UTC; sem o
ajuste, gasto lançado depois das 21h cairia no dia seguinte — e no dia 30, no mês
seguinte.

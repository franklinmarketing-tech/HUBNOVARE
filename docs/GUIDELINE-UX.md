# Guideline de uso fácil — Novare Hub

Criado em 24/10/2026, depois da queixa de clientes: "difícil de usar e de entender o FINCASH e as
ferramentas". Vale para **toda tela nova e toda mudança** em ferramenta, no FINCASH e na home.
Cada regra tem o motivo — regra sem motivo é a primeira que alguém quebra.

## 1. A primeira tela

| Regra | Por quê |
|---|---|
| **Nada abre sozinho por cima do conteúdo**, com duas exceções, cada uma uma vez só: o aviso de cookies (LGPD) e o **convite de primeiro uso** de cada tela ("Primeira vez aqui? Ver como usar / Agora não", pedido do dono em 24/10/2026), que só aparece **depois** do aceite dos cookies e nunca volta depois de fechado. | No celular, quem chegava fechava 2 ou 3 janelas empilhadas antes de ver a ferramenta. Um convite pequeno, na hora certa, ajuda quem nunca usou sem atrapalhar quem já sabe. |
| **No máximo 2 botões fixos na tela** (hoje: "Voltar + Manual" à esquerda, "Buscar" à direita) mais a aba "Fale com a gente". | Cinco botões flutuantes viram ruído e tampam o formulário. |
| **Abrir com exemplo calculado**, com a faixa "Exemplo — troque pelos seus números" e o botão "Começar do zero". | Tela vazia com R$ 0,00 não mostra o que a ferramenta entrega. |
| **O resultado tem de estar visível sem rolar no computador** (ou a 1 rolagem no celular). | Quem não vê o resultado acha que a ferramenta não funcionou. |

## 2. Texto

| Regra | Por quê |
|---|---|
| **Todo termo técnico tem explicação na própria tela** (frase curta embaixo do campo) e no Manual. Lista mínima: líquido, CET, SAC/Price, IPCA, CDI, Selic, prefixado, indexador, liquidez, OFX, realizado/planejado/previsto, fechamento da fatura, amortizar. | Explicação só no `title` (passar o mouse) não existe no celular. |
| **Rótulo diz o que digitar, não o nome técnico**: "O que cai na conta por mês" > "Renda líquida". Quando o nome técnico for necessário, vem junto. | O cliente não é do mercado financeiro. |
| **Botão diz a ação**: "Cadastrar conta", "Calcular", "Baixar PDF". Nunca "OK", "Enviar" solto. | Botão vago gera dúvida sobre o que vai acontecer. |
| **Nada de recomendação de produto, ativo ou banco** (regra CVM). Explicar, nunca indicar. | Consultoria de valores mobiliários é atividade regulada. |

## 3. Ajuda

| Regra | Por quê |
|---|---|
| **Toda tela tem Manual** (`src/lib/manuais/*`), aberto pelo botão "Manual", sempre fechado por padrão. Mesmas 5 partes em todas: o que faz · passo a passo · o que significa cada campo · como ler o resultado · dúvidas. | Ajuda igual em todo lugar a pessoa aprende uma vez. |
| **Toda tela tem vídeo curto (15–20 s, vertical)**, no topo do Manual (`public/manuais/*.mp4`). Gravação real da tela + legenda + locução. | Muita gente entende vendo, não lendo. |
| **O manual e o vídeo descrevem a tela REAL**: nomes de campo copiados do código. Mudou a tela → atualizar manual, roteiro e regravar o vídeo. | Manual que não bate com a tela é pior que nenhum. |
| **Estado vazio ensina**: diz o que fazer e tem o botão do próximo passo (componente `Vazio` no FINCASH). | "Nenhum item" é constatação; "1, 2, 3 + botão" é caminho. |
| **Tour na própria tela** (`TourTela.tsx`): acende até 6 campos do manual, um por vez. Só abre por clique (convite ou janela do manual), nunca sozinho. | Mostrar no lugar ensina mais rápido que descrever. |
| **"?" ao lado do termo** (`DicasCampos.tsx`): explicação do manual num toque. Os campos saem do manual (`acharCampos`): renomeou o rótulo, atualize o `nome` no manual. Não entra em tabela que rola de lado. | `title` de passar o mouse não existe no celular. |
| **Central de Ajuda** (`/ajuda`): busca local nos manuais, sem IA paga. | Site grátis não paga IA por pergunta. |
| **Novidades** (`src/lib/novidades.ts`): mudou algo que o cliente vê? Uma linha nova lá. | Quem volta precisa saber o que mudou. |
| **Mapa de cliques (Clarity)**: só depois do aceite dos cookies, FINCASH mascarado, nunca em admin/login. | LGPD e dado financeiro. |

## 4. FINCASH

| Regra | Por quê |
|---|---|
| **Primeiros passos com progresso** (`PrimeirosPassos.tsx`): conta → lançamento → conta fixa, com ✓ e barra. | A lista sem ✓ não mostrava o que faltava. |
| **Tela nova no menu só com Manual e vídeo prontos.** | São 14 telas; cada uma a mais sem ajuda aumenta a confusão. |

## 5. Medir antes de adivinhar

- Toda ferramenta grava **abriu → usou (primeiro campo mexido) → exportou (PDF)** em `hub_eventos`
  (`MedirUsoFerramenta`, `LiberarPdf`); o FINCASH grava cada passo concluído (`fincash-passo-N`).
- Nunca o conteúdo digitado — só o slug e a ação.
- A taxa "abriu → usou" baixa numa ferramenta = a primeira tela não está clara. "usou → exportou"
  baixa = o resultado não está convencendo.

## 6. Como (re)gravar o vídeo de uma tela

1. Edite o manual em `src/lib/manuais/` (o `roteiro` tem 3 frases, 35–50 palavras).
2. Gere a locução (Magnific, voz **Tiago Macedo**, `eleven_v4`) com as 3 frases e salve em
   `scripts/videos-manuais/_audio/<nome>.mp3` (nome: slug, ou `fincash-<tela>`).
3. Com o servidor em `localhost:3000`:
   `MSYS_NO_PATHCONV=1 npx tsx scripts/videos-manuais/fotografar.ts <chave>` e depois
   `MSYS_NO_PATHCONV=1 npx tsx scripts/videos-manuais/montar.ts <chave>` → `public/manuais/<nome>.mp4`.
4. Reinicie o `next start` (ele só serve arquivo público que existia quando subiu) e rode
   `MSYS_NO_PATHCONV=1 npx tsx scripts/testar-manuais.ts`.

⚠️ `MSYS_NO_PATHCONV=1` é obrigatório no Git Bash: sem ele, "/fincash/app" vira caminho do Windows.

## 7. Checklist antes de publicar uma tela

1. Abre sem nenhuma janela por cima (celular 390 px e computador 1440 px).
2. Tem exemplo calculado e "Começar do zero".
3. Todo termo técnico explicado na tela.
4. Manual escrito (5 partes) e vídeo gravado.
5. Sem rolagem lateral; botões com no mínimo 44 px de altura.
6. Nada que soe como recomendação de investimento.

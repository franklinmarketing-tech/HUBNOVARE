# Novare Hub

O workspace da Novare: cliente entra e vê todos os aplicativos, as ferramentas
gratuitas e a consultoria em um lugar só.

Next.js 15 (App Router), TypeScript, Tailwind v4, Supabase Auth.

## Rodar

```bash
npm install
npm run dev        # http://localhost:3000
```

Antes do primeiro `npm run dev`, copie `.env.local.example` para `.env.local`
e preencha as chaves do Supabase. O `.env.local` nunca vai para o git.

Antes do primeiro login funcionar, rode `supabase/hub_profiles.sql` no SQL
Editor do Supabase e promova seu usuário a admin (query comentada no fim do
arquivo).

## Estrutura

| Caminho | O que é |
|---|---|
| `src/lib/apps.ts` | Catálogo. App novo = uma entrada aqui, nenhuma tela muda. |
| `src/lib/capas.ts` | Imagem de capa de cada app. |
| `src/lib/calculos.ts` | Motor das calculadoras (juros compostos, Price, SAC, consórcio). |
| `src/lib/mercado.ts` | Indicadores do Banco Central, server-side. |
| `src/lib/consultoria.ts` | Os quatro formatos de consultoria e o desconto do assinante. |
| `src/app/ferramentas/` | Calculadoras que rodam dentro do Hub. |

## Estrutura de aplicação

O Hub segue o padrão de workspace de 2026 (Linear, Vercel, Raycast), não o de
landing page:

- **barra lateral fixa** no navy da marca, com navegação e contagem por seção
- **paleta de comandos** em `Cmd+K` / `Ctrl+K`, com busca tolerante a acento,
  navegação por seta e Enter para abrir
- **área de conteúdo** com grade densa de aplicativos

## Testar a paleta de comandos

```bash
node scripts/testar-paleta.mjs
```

Dez asserções de valor exato (atalho, foco, filtro, seta, Enter, Esc e
redirecionamento de app bloqueado). Sai com código 1 se qualquer uma falhar.

## Conferir o visual

```bash
node scripts/screenshot.mjs C:/tmp/novare-shots
```

Abre a home e duas calculadoras em 1440x900, salva os PNGs e reporta quantos
cards ficam acima da dobra e se apareceu rolagem horizontal. Use isso em vez de
adivinhar como a tela ficou.

## Imagens dos cards

As capas vêm de `public/cards/`, arquivos oficiais copiados do novareapp.
O mapa está em `src/lib/capas.ts`. Os apps criados aqui (juros compostos, os
três financiamentos e consórcio) ainda não têm foto e usam a capa desenhada em
gradiente da marca. Para trocar por imagem de verdade, salve o arquivo em
`public/cards/` e acrescente a linha em `CAPAS`.

## Padrão visual

Segue o dialeto das ferramentas públicas do novareapp, não uma invenção nova:

- escala de fonte encolhida, base 15px
- container `max-w-5xl`, gaps `gap-3`/`gap-4`
- raio aninhado: `rounded-3xl` bloco, `rounded-2xl` card, `rounded-xl` micro
- fundo `bg-gradient-to-b from-slate-50 to-white`
- **um único bloco escuro por página**
- laranja só no ponto de conversão
- ícones exclusivamente `lucide-react`, sem emoji
- sombras tintadas no navy da marca, nunca preto puro

## Regras

- Sem deploy, `git push` ou mudança de DNS sem pedido explícito.
- Sem segredos no repositório.

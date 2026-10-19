/**
 * PÁGINA DE SERVIDOR IMPORTANDO VALOR DE ARQUIVO "use client".
 *
 * ⚠️ ESTE ARQUIVO NASCEU DE UMA TELA QUE CAIU EM PRODUÇÃO (19/10/2026).
 * `/admin/leads` mostrava "Alguma coisa quebrou aqui" para o dono, e o log
 * da Vercel dizia `TypeError: SITUACOES.map is not a function`.
 *
 * A página de leads é Server Component e importava a lista `SITUACOES` de
 * `MarcarSituacao.tsx`, que é `"use client"`. No Next, tudo que sai de um
 * arquivo client vira uma REFERÊNCIA quando importado pelo servidor:
 *
 *   • componente funciona — o servidor só precisa apontar para ele;
 *   • qualquer outro valor (array, função, objeto) chega como um objeto
 *     opaco, e a primeira operação nele estoura.
 *
 * ⚠️ O PIOR DESTE DEFEITO É QUE ELE NÃO APARECE EM LUGAR NENHUM ANTES DE
 * ALGUÉM ABRIR A TELA. O `tsc` passa (os tipos estão certos), o `build`
 * passa, a varredura de rotas passa (a página pede login e devolve 307). O
 * erro só existe com a página renderizando de verdade — e essa tela ficou
 * quebrada desde a primeira versão do painel até o dono abrir.
 *
 * O QUE ELE CONFERE: em todo `page.tsx`, `layout.tsx`, `template.tsx`,
 * `not-found.tsx` e `default.tsx` de `src/app` SEM `"use client"`, cada
 * import com chaves de um arquivo local que TEM `"use client"`. Passam os
 * componentes (nome em Maiúscula) e os `type`. O resto é acusado.
 *
 * ⚠️ POR QUE SÓ ESSES ARQUIVOS, e não o projeto todo: uma biblioteca sem
 * `"use client"` (como `lib/fincash/modelo.ts`) importada só por telas
 * client roda no navegador e está certa. A primeira varredura olhou tudo e
 * acusou dez casos — nove eram isso. Páginas e layouts SÃO servidor, sempre
 * que não dizem o contrário; é lá que o defeito existe de fato.
 *
 *   node scripts/testar-imports-client.mjs
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(fileURLToPath(import.meta.url), "..", "..", "src");
const APP = path.join(RAIZ, "app");
const DE_SERVIDOR = /^(page|layout|template|not-found|default)\.(tsx|ts|jsx|js)$/;

const ehCliente = (p) => /^\s*["']use client["']/.test(readFileSync(p, "utf8"));

function resolver(de, especificador) {
  const base = especificador.startsWith("@/")
    ? path.join(RAIZ, especificador.slice(2))
    : especificador.startsWith(".")
      ? path.resolve(path.dirname(de), especificador)
      : null;
  if (!base) return null;
  for (const ext of ["", ".tsx", ".ts", "/index.tsx", "/index.ts"]) {
    const p = base + ext;
    if (existsSync(p) && statSync(p).isFile()) return p;
  }
  return null;
}

const paginas = [];
(function andar(d) {
  for (const f of readdirSync(d)) {
    const p = path.join(d, f);
    if (statSync(p).isDirectory()) andar(p);
    else if (DE_SERVIDOR.test(f)) paginas.push(p);
  }
})(APP);

const problemas = [];
for (const pagina of paginas) {
  if (ehCliente(pagina)) continue;
  const texto = readFileSync(pagina, "utf8");

  for (const m of texto.matchAll(/import\s+(type\s+)?\{([^}]+)\}\s+from\s+["']([^"']+)["']/g)) {
    if (m[1]) continue; // `import type { … }` some na compilação
    const alvo = resolver(pagina, m[3]);
    if (!alvo || !ehCliente(alvo)) continue;

    const valores = m[2]
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith("type "))
      .map((s) => s.split(/\s+as\s+/)[0].trim())
      /* Componente React: começa com Maiúscula seguida de minúscula.
         `SITUACOES` (tudo maiúsculo) é constante — e é exatamente o caso. */
      .filter((n) => !/^[A-Z][a-z]/.test(n));

    for (const v of valores) {
      problemas.push({
        pagina: path.relative(RAIZ, pagina),
        valor: v,
        de: path.relative(RAIZ, alvo),
      });
    }
  }
}

console.log("");
if (problemas.length === 0) {
  console.log(
    `nenhuma página de servidor importa valor de arquivo "use client": ${paginas.length} páginas e layouts conferidos.`,
  );
  process.exit(0);
}

for (const p of problemas) {
  console.log(`  XX  ${p.pagina} importa \`${p.valor}\` de ${p.de}`);
}
console.log(
  `\n${problemas.length} caso(s). No servidor esse valor chega como referência opaca e a tela cai ao abrir.\n` +
    "Mova a constante para um arquivo SEM \"use client\" e importe de lá nos dois lados.",
);
process.exit(1);

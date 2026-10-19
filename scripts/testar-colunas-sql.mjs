/**
 * `created_at` NUMA TABELA QUE SE CHAMA `criado_em`.
 *
 * ⚠️ ESTE ARQUIVO NASCEU DE DOIS ERROS IGUAIS NO MESMO DIA (18/10/2026).
 * Duas vezes um SQL foi entregue ao dono para rodar em produção usando
 * `created_at` numa tabela desta casa — e as tabelas desta casa são escritas
 * em PORTUGUÊS: `criado_em`. Nas duas vezes o banco respondeu
 *
 *     ERROR: 42703: column "created_at" does not exist
 *
 * e nas duas o custo não foi o erro em si: foi o editor do Supabase rodar
 * tudo numa transação só, de modo que UMA coluna errada no fim do arquivo
 * desfaz as trinta coisas certas que vieram antes. O dono rodou, esperou, e
 * não instalou nada.
 *
 * ⚠️ POR QUE A CONFUSÃO VAI CONTINUAR ACONTECENDO: `auth.users` é tabela do
 * Supabase e usa `created_at` de verdade. As duas grafias convivem no mesmo
 * arquivo, legitimamente, cada uma certa na sua tabela. Não há como
 * "padronizar" para um lado só — só dá para conferir.
 *
 * ── COMO ELE PROCURA, e por que não é um parser ──────────────────────────
 *
 * A primeira versão deste guardião casava `tabela.coluna` e conferia a
 * coluna no schema. Parecia mais rigoroso e tinha dois defeitos:
 *
 *   1. ⚠️ NÃO PEGARIA O ERRO QUE O FEZ NASCER. A linha era
 *      `select user_id, max(created_at) from public.fin_lancamentos` — sem
 *      prefixo nenhum. Um guardião que não pega o caso que motivou sua
 *      existência é teatro.
 *   2. Acusava apelido de CTE como se fosse tabela, e nome de arquivo
 *      dentro de comentário como se fosse coluna.
 *
 * Então ele faz o que dá para fazer com honestidade: para cada `created_at`
 * ou `updated_at` fora de comentário, olha a VIZINHANÇA. Se por ali há uma
 * tabela nossa que tem o equivalente em português, e não há `auth.users`
 * para justificar a grafia inglesa, reclama.
 *
 * ⚠️ É CONSERVADOR DE PROPÓSITO: prefere deixar passar a gritar à toa.
 * Guardião barulhento ninguém lê — e é assim que um erro de verdade passa.
 *
 *   node scripts/testar-colunas-sql.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(fileURLToPath(import.meta.url), "..", "..");
const PASTA = path.join(RAIZ, "supabase");

/** Quantos caracteres em volta contam como "a vizinhança". */
const JANELA = 420;

/* ── 1. As colunas de cada tabela, lidas dos `create table` do repo ─────── */
function lerSchema() {
  const tabelas = new Map();

  for (const arq of readdirSync(PASTA).filter((f) => f.endsWith(".sql"))) {
    const texto = readFileSync(path.join(PASTA, arq), "utf8");

    const re = /create table (?:if not exists )?(?:public\.)?(\w+)\s*\(([\s\S]*?)\n\);/gi;
    let m;
    while ((m = re.exec(texto))) {
      const [, nome, corpo] = m;
      const colunas = tabelas.get(nome) ?? new Set();
      for (const linha of corpo.split("\n")) {
        const limpa = linha.replace(/--.*$/, "").trim();
        const c = limpa.match(
          /^(\w+)\s+(uuid|text|int|integer|bigint|bigserial|serial|numeric|boolean|date|timestamptz|timestamp|jsonb|json)\b/i,
        );
        if (c && !/^(constraint|check|primary|foreign|unique|exclude)$/i.test(c[1])) {
          colunas.add(c[1].toLowerCase());
        }
      }
      tabelas.set(nome, colunas);
    }

    for (const a of texto.matchAll(
      /alter table (?:public\.)?(\w+)([\s\S]*?);/gi,
    )) {
      const colunas = tabelas.get(a[1]) ?? new Set();
      for (const c of a[2].matchAll(/add column (?:if not exists )?(\w+)/gi)) {
        colunas.add(c[1].toLowerCase());
      }
      if (colunas.size) tabelas.set(a[1], colunas);
    }
  }

  return tabelas;
}

const schema = lerSchema();

/** Em português, o par de cada nome inglês. */
const PARES = { created_at: "criado_em", updated_at: "atualizado_em" };

/* ── 2. A varredura ────────────────────────────────────────────────────── */
const problemas = [];

for (const arq of readdirSync(PASTA).filter((f) => f.endsWith(".sql"))) {
  const bruto = readFileSync(path.join(PASTA, arq), "utf8");

  /* Comentário não roda. Vira espaço, para as posições não se deslocarem e
     o número da linha continuar valendo. */
  const texto = bruto
    .split("\n")
    .map((l) => {
      const i = l.indexOf("--");
      return i === -1 ? l : l.slice(0, i) + " ".repeat(l.length - i);
    })
    .join("\n")
    .replace(/\/\*[\s\S]*?\*\//g, (b) => " ".repeat(b.length));

  /* Todas as origens de linha do arquivo, com onde cada uma aparece.
     ⚠️ `auth.users` ENTRA NESTA MESMA LISTA, e isso é o que faz o teste
     funcionar: a primeira versão perguntava "existe auth.users por perto?"
     e perdoava tudo, porque numa função que cruza as duas bases sempre
     existe. Aqui ela concorre com as outras pela proximidade, como qualquer
     tabela. */
  const origens = [];
  /** apelido → tabela, para `u.created_at` saber quem é `u`. */
  const apelidos = new Map();

  for (const t of texto.matchAll(
    /\b(?:from|join|update|into)\s+(auth\.users|(?:public\.)?\w+)(?:\s+(?:as\s+)?([a-z]\w*))?/gi,
  )) {
    const tabela = t[1].toLowerCase().replace(/^public\./, "");
    origens.push({ pos: t.index ?? 0, tabela });

    const apelido = t[2]?.toLowerCase();
    if (
      apelido &&
      !/^(select|where|set|on|values|group|order|using|returning|left|right|full|inner|outer|join|limit|and|or)$/.test(apelido)
    ) {
      apelidos.set(apelido, tabela);
    }
  }

  for (const ingles of Object.keys(PARES)) {
    for (const m of texto.matchAll(new RegExp(`\\b${ingles}\\b`, "gi"))) {
      const pos = m.index ?? 0;

      /* ⚠️ O APELIDO MANDA, quando existe. `u.created_at` com
         `join auth.users u` está CERTO, mesmo que um `from hub_profiles p`
         esteja escrito duas linhas mais perto — foi assim que este guardião
         acusou um arquivo correto na sua segunda versão. */
      const prefixo = texto
        .slice(Math.max(0, pos - 40), pos)
        .match(/([a-z]\w*)\.\s*$/i)?.[1]
        ?.toLowerCase();

      let dona = prefixo ? (apelidos.get(prefixo) ?? null) : null;

      /* Sem prefixo, o `from` MAIS PRÓXIMO — e não "algum from por perto".
         Em SQL a coluna pertence ao `from` do próprio `select`, e numa
         função que junta `hub_leads` com `auth.users` os dois estão sempre
         na mesma vizinhança: perguntar "tem auth.users por aí?" perdoaria o
         erro exatamente onde ele mora. */
      if (!dona) {
        let menor = Infinity;
        for (const o of origens) {
          const d = Math.abs(o.pos - pos);
          if (d < menor && d <= JANELA) {
            menor = d;
            dona = o.tabela;
          }
        }
      }
      if (!dona) continue;
      if (dona === "auth.users") continue;   // lá a grafia inglesa é a certa

      const colunas = schema.get(dona);
      if (!colunas) continue;                     // CTE ou tabela de fora
      if (colunas.has(ingles)) continue;          // a tabela TEM mesmo
      if (!colunas.has(PARES[ingles])) continue;  // não tem o par: não opino

      problemas.push({
        arquivo: arq,
        linha: texto.slice(0, pos).split("\n").length,
        errado: ingles,
        certo: PARES[ingles],
        tabela: dona,
      });
    }
  }
}

const unicos = [
  ...new Map(problemas.map((p) => [`${p.arquivo}:${p.linha}`, p])).values(),
].sort((a, b) => a.arquivo.localeCompare(b.arquivo) || a.linha - b.linha);

console.log("");
if (unicos.length === 0) {
  console.log(
    `as colunas de data batem com o schema: ${schema.size} tabelas lidas, nenhum "created_at" em tabela que se chama "criado_em".`,
  );
  process.exit(0);
}

for (const p of unicos) {
  console.log(
    `  XX  ${p.arquivo}:${p.linha} — "${p.errado}" perto de ${p.tabela}, que tem "${p.certo}"`,
  );
}
console.log(
  `\n${unicos.length} ocorrência(s). ⚠️ O editor do Supabase roda o arquivo numa transação só: uma coluna errada desfaz tudo que veio antes.`,
);
process.exit(1);

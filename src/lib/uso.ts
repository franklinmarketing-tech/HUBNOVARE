/**
 * REGISTRO DE USO — o que a casa passou a saber em 17/10/2026.
 *
 * ⚠️ ANTES DISTO NÃO HAVIA NADA. Nenhuma tabela de evento, nenhuma lib de
 * analytics, nenhum registro de abertura de app. A pergunta "o que os
 * clientes estão acessando?" não tinha resposta — o "Continue de onde parou"
 * da home lê `localStorage`, que fica no aparelho da pessoa e nunca sobe.
 *
 * ═══ AS TRÊS REGRAS DESTE ARQUIVO ════════════════════════════════════════
 *
 * 1. **Nunca atrapalha o usuário.** Tudo é best-effort e silencioso: se a
 *    tabela não existir, se a rede cair, se o rate limit bater — a pessoa
 *    não vê nada e a tela não trava. Medição que quebra produto é medição
 *    que vai ser arrancada na primeira sexta-feira.
 *
 * 2. **Nada de `await` no caminho da tela.** O evento sai em segundo plano
 *    e a tela nunca espera por ele. (Até 21/11/2026 ia por `/api/uso` com
 *    `keepalive`; agora vai direto ao Supabase — ver `gravarEvento`.)
 *
 * 3. ⚠️ **Nada de conteúdo.** Vai o slug do módulo e a ação, nunca o que foi
 *    digitado, nem valor, nem nome de arquivo. Do outro lado está o dinheiro
 *    do cliente: um log de uso que vaza hábito financeiro é pior do que não
 *    existir.
 */

/**
 * A lista fechada de ações — a MESMA que `/api/uso` aceita e que o check de
 * `hub_eventos.acao` permite. "clicou" e "fechou" entraram em 05/11/2026 para
 * medir a venda e a captação (`lib/medir.ts`); o check do banco ganha as duas
 * em `supabase/hub_eventos_acoes.sql`.
 */
export const ACOES_USO = ["abriu", "usou", "salvou", "exportou", "clicou", "fechou"] as const;
export type AcaoUso = (typeof ACOES_USO)[number];

/**
 * Evita repetir o mesmo evento na mesma visita.
 *
 * Sem isto, um componente que remonta (navegação do App Router, re-render,
 * StrictMode em dev) gravaria "abriu" três vezes e o ranking viraria uma
 * medida de quantas vezes o React montou, não de quantas pessoas usaram.
 */
const jaRegistrado = new Set<string>();

export function registrarUso(modulo: string, acao: AcaoUso = "abriu") {
  if (typeof window === "undefined") return;
  // O localhost grava no banco de produção: teste não é uso (21/10/2026).
  if (/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) return;

  const chave = `${modulo}:${acao}`;
  if (acao === "abriu") {
    if (jaRegistrado.has(chave)) return;
    jaRegistrado.add(chave);
  }

  gravarEvento(modulo, acao);
}

/**
 * ⚠️ DIRETO DO NAVEGADOR PARA O SUPABASE (21/11/2026).
 *
 * Até aqui todo evento passava pela rota `/api/uso` — e como TODA página
 * aberta grava um "abriu", cada visita custava uma chamada de servidor na
 * Vercel (a rota ainda perguntava ao Supabase quem era a pessoa). Com as
 * páginas saindo prontas, isso virou quase todo o processamento que sobrava.
 *
 * A gravação é a MESMA que a rota fazia: mesma chave pública, mesma tabela,
 * mesmas regras do banco (RLS, o check de `acao` e o gatilho
 * `hub_eventos_barra_equipe`, que descarta a equipe pelo `usuario_id`). A
 * rota nunca usou chave de servidor — ela só repassava.
 *
 * O que a rota tinha e isto não tem: o `keepalive` (regra 2). Para "abriu" e
 * "usou" não faz falta — a pessoa continua na página. O clique que leva
 * embora (botão de venda) segue pela rota, em `lib/medir.ts`, com `sendBeacon`.
 *
 * O cliente do Supabase entra por `import()` porque este arquivo também é
 * lido pela rota (`ACOES_USO`), que roda no servidor.
 */
export function gravarEvento(modulo: string, acao: AcaoUso) {
  const m = modulo.trim().slice(0, 60);
  if (!m) return;
  void (async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const sb = createClient();
      const {
        data: { session },
      } = await sb.auth.getSession();
      await sb.from("hub_eventos").insert({ usuario_id: session?.user?.id ?? null, modulo: m, acao });
    } catch {
      /* Silêncio de propósito: ver a regra 1. */
    }
  })();
}

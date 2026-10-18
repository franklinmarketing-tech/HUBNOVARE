import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import {
  alertaDeContas,
  alertaDeFatura,
  alertaDeOrcamento,
  alertaDeResumo,
  diaDe,
  type Alerta,
  type ConfigAlertas,
} from "@/lib/fincash/alertas";
import { limitesDoMes, refDoMes, resumirMes } from "@/lib/fincash/modelo";
import { enviarTexto, whatsappConfigurado } from "@/lib/fincash/whatsapp-envio";

/**
 * A ROTINA QUE MANDA OS ALERTAS. Roda uma vez por dia, pelo cron da Vercel.
 *
 * ═══ O QUE ELA FAZ, E O QUE ELA DELIBERADAMENTE NÃO FAZ ══════════════════
 *
 * Ela lê, decide com as regras de `lib/fincash/alertas.ts` e envia. As
 * regras não moram aqui: moram lá, sem banco e sem rede, porque é assim que
 * dá para prová-las (`scripts/testar-alertas.mjs`). Alerta errado não é um
 * pixel torto — é uma mensagem indevida no celular de um cliente.
 *
 * ⚠️ PRECISA DA CHAVE DE SERVIÇO. Para saber o que avisar, é preciso ler
 * dados de todas as pessoas que ligaram algum alerta — e a RLS, com razão,
 * só deixa cada um ver o que é seu. Sem `SUPABASE_SERVICE_ROLE_KEY` a rota
 * responde 503 e não finge que funcionou.
 *
 * ⚠️ EXIGE SEGREDO NO CABEÇALHO. Sem isso, qualquer um que descobrisse o
 * endereço dispararia mensagens para a base inteira — e o estrago não seria
 * só o incômodo: WhatsApp não pedido derruba a reputação do número na Meta,
 * e a entrega de todo mundo junto.
 *
 * ⚠️ UM ERRO EM UMA PESSOA NÃO PODE PARAR AS OUTRAS. Cada cliente é
 * processado no seu próprio try: um número inválido, uma tabela faltando ou
 * uma recusa da Meta interrompem aquele, e só.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const CHAVE_SERVICO = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const SEGREDO = process.env.CRON_SEGREDO ?? "";

type Linha = ConfigAlertas & { usuario_id: string };

export async function GET(requisicao: Request) {
  /* ── A PORTA ──────────────────────────────────────────────────────────
     O cron da Vercel manda `Authorization: Bearer <CRON_SECRET>`; aceitamos
     também `?chave=` para dar para disparar à mão num teste. */
  const url = new URL(requisicao.url);
  const veio =
    requisicao.headers.get("authorization")?.replace(/^Bearer /, "") ??
    url.searchParams.get("chave") ??
    "";

  if (!SEGREDO || veio !== SEGREDO) {
    /* 404 e não 401: um 401 confirma que existe uma rotina aqui. */
    return new NextResponse(null, { status: 404 });
  }

  if (!CHAVE_SERVICO || !URL_SUPABASE) {
    return NextResponse.json(
      { erro: "SUPABASE_SERVICE_ROLE_KEY não configurada" },
      { status: 503 },
    );
  }
  if (!whatsappConfigurado()) {
    return NextResponse.json(
      { erro: "o canal de WhatsApp não está configurado" },
      { status: 503 },
    );
  }

  const db = createClient(URL_SUPABASE, CHAVE_SERVICO, {
    auth: { persistSession: false },
  });

  /* Só quem ligou alguma coisa. O índice parcial da tabela existe para isto. */
  const { data: configs, error } = await db
    .from("fin_whatsapp_alertas")
    .select("*")
    .or(
      "contas_ligado.eq.true,fatura_ligado.eq.true,orcamento_ligado.eq.true,resumo_ligado.eq.true",
    );

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  const hoje = new Date();
  const hojeIso = diaDe(hoje);
  const ref = refDoMes(hoje);
  const { inicio, fim } = limitesDoMes(ref);

  let enviados = 0;
  let pessoas = 0;
  const problemas: string[] = [];

  for (const cfg of (configs ?? []) as Linha[]) {
    try {
      /* O número da pessoa. Sem WhatsApp ligado, não há para onde mandar —
         e isso é normal: a tela deixa configurar antes de ligar. */
      const { data: conta } = await db
        .from("fin_whatsapp_contas")
        .select("telefone, ativo")
        .eq("user_id", cfg.usuario_id)
        .maybeSingle();

      if (!conta?.telefone || conta.ativo === false) continue;

      const alertas: Alerta[] = [];

      if (cfg.contas_ligado || cfg.fatura_ligado) {
        const { data: recorrencias } = await db
          .from("fin_recorrencias")
          .select("descricao, valor, dia, tipo, ativa")
          .eq("user_id", cfg.usuario_id);

        const { data: cartoes } = await db
          .from("fin_cartoes")
          .select("nome, dia_fechamento")
          .eq("user_id", cfg.usuario_id)
          .eq("arquivado", false);

        const a = alertaDeContas(cfg, recorrencias ?? [], hoje);
        if (a) alertas.push(a);
        const f = alertaDeFatura(cfg, cartoes ?? [], hoje);
        if (f) alertas.push(f);
      }

      if (cfg.orcamento_ligado) {
        /* Teto por categoria no mês, e o que já saiu em cada uma. */
        const { data: tetos } = await db
          .from("fin_orcamentos")
          .select("valor, categoria_id, fin_categorias(nome)")
          .eq("user_id", cfg.usuario_id)
          .eq("mes_ref", ref);

        const { data: gastos } = await db
          .from("fin_lancamentos")
          .select("valor, categoria_id, tipo")
          .eq("user_id", cfg.usuario_id)
          .gte("data", inicio)
          .lte("data", fim);

        const porCat = new Map<string, number>();
        for (const g of gastos ?? []) {
          if (g.tipo !== "despesa" || !g.categoria_id) continue;
          porCat.set(g.categoria_id, (porCat.get(g.categoria_id) ?? 0) + Number(g.valor));
        }

        const lista = (tetos ?? []).map((t) => {
          const cat = t.fin_categorias as unknown as { nome?: string } | null;
          return {
            categoria: cat?.nome ?? "Sem categoria",
            teto: Number(t.valor),
            gasto: porCat.get(t.categoria_id as string) ?? 0,
          };
        });

        const o = alertaDeOrcamento(cfg, lista, hoje);
        if (o) alertas.push(o);
      }

      if (cfg.resumo_ligado) {
        const { data: lancamentos } = await db
          .from("fin_lancamentos")
          .select("valor, tipo, pago")
          .eq("user_id", cfg.usuario_id)
          .gte("data", inicio)
          .lte("data", fim);

        /* ⚠️ A MESMA FUNÇÃO QUE O APP USA. Recalcular "quanto ainda dá para
           gastar" com uma conta própria aqui produziria dois números para a
           mesma pergunta — e num app de dinheiro, dois números encerram a
           conversa: a pessoa para de acreditar nos dois. */
        const resumo = resumirMes(
          (lancamentos ?? []).map((l) => ({
            valor: Number(l.valor),
            tipo: l.tipo,
            pago: l.pago,
          })) as Parameters<typeof resumirMes>[0],
        );

        const diasRestantes = Math.max(
          0,
          new Date(fim).getDate() - hoje.getDate(),
        );

        const r = alertaDeResumo(cfg, resumo.sobraPrevista, diasRestantes, hoje);
        if (r) alertas.push(r);
      }

      if (!alertas.length) continue;

      for (const alerta of alertas) {
        await enviarTexto({ para: conta.telefone, texto: alerta.texto });
        enviados++;

        /* Marca logo após enviar, e não no fim: se a próxima mensagem
           falhar, a que já saiu não pode ser reenviada amanhã. */
        await db
          .from("fin_whatsapp_alertas")
          .update({ [`ultimo_${alerta.tipo}`]: hojeIso })
          .eq("usuario_id", cfg.usuario_id);
      }

      pessoas++;
    } catch (e) {
      /* Ver o aviso do topo: o erro de um não pode calar os outros. */
      problemas.push(
        `${cfg.usuario_id.slice(0, 8)}: ${e instanceof Error ? e.message : "erro"}`,
      );
    }
  }

  return NextResponse.json({
    ok: true,
    dia: hojeIso,
    configurados: configs?.length ?? 0,
    pessoas,
    enviados,
    problemas,
  });
}

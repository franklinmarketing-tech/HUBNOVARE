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
import {
  enviarAlertaDoFincash,
  TETO_DIARIO_DE_ALERTAS,
} from "@/lib/email";

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
 * ⚠️ O CANAL MUDOU DE WHATSAPP PARA E-MAIL + SINO, e o motivo é preço. A
 * Meta cobra R$ 0,035 por mensagem de utilidade e, desde 1º/10/2026, cobra
 * também dentro da janela de 24h que antes era gratuita. Com o FINCASH de
 * graça, seria custo por cliente sem receita atrás. Decisão do dono: no
 * FINCASH, só o que não cobra nada.
 *
 * Nada do motor mudou: `lib/fincash/alertas.ts` decide O QUE avisar e nunca
 * soube por onde sairia. Trocar o canal inteiro não custou uma linha de
 * regra nem um dos 24 testes.
 *
 * ⚠️ O SINO É A BASE, O E-MAIL É O REFORÇO. O sino (`hub_notificacoes`) não
 * tem teto e não custa nada; o e-mail tem 100/dia no plano gratuito da
 * Resend. Quando o teto chega, o e-mail para e o sino continua — ninguém
 * fica sem o aviso, e a conta não vira cobrança.
 *
 * ⚠️ EXIGE SEGREDO NO CABEÇALHO. Sem isso, qualquer um que descobrisse o
 * endereço dispararia avisos para a base inteira.
 *
 * ⚠️ UM ERRO EM UMA PESSOA NÃO PODE PARAR AS OUTRAS. Cada cliente é
 * processado no seu próprio try: um número inválido, uma tabela faltando ou
 * uma recusa da Meta interrompem aquele, e só.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const CHAVE_SERVICO = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
/**
 * ⚠️ `.trim()` NOS DOIS LADOS, E NÃO É ZELO EXCESSIVO.
 *
 * Isto custou três deploys para ser descoberto: o valor colado no painel da
 * Vercel tinha 41 caracteres e o enviado, 40 — um espaço invisível no fim,
 * que entra sozinho ao copiar de um chat ou de um editor. A comparação
 * falhava, a resposta era 404 muda, e nada no mundo indicava a causa.
 *
 * Segredo é feito para ser copiado e colado por gente. Quem compara tem de
 * tolerar o que o copiar-e-colar acrescenta.
 */
const SEGREDO = (process.env.CRON_SEGREDO ?? "").trim();

type Linha = ConfigAlertas & { usuario_id: string };

export async function GET(requisicao: Request) {
  /* ── A PORTA ──────────────────────────────────────────────────────────
     O cron da Vercel manda `Authorization: Bearer <CRON_SECRET>`; aceitamos
     também `?chave=` para dar para disparar à mão num teste. */
  const url = new URL(requisicao.url);
  const veio = (
    requisicao.headers.get("authorization")?.replace(/^Bearer /, "") ??
    url.searchParams.get("chave") ??
    ""
  ).trim();

  if (!SEGREDO || veio !== SEGREDO) {
    /**
     * ⚠️ A RESPOSTA É MUDA, MAS O LOG NÃO PODE SER.
     *
     * Para quem chama, 404 — um 401 confirmaria que existe uma rotina aqui.
     * Mas um 404 silencioso também esconde de QUEM CUIDA DISSO a diferença
     * entre "a variável não chegou no deploy" e "o valor está diferente", e
     * essas duas têm conserto oposto. Custou duas rodadas de chute descobrir
     * isso na mão.
     *
     * O log sai no painel da Vercel, que é privado, e NUNCA imprime os
     * valores — só se existem e o tamanho. Tamanho igual com valores
     * diferentes é quase sempre espaço no fim de um deles, que é o engano
     * mais comum ao colar.
     */
    console.warn(
      "[alertas] recusado. " +
        `CRON_SEGREDO configurado: ${SEGREDO ? "sim" : "NÃO"}` +
        (SEGREDO ? ` (${SEGREDO.length} caracteres)` : "") +
        `; recebido: ${veio ? `${veio.length} caracteres` : "nada"}` +
        `; origem: ${requisicao.headers.get("authorization") ? "header" : url.searchParams.get("chave") ? "query" : "nenhuma"}`,
    );
    return new NextResponse(null, { status: 404 });
  }

  if (!CHAVE_SERVICO || !URL_SUPABASE) {
    return NextResponse.json(
      { erro: "SUPABASE_SERVICE_ROLE_KEY não configurada" },
      { status: 503 },
    );
  }

  const db = createClient(URL_SUPABASE, CHAVE_SERVICO, {
    auth: { persistSession: false },
  });

  /* Só quem ligou alguma coisa. O índice parcial da tabela existe para isto. */
  const { data: configs, error } = await db
    .from("fin_alertas")
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
  let emailsHoje = 0;
  let naoCoubeNoEmail = 0;
  const problemas: string[] = [];

  for (const cfg of (configs ?? []) as Linha[]) {
    try {
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

      /* ── O SINO: sempre, e sem teto ──────────────────────────────────
         Uma linha por alerta, porque cada uma leva a pessoa para a tela
         certa do app. É o canal que nunca falha por limite. */
      await db.from("hub_notificacoes").insert(
        alertas.map((a) => ({
          usuario_id: cfg.usuario_id,
          titulo: tituloDe(a),
          texto: a.texto,
          href: DESTINO[a.tipo],
          tipo: a.tipo === "orcamento" ? "alerta" : "aviso",
        })),
      );

      /* ── O E-MAIL: um só, com tudo, e só enquanto couber no gratuito ──
         ⚠️ UM E-MAIL COM OS QUATRO AVISOS, NUNCA QUATRO E-MAILS. Quatro
         mensagens no mesmo dia para a mesma pessoa é o caminho curto para
         ela marcar a Novare como spam — e aí ela deixa de receber até o
         que pediu. */
      if (emailsHoje < TETO_DIARIO_DE_ALERTAS) {
        const { data: perfil } = await db
          .from("hub_profiles")
          .select("nome")
          .eq("id", cfg.usuario_id)
          .maybeSingle();

        const { data: usuario } = await db.auth.admin.getUserById(cfg.usuario_id);
        const email = usuario?.user?.email;

        if (email) {
          await enviarAlertaDoFincash({
            email,
            nome: perfil?.nome ?? null,
            blocos: alertas.map((a) => ({ titulo: tituloDe(a), texto: a.texto })),
          });
          emailsHoje++;
        }
      } else {
        naoCoubeNoEmail++;
      }

      enviados += alertas.length;

      /* Marca cada tipo como avisado hoje. Depois da entrega, nunca antes:
         marcar antes e falhar depois cala o aviso de verdade. */
      const marcas: Record<string, string> = {};
      for (const a of alertas) marcas[`ultimo_${a.tipo}`] = hojeIso;
      await db
        .from("fin_alertas")
        .update(marcas)
        .eq("usuario_id", cfg.usuario_id);

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
    avisos: enviados,
    emails: emailsHoje,
    /* Quem recebeu no sino mas não no e-mail por causa do teto gratuito. */
    semEmail: naoCoubeNoEmail,
    problemas,
  });
}

/** O título curto de cada aviso, para o sino e para o assunto do e-mail. */
function tituloDe(a: Alerta): string {
  return {
    contas: "Conta chegando",
    fatura: "Fatura fechando",
    orcamento: "Orçamento apertando",
    resumo: "Quanto ainda dá para gastar",
  }[a.tipo];
}

/** Para onde o clique no sino leva, em cada caso. */
const DESTINO: Record<Alerta["tipo"], string> = {
  contas: "/fincash/app/fixas",
  fatura: "/fincash/app/faturas",
  orcamento: "/fincash/app/orcamento",
  resumo: "/fincash/app",
};

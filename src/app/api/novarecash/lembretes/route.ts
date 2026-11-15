import { NextResponse } from "next/server";

import { enviarLembreteNovareCash } from "@/lib/email";
import { enviarTelegram, telegramConfigurado } from "@/lib/fincash/telegram";
import { SITE_URL } from "@/lib/site";
import { servico } from "@/lib/novarecash/assinantes";
import { somarDias } from "@/lib/novarecash/cartoes";
import { carregarMesDeContas, type ItemDoMes } from "@/lib/novarecash/contas-pagar";
import { dataCurta, hojeNoBrasil } from "@/lib/novarecash/dados";
import { carregarReceber, linkCobranca, mensagemDeCobranca, type LinhaReceber } from "@/lib/novarecash/receber";

/**
 * O LEMBRETE DIÁRIO POR E-MAIL (15/11/2026, comparação com a Concentra).
 *
 * Roda pelo cron da Vercel (`vercel.json`), 1x por dia de manhã. Para cada dono
 * de NovareCash com contas a pagar ou A receber:
 *   - contas a pagar: na VÉSPERA, no DIA e com 1, 3 e 7 dias de ATRASO;
 *   - A receber: no DIA da cobrança e com 1, 3 e 7 dias de atraso.
 * Um e-mail por dono por dia, no máximo (`ncash_lembretes_email` é a reserva,
 * gravada ANTES do envio). Quem desligou em Ajustes não recebe.
 *
 * Só assinante (ou equipe) — a mesma regra do app (`ncash_tem_acesso_email`).
 *
 * TELEGRAM (15/11/2026): quem ligou o Telegram recebe o MESMO aviso lá (no
 * Telegram o robô pode iniciar conversa sem custo; no WhatsApp, não). A
 * reserva do Telegram é `ncash_lembretes_enviados` (a mesma do aviso que sai
 * na 1ª mensagem do dia), para a pessoa não receber a lista duas vezes.
 * E-mail e Telegram desligam separados (Ajustes / tela do Telegram).
 *
 * ⚠️ Precisa de `CRON_SECRET` (a Vercel manda `Authorization: Bearer <ela>`) e de
 * `RESEND_API_KEY`. Sem a primeira, 503 e nada acontece.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Em quais "dias até vencer" o lembrete sai. Negativo = atraso. */
const DIAS_CONTA = new Set([1, 0, -1, -3, -7]);
const DIAS_COBRAR = new Set([0, -1, -3, -7]);

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function quandoConta(i: ItemDoMes): string {
  if (i.dias < 0) return `Venceu ${dataCurta(i.vence)} · há ${-i.dias} ${i.dias === -1 ? "dia" : "dias"}`;
  if (i.dias === 0) return "Vence hoje";
  return `Vence amanhã, ${dataCurta(i.vence)}`;
}

function quandoCobrar(l: LinhaReceber): string {
  if (l.dias !== null && l.dias < 0 && l.item.vence_em) return `Era para ${dataCurta(l.item.vence_em)} · há ${-l.dias} ${l.dias === -1 ? "dia" : "dias"}`;
  return `Cobrar hoje${l.item.descricao ? ` · ${l.item.descricao}` : ""}`;
}

export async function GET(req: Request) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo) return NextResponse.json({ erro: "CRON_SECRET não configurado" }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${segredo}`) return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  const comEmail = Boolean(process.env.RESEND_API_KEY);
  const comTelegram = telegramConfigurado();
  if (!comEmail && !comTelegram) return NextResponse.json({ erro: "nem RESEND_API_KEY nem TELEGRAM_BOT_TOKEN" }, { status: 503 });
  const db = servico();
  if (!db) return NextResponse.json({ erro: "serviço indisponível" }, { status: 503 });

  const hoje = hojeNoBrasil();
  const amanha = somarDias(hoje, 1);

  // Quem tem algo com data: contas a pagar ativas ou A receber em aberto.
  const [cp, rc] = await Promise.all([
    db.from("ncash_contas_pagar").select("user_id").eq("ativa", true).limit(20000),
    db.from("ncash_receber").select("user_id").eq("arquivado", false).limit(20000),
  ]);
  const donos = [...new Set([...(cp.data ?? []), ...(rc.data ?? [])].map((l) => String((l as { user_id: unknown }).user_id)))];

  let enviados = 0;
  let telegramas = 0;
  let pulados = 0;
  const falhas: string[] = [];

  for (const uid of donos) {
    try {
      // 1. O que pede atenção hoje.
      const mes = await carregarMesDeContas(db, uid, hoje.slice(0, 7), hoje).catch(() => null);
      const contas = (mes?.itens ?? []).filter((i) => !i.pagamento && DIAS_CONTA.has(i.dias));
      if (amanha.slice(0, 7) !== hoje.slice(0, 7)) {
        const prox = await carregarMesDeContas(db, uid, amanha.slice(0, 7), hoje).catch(() => null);
        contas.push(...(prox?.itens ?? []).filter((i) => !i.pagamento && i.vence === amanha));
      }
      const cobrar = (await carregarReceber(db, uid, hoje).catch(() => [] as LinhaReceber[])).filter(
        (l) => l.situacao !== "recebido" && l.dias !== null && DIAS_COBRAR.has(l.dias),
      );
      if (!contas.length && !cobrar.length) continue;

      // 3. Assinante? E o e-mail do dono.
      const { data: u } = await db.auth.admin.getUserById(uid);
      const email = u?.user?.email;
      if (!email) continue;
      const { data: perfil } = await db.from("hub_profiles").select("role, nome").eq("id", uid).maybeSingle();
      const equipe = ["admin", "equipe"].includes(String((perfil as { role?: unknown } | null)?.role ?? ""));
      if (!equipe) {
        const { data: tem } = await db.rpc("ncash_tem_acesso_email", { p_email: email });
        if (tem !== true) {
          pulados++;
          continue;
        }
      }

      contas.sort((a, b) => a.vence.localeCompare(b.vence));
      const itens = contas.length + cobrar.length;

      // 4. TELEGRAM, para quem ligou e não desligou o lembrete. Reserva antes do envio.
      if (comTelegram) {
        const { data: tg } = await db.from("ncash_telegram").select("chat_id, lembretes").eq("user_id", uid).not("confirmado_em", "is", null).maybeSingle();
        const chat = (tg as { chat_id?: string | null; lembretes?: boolean } | null)?.chat_id;
        if (chat && (tg as { lembretes?: boolean }).lembretes !== false) {
          const { error: r } = await db.from("ncash_lembretes_enviados").insert({ user_id: uid, dia: hoje, contas: itens });
          if (!r) {
            await enviarTelegram(chat, textoTelegram(contas, cobrar)).catch((e) => falhas.push(`tg: ${e instanceof Error ? e.message.slice(0, 80) : "falha"}`));
            telegramas++;
          }
        }
      }

      // 5. E-MAIL: desligado em Ajustes? (sem a coluna, segue ligado.) Reserva ANTES do envio.
      if (!comEmail) continue;
      const { data: pref } = await db.from("ncash_preferencias").select("lembretes_email").eq("user_id", uid).maybeSingle();
      if (pref && (pref as { lembretes_email?: unknown }).lembretes_email === false) {
        pulados++;
        continue;
      }
      const { error: reserva } = await db.from("ncash_lembretes_email").insert({ user_id: uid, dia: hoje, itens });
      if (reserva) {
        pulados++;
        continue;
      }

      const nome = ((perfil as { nome?: unknown } | null)?.nome as string | null) ?? (u.user?.user_metadata?.nome as string | undefined) ?? null;
      await enviarLembreteNovareCash({
        email,
        nome,
        contas: contas
          .slice(0, 15)
          .map((i) => ({ descricao: i.conta.descricao, valor: brl(i.conta.valor), quando: quandoConta(i), atrasada: i.dias < 0 })),
        cobrancas: cobrar.slice(0, 15).map((l) => ({
          pessoa: l.item.pessoa,
          valor: brl(l.falta),
          quando: quandoCobrar(l),
          atrasada: (l.dias ?? 0) < 0,
          link: linkCobranca(l) ?? `https://wa.me/?text=${encodeURIComponent(mensagemDeCobranca(l))}`,
        })),
      });
      enviados++;
    } catch (e) {
      falhas.push(e instanceof Error ? e.message.slice(0, 120) : "falha");
    }
  }

  if (falhas.length) console.warn("[lembretes] falhas:", falhas.slice(0, 5));
  return NextResponse.json({ ok: true, donos: donos.length, enviados, telegramas, pulados, falhas: falhas.length });
}

/** O aviso das 8h no Telegram: as contas, as cobranças (com o link de cobrar pronto) e o atalho de baixa. */
function textoTelegram(contas: ItemDoMes[], cobrar: LinhaReceber[]): string {
  const partes: string[] = ["*Bom dia! O NovareCash de hoje:*"];
  if (contas.length) {
    const total = contas.reduce((s, i) => s + i.conta.valor, 0);
    partes.push("", `*Contas* (${brl(total)}):`);
    for (const i of contas.slice(0, 10)) partes.push(`• ${i.conta.descricao}: ${brl(i.conta.valor)} — ${quandoConta(i).toLowerCase()}`);
    if (contas.length > 10) partes.push(`• e mais ${contas.length - 10}`);
    partes.push("Pagou? Me diga “paguei a …”.");
  }
  if (cobrar.length) {
    const total = cobrar.reduce((s, l) => s + l.falta, 0);
    partes.push("", `*Para cobrar* (${brl(total)}):`);
    for (const l of cobrar.slice(0, 10)) {
      const link = linkCobranca(l) ?? `https://wa.me/?text=${encodeURIComponent(mensagemDeCobranca(l))}`;
      partes.push(`• ${l.item.pessoa}: ${brl(l.falta)} — [cobrar no WhatsApp](${link})`);
    }
    if (cobrar.length > 10) partes.push(`• e mais ${cobrar.length - 10}`);
    partes.push("Recebeu? Me diga “o … pagou”.");
  }
  partes.push("", `Tudo em ${SITE_URL}/novarecash/app`);
  return partes.join("\n");
}

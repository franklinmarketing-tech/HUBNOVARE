import { NextResponse } from "next/server";
import { excedeuLimitePorIp, respostaLimite } from "@/lib/api-security";
import { agendarFim, ativar, cortar, servico } from "@/lib/novarecash/assinantes";
import {
  assinaturaKiwifyValida,
  classificarKiwify,
  dadosKiwify,
  ehProdutoNovareCash,
  listaDaEnv,
  planoKiwify,
  prazoKiwify,
  validadeKiwify,
  type PayloadKiwify,
} from "@/lib/novarecash/kiwify";

/**
 * O AVISO DA KIWIFY — a plataforma PRINCIPAL de venda do NovareCash desde
 * 05/11/2026 (a Hotmart, em `/api/novarecash/hotmart`, ficou de reserva). É daqui
 * que nasce (e morre) o acesso de quem compra pela Kiwify.
 *
 * Grava o estado de hoje em `ncash_assinantes` (uma linha por e-mail) e o aviso
 * cru no MESMO diário da Hotmart, `ncash_hotmart_eventos`, com o evento
 * prefixado `KIWIFY:` (ex.: `KIWIFY:order_approved`) — sem tabela nova.
 * A leitura do formato da Kiwify mora em `lib/novarecash/kiwify.ts`; o que cada
 * família faz no banco, em `lib/novarecash/assinantes.ts` (comum às duas).
 *
 * ⚠️ O TOKEN É OBRIGATÓRIO. Sem `KIWIFY_WEBHOOK_TOKEN` a rota recusa tudo (503):
 * um webhook que aceita qualquer um é um botão "me dê o NovareCash de graça".
 * A Kiwify manda `?signature=` = HMAC-SHA1 do corpo cru com esse token; corpo
 * alterado ou token errado = 401. Aceita vários tokens separados por vírgula
 * (mais de um webhook, ou a troca de token).
 *
 * ⚠️ PRODUTO CERTO: na Kiwify é UM produto "NovareCash" com SEIS planos, um por
 * plano e prazo ("NovareCash Plus Anual"…) — o nome do PLANO decide o que se
 * libera (ver `kiwify.ts`). Aviso de produto cujo nome não começa com
 * "NovareCash" — ou, com `KIWIFY_PRODUTO_NOVARECASH` (lista de ids por vírgula),
 * fora da lista — fica no diário e é ignorado.
 *
 * A coprodução com o sócio é configurada NA KIWIFY (ela divide o dinheiro);
 * nada aqui depende dela.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (excedeuLimitePorIp(req, "novarecash-kiwify", 120)) return respostaLimite();

  const tokens = listaDaEnv(process.env.KIWIFY_WEBHOOK_TOKEN);
  if (!tokens.length) return NextResponse.json({ erro: "integracao nao configurada" }, { status: 503 });

  // O CORPO CRU, antes de qualquer parse: a assinatura é sobre estes bytes.
  const corpo = await req.text();
  const assinatura = new URL(req.url).searchParams.get("signature");
  if (!assinaturaKiwifyValida(corpo, assinatura, tokens)) {
    return NextResponse.json({ erro: "assinatura invalida" }, { status: 401 });
  }

  let p: PayloadKiwify;
  try {
    p = JSON.parse(corpo) as PayloadKiwify;
    if (!p || typeof p !== "object") throw new Error("nao e objeto");
  } catch {
    return NextResponse.json({ erro: "corpo invalido" }, { status: 400 });
  }

  const db = servico();
  if (!db) return NextResponse.json({ erro: "servico indisponivel" }, { status: 503 });

  const evento = classificarKiwify(p);
  const { email, nome, transacao, assinatura: codigoAssinatura } = dadosKiwify(p);

  // O diário guarda TUDO, inclusive o ignorado — é ele que responde "a Kiwify avisou?".
  // O segredo não está no corpo (a assinatura vem na URL), então nada a tirar.
  await db
    .from("ncash_hotmart_eventos")
    .insert({ evento: `KIWIFY:${evento.tipo}`, email: email || null, transacao, payload: p });

  if (!ehProdutoNovareCash(p, process.env.KIWIFY_PRODUTO_NOVARECASH)) {
    return NextResponse.json({ ok: true, ignorado: "outro produto" });
  }
  if (!email) return NextResponse.json({ ok: true, ignorado: "sem e-mail" });

  switch (evento.familia) {
    case "ativa":
      return ativar(db, {
        email,
        nome,
        plano: planoKiwify(p),
        expiraEm: validadeKiwify(p, prazoKiwify(p)),
        prazo: prazoKiwify(p),
        assinatura: codigoAssinatura,
        transacao,
      });
    case "corta":
      // Reembolso e chargeback: o dinheiro voltou ou está em disputa — corta sempre.
      return cortar(db, { email, status: evento.status, transacao, soSeMesmaTransacao: false });
    case "fim":
      return agendarFim(db, email, evento.status);
    default:
      // Pix/boleto gerado, compra recusada…: só o diário.
      return NextResponse.json({ ok: true, ignorado: evento.tipo });
  }
}

import { NextResponse } from "next/server";
import { excedeuLimitePorIp, respostaLimite } from "@/lib/api-security";
import { COOKIE_EBOOKS } from "@/lib/ebooks";
import { investimentoValido } from "@/lib/faixas-investimento";

const CENTO_E_OITENTA_DIAS = 180 * 24 * 60 * 60;

/**
 * A TRAVA DOS eBOOKS, NO SERVIDOR (21/10/2026).
 *
 * O `PortaoGuia` chama esta rota no clique, com o contato da trava. Se os
 * quatro campos vierem válidos (nome, e-mail, WhatsApp, investimento), o
 * navegador ganha o cookie que `/ebooks/baixar/<arquivo>` confere. O lead em
 * si continua indo por `/api/lead`, em paralelo — aqui não grava nada.
 *
 * ⚠️ O COOKIE NÃO É ASSINADO, DE PROPÓSITO. A trava é um pedágio de contato,
 * não um login: quem quiser burlar digita um contato falso em 10 segundos, e
 * assinatura nenhuma impede isso. O que a rota resolve é o caso real — o
 * link do PDF copiado e mandado num grupo, que abria o guia para todo mundo
 * sem trava. Quem recebe o link não tem o cookie e cai na trava.
 */
export async function POST(req: Request) {
  if (excedeuLimitePorIp(req, "ebooks-liberar", 30)) return respostaLimite();

  let corpo: { nome?: unknown; email?: unknown; telefone?: unknown; investimento?: unknown };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "corpo inválido" }, { status: 400 });
  }

  const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const valido =
    texto(corpo.nome).length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto(corpo.email)) &&
    texto(corpo.telefone).replace(/\D/g, "").length >= 10 &&
    investimentoValido(texto(corpo.investimento));

  if (!valido) return NextResponse.json({ erro: "contato incompleto" }, { status: 400 });

  const resposta = NextResponse.json({ ok: true });
  resposta.cookies.set(COOKIE_EBOOKS, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/ebooks",
    maxAge: CENTO_E_OITENTA_DIAS,
  });
  return resposta;
}

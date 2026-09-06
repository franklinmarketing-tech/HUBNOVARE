import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Janela = { inicio: number; usos: number };

const limites = new Map<string, Janela>();

/**
 * O IP de quem chamou.
 *
 * Atrás da Vercel o IP real vem em `x-forwarded-for` — o primeiro da
 * lista, porque os seguintes são os proxies do caminho. Sem cabeçalho
 * (chamada local, teste), cai numa chave única para não confundir
 * requisições diferentes num mesmo balde.
 */
export function ipDaRequisicao(req: Request): string {
  const encaminhado = req.headers.get("x-forwarded-for");
  if (encaminhado) return encaminhado.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "desconhecido";
}

/**
 * Limite por IP, para rota que qualquer um alcança sem login.
 *
 * A memória é do processo: cada instância serverless tem a sua, e ela
 * some quando a instância recicla. Isso segura abuso casual e script
 * simples — que é o risco real hoje —, mas não um ataque distribuído.
 * Para isso é preciso um contador compartilhado (Upstash Redis); está
 * anotado no briefing como próximo passo.
 */
export function excedeuLimitePorIp(
  req: Request,
  rota: string,
  maximo: number,
  janelaMs = 60_000,
) {
  return excedeuLimite(ipDaRequisicao(req), rota, maximo, janelaMs);
}

/** A resposta padrão de quem passou do limite. */
export function respostaLimite(mensagem?: string) {
  return NextResponse.json(
    {
      erro:
        mensagem ??
        "Muitas tentativas em pouco tempo. Espere um minuto e tente de novo.",
    },
    { status: 429, headers: { "Retry-After": "60" } },
  );
}

export async function exigirUsuarioApi() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      resposta: NextResponse.json(
        { erro: "Faca login para usar a Iris." },
        { status: 401 },
      ),
    };
  }

  return { user, resposta: null };
}

/** Limite por usuario para chamadas que geram custo. */
export function excedeuLimite(
  usuarioId: string,
  rota: string,
  maximo: number,
  janelaMs = 60_000,
) {
  const agora = Date.now();
  const chave = `${rota}:${usuarioId}`;
  const atual = limites.get(chave);
  const dentroDaJanela = atual && agora - atual.inicio < janelaMs;
  const proximo: Janela = dentroDaJanela
    ? { inicio: atual.inicio, usos: atual.usos + 1 }
    : { inicio: agora, usos: 1 };

  limites.set(chave, proximo);
  return proximo.usos > maximo;
}

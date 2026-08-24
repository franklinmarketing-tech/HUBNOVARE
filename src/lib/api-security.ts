import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Janela = { inicio: number; usos: number };

const limites = new Map<string, Janela>();

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

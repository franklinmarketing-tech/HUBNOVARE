import { NextResponse } from "next/server";

import { excedeuLimite, excedeuLimitePorIp, respostaLimite } from "@/lib/api-security";
import { createClient } from "@/lib/supabase/server";
import { temAcessoNovareCash } from "@/lib/novarecash/acesso";
import { carregarRetrato, retratoEmTexto } from "@/lib/novarecash/retrato";
import { usuarioDaSessao } from "@/lib/novarecash/dados";
import {
  COTA_DIARIA_IA,
  ErroIA,
  HISTORICO_MAXIMO,
  TAMANHO_MAXIMO,
  iaConfigurada,
  promptDeSistema,
  responder,
  type Mensagem,
} from "@/lib/novarecash/ia";

/**
 * A IA do NovareCash: uma pergunta → uma resposta com os números da pessoa.
 *
 * AS CAMADAS, nesta ordem (layout NÃO protege route handler — tudo é conferido
 * de novo aqui):
 *   1. Teto por IP (memória do processo; segura script simples).
 *   2. Login (`getUser`, que revalida o token).
 *   3. Assinatura (`ncash_tem_acesso()` no banco; equipe sempre passa).
 *   4. Teto por minuto por usuário (rajada).
 *   5. Cota DIÁRIA no banco (`ncash_ia_consumir`), contada ANTES de chamar o
 *      modelo e devolvida se o modelo falhar.
 *
 * O CONTEXTO é lido com a SESSÃO da pessoa (RLS "ncash: dono manda"), só das
 * tabelas próprias do NovareCash (`ncash_*`, ver `retrato.ts`). Nada de chave
 * de serviço aqui.
 *
 * TODA FALHA VOLTA COMO FRASE para a tela (`{ erro }`), nunca como 500 cru.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const erro = (mensagem: string, status: number) => NextResponse.json({ erro: mensagem }, { status });

function lerMensagens(corpo: unknown): Mensagem[] | null {
  const lista = (corpo as { mensagens?: unknown })?.mensagens;
  if (!Array.isArray(lista) || lista.length === 0 || lista.length > 40) return null;

  const mensagens: Mensagem[] = [];
  for (const m of lista) {
    const papel = (m as { papel?: unknown })?.papel;
    const texto = (m as { texto?: unknown })?.texto;
    if ((papel !== "usuario" && papel !== "ia") || typeof texto !== "string") return null;
    const limpo = texto.trim().slice(0, papel === "usuario" ? TAMANHO_MAXIMO : 4000);
    if (limpo) mensagens.push({ papel, texto: limpo });
  }

  // Só as mais recentes, começando por uma da pessoa (a API exige) e terminando nela.
  let recentes = mensagens.slice(-HISTORICO_MAXIMO);
  while (recentes.length && recentes[0].papel !== "usuario") recentes = recentes.slice(1);
  if (!recentes.length || recentes[recentes.length - 1].papel !== "usuario") return null;
  return recentes;
}

export async function POST(req: Request) {
  if (excedeuLimitePorIp(req, "novarecash-ia", 30)) return respostaLimite();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return erro("Sua sessão expirou. Entre de novo para usar a IA.", 401);

  if (!(await temAcessoNovareCash())) {
    return erro("A IA faz parte do NovareCash. Veja os planos em /novarecash.", 403);
  }

  if (excedeuLimite(user.id, "novarecash-ia", 8)) {
    return erro("Muitas perguntas seguidas. Espere um minuto e tente de novo.", 429);
  }

  const mensagens = lerMensagens(await req.json().catch(() => null));
  if (!mensagens) return erro("Não entendi a pergunta. Escreva de novo, por favor.", 400);

  if (!iaConfigurada()) {
    return erro("A IA está sendo ligada. Volte em breve — o seu extrato continua aqui no NovareCash.", 503);
  }

  // Cota do dia, no banco. Falta do SQL vira aviso, não 500.
  const { data: cota, error: erroCota } = await supabase.rpc("ncash_ia_consumir", {
    p_cota: COTA_DIARIA_IA,
  });
  if (erroCota) {
    console.warn("[novarecash-ia] cota indisponivel:", erroCota.message);
    return erro("A IA está sendo instalada. Tente de novo em alguns minutos.", 503);
  }
  const linhaCota = (Array.isArray(cota) ? cota[0] : cota) as { permitido?: boolean; usadas?: number } | null;
  const usadas = Number(linhaCota?.usadas ?? 0);
  if (!linhaCota?.permitido || usadas > COTA_DIARIA_IA) {
    return NextResponse.json(
      {
        erro: `Você usou as ${COTA_DIARIA_IA} perguntas de hoje. A cota renova à meia-noite.`,
        usadas: Math.min(usadas, COTA_DIARIA_IA),
        cota: COTA_DIARIA_IA,
      },
      { status: 429 },
    );
  }

  try {
    // Os números são do DONO do NovareCash aberto (conta compartilhada); a cota e o nome, de quem pergunta.
    const dono = await usuarioDaSessao(supabase).catch(() => user.id);
    const [retrato, perfil] = await Promise.all([
      carregarRetrato(supabase, dono),
      supabase.from("hub_profiles").select("nome").eq("id", user.id).maybeSingle(),
    ]);
    const nome = (perfil.data?.nome as string | undefined)?.split(" ")[0] ?? null;

    const resposta = await responder(promptDeSistema(nome, retratoEmTexto(retrato)), mensagens);
    return NextResponse.json({ resposta, usadas, cota: COTA_DIARIA_IA });
  } catch (e) {
    // A pergunta não foi respondida por erro nosso: devolve a cota.
    await supabase.rpc("ncash_ia_devolver").then(
      () => undefined,
      () => undefined,
    );
    if (e instanceof ErroIA && e.motivo === "recusa") {
      return erro("Não consigo ajudar com essa pergunta. Tente perguntar sobre os seus gastos, saldo ou orçamento.", 422);
    }
    console.error("[novarecash-ia] falhou:", e instanceof Error ? e.message : e);
    return erro("A IA não respondeu agora. Tente de novo em instantes.", 502);
  }
}

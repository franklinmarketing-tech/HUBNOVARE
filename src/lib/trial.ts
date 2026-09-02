"use client";

/**
 * O teste grátis de 7 dias, self-service — e a leitura ÚNICA de "pode usar?".
 *
 * A pessoa clica em "começar grátis", cria a senha, entra no app e usa. Não há
 * cartão na porta de entrada e não há ninguém para liberar nada — o relógio
 * começa a correr sozinho na primeira vez que ela abre o produto.
 *
 * DUAS FONTES, UMA RESPOSTA
 * A assinatura vive em dois lugares por herança: o Hub grava plano em
 * `hub_profiles` (é lá que o admin libera alguém e que o pagamento será
 * marcado), e o teste corre em `vidaplan_subscriptions` (nasceu com o Vida
 * Plan antigo). Antes desta versão os dois sistemas não se falavam: dava
 * para ser `pro` no Hub e "vencido" aqui. Agora a ordem é explícita:
 *
 *   1. `hub_profiles` manda: role admin/equipe OU plano `pro` válido → ativo.
 *   2. Senão, vale o teste de `vidaplan_subscriptions`.
 *
 * ONDE O TESTE É GRAVADO
 * Na tabela `vidaplan_subscriptions`: chave por `user_id`, e as policies
 * permitem que o próprio dono LEIA e INICIE a assinatura, sem passar por
 * admin. O usuário pode INSERIR, mas NÃO pode dar UPDATE (é o que impede
 * alguém de estender o próprio teste pelo console do navegador).
 *
 * ATIVAÇÃO PÓS-PAGAMENTO
 * Quem compra (checkout Kiwify/Hotmart) é marcado `pro` em `hub_profiles` —
 * pelo webhook quando existir, ou pelo admin enquanto não existe. Este
 * módulo já entende isso hoje: marcou `pro`, liberou.
 */

import { createClient } from "@/lib/supabase/client";
import { ASSINATURA_TRIAL_DIAS } from "@/lib/assinatura";

export type Assinatura = {
  /** `trial` durante o teste, `active` pago/liberado, `inactive` vencido. */
  status: "inactive" | "trial" | "active";
  plano: "free" | "gold";
  trialAte: Date | null;
  /** Quantos dias faltam. Negativo quer dizer vencido. */
  diasRestantes: number | null;
  /** Tem direito de usar o produto pago agora? */
  liberado: boolean;
};

const DIA_MS = 24 * 60 * 60 * 1000;

const ATIVA: Assinatura = {
  status: "active",
  plano: "gold",
  trialAte: null,
  diasRestantes: null,
  liberado: true,
};

function montar(linha: {
  status?: string | null;
  plano?: string | null;
  trial_until?: string | null;
}): Assinatura {
  const status = (linha.status ?? "inactive") as Assinatura["status"];
  const trialAte = linha.trial_until ? new Date(linha.trial_until) : null;

  const diasRestantes = trialAte
    ? Math.ceil((trialAte.getTime() - Date.now()) / DIA_MS)
    : null;

  // O teste vale enquanto a data não passou. Pago vale sempre. Fora isso, não.
  const trialValido = status === "trial" && diasRestantes !== null && diasRestantes > 0;

  return {
    status,
    plano: (linha.plano ?? "free") as Assinatura["plano"],
    trialAte,
    diasRestantes,
    liberado: status === "active" || trialValido,
  };
}

/**
 * Lê a assinatura e, se for a primeira visita, começa o teste.
 *
 * Começar aqui — e não no cadastro — é deliberado: quem cria conta e some sem
 * abrir o produto não queima os 7 dias sem ter usado nada.
 */
export async function garantirTeste(): Promise<Assinatura | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // 1) O Hub manda. Admin/equipe e assinante `pro` não têm relógio nenhum.
  const { data: perfil } = await supabase
    .from("hub_profiles")
    .select("role, plano, plano_expira_em")
    .eq("id", user.id)
    .maybeSingle();

  if (perfil) {
    const expirou =
      !!perfil.plano_expira_em && new Date(perfil.plano_expira_em) < new Date();
    const proValido = perfil.plano === "pro" && !expirou;
    const equipe = perfil.role === "admin" || perfil.role === "equipe";
    if (proValido || equipe) return ATIVA;
  }

  // 2) Senão, o teste.
  const { data: existente } = await supabase
    .from("vidaplan_subscriptions")
    .select("status, plano, trial_until")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existente) return montar(existente);

  const fim = new Date(Date.now() + ASSINATURA_TRIAL_DIAS * DIA_MS);
  const novo = {
    user_id: user.id,
    plano: "free",
    status: "trial",
    trial_until: fim.toISOString(),
  };

  const { error } = await supabase.from("vidaplan_subscriptions").insert(novo);

  // Se a gravação falhar (rede, corrida entre duas abas), não é motivo para
  // barrar ninguém: o produto segue aberto e a próxima visita tenta de novo.
  if (error) {
    return {
      status: "trial",
      plano: "free",
      trialAte: fim,
      diasRestantes: ASSINATURA_TRIAL_DIAS,
      liberado: true,
    };
  }

  return montar(novo);
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { lerPremissas } from "@/lib/planejamento/premissas";
import {
  carregarRetrato,
  resolverCliente,
  type EstadoCliente,
  type Retrato,
} from "@/lib/planejamento/cliente";
import { calcularDiagnostico, type Diagnostico } from "@/lib/planejamento/diagnostico";
import {
  computeHealthScore,
  computeLifePlan,
  reservaEmergencia,
  type LifePlan,
  type LifePlanInput,
  type SaudeFinanceira,
} from "@/lib/planejamento/lifeplan";
import { computeActionPlan, type ActionPlan } from "@/lib/planejamento/actionplan";
import { montarEntrada } from "@/lib/planejamento/montarPlano";
import { mesAtual } from "@/lib/planejamento/catalogos";
import { PERFIS, type PerfilComportamental, houveResposta, respostasIniciais } from "@/lib/planejamento/perfil";

export type Reserva = ReturnType<typeof reservaEmergencia>;

/**
 * `behavioral_profile` é um jsonb livre: pode estar vazio, vir de uma versão
 * antiga do app ou ter sido escrito à mão. Só aceita o que é um perfil válido.
 */
function lerPerfil(bruto: unknown): PerfilComportamental | null {
  if (!bruto || typeof bruto !== "object") return null;
  // Registro antigo com tudo no valor inicial carrega o "Construtor" que o
  // empate carimbava em quem nunca respondeu — perfil inventado não passa.
  if (!houveResposta({ ...respostasIniciais(), ...(bruto as object) })) return null;
  const valor = (bruto as { computed_profile?: unknown }).computed_profile;
  return typeof valor === "string" && valor in PERFIS
    ? (valor as PerfilComportamental)
    : null;
}

export type DadosPlanejamento = {
  clientId: string;
  status: string;
  retrato: Retrato;
  entrada: LifePlanInput;
  plano: LifePlan;
  saude: SaudeFinanceira;
  reserva: Reserva;
  acoes: ActionPlan;
  diagnostico: Diagnostico;
  /** Quantos dependentes — pesa na sugestão de proteção. */
  dependentes: number;
  /** Perfil comportamental, se a pessoa já respondeu o bloco 8 da trilha. */
  perfil: PerfilComportamental | null;
  /** Nenhuma renda e nenhuma despesa: a trilha ainda não foi preenchida. */
  vazio: boolean;
};

type Resultado =
  | { fase: "carregando" }
  | { fase: "sem-sessao" }
  | { fase: "sem-ficha" }
  /**
   * A leitura falhou.
   *
   * Sem esta fase, uma queda de rede era indistinguível de ficha vazia: as
   * listas voltavam vazias e a tela dizia "você ainda não preencheu nada" a
   * quem tem meses de dados lançados. Pior conselho possível na hora errada.
   */
  | { fase: "erro" }
  | { fase: "pronto"; dados: DadosPlanejamento };

/**
 * Carrega a ficha do cliente e roda todos os motores de uma vez.
 *
 * Todas as telas do app precisam do mesmo conjunto: retrato, diagnóstico, plano
 * de vida, saúde financeira e plano de ação. Calcular em um lugar só garante
 * que o número do painel e o número do relatório nunca discordem — no app
 * antigo essa discordância existia porque cada tela refazia a conta do seu
 * jeito.
 */
export function usePlanejamento(mes = mesAtual()): Resultado {
  const [resultado, setResultado] = useState<Resultado>({ fase: "carregando" });

  useEffect(() => {
    let ativo = true;

    (async () => {
      const estado: EstadoCliente = await resolverCliente();
      if (!ativo) return;

      if (estado.tipo === "sem-sessao") return setResultado({ fase: "sem-sessao" });
      if (estado.tipo === "sem-ficha") return setResultado({ fase: "sem-ficha" });

      const supabase = createClient();
      const [retrato, cliente, escolhidas] = await Promise.all([
        carregarRetrato(estado.clientId, mes),
        supabase
          .from("clients")
          .select("date_of_birth, status, dependents_count, behavioral_profile")
          .eq("id", estado.clientId)
          .maybeSingle(),
        lerPremissas(),
      ]);
      if (!ativo) return;

      // Retrato ilegível: não dá para calcular nada honesto em cima disso, e
      // seguir mostraria zeros como se fossem os números da pessoa.
      if (retrato.falhou) return setResultado({ fase: "erro" });

      // As premissas que a pessoa escolheu na trilha entram na conta; campo
      // não respondido fica undefined e o motor usa o padrão de sempre.
      const entrada = montarEntrada(
        retrato,
        { nascimento: cliente.data?.date_of_birth ?? null },
        {
          idadeAposentadoria: escolhidas.idadeAposentadoria ?? undefined,
          rendaDesejada: escolhidas.rendaDesejadaMes ?? undefined,
          rendaINSS: escolhidas.rendaINSSMes ?? undefined,
        },
      );
      const plano = computeLifePlan(entrada);

      setResultado({
        fase: "pronto",
        dados: {
          clientId: estado.clientId,
          status: cliente.data?.status ?? estado.status,
          dependentes: cliente.data?.dependents_count ?? 0,
          perfil: lerPerfil(cliente.data?.behavioral_profile),
          retrato,
          entrada,
          plano,
          saude: computeHealthScore(entrada, plano),
          reserva: reservaEmergencia(entrada),
          acoes: computeActionPlan(entrada, plano),
          diagnostico: calcularDiagnostico({
            rendas: retrato.rendas,
            despesas: retrato.despesas,
            dividas: retrato.dividas,
            patrimonio: retrato.patrimonio,
          }),
          vazio: retrato.rendas.length === 0 && retrato.despesas.length === 0,
        },
      });
    })();

    return () => {
      ativo = false;
    };
  }, [mes]);

  return resultado;
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, ChevronRight } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { ErroDados, dataCurta, hojeNoBrasil, usuarioDaSessao } from "@/lib/novarecash/dados";
import { carregarMesDeContas, proximasContas, type ItemDoMes } from "@/lib/novarecash/contas-pagar";
import { AvisoInstalacao, ANEL, AvisoErro, Botao, COR_SAIDA, Cartao, Esqueleto, Selo, brl } from "../pecas";

/**
 * AS PRÓXIMAS CONTAS, para o Início: atrasadas, de hoje e dos próximos 7 dias.
 * Lê sozinho (com a sessão). Regras em `src/lib/novarecash/contas-pagar.ts`.
 */
export function CartaoProximasContas({ maximo = 5 }: { maximo?: number }) {
  const sb = useMemo(() => createClient(), []);
  const [estado, setEstado] = useState<"carregando" | "pronto" | "sem-tabela" | "erro">("carregando");
  const [itens, setItens] = useState<ItemDoMes[]>([]);
  const [temCadastro, setTemCadastro] = useState(false);

  const carregar = useCallback(async () => {
    setEstado("carregando");
    try {
      const uid = await usuarioDaSessao(sb);
      const hoje = hojeNoBrasil();
      const mes = await carregarMesDeContas(sb, uid, hoje.slice(0, 7), hoje);
      setTemCadastro(mes.contas.length > 0);
      setItens(proximasContas(mes.itens, 7));
      setEstado("pronto");
    } catch (e) {
      setEstado(e instanceof ErroDados && e.motivo === "sem-tabela" ? "sem-tabela" : "erro");
    }
  }, [sb]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (estado === "carregando") return <Esqueleto linhas={1} />;
  if (estado === "erro") return <AvisoErro titulo="Próximas contas" mensagem="Não consegui ler as contas a pagar agora." onTentar={carregar} />;
  if (estado === "sem-tabela") {
    // Mesma frase de gente do resto do app; o nome do SQL fica recolhido "para a equipe".
    return <AvisoInstalacao titulo="As próximas contas estão quase prontas" arquivo="supabase/novarecash_cartoes.sql" />;
  }

  const total = itens.reduce((s, i) => s + i.conta.valor, 0);

  return (
    <Cartao className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-display text-sm font-semibold text-white">
          <CalendarClock className="h-4 w-4 text-ouro" /> Próximas contas
        </p>
        {itens.length > 0 && <span className="text-xs font-semibold tabular-nums text-white">{brl(total)}</span>}
      </div>

      {!temCadastro ? (
        <>
          <p className="mt-1 text-xs leading-relaxed text-white/70">
            Cadastre aluguel, luz, escola: o NovareCash mostra o que vence e lembra no WhatsApp na véspera.
          </p>
          <div className="mt-3">
            <Botao href="/novarecash/app/contas">Cadastrar contas</Botao>
          </div>
        </>
      ) : itens.length === 0 ? (
        <p className="mt-1 text-xs leading-relaxed text-white/70">Nada vence nos próximos 7 dias. Tudo em dia.</p>
      ) : (
        <ul className="mt-2 divide-y divide-white/[0.07]">
          {itens.slice(0, maximo).map((i) => (
            <li key={`${i.conta.id}|${i.competencia}`} className="flex items-center gap-3 py-2">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-white">{i.conta.descricao}</span>
                <span className={`block text-2xs ${i.dias < 0 ? COR_SAIDA : "text-white/60"}`}>
                  {i.dias < 0 ? `Atrasada desde ${dataCurta(i.vence)}` : i.dias === 0 ? "Vence hoje" : i.dias === 1 ? "Vence amanhã" : `Vence ${dataCurta(i.vence)}`}
                </span>
              </span>
              {i.dias <= 0 && <Selo tom={i.dias < 0 ? "perigo" : "alerta"}>{i.dias < 0 ? "Atrasada" : "Hoje"}</Selo>}
              <span className="shrink-0 text-sm font-semibold tabular-nums text-white">{brl(i.conta.valor)}</span>
            </li>
          ))}
        </ul>
      )}

      {temCadastro && (
        <Link
          href="/novarecash/app/contas"
          className={`mt-2 inline-flex min-h-11 items-center gap-1 rounded-lg text-xs font-semibold text-ouro hover:underline ${ANEL}`}
        >
          {itens.length > maximo ? `Ver todas (${itens.length})` : "Ver contas a pagar"} <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </Cartao>
  );
}

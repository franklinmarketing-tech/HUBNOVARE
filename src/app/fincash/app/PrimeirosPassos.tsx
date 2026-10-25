"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Play, X } from "lucide-react";
import { registrarUso } from "@/lib/uso";

const CHAVE_OCULTO = "novare:fincash-passos-oculto";

/**
 * PRIMEIROS PASSOS COM PROGRESSO (24/10/2026). A queixa era "difícil de
 * entender o FINCASH": o painel vazio listava três passos, mas não dizia qual
 * já estava feito — quem cadastrava a conta voltava e via a mesma lista.
 *
 * Cada passo é conferido pelos dados que o painel JÁ carrega (contas,
 * lançamentos do mês, contas fixas) — nenhuma consulta nova. Some sozinho
 * quando os três estão feitos; antes disso, dá para esconder.
 *
 * Grava "salvou" em `fincash-passo-N` na primeira vez que vê o passo feito
 * neste aparelho: é a medida de onde a pessoa empaca (nada do conteúdo).
 */
export function PrimeirosPassos({
  temConta,
  temLancamento,
  temFixa,
  destaque,
}: {
  temConta: boolean;
  temLancamento: boolean;
  temFixa: boolean;
  /** Conta vazia: o cartão é a tela inteira, sem botão de esconder. */
  destaque: boolean;
}) {
  const [oculto, setOculto] = useState(true);

  const passos = [
    {
      feito: temConta,
      titulo: "Cadastre onde o seu dinheiro está",
      texto: "A conta do banco e a carteira, com o saldo de hoje.",
      href: "/fincash/app/contas",
      botao: "Cadastrar conta",
    },
    {
      feito: temLancamento,
      titulo: "Lance o que entrou e o que saiu",
      texto: "Salário, mercado, conta de luz — o que já aconteceu neste mês.",
      href: "/fincash/app/lancamentos?novo=1",
      botao: "Fazer um lançamento",
    },
    {
      feito: temFixa,
      titulo: "Cadastre as contas de todo mês",
      texto: "Aluguel, escola, assinaturas: uma vez só, e elas voltam sozinhas.",
      href: "/fincash/app/fixas",
      botao: "Cadastrar conta fixa",
    },
  ];
  const feitos = passos.filter((p) => p.feito).length;
  const proximo = passos.findIndex((p) => !p.feito);

  useEffect(() => {
    try {
      setOculto(!destaque && localStorage.getItem(CHAVE_OCULTO) === "1");
    } catch {
      setOculto(false);
    }
    passos.forEach((p, i) => {
      if (!p.feito) return;
      const chave = `novare:fincash-passo-${i + 1}`;
      try {
        if (localStorage.getItem(chave)) return;
        localStorage.setItem(chave, "1");
      } catch {}
      registrarUso(`fincash-passo-${i + 1}`, "salvou");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [temConta, temLancamento, temFixa, destaque]);

  if (feitos === passos.length || oculto) return null;

  function esconder() {
    setOculto(true);
    try {
      localStorage.setItem(CHAVE_OCULTO, "1");
    } catch {}
  }

  return (
    <section
      aria-label="Primeiros passos no FINCASH"
      className="overflow-hidden rounded-2xl border-2 border-primary bg-white shadow-[0_20px_45px_-30px_hsl(199_75%_12%_/_0.6)]"
    >
      <div className="relative bg-primary px-5 py-4 text-white">
        {!destaque && (
          <button
            type="button"
            onClick={esconder}
            aria-label="Esconder os primeiros passos"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ciano-claro">
          Primeiros passos · {feitos} de {passos.length}
        </p>
        <p className="mt-1 font-display text-lg font-semibold">
          {feitos === 0 ? "Em 3 passos o FINCASH já te diz quanto sobra no mês" : "Falta pouco para o painel ficar completo"}
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuemin={0} aria-valuemax={passos.length} aria-valuenow={feitos}>
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(feitos / passos.length) * 100}%` }} />
        </div>
      </div>

      {/* EXEMPLO CHEIO (25/10/2026): quem acabou de criar a conta vê o app com dados antes de
          digitar nada — o vídeo do Painel foi gravado na conta de demonstração. Não troca a
          sessão da pessoa (a conta dela continua vazia e dela). */}
      {destaque && (
        <div className="border-b border-border bg-ciano-tint/60 px-5 py-3">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("novare:abrir-manual"))}
            className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-ciano-forte hover:underline"
          >
            <Play className="h-4 w-4 fill-current" />
            Ver o FINCASH cheio, com dados de exemplo (15 s)
          </button>
        </div>
      )}

      <ol className="divide-y divide-border">
        {passos.map((p, i) => {
          const agora = i === proximo;
          return (
            <li key={p.titulo} className={`flex items-center gap-3 px-5 py-3.5 ${agora ? "bg-accent-tint/50" : ""}`}>
              <span
                aria-hidden
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  p.feito ? "bg-primary text-white" : agora ? "bg-accent text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {p.feito ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${p.feito ? "text-muted-foreground line-through" : "text-primary"}`}>
                  {p.titulo}
                  <span className="sr-only">{p.feito ? " (feito)" : " (a fazer)"}</span>
                </p>
                {!p.feito && <p className="text-xs leading-relaxed text-muted-foreground">{p.texto}</p>}
              </div>
              {agora && (
                <Link
                  href={p.href}
                  className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 text-xs font-semibold text-white transition-colors hover:bg-accent-strong"
                >
                  {p.botao}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

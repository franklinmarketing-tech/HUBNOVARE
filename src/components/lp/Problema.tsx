"use client";

import { Fragment, useState } from "react";
import {
  CalendarClock,
  ClipboardList,
  CreditCard,
  EyeOff,
  HelpCircle,
  PenLine,
  Percent,
  Receipt,
  Repeat,
  Table2,
  Target,
  TrendingDown,
  type LucideIcon,
} from "lucide-react";

import { SINTOMAS } from "@/lib/hub-lp";

/* Os nomes aqui são os que `SINTOMAS` escreve em `hub-lp.ts`. Quando um
   sintoma muda de ícone lá, o par novo entra aqui — senão a linha cai no
   `Receipt` do fallback e a lista inteira fica com o mesmo desenho. */
const ICONES: Record<string, LucideIcon> = {
  Receipt,
  EyeOff,
  ClipboardList,
  HelpCircle,
  TrendingDown,
  Repeat,
  Percent,
  Target,
  CalendarClock,
  CreditCard,
  PenLine,
  Table2,
};

/* As chaves são as de `SINTOMAS.chave`. Elas mudaram junto com a copy
   (`mes` virou `saldo`, `vazamento` virou `fatura`) e mudar aqui não é
   cosmético: a chave é o que escolhe a maquete lá embaixo, então uma chave
   órfã não quebra a build, só mostra o cartão errado. */
const VEU: Record<string, string> = {
  saldo: "linear-gradient(180deg, rgba(220,236,248,0) 0%, rgba(220,236,248,0.85) 100%)",
  fatura: "linear-gradient(180deg, rgba(247,229,214,0) 0%, rgba(247,229,214,0.8) 100%)",
  planilha: "linear-gradient(180deg, rgba(217,240,232,0) 0%, rgba(217,240,232,0.85) 100%)",
  conselho: "linear-gradient(180deg, rgba(227,221,245,0) 0%, rgba(227,221,245,0.8) 100%)",
};

const TOM: Record<string, string> = {
  saldo: "bg-[#dcecf8] text-[#17789c]",
  fatura: "bg-[#f7e5d6] text-[#a53a12]",
  planilha: "bg-[#d9f0e8] text-[#1f7a4d]",
  conselho: "bg-[#e3ddf5] text-[#4c3d8f]",
};

function CartaoSintoma({ chave }: { chave: string }) {
  const caixa =
    "rounded-[18px] bg-white p-4 shadow-[0_18px_44px_-24px_rgba(10,21,33,0.5)]";
  const rotulo =
    "text-[0.8125rem] font-bold uppercase tracking-[0.1em] text-[#5b6d81]";
  const fecho =
    "mt-3 border-t border-[#eef2f7] pt-3 text-[0.8125rem] font-semibold tracking-[-0.015em] text-[#a53a12]";

  if (chave === "saldo") {
    /* O saldo à direita do rótulo, e embaixo o que ele NÃO está contando. É
       a tese da página inteira num cartão: o número do banco está certo e
       ainda assim é a resposta errada.

       O cartão é COMPACTO de propósito. Ele mora no pé de um painel de
       altura fixa (ver o container em `Conteudo`), e o que passa da medida
       é recortado em cima — foi assim que o "R$ 2.392" apareceu partido ao
       meio na primeira versão. Antes de crescer aqui, meça lá. */
    const pendentes = [
      { t: "Aluguel · dia 5", v: "R$ 1.850" },
      { t: "Cartão · vence 28", v: "R$ 770" },
    ];
    return (
      <div aria-hidden className={caixa}>
        <div className="flex items-center justify-between gap-3">
          <p className={rotulo}>Saldo no banco</p>
          <p className="nv-numero text-[1.375rem] leading-none text-[#0a1521]">
            R$ 2.392
          </p>
        </div>

        <ul className="mt-3 space-y-1.5 border-t border-[#eef2f7] pt-3">
          {pendentes.map((l) => (
            <li
              key={l.t}
              className="flex items-center justify-between gap-3 rounded-[10px] bg-[#f7f9fb] px-3 py-1.5"
            >
              <span className="truncate text-[0.8125rem] font-semibold tracking-[-0.015em] text-[#46586e]">
                {l.t}
              </span>
              <span className="shrink-0 text-[0.8125rem] font-semibold tabular-nums text-[#a53a12]">
                − {l.v}
              </span>
            </li>
          ))}
        </ul>
        <p className={fecho}>E ainda vem a parcela 7 de 12. Nada disso está no saldo.</p>
      </div>
    );
  }

  if (chave === "fatura") {
    /* Dois cartões, dois ciclos, e a compra de ontem caindo num mês que a
       pessoa não escolheu. O terceiro item é o que dói: a resposta é uma
       pergunta. */
    const cartoes = [
      { t: "Final 4417", c: "fecha 20 · vence 28", v: "R$ 1.508" },
      { t: "Final 2093", c: "fecha 3 · vence 10", v: "R$ 770" },
    ];
    return (
      <div aria-hidden className={caixa}>
        <p className={rotulo}>Seus cartões, agora</p>
        <ul className="mt-3 space-y-2">
          {cartoes.map((l) => (
            <li
              key={l.t}
              className="flex items-center gap-3 rounded-[10px] bg-[#f7f9fb] px-3 py-1.5"
            >
              <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-semibold tracking-[-0.015em] text-[#46586e]">
                {l.t}
                <span className="ml-2 font-medium text-[#5b6d81]">{l.c}</span>
              </span>
              <span className="shrink-0 text-[0.8125rem] font-semibold tabular-nums text-[#46586e]">
                {l.v}
              </span>
            </li>
          ))}
        </ul>
        <p className={fecho}>A compra de ontem cai em qual dos dois meses?</p>
      </div>
    );
  }

  if (chave === "planilha") {
    return (
      <div aria-hidden className={caixa}>
        <p className={rotulo}>orcamento_2026.xlsx</p>
        <div className="mt-3 overflow-hidden rounded-[10px] border border-[#e8eef5]">
          {[0, 1, 2].map((r) => (
            <div
              key={r}
              className="grid grid-cols-3 border-b border-[#eef2f7] last:border-0"
            >
              {[0, 1, 2].map((c) => (
                <span
                  key={c}
                  className="block border-r border-[#eef2f7] px-2 py-2.5 last:border-0"
                >
                  <span
                    className="block h-2 rounded-full bg-[#e8eef5]"
                    style={{ width: r < 2 ? "78%" : "0%" }}
                  />
                </span>
              ))}
            </div>
          ))}
        </div>
        <p className={fecho}>Sem atualizar há 47 dias.</p>
      </div>
    );
  }

  return (
    <div aria-hidden className={caixa}>
      <p className={rotulo}>Mensagem do seu gerente</p>
      <p className="mt-3 rounded-[12px] rounded-tl-[4px] bg-[#f2f6fa] px-3.5 py-3 text-[0.875rem] leading-snug tracking-[-0.015em] text-[#46586e]">
        Oi! Apareceu aqui uma oportunidade excelente de investimento, fechamos
        hoje?
      </p>
      <p className={fecho}>Excelente para quem, exatamente?</p>
    </div>
  );
}

function Conteudo({
  s,
  aberto,
}: {
  s: (typeof SINTOMAS)[number];
  aberto: boolean;
}) {
  const tom = TOM[s.chave] ?? TOM.saldo;

  return (
    <>
      <div className="p-7 sm:p-8">
        {/* O corpo do título NÃO muda entre aberto e fechado: é o que mantém
            a linha de topo dos quatro painéis alinhada. */}
        <h3 className="nv-h3 !text-[1.625rem] text-balance">{s.rotulo}</h3>

        <p
          key={aberto ? "aberto" : "fechado"}
          className={`nv-dor-texto nv-corpo mt-4 ${
            aberto ? "max-w-[46ch]" : "max-w-[26ch]"
          }`}
        >
          {aberto ? s.detalhe : s.resumo}
        </p>

        {aberto && (
          <ul className="nv-dor-texto mt-7 space-y-3.5">
            {s.itens.map((item) => {
              const Icone = ICONES[item.icone] ?? Receipt;
              return (
                <li key={item.texto} className="flex items-center gap-3">
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-[9px] ${tom}`}
                  >
                    <Icone className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <p className="text-[1.1875rem] leading-snug tracking-[-0.012em] text-[#46586e]">
                    {item.texto}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div
        className={`relative mt-auto flex flex-1 flex-col justify-end overflow-hidden ${
          aberto ? "min-h-[13rem] p-5 sm:p-6" : "min-h-[8rem]"
        }`}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: VEU[s.chave] ?? VEU.saldo }}
        />
        {aberto && (
          <div className="relative">
            <CartaoSintoma chave={s.chave} />
          </div>
        )}
      </div>
    </>
  );
}

export function Problema() {
  const [aberto, setAberto] = useState(0);

  return (
    <>
      <div className="hidden lg:flex lg:h-[38rem]">
        {SINTOMAS.map((s, i) => {
          const isAberto = i === aberto;
          return (
            <Fragment key={s.chave}>
              {i > 0 && (
                <span
                  aria-hidden
                  className="relative z-0 my-8 -mx-4 w-12 shrink-0 rounded-[18px] bg-[#e7e3dc]"
                />
              )}
            <button
              type="button"
              onMouseEnter={() => setAberto(i)}
              onFocus={() => setAberto(i)}
              onClick={() => setAberto(i)}
              aria-expanded={isAberto}
              className={`relative z-10 flex min-w-0 flex-col overflow-hidden rounded-[24px] bg-white text-left transition-[flex-grow,box-shadow] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isAberto
                  ? "flex-[2.3] shadow-[0_26px_60px_-40px_rgba(10,21,33,0.45)]"
                  : "flex-[1] shadow-[0_10px_30px_-26px_rgba(10,21,33,0.4)]"
              }`}
            >
              <Conteudo s={s} aberto={isAberto} />
            </button>
            </Fragment>
          );
        })}
      </div>

      <div className="grid gap-4 lg:hidden">
        {SINTOMAS.map((s) => (
          <article
            key={s.chave}
            className="flex flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_10px_30px_-26px_rgba(10,21,33,0.4)]"
          >
            <Conteudo s={s} aberto />
          </article>
        ))}
      </div>
    </>
  );
}

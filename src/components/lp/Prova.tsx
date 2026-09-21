import Image from "next/image";
import {
  BadgeCheck,
  Handshake,
  Lock,
  Percent,
} from "lucide-react";

import { PROVA } from "@/lib/hub-lp";

const ENFEITE: Record<
  string,
  { Icone: typeof Lock; tom: string; fundo: string }
> = {
  Nord: {
    Icone: Handshake,
    tom: "bg-[#dcecf8] text-[#17789c]",
    fundo: "linear-gradient(160deg,#dcecf8 0%,#f2f8fc 52%,#bcd9f2 100%)",
  },
  "CFP®": {
    Icone: BadgeCheck,
    tom: "bg-[#d9f0e8] text-[#1f7a4d]",
    fundo: "linear-gradient(160deg,#d9f0e8 0%,#f2faf7 52%,#bfe4d5 100%)",
  },
  "0%": {
    Icone: Percent,
    tom: "bg-[#f7e5d6] text-[#a53a12]",
    fundo: "linear-gradient(160deg,#f7e5d6 0%,#fdf5ee 52%,#f0cdb0 100%)",
  },
  LGPD: {
    Icone: Lock,
    tom: "bg-[#e3ddf5] text-[#4c3d8f]",
    fundo: "linear-gradient(160deg,#e3ddf5 0%,#f5f2fc 52%,#cfc6ee 100%)",
  },
};

function Miniatura({ p }: { p: (typeof PROVA)[number] }) {
  if (p.destaque === "Nord" && p.marca) {
    return (
      <div className="rounded-[16px] bg-white px-5 py-4 shadow-[0_16px_36px_-20px_rgba(10,21,33,0.45)]">
        <div className="flex items-center gap-3">
          <Image
            src="/lp/novare-logo.png"
            alt=""
            width={700}
            height={200}
            className="h-5 w-auto"
          />
          <span className="text-[1.1875rem] font-semibold text-[#a9bccd]">+</span>
          <Image
            src={p.marca}
            alt=""
            width={155}
            height={40}
            className="h-4 w-auto"
          />
        </div>
        <p className="mt-3 border-t border-[#eef2f7] pt-3 text-[0.8125rem] font-semibold tracking-[-0.015em] text-[#46586e]">
          Método da casa + análise independente
        </p>
      </div>
    );
  }

  if (p.destaque === "CFP®") {
    return (
      <div className="rounded-[16px] bg-white px-5 py-4 shadow-[0_16px_36px_-20px_rgba(10,21,33,0.45)]">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e6f6ec] text-[#1f7a4d]">
            <BadgeCheck className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <p className="text-[0.9375rem] font-semibold tracking-[-0.018em] text-[#0a1521]">
              Certified Financial Planner
            </p>
            <p className="text-[0.8125rem] font-medium text-[#5b6d81]">
              Padrão internacional
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (p.destaque === "0%") {
    return (
      <div className="rounded-[16px] bg-white px-5 py-4 shadow-[0_16px_36px_-20px_rgba(10,21,33,0.45)]">
        {[
          { t: "Comissão de banco", v: "R$ 0" },
          { t: "Comissão de corretora", v: "R$ 0" },
          { t: "Comissão de seguradora", v: "R$ 0" },
        ].map((l) => (
          <div
            key={l.t}
            className="flex items-center justify-between gap-3 border-b border-[#f1f4f8] py-2 last:border-0"
          >
            <span className="text-[0.8125rem] font-medium tracking-[-0.015em] text-[#46586e]">
              {l.t}
            </span>
            <span className="text-[0.8125rem] font-bold tabular-nums text-[#1f7a4d]">
              {l.v}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-[16px] bg-white px-5 py-4 shadow-[0_16px_36px_-20px_rgba(10,21,33,0.45)]">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f1eefb] text-[#4c3d8f]">
          <Lock className="h-4 w-4" strokeWidth={2} />
        </span>
        <p className="text-[0.9375rem] font-semibold tracking-[-0.018em] text-[#0a1521]">
          Extrato colado
        </p>
      </div>
      <div className="mt-3 rounded-[12px] border border-dashed border-[#d7dfe8] px-3.5 py-3">
        <p className="text-[0.8125rem] font-medium leading-snug tracking-[-0.015em] text-[#46586e]">
          Lido no seu navegador. Nenhuma credencial bancária é pedida.
        </p>
      </div>
    </div>
  );
}

export function Prova() {
  return (
    <>
      <div className="nv-caixa text-center">
        <p className="nv-chapeu text-[#17789c]">Por que confiar</p>

        <h2 className="nv-d2 mx-auto mt-6 max-w-[19ch]">
          A Novare não ganha nada se você comprar o produto errado
        </h2>

        <p className="nv-lead mx-auto mt-6 max-w-2xl">
          É você quem paga a assinatura, então é para você que a casa trabalha.
          É por isso que ela pode dizer o que um gerente de banco não pode.
        </p>
      </div>

      <div className="nv-caixa mt-16">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {PROVA.map((p) => {
            const e = ENFEITE[p.destaque] ?? ENFEITE["0%"];
            return (
              <li key={p.titulo}>
                <div className="flex items-center gap-2.5">
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-[9px] ${e.tom}`}
                  >
                    <e.Icone className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <span className="text-[1.1875rem] font-semibold tracking-[-0.018em] text-[#0a1521]">
                    {p.destaque}
                  </span>
                </div>

                <div
                  className="mt-4 flex h-[15rem] items-center justify-center overflow-hidden rounded-[22px] p-6"
                  style={{ background: e.fundo }}
                >
                  <div className="w-full">
                    <Miniatura p={p} />
                  </div>
                </div>

                <p className="nv-corpo mt-5">
                  <strong className="font-semibold text-[#0a1521]">
                    {p.titulo}.
                  </strong>{" "}
                  {p.texto}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

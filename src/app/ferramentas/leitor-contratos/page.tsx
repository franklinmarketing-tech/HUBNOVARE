"use client";

import Image from "next/image";
import Link from "next/link";
import { BotaoHome } from "@/components/BotaoHome";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Info,
  ScanLine,
} from "lucide-react";

/* --------------------------------------------------------------------------
   Heurística: procura no texto do contrato palavras-chave de cláusulas que
   merecem leitura atenta. Cada acerto vira um card com o trecho real
   (até 200 caracteres ao redor) e uma explicação fixa de uma frase.
   -------------------------------------------------------------------------- */

interface Clausula {
  id: string;
  titulo: string;
  regex: RegExp;
  explicacao: string;
}

const CLAUSULAS: Clausula[] = [
  {
    id: "multa",
    titulo: "Multa e penalidades",
    regex: /multa|penalidade/i,
    explicacao:
      "Veja o valor e quando ela se aplica: multa desproporcional pode ser questionada.",
  },
  {
    id: "rescisao",
    titulo: "Rescisão e cancelamento",
    regex: /rescis[ãa]o|rescindir|cancelamento|cancelar/i,
    explicacao:
      "Confira o prazo de aviso e o custo de sair do contrato antes do fim.",
  },
  {
    id: "fidelidade",
    titulo: "Fidelidade e permanência mínima",
    regex: /fidelidade|perman[êe]ncia\s+m[íi]nima|prazo\s+m[íi]nimo/i,
    explicacao:
      "Período mínimo obrigatório costuma vir amarrado a multa se você sair antes.",
  },
  {
    id: "reajuste",
    titulo: "Reajuste e correção",
    regex: /reajust\w*|corre[çc][ãa]o\s+monet[áa]ria|atualiza[çc][ãa]o\s+monet[áa]ria/i,
    explicacao:
      "Verifique o índice (IPCA, IGP-M) e a periodicidade: é isso que define quanto o preço sobe.",
  },
  {
    id: "renovacao",
    titulo: "Renovação automática",
    regex: /renova[çc][ãa]o\s+autom[áa]tica|renovado\s+automaticamente|prorroga[çc][ãa]o\s+autom[áa]tica/i,
    explicacao:
      "O contrato se renova sozinho se você não avisar dentro do prazo; anote a data limite.",
  },
  {
    id: "foro",
    titulo: "Foro e comarca",
    regex: /\bforo\b|comarca/i,
    explicacao:
      "Define a cidade onde uma eventual disputa judicial vai correr, o que pode ficar longe de você.",
  },
  {
    id: "carencia",
    titulo: "Carência",
    regex: /car[êe]ncia/i,
    explicacao:
      "Período em que você paga mas ainda não pode usar o serviço ou resgatar o dinheiro.",
  },
  {
    id: "juros-mora",
    titulo: "Juros de mora",
    regex: /juros\s+de\s+mora|juros\s+morat[óo]rios|mora\s+di[áa]ria/i,
    explicacao:
      "É o custo do atraso: confira a taxa ao mês e se há multa somada a ela.",
  },
  {
    id: "cessao",
    titulo: "Cessão e transferência",
    regex: /cess[ãa]o|transfer[êe]ncia|\bceder\b/i,
    explicacao:
      "Permite passar o contrato (ou a sua dívida) a terceiros, às vezes sem a sua anuência.",
  },
  {
    id: "exclusividade",
    titulo: "Exclusividade",
    regex: /exclusividade|exclusivo\b/i,
    explicacao:
      "Pode te impedir de contratar concorrentes ou prestar serviço a outros durante a vigência.",
  },
];

interface Acerto {
  clausula: Clausula;
  antes: string;
  termo: string;
  depois: string;
}

function analisarContrato(texto: string): Acerto[] {
  const plano = texto.replace(/\s+/g, " ");
  const acertos: Acerto[] = [];

  for (const clausula of CLAUSULAS) {
    const m = plano.match(clausula.regex);
    if (!m || m.index === undefined) continue;

    const inicio = m.index;
    const fim = inicio + m[0].length;
    // Até 200 caracteres de contexto ao redor do termo achado.
    const de = Math.max(0, inicio - 100);
    const ate = Math.min(plano.length, fim + 100);

    acertos.push({
      clausula,
      antes: (de > 0 ? "..." : "") + plano.slice(de, inicio),
      termo: m[0],
      depois: plano.slice(fim, ate) + (ate < plano.length ? "..." : ""),
    });
  }

  return acertos;
}

export default function LeitorContratosPage() {
  const [texto, setTexto] = useState("");
  const acertos = useMemo(() => analisarContrato(texto), [texto]);
  const temTexto = texto.trim().length > 0;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/marca/logo-novare.png"
              alt="Novare"
              width={28}
              height={28}
              className="h-7 w-auto"
            />
            <span className="font-display text-xl font-bold text-primary">
              Novare
            </span>
          </Link>
          <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-slate-500 hidden sm:block">
            Leitor de Contratos
          </span>
            <BotaoHome />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <ScanLine className="h-3.5 w-3.5" />
            Análise de texto colado
          </div>
          <div className="flex items-start gap-3 flex-wrap">
            <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
              Leitor de Contratos
            </h1>
            <span className="bg-warning/15 text-warning text-[10px] font-bold uppercase rounded px-1.5 py-0.5 mt-2.5">
              beta
            </span>
          </div>
          <p className="text-slate-500 mt-3 max-w-xl">
            Cole o texto de um contrato (financiamento, consórcio, plano,
            prestação de serviço) e a ferramenta destaca as cláusulas que
            costumam pegar as pessoas de surpresa. Nada é enviado nem guardado.
          </p>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <label
            htmlFor="texto-contrato"
            className="block text-sm font-semibold text-slate-700 mb-2"
          >
            Cole o texto do contrato
          </label>
          <textarea
            id="texto-contrato"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={
              "Cláusula 5ª. Em caso de rescisão antecipada, o contratante pagará multa de 10% sobre o saldo remanescente, com renovação automática ao final da vigência..."
            }
            className="w-full min-h-40 rounded-xl border border-slate-200 bg-white p-3.5 font-mono text-xs outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
          />
          <p className="text-[11px] text-slate-500 mt-2">
            Dica: abra o contrato em PDF, selecione tudo (Ctrl+A), copie e cole
            aqui. Procuro termos como multa, rescisão, fidelidade, reajuste,
            renovação automática, foro, carência, juros de mora, cessão e
            exclusividade.
          </p>
        </section>

        {temTexto && (
          <>
            <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Pontos de atenção encontrados
              </p>
              <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
                {acertos.length}
              </p>
              <p className="text-sm text-white/70 mt-3">
                {acertos.length > 0
                  ? "Cada um aparece abaixo com o trecho real do contrato e o motivo de merecer atenção."
                  : "Nenhum termo de risco comum foi encontrado no texto colado."}
              </p>
            </section>

            {acertos.length === 0 && (
              <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-sm font-semibold text-slate-700">
                      Nenhum termo de risco comum encontrado
                    </h2>
                    <p className="text-[13px] text-slate-500 mt-1.5">
                      Isso pode significar um contrato simples, mas também um
                      texto colado pela metade ou cláusulas escritas com outras
                      palavras. Vale conferir se o documento inteiro veio no
                      campo acima.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {acertos.length > 0 && (
              <section className="mt-6 space-y-4">
                {acertos.map((a) => (
                  <article
                    key={a.clausula.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                      <h3 className="text-sm font-semibold text-slate-700">
                        {a.clausula.titulo}
                      </h3>
                    </div>
                    <blockquote className="rounded-xl bg-slate-50 p-3 mt-3 text-[13px] text-slate-600 leading-relaxed">
                      {a.antes}
                      <mark className="bg-warning/20 text-slate-900 font-semibold rounded px-0.5">
                        {a.termo}
                      </mark>
                      {a.depois}
                    </blockquote>
                    <p className="text-[13px] text-slate-500 mt-3">
                      {a.clausula.explicacao}
                    </p>
                  </article>
                ))}
              </section>
            )}

            <p className="mt-6 text-[11px] text-slate-500">
              Esta análise procura palavras-chave e não substitui a leitura
              integral do contrato nem a orientação de um advogado.
            </p>
          </>
        )}

        {!temTexto && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-semibold text-slate-700">
                  O que a ferramenta procura
                </h2>
                <p className="text-[13px] text-slate-500 mt-1.5">
                  Dez tipos de cláusula que aparecem com frequência em contratos
                  de consumo e de serviços financeiros: multa, rescisão,
                  fidelidade, reajuste, renovação automática, foro, carência,
                  juros de mora, cessão e exclusividade.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

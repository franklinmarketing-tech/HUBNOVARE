"use client";

import Image from "next/image";
import Link from "next/link";
import { BotaoHome } from "@/components/BotaoHome";
import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowRight,
  CalendarClock,
  FolderOpen,
  Plus,
  Trash2,
} from "lucide-react";
import { novoId, useArmazenado } from "@/lib/useArmazenado";

/* -------------------------------------------------------------------------- */

const TIPOS = [
  "Contrato",
  "Apólice",
  "Escritura",
  "Certidão",
  "Procuração",
  "Imposto de renda",
  "Outro",
] as const;

type Tipo = (typeof TIPOS)[number];

type Guarda = "fisico" | "nuvem";

interface Documento {
  id: string;
  nome: string;
  tipo: Tipo;
  guarda: Guarda;
  local: string;
  /** yyyy-mm-dd, opcional. */
  validade: string;
}

/** Dias até a data. Retorna null quando não há validade informada. */
function diasAteVencer(validade: string): number | null {
  if (!validade) return null;
  const [ano, mes, dia] = validade.split("-").map(Number);
  if (!ano || !mes || !dia) return null;
  const alvo = new Date(ano, mes - 1, dia);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
}

function formatarData(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

/* -------------------------------------------------------------------------- */

export default function DocumentosPage() {
  const [docsBrutos, setDocs, carregado] = useArmazenado<Documento[]>(
    "documentos",
    []
  );
  const docs = useMemo(
    () => (Array.isArray(docsBrutos) ? docsBrutos : []),
    [docsBrutos]
  );

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<Tipo>("Contrato");
  const [guarda, setGuarda] = useState<Guarda>("nuvem");
  const [local, setLocal] = useState("");
  const [validade, setValidade] = useState("");
  const [filtro, setFiltro] = useState<Tipo | "todos">("todos");

  const formValido = nome.trim().length > 0;

  const ordenados = useMemo(() => {
    // Quem vence antes aparece primeiro; sem validade vai para o fim.
    return [...docs].sort((a, b) => {
      const da = a.validade || "9999-12-31";
      const db = b.validade || "9999-12-31";
      return da.localeCompare(db);
    });
  }, [docs]);

  const visiveis = useMemo(
    () =>
      filtro === "todos" ? ordenados : ordenados.filter((d) => d.tipo === filtro),
    [ordenados, filtro]
  );

  const vencidos = useMemo(
    () =>
      docs.filter((d) => {
        const dias = diasAteVencer(d.validade);
        return dias !== null && dias < 0;
      }).length,
    [docs]
  );
  const vencendo = useMemo(
    () =>
      docs.filter((d) => {
        const dias = diasAteVencer(d.validade);
        return dias !== null && dias >= 0 && dias < 30;
      }).length,
    [docs]
  );

  const adicionar = (e: FormEvent) => {
    e.preventDefault();
    if (!formValido) return;
    const novo: Documento = {
      id: novoId(),
      nome: nome.trim(),
      tipo,
      guarda,
      local: local.trim(),
      validade,
    };
    setDocs((lista) => [...(Array.isArray(lista) ? lista : []), novo]);
    setNome("");
    setLocal("");
    setValidade("");
  };

  const remover = (id: string) =>
    setDocs((lista) =>
      (Array.isArray(lista) ? lista : []).filter((d) => d.id !== id)
    );

  const vazio = carregado && docs.length === 0;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/marca/logo-novare.png"
              alt="Novare"
              width={112}
              height={28}
              className="h-7 w-auto"
              priority
            />
          </Link>
          <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-slate-500 hidden sm:block">
            Central de documentos
          </span>
            <BotaoHome />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <FolderOpen className="h-3.5 w-3.5" />
            Grátis, fica só no seu navegador
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Onde está a escritura mesmo?
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Um índice simples do que existe e de onde cada papel está guardado.
            Você não sobe arquivo nenhum: registra o mapa, para achar em trinta
            segundos o que hoje leva uma tarde.
          </p>
        </section>

        {/* Número-herói */}
        <section className="rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Documentos mapeados
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {docs.length}
          </p>
          <p className="text-sm text-white/70 mt-3 tabular-nums">
            {vazio
              ? "Comece pelos que ninguém acha na hora: escritura, apólice e procuração."
              : `${vencendo} vencendo nos próximos 30 dias, ${vencidos} já vencidos.`}
          </p>
        </section>

        {/* Cadastro */}
        <section className="mt-6 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">
            Registrar documento
          </h2>
          <p className="text-[11px] text-slate-500 mb-4">
            Descreva o local com precisão suficiente para outra pessoa achar
            sozinha.
          </p>

          <form onSubmit={adicionar} className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Nome do documento
              </label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Escritura do apartamento, apólice de vida..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Tipo
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as Tipo)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              >
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Onde está
              </label>
              <select
                value={guarda}
                onChange={(e) => setGuarda(e.target.value as Guarda)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              >
                <option value="nuvem">Nuvem</option>
                <option value="fisico">Físico</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Local exato
              </label>
              <input
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                placeholder="Pasta do Drive, gaveta do escritório, cofre..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Validade (opcional)
              </label>
              <input
                type="date"
                value={validade}
                onChange={(e) => setValidade(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] tabular-nums outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={!formValido}
                className="inline-flex items-center gap-2 rounded-xl bg-primary text-white px-4 h-11 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                Adicionar documento
              </button>
            </div>
          </form>
        </section>

        {/* Lista */}
        <section className="mt-6 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">
            Seus documentos
          </h2>
          <p className="text-[11px] text-slate-500 mb-4">
            Ordenados pelo que vence primeiro.
          </p>

          <div className="flex flex-wrap gap-2 mb-5">
            <Pilula
              ativo={filtro === "todos"}
              onClick={() => setFiltro("todos")}
              rotulo={`Todos (${docs.length})`}
            />
            {TIPOS.map((t) => {
              const quantos = docs.filter((d) => d.tipo === t).length;
              if (quantos === 0) return null;
              return (
                <Pilula
                  key={t}
                  ativo={filtro === t}
                  onClick={() => setFiltro(t)}
                  rotulo={`${t} (${quantos})`}
                />
              );
            })}
          </div>

          {vazio ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <FolderOpen className="h-5 w-5 mx-auto text-slate-500" />
              <p className="text-sm font-semibold text-slate-600 mt-3">
                Nenhum documento registrado
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Um índice de dez linhas já resolve o dia em que alguém precisar
                achar tudo sem você.
              </p>
            </div>
          ) : visiveis.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-sm font-semibold text-slate-600">
                Nada neste filtro
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Escolha outro tipo para ver os documentos.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {visiveis.map((d) => {
                const dias = diasAteVencer(d.validade);
                return (
                  <li key={d.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-800 truncate">{d.nome}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {d.tipo} · {d.guarda === "nuvem" ? "nuvem" : "físico"}
                        {d.local ? ` · ${d.local}` : ""}
                      </p>
                    </div>
                    <Badge dias={dias} validade={d.validade} />
                    <button
                      type="button"
                      onClick={() => remover(d.id)}
                      aria-label={`Remover documento ${d.nome}`}
                      className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-300 transition-colors hover:text-destructive hover:bg-slate-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-5 rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">
              Documento em nuvem só serve se alguém além de você tiver acesso.
              Vale conferir quem consegue abrir a pasta.
            </p>
          </div>
        </section>

        {/* Próximo passo */}
        <section className="mt-6 rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">
            Mapeie também as contas digitais no{" "}
            <Link
              href="/ferramentas/inventario"
              className="font-semibold text-primary underline underline-offset-2"
            >
              Inventário Digital
            </Link>
            .
          </p>
        </section>


        <p className="mt-6 text-[11px] text-slate-500">
          Seus dados ficam somente no seu navegador.
        </p>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Badge({
  dias,
  validade,
}: {
  dias: number | null;
  validade: string;
}) {
  if (dias === null) {
    return (
      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
        sem validade
      </span>
    );
  }
  if (dias < 0) {
    return (
      <span className="shrink-0 rounded-full bg-destructive/15 px-2.5 py-1 text-[11px] font-semibold text-destructive tabular-nums">
        vencido em {formatarData(validade)}
      </span>
    );
  }
  if (dias < 30) {
    return (
      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-1 text-[11px] font-semibold text-warning tabular-nums">
        <CalendarClock className="h-3 w-3" />
        vence em {dias} {dias === 1 ? "dia" : "dias"}
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500 tabular-nums">
      até {formatarData(validade)}
    </span>
  );
}

function Pilula({
  ativo,
  onClick,
  rotulo,
}: {
  ativo: boolean;
  onClick: () => void;
  rotulo: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
        ativo
          ? "bg-primary text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {rotulo}
    </button>
  );
}

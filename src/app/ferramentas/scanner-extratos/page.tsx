"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  FileScan,
  ScanLine,
  Sparkles,
  Upload,
} from "lucide-react";
import { brl, parseNumero } from "@/lib/calculos";
import { novoId, useArmazenado } from "@/lib/useArmazenado";

/* -------------------------------------------------------------------------- */

interface Gasto {
  id: string;
  descricao: string;
  valor: number;
  categoria: string;
  /** yyyy-mm-dd */
  data: string;
}

interface ItemExtrato {
  id: string;
  /** yyyy-mm-dd */
  data: string;
  descricao: string;
  /** Valor com sinal: negativo = saída (gasto), positivo = entrada. */
  valor: number;
  categoria: string;
}

const CATEGORIAS = [
  "Moradia",
  "Mercado",
  "Transporte",
  "Saúde",
  "Lazer",
  "Assinaturas",
  "Investimentos",
  "Outros",
] as const;

/* ----------------------------- Categorização ------------------------------ */

const REGRAS: Array<{ categoria: string; palavras: string[] }> = [
  { categoria: "Transporte", palavras: ["uber", "99", "posto"] },
  { categoria: "Mercado", palavras: ["mercado", "super", "padaria"] },
  { categoria: "Saúde", palavras: ["farmacia", "drogaria"] },
  { categoria: "Lazer", palavras: ["ifood", "restaurante", "lanche"] },
  { categoria: "Assinaturas", palavras: ["netflix", "spotify", "prime"] },
  {
    categoria: "Moradia",
    palavras: ["aluguel", "condominio", "luz", "agua", "internet"],
  },
];

function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function categorizar(descricao: string): string {
  const alvo = semAcento(descricao);
  for (const regra of REGRAS) {
    if (regra.palavras.some((p) => alvo.includes(p))) return regra.categoria;
  }
  return "Outros";
}

/* --------------------------------- Parser --------------------------------- */

const RE_DATA = /(\d{2})\/(\d{2})\/(\d{4})|(\d{4})-(\d{2})-(\d{2})/;

// Dinheiro em formatos comuns de extrato: 1.234,56 / 45,90 / 45.90 / 45 / R$ 12,00
const RE_VALOR =
  /-\s?(?:R\$\s*)?(?:\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+,\d{1,2}|\d+\.\d{1,2}|\d+)(?!\d)|(?:R\$\s*)?(?:\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+,\d{1,2}|\d+\.\d{1,2}|\d+)(?!\d)/g;

/** Detecta o separador de campos do texto colado: tab, ponto e vírgula ou vírgula. */
function detectarSeparador(texto: string): string {
  if (texto.includes("\t")) return "\t";
  if (texto.includes(";")) return ";";
  return ",";
}

function extrairData(linha: string): { iso: string; bruto: string } | null {
  const m = linha.match(RE_DATA);
  if (!m) return null;
  if (m[1]) return { iso: `${m[3]}-${m[2]}-${m[1]}`, bruto: m[0] };
  return { iso: `${m[4]}-${m[5]}-${m[6]}`, bruto: m[0] };
}

/**
 * Lê o texto colado linha a linha. Cada linha precisa ter uma data
 * (dd/mm/aaaa ou aaaa-mm-dd) e um valor; linhas sem valor (cabeçalhos,
 * saldos vazios) são ignoradas. O último número da linha é tratado como
 * o valor do lançamento; valor negativo é gasto.
 */
function parseExtrato(texto: string): ItemExtrato[] {
  const sep = detectarSeparador(texto);
  const itens: ItemExtrato[] = [];

  for (const bruta of texto.split(/\r?\n/)) {
    const linha = bruta.trim();
    if (!linha) continue;

    const data = extrairData(linha);
    if (!data) continue;

    const semData = linha.replace(data.bruto, " ");
    const valores = semData.match(RE_VALOR);
    if (!valores || valores.length === 0) continue;

    const tokenValor = valores[valores.length - 1];
    const brutoNumero = parseNumero(tokenValor.replace(/\s/g, ""));
    const valor = tokenValor.trimStart().startsWith("-")
      ? -Math.abs(brutoNumero)
      : Math.abs(brutoNumero);
    if (valor === 0) continue;

    const ondeValor = semData.lastIndexOf(tokenValor);
    const semValor =
      ondeValor >= 0
        ? semData.slice(0, ondeValor) + " " + semData.slice(ondeValor + tokenValor.length)
        : semData;

    const descricao = semValor
      .split(sep)
      .map((parte) => parte.replace(/^["']|["']$/g, "").trim())
      .filter(Boolean)
      .join(" ")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (!descricao) continue;

    itens.push({
      id: novoId(),
      data: data.iso,
      descricao,
      valor,
      categoria: categorizar(descricao),
    });
  }

  return itens;
}

function formatarData(data: string): string {
  return `${data.slice(8, 10)}/${data.slice(5, 7)}/${data.slice(0, 4)}`;
}

/* -------------------------------------------------------------------------- */

export default function ScannerExtratosPage() {
  const [, setGastos, carregado] = useArmazenado<Gasto[]>("gastos", []);

  const [texto, setTexto] = useState("");
  const [itens, setItens] = useState<ItemExtrato[]>([]);
  const [analisado, setAnalisado] = useState(false);
  const [importados, setImportados] = useState<number | null>(null);

  const gastosDetectados = useMemo(
    () => itens.filter((i) => i.valor < 0),
    [itens]
  );
  const totalGastos = useMemo(
    () => gastosDetectados.reduce((acc, i) => acc + Math.abs(i.valor), 0),
    [gastosDetectados]
  );

  const analisar = () => {
    setItens(parseExtrato(texto));
    setAnalisado(true);
    setImportados(null);
  };

  const mudarCategoria = (id: string, categoria: string) =>
    setItens((lista) =>
      lista.map((i) => (i.id === id ? { ...i, categoria } : i))
    );

  const importar = () => {
    if (!carregado || gastosDetectados.length === 0) return;
    const novos: Gasto[] = gastosDetectados.map((i) => ({
      id: novoId(),
      descricao: i.descricao,
      valor: Math.abs(i.valor),
      categoria: i.categoria,
      data: i.data,
    }));
    setGastos((lista) => [...lista, ...novos]);
    setImportados(novos.length);
    setItens([]);
    setTexto("");
    setAnalisado(false);
  };

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
          <span className="text-xs font-medium text-slate-500 hidden sm:block">
            Scanner de extratos
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <ScanLine className="h-3.5 w-3.5" />
            Ferramenta inteligente
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Cole o extrato e deixe o resto com a gente
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            O scanner lê as linhas do seu extrato, separa data, descrição e
            valor, categoriza cada gasto automaticamente e importa tudo direto
            para o seu Controle de Gastos. Sem digitar nada de novo.
          </p>
        </section>

        {/* Entrada do extrato */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-1.5">
            Cole aqui as linhas do seu extrato (CSV ou texto do banco)
          </h2>
          <p className="text-[11px] text-slate-500 mb-4">
            Uma linha por lançamento, com data (dd/mm/aaaa ou aaaa-mm-dd) e
            valor. Aceita separação por ponto e vírgula, vírgula ou tab.
            Valores negativos entram como gasto.
          </p>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={
              "06/08/2026;Uber viagem centro;-24,90\n05/08/2026;Supermercado Boa Compra;-312,45\n05/08/2026;Netflix.com;-44,90"
            }
            className="w-full min-h-40 font-mono text-xs rounded-xl border border-slate-200 bg-white px-3.5 py-3 outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
          />
          <button
            type="button"
            onClick={analisar}
            disabled={texto.trim().length === 0}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary text-white px-4 h-11 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileScan className="h-4 w-4" />
            Escanear extrato
          </button>
        </section>

        {/* Número-herói */}
        <section className="mt-6 rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Total de gastos detectados na prévia
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {brl(totalGastos)}
          </p>
          <p className="text-sm text-white/70 mt-3 tabular-nums">
            {gastosDetectados.length > 0
              ? `${gastosDetectados.length} ${
                  gastosDetectados.length === 1
                    ? "gasto reconhecido"
                    : "gastos reconhecidos"
                } no texto colado.`
              : "Cole o extrato acima e clique em escanear."}
          </p>
        </section>

        {/* Sucesso da importação */}
        {importados !== null && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-700">
                {importados}{" "}
                {importados === 1 ? "gasto importado" : "gastos importados"}{" "}
                para o Controle de Gastos
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Eles já aparecem no resumo do mês, junto com o que você lança à
                mão.
              </p>
              <Link
                href="/ferramentas/gastos"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                Abrir o Controle de Gastos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        )}

        {/* Prévia */}
        {analisado && itens.length === 0 && importados === null && (
          <section className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <ScanLine className="h-5 w-5 mx-auto text-slate-500" />
            <p className="text-sm font-semibold text-slate-600 mt-3">
              Nenhum lançamento reconhecido
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Confira se cada linha tem uma data (dd/mm/aaaa ou aaaa-mm-dd) e um
              valor numérico. Linhas de cabeçalho e saldo são ignoradas.
            </p>
          </section>
        )}

        {itens.length > 0 && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-700">
              Prévia do extrato
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5 mb-4">
              Ajuste a categoria de cada gasto antes de importar. Entradas
              (valores positivos) aparecem aqui, mas não vão para o controle.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-3 font-semibold">Data</th>
                    <th className="py-2 pr-3 font-semibold">Descrição</th>
                    <th className="py-2 pr-3 font-semibold">Categoria</th>
                    <th className="py-2 text-right font-semibold">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itens.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5 pr-3 tabular-nums text-slate-500 whitespace-nowrap">
                        {formatarData(item.data)}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-700">
                        {item.descricao}
                      </td>
                      <td className="py-2.5 pr-3">
                        {item.valor < 0 ? (
                          <select
                            value={item.categoria}
                            onChange={(e) =>
                              mudarCategoria(item.id, e.target.value)
                            }
                            aria-label={`Categoria de ${item.descricao}`}
                            className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
                          >
                            {CATEGORIAS.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-slate-500">
                            Entrada
                          </span>
                        )}
                      </td>
                      <td
                        className={`py-2.5 text-right tabular-nums font-semibold whitespace-nowrap ${
                          item.valor < 0 ? "text-slate-900" : "text-success"
                        }`}
                      >
                        {brl(item.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-slate-500 tabular-nums">
                {gastosDetectados.length}{" "}
                {gastosDetectados.length === 1 ? "gasto" : "gastos"} somando{" "}
                <span className="font-semibold text-slate-700">
                  {brl(totalGastos)}
                </span>
              </p>
              <button
                type="button"
                onClick={importar}
                disabled={!carregado || gastosDetectados.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-primary text-white px-4 h-11 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Upload className="h-4 w-4" />
                Importar para o Controle de Gastos
              </button>
            </div>
          </section>
        )}

        {/* Como funciona */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">
            Como o scanner categoriza
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-600">
                Por palavras-chave
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Uber e posto viram Transporte; mercado e padaria viram Mercado;
                Netflix e Spotify viram Assinaturas; aluguel, luz e internet
                viram Moradia. O que não bate com nada cai em Outros.
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-600">
                Você dá a palavra final
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                A prévia é editável: troque a categoria de qualquer linha antes
                de importar. Só os gastos (valores negativos) entram no
                controle, como valor positivo.
              </p>
            </div>
          </div>
        </section>


        <p className="mt-6 text-[11px] text-slate-500">
          Seus dados ficam somente no seu navegador.
        </p>
      </main>
    </div>
  );
}

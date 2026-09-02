"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  FileUp,
  Loader2,
  Check,
  Lock,
  TrendingDown,
} from "lucide-react";
import { brl } from "@/lib/calculos";
import { lerExtrato, pareceOfx, resumirExtrato } from "@/lib/extrato";
import { RoboIris } from "@/components/RoboIris";

type Achado = { titulo: string; texto: string; tipo: string };
type Leitura = { veredito: string; achados: Achado[]; acoes: string[] };

/**
 * A Íris trabalhando: a pessoa cola o extrato, ela devolve a leitura.
 *
 * Sem Open Finance por opção — conexão bancária vem depois. O que importa
 * agora é provar o valor: em dez segundos alguém vê para onde o próprio
 * dinheiro está indo.
 *
 * O extrato é lido AQUI, no navegador. Para a análise sobem apenas os
 * totais já calculados — nunca o texto com agência, conta ou titular.
 */

/**
 * Quantas leituras a Íris entrega sem assinatura.
 *
 * Uma. É o mesmo princípio da primeira consulta gratuita: a pessoa precisa
 * ver o próprio retrato antes de decidir pagar. Cadeado antes da prova de
 * valor só espanta.
 */
// Enquanto tudo está liberado, não há teto. Voltar para 1 quando a
// assinatura do Workspace entrar no ar.
const ANALISES_GRATIS = Number.POSITIVE_INFINITY;
const CHAVE_USO = "novare:iris-analises";

export function IrisExtrato() {
  const [usadas, setUsadas] = useState(0);
  const [texto, setTexto] = useState("");
  const [leitura, setLeitura] = useState<Leitura | null>(null);
  const [estado, setEstado] = useState<"parado" | "lendo" | "pronto">("parado");
  const [erro, setErro] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const [arquivo, setArquivo] = useState<string | null>(null);


  // localStorage só existe no navegador; ler no efeito evita quebrar o
  // render do servidor.
  useEffect(() => {
    const guardado = Number(window.localStorage.getItem(CHAVE_USO) ?? "0");
    setUsadas(Number.isFinite(guardado) ? guardado : 0);
  }, []);

  const acabouOGratis = usadas >= ANALISES_GRATIS;

  /**
   * Lê o arquivo do banco no próprio navegador.
   *
   * CSV, OFX e TXT são texto puro — dá para ler sem biblioteca nenhuma.
   * PDF é binário: extrair texto dele exigiria mais de um mega de
   * dependência, e copiar e colar resolve em dois cliques.
   */
  async function receberArquivo(f: File | null | undefined) {
    if (!f) return;
    setErro(null);

    const nome = f.name.toLowerCase();
    if (nome.endsWith(".pdf")) {
      setErro(
        "Extrato em PDF: abra o arquivo, selecione tudo (Ctrl+A), copie e cole no campo abaixo. Em CSV ou OFX o arquivo entra direto.",
      );
      return;
    }
    if (f.size > 4 * 1024 * 1024) {
      setErro("Arquivo muito grande. Envie um período menor.");
      return;
    }

    const conteudo = await f.text();
    const achou = lerExtrato(conteudo);
    if (achou.length === 0) {
      setErro(
        "Não reconheci lançamentos nesse arquivo. Ele precisa ter data e valor em cada linha — CSV, OFX ou texto do extrato.",
      );
      return;
    }

    setTexto(conteudo);
    setArquivo(`${f.name} · ${achou.length} lançamentos${pareceOfx(conteudo) ? " · OFX" : ""}`);
  }


  const itens = useMemo(() => (texto.trim() ? lerExtrato(texto) : []), [texto]);
  const resumo = useMemo(() => (itens.length ? resumirExtrato(itens) : null), [itens]);

  async function analisar() {
    if (!resumo) return;
    setEstado("lendo");
    setErro(null);
    setLeitura(null);

    try {
      const r = await fetch("/api/iris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumo }),
      });

      if (r.status === 429) {
        setErro("Muitas análises seguidas. Espere um minuto.");
        setEstado("parado");
        return;
      }
      if (r.status === 503) {
        setErro("A Íris está fora do ar agora. O resumo abaixo continua valendo.");
        setEstado("parado");
        return;
      }
      if (!r.ok) throw new Error("falhou");

      setLeitura((await r.json()) as Leitura);
      setEstado("pronto");

      const novo = usadas + 1;
      setUsadas(novo);
      window.localStorage.setItem(CHAVE_USO, String(novo));
    } catch {
      setErro("Não consegui analisar agora. O resumo abaixo é calculado aqui e continua valendo.");
      setEstado("parado");
    }
  }

  return (
    <section id="analisar" className="mt-10 scroll-mt-20 sm:mt-12">
      {/* Ela fala primeiro: quem chega quer saber o que fazer, não ler
          uma explicação sobre a ferramenta. */}
      <RoboIris lancamentos={itens.length} analisando={estado === "lendo"} />

      <div className="mt-5 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8">
        <p className="text-2xs font-bold uppercase tracking-[0.14em] text-accent-strong">
          Passo 1
        </p>
        <h2 className="mt-1.5 font-display text-xl font-bold text-primary">
          Seu extrato
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Arraste o arquivo do banco ou cole os lançamentos. Nada sai do seu
          navegador enquanto você não pedir a leitura.
        </p>

        {/* Zona de arraste: o caminho de quem exportou o arquivo do banco. */}
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setArrastando(true);
          }}
          onDragLeave={() => setArrastando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastando(false);
            void receberArquivo(e.dataTransfer.files?.[0]);
          }}
          className={`mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-7 text-center transition-colors focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/12 ${
            arrastando
              ? "border-accent bg-accent/10"
              : arquivo
                ? "border-success/40 bg-success/[0.06]"
                : "border-border bg-muted/40 hover:border-accent/50 hover:bg-accent-tint"
          }`}
        >
          <input
            type="file"
            accept=".csv,.ofx,.txt,.qfx,text/plain,text/csv"
            className="sr-only"
            onChange={(e) => void receberArquivo(e.target.files?.[0])}
          />
          <FileUp
            className={`h-6 w-6 ${arquivo ? "text-success" : "text-muted-foreground"}`}
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <p className="mt-2 max-w-full break-words text-sm font-semibold text-foreground">
            {arquivo ?? "Arraste o extrato do seu banco ou clique para escolher"}
          </p>
          <p className="mt-1 text-2xs leading-relaxed text-muted-foreground">
            Aceita CSV e OFX — os formatos que Itaú, Bradesco, Nubank, Banco do
            Brasil, Caixa e Santander exportam.
          </p>
        </label>

        <label
          htmlFor="iris-extrato-texto"
          className="mt-6 block text-2xs font-bold uppercase tracking-[0.14em] text-muted-foreground"
        >
          Ou cole os lançamentos aqui
        </label>

        <textarea
          id="iris-extrato-texto"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setArquivo(null);
          }}
          rows={7}
          aria-describedby="iris-extrato-privacidade"
          placeholder={`01/06/2026;SALARIO;5000,00\n02/06/2026;ALUGUEL;-1800,00\n03/06/2026;NETFLIX.COM;-44,90`}
          className="mt-2 w-full resize-y rounded-2xl border border-border bg-muted/40 p-4 font-mono text-xs leading-relaxed outline-none focus:border-accent focus:bg-card focus:ring-4 focus:ring-accent/12"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p
            id="iris-extrato-privacidade"
            className="flex items-start gap-1.5 text-2xs leading-relaxed text-muted-foreground"
          >
            <Lock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
            O extrato é lido no seu navegador. Só os totais vão para a análise.
          </p>
          {itens.length > 0 && (
            <p className="text-2xs font-semibold text-success-strong">
              {itens.length} lançamentos reconhecidos
            </p>
          )}
        </div>

        {resumo && (
          <>
            <div className="mt-7 border-t border-border pt-6">
              <h3 className="text-sm font-bold text-foreground">
                O que os números já dizem
              </h3>
              <p className="mt-1 text-2xs text-muted-foreground">
                Somado aqui no seu navegador, a partir de {itens.length}{" "}
                lançamentos em {resumo.meses}{" "}
                {resumo.meses === 1 ? "mês" : "meses"}.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Numero rotulo="Entrou" valor={brl(resumo.entradas)} tom="bom" />
                <Numero rotulo="Saiu" valor={brl(resumo.saidas)} tom="ruim" />
                <Numero
                  rotulo="Sobrou"
                  valor={brl(resumo.saldo)}
                  tom={resumo.saldo >= 0 ? "bom" : "ruim"}
                />
              </div>
            </div>

            {resumo.totalVazado > 0 && (
              <div className="mt-3 flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4">
                <TrendingDown
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong"
                  aria-hidden="true"
                />
                <p className="text-xs leading-relaxed text-foreground">
                  <strong className="font-bold">{brl(resumo.totalVazado)}</strong>{" "}
                  em tarifas, juros e IOF em {resumo.meses}{" "}
                  {resumo.meses === 1 ? "mês" : "meses"}. No ritmo atual, são{" "}
                  <strong className="font-bold">
                    {brl((resumo.totalVazado / resumo.meses) * 12)}
                  </strong>{" "}
                  por ano — dinheiro que sai sem você comprar nada.
                </p>
              </div>
            )}

            {acabouOGratis && !leitura ? (
              <div className="mt-4 rounded-2xl border border-accent-soft bg-accent-tint p-5">
                <p className="flex items-center gap-2 text-sm font-bold text-primary">
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  Você já usou sua análise gratuita
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  Os números acima continuam sendo calculados aqui, de graça e
                  sem limite. A leitura da Íris — com os achados e o que fazer
                  — faz parte do Workspace.
                </p>
                <Link
                  href="/assinar/workspace"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent-btn px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong"
                >
                  Assinar o Workspace
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => void analisar()}
                  disabled={estado === "lendo"}
                  aria-busy={estado === "lendo"}
                  className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {estado === "lendo" ? (
                    <>
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      A Íris está lendo seu extrato...
                    </>
                  ) : (
                    <>
                      Pedir a leitura da Íris
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </button>
                <p className="mt-2.5 text-center text-2xs text-muted-foreground">
                  Sobem só os totais acima — nunca o texto do extrato.
                </p>
              </>
            )}
          </>
        )}

        {erro && (
          <p role="alert" className="mt-4 text-xs text-destructive">
            {erro}
          </p>
        )}
      </div>

      {/* O que a Íris entendeu */}
      {leitura && (
        <div className="mt-8 space-y-4">
          <p className="text-2xs font-bold uppercase tracking-[0.14em] text-accent-strong">
            Passo 2 · O resultado
          </p>

          <div className="palco-iris relative overflow-hidden rounded-3xl p-6 text-center sm:p-8">
            <p className="relative text-2xs font-bold uppercase tracking-[0.2em] text-[hsl(205_95%_75%)]">
              A leitura da Íris
            </p>
            <p className="surgir relative mt-3 break-words font-display text-lg font-bold leading-snug text-white sm:text-2xl">
              {leitura.veredito}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {leitura.achados.map((a, i) => (
              <div
                key={i}
                className={`rounded-2xl border p-5 ${
                  a.tipo === "vazamento"
                    ? "border-destructive/25 bg-destructive/[0.04]"
                    : a.tipo === "bom"
                      ? "border-success/30 bg-success/[0.06]"
                      : "border-border bg-card"
                }`}
              >
                <div className="flex items-start gap-2">
                  {a.tipo === "vazamento" ? (
                    <TrendingDown
                      className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                      aria-hidden="true"
                    />
                  ) : a.tipo === "bom" ? (
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-success-strong"
                      aria-hidden="true"
                    />
                  ) : (
                    <AlertTriangle
                      className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong"
                      aria-hidden="true"
                    />
                  )}
                  <h3 className="text-sm font-bold text-foreground">
                    {a.titulo}
                  </h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {a.texto}
                </p>
              </div>
            ))}
          </div>

          {leitura.acoes.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <h3 className="font-display text-base font-bold text-primary">
                Por onde começar
              </h3>
              <ol className="mt-4 space-y-3">
                {leitura.acoes.map((acao, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent-strong">
                      {i + 1}
                    </span>
                    <span className="text-sm leading-relaxed text-muted-foreground">
                      {acao}
                    </span>
                  </li>
                ))}
              </ol>

              <Link
                href="/consultoria#diagnostico"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent-strong hover:underline"
              >
                Quero um consultor olhando isso comigo
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          )}

          <p className="text-2xs leading-relaxed text-muted-foreground">
            A Íris lê o que você colou e escreve a interpretação. Os valores
            acima são somados aqui no navegador, não estimados. Conteúdo
            educacional — não é recomendação de investimento.
          </p>
        </div>
      )}
    </section>
  );
}

function Numero({
  rotulo,
  valor,
  tom,
}: {
  rotulo: string;
  valor: string;
  tom: "bom" | "ruim";
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/40 p-4 text-center">
      <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
        {rotulo}
      </p>
      <p
        className={`mt-1 break-words text-lg font-bold tabular-nums ${
          tom === "bom" ? "text-success-strong" : "text-foreground"
        }`}
      >
        {valor}
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownToLine,
  Check,
  FlaskConical,
  Plus,
  Trash2,
} from "lucide-react";
import {
  brl,
  brlExato,
  CabecalhoGrupo,
  mesCurto,
  Pastilha,
  Bloco,
} from "../pecas";
import { mesVizinho, nomeDoMes } from "@/lib/fincash/modelo";
import type { ProgressoMeta } from "@/lib/fincash/metas";
import type { LinhaAuditoria } from "./auditoria";
import { novoId, TIPOS, type Hipotese, type PontoSimulado, type TipoHipotese } from "./simulacao";

/**
 * As seções da projeção que não são o gráfico.
 *
 * Estão fora do `page.tsx` porque a página já carrega, projeta, simula e
 * decide o que somar — e uma tela que faz tudo isso E desenha oitocentas linhas
 * de JSX vira o arquivo que ninguém abre. Aqui em baixo tudo é apresentação
 * pura: recebe pronto, desenha, e devolve o clique.
 */

/** Como cada origem se apresenta. A palavra vem junto da cor sempre: pastilha
    colorida sem texto não diz nada a quem não enxerga cor — e confundir
    "previsto" com "pago" num app de dinheiro é o erro que faz gastar o que não
    tem. */
const FONTE = {
  lancamento: { rotulo: "Lançado", tom: "previsto" },
  atrasado: { rotulo: "Atrasado", tom: "atrasado" },
  fixa: { rotulo: "Conta fixa", tom: "fixa" },
  cartao: { rotulo: "Cartão", tom: "saida" },
  meta: { rotulo: "Meta", tom: "neutro" },
  simulacao: { rotulo: "Simulação", tom: "neutro" },
} as const;

// ────────────────────────────────────────────────────── Auditoria do mês ────

/**
 * A conta do mês, aberta.
 *
 * A ORDEM É A DA CONTA: saldo que entra no mês, o que soma, o que subtrai, o
 * que sobra. É para a pessoa poder acompanhar com o dedo e chegar no mesmo
 * número — se ela não conseguir refazer a conta, a projeção continua sendo
 * palpite, por mais bonito que seja o gráfico.
 */
export function AuditoriaMes({
  ponto,
  linhas,
}: {
  ponto: PontoSimulado;
  linhas: LinhaAuditoria[];
}) {
  const entra = linhas.filter((l) => l.sentido === "entra");
  const sai = linhas.filter((l) => l.sentido === "sai");
  const cortes = linhas.filter((l) => l.sentido === "corte");

  return (
    <Bloco className="overflow-hidden">
      <CabecalhoGrupo
        titulo={`De onde vem ${nomeDoMes(ponto.ref)}`}
        tom={ponto.saldoFim < 0 ? "saida" : "reserva"}
        total={brl(ponto.saldoFim)}
        detalhe="saldo no fim do mês"
      />

      <div className="flex items-baseline justify-between gap-3 border-b border-border/60 bg-gelo px-4 py-2.5 sm:px-5">
        <span className="text-xs text-muted-foreground">
          Saldo no começo do mês
        </span>
        <span className="shrink-0 text-sm tabular-nums text-primary">
          {brl(ponto.saldoInicio)}
        </span>
      </div>

      {linhas.length === 0 ? (
        <p className="px-4 py-5 text-xs leading-relaxed text-muted-foreground sm:px-5">
          Nada previsto para este mês além do que já está no seu saldo. Meses
          assim são normais lá na frente: a projeção só conhece o que você
          lançou e as suas contas fixas — o resto da vida ela não adivinha.
        </p>
      ) : (
        <ul className="divide-y divide-border/50">
          {[...entra, ...sai, ...cortes].map((l) => {
            const f = FONTE[l.fonte];
            const corte = l.sentido === "corte";

            return (
              <li
                key={l.chave}
                className="flex items-start gap-3 px-4 py-2.5 sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="truncate text-sm text-foreground">
                      {l.rotulo}
                    </span>
                    <Pastilha tom={f.tom}>{f.rotulo}</Pastilha>
                  </div>
                  <p className="mt-0.5 text-2xs leading-snug text-muted-foreground">
                    {l.detalhe}
                  </p>
                </div>

                <span
                  className={`shrink-0 text-sm tabular-nums ${
                    l.sentido === "entra"
                      ? "text-success-strong"
                      : corte
                        ? "text-ciano-forte"
                        : "text-accent-strong"
                  }`}
                >
                  {l.sentido === "entra" ? "+" : "−"} {brlExato(l.valor)}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <div className="space-y-1.5 border-t border-border/60 bg-gelo px-4 py-3 sm:px-5">
        {cortes.length > 0 && (
          /* O corte é listado inteiro lá em cima, mas nos totais daqui ele já
             está descontado — e some primeiro das despesas, depois da fatura.
             Sem esta frase, a soma de cabeça não fecha e a tela perde
             justamente a confiança que a auditoria existe para construir. */
          <p className="pb-1 text-2xs leading-snug text-ciano-forte">
            O corte simulado aparece como linha própria acima; nos totais abaixo
            ele já foi abatido — primeiro das despesas do mês, depois da fatura.
          </p>
        )}
        <Linha rotulo="Entra no mês" valor={brl(ponto.entradas)} />
        <Linha rotulo="Sai da conta" valor={brl(ponto.saidas)} />
        {ponto.faturas > 0 && (
          <Linha rotulo="Faturas de cartão" valor={brl(ponto.faturas)} />
        )}
        {ponto.aportes > 0 && (
          <Linha rotulo="Aportes de metas" valor={brl(ponto.aportes)} />
        )}
        <Linha
          rotulo="Sobra do mês"
          valor={brl(ponto.resultado)}
          forte
          alerta={ponto.resultado < 0}
        />
        <Linha
          rotulo="Saldo no fim"
          valor={brl(ponto.saldoFim)}
          forte
          alerta={ponto.saldoFim < 0}
        />
      </div>
    </Bloco>
  );
}

function Linha({
  rotulo,
  valor,
  forte,
  alerta,
}: {
  rotulo: string;
  valor: string;
  forte?: boolean;
  alerta?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span
        className={`text-xs ${forte ? "font-semibold text-primary" : "text-muted-foreground"}`}
      >
        {rotulo}
      </span>
      <span
        className={`shrink-0 tabular-nums ${
          alerta
            ? "text-sm font-semibold text-destructive"
            : forte
              ? "text-sm font-semibold text-primary"
              : "text-xs text-foreground"
        }`}
      >
        {valor}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────── Tabela dos meses ───

/**
 * Os doze meses em números.
 *
 * O GRÁFICO E A TABELA NÃO SÃO REDUNDÂNCIA: o desenho responde "quando aperta",
 * a tabela responde "quanto, exatamente". Quem vai agir precisa dos dois — e
 * quem usa leitor de tela só tem a tabela.
 *
 * Rola na horizontal DENTRO da própria caixa no celular; a leitura principal
 * ali é a lista deitada do gráfico, que já mostra mês e saldo sem rolagem
 * nenhuma. Aqui a rolagem é para quem quer a conta inteira.
 */
export function TabelaMeses({
  pontos,
  aberto,
  aoAbrir,
  primeiroNegativo,
  refDoMenor,
}: {
  pontos: PontoSimulado[];
  aberto: string;
  aoAbrir: (ref: string) => void;
  primeiroNegativo: string | null;
  refDoMenor: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[46rem] border-collapse text-sm">
        <caption className="sr-only">
          Projeção mês a mês: o que entra, o que sai, o que fica.
        </caption>
        <thead>
          <tr className="border-b border-border/70 text-2xs uppercase tracking-wider text-muted-foreground">
            <th scope="col" className="px-4 py-2 text-left font-semibold">
              Mês
            </th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">
              Entra
            </th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">
              Sai
            </th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">
              Cartão
            </th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">
              Metas
            </th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">
              Sobra
            </th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">
              Saldo no fim
            </th>
            <th scope="col" className="px-4 py-2 text-left font-semibold">
              Vem de
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {pontos.map((p) => {
            const negativo = p.saldoFim < 0;
            const selecionado = p.ref === aberto;

            return (
              <tr
                key={p.ref}
                className={
                  selecionado
                    ? "bg-primary/[0.05]"
                    : negativo
                      ? "bg-destructive/[0.04]"
                      : ""
                }
              >
                <th scope="row" className="px-1 py-1 text-left font-normal">
                  <button
                    type="button"
                    onClick={() => aoAbrir(p.ref)}
                    aria-pressed={selecionado}
                    className="flex min-h-11 w-full items-center gap-1.5 rounded-lg px-3 text-left transition-colors hover:bg-white"
                  >
                    {p.ref === primeiroNegativo && (
                      <AlertTriangle
                        className="h-3.5 w-3.5 shrink-0 text-destructive"
                        strokeWidth={2.5}
                        aria-label="Primeiro mês no vermelho"
                      />
                    )}
                    {p.ref !== primeiroNegativo && p.ref === refDoMenor && (
                      <ArrowDownToLine
                        className="h-3.5 w-3.5 shrink-0 text-accent-strong"
                        strokeWidth={2.5}
                        aria-label="Menor saldo do período"
                      />
                    )}
                    <span
                      className={`capitalize ${selecionado ? "font-semibold text-primary" : "text-foreground"}`}
                    >
                      {mesCurto(p.ref)}
                      <span className="text-muted-foreground">
                        /{p.ref.slice(2, 4)}
                      </span>
                    </span>
                  </button>
                </th>
                <td className="px-3 py-2 text-right tabular-nums text-success-strong">
                  {p.entradas > 0 ? brl(p.entradas) : "—"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-accent-strong">
                  {p.saidas > 0 ? brl(p.saidas) : "—"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-accent-strong">
                  {p.faturas > 0 ? brl(p.faturas) : "—"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-accent-strong">
                  {p.aportes > 0 ? brl(p.aportes) : "—"}
                </td>
                <td
                  className={`px-3 py-2 text-right tabular-nums ${
                    p.resultado < 0 ? "text-destructive" : "text-foreground"
                  }`}
                >
                  {brl(p.resultado)}
                </td>
                <td
                  className={`px-3 py-2 text-right font-semibold tabular-nums ${
                    negativo ? "text-destructive" : "text-primary"
                  }`}
                >
                  {brl(p.saldoFim)}
                </td>
                <td className="px-4 py-2 text-2xs text-muted-foreground">
                  {descreverOrigem(p)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** "3 lançados · 5 fixas" — a procedência do mês em cinco palavras. Vazio vira
    "só o saldo", que é uma informação e não um traço. */
function descreverOrigem(p: PontoSimulado) {
  const partes: string[] = [];
  if (p.base.origem.lancados > 0) partes.push(`${p.base.origem.lancados} lançados`);
  if (p.base.origem.recorrencias > 0)
    partes.push(`${p.base.origem.recorrencias} fixas`);
  if (p.base.faturas > 0) partes.push("cartão");
  if (p.base.aportes > 0) partes.push("metas");
  if (p.simEntradas !== 0 || p.simSaidas !== 0) partes.push("simulação");
  return partes.length > 0 ? partes.join(" · ") : "só o saldo";
}

// ─────────────────────────────────────────────────────────── Simulação ──────

/**
 * O "e se".
 *
 * TUDO EM MEMÓRIA, e a tela diz isso em voz alta. Um simulador que grava
 * assusta: a pessoa deixa de brincar com ele exatamente quando ele começaria a
 * ser útil, com medo de estragar os próprios dados. Aqui o pior que pode
 * acontecer é ela recarregar a página e perder a brincadeira.
 */
export function Simulacao({
  hipoteses,
  refs,
  aoAdicionar,
  aoAlternar,
  aoRemover,
  cortePerdido,
}: {
  hipoteses: Hipotese[];
  /** Os refs da janela, para o seletor de início. */
  refs: string[];
  aoAdicionar: (h: Hipotese) => void;
  aoAlternar: (id: string) => void;
  aoRemover: (id: string) => void;
  /** Quanto de corte não coube em nenhum mês. Zero quando tudo coube. */
  cortePerdido: number;
}) {
  const [tipo, setTipo] = useState<TipoHipotese>("corte");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [de, setDe] = useState(refs[0]);
  const [duracao, setDuracao] = useState("0");

  const numero = Number(valor.replace(/\./g, "").replace(",", "."));
  const valido = Number.isFinite(numero) && numero > 0;

  function adicionar() {
    if (!valido) return;
    const meses = Number(duracao);
    const fimDaJanela = refs[refs.length - 1];
    const ate =
      meses > 0
        ? [mesVizinho(de, meses - 1), fimDaJanela].sort()[0]
        : null;

    aoAdicionar({
      id: novoId(),
      tipo,
      descricao: descricao.trim() || TIPOS.find((t) => t.chave === tipo)!.rotulo,
      valor: numero,
      de,
      ate,
      ativa: true,
    });

    setDescricao("");
    setValor("");
  }

  return (
    <Bloco className="overflow-hidden">
      <CabecalhoGrupo
        titulo="E se eu mudasse alguma coisa?"
        tom="entrada"
        Icone={FlaskConical}
        detalhe="nada é gravado"
      />

      <div className="space-y-4 p-4 sm:p-5">
        <p className="max-w-prose text-xs leading-relaxed text-muted-foreground">
          Teste uma decisão antes de tomar. O gráfico e a tabela acima passam a
          mostrar o resultado da hipótese, com a linha tracejada marcando onde o
          mês terminaria sem ela. Isto vive só nesta aba: sair da tela apaga a
          simulação e não muda nada dos seus lançamentos.
        </p>

        <fieldset>
          <legend className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
            O que você quer testar
          </legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {TIPOS.map((t) => {
              const escolhido = t.chave === tipo;
              return (
                <label
                  key={t.chave}
                  className={`flex min-h-11 cursor-pointer items-start gap-2 rounded-xl border p-3 transition-colors ${
                    escolhido
                      ? "border-primary bg-primary/[0.06]"
                      : "border-border bg-white hover:border-accent-soft"
                  }`}
                >
                  <input
                    type="radio"
                    name="tipo-hipotese"
                    className="sr-only"
                    checked={escolhido}
                    onChange={() => setTipo(t.chave)}
                  />
                  <span
                    aria-hidden
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                      escolhido ? "border-primary bg-primary" : "border-border"
                    }`}
                  >
                    {escolhido && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-primary">
                      {t.rotulo}
                    </span>
                    <span className="mt-0.5 block text-2xs leading-snug text-muted-foreground">
                      {t.ajuda}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Nome
            </span>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Delivery, freela, escola…"
              className="mt-1 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>

          <label className="block">
            <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Quanto por mês
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="400"
              className="mt-1 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm tabular-nums text-foreground outline-none focus:border-primary"
            />
          </label>

          <label className="block">
            <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              A partir de
            </span>
            <select
              value={de}
              onChange={(e) => setDe(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm capitalize text-foreground outline-none focus:border-primary"
            >
              {refs.map((r) => (
                <option key={r} value={r}>
                  {nomeDoMes(r)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Por quanto tempo
            </span>
            <select
              value={duracao}
              onChange={(e) => setDuracao(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary"
            >
              <option value="0">Até o fim dos 12 meses</option>
              <option value="1">Só 1 mês</option>
              <option value="3">3 meses</option>
              <option value="6">6 meses</option>
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={adicionar}
          disabled={!valido}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent-btn px-4 text-sm font-bold text-white transition-all hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Somar à simulação
        </button>

        {hipoteses.length > 0 && (
          <ul className="divide-y divide-border/60 rounded-xl border border-border">
            {hipoteses.map((h) => {
              const t = TIPOS.find((x) => x.chave === h.tipo)!;
              return (
                <li key={h.id} className="flex items-center gap-2 p-2">
                  <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3 px-1">
                    <input
                      type="checkbox"
                      checked={h.ativa}
                      onChange={() => aoAlternar(h.id)}
                      className="h-4 w-4 shrink-0 accent-[hsl(215_50%_23%)]"
                    />
                    <span className="min-w-0">
                      <span
                        className={`block truncate text-sm ${h.ativa ? "text-foreground" : "text-muted-foreground line-through"}`}
                      >
                        {h.descricao}
                      </span>
                      <span className="block text-2xs text-muted-foreground">
                        {t.sinal}
                        {brlExato(h.valor)} por mês · de {mesCurto(h.de)}
                        {h.ate ? ` a ${mesCurto(h.ate)}` : " até o fim"} ·{" "}
                        {h.tipo === "corte"
                          ? "sai menos"
                          : h.tipo === "receita"
                            ? "entra mais"
                            : "sai mais"}
                      </span>
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => aoRemover(h.id)}
                    aria-label={`Remover a hipótese ${h.descricao}`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {cortePerdido > 0 && (
          <p className="rounded-xl border border-dashed border-accent/40 bg-accent-tint p-3 text-2xs leading-relaxed text-accent-strong">
            Em alguns meses o corte que você pediu é maior do que o total que
            sai. Considerei só o que existe para cortar — no acumulado, {" "}
            {brlExato(cortePerdido)} do corte não tinham de onde sair. Cortar
            mais do que se gasta daria uma projeção bonita e falsa.
          </p>
        )}
      </div>
    </Bloco>
  );
}

// ───────────────────────────────────────────────── Aportes das metas ────────

/**
 * O interruptor da dupla contagem.
 *
 * O PROBLEMA, escrito por quem fez o motor: se a meta já é bancada por uma
 * conta fixa de investimento, esse dinheiro JÁ SAI na projeção pelo caminho
 * normal. Somar o aporte planejado por cima tira o mesmo dinheiro duas vezes.
 * O vínculo entre a recorrência e a meta não existe no banco, então ninguém —
 * nem o motor, nem esta tela — consegue descobrir sozinho qual dos dois casos é
 * o da pessoa.
 *
 * A SAÍDA É PERGUNTAR, e perguntar do jeito que dá para responder: em vez de um
 * interruptor mudo, duas frases sobre a vida dela. E a tela ainda entrega a
 * pista que tem — as contas fixas que PARECEM investimento, com o total —, para
 * a resposta não ser um chute.
 *
 * O PADRÃO É NÃO SOMAR. Entre os dois erros possíveis, contar duas vezes é o
 * pior: inventa um vermelho que não existe, e o alarme falso é o que ensina a
 * pessoa a ignorar o alarme verdadeiro. Não somar mostra o fluxo de caixa como
 * ele está lançado hoje — e a tela diz, ao lado, quanto falta somar se a
 * resposta for a outra.
 */
export function AportesDeMetas({
  metas,
  ligado,
  aoMudar,
  pedidoMensal,
  candidatas,
}: {
  metas: ProgressoMeta[] | null;
  ligado: boolean;
  aoMudar: (v: boolean) => void;
  /** Quanto as metas ativas pedem no primeiro mês da janela. */
  pedidoMensal: number;
  /** Contas fixas que parecem bancar meta: descrição ou categoria de futuro. */
  candidatas: { id: string; descricao: string; valor: number }[];
}) {
  const totalCandidatas = candidatas.reduce((t, c) => t + c.valor, 0);

  return (
    <Bloco className="overflow-hidden">
      <CabecalhoGrupo
        titulo="Aportes das suas metas"
        tom="reserva"
        total={pedidoMensal > 0 ? `${brl(pedidoMensal)}/mês` : undefined}
      />

      <div className="space-y-4 p-4 sm:p-5">
        {metas === null ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            O módulo de metas ainda não existe no banco, então a projeção segue
            sem aporte nenhum. Assim que ele for criado, este bloco passa a
            perguntar como somá-los.
          </p>
        ) : pedidoMensal <= 0 ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            Você não tem meta ativa com prazo, então não há aporte planejado a
            somar. Meta sem data o app não consegue transformar em valor por mês
            — e prefere não inventar um.
          </p>
        ) : (
          <>
            <p className="max-w-prose text-xs leading-relaxed text-muted-foreground">
              Suas metas ativas pedem <strong>{brlExato(pedidoMensal)}</strong>{" "}
              por mês para chegarem no prazo. Se esse dinheiro já sai por uma
              conta fixa que você cadastrou, ele <strong>já está</strong> na
              projeção — somar de novo tiraria o mesmo valor duas vezes e criaria
              um vermelho que não existe. Como é no seu caso?
            </p>

            <fieldset className="grid gap-2 sm:grid-cols-2">
              <legend className="sr-only">
                Como somar os aportes das metas na projeção
              </legend>
              <Opcao
                escolhida={!ligado}
                aoEscolher={() => aoMudar(false)}
                titulo="Já saem nas minhas contas fixas"
                texto="A projeção usa só o que está lançado. É o padrão, e o mais seguro."
              />
              <Opcao
                escolhida={ligado}
                aoEscolher={() => aoMudar(true)}
                titulo="Ainda não lancei esses aportes"
                texto={`Somo ${brl(pedidoMensal)} por mês às saídas, até o prazo de cada meta.`}
              />
            </fieldset>

            {candidatas.length > 0 && (
              <div className="rounded-xl bg-gelo p-3">
                <p className="text-2xs font-semibold uppercase tracking-wider text-ciano-forte">
                  A pista que eu tenho
                </p>
                <p className="mt-1 text-2xs leading-relaxed text-muted-foreground">
                  Encontrei {brlExato(totalCandidatas)} por mês em contas fixas
                  que parecem investimento. Se são elas que bancam suas metas,
                  deixe a primeira opção marcada.
                </p>
                <ul className="mt-2 space-y-1">
                  {candidatas.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-baseline justify-between gap-3 text-2xs"
                    >
                      <span className="min-w-0 truncate text-foreground">
                        {c.descricao}
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {brlExato(c.valor)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {ligado && candidatas.length > 0 && (
              <p className="rounded-xl border border-dashed border-accent/40 bg-accent-tint p-3 text-2xs leading-relaxed text-accent-strong">
                Atenção: você está somando os aportes E tem contas fixas que
                parecem investimento. Se forem a mesma coisa, este mês está
                sendo debitado duas vezes.
              </p>
            )}

            <p className="text-2xs leading-relaxed text-muted-foreground">
              <Link
                href="/fincash/app/fixas"
                className="font-semibold text-accent-strong underline underline-offset-2"
              >
                Ver minhas contas fixas
              </Link>{" "}
              para conferir o que já está lançado.
            </p>
          </>
        )}
      </div>
    </Bloco>
  );
}

function Opcao({
  escolhida,
  aoEscolher,
  titulo,
  texto,
}: {
  escolhida: boolean;
  aoEscolher: () => void;
  titulo: string;
  texto: string;
}) {
  return (
    <label
      className={`flex min-h-11 cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-colors ${
        escolhida
          ? "border-primary bg-primary/[0.06]"
          : "border-border bg-white hover:border-accent-soft"
      }`}
    >
      <input
        type="radio"
        name="aportes-metas"
        className="sr-only"
        checked={escolhida}
        onChange={aoEscolher}
      />
      <span
        aria-hidden
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
          escolhida ? "border-primary bg-primary" : "border-border"
        }`}
      >
        {escolhida && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-primary">{titulo}</span>
        <span className="mt-0.5 block text-2xs leading-snug text-muted-foreground">
          {texto}
        </span>
      </span>
    </label>
  );
}

// ────────────────────────────────────────────────────── Nota de confiança ───

export type Confianca = "fraca" | "parcial" | "boa";

/**
 * Quanto vale esta projeção.
 *
 * PREFERIR O SILÊNCIO À FALSA PRECISÃO — a mesma regra do Orçamento, e aqui ela
 * pesa mais: uma curva de doze meses tem cara de ciência mesmo quando foi
 * desenhada em cima de três lançamentos. Se a pessoa não cadastrou as contas
 * fixas, os meses distantes são só o saldo de hoje repetido, e dizer isso em voz
 * alta é o que impede que ela tome uma decisão grande apoiada em nada.
 */
export function NotaConfianca({
  nivel,
  mesesHistorico,
  recorrencias,
  previstosFuturos,
}: {
  nivel: Confianca;
  mesesHistorico: number;
  recorrencias: number;
  previstosFuturos: number;
}) {
  const titulo = {
    fraca: "Esta projeção ainda é um esboço",
    parcial: "Projeção parcial",
    boa: "Projeção com base",
  }[nivel];

  const texto = {
    fraca:
      "O app tem pouca história sua e poucas contas fixas cadastradas. Os meses distantes aqui são quase só o seu saldo de hoje repetido — trate como um rascunho, não como previsão.",
    parcial:
      "Dá para confiar nos próximos meses, onde o que manda é o que já está lançado. Do meio do ano em diante o desenho depende quase só das contas fixas — quanto mais completas, mais verdadeiro ele fica.",
    boa: "Você tem histórico e contas fixas cadastradas, que é o que sustenta os meses distantes. Ainda assim, projeção é cenário: ela mostra o que acontece se nada mudar, e a vida costuma mudar.",
  }[nivel];

  return (
    <div className="rounded-2xl border border-border/70 bg-white/70 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Pastilha tom={nivel === "boa" ? "pago" : nivel === "parcial" ? "previsto" : "atrasado"}>
          {titulo}
        </Pastilha>
      </div>
      <p className="mt-2 max-w-prose text-xs leading-relaxed text-muted-foreground">
        {texto}
      </p>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-2xs text-muted-foreground">
        <li>
          <strong className="tabular-nums text-primary">{mesesHistorico}</strong>{" "}
          {mesesHistorico === 1 ? "mês de histórico" : "meses de histórico"}
        </li>
        <li>
          <strong className="tabular-nums text-primary">{recorrencias}</strong>{" "}
          {recorrencias === 1 ? "conta fixa ativa" : "contas fixas ativas"}
        </li>
        <li>
          <strong className="tabular-nums text-primary">{previstosFuturos}</strong>{" "}
          {previstosFuturos === 1
            ? "lançamento futuro previsto"
            : "lançamentos futuros previstos"}
        </li>
      </ul>
      {nivel !== "boa" && (
        <p className="mt-3 text-2xs text-muted-foreground">
          <Link
            href="/fincash/app/fixas"
            className="font-semibold text-accent-strong underline underline-offset-2"
          >
            Cadastrar minhas contas fixas
          </Link>{" "}
          é o que mais melhora esta tela.
        </p>
      )}
    </div>
  );
}

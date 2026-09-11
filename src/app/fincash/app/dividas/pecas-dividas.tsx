"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CreditCard,
  Landmark,
  Loader2,
  Receipt,
  ShoppingBag,
  Trash2,
  TrendingDown,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  BotaoAcao,
  brl,
  brlExato,
  DiscoIcone,
  Pastilha,
} from "../pecas";
/* O `Modal`, o `dataCurta` e o `mesAno` vêm da tela de Metas de propósito, e
   não copiados para cá. Eles são a moldura de formulário da casa e a grafia de
   data da casa — duas cópias divergem em uma semana (uma ganha o `Escape`, a
   outra não; uma escreve "dez/2027", a outra "12/2027") e aí o app passa a
   parecer montado por duas pessoas. Se um dia aparecer uma terceira tela com
   formulário, o certo é promovê-los para `pecas.tsx`. */
import { dataCurta, mesAno, Modal } from "../metas/pecas-metas";
import {
  amortizarDivida,
  atualizarDivida,
  mudarStatusDivida,
  registrarPagamento,
  ROTULO_TIPO,
  salvarDivida,
  TIPOS_QUE_COSTUMAM_CRESCER,
  taxaAnualParaMensal,
  taxaMensalParaAnual,
  type Divida,
  type PagamentoDivida,
  type RetratoDivida,
  type SistemaAmortizacao,
  type StatusDivida,
  type TipoDivida,
  type TipoPagamentoDivida,
} from "@/lib/fincash/dividas";
import { hojeIso, type Cartao } from "@/lib/fincash/modelo";

/**
 * As peças que só a tela de Dívidas usa.
 *
 * Moram aqui, e não em `pecas.tsx`, pelo mesmo motivo das de Metas:
 * `pecas.tsx` é o vocabulário comum do FINCASH inteiro, e uma tabela de
 * amortização ali dentro seria peça de uma tela só ocupando o arquivo que
 * todas as outras importam.
 */

// ─────────────────────────────────────────────────────────── Aparência ──────

const ICONE_TIPO: Record<TipoDivida, LucideIcon> = {
  cartao_rotativo: CreditCard,
  cheque_especial: Wallet,
  emprestimo_pessoal: Landmark,
  consignado: Landmark,
  financiamento: Receipt,
  parcelamento: ShoppingBag,
  outro: TrendingDown,
};

export const iconeDaDivida = (t: TipoDivida): LucideIcon => ICONE_TIPO[t] ?? TrendingDown;

/* A mesma paleta das telas de Conta e de Meta. Duas paletas no mesmo app é
   como a tela passa a parecer montada por duas pessoas. */
export const CORES = [
  "#dc2626",
  "#e8703a",
  "#f59e0b",
  "#7c3aed",
  "#1e3a5f",
  "#0891b2",
  "#16a34a",
  "#db2777",
];

export const ROTULO_STATUS: Record<StatusDivida, string> = {
  ativa: "Ativa",
  quitada: "Quitada",
  renegociada: "Renegociada",
  cancelada: "Cancelada",
};

/** "2,5% a.m." e, entre parênteses, o ano — porque é no ano que a pessoa
    percebe o tamanho: 2,5% ao mês parece pouco, 34,5% ao ano não. */
export const taxaEscrita = (mensal: number) =>
  `${mensal.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% a.m. · ${taxaMensalParaAnual(
    mensal,
  ).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% a.a.`;

const CAMPO =
  "mt-1 w-full rounded-xl border border-border px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent";
const PAR_BOTOES = "flex-1";
const ROTULO = "text-xs font-medium text-muted-foreground";

const numero = (texto: string) =>
  Number(texto.replace(/\./g, "").replace(",", ".")) || 0;

const emCampo = (v: number) => (v > 0 ? String(v).replace(".", ",") : "");

// ───────────────────────────────────────────────── O alarme do crescendo ────

/**
 * ⚠️ A dívida está CRESCENDO.
 *
 * É a primeira coisa que a tela diz quando acontece, e ela diz o número: o
 * juro do mês, a parcela, e quanto falta para pelo menos empatar. Um app que
 * mostra "atenção: juros altos" e segue a vida está sendo educado às custas de
 * uma informação que muda a vida da pessoa.
 *
 * O QUE ESTA PEÇA NÃO FAZ: sugerir refinanciamento, portabilidade ou qualquer
 * produto. Ela mostra a aritmética e para. A Novare é consultoria, e conselho
 * de produto no meio de um alarme é venda disfarçada de socorro.
 */
export function AlarmeCrescendo({ retratos }: { retratos: RetratoDivida[] }) {
  if (retratos.length === 0) return null;

  return (
    <div
      role="alert"
      className="mb-3 rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/12 text-destructive"
        >
          <AlertTriangle className="h-4.5 w-4.5" strokeWidth={2.2} />
        </span>
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold text-destructive">
            {retratos.length === 1
              ? "Uma dívida sua está crescendo"
              : `${retratos.length} dívidas suas estão crescendo`}
          </p>
          <p className="mt-1 max-w-prose text-xs leading-relaxed text-foreground">
            A parcela que você paga não cobre nem o juro do mês. O saldo sobe
            mesmo pagando em dia — e nenhum plano de quitação funciona enquanto
            isso não parar.
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2.5">
        {retratos.map((r) => (
          <li
            key={r.divida.id}
            className="rounded-xl bg-white p-3.5 shadow-[var(--fin-sombra-card)]"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="min-w-0 truncate text-sm font-semibold text-primary">
                {r.divida.credor}
              </p>
              <p className="shrink-0 text-2xs tabular-nums text-muted-foreground">
                {taxaEscrita(r.divida.taxa_mensal)}
              </p>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-foreground">
              Juro deste mês:{" "}
              <strong className="tabular-nums text-destructive">
                {brlExato(r.amortizacao.jurosDoPrimeiroMes)}
              </strong>
              . Sua parcela:{" "}
              <strong className="tabular-nums">{brlExato(r.divida.parcela)}</strong>. A
              diferença de{" "}
              <strong className="tabular-nums">
                {brlExato(r.amortizacao.jurosDoPrimeiroMes - r.divida.parcela)}
              </strong>{" "}
              é somada ao saldo todo mês.
            </p>
            <p className="mt-1.5 text-2xs leading-relaxed text-muted-foreground">
              Pagando{" "}
              <strong className="tabular-nums text-foreground">
                {brlExato(r.amortizacao.parcelaParaEstancar)}
              </strong>{" "}
              a dívida para de crescer. Só acima disso ela começa a diminuir.
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ────────────────────────────────────────────────── Cartão de uma dívida ────

export function CartaoDivida({
  r,
  aoPagar,
  aoAbrir,
}: {
  r: RetratoDivida;
  aoPagar: () => void;
  aoAbrir: () => void;
}) {
  const { divida: d, amortizacao: a } = r;
  const pct = Math.round(r.progressoQuitacao * 100);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-[var(--fin-sombra-card)] sm:p-5">
      <div className="flex items-start gap-3">
        <DiscoIcone Icone={iconeDaDivida(d.tipo)} cor={d.cor} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-semibold text-primary">
            {d.credor}
          </p>
          <p className="mt-0.5 truncate text-2xs text-muted-foreground">
            {ROTULO_TIPO[d.tipo]} · {taxaEscrita(d.taxa_mensal)}
          </p>
        </div>
        {/* Nunca só a cor: a pastilha vermelha vem com a palavra. */}
        {a.crescendo && (
          <Pastilha tom="atrasado" Icone={AlertTriangle}>
            Crescendo
          </Pastilha>
        )}
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-2xs text-muted-foreground">Saldo devedor</p>
          <p className="font-display text-xl font-semibold tabular-nums text-primary">
            {brl(d.saldo_atual)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xs text-muted-foreground">Parcela</p>
          <p className="text-sm font-semibold tabular-nums text-foreground">
            {brlExato(d.parcela)}
          </p>
        </div>
      </div>

      {/* A barra mede o que já foi pago do valor ORIGINAL. Fica cinza quando a
          dívida cresce: pintar de verde um progresso que está andando para
          trás seria a mentira mais fácil desta tela. */}
      <div className="mt-3">
        <div
          className="h-2 overflow-hidden rounded-full bg-border/60"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Quitação de ${d.credor}`}
        >
          <div
            className="h-full rounded-full transition-[width] duration-700"
            style={{
              width: `${Math.max(2, pct)}%`,
              background: a.crescendo ? "var(--color-border)" : "var(--color-success)",
            }}
          />
        </div>
        <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-2xs tabular-nums text-muted-foreground">
            {pct}% do original quitado
            {d.parcelas_total !== null &&
              ` · ${d.parcelas_pagas} de ${d.parcelas_total} parcelas`}
          </p>
          <p className="text-2xs tabular-nums text-muted-foreground">
            {a.crescendo
              ? "sem data de saída"
              : r.dataSaida
                ? `livre em ${mesAno(r.dataSaida)}`
                : "prazo indefinido"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <BotaoAcao tamanho="sm" onClick={aoPagar} className="flex-1">
          Registrar pagamento
        </BotaoAcao>
        <BotaoAcao
          variante="contorno"
          tamanho="sm"
          onClick={aoAbrir}
          rotuloAcessivel={`Ver a tabela de amortização de ${d.credor}`}
        >
          Detalhes
        </BotaoAcao>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────── Formulário de dívida ─────

/**
 * Cadastrar e editar a dívida.
 *
 * A PERGUNTA DA FRONTEIRA É EXPLÍCITA no formulário, e não escondida num campo
 * avançado: se a parcela desta dívida já está lançada no fluxo de caixa, o app
 * precisa saber, senão passa a contar o mesmo dinheiro duas vezes e o
 * comprometimento da renda mente para cima. Num módulo de dívida, mentir para
 * cima é o pior erro possível — assusta quem já está assustado, e assustado
 * demais ninguém segue plano nenhum.
 *
 * A TAXA ACEITA MENSAL OU ANUAL porque o contrato vem das duas formas, e a
 * conversão é composta: dividir a taxa anual por 12 é o erro clássico e daria
 * uma dívida mais barata do que ela é.
 */
export function FormularioDivida({
  divida,
  cartoes,
  aoFechar,
  aoSalvar,
}: {
  divida?: Divida;
  cartoes: Cartao[];
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const [credor, setCredor] = useState(divida?.credor ?? "");
  const [tipo, setTipo] = useState<TipoDivida>(divida?.tipo ?? "emprestimo_pessoal");
  const [original, setOriginal] = useState(emCampo(divida?.valor_original ?? 0));
  const [saldo, setSaldo] = useState(emCampo(divida?.saldo_atual ?? 0));
  const [unidade, setUnidade] = useState<"mes" | "ano">("mes");
  const [taxa, setTaxa] = useState(divida ? String(divida.taxa_mensal).replace(".", ",") : "");
  const [sistema, setSistema] = useState<SistemaAmortizacao>(divida?.sistema ?? "price");
  const [parcela, setParcela] = useState(emCampo(divida?.parcela ?? 0));
  const [temPrazo, setTemPrazo] = useState(divida ? divida.parcelas_total !== null : true);
  const [total, setTotal] = useState(divida?.parcelas_total ? String(divida.parcelas_total) : "");
  const [pagas, setPagas] = useState(String(divida?.parcelas_pagas ?? 0));
  const [dia, setDia] = useState(String(divida?.dia_vencimento ?? 10));
  const [cartaoId, setCartaoId] = useState(divida?.cartao_id ?? "");
  const [noFluxo, setNoFluxo] = useState(divida?.ja_no_fluxo ?? false);
  const [cor, setCor] = useState(divida?.cor ?? CORES[0]);
  const [observacao, setObservacao] = useState(divida?.observacao ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const taxaMensal =
    unidade === "mes" ? numero(taxa) : taxaAnualParaMensal(numero(taxa));
  const valorSaldo = numero(saldo);
  const valorParcela = numero(parcela);

  /* O aviso NASCE DA ARITMÉTICA, não do tipo escolhido: um consignado com a
     parcela digitada errada também cresce, e um rotativo já negociado pode
     estar amortizando normalmente. Aparece ANTES de salvar porque é aí que a
     pessoa ainda pode conferir se digitou a taxa certa. */
  const juroDoMes = (valorSaldo * taxaMensal) / 100;
  const vaiCrescer = valorSaldo > 0 && valorParcela > 0 && valorParcela <= juroDoMes;

  const podeSalvar =
    credor.trim().length > 0 &&
    valorSaldo > 0 &&
    valorParcela > 0 &&
    numero(original) > 0 &&
    (!temPrazo || Number(total) > 0);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!podeSalvar) return;

    setSalvando(true);
    setErro(null);

    const campos = {
      credor: credor.trim(),
      tipo,
      valor_original: numero(original),
      saldo_atual: valorSaldo,
      /* Seis casas: é o que a coluna guarda, e uma taxa anual convertida cai
         numa dízima. Truncar em duas faria a simulação de 60 meses divergir
         alguns reais do boleto. */
      taxa_mensal: Math.round(taxaMensal * 1e6) / 1e6,
      sistema,
      parcela: valorParcela,
      parcelas_total: temPrazo ? Number(total) : null,
      parcelas_pagas: Number(pagas) || 0,
      dia_vencimento: Math.min(31, Math.max(1, Number(dia) || 10)),
      cartao_id: cartaoId || null,
      ja_no_fluxo: noFluxo,
      cor,
      observacao: observacao.trim() || null,
    };

    try {
      if (divida) await atualizarDivida(divida.id, campos);
      else await salvarDivida(campos);
      aoSalvar();
    } catch (err) {
      setErro((err as Error).message);
      setSalvando(false);
    }
  }

  return (
    <Modal
      titulo={divida ? "Editar dívida" : "Nova dívida"}
      subtitulo="O saldo devedor e a taxa são o que fazem a conta existir: é deles que sai a data em que você fica livre."
      aoFechar={aoFechar}
      largura="max-w-lg"
    >
      <form onSubmit={enviar}>
        <label className="mt-5 block">
          <span className={ROTULO}>Para quem você deve</span>
          <input
            autoFocus
            value={credor}
            onChange={(e) => setCredor(e.target.value)}
            maxLength={80}
            placeholder="Banco X, financeira, loja…"
            className={CAMPO}
          />
        </label>

        <label className="mt-4 block">
          <span className={ROTULO}>Que tipo de dívida</span>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoDivida)}
            className={CAMPO}
          >
            {(Object.keys(ROTULO_TIPO) as TipoDivida[]).map((t) => (
              <option key={t} value={t}>
                {ROTULO_TIPO[t]}
              </option>
            ))}
          </select>
        </label>
        {TIPOS_QUE_COSTUMAM_CRESCER.includes(tipo) && (
          <p className="mt-1.5 text-2xs leading-relaxed text-muted-foreground">
            É o tipo de dívida que costuma crescer mesmo pagando em dia — o juro
            do mês passa da parcela mínima. Confira a taxa no extrato antes de
            salvar; ela é a informação mais importante aqui.
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className={ROTULO}>Valor original</span>
            <input
              inputMode="decimal"
              value={original}
              onChange={(e) => setOriginal(e.target.value)}
              placeholder="0,00"
              className={`${CAMPO} tabular-nums`}
            />
          </label>
          <label className="block">
            <span className={ROTULO}>Saldo devedor hoje</span>
            <input
              inputMode="decimal"
              value={saldo}
              onChange={(e) => setSaldo(e.target.value)}
              placeholder="0,00"
              className={`${CAMPO} tabular-nums`}
            />
          </label>
        </div>
        <p className="mt-1.5 text-2xs leading-relaxed text-muted-foreground">
          O saldo é o que o credor diz que você deve HOJE, não a soma das
          parcelas que faltam — elas embutem o juro que ainda nem correu.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className={ROTULO}>Taxa de juros</span>
              <button
                type="button"
                onClick={() => setUnidade((u) => (u === "mes" ? "ano" : "mes"))}
                className="min-h-11 rounded-lg bg-ciano-tint px-2.5 text-2xs font-semibold text-ciano-forte"
                aria-label={`Mudar a unidade da taxa. Agora está ${unidade === "mes" ? "ao mês" : "ao ano"}`}
              >
                {unidade === "mes" ? "ao mês" : "ao ano"}
              </button>
            </div>
            <input
              inputMode="decimal"
              value={taxa}
              onChange={(e) => setTaxa(e.target.value)}
              placeholder="0,00"
              className={`${CAMPO} tabular-nums`}
            />
          </div>
          <label className="block">
            <span className={ROTULO}>Valor da parcela</span>
            <input
              inputMode="decimal"
              value={parcela}
              onChange={(e) => setParcela(e.target.value)}
              placeholder="0,00"
              className={`${CAMPO} tabular-nums`}
            />
          </label>
        </div>
        {numero(taxa) > 0 && (
          <p className="mt-1.5 text-2xs tabular-nums text-muted-foreground">
            Equivale a {taxaEscrita(taxaMensal)}.
          </p>
        )}

        {vaiCrescer && (
          <p
            role="status"
            className="mt-3 flex items-start gap-2 rounded-xl bg-destructive/8 p-3 text-2xs leading-relaxed text-destructive"
          >
            <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              Com esses números a dívida <strong>cresce</strong>: o juro do mês é{" "}
              {brlExato(juroDoMes)} e a parcela é {brlExato(valorParcela)}. Se
              estiver certo, cadastre assim mesmo — o app precisa saber. Se foi
              engano, confira a taxa: às vezes o contrato traz o valor ao ano.
            </span>
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className={ROTULO}>Sistema</span>
            <select
              value={sistema}
              onChange={(e) => setSistema(e.target.value as SistemaAmortizacao)}
              className={CAMPO}
            >
              <option value="price">Price — parcela fixa</option>
              <option value="sac">SAC — parcela caindo</option>
            </select>
          </label>
          <label className="block">
            <span className={ROTULO}>Dia do vencimento</span>
            <input
              inputMode="numeric"
              value={dia}
              onChange={(e) => setDia(e.target.value)}
              className={`${CAMPO} tabular-nums`}
            />
          </label>
        </div>
        <p className="mt-1.5 text-2xs leading-relaxed text-muted-foreground">
          Na dúvida, Price: é o do consignado, do empréstimo pessoal e do
          crediário. SAC é quase sempre financiamento imobiliário, e a parcela
          dele diminui todo mês.
        </p>

        {/* O prazo é um interruptor, e não um campo que se deixa vazio: sem
            prazo (rotativo, cheque especial) a dívida muda de natureza, e o
            app calcula outra coisa. Campo em branco não comunica isso. */}
        <div className="mt-4 rounded-xl border border-border p-3">
          <div className="flex items-center justify-between gap-3">
            <span className={ROTULO}>Tem número de parcelas</span>
            <button
              type="button"
              role="switch"
              aria-checked={temPrazo}
              onClick={() => setTemPrazo((v) => !v)}
              className={`min-h-11 rounded-lg px-3 py-2 text-2xs font-semibold transition-colors ${
                temPrazo
                  ? "bg-ciano-tint text-ciano-forte"
                  : "bg-accent-tint text-accent-strong"
              }`}
            >
              {temPrazo ? "Tem prazo" : "Sem prazo"}
            </button>
          </div>

          {temPrazo ? (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block">
                <span className={ROTULO}>Total de parcelas</span>
                <input
                  inputMode="numeric"
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                  placeholder="48"
                  className={`${CAMPO} tabular-nums`}
                />
              </label>
              <label className="block">
                <span className={ROTULO}>Já pagas</span>
                <input
                  inputMode="numeric"
                  value={pagas}
                  onChange={(e) => setPagas(e.target.value)}
                  className={`${CAMPO} tabular-nums`}
                />
              </label>
            </div>
          ) : (
            <p className="mt-2 text-2xs leading-relaxed text-muted-foreground">
              Rotativo do cartão e cheque especial não têm prazo: existe um
              saldo, um juro e o quanto você consegue pagar por mês. É o caso em
              que a dívida pode crescer — e o app vai dizer se ela está.
            </p>
          )}
        </div>

        {/* ⚠️ A FRONTEIRA. */}
        <div className="mt-4 rounded-xl border border-accent/30 bg-accent-tint/40 p-3">
          <div className="flex items-center justify-between gap-3">
            <span className={ROTULO}>A parcela já está no seu fluxo de caixa</span>
            <button
              type="button"
              role="switch"
              aria-checked={noFluxo}
              onClick={() => setNoFluxo((v) => !v)}
              className={`min-h-11 shrink-0 rounded-lg px-3 py-2 text-2xs font-semibold transition-colors ${
                noFluxo
                  ? "bg-accent-tint text-accent-strong"
                  : "bg-white text-muted-foreground"
              }`}
            >
              {noFluxo ? "Já está" : "Não está"}
            </button>
          </div>
          <p className="mt-2 text-2xs leading-relaxed text-muted-foreground">
            Marque se você já lança esta parcela como despesa ou dentro da
            fatura do cartão. Assim o app não conta o mesmo dinheiro duas vezes
            na sua projeção de caixa.{" "}
            <strong className="text-foreground">
              Compra parcelada que você já lançou em Lançamentos não precisa ser
              cadastrada aqui
            </strong>{" "}
            — ela já está sendo acompanhada.
          </p>
        </div>

        {cartoes.length > 0 && (
          <label className="mt-4 block">
            <span className={ROTULO}>É de algum cartão seu? (opcional)</span>
            <select
              value={cartaoId}
              onChange={(e) => setCartaoId(e.target.value)}
              className={CAMPO}
            >
              <option value="">Não é de cartão</option>
              {cartoes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="mt-4">
          <span className={ROTULO}>Cor</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {CORES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCor(c)}
                aria-label={`Usar a cor ${c}`}
                aria-pressed={cor === c}
                className={`h-11 w-11 rounded-xl transition-transform ${
                  cor === c ? "ring-2 ring-primary ring-offset-2" : ""
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        <label className="mt-4 block">
          <span className={ROTULO}>Observação (opcional)</span>
          <input
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Número do contrato, condição negociada…"
            className={CAMPO}
          />
        </label>

        {erro && (
          <p role="status" className="mt-3 text-2xs text-destructive">
            {erro}
          </p>
        )}

        <div className="mt-6 flex gap-2">
          <BotaoAcao variante="contorno" onClick={aoFechar} className={PAR_BOTOES}>
            Cancelar
          </BotaoAcao>
          <BotaoAcao
            tipo="submit"
            desabilitado={salvando || !podeSalvar}
            Icone={salvando ? Loader2 : undefined}
            className={`${PAR_BOTOES} ${salvando ? "motion-safe:[&>svg]:animate-spin" : ""}`}
          >
            {salvando ? "Salvando…" : divida ? "Salvar" : "Cadastrar dívida"}
          </BotaoAcao>
        </div>
      </form>
    </Modal>
  );
}

// ──────────────────────────────────────────────── Registrar um pagamento ────

/**
 * O pagamento feito.
 *
 * A AMORTIZAÇÃO EXTRA FICA NA MESMA CAIXA, e não escondida: ela é o gesto que
 * antecipa a data de saída, e o app que dificulta registrá-la desperdiça a
 * única boa notícia que este módulo tem para dar.
 *
 * O `saldo depois` É OPCIONAL E TEM PRIORIDADE. Opcional porque nem sempre a
 * pessoa tem o extrato à mão, e um pagamento sem detalhe é melhor que nenhum.
 * Prioritário porque, quando ela tem, aquele número é a verdade — a nossa
 * subtração ignora IOF, seguro prestamista e tarifa, que o contrato tem e a
 * nossa taxa não.
 */
export function FormularioPagamento({
  divida,
  aoFechar,
  aoSalvar,
}: {
  divida: Divida;
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const [tipo, setTipo] = useState<TipoPagamentoDivida>("parcela");
  const [valor, setValor] = useState(emCampo(divida.parcela));
  const [data, setData] = useState(hojeIso());
  const [saldoApos, setSaldoApos] = useState("");
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  /* A divisão juro × principal é MOSTRADA antes de salvar, calculada pela taxa
     cadastrada. É a informação que a pessoa nunca vê no boleto e é a que
     explica por que o saldo mal se move: de R$ 900 pagos, R$ 720 podem ser
     só juro. */
  const juros = useMemo(
    () => Math.round(((divida.saldo_atual * divida.taxa_mensal) / 100) * 100) / 100,
    [divida],
  );
  const pago = numero(valor);
  const amortizacao = Math.round((pago - juros) * 100) / 100;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (pago <= 0) return;

    setSalvando(true);
    setErro(null);

    try {
      await registrarPagamento(
        {
          divida_id: divida.id,
          tipo,
          valor: pago,
          data,
          /* Amortização extra não paga juro nenhum: ela vai inteira no
             principal. Gravar juro aqui inflaria o custo total da dívida no
             histórico. */
          juros: tipo === "extra" ? 0 : juros,
          amortizacao: tipo === "extra" ? pago : amortizacao,
          saldo_apos: saldoApos ? numero(saldoApos) : null,
          lancamento_id: null,
          observacao: observacao.trim() || null,
        },
        divida,
      );
      aoSalvar();
    } catch (err) {
      setErro((err as Error).message);
      setSalvando(false);
    }
  }

  return (
    <Modal
      titulo="Registrar pagamento"
      subtitulo={divida.credor}
      aoFechar={aoFechar}
    >
      <form onSubmit={enviar}>
        <div className="mt-5 grid grid-cols-2 gap-2">
          {(["parcela", "extra"] as TipoPagamentoDivida[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              aria-pressed={tipo === t}
              className={`min-h-11 rounded-xl px-3 text-xs font-semibold transition-colors ${
                tipo === t
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {t === "parcela" ? "Parcela do mês" : "Amortização extra"}
            </button>
          ))}
        </div>
        <p className="mt-2 text-2xs leading-relaxed text-muted-foreground">
          {tipo === "parcela"
            ? "A parcela normal do carnê. Ela paga o juro do mês e o que sobra abate o saldo."
            : "Dinheiro a mais, fora da parcela. Vai inteiro no saldo — é o que antecipa a sua data de saída."}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className={ROTULO}>Quanto</span>
            <input
              autoFocus
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              className={`${CAMPO} tabular-nums`}
            />
          </label>
          <label className="block">
            <span className={ROTULO}>Quando</span>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className={`${CAMPO} tabular-nums`}
            />
          </label>
        </div>

        {tipo === "parcela" && pago > 0 && (
          <div className="mt-3 rounded-xl bg-muted/60 p-3">
            <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Para onde este dinheiro vai
            </p>
            <div className="mt-2 flex items-baseline justify-between gap-3 text-xs">
              <span className="text-muted-foreground">Juro do mês</span>
              <span className="tabular-nums font-semibold text-destructive">
                {brlExato(juros)}
              </span>
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-3 text-xs">
              <span className="text-muted-foreground">Abate do saldo</span>
              <span
                className={`tabular-nums font-semibold ${
                  amortizacao > 0 ? "text-success-strong" : "text-destructive"
                }`}
              >
                {brlExato(amortizacao)}
              </span>
            </div>
            {amortizacao <= 0 && (
              <p className="mt-2 text-2xs leading-relaxed text-destructive">
                Este pagamento não cobre nem o juro do mês: o saldo vai subir
                mesmo assim. Registre — e depois confira o saldo real no
                extrato, no campo abaixo.
              </p>
            )}
          </div>
        )}

        <label className="mt-4 block">
          <span className={ROTULO}>Saldo depois deste pagamento (opcional)</span>
          <input
            inputMode="decimal"
            value={saldoApos}
            onChange={(e) => setSaldoApos(e.target.value)}
            placeholder="copie do extrato do credor"
            className={`${CAMPO} tabular-nums`}
          />
        </label>
        <p className="mt-1.5 text-2xs leading-relaxed text-muted-foreground">
          Se você tiver o extrato à mão, este número vale mais que a nossa
          conta: ele já inclui tarifa, IOF e seguro, que a taxa cadastrada não
          conhece.
        </p>

        <label className="mt-4 block">
          <span className={ROTULO}>Observação (opcional)</span>
          <input
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            className={CAMPO}
          />
        </label>

        {erro && (
          <p role="status" className="mt-3 text-2xs text-destructive">
            {erro}
          </p>
        )}

        <div className="mt-6 flex gap-2">
          <BotaoAcao variante="contorno" onClick={aoFechar} className={PAR_BOTOES}>
            Cancelar
          </BotaoAcao>
          <BotaoAcao
            tipo="submit"
            desabilitado={salvando || pago <= 0}
            Icone={salvando ? Loader2 : undefined}
            className={`${PAR_BOTOES} ${salvando ? "motion-safe:[&>svg]:animate-spin" : ""}`}
          >
            {salvando ? "Salvando…" : "Registrar"}
          </BotaoAcao>
        </div>
      </form>
    </Modal>
  );
}

// ──────────────────────────────────────────────────── Detalhe da dívida ─────

/**
 * A tabela de amortização, mês a mês.
 *
 * POR QUE MOSTRAR A TABELA INTEIRA, e não só o resumo: porque é ela que
 * responde à desconfiança. "Você paga R$ 900 e o saldo cai R$ 180" é uma frase
 * que a pessoa não acredita até ver as linhas. Ver as linhas é o que faz o
 * juro deixar de ser um conceito e virar um número que ela reconhece.
 */
export function DetalheDivida({
  r,
  pagamentos,
  aoFechar,
  aoEditar,
  aoMudar,
}: {
  r: RetratoDivida;
  pagamentos: PagamentoDivida[];
  aoFechar: () => void;
  aoEditar: () => void;
  aoMudar: () => void;
}) {
  const { divida: d } = r;
  const [extra, setExtra] = useState(0);
  const [ocupado, setOcupado] = useState(false);

  const comExtra = useMemo(() => amortizarDivida(d, extra), [d, extra]);
  const meus = pagamentos.filter((p) => p.divida_id === d.id);

  async function mudar(status: StatusDivida) {
    setOcupado(true);
    try {
      await mudarStatusDivida(d.id, status);
      aoMudar();
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Modal titulo={d.credor} subtitulo={ROTULO_TIPO[d.tipo]} aoFechar={aoFechar} largura="max-w-lg">
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-muted/60 p-3">
          <p className="text-2xs text-muted-foreground">Saldo devedor</p>
          <p className="font-display text-lg font-semibold tabular-nums text-primary">
            {brlExato(d.saldo_atual)}
          </p>
        </div>
        <div className="rounded-xl bg-muted/60 p-3">
          <p className="text-2xs text-muted-foreground">Juro só do próximo mês</p>
          <p className="font-display text-lg font-semibold tabular-nums text-destructive">
            {brlExato(comExtra.jurosDoPrimeiroMes)}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {comExtra.crescendo ? (
          <>
            Pagando {brlExato(d.parcela)} por mês, esta dívida{" "}
            <strong className="text-destructive">não acaba</strong> — a parcela
            não cobre o juro. Ela só começa a diminuir acima de{" "}
            <strong className="tabular-nums text-foreground">
              {brlExato(comExtra.parcelaParaEstancar)}
            </strong>{" "}
            por mês.
          </>
        ) : comExtra.quitou ? (
          <>
            No ritmo atual você paga{" "}
            <strong className="tabular-nums text-foreground">
              {comExtra.meses} {comExtra.meses === 1 ? "parcela" : "parcelas"}
            </strong>{" "}
            e{" "}
            <strong className="tabular-nums text-destructive">
              {brl(comExtra.jurosTotal)}
            </strong>{" "}
            de juro daqui para a frente. Total de{" "}
            <strong className="tabular-nums">{brl(comExtra.totalPago)}</strong>.
          </>
        ) : (
          "Com os dados de hoje esta dívida não se encerra num prazo razoável. Confira a taxa e o valor da parcela."
        )}
      </p>

      {/* O simulador dentro do detalhe: é aqui que a pessoa já está olhando o
          número que a incomoda, e é o melhor momento para mostrar o que muda
          com R$ 100 a mais. */}
      {!comExtra.crescendo && (
        <div className="mt-4 rounded-xl border border-border p-3">
          <p className={ROTULO}>E se você pagasse um pouco a mais por mês?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[0, 50, 100, 200, 500].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setExtra(v)}
                aria-pressed={extra === v}
                className={`min-h-11 rounded-xl px-3 text-xs font-semibold tabular-nums transition-colors ${
                  extra === v
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {v === 0 ? "Nada" : `+${brl(v)}`}
              </button>
            ))}
          </div>
          {extra > 0 && (
            <p className="mt-2.5 text-2xs leading-relaxed text-foreground">
              {(() => {
                const base = amortizarDivida(d, 0);
                const antes = base.meses - comExtra.meses;
                const economia = base.jurosTotal - comExtra.jurosTotal;
                return antes > 0 || economia > 0 ? (
                  <>
                    Você termina{" "}
                    <strong className="tabular-nums text-success-strong">
                      {antes} {antes === 1 ? "mês" : "meses"}
                    </strong>{" "}
                    antes e deixa de pagar{" "}
                    <strong className="tabular-nums text-success-strong">
                      {brlExato(economia)}
                    </strong>{" "}
                    de juro.
                  </>
                ) : (
                  "Falta pouco: o prazo já é curto demais para esse valor mudar alguma coisa."
                );
              })()}
            </p>
          )}
        </div>
      )}

      {comExtra.linhas.length > 0 && (
        <div className="mt-4">
          <p className={ROTULO}>Mês a mês, para onde vai cada parcela</p>
          {/* Rola dentro da própria caixa: tabela larga nunca pode empurrar a
              página para o lado no celular. */}
          <div className="mt-2 max-h-64 overflow-auto rounded-xl border border-border">
            <table className="w-full text-2xs">
              <thead className="sticky top-0 bg-muted text-muted-foreground">
                <tr>
                  <th className="px-2.5 py-2 text-left font-semibold">#</th>
                  <th className="px-2.5 py-2 text-right font-semibold">Parcela</th>
                  <th className="px-2.5 py-2 text-right font-semibold">Juro</th>
                  <th className="px-2.5 py-2 text-right font-semibold">Abate</th>
                  <th className="px-2.5 py-2 text-right font-semibold">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {comExtra.linhas.map((l) => (
                  <tr key={l.numero}>
                    <td className="px-2.5 py-1.5 tabular-nums text-muted-foreground">
                      {l.numero}
                    </td>
                    <td className="px-2.5 py-1.5 text-right tabular-nums text-foreground">
                      {brlExato(l.parcela)}
                    </td>
                    <td className="px-2.5 py-1.5 text-right tabular-nums text-destructive">
                      {brlExato(l.juros)}
                    </td>
                    <td
                      className={`px-2.5 py-1.5 text-right tabular-nums ${
                        l.amortizacao >= 0 ? "text-success-strong" : "text-destructive"
                      }`}
                    >
                      {brlExato(l.amortizacao)}
                    </td>
                    <td className="px-2.5 py-1.5 text-right tabular-nums text-primary">
                      {brlExato(l.saldoFinal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {meus.length > 0 && (
        <div className="mt-4">
          <p className={ROTULO}>O que você já pagou aqui</p>
          <ul className="mt-2 divide-y divide-border/50">
            {meus.slice(0, 12).map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2">
                <span className="min-w-0 flex-1 truncate text-xs text-foreground">
                  {dataCurta(p.data)}
                  {p.tipo === "extra" && (
                    <span className="ml-2 text-2xs font-semibold text-success-strong">
                      extra
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
                  {brlExato(p.valor)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <BotaoAcao variante="contorno" tamanho="sm" onClick={aoEditar}>
          Editar
        </BotaoAcao>
        {d.status === "ativa" ? (
          <>
            <BotaoAcao
              variante="contorno"
              tamanho="sm"
              desabilitado={ocupado}
              onClick={() => mudar("quitada")}
            >
              Marcar como quitada
            </BotaoAcao>
            <BotaoAcao
              variante="fantasma"
              tamanho="sm"
              desabilitado={ocupado}
              Icone={Trash2}
              onClick={() => mudar("cancelada")}
              rotuloAcessivel={`Arquivar a dívida ${d.credor}`}
            >
              Arquivar
            </BotaoAcao>
          </>
        ) : (
          <BotaoAcao
            variante="contorno"
            tamanho="sm"
            desabilitado={ocupado}
            onClick={() => mudar("ativa")}
          >
            Reabrir
          </BotaoAcao>
        )}
      </div>
      {/* Nunca "excluir": apagar levaria os pagamentos junto (cascade) e com
          eles a prova de que a pessoa pagou. */}
      <p className="mt-2 text-2xs leading-relaxed text-muted-foreground">
        Arquivar não apaga nada: o histórico de pagamentos continua guardado.
      </p>
    </Modal>
  );
}

"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Archive } from "lucide-react";
import { brlExato } from "../pecas";
import {
  arquivarInvestimento,
  atualizarInvestimento,
  atualizarValorAtual,
  descricaoDaTaxa,
  salvarInvestimento,
  ROTULO_CLASSE,
  ROTULO_INDEXADOR,
  ROTULO_LIQUIDEZ,
  type ClasseInvestimento,
  type IndexadorInvestimento,
  type Investimento,
  type LiquidezInvestimento,
} from "@/lib/fincash/investimentos";
import { hojeIso, type Conta } from "@/lib/fincash/modelo";

/**
 * Os formulários da carteira.
 *
 * SÃO DOIS, E NÃO UM SÓ. O cadastro completo tem doze campos e se abre uma vez
 * por aplicação; a atualização de valor tem dois e se abre TODO MÊS. Obrigar a
 * pessoa a atravessar o formulário inteiro para trocar um número é a diferença
 * entre uma carteira que fica atualizada e uma que envelhece calada — e valor
 * velho é o defeito que faz a tela inteira mentir.
 */

/* Vírgula é como o brasileiro digita. Aceitar só ponto faria "1.500,00" virar
   1,5 em silêncio — o mesmo cuidado que a tela de Contas já toma. */
const numero = (v: string) =>
  Number(v.replace(/\s/g, "").replace(/\./g, "").replace(",", ".")) || 0;

const paraCampo = (v: number) =>
  v ? v.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "";

const CLASSES = Object.entries(ROTULO_CLASSE) as [ClasseInvestimento, string][];
const LIQUIDEZ = Object.entries(ROTULO_LIQUIDEZ) as [
  LiquidezInvestimento,
  string,
][];
const INDEXADORES = Object.entries(ROTULO_INDEXADOR) as [
  IndexadorInvestimento,
  string,
][];

/** Como o campo de taxa se chama depende do indexador — é assim que o mercado
    fala, e um rótulo genérico ("taxa") faria alguém digitar 110 onde o app
    espera 11,5. */
function rotuloDaTaxa(ix: IndexadorInvestimento | ""): {
  titulo: string;
  dica: string;
  exemplo: string;
} | null {
  if (ix === "cdi" || ix === "selic") {
    const nome = ROTULO_INDEXADOR[ix];
    return {
      titulo: `Percentual do ${nome}`,
      dica: `110 significa 110% do ${nome}.`,
      exemplo: "110",
    };
  }
  if (ix === "ipca") {
    return {
      titulo: "Juro acima do IPCA",
      dica: "6 significa IPCA + 6% ao ano.",
      exemplo: "6",
    };
  }
  if (ix === "prefixado") {
    return {
      titulo: "Taxa ao ano",
      dica: "11,5 significa 11,5% ao ano, fixos.",
      exemplo: "11,5",
    };
  }
  return null;
}

const CAMPO =
  "mt-1 w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent";
const ROTULO = "text-xs font-medium text-muted-foreground";

/** Casca comum dos dois modais: mesmo escurecimento, mesma saída pelo Escape,
    e no celular ele sobe da base — onde o polegar está. */
function Modal({
  titulo,
  id,
  aoFechar,
  children,
}: {
  titulo: string;
  id: string;
  aoFechar: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const sair = (e: KeyboardEvent) => e.key === "Escape" && aoFechar();
    window.addEventListener("keydown", sair);
    return () => window.removeEventListener("keydown", sair);
  }, [aoFechar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-primary/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={aoFechar}
      role="dialog"
      aria-modal="true"
      aria-labelledby={id}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="my-auto w-full max-w-lg rounded-3xl bg-white p-6 shadow-[var(--fin-sombra-flutua)] sm:p-7"
      >
        <h2
          id={id}
          className="font-display text-lg font-semibold text-primary"
        >
          {titulo}
        </h2>
        {children}
      </div>
    </div>
  );
}

/**
 * Cadastrar ou editar uma posição.
 *
 * O QUE ESTE FORMULÁRIO SE RECUSA A PEDIR: cotação, quantidade e preço médio.
 * A carteira guarda POSIÇÃO, não operação — dois números respondem o que a
 * pessoa quer saber, e pedir os outros dez transformaria o cadastro num
 * trabalho que ninguém faz duas vezes.
 */
export function FormularioInvestimento({
  inicial,
  contas,
  aoFechar,
  aoSalvar,
}: {
  inicial?: Investimento;
  contas: Conta[];
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const editando = Boolean(inicial);

  const [nome, setNome] = useState(inicial?.nome ?? "");
  const [instituicao, setInstituicao] = useState(inicial?.instituicao ?? "");
  const [classe, setClasse] = useState<ClasseInvestimento>(
    inicial?.classe ?? "renda_fixa",
  );
  const [indexador, setIndexador] = useState<IndexadorInvestimento | "">(
    inicial?.indexador ?? "",
  );
  const [taxa, setTaxa] = useState(
    inicial?.taxa !== null && inicial?.taxa !== undefined
      ? String(inicial.taxa).replace(".", ",")
      : "",
  );
  const [aplicado, setAplicado] = useState(
    inicial ? paraCampo(inicial.valor_aplicado) : "",
  );
  const [atual, setAtual] = useState(inicial ? paraCampo(inicial.valor_atual) : "");
  const [dataAplicacao, setDataAplicacao] = useState(
    inicial?.data_aplicacao ?? hojeIso(),
  );
  const [dataAtualizacao, setDataAtualizacao] = useState(
    inicial?.data_atualizacao ?? hojeIso(),
  );
  const [vencimento, setVencimento] = useState(inicial?.vencimento ?? "");
  const [liquidez, setLiquidez] = useState<LiquidezInvestimento>(
    inicial?.liquidez ?? "diaria",
  );
  const [contaId, setContaId] = useState(inicial?.conta_id ?? "");
  const [observacao, setObservacao] = useState(inicial?.observacao ?? "");

  const [salvando, setSalvando] = useState(false);
  const [confirmandoArquivo, setConfirmandoArquivo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const taxaInfo = rotuloDaTaxa(indexador);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !instituicao.trim()) return;

    setSalvando(true);
    setErro(null);

    const valorAplicado = numero(aplicado);
    const campos = {
      nome: nome.trim(),
      instituicao: instituicao.trim(),
      classe,
      indexador: indexador === "" ? null : indexador,
      taxa: indexador === "" || taxa.trim() === "" ? null : numero(taxa),
      valor_aplicado: valorAplicado,
      /* Aplicação recém-cadastrada normalmente ainda vale o que custou. Deixar
         o campo vazio virar zero apagaria a posição inteira do patrimônio — e
         a pessoa levaria semanas para perceber que faltava dinheiro na conta. */
      valor_atual: atual.trim() === "" ? valorAplicado : numero(atual),
      data_aplicacao: dataAplicacao,
      data_atualizacao: dataAtualizacao,
      vencimento: vencimento === "" ? null : vencimento,
      liquidez,
      conta_id: contaId === "" ? null : contaId,
      observacao: observacao.trim() === "" ? null : observacao.trim(),
    };

    try {
      if (inicial) await atualizarInvestimento(inicial.id, campos);
      else await salvarInvestimento(campos);
      aoSalvar();
    } catch (err) {
      setErro((err as Error).message);
      setSalvando(false);
    }
  }

  async function arquivar() {
    if (!inicial) return;
    setSalvando(true);
    try {
      await arquivarInvestimento(inicial.id);
      aoSalvar();
    } catch (err) {
      setErro((err as Error).message);
      setSalvando(false);
    }
  }

  return (
    <Modal
      id="titulo-investimento"
      titulo={editando ? "Editar posição" : "Nova posição"}
      aoFechar={aoFechar}
    >
      <form onSubmit={enviar}>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={ROTULO}>O que é</span>
            <input
              autoFocus
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="CDB 2027, Tesouro Selic, PETR4…"
              className={CAMPO}
            />
          </label>

          <label className="block">
            <span className={ROTULO}>Onde está</span>
            <input
              value={instituicao}
              onChange={(e) => setInstituicao(e.target.value)}
              placeholder="Nubank, XP, Itaú…"
              className={CAMPO}
            />
          </label>

          <label className="block">
            <span className={ROTULO}>Classe</span>
            <select
              value={classe}
              onChange={(e) => setClasse(e.target.value as ClasseInvestimento)}
              className={CAMPO}
            >
              {CLASSES.map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={ROTULO}>Quanto você aplicou</span>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                R$
              </span>
              <input
                inputMode="decimal"
                value={aplicado}
                onChange={(e) => setAplicado(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-xl border border-border py-2.5 pl-10 pr-3.5 text-sm tabular-nums outline-none transition-colors focus:border-accent"
              />
            </div>
          </label>

          <label className="block">
            <span className={ROTULO}>Quanto vale hoje</span>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                R$
              </span>
              <input
                inputMode="decimal"
                value={atual}
                onChange={(e) => setAtual(e.target.value)}
                placeholder="igual ao aplicado"
                className="w-full rounded-xl border border-border py-2.5 pl-10 pr-3.5 text-sm tabular-nums outline-none transition-colors focus:border-accent"
              />
            </div>
            <span className="mt-1 block text-2xs leading-relaxed text-muted-foreground">
              O que aparece no extrato. Em branco, o app assume que ainda vale o
              que você aplicou.
            </span>
          </label>

          <label className="block">
            <span className={ROTULO}>Indexador</span>
            <select
              value={indexador}
              onChange={(e) =>
                setIndexador(e.target.value as IndexadorInvestimento | "")
              }
              className={CAMPO}
            >
              <option value="">Não indexado (ação, fundo, cripto)</option>
              {INDEXADORES.map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </select>
          </label>

          {taxaInfo && (
            <label className="block">
              <span className={ROTULO}>{taxaInfo.titulo}</span>
              <input
                inputMode="decimal"
                value={taxa}
                onChange={(e) => setTaxa(e.target.value)}
                placeholder={taxaInfo.exemplo}
                className={CAMPO}
              />
              <span className="mt-1 block text-2xs leading-relaxed text-muted-foreground">
                {taxaInfo.dica}
              </span>
            </label>
          )}

          <label className="block">
            <span className={ROTULO}>Aplicado em</span>
            <input
              type="date"
              value={dataAplicacao}
              onChange={(e) => setDataAplicacao(e.target.value)}
              className={CAMPO}
            />
          </label>

          <label className="block">
            <span className={ROTULO}>Valor conferido em</span>
            <input
              type="date"
              value={dataAtualizacao}
              onChange={(e) => setDataAtualizacao(e.target.value)}
              className={CAMPO}
            />
            <span className="mt-1 block text-2xs leading-relaxed text-muted-foreground">
              A data do extrato de onde saiu o valor de hoje. É ela que diz se o
              rendimento é de três meses ou de três anos.
            </span>
          </label>

          <label className="block">
            <span className={ROTULO}>Liquidez</span>
            <select
              value={liquidez}
              onChange={(e) =>
                setLiquidez(e.target.value as LiquidezInvestimento)
              }
              className={CAMPO}
            >
              {LIQUIDEZ.map(([valor, rotulo]) => (
                <option key={valor} value={valor}>
                  {rotulo}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-2xs leading-relaxed text-muted-foreground">
              Só o que tem liquidez diária conta como reserva de emergência.
            </span>
          </label>

          <label className="block">
            <span className={ROTULO}>Vencimento (opcional)</span>
            <input
              type="date"
              value={vencimento}
              onChange={(e) => setVencimento(e.target.value)}
              className={CAMPO}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className={ROTULO}>Fica dentro de qual conta (opcional)</span>
            <select
              value={contaId}
              onChange={(e) => setContaId(e.target.value)}
              className={CAMPO}
            >
              <option value="">Nenhuma / não sei</option>
              {contas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-2xs leading-relaxed text-muted-foreground">
              Se este dinheiro já aparece no saldo de uma conta cadastrada,
              aponte-a aqui: o app desconta o saldo dela para não somar o mesmo
              dinheiro duas vezes no patrimônio.
            </span>
          </label>

          <label className="block sm:col-span-2">
            <span className={ROTULO}>Observação (opcional)</span>
            <input
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Carência até junho, resgate programado…"
              className={CAMPO}
            />
          </label>
        </div>

        {erro && (
          <p role="status" className="mt-3 text-2xs text-destructive">
            {erro}
          </p>
        )}

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={aoFechar}
            className="min-h-12 flex-1 rounded-xl border border-border px-4 text-sm font-semibold text-primary transition-colors hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando || !nome.trim() || !instituicao.trim()}
            className="min-h-12 flex-1 rounded-xl bg-accent-btn px-4 text-sm font-bold text-white shadow-[var(--fin-sombra-card)] transition-all hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
          >
            {salvando ? "Salvando…" : "Salvar"}
          </button>
        </div>

        {/* Resgatar é ARQUIVAR, nunca apagar: apagar levaria junto a resposta
            para "quanto eu já tive investido". A confirmação é em dois toques,
            e não um `confirm()` do navegador — diálogo do sistema no meio de um
            modal é o clique que a pessoa dá sem ler. */}
        {editando && (
          <div className="mt-5 border-t border-border/60 pt-4">
            {confirmandoArquivo ? (
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 flex-1 text-2xs leading-relaxed text-muted-foreground">
                  Some da carteira e do patrimônio, mas continua no histórico de
                  resgatados.
                </p>
                <button
                  type="button"
                  onClick={() => setConfirmandoArquivo(false)}
                  className="min-h-11 rounded-xl border border-border px-3 text-2xs font-semibold text-primary"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={arquivar}
                  disabled={salvando}
                  className="min-h-11 rounded-xl bg-destructive px-3 text-2xs font-bold text-white disabled:opacity-50"
                >
                  Confirmar resgate
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmandoArquivo(true)}
                className="flex min-h-11 items-center gap-2 text-2xs font-semibold text-muted-foreground transition-colors hover:text-destructive"
              >
                <Archive className="h-3.5 w-3.5" />
                Resgatei este investimento
              </button>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}

/**
 * Atualizar quanto vale hoje — o gesto que a pessoa repete todo mês.
 *
 * A DATA VEM JUNTO e é editável: quem confere o extrato do dia 30 no dia 5 do
 * mês seguinte precisa poder dizer isso, senão o app calcula o rendimento sobre
 * um período que nunca existiu.
 *
 * O PREVIEW existe porque o número sozinho não diz nada. Ver "+R$ 812 desde a
 * aplicação" enquanto digita é o que faz alguém perceber que trocou o valor
 * pelo do mês passado, ou digitou 5.000 no lugar de 50.000 — o erro que passa
 * despercebido quando a confirmação só aparece depois de salvar.
 */
export function ModalValorAtual({
  inv,
  aoFechar,
  aoSalvar,
}: {
  inv: Investimento;
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const [valor, setValor] = useState(paraCampo(inv.valor_atual));
  const [data, setData] = useState(hojeIso());
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const novo = numero(valor);
  const ganho = novo - inv.valor_aplicado;
  const variacao = novo - inv.valor_atual;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      await atualizarValorAtual(inv.id, novo, data);
      aoSalvar();
    } catch (err) {
      setErro((err as Error).message);
      setSalvando(false);
    }
  }

  return (
    <Modal id="titulo-valor" titulo="Atualizar valor" aoFechar={aoFechar}>
      <form onSubmit={enviar}>
        <p className="mt-1 text-xs text-muted-foreground">
          {inv.nome} · {inv.instituicao}
          {descricaoDaTaxa(inv) !== "—" && <> · {descricaoDaTaxa(inv)}</>}
        </p>

        <dl className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-muted p-4 text-xs">
          <div>
            <dt className="text-muted-foreground">Você aplicou</dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
              {brlExato(inv.valor_aplicado)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Valor anterior</dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-foreground">
              {brlExato(inv.valor_atual)}
            </dd>
          </div>
        </dl>

        <label className="mt-4 block">
          <span className={ROTULO}>Quanto está aparecendo no extrato</span>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
              R$
            </span>
            <input
              autoFocus
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              className="w-full rounded-xl border border-border py-3 pl-10 pr-3.5 text-base tabular-nums outline-none transition-colors focus:border-accent"
            />
          </div>
        </label>

        <label className="mt-4 block">
          <span className={ROTULO}>Data do extrato</span>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className={CAMPO}
          />
        </label>

        {novo > 0 && (
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Com esse valor, a posição acumula{" "}
            <strong
              className={`font-semibold tabular-nums ${
                ganho >= 0 ? "text-success-strong" : "text-destructive"
              }`}
            >
              {ganho >= 0 ? "+" : "−"}
              {brlExato(Math.abs(ganho))}
            </strong>{" "}
            desde a aplicação
            {variacao !== 0 && (
              <>
                {" "}
                — {variacao > 0 ? "subiu" : "caiu"}{" "}
                {brlExato(Math.abs(variacao))} em relação ao valor anterior
              </>
            )}
            .
          </p>
        )}

        {/* Uma queda grande costuma ser dedo errado, não mercado. O aviso é
            texto, não cor: quem não enxerga vermelho também digita errado. */}
        {novo > 0 && inv.valor_atual > 0 && novo < inv.valor_atual * 0.5 && (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-accent-tint p-3 text-2xs leading-relaxed text-accent-strong">
            <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
            <span>
              Confira: o novo valor é menos da metade do anterior. Se você
              resgatou parte do dinheiro, tudo bem — se foi engano, corrija antes
              de salvar.
            </span>
          </p>
        )}

        {erro && (
          <p role="status" className="mt-3 text-2xs text-destructive">
            {erro}
          </p>
        )}

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={aoFechar}
            className="min-h-12 flex-1 rounded-xl border border-border px-4 text-sm font-semibold text-primary transition-colors hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="min-h-12 flex-1 rounded-xl bg-accent-btn px-4 text-sm font-bold text-white shadow-[var(--fin-sombra-card)] transition-all hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50"
          >
            {salvando ? "Salvando…" : "Salvar valor"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Briefcase,
  Car,
  GraduationCap,
  Heart,
  Home,
  Landmark,
  Loader2,
  PiggyBank,
  Plane,
  Shield,
  Sparkles,
  Target,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import {
  BarrasMes,
  BotaoAcao,
  brl,
  brlExato,
  DiscoIcone,
  Pastilha,
  type PontoMes,
} from "../pecas";
import {
  apagarAporte,
  aportesPorMes,
  atualizarMeta,
  mudarStatusMeta,
  ROTULO_PRIORIDADE,
  salvarAporte,
  salvarMeta,
  type Aporte,
  type Meta,
  type PrioridadeMeta,
  type ProgressoMeta,
  type StatusMeta,
  type TipoAporte,
} from "@/lib/fincash/metas";
import { hojeIso, mesVizinho, refDoMes, type Conta } from "@/lib/fincash/modelo";
import type { Investimento } from "@/lib/fincash/investimentos";

/**
 * As peças que só a tela de Metas usa.
 *
 * Moram aqui, e não em `pecas.tsx`, porque `pecas.tsx` é o vocabulário comum do
 * FINCASH inteiro — anel, medidor, faixa de grupo. Um seletor de ícone de
 * meta ali dentro seria peça de uma tela só ocupando o arquivo que todas as
 * outras importam.
 */

// ───────────────────────────────────────────────── Catálogo de aparência ────

/**
 * Os ícones que uma meta pode ter.
 *
 * LISTA FECHADA, e não `lucide-react` resolvido pelo nome vindo do banco:
 * importação dinâmica por nome arrastaria o pacote inteiro para o bundle desta
 * tela — e o FINCASH é aberto no celular, no 4G, todo dia. Onze desenhos
 * cobrem o que as pessoas de fato guardam dinheiro para fazer, e o `nome`
 * gravado é o nome lucide de verdade: ampliar o catálogo depois não quebra as
 * metas já cadastradas.
 */
export const ICONES: { nome: string; Icone: LucideIcon; rotulo: string }[] = [
  { nome: "target", Icone: Target, rotulo: "Objetivo" },
  { nome: "home", Icone: Home, rotulo: "Casa" },
  { nome: "plane", Icone: Plane, rotulo: "Viagem" },
  { nome: "car", Icone: Car, rotulo: "Carro" },
  { nome: "graduation-cap", Icone: GraduationCap, rotulo: "Estudo" },
  { nome: "shield", Icone: Shield, rotulo: "Reserva" },
  { nome: "heart", Icone: Heart, rotulo: "Família" },
  { nome: "briefcase", Icone: Briefcase, rotulo: "Negócio" },
  { nome: "piggy-bank", Icone: PiggyBank, rotulo: "Poupar" },
  { nome: "landmark", Icone: Landmark, rotulo: "Aposentadoria" },
  { nome: "sparkles", Icone: Sparkles, rotulo: "Sonho" },
];

/** Ícone desconhecido (ou nulo) cai no alvo genérico em vez de sumir: card sem
    ícone quebraria o alinhamento da grade inteira. */
export const iconeDaMeta = (nome: string | null): LucideIcon =>
  ICONES.find((i) => i.nome === nome)?.Icone ?? Target;

/* A mesma paleta da tela de Contas: meta e conta da mesma família podem ter a
   mesma tinta, e duas paletas diferentes no mesmo app é como a tela passa a
   parecer montada por duas pessoas. */
export const CORES = [
  "#e8703a",
  "#1e3a5f",
  "#0891b2",
  "#16a34a",
  "#7c3aed",
  "#db2777",
  "#f59e0b",
  "#dc2626",
];

/** "2026-03-15" → "15/03/2026". Fatiado à mão porque `new Date(iso)` é lido
    como UTC e volta um dia antes no Brasil — o mesmo cuidado do `modelo.ts`. */
export const dataCurta = (iso: string) => {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("pt-BR");
};

/** "2027-12" → "dez/2027" — cabe no card, onde "dezembro de 2027" não cabe. */
export const mesAno = (ref: string) => {
  const [ano, mes] = ref.split("-").map(Number);
  return `${new Date(ano, mes - 1, 1)
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "")}/${ano}`;
};

const PRIORIDADES: PrioridadeMeta[] = ["alta", "media", "baixa"];

/** Alta é laranja (ação), média é navy claro, baixa é cinza. A palavra vai
    junto sempre: prioridade dita só por cor não existe para quem não enxerga
    cor — e é a prioridade que ordena a tela inteira. */
export const tomDaPrioridade = (p: PrioridadeMeta) =>
  p === "alta" ? "saida" : p === "media" ? "fixa" : "neutro";

export const ROTULO_STATUS: Record<StatusMeta, string> = {
  ativa: "ativa",
  pausada: "pausada",
  concluida: "concluída",
  cancelada: "cancelada",
};

// ──────────────────────────────────────────────────────── Modal da casa ─────

/**
 * A moldura dos formulários desta tela.
 *
 * Sobe do rodapé no celular (`items-end`) e centraliza no computador: caixa
 * centralizada no celular põe o campo debaixo do teclado, e a pessoa digita
 * sem ver o que digitou.
 */
export function Modal({
  titulo,
  subtitulo,
  aoFechar,
  children,
  largura = "max-w-md",
}: {
  titulo: string;
  subtitulo?: string;
  aoFechar: () => void;
  children: React.ReactNode;
  largura?: string;
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
      aria-label={titulo}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`my-auto w-full ${largura} rounded-3xl bg-white p-6 shadow-[var(--fin-sombra-flutua)] sm:p-7`}
      >
        <h2 className="font-display text-lg font-semibold text-primary">{titulo}</h2>
        {subtitulo && (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {subtitulo}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}

const CAMPO =
  "mt-1 w-full rounded-xl border border-border px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent";

/* Os dois botões do rodapé de formulário são o `BotaoAcao` da casa, e não uma
   receita local: a cópia daqui já tinha nascido com 40px de altura e a sombra
   laranja escrita à mão — duas divergências do original que ninguém percebe
   até ver as duas telas lado a lado. `flex-1` é o que sobrou de particular:
   num modal os dois dividem a largura. */
const PAR_BOTOES = "flex-1";

const numero = (texto: string) =>
  Number(texto.replace(/\./g, "").replace(",", ".")) || 0;

// ──────────────────────────────────────────────────── Formulário de meta ────

/**
 * Cadastrar e editar a meta.
 *
 * O PRAZO É UM INTERRUPTOR, e não um campo que se deixa em branco por preguiça.
 * Ficar sem data é uma decisão com consequência — sem ela o app não sabe dizer
 * quanto separar por mês —, e campo vazio não comunica consequência nenhuma. O
 * interruptor obriga a escolher, e o texto ao lado diz o que se perde.
 */
export function FormularioMeta({
  meta,
  contas,
  investimentos,
  aoFechar,
  aoSalvar,
}: {
  /** Preenchido = edição. */
  meta?: Meta;
  contas: Conta[];
  investimentos: Investimento[];
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const [nome, setNome] = useState(meta?.nome ?? "");
  const [alvo, setAlvo] = useState(
    meta ? String(meta.valor_alvo).replace(".", ",") : "",
  );
  const [inicial, setInicial] = useState(
    meta && meta.valor_inicial > 0
      ? String(meta.valor_inicial).replace(".", ",")
      : "",
  );
  const [temPrazo, setTemPrazo] = useState(meta ? meta.prazo !== null : true);
  const [prazo, setPrazo] = useState(meta?.prazo ?? "");
  const [prioridade, setPrioridade] = useState<PrioridadeMeta>(
    meta?.prioridade ?? "media",
  );
  const [cor, setCor] = useState(meta?.cor ?? CORES[0]);
  const [icone, setIcone] = useState(meta?.icone ?? "target");
  /* Um seletor só para conta e investimento, com prefixo no valor. São duas
     colunas no banco, mas uma pergunta só para quem usa ("onde esse dinheiro
     está?") — e dois selects lado a lado convidam a preencher os dois, que é
     como a mesma meta passa a apontar para dois lugares. */
  const [onde, setOnde] = useState(
    meta?.investimento_id
      ? `inv:${meta.investimento_id}`
      : meta?.conta_id
        ? `conta:${meta.conta_id}`
        : "",
  );
  const [observacao, setObservacao] = useState(meta?.observacao ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const valorAlvo = numero(alvo);
  const podeSalvar =
    nome.trim().length > 0 && valorAlvo > 0 && (!temPrazo || prazo !== "");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!podeSalvar) return;

    setSalvando(true);
    setErro(null);
    const campos = {
      nome: nome.trim(),
      valor_alvo: valorAlvo,
      valor_inicial: numero(inicial),
      prazo: temPrazo ? prazo : null,
      prioridade,
      conta_id: onde.startsWith("conta:") ? onde.slice(6) : null,
      investimento_id: onde.startsWith("inv:") ? onde.slice(4) : null,
      cor,
      icone,
      observacao: observacao.trim() || null,
    };

    try {
      if (meta) await atualizarMeta(meta.id, campos);
      else await salvarMeta(campos);
      aoSalvar();
    } catch (err) {
      setErro((err as Error).message);
      setSalvando(false);
    }
  }

  return (
    <Modal
      titulo={meta ? "Editar meta" : "Nova meta"}
      subtitulo="O valor e o prazo são o que fazem a conta existir: é deles que sai o quanto separar por mês."
      aoFechar={aoFechar}
      largura="max-w-lg"
    >
      <form onSubmit={enviar}>
        <label className="mt-5 block">
          <span className="text-xs font-medium text-muted-foreground">
            O que você quer
          </span>
          <input
            autoFocus
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={80}
            placeholder="Entrada do apartamento, viagem ao Chile…"
            className={CAMPO}
          />
        </label>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">
              Quanto custa
            </span>
            <input
              inputMode="decimal"
              value={alvo}
              onChange={(e) => setAlvo(e.target.value)}
              placeholder="0,00"
              className={`${CAMPO} tabular-nums`}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">
              Já tenho guardado
            </span>
            <input
              inputMode="decimal"
              value={inicial}
              onChange={(e) => setInicial(e.target.value)}
              placeholder="0,00"
              className={`${CAMPO} tabular-nums`}
            />
          </label>
        </div>
        <p className="mt-1.5 text-2xs leading-relaxed text-muted-foreground">
          O que já havia no dia em que você cadastrou a meta. Sem isso, quem já
          juntou metade veria 0% de progresso — e teria razão em desconfiar do
          resto dos números.
        </p>

        {/* O prazo, e o que se perde sem ele. */}
        <div className="mt-4 rounded-xl border border-border p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-muted-foreground">
              Para quando
            </span>
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
              {temPrazo ? "Tem data" : "Sem data"}
            </button>
          </div>

          {temPrazo ? (
            <input
              type="date"
              value={prazo}
              min={hojeIso()}
              onChange={(e) => setPrazo(e.target.value)}
              aria-label="Data limite da meta"
              className={`${CAMPO} tabular-nums`}
            />
          ) : (
            <p className="mt-2 text-2xs leading-relaxed text-accent-strong">
              Sem data eu não consigo dizer quanto separar por mês — e é esse
              número que faz a meta acontecer. Sem ele isto vira um desejo. Só a
              reserva de emergência merece ficar assim.
            </p>
          )}
        </div>

        <fieldset className="mt-4">
          <legend className="text-xs font-medium text-muted-foreground">
            Prioridade
          </legend>
          <div className="mt-1 grid grid-cols-3 gap-1 rounded-xl bg-gelo p-1">
            {PRIORIDADES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPrioridade(p)}
                aria-pressed={prioridade === p}
                className={`min-h-11 rounded-lg py-2 text-sm font-semibold transition-all ${
                  prioridade === p
                    ? "bg-white text-primary shadow-[var(--fin-sombra-card)]"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {ROTULO_PRIORIDADE[p]}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-2xs leading-relaxed text-muted-foreground">
            É ela que decide a ordem da tela — e qual meta esperar, quando não
            couberem todas no mesmo mês.
          </p>
        </fieldset>

        <label className="mt-4 block">
          <span className="text-xs font-medium text-muted-foreground">
            Onde esse dinheiro fica
          </span>
          <select
            value={onde}
            onChange={(e) => setOnde(e.target.value)}
            className={`${CAMPO} bg-white`}
          >
            <option value="">Ainda não decidi</option>
            {contas.length > 0 && (
              <optgroup label="Contas">
                {contas.map((c) => (
                  <option key={c.id} value={`conta:${c.id}`}>
                    {c.nome}
                  </option>
                ))}
              </optgroup>
            )}
            {investimentos.length > 0 && (
              <optgroup label="Investimentos">
                {investimentos.map((i) => (
                  <option key={i.id} value={`inv:${i.id}`}>
                    {i.nome} · {i.instituicao}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>
        <p className="mt-1.5 text-2xs leading-relaxed text-muted-foreground">
          É só uma pista de onde procurar o dinheiro. O progresso continua vindo
          dos aportes que você registrar, nunca do saldo da conta.
        </p>

        <fieldset className="mt-4">
          <legend className="text-xs font-medium text-muted-foreground">Cor</legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {CORES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCor(c)}
                aria-label={`Usar a cor ${c}`}
                aria-pressed={cor === c}
                className={`h-11 w-11 rounded-xl transition-transform ${
                  cor === c ? "scale-110 ring-2 ring-primary ring-offset-2" : ""
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-4">
          <legend className="text-xs font-medium text-muted-foreground">Ícone</legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {ICONES.map(({ nome: n, Icone, rotulo }) => (
              <button
                key={n}
                type="button"
                onClick={() => setIcone(n)}
                aria-label={rotulo}
                aria-pressed={icone === n}
                title={rotulo}
                className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${
                  icone === n
                    ? "border-primary bg-primary text-white"
                    : "border-border text-muted-foreground hover:border-accent hover:text-accent-strong"
                }`}
              >
                <Icone className="h-4 w-4" strokeWidth={2} />
              </button>
            ))}
          </div>
        </fieldset>

        <label className="mt-4 block">
          <span className="text-xs font-medium text-muted-foreground">
            Observação (opcional)
          </span>
          <input
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="O porquê dela — é o que faz não desistir no quinto mês"
            className={CAMPO}
          />
        </label>

        {erro && (
          <p role="status" className="mt-3 text-2xs text-destructive">
            {erro}
          </p>
        )}

        <div className="mt-6 flex gap-2">
          <BotaoAcao
            variante="contorno"
            onClick={aoFechar}
            className={PAR_BOTOES}
          >
            Cancelar
          </BotaoAcao>
          <BotaoAcao
            tipo="submit"
            desabilitado={salvando || !podeSalvar}
            Icone={salvando ? Loader2 : undefined}
            className={`${PAR_BOTOES} ${salvando ? "motion-safe:[&>svg]:animate-spin" : ""}`}
          >
            {salvando ? "Salvando…" : meta ? "Salvar" : "Criar meta"}
          </BotaoAcao>
        </div>
      </form>
    </Modal>
  );
}

// ────────────────────────────────────────────────── Formulário de aporte ────

/**
 * Guardar e tirar.
 *
 * O RESGATE FICA NA MESMA CAIXA, e não escondido num menu: a vida acontece, a
 * pessoa tira R$ 2.000 da viagem para o dentista, e o app que dificulta
 * registrar isso passa a afirmar um dinheiro que já foi gasto. É assim que se
 * perde a confiança no número — e, com ela, o app.
 */
export function FormularioAporte({
  meta,
  aoFechar,
  aoSalvar,
}: {
  meta: Meta;
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const [tipo, setTipo] = useState<TipoAporte>("aporte");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(hojeIso());
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const n = numero(valor);
    if (n <= 0) return;

    setSalvando(true);
    setErro(null);
    try {
      await salvarAporte({
        meta_id: meta.id,
        tipo,
        // Sempre positivo: o sentido vem de `tipo`. É a regra do sinal da casa,
        // e vale aqui exatamente como vale no lançamento.
        valor: n,
        data,
        /* Vazio de propósito: esta caixa registra o movimento NA META. O
           vínculo com um lançamento só existe quando a transferência também
           foi lançada no fluxo de caixa, e essa costura ainda não existe no
           app — inventar um id aqui faria a projeção descontar o mesmo
           dinheiro duas vezes. */
        lancamento_id: null,
        observacao: observacao.trim() || null,
      });
      aoSalvar();
    } catch (err) {
      setErro((err as Error).message);
      setSalvando(false);
    }
  }

  return (
    <Modal
      titulo={meta.nome}
      subtitulo="Registrar aqui não mexe no saldo das suas contas. Se o dinheiro saiu da conta de verdade, lance a transferência também em Lançamentos."
      aoFechar={aoFechar}
    >
      <form onSubmit={enviar}>
        <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-gelo p-1">
          {(["aporte", "resgate"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              aria-pressed={tipo === t}
              className={`min-h-11 rounded-lg py-2 text-sm font-semibold transition-all ${
                tipo === t
                  ? "bg-white text-primary shadow-[var(--fin-sombra-card)]"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              {t === "aporte" ? "Guardei" : "Tirei"}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Quanto</span>
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
            <span className="text-xs font-medium text-muted-foreground">Quando</span>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className={`${CAMPO} tabular-nums`}
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="text-xs font-medium text-muted-foreground">
            Observação (opcional)
          </span>
          <input
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder={tipo === "aporte" ? "13º, venda do sofá…" : "Dentista"}
            className={CAMPO}
          />
        </label>

        {erro && (
          <p role="status" className="mt-3 text-2xs text-destructive">
            {erro}
          </p>
        )}

        <div className="mt-6 flex gap-2">
          <BotaoAcao
            variante="contorno"
            onClick={aoFechar}
            className={PAR_BOTOES}
          >
            Cancelar
          </BotaoAcao>
          <BotaoAcao
            tipo="submit"
            desabilitado={salvando || numero(valor) <= 0}
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

// ──────────────────────────────────────────────── Detalhe de uma meta ───────

/**
 * A história da meta e o que fazer com ela.
 *
 * O HISTÓRICO É A PROVA. A barra diz onde a pessoa está; a lista de aportes diz
 * que ela chegou lá guardando — e é a segunda que faz continuar. Por isso o
 * resgate aparece com a mesma clareza do aporte: esconder o que saiu deixaria a
 * lista bonita e o total inexplicável.
 *
 * O STATUS MUDA AQUI, e não no card: pausar e cancelar são decisões, e decisão
 * atrás de um botão pequeno no meio de uma grade é decisão tomada por engano.
 */
export function DetalheMeta({
  p,
  aportes,
  contas,
  investimentos,
  aoFechar,
  aoMudar,
  aoEditar,
  aoAportar,
}: {
  p: ProgressoMeta;
  /** Só os desta meta — quem chama já filtrou. */
  aportes: Aporte[];
  contas: Conta[];
  investimentos: Investimento[];
  aoFechar: () => void;
  aoMudar: () => void;
  aoEditar: () => void;
  aoAportar: () => void;
}) {
  const [ocupado, setOcupado] = useState(false);
  const { meta } = p;

  const porMes = aportesPorMes(aportes);
  /* Seis meses até o corrente. O teto de cada coluna é o plano de hoje, mas
     acompanha o realizado quando ele passa do plano: a peça pinta de vermelho o
     que estoura o planejado, e vermelho para quem guardou A MAIS seria um
     alarme mentiroso. Assim a leitura fica sendo uma só — encheu o plano
     daquele mês, ou não encheu. */
  const meses: PontoMes[] = Array.from({ length: 6 }, (_, i) => {
    const ref = mesVizinho(refDoMes(), i - 5);
    // Mês em que se resgatou mais do que se guardou não desenha coluna
    // negativa; o movimento aparece inteiro na lista logo abaixo.
    const realizado = Math.max(0, porMes[ref] ?? 0);
    return { ref, realizado, planejado: Math.max(p.aporteNecessario ?? 0, realizado) };
  });

  const conta = contas.find((c) => c.id === meta.conta_id);
  const investimento = investimentos.find((i) => i.id === meta.investimento_id);

  async function mudar(status: StatusMeta, confirmar?: string) {
    if (confirmar && !window.confirm(confirmar)) return;
    setOcupado(true);
    await mudarStatusMeta(meta.id, status);
    aoMudar();
    setOcupado(false);
  }

  async function remover(a: Aporte) {
    const pergunta =
      a.tipo === "aporte"
        ? `Apagar o aporte de ${brlExato(a.valor)} de ${dataCurta(a.data)}? O progresso da meta cai na hora.`
        : `Apagar o resgate de ${brlExato(a.valor)} de ${dataCurta(a.data)}? O progresso da meta sobe na hora.`;
    if (!window.confirm(pergunta)) return;
    setOcupado(true);
    await apagarAporte(a.id);
    aoMudar();
    setOcupado(false);
  }

  const Icone = iconeDaMeta(meta.icone);

  return (
    <Modal titulo={meta.nome} aoFechar={aoFechar} largura="max-w-lg">
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <DiscoIcone Icone={Icone} cor={meta.cor} tamanho="sm" />
        <Pastilha tom={tomDaPrioridade(meta.prioridade)}>
          prioridade {ROTULO_PRIORIDADE[meta.prioridade].toLowerCase()}
        </Pastilha>
        <Pastilha tom={meta.status === "concluida" ? "pago" : "neutro"}>
          {ROTULO_STATUS[meta.status]}
        </Pastilha>
        {(conta || investimento) && (
          <Pastilha tom="previsto">
            {conta ? conta.nome : investimento!.nome}
          </Pastilha>
        )}
      </div>

      {meta.observacao && (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {meta.observacao}
        </p>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-gelo p-4 sm:grid-cols-4">
        {[
          { r: "Guardado", v: brl(p.acumulado) },
          { r: "Alvo", v: brl(meta.valor_alvo) },
          { r: "Falta", v: brl(p.falta) },
          {
            r: "Por mês",
            v: p.aporteNecessario === null ? "sem prazo" : brl(p.aporteNecessario),
          },
        ].map((x) => (
          <div key={x.r}>
            <dt className="text-2xs text-muted-foreground">{x.r}</dt>
            <dd className="font-display text-base font-semibold tabular-nums text-primary">
              {x.v}
            </dd>
          </div>
        ))}
      </dl>

      <section className="mt-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ciano-forte">
          Os últimos 6 meses
        </h3>
        <p className="mb-3 mt-1 text-2xs leading-relaxed text-muted-foreground">
          {p.mesesComAporte >= 2
            ? `Desde o primeiro aporte, você separou ${brl(p.aporteMedio)} por mês, em média.`
            : p.mesesComAporte === 1
              ? "Um mês de histórico ainda não é ritmo — com ele não dá para prever nada."
              : "Nenhum movimento registrado ainda."}
        </p>
        <BarrasMes
          meses={meses}
          formatar={brl}
          rotuloRealizado="Guardado"
          rotuloPlanejado="Plano de hoje"
          altura={100}
        />
      </section>

      <section className="mt-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ciano-forte">
          Movimentos
        </h3>
        {aportes.length === 0 ? (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Nada registrado ainda. O primeiro aporte é o que tira a meta do campo
            da intenção.
          </p>
        ) : (
          <ul className="mt-2 max-h-56 divide-y divide-border/50 overflow-y-auto">
            {aportes.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-2.5">
                <Pastilha tom={a.tipo === "aporte" ? "pago" : "saida"}>
                  {a.tipo === "aporte" ? "guardou" : "tirou"}
                </Pastilha>
                <div className="min-w-0 flex-1">
                  <p className="text-xs tabular-nums text-foreground">
                    {dataCurta(a.data)}
                  </p>
                  {a.observacao && (
                    <p className="truncate text-2xs text-muted-foreground">
                      {a.observacao}
                    </p>
                  )}
                </div>
                <p
                  className={`shrink-0 text-sm font-semibold tabular-nums ${
                    a.tipo === "aporte" ? "text-success-strong" : "text-primary"
                  }`}
                >
                  {a.tipo === "aporte" ? "+" : "−"} {brlExato(a.valor)}
                </p>
                <button
                  type="button"
                  onClick={() => remover(a)}
                  disabled={ocupado}
                  aria-label={`Apagar ${a.tipo} de ${brlExato(a.valor)} de ${dataCurta(a.data)}`}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6 flex flex-wrap gap-2">
        {/* O sólido da casa vive AQUI, dentro do modal: o cartão da meta lá
            atrás só tem contornos, e um modal é uma tela em cima da tela — o
            laranja não disputa com nada porque nada mais está acessível. */}
        <BotaoAcao onClick={aoAportar} className={PAR_BOTOES}>
          Guardar ou tirar
        </BotaoAcao>
        <BotaoAcao variante="contorno" onClick={aoEditar} className={PAR_BOTOES}>
          Editar
        </BotaoAcao>
      </div>

      {/* As decisões sobre a vida da meta. Nenhuma delas apaga: apagar levaria
          os aportes junto (cascade), e com eles a prova de que a pessoa
          guardou. */}
      <div className="mt-3 flex flex-wrap gap-2 border-t border-border/60 pt-3">
        {meta.status === "ativa" && (
          <BotaoStatus
            onClick={() => mudar("pausada")}
            ocupado={ocupado}
            titulo="Pausar"
            dica="Sai da conta de comprometimento da renda, mas continua na tela."
          />
        )}
        {meta.status === "pausada" && (
          <BotaoStatus
            onClick={() => mudar("ativa")}
            ocupado={ocupado}
            titulo="Retomar"
          />
        )}
        {(meta.status === "ativa" || meta.status === "pausada") && (
          <>
            <BotaoStatus
              onClick={() => mudar("concluida")}
              ocupado={ocupado}
              titulo="Concluí esta meta"
            />
            <BotaoStatus
              onClick={() =>
                mudar(
                  "cancelada",
                  `Cancelar "${meta.nome}"? Ela sai das metas ativas, mas o histórico de aportes continua guardado.`,
                )
              }
              ocupado={ocupado}
              titulo="Cancelar"
            />
          </>
        )}
        {(meta.status === "concluida" || meta.status === "cancelada") && (
          <BotaoStatus
            onClick={() => mudar("ativa")}
            ocupado={ocupado}
            titulo="Reabrir"
          />
        )}
      </div>
    </Modal>
  );
}

function BotaoStatus({
  onClick,
  ocupado,
  titulo,
  dica,
}: {
  onClick: () => void;
  ocupado: boolean;
  titulo: string;
  dica?: string;
}) {
  /* `title` continua no elemento e não virou prop da peça: é dica de mouse
     para uma decisão que muda o status da meta, e a peça da casa não tem onde
     guardá-la. O `span` de fora é o dono do atributo. */
  return (
    <span title={dica}>
      <BotaoAcao
        variante="contorno"
        tamanho="sm"
        onClick={onClick}
        desabilitado={ocupado}
      >
        {titulo}
      </BotaoAcao>
    </span>
  );
}

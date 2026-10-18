"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  MessageCircle,
  PiggyBank,
  PowerOff,
  RefreshCw,
  Smartphone,
  Wallet,
} from "lucide-react";

import { carregarSaldos, type Cartao, type Conta } from "@/lib/fincash/modelo";
import { faltaTabela } from "@/lib/fincash/erros";
import { createClient } from "@/lib/supabase/client";
import {
  AvisoErro,
  AvisoSQL,
  Bloco,
  BotaoAcao,
  brl,
  CabecalhoTela,
  Esqueleto,
  Pastilha,
  Vazio,
} from "../pecas";
import { Guia, Privacidade } from "./guia";

/**
 * Ligar o WhatsApp à conta do FINCASH.
 *
 * O SENTIDO DO FLUXO É O RECADO PRINCIPAL DESTA TELA, e ele é o contrário do
 * que se espera: **o app mostra o código, a PESSOA manda pelo WhatsApp**. Não
 * pedimos o número dela em lugar nenhum. Três motivos, e nenhum é preguiça:
 *
 *   · prova as duas pontas de uma vez — quem manda tem a sessão aberta (viu o
 *     código) e tem o aparelho na mão (mandou de lá);
 *   · não depende da API de envio, que pode não estar plugada — e não está hoje;
 *   · elimina o erro de digitação. No sentido inverso, um dígito trocado manda
 *     o código de vínculo da conta financeira de alguém para um desconhecido.
 *
 * Como o app nunca vê o número antes do vínculo, o passo a passo tem de deixar
 * óbvio PARA ONDE mandar. É por isso que o telefone do assistente aparece
 * grande, copiável e com o atalho do WhatsApp já com o código escrito.
 *
 * DE ONDE VEM CADA DADO
 * A rota `/api/whatsapp/vincular` é a dona da regra do vínculo (é ela que fala
 * com a função `security definer` que gera o código) e já devolve o telefone
 * mascarado. Só o carimbo de "ligado desde" vem de leitura direta da tabela,
 * pelo mesmo caminho por onde a conta padrão é gravada — e isso é de propósito:
 * se esse caminho estiver quebrado (o SQL ainda não rodou), a tela descobre
 * ANTES de oferecer um botão que não vai funcionar.
 */

type Estado = {
  vinculado: boolean;
  /** Os quatro últimos dígitos. A rota nunca devolve o número inteiro. */
  final: string | null;
  ativo: boolean;
  conta_padrao_id: string | null;
  cartao_padrao_id: string | null;
  /** Quando o vínculo foi confirmado. */
  desde: string | null;
};

type CodigoVivo = { codigo: string; expira_em: string };

/* Dez minutos é o que a função do banco carimba. Repetir o número aqui seria
   criar uma segunda verdade: o relógio da tela conta o que veio de lá. */
const VALIDADE_TEXTO = "10 minutos";

// ── Telefone ────────────────────────────────────────────────────────────────

/**
 * O número do assistente, legível.
 *
 * Telefone que a pessoa vai DIGITAR no WhatsApp precisa ser lido em blocos —
 * "5519981829686" numa linha só é o tipo de coisa que se copia errado. O atalho
 * do `wa.me` continua sendo o caminho principal; isto é o plano B de quem vai
 * digitar à mão.
 */
function formatarNumero(bruto: string): string {
  const d = bruto.replace(/\D/g, "");
  const nacional = d.startsWith("55") ? d.slice(2) : d;
  if (nacional.length < 10) return bruto;
  const ddd = nacional.slice(0, 2);
  const meio = nacional.slice(2, nacional.length - 4);
  const fim = nacional.slice(-4);
  return `+55 (${ddd}) ${meio}-${fim}`;
}

/** Nunca o número inteiro — nem para quem já é o dono dele. Ver `Privacidade`. */
function mascarar(final: string | null): string {
  return final ? `(••) •••••-${final}` : "•••••";
}

function formatarData(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// ── Relógio do código ───────────────────────────────────────────────────────

const segundosAte = (iso: string | null) =>
  iso ? Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 1000)) : 0;

/**
 * Quanto falta para o código vencer.
 *
 * A validade curta é decisão de segurança do banco, não detalhe: código de
 * vínculo que vale um dia é código que sobrevive num print. Escondê-la da tela
 * transformaria essa proteção em bug misterioso ("mandei e não funcionou").
 *
 * O RESTANTE É CALCULADO NO RENDER, e o estado serve só para acordar o
 * componente de segundo em segundo. Guardar o número em estado parece mais
 * limpo e não é: o primeiro quadro depois de gerar o código sairia com o valor
 * velho (zero), e a tela piscaria "este código venceu" no instante em que ele
 * acabou de nascer. Não há risco de hidratação porque, sem código, `ate` é nulo
 * e a conta dá zero nos dois lados.
 */
function useContagem(ate: string | null): number {
  const [, tique] = useState(0);

  useEffect(() => {
    if (!ate) return;
    const t = setInterval(() => tique((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [ate]);

  return segundosAte(ate);
}

const relogio = (s: number) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// ── A tela ──────────────────────────────────────────────────────────────────

export function TelaWhatsApp({
  envioLigado,
  numeroDoAssistente,
}: {
  envioLigado: boolean;
  numeroDoAssistente: string | null;
}) {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [contas, setContas] = useState<Conta[]>([]);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [saldos, setSaldos] = useState<Record<string, number>>({});
  const [erro, setErro] = useState<string | null>(null);

  const [codigo, setCodigo] = useState<CodigoVivo | null>(null);
  const [gerando, setGerando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [recado, setRecado] = useState<string | null>(null);
  const [conferindo, setConferindo] = useState(false);
  const [confirmandoSaida, setConfirmandoSaida] = useState(false);
  const [salvandoPadrao, setSalvandoPadrao] = useState<string | null>(null);

  const restante = useContagem(codigo?.expira_em ?? null);
  const codigoVivo = Boolean(codigo) && restante > 0;

  const carregar = useCallback(async () => {
    const supabase = createClient();

    /* Tudo de uma vez: são quatro consultas independentes, e encadeá-las só
       somaria a latência de cada uma numa tela que a pessoa abre para resolver
       uma coisa só. */
    const [resposta, vinculo, qContas, qCartoes] = await Promise.all([
      fetch("/api/whatsapp/vincular", { cache: "no-store" }),
      supabase
        .from("fin_whatsapp_contas")
        .select("confirmado_em")
        .not("confirmado_em", "is", null)
        .maybeSingle(),
      supabase.from("fin_contas").select("*").eq("arquivada", false).order("criado_em"),
      supabase.from("fin_cartoes").select("*").eq("arquivado", false).order("criado_em"),
    ]);

    // `faltaTabela` reconhece os dois códigos (Postgres 42P01 e PostgREST
    // PGRST205). É o estado NORMAL antes de alguém rodar o
    // SQL, e não um defeito — por isso tem aviso próprio, não tela de erro.
    if (faltaTabela(vinculo.error)) return setErro("FALTA_SQL_WHATSAPP");
    if (faltaTabela(qContas.error)) return setErro("FALTA_SQL_BASE");
    if (qContas.error) return setErro(qContas.error.message);
    if (!resposta.ok) return setErro("Não consegui falar com o servidor agora.");

    const dados = (await resposta.json()) as Omit<Estado, "desde">;
    setEstado({ ...dados, desde: vinculo.data?.confirmado_em ?? null });
    setContas((qContas.data ?? []) as Conta[]);
    /* Cartão é opcional no app: se essa consulta falhar por qualquer motivo, a
       tela ainda resolve o problema principal com as contas. */
    setCartoes((qCartoes.data ?? []) as Cartao[]);

    /* Saldo aqui é enfeite honesto — ajuda a reconhecer a conta na hora de
       escolher o padrão. Não vale derrubar a tela por causa dele. */
    carregarSaldos()
      .then(setSaldos)
      .catch(() => {});
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  /**
   * Enquanto o código está vivo, a tela pergunta sozinha se já chegou.
   *
   * Não é firula: sem a API de envio plugada, o assistente NÃO responde no
   * WhatsApp. Se a tela também ficasse parada, a pessoa mandaria o código, não
   * receberia nada de lugar nenhum e concluiria que falhou. Seis segundos é
   * lento o bastante para não pesar e rápido o bastante para parecer imediato.
   */
  const conferir = useCallback(
    async (manual = false) => {
      if (manual) setConferindo(true);
      try {
        const r = await fetch("/api/whatsapp/vincular", { cache: "no-store" });
        if (!r.ok) return;
        const d = (await r.json()) as Estado;
        if (d.vinculado) {
          setCodigo(null);
          setRecado(null);
          await carregar();
        } else if (manual) {
          setRecado(
            "Ainda não chegou. Confira se você mandou os seis dígitos para o número certo — a mensagem tem de sair do celular que você quer ligar.",
          );
        }
      } finally {
        if (manual) setConferindo(false);
      }
    },
    [carregar],
  );

  useEffect(() => {
    if (!codigoVivo) return;
    const t = setInterval(() => conferir(), 6000);
    return () => clearInterval(t);
  }, [codigoVivo, conferir]);

  /* Uma última olhada no instante em que o código vence: a mensagem pode ter
     chegado no segundo final, e seria cruel mandar refazer tudo por causa de um
     relógio nosso que é, de propósito, mais rígido que o do banco. */
  const venceuAgora = Boolean(codigo) && restante === 0;
  useEffect(() => {
    if (venceuAgora) conferir();
  }, [venceuAgora, conferir]);

  async function gerarCodigo() {
    setGerando(true);
    setRecado(null);
    setCopiado(false);
    try {
      const r = await fetch("/api/whatsapp/vincular", { method: "POST" });
      const d = await r.json();
      if (!r.ok || !d?.codigo) {
        // O 429 da rota tem texto próprio ("Muitos códigos seguidos") e ele é
        // melhor do que qualquer coisa genérica que eu escrevesse aqui.
        setRecado(d?.erro ?? "Não consegui gerar o código agora. Tente de novo.");
        return;
      }
      setCodigo({ codigo: d.codigo, expira_em: d.expira_em });
    } catch {
      setRecado("Não consegui gerar o código agora. Tente de novo.");
    } finally {
      setGerando(false);
    }
  }

  async function desvincular() {
    setGerando(true);
    try {
      const r = await fetch("/api/whatsapp/vincular", { method: "DELETE" });
      if (!r.ok) {
        setRecado("Não consegui desligar agora. Tente de novo.");
        return;
      }
      setConfirmandoSaida(false);
      await carregar();
    } finally {
      setGerando(false);
    }
  }

  /**
   * Grava a origem padrão.
   *
   * Vai direto na tabela, e não pela rota, porque a rota não tem esse verbo — e
   * não precisa ter: o RLS "org: dono manda" já restringe a linha ao dono, então
   * o filtro por `confirmado_em` basta para acertar a única linha confirmada
   * dele. Conta e cartão são MUTUAMENTE EXCLUSIVOS por `check` do banco (a mesma
   * regra de um lançamento), por isso cada escolha zera o outro em vez de
   * atualizar só o campo escolhido.
   */
  async function escolherPadrao(conta_id: string | null, cartao_id: string | null) {
    setSalvandoPadrao(conta_id ?? cartao_id ?? "nenhum");
    const supabase = createClient();
    const { error } = await supabase
      .from("fin_whatsapp_contas")
      .update({ conta_padrao_id: conta_id, cartao_padrao_id: cartao_id })
      .not("confirmado_em", "is", null);

    if (error) setRecado("Não consegui salvar a conta padrão agora.");
    else
      setEstado((e) =>
        e ? { ...e, conta_padrao_id: conta_id, cartao_padrao_id: cartao_id } : e,
      );
    setSalvandoPadrao(null);
  }

  async function copiar(texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      /* Navegador sem permissão de área de transferência: o código continua na
         tela, grande, para ser lido. Nada a fazer além de não quebrar. */
    }
  }

  if (erro === "FALTA_SQL_WHATSAPP")
    return (
      <AvisoSQL
        arquivo="supabase/fincash_whatsapp.sql"
        oQue="O assistente do WhatsApp"
      />
    );
  if (erro === "FALTA_SQL_BASE") return <AvisoSQL arquivo="supabase/fincash.sql" />;
  if (erro) return <AvisoErro mensagem={erro} />;
  if (!estado) return <Esqueleto linhas={2} />;

  const numeroLimpo = numeroDoAssistente?.replace(/\D/g, "") ?? "";
  const temNumero = numeroLimpo.length >= 10;
  const linkWhatsApp = codigo
    ? `https://wa.me/${numeroLimpo}?text=${encodeURIComponent(codigo.codigo)}`
    : `https://wa.me/${numeroLimpo}`;

  return (
    <div className="surgir">
      <CabecalhoTela
        chapeu="Assistente"
        titulo="WhatsApp"
        resumo="Registre um gasto mandando uma mensagem, sem abrir o app. Ele entende o que você escreveu, lança na sua conta e confirma."
      />

      {/* O estado da integração vem PRIMEIRO. Explicar o passo a passo de algo
          que ainda não está no ar, e só no fim avisar, é fazer a pessoa perder
          tempo duas vezes. */}
      <EstadoDaIntegracao temNumero={temNumero} envioLigado={envioLigado} />

      {estado.vinculado ? (
        <Bloco className="mt-3 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ciano-tint text-ciano-forte"
              >
                <Smartphone className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="font-display text-base font-semibold tabular-nums text-primary">
                  {mascarar(estado.final)}
                </p>
                <p className="text-2xs text-muted-foreground">
                  {estado.desde
                    ? `Ligado desde ${formatarData(estado.desde)}`
                    : "Ligado a esta conta"}
                </p>
              </div>
            </div>
            <Pastilha tom={estado.ativo ? "pago" : "neutro"} Icone={Check}>
              {estado.ativo ? "Ativo" : "Pausado"}
            </Pastilha>
          </div>

          <p className="mt-4 max-w-prose text-xs leading-relaxed text-muted-foreground">
            Só este número escreve na sua conta. Trocou de celular? Gere um código
            novo e mande do aparelho novo — o vínculo antigo é substituído.
          </p>

          {confirmandoSaida ? (
            <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
              <p className="text-xs leading-relaxed text-foreground">
                Desligar apaga o vínculo deste número. Os lançamentos que ele já criou
                continuam no app, intactos.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={desvincular}
                  disabled={gerando}
                  className="min-h-11 rounded-xl bg-destructive px-4 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {gerando ? "Desligando…" : "Sim, desligar"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmandoSaida(false)}
                  className="min-h-11 rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-primary transition-colors hover:bg-muted"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmandoSaida(true)}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-primary transition-colors hover:border-destructive/40 hover:text-destructive"
            >
              <PowerOff className="h-3.5 w-3.5" />
              Desligar este número
            </button>
          )}
        </Bloco>
      ) : (
        <PassoAPasso
          temNumero={temNumero}
          numeroFormatado={temNumero ? formatarNumero(numeroDoAssistente ?? "") : null}
          numeroLimpo={numeroLimpo}
          codigo={codigo}
          codigoVivo={codigoVivo}
          restante={restante}
          gerando={gerando}
          conferindo={conferindo}
          copiado={copiado}
          linkWhatsApp={linkWhatsApp}
          aoGerar={gerarCodigo}
          aoCopiar={copiar}
          aoConferir={() => conferir(true)}
        />
      )}

      {recado && (
        <p
          role="status"
          className="mt-3 rounded-xl border border-border bg-white px-4 py-3 text-xs leading-relaxed text-foreground"
        >
          {recado}
        </p>
      )}

      <SeletorPadrao
        habilitado={estado.vinculado}
        contas={contas}
        cartoes={cartoes}
        saldos={saldos}
        contaPadraoId={estado.conta_padrao_id}
        cartaoPadraoId={estado.cartao_padrao_id}
        salvando={salvandoPadrao}
        aoEscolher={escolherPadrao}
      />

      <Guia exemploConta={contas[0]?.nome ?? null} />
      <Privacidade />
    </div>
  );
}

// ── O aviso de obra ─────────────────────────────────────────────────────────

/**
 * A tela não finge que está no ar.
 *
 * São dois estados diferentes, e confundi-los é o que produz suporte:
 *
 *   · SEM NÚMERO publicado não existe para onde mandar o código. O fluxo inteiro
 *     fica indisponível e o botão de gerar código fica desligado — botão que não
 *     leva a lugar nenhum é pior que botão ausente.
 *   · SEM CREDENCIAL DE ENVIO o assistente funciona pela metade, e essa metade é
 *     real: ele lê a mensagem, grava o lançamento e registra a resposta que
 *     teria mandado — só não entrega. Quem vincular hoje vai ver o gasto
 *     aparecer no app e não vai receber confirmação nenhuma no WhatsApp. Dizer
 *     isso antes é a diferença entre "meio pronto" e "quebrado".
 */
function EstadoDaIntegracao({
  temNumero,
  envioLigado,
}: {
  temNumero: boolean;
  envioLigado: boolean;
}) {
  if (temNumero && envioLigado) return null;

  return (
    <div className="rounded-2xl border border-dashed border-accent/40 bg-accent-tint p-5">
      <p className="font-display text-sm font-semibold text-primary">
        {temNumero
          ? "O assistente ainda não responde no WhatsApp"
          : "O assistente ainda não está no ar"}
      </p>
      <p className="mt-1.5 max-w-prose text-xs leading-relaxed text-muted-foreground">
        {temNumero ? (
          <>
            Ele já entende as mensagens e grava os lançamentos — a resposta fica
            registrada, mas não é entregue enquanto a conta no provedor não estiver
            ligada. Na prática: o gasto aparece no app, a confirmação não chega no
            seu celular.
          </>
        ) : (
          <>
            Falta publicar o número para onde as mensagens vão. Sem ele não há para
            onde mandar o código, então o vínculo ainda não pode ser feito. Assim que
            o número existir, esta tela libera sozinha.
          </>
        )}
      </p>
      <p className="mt-2 text-2xs leading-relaxed text-muted-foreground">
        Para quem cuida do produto: o passo a passo está em{" "}
        <code className="rounded bg-white px-1.5 py-0.5 font-mono text-2xs text-accent-strong">
          docs/whatsapp.md
        </code>
        .
      </p>
    </div>
  );
}

// ── O passo a passo do vínculo ──────────────────────────────────────────────

function PassoAPasso({
  temNumero,
  numeroFormatado,
  numeroLimpo,
  codigo,
  codigoVivo,
  restante,
  gerando,
  conferindo,
  copiado,
  linkWhatsApp,
  aoGerar,
  aoCopiar,
  aoConferir,
}: {
  temNumero: boolean;
  numeroFormatado: string | null;
  numeroLimpo: string;
  codigo: CodigoVivo | null;
  codigoVivo: boolean;
  restante: number;
  gerando: boolean;
  conferindo: boolean;
  copiado: boolean;
  linkWhatsApp: string;
  aoGerar: () => void;
  aoCopiar: (t: string) => void;
  aoConferir: () => void;
}) {
  return (
    <Bloco className="mt-3 p-5 sm:p-6">
      <h2 className="font-display text-base font-semibold text-primary">
        Ligar o seu WhatsApp
      </h2>
      <p className="mt-1 max-w-prose text-xs leading-relaxed text-muted-foreground">
        Nós não pedimos o seu número: <strong className="font-semibold">você</strong>{" "}
        manda um código do seu celular, e é isso que prova que o aparelho é seu. Num
        campo de telefone, um dígito trocado mandaria esse código para um
        desconhecido.
      </p>

      <ol className="mt-5 space-y-5">
        <Passo n={1} titulo="Gere o código">
          {codigo ? (
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p
                role="status"
                className="font-display text-3xl font-semibold tracking-[0.3em] tabular-nums text-primary"
              >
                <span aria-hidden>{codigoVivo ? codigo.codigo : "••••••"}</span>
                <span className="sr-only">
                  {codigoVivo
                    ? `Código ${codigo.codigo.split("").join(" ")}`
                    : "Código vencido"}
                </span>
              </p>

              {codigoVivo ? (
                <p className="mt-1.5 text-2xs text-muted-foreground">
                  Vale por mais{" "}
                  <span className="font-semibold tabular-nums text-foreground">
                    {relogio(restante)}
                  </span>
                  . Depois disso ele deixa de valer e você gera outro aqui mesmo.
                </p>
              ) : (
                <p className="mt-1.5 text-2xs font-semibold text-destructive">
                  Este código venceu. Gere outro — leva um segundo.
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => aoCopiar(codigo.codigo)}
                  disabled={!codigoVivo}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs font-semibold text-primary transition-colors hover:border-accent-soft disabled:opacity-50"
                >
                  {copiado ? (
                    <Check className="h-3.5 w-3.5 text-success-strong" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copiado ? "Copiado" : "Copiar código"}
                </button>
                <button
                  type="button"
                  onClick={aoGerar}
                  disabled={gerando}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3.5 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {gerando ? "Gerando…" : "Gerar outro"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs leading-relaxed text-muted-foreground">
                São seis dígitos, válidos por {VALIDADE_TEXTO}. Gerar um novo cancela o
                anterior.
              </p>
              <div className="mt-3">
                <BotaoAcao
                  Icone={MessageCircle}
                  onClick={aoGerar}
                  desabilitado={gerando || !temNumero}
                >
                  {gerando ? "Gerando…" : "Gerar código"}
                </BotaoAcao>
              </div>
              {!temNumero && (
                <p className="mt-2 text-2xs text-muted-foreground">
                  Indisponível enquanto o número do assistente não estiver publicado.
                </p>
              )}
            </>
          )}
        </Passo>

        <Passo n={2} titulo="Mande esse código pelo WhatsApp">
          {temNumero ? (
            <>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Do celular que você quer ligar, para o número do assistente:
              </p>
              <p className="mt-2 font-display text-lg font-semibold tabular-nums text-primary">
                {numeroFormatado}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={linkWhatsApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent-btn px-4 py-2.5 text-xs font-bold text-white transition-transform hover:-translate-y-0.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Abrir o WhatsApp
                </a>
                <button
                  type="button"
                  onClick={() => aoCopiar(numeroLimpo)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs font-semibold text-primary transition-colors hover:border-accent-soft"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copiar o número
                </button>
              </div>
              <p className="mt-2 text-2xs leading-relaxed text-muted-foreground">
                O atalho abre a conversa com o código já escrito — você só confere e
                envia. A mensagem precisa sair do celular que vai ficar ligado.
              </p>
            </>
          ) : (
            <p className="text-xs leading-relaxed text-muted-foreground">
              O número do assistente ainda não foi publicado.
            </p>
          )}
        </Passo>

        <Passo n={3} titulo="Pronto — a confirmação aparece aqui" ultimo>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Assim que a mensagem chegar, esta tela troca sozinha para o número ligado.
            Não precisa recarregar.
          </p>
          {codigoVivo && (
            <button
              type="button"
              onClick={aoConferir}
              disabled={conferindo}
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3.5 py-2.5 text-xs font-semibold text-primary transition-colors hover:bg-muted disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${conferindo ? "animate-spin" : ""}`} />
              {conferindo ? "Conferindo…" : "Já mandei, conferir"}
            </button>
          )}
        </Passo>
      </ol>
    </Bloco>
  );
}

/** O degrau numerado. O fio vertical liga os três — sem ele são três caixas. */
function Passo({
  n,
  titulo,
  children,
  ultimo,
}: {
  n: number;
  titulo: string;
  children: React.ReactNode;
  ultimo?: boolean;
}) {
  return (
    <li className="relative flex gap-3.5">
      {!ultimo && (
        <span aria-hidden className="absolute bottom-0 left-[13px] top-8 w-px bg-border" />
      )}
      <span
        aria-hidden
        className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-2xs font-bold text-white"
      >
        {n}
      </span>
      <div className="min-w-0 flex-1 pb-1">
        <p className="text-sm font-semibold text-foreground">
          <span className="sr-only">Passo {n}: </span>
          {titulo}
        </p>
        <div className="mt-1.5">{children}</div>
      </div>
    </li>
  );
}

// ── A origem padrão ─────────────────────────────────────────────────────────

/**
 * De qual conta sai o dinheiro quando a mensagem não diz.
 *
 * ESTA É A PEÇA QUE FAZ O ASSISTENTE VALER A PENA, e não um ajuste fino. O
 * interpretador se recusa a chutar a origem: sem padrão, quem tem duas contas
 * ouve "de qual conta saiu?" em TODA mensagem, e um assistente que pergunta duas
 * vezes por gasto é mais lento do que abrir o app — que é exatamente o problema
 * que ele deveria resolver.
 *
 * Escolher aqui não tira o controle: dizer "mercado 280 no nubank" continua
 * mandando mais que o padrão. O padrão só responde ao silêncio.
 */
function SeletorPadrao({
  habilitado,
  contas,
  cartoes,
  saldos,
  contaPadraoId,
  cartaoPadraoId,
  salvando,
  aoEscolher,
}: {
  habilitado: boolean;
  contas: Conta[];
  cartoes: Cartao[];
  saldos: Record<string, number>;
  contaPadraoId: string | null;
  cartaoPadraoId: string | null;
  salvando: string | null;
  aoEscolher: (conta_id: string | null, cartao_id: string | null) => void;
}) {
  const origens = contas.length + cartoes.length;

  return (
    <section className="mt-6">
      <h2 className="font-display text-base font-semibold text-primary">
        Para onde vai o gasto
      </h2>
      <p className="mt-1 max-w-prose text-xs leading-relaxed text-muted-foreground">
        Quando a mensagem não disser a conta, ele usa esta. Dizer na frase (“mercado
        280 no {contas[0]?.nome.toLowerCase() ?? "nubank"}”) continua valendo mais.
      </p>

      {origens === 0 ? (
        <div className="mt-3">
          <Vazio
            Icone={PiggyBank}
            titulo="Você ainda não tem contas"
            texto="O assistente não inventa de onde o dinheiro saiu: sem nenhuma conta cadastrada, ele responde pedindo para você criar uma. Leva um minuto."
            acao={
              <BotaoAcao Icone={Wallet} href="/fincash/app/contas">
                Cadastrar uma conta
              </BotaoAcao>
            }
          />
        </div>
      ) : (
        <fieldset disabled={!habilitado} className="mt-3">
          <legend className="sr-only">Origem padrão do assistente</legend>

          {!habilitado && (
            <p className="mb-3 rounded-xl border border-dashed border-border bg-white/60 px-4 py-3 text-2xs leading-relaxed text-muted-foreground">
              Esta escolha fica guardada junto do vínculo — ela abre assim que o seu
              número estiver ligado.
            </p>
          )}

          <div
            className={`grid gap-2 sm:grid-cols-2 ${
              habilitado ? "" : "pointer-events-none opacity-55"
            }`}
          >
            {contas.map((c) => (
              <Opcao
                key={c.id}
                cor={c.cor}
                Icone={Wallet}
                nome={c.nome}
                detalhe={saldos[c.id] !== undefined ? brl(saldos[c.id]) : "conta"}
                escolhida={contaPadraoId === c.id}
                salvando={salvando === c.id}
                aoClicar={() => aoEscolher(c.id, null)}
              />
            ))}

            {cartoes.map((c) => (
              <Opcao
                key={c.id}
                cor={c.cor}
                Icone={CreditCard}
                nome={c.nome}
                detalhe="cartão de crédito"
                escolhida={cartaoPadraoId === c.id}
                salvando={salvando === c.id}
                aoClicar={() => aoEscolher(null, c.id)}
              />
            ))}

            <Opcao
              cor="#94a3b8"
              Icone={MessageCircle}
              nome="Perguntar sempre"
              detalhe="ele pergunta a cada gasto"
              escolhida={!contaPadraoId && !cartaoPadraoId}
              salvando={salvando === "nenhum"}
              aoClicar={() => aoEscolher(null, null)}
            />
          </div>

          {origens === 1 && (
            <p className="mt-2 text-2xs leading-relaxed text-muted-foreground">
              Com uma origem só, ele já usa essa sem precisar perguntar. A escolha aqui
              passa a importar quando você cadastrar a segunda.
            </p>
          )}
        </fieldset>
      )}
    </section>
  );
}

/**
 * Um cartão de escolha.
 *
 * `aria-pressed` e a etiqueta "Padrão" fazem o trabalho que a borda laranja
 * sozinha não faz: cor não pode ser o único recado de qual está escolhida. E
 * altura mínima generosa porque esta tela é usada em pé, com o polegar.
 */
function Opcao({
  cor,
  Icone,
  nome,
  detalhe,
  escolhida,
  salvando,
  aoClicar,
}: {
  cor: string;
  Icone: typeof Wallet;
  nome: string;
  detalhe: string;
  escolhida: boolean;
  salvando: boolean;
  aoClicar: () => void;
}) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      aria-pressed={escolhida}
      className={`flex min-h-[3.25rem] items-center gap-3 rounded-2xl border bg-white px-4 py-3 text-left transition-colors ${
        escolhida
          ? "border-accent ring-1 ring-accent/30"
          : "border-border/70 hover:border-accent-soft"
      }`}
    >
      <span
        aria-hidden
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white"
        style={{ background: cor }}
      >
        <Icone className="h-4 w-4" strokeWidth={2.2} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">{nome}</span>
        <span className="block truncate text-2xs tabular-nums text-muted-foreground">
          {salvando ? "salvando…" : detalhe}
        </span>
      </span>

      {escolhida && (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-tint px-2 py-0.5 text-2xs font-semibold text-accent-strong">
          <Check className="h-3 w-3" strokeWidth={3} />
          Padrão
        </span>
      )}
    </button>
  );
}

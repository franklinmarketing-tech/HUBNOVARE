"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CreditCard,
  ExternalLink,
  Landmark,
  Link2,
  Loader2,
  PowerOff,
  RefreshCw,
  RotateCcw,
  Trash2,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

import { ErroDados } from "@/lib/novarecash/dados";
import {
  ErroBanco,
  abrirJanelaDoBanco,
  atualizarNoBanco,
  avisoDoProvedor,
  bancosComFalha,
  contasComSaldo,
  esquecer,
  faturaAtual,
  iniciarConexao,
  listarCartoesDoBanco,
  listarBancos,
  listarConexoes,
  marcarSincronizado,
  nomeDaConta,
  ponteDoBanco,
  precisaReconectar,
  reivindicar,
  sincronizar,
  statusLegivel,
  trazerTudo,
  urlParaConectar,
  urlParaReconectar,
  type BancoParaConectar,
  type CartaoBanco,
  type CandidataBanco,
  type Conexao,
  type ContaBanco,
  type JanelaDoBanco,
  type ResultadoSincronizacao,
} from "@/lib/novarecash/openfinance";
import { Janela } from "../Janela";
import { ANEL, AvisoErro, AvisoSemTabela, Botao, Cartao, Esqueleto, Selo, brl, type TomSelo } from "../pecas";

/**
 * O FLUXO DA TELA (refeito em 13/11/2026, "o cliente vai se perder"):
 *   1. A pessoa toca no banco DENTRO do app.
 *   2. Abre uma JANELINHA do banco por cima do NovareCash (no celular, uma aba) e, no app, a janela
 *      "passo a passo" (Autorizar → Trazer dados → Pronto).
 *   3. O app confere sozinho a cada 3 s (e quando a pessoa volta à aba). Achou a conexão: FECHA a
 *      janelinha do banco e liga o banco à conta (`claim`).
 *   4. TRAZ TUDO SOZINHO (`trazerTudo`): espera o banco terminar de mandar, lê contas, cartões e
 *      saldos e grava 12 meses de lançamentos, sem duplicar.
 *   5. Depois, o `AtualizaBanco` (na casca) atualiza sozinho ao abrir o app, a cada 6 h.
 *
 * Por que janelinha e não dentro da página: a mcp.ai proíbe ser embutida (`X-Frame-Options: DENY`)
 * no plano atual. A janelinha passa pela ponte `/novarecash/conectar-banco`, que impede a página
 * dela de mandar o NovareCash para o claude.ai depois de conectar.
 *
 * Nenhum erro técnico chega à tela: tudo passa por `ErroBanco`, que já vem com a frase certa.
 */

/** A conexão em andamento. Fica no `localStorage`: no celular, ir ao app do banco e voltar pode recarregar a aba. */
type Pendente = {
  quando: number;
  banco: string;
  logo: string | null;
  url: string | null;
  /** RECONECTAR (13/11/2026): o item que está sendo renovado. Sem claim: espera ele voltar a ficar em dia. */
  item?: string;
};
type Fase = "autorizar" | "trazendo" | "pronto";

const CHAVE_ESPERA = "ncash:open-finance:esperando";

function lerEspera(): Pendente | null {
  try {
    const bruto = localStorage.getItem(CHAVE_ESPERA);
    if (!bruto) return null;
    // A versão anterior guardava só a hora: espera dessa época é descartada (ela abria uma janela "Conectar seu banco" do nada).
    const p: Pendente | null = /^\d+$/.test(bruto) ? null : JSON.parse(bruto);
    if (p?.url && Date.now() - Number(p.quando) < 60 * 60_000) return p;
    localStorage.removeItem(CHAVE_ESPERA);
    return null;
  } catch {
    return null;
  }
}
const guardarEspera = (p: Pendente) => {
  try {
    localStorage.setItem(CHAVE_ESPERA, JSON.stringify(p));
  } catch {}
};
const esquecerEspera = () => {
  try {
    localStorage.removeItem(CHAVE_ESPERA);
  } catch {}
};

const frase = (e: unknown) =>
  e instanceof ErroBanco ? e.message : "Não consegui falar com o banco agora. Tente de novo em instantes.";

const periodo = (dias: number | null) =>
  dias === null ? "desde a última atualização" : dias >= 365 ? "nos últimos 12 meses" : `nos últimos ${dias} dias`;

/** "há 5 min", "há 3 h", "ontem", "em 12/11". */
function haQuanto(ms: number | null): string | null {
  if (!ms) return null;
  const min = Math.round((Date.now() - ms) / 60_000);
  if (min < 1) return "agora há pouco";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  if (h < 48) return "ontem";
  return `em ${new Date(ms).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`;
}

function textoDoResultado(r: ResultadoSincronizacao, dias: number | null): string {
  const partes: string[] = [];
  if (r.lidas === 0) partes.push(`Nenhuma transação ${periodo(dias)}.`);
  else if (r.novas === 0) partes.push(`Tudo em dia: as ${r.lidas} transações já estavam no seu extrato.`);
  else
    partes.push(
      `${r.novas} ${r.novas === 1 ? "transação entrou" : "transações entraram"} no seu extrato${
        r.jaEstavam ? ` (${r.jaEstavam} já estavam lá)` : ""
      }.`,
    );
  if (r.corrigidas) partes.push(`${r.corrigidas} ${r.corrigidas === 1 ? "lançamento corrigido" : "lançamentos corrigidos"} pelo banco.`);
  if (r.contas) partes.push(`${r.contas === 1 ? "Saldo atualizado" : `Saldos de ${r.contas} contas atualizados`}.`);
  if (r.falhas.length) partes.push(`Não consegui ler: ${r.falhas.join(", ")}. Tente de novo em instantes.`);
  return partes.join(" ");
}

const TOM_STATUS: Record<string, TomSelo> = { "Em dia": "verde", "Atualizando…": "ouro", "O banco pede confirmação": "alerta" };

function LogoBanco({ logo, grande = false }: { logo: string | null; grande?: boolean }) {
  const tam = grande ? "h-11 w-11" : "h-6 w-6";
  return logo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logo} alt="" className={`${tam} shrink-0 rounded-lg bg-white object-contain p-0.5`} />
  ) : (
    <span aria-hidden className={`${tam} flex shrink-0 items-center justify-center rounded-lg bg-ouro/15 text-ouro`}>
      <Landmark className={grande ? "h-5 w-5" : "h-4 w-4"} />
    </span>
  );
}

/** Uma mensagem do assistente na conversa de conexão. `digitando`: ainda em andamento; `ok`: concluída. */
function Bolha({ children, digitando, ok }: { children: React.ReactNode; digitando?: boolean; ok?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span
        aria-hidden
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${ok ? "bg-[hsl(152_55%_41%/0.18)] text-[var(--ncash-verde)]" : "bg-ouro/15 text-ouro"}`}
      >
        {ok ? <Check className="h-3.5 w-3.5" /> : digitando ? <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" /> : <Landmark className="h-3.5 w-3.5" />}
      </span>
      <div className="min-w-0 max-w-[92%] rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs leading-relaxed text-white/85">
        {children}
      </div>
    </div>
  );
}

/** As três etapas no alto da janela: Autorizar → Trazer dados → Pronto. */
function Passos({ atual }: { atual: 0 | 1 | 2 }) {
  const rotulos = ["Autorizar", "Importar", "Pronto"];
  return (
    <ol className="flex items-center gap-2" aria-label="Etapas da conexão">
      {rotulos.map((rotulo, i) => {
        const feito = i < atual || atual === 2;
        const agora = i === atual && atual !== 2;
        return (
          <li key={rotulo} className="flex min-w-0 flex-1 items-center gap-2" aria-current={i === atual ? "step" : undefined}>
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                feito ? "bg-[var(--ncash-verde)] text-noite" : agora ? "bg-ouro text-noite" : "bg-white/10 text-white/60"
              }`}
            >
              {feito ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span className={`truncate text-xs font-semibold ${feito || agora ? "text-white" : "text-white/50"}`}>{rotulo}</span>
            {i < rotulos.length - 1 && (
              <span aria-hidden className={`hidden h-px flex-1 sm:block ${i < atual ? "bg-[var(--ncash-verde)]" : "bg-white/15"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

const ROTULO_FATURA = { paga: "Paga", aberta: "Aberta", atrasada: "Atrasada", futura: "Próxima" } as const;
const TOM_FATURA: Record<string, TomSelo> = { paga: "verde", aberta: "ouro", atrasada: "perigo", futura: "neutro" };
const dataCurta = (iso: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : null);

/** FASE 2: a fatura REAL do cartão (valor, vencimento, situação) e o limite disponível, do próprio banco. */
function InfoCartao({ cartao, saldo }: { cartao: CartaoBanco; saldo: number | null }) {
  const f = faturaAtual(cartao);
  return (
    <span className="text-right">
      <span className="block text-2xs text-white/55">
        {f?.vence ? `Fatura · vence ${dataCurta(f.vence)}` : "Fatura / saldo"}
      </span>
      <span className="block font-display text-base font-semibold tabular-nums text-white">
        {brl(f?.total ?? saldo ?? 0)}
      </span>
      <span className="mt-0.5 flex flex-wrap items-center justify-end gap-1.5">
        {f?.situacao && <Selo tom={TOM_FATURA[f.situacao]}>{ROTULO_FATURA[f.situacao]}</Selo>}
        {f?.minimo ? <span className="text-2xs text-white/55">mínimo {brl(f.minimo)}</span> : null}
      </span>
      {cartao.limite ? (
        <span className="mt-0.5 block text-2xs text-white/55">
          Limite {brl(cartao.limite)}
          {cartao.disponivel !== null ? ` · livre ${brl(cartao.disponivel)}` : ""}
        </span>
      ) : null}
    </span>
  );
}

/**
 * `limite` (05/11/2026): quantos bancos o PLANO do dono permite (Essencial 1, Plus 3,
 * Premium 10 — `bancosDoPlano` em config.ts). Chegou no limite, o "Conectar" vira o
 * convite para mudar de plano. A equipe testa sem limite.
 */
export function TelaBanco({ limite, nomePlano }: { limite: number; nomePlano: string }) {
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [semTabela, setSemTabela] = useState(false);
  const [conexoes, setConexoes] = useState<Conexao[]>([]);
  const [contas, setContas] = useState<ContaBanco[]>([]);
  const [recado, setRecado] = useState<string | null>(null);
  const [escolher, setEscolher] = useState<CandidataBanco[] | null>(null);
  const [bancos, setBancos] = useState<BancoParaConectar[] | null>(null);
  const [busca, setBusca] = useState("");
  const [escolhendo, setEscolhendo] = useState(false);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [resultado, setResultado] = useState<string | null>(null);

  // A conexão em andamento (13/11/2026).
  const [pendente, setPendente] = useState<Pendente | null>(null);
  const [fase, setFase] = useState<Fase | null>(null);
  const [aberta, setAberta] = useState(false);
  const [progresso, setProgressoBruto] = useState("");
  /** A conversa: cada passo da importação vira uma mensagem (as anteriores ficam com ✓). */
  const [historico, setHistorico] = useState<string[]>([]);
  const setProgresso = useCallback((f: string) => {
    setProgressoBruto(f);
    setHistorico((h) => (!f ? [] : h[h.length - 1] === f ? h : [...h, f]));
  }, []);
  const [resumo, setResumo] = useState<ResultadoSincronizacao | null>(null);
  const [falhaImport, setFalhaImport] = useState<string | null>(null);
  const [conferindo, setConferindo] = useState(false);
  const [janelaFechou, setJanelaFechou] = useState(false);
  const [bloqueada, setBloqueada] = useState(false);
  const janela = useRef<JanelaDoBanco | null>(null);
  const concluindo = useRef(false);
  const itemNovo = useRef<string | null>(null);
  /** O pedido assinado (`iniciar`) precisa chegar ao servidor antes da 1ª conferência. */
  const iniciando = useRef<Promise<unknown> | null>(null);
  /** Outro cliente conectou o mesmo banco ao mesmo tempo: confirmar pelo final da conta. */
  const [confirmar, setConfirmar] = useState<CandidataBanco | null>(null);
  /** Reinicia a conferência (depois de um "Não é a minha"). */
  const [rodada, setRodada] = useState(0);
  /** A janela "Desligar" (manter ou apagar o histórico). */
  const [desligando, setDesligando] = useState<Conexao | null>(null);
  /** "Atualizar agora" de um banco: a frase do passo. */
  const [progressoBanco, setProgressoBanco] = useState<{ item: string; frase: string } | null>(null);
  const [falhasBanco, setFalhasBanco] = useState<string[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  /** Fase 2: limite, disponível e faturas reais de cada cartão (por id da conta no banco). */
  const [cartoesBanco, setCartoesBanco] = useState<Map<string, CartaoBanco>>(new Map());

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const cx = await listarConexoes();
      setConexoes(cx);
      setContas(cx.length ? await contasComSaldo() : []);
      setFalhasBanco(cx.length ? [...bancosComFalha()] : []);
      // Faturas e limites: em segundo plano (a tela não espera).
      if (cx.length)
        listarCartoesDoBanco()
          .then((l) => setCartoesBanco(new Map(l.map((c) => [c.accountId, c]))))
          .catch(() => undefined);
    } catch (e) {
      setErro(frase(e));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
    // Instabilidade no Open Finance (incidente aberto no provedor): avisa antes de a pessoa estranhar.
    avisoDoProvedor().then(setAviso);
  }, [carregar]);

  // Uma conexão estava em andamento (a aba recarregou na volta do banco): retoma de onde parou.
  useEffect(() => {
    const p = lerEspera();
    if (!p) return;
    setPendente(p);
    setFase("autorizar");
    // Recente (a pessoa acabou de voltar do banco): mostra o passo a passo. Mais antiga: só o aviso na
    // tela, com "Ver o passo a passo" e "Cancelar" — sem janela abrindo sozinha.
    setAberta(Date.now() - p.quando < 15 * 60_000);
  }, []);

  // A lista de bancos: os mais usados de cara; digitando, a busca (com uma pausa entre as letras).
  useEffect(() => {
    if (!(conexoes.length === 0 || escolhendo) || fase || conexoes.length >= limite) return;
    const t = setTimeout(() => {
      listarBancos(busca.trim().length >= 2 ? busca.trim() : "")
        .then(setBancos)
        .catch(() => setBancos([]));
    }, busca ? 400 : 0);
    return () => clearTimeout(t);
  }, [busca, conexoes.length, escolhendo, fase, limite]);

  /** Traz contas, saldos e 12 meses de lançamentos do banco recém-ligado. Também o "Tentar de novo". */
  const importar = useCallback(async (itemId: string | null, reconexao = false) => {
    setFalhaImport(null);
    setFase("trazendo");
    setProgresso(reconexao ? "Banco reconectado! Buscando o que faltou…" : "Banco conectado! Preparando a importação…");
    try {
      // Reconexão: desde o último lançamento de cada conta (o resto já está no extrato).
      const r = await trazerTudo({ itemId, dias: reconexao ? undefined : 365, aoAvancar: setProgresso });
      setConexoes(r.conexoes);
      setContas(r.contas);
      setResumo(r.resultado);
      setResultado(textoDoResultado(r.resultado, reconexao ? null : 365));
    } catch (e) {
      if (e instanceof ErroDados && e.motivo === "sem-tabela") setSemTabela(true);
      setFalhaImport(
        e instanceof ErroBanco
          ? e.message
          : "O banco conectou, mas não consegui trazer os dados agora. Toque em “Sincronizar agora” daqui a pouco: nada se perde nem duplica.",
      );
      try {
        setConexoes(await listarConexoes(true));
      } catch {}
    } finally {
      setFase("pronto");
    }
  }, [setProgresso]);

  /** Achou a conexão: fecha a janelinha do banco e TRAZ TUDO sozinho. */
  const concluir = useCallback(
    async (itemId: string | null, banco?: string, reconexao = false) => {
      if (concluindo.current) return;
      concluindo.current = true;
      itemNovo.current = itemId;
      janela.current?.fechar();
      janela.current = null;
      // CHAMA O APP DE VOLTA: fechada a janela do banco, o NovareCash volta para a frente (onde o navegador deixa).
      try {
        window.focus();
      } catch {}
      setAberta(true);
      esquecerEspera();
      setEscolher(null);
      setConfirmar(null);
      setRecado(null);
      if (banco) setPendente((p) => (p ? { ...p, banco } : p));
      await importar(itemId, reconexao);
    },
    [importar],
  );

  // ESPERANDO A AUTORIZAÇÃO: confere sozinho (3 s nos primeiros 3 min, depois 10 s, até 20 min), quando a
  // janelinha fecha e quando a pessoa volta para a aba. Sem exigir a aba à vista: no celular a conferência
  // segue em segundo plano e fecha a aba do banco ao achar.
  useEffect(() => {
    if (fase !== "autorizar") return;
    let parar = false;
    let rodando = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const inicio = Date.now();

    const item = pendente?.item;
    const conferir = async () => {
      if (parar || rodando) return;
      rodando = true;
      setConferindo(true);
      try {
        if (item) {
          // RECONECTAR: o mesmo item volta a ficar em dia (sem claim).
          const c = (await listarConexoes(true)).find((x) => x.itemId === item);
          if (parar) return;
          const renovado = c && !precisaReconectar(c.status) && (c.atualizadoEm === null || c.atualizadoEm > inicio - 5000);
          if (renovado) {
            parar = true;
            void concluir(item, c.banco, true);
          }
          return;
        }
        await iniciando.current?.catch(() => undefined);
        const r = await reivindicar();
        if (parar) return;
        if (r.ok) {
          parar = true;
          void concluir(r.itemId ?? null, r.banco);
        } else if (r.confirmar) {
          parar = true;
          setConfirmar(r.confirmar);
        } else if (r.escolher) {
          parar = true;
          setEscolher(r.escolher);
        } else if (!/ainda não encontramos/i.test(r.mensagem)) {
          parar = true;
          setRecado(r.mensagem);
        }
      } catch (e) {
        // Sessão expirada não se resolve sozinha: para e avisa. O resto (rede oscilando) tenta de novo.
        if (e instanceof ErroBanco && e.motivo === "sessao") {
          parar = true;
          setRecado(e.message);
        }
      } finally {
        rodando = false;
        setConferindo(false);
      }
    };
    const agendar = () => {
      if (parar) return;
      const passou = Date.now() - inicio;
      if (passou > 20 * 60_000) return;
      timer = setTimeout(async () => {
        await conferir();
        agendar();
      }, passou < 3 * 60_000 ? 3000 : 10_000);
    };
    void conferir().then(agendar);

    const olho = setInterval(() => {
      if (janela.current?.fechada()) {
        janela.current = null;
        setJanelaFechou(true);
        void conferir();
      }
    }, 800);
    const aoVoltar = () => {
      if (document.visibilityState === "visible") void conferir();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    window.addEventListener("focus", aoVoltar);
    window.addEventListener("pageshow", aoVoltar);
    return () => {
      window.removeEventListener("pageshow", aoVoltar);
      parar = true;
      clearTimeout(timer);
      clearInterval(olho);
      document.removeEventListener("visibilitychange", aoVoltar);
      window.removeEventListener("focus", aoVoltar);
    };
  }, [fase, concluir, pendente?.item, rodada]);

  function iniciar(p: Pendente, j: JanelaDoBanco | null) {
    janela.current = j;
    concluindo.current = false;
    guardarEspera(p);
    setPendente(p);
    setBloqueada(!j);
    setJanelaFechou(false);
    setResumo(null);
    setFalhaImport(null);
    setProgresso("");
    setEscolher(null);
    setConfirmar(null);
    setRecado(null);
    setResultado(null);
    setEscolhendo(false);
    setFase("autorizar");
    setAberta(true);
  }

  function passouDoLimite() {
    if (conexoes.length < limite) return false;
    setRecado(`O plano ${nomePlano} conecta até ${limite} banco${limite > 1 ? "s" : ""}. Para conectar mais, mude de plano.`);
    return true;
  }

  /** Tocou no banco: a janelinha abre JÁ, no toque (depois de um `await` o navegador bloqueia). */
  function abrirBanco(b: BancoParaConectar) {
    if (passouDoLimite()) return;
    const j = abrirJanelaDoBanco(b.url);
    iniciar({ quando: Date.now(), banco: b.nome, logo: b.logo, url: b.url }, j);
    // O pedido assinado: a hora do toque E o banco escolhido (o claim só aceita conexão desse banco).
    iniciando.current = iniciarConexao(b.id, b.nome);
  }

  /** RECONECTAR o mesmo banco: renova a autorização sem criar outra conexão (nada duplica). */
  async function reconectar(c: Conexao) {
    const j = abrirJanelaDoBanco(null); // no toque, antes do await
    setOcupado(`reconectar:${c.itemId}`);
    try {
      const url = await urlParaReconectar(c.itemId);
      if (!url) {
        j?.fechar();
        setRecado("A página de conexão não está disponível agora. Tente de novo em instantes.");
        return;
      }
      j?.irPara(url);
      iniciar({ quando: Date.now(), banco: c.banco, logo: null, url, item: c.itemId }, j);
    } catch (e) {
      j?.fechar();
      setRecado(frase(e));
    } finally {
      setOcupado(null);
    }
  }

  /** "Atualizar agora": pede ao banco dados novos, espera ele terminar e traz o que faltou. */
  async function atualizarAgora(c: Conexao) {
    setOcupado(`atualizar:${c.itemId}`);
    setResultado(null);
    setProgressoBanco({ item: c.itemId, frase: "Pedindo dados novos ao banco…" });
    try {
      await atualizarNoBanco(c.itemId);
      const r = await trazerTudo({ itemId: c.itemId, aoAvancar: (f) => setProgressoBanco({ item: c.itemId, frase: f }) });
      setConexoes(r.conexoes);
      setContas(r.contas);
      setFalhasBanco([...bancosComFalha()]);
      setResultado(textoDoResultado(r.resultado, null));
    } catch (e) {
      if (e instanceof ErroDados && e.motivo === "sem-tabela") setSemTabela(true);
      else setResultado(frase(e));
    } finally {
      setProgressoBanco(null);
      setOcupado(null);
    }
  }

  /** Reserva: a página geral de conexão, quando a busca de bancos não responde. */
  async function conectar() {
    if (passouDoLimite()) return;
    const j = abrirJanelaDoBanco(null);
    setOcupado("conectar");
    try {
      const url = await urlParaConectar();
      if (!url) {
        j?.fechar();
        setRecado("A página de conexão não está disponível agora. Tente de novo em instantes.");
        return;
      }
      j?.irPara(url);
      iniciar({ quando: Date.now(), banco: "", logo: null, url }, j);
    } catch (e) {
      j?.fechar();
      setRecado(frase(e));
    } finally {
      setOcupado(null);
    }
  }

  function reabrir() {
    if (!pendente?.url) return;
    const j = abrirJanelaDoBanco(pendente.url);
    janela.current = j;
    setBloqueada(!j);
    setJanelaFechou(false);
  }

  function cancelar() {
    janela.current?.fechar();
    janela.current = null;
    esquecerEspera();
    setFase(null);
    setAberta(false);
    setPendente(null);
    setEscolher(null);
    setConfirmar(null);
    setRecado(null);
  }

  /** O X da janela do app: no fim, encerra; antes, só esconde (a conferência e a importação continuam). */
  function fecharJanela() {
    setAberta(false);
    if (fase === "pronto") {
      setFase(null);
      setPendente(null);
    }
  }

  async function conferirAgora(itemId?: string) {
    setOcupado("claim");
    setRecado(null);
    try {
      const r = await reivindicar(itemId ? { itemId } : {});
      if (r.ok) {
        setOcupado(null);
        await concluir(r.itemId ?? itemId ?? null, r.banco);
        return;
      }
      setEscolher(r.escolher ?? null);
      setConfirmar(r.confirmar ?? null);
      setRecado(r.mensagem);
    } catch (e) {
      setRecado(frase(e));
    } finally {
      setOcupado(null);
    }
  }

  function naoEMinha() {
    setConfirmar(null);
    setRecado("Tudo bem: continuamos esperando a SUA conexão. Termine a autorização no seu banco.");
    setRodada((n) => n + 1);
  }

  /** DESLIGAR: revoga no banco, tira o saldo do NovareCash e, se a pessoa quiser, apaga o histórico. */
  async function desconectar(c: Conexao, apagar: boolean) {
    setDesligando(null);
    setOcupado(`forget:${c.itemId}`);
    setResultado(null);
    try {
      const r = await esquecer(c.itemId, apagar);
      setRecado(
        `${c.banco} desligado. ` +
          (apagar
            ? `${r.apagadas ? `${r.apagadas} lançamentos importados foram apagados` : "Os lançamentos importados foram apagados"} e o saldo saiu das suas contas.`
            : "O saldo saiu das suas contas; os lançamentos que já entraram continuam no extrato.") +
          (r.revogado ? "" : " O banco não confirmou o fim da autorização: se ele continuar aparecendo no app do banco, fale com a gente."),
      );
      await carregar();
    } catch (e) {
      setRecado(frase(e));
    } finally {
      setOcupado(null);
    }
  }

  async function sincronizarAgora() {
    setOcupado("sincronizar");
    setResultado(null);
    try {
      setResultado(textoDoResultado(await sincronizar({ contas, conexoes, dias: 90 }), 90));
      marcarSincronizado();
    } catch (e) {
      if (e instanceof ErroDados && e.motivo === "sem-tabela") setSemTabela(true);
      else setResultado(e instanceof ErroBanco ? e.message : "Não consegui gravar agora. Nada foi duplicado; tente de novo.");
    } finally {
      setOcupado(null);
    }
  }

  const nome = pendente?.banco || "seu banco";

  // ── A janela do app: o passo a passo da conexão ──────────────────────────
  const janelaDoApp = fase && aberta && (
    <Janela
      titulo={fase === "autorizar" ? `${pendente?.item ? "Reconectar" : "Conectar"} ${nome}` : fase === "trazendo" ? "Trazendo os seus dados" : falhaImport ? "Quase lá" : "Banco conectado"}
      onFechar={fecharJanela}
    >
      <div className="space-y-3">
        <Passos atual={fase === "autorizar" ? 0 : fase === "trazendo" || falhaImport ? 1 : 2} />

        {/* A CONVERSA (13/11/2026): o passo a passo vira mensagens que aparecem conforme a autorização anda. */}
        <div className="space-y-2.5" aria-live="polite">
          <Bolha>
            {pendente?.item ? (
              <>
                Vamos renovar a autorização do <strong className="text-white">{nome}</strong>. Nada se duplica.
              </>
            ) : (
              <>
                Abri o <strong className="text-white">{nome}</strong> numa janelinha. Autorize lá (no celular pode abrir o app
                do banco) e volte para cá: <strong className="text-white">eu acompanho daqui</strong>.
              </>
            )}
          </Bolha>

          {fase === "autorizar" && bloqueada && (
            <Bolha>
              O navegador segurou a janela do banco. Toque para abrir:
              <span className="mt-2 flex flex-wrap gap-2">
                <Botao Icone={ExternalLink} onClick={reabrir}>
                  Abrir o {nome}
                </Botao>
              </span>
              {pendente?.url && (
                <a
                  href={ponteDoBanco(pendente.url)}
                  target="_blank"
                  rel="noopener"
                  className={`mt-2 block text-2xs font-semibold text-ouro underline underline-offset-2 ${ANEL}`}
                >
                  Não abriu? Toque aqui
                </a>
              )}
            </Bolha>
          )}

          {fase === "autorizar" && janelaFechou && !bloqueada && (
            <Bolha>
              A janela do banco fechou. Se você autorizou, já estou conferindo. Se não, toque em{" "}
              <strong className="text-white">Abrir o banco de novo</strong>.
            </Bolha>
          )}

          {fase === "autorizar" && confirmar && (
            <Bolha>
              {confirmar.final ? (
                <>
                  Achei uma conta {confirmar.banco} terminada em <strong className="tabular-nums text-white">{confirmar.final}</strong>. É a
                  sua?
                </>
              ) : (
                <>Achei uma conexão {confirmar.banco} agora há pouco. É a sua?</>
              )}
              <span className="mt-1 block text-2xs text-white/55">
                Outra pessoa conectou o mesmo banco no mesmo minuto: confira o final da conta.
              </span>
              <span className="mt-2 flex flex-wrap gap-2">
                <Botao Icone={Check} onClick={() => conferirAgora(confirmar.itemId)} desabilitado={ocupado !== null}>
                  Sim, é a minha
                </Botao>
                <Botao variante="contorno" Icone={X} onClick={naoEMinha} desabilitado={ocupado !== null}>
                  Não é
                </Botao>
              </span>
            </Bolha>
          )}

          {fase === "autorizar" && escolher && escolher.length > 1 && (
            <Bolha>
              Qual destes você acabou de conectar?
              <span className="mt-2 grid gap-2">
                {escolher.map((c) => (
                  <Botao key={c.itemId} variante="contorno" Icone={Landmark} onClick={() => conferirAgora(c.itemId)} desabilitado={ocupado !== null}>
                    {c.banco}
                    {c.criado ? ` · ${new Date(c.criado).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : ""}
                  </Botao>
                ))}
              </span>
            </Bolha>
          )}

          {fase === "autorizar" && recado && <Bolha>{recado}</Bolha>}

          {fase === "autorizar" && !confirmar && !(escolher && escolher.length > 1) && (
            <Bolha digitando>{conferindo ? "Conferindo com o banco…" : "Esperando a sua autorização…"}</Bolha>
          )}

          {fase && fase !== "autorizar" && (
            <>
              <Bolha ok>
                <strong className="text-white">
                  {nome} {pendente?.item ? "reconectado" : "conectado"}!
                </strong>
              </Bolha>
              {historico.map((h, i) =>
                i === historico.length - 1 && fase === "trazendo" ? (
                  <Bolha key={i} digitando>
                    {h}
                  </Bolha>
                ) : (
                  <Bolha key={i} ok>
                    {h}
                  </Bolha>
                ),
              )}
              {fase === "trazendo" && !historico.length && <Bolha digitando>{progresso || "Trazendo os seus dados…"}</Bolha>}
            </>
          )}

          {fase === "pronto" && falhaImport && <Bolha>{falhaImport}</Bolha>}

          {fase === "pronto" && !falhaImport && resumo && (
            <Bolha ok>
              {resumo.contas === 0
                ? "O banco ainda não listou as contas: elas chegam sozinhas nas próximas horas. "
                : `${resumo.contas} ${resumo.contas === 1 ? "conta com saldo" : "contas e cartões com saldo"} em dia. `}
              {resumo.lidas === 0
                ? "Os lançamentos ainda não chegaram; busco de novo sozinho."
                : resumo.novas > 0
                  ? `${resumo.novas} lançamentos no seu extrato, já com categoria.`
                  : `${resumo.lidas} lançamentos conferidos: já estavam no extrato.`}
              {resumo.falhas.length > 0 && (
                <span className="mt-1 block text-2xs text-white/60">Não consegui ler: {resumo.falhas.join(", ")}.</span>
              )}
            </Bolha>
          )}
          {fase === "pronto" && !falhaImport && (
            <Bolha>Pronto! Daqui para a frente eu atualizo sozinho sempre que você abrir o NovareCash.</Bolha>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {fase === "autorizar" && (
            <>
              {!bloqueada && pendente?.url && (
                <Botao variante="contorno" Icone={ExternalLink} onClick={reabrir} desabilitado={ocupado !== null}>
                  Abrir o banco de novo
                </Botao>
              )}
              <Botao variante="contorno" Icone={Check} onClick={() => conferirAgora()} desabilitado={ocupado !== null}>
                {ocupado === "claim" ? "Conferindo…" : "Já autorizei"}
              </Botao>
              <Botao variante="fantasma" Icone={X} onClick={cancelar} desabilitado={ocupado !== null}>
                Cancelar
              </Botao>
            </>
          )}
          {fase === "trazendo" && <p className="text-2xs text-white/50">Pode fechar: a importação continua.</p>}
          {fase === "pronto" &&
            (falhaImport ? (
              <Botao Icone={RefreshCw} onClick={() => importar(itemNovo.current)}>
                Tentar de novo
              </Botao>
            ) : (
              <Botao href="/novarecash/app/extrato" Icone={ArrowRight}>
                Ver meu extrato
              </Botao>
            ))}
          {fase === "pronto" && (
            <Botao variante="contorno" onClick={fecharJanela}>
              Fechar
            </Botao>
          )}
        </div>

        <p className="flex items-start gap-1.5 text-2xs leading-relaxed text-white/50">
          <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-[var(--ncash-verde)]" />
          Open Finance do Banco Central · só leitura · ninguém vê a sua senha
        </p>
      </div>
    </Janela>
  );

  if (carregando && !fase) return <Esqueleto linhas={2} />;
  if (erro && !fase) return <AvisoErro titulo="Conexão com o banco indisponível" mensagem={erro} onTentar={carregar} />;

  return (
    <div className="space-y-4">
      {janelaDoApp}

      <p className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-2xs leading-relaxed text-white/70">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--ncash-verde)]" />
        <span>
          Só leitura: o Open Finance compartilha saldo e extrato, e ninguém movimenta dinheiro por aqui. Você pode
          desligar a conexão quando quiser.
        </span>
      </p>

      <p className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/75">
        <span>
          Plano <strong className="text-white">{nomePlano}</strong>: até {limite} banco{limite > 1 ? "s" : ""} ·{" "}
          <span className="tabular-nums">{Math.min(conexoes.length, limite)}</span> em uso
        </span>
        {conexoes.length >= limite && (
          <a href="/novarecash#planos" className="font-semibold text-ouro underline-offset-2 hover:underline">
            Conectar mais bancos: mudar de plano
          </a>
        )}
      </p>

      {semTabela && <AvisoSemTabela />}

      {aviso && (
        <p role="status" className="rounded-xl border border-warning/35 bg-warning/10 px-4 py-3 text-xs leading-relaxed text-white">
          {aviso}
        </p>
      )}
      {falhasBanco.length > 0 && (
        <p role="status" className="rounded-xl border border-warning/35 bg-warning/10 px-4 py-3 text-xs leading-relaxed text-white">
          Não consegui ler {falhasBanco.join(", ")} agora. Os outros bancos seguem em dia; tento de novo na próxima atualização.
        </p>
      )}

      {desligando && !fase && (
        <Janela titulo={`Desligar ${desligando.banco}`} onFechar={() => setDesligando(null)}>
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-white/80">
              O NovareCash para de ler o {desligando.banco} e a autorização é encerrada no Open Finance. O saldo dele sai das suas
              contas. E os lançamentos que já entraram no extrato?
            </p>
            <div className="grid min-w-0 gap-2">
              <Botao className="w-full" variante="contorno" Icone={PowerOff} onClick={() => desconectar(desligando, false)} desabilitado={ocupado !== null}>
                Manter o histórico
              </Botao>
              <Botao className="w-full" variante="perigo" Icone={Trash2} onClick={() => desconectar(desligando, true)} desabilitado={ocupado !== null}>
                Apagar o que foi importado
              </Botao>
              <Botao variante="fantasma" onClick={() => setDesligando(null)}>
                Cancelar
              </Botao>
            </div>
            <p className="text-2xs leading-relaxed text-white/55">
              Apagar não mexe no que você lançou à mão, pelo WhatsApp ou por importação de extrato. Não dá para desfazer.
            </p>
          </div>
        </Janela>
      )}

      {fase && fase !== "pronto" && !aberta ? (
        /* A janela do app foi fechada no meio: a conferência (ou a importação) continua, e daqui ela volta. */
        <Cartao className="flex flex-wrap items-center justify-between gap-3 p-4">
          <span className="flex min-w-0 items-center gap-2.5">
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-ouro motion-reduce:animate-none" />
            <span className="min-w-0 text-sm text-white">
              {fase === "autorizar" ? `Esperando a autorização do ${nome}…` : progresso || "Trazendo os seus dados…"}
            </span>
          </span>
          <span className="flex gap-2">
            <Botao variante="contorno" onClick={() => setAberta(true)}>
              Ver o passo a passo
            </Botao>
            {fase === "autorizar" && (
              <Botao variante="fantasma" Icone={X} onClick={cancelar}>
                Cancelar
              </Botao>
            )}
          </span>
        </Cartao>
      ) : !fase && (conexoes.length === 0 || escolhendo) ? (
        /* A ESCOLHA DO BANCO dentro do app (13/11/2026): só Open Finance, sem a página confusa da mcp.ai. */
        <Cartao guia="banco-conectar" className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-base font-semibold text-white">
              {conexoes.length === 0 ? "Qual é o seu banco?" : "Conectar outro banco"}
            </h2>
            {escolhendo && (
              <button type="button" onClick={() => setEscolhendo(false)} aria-label="Fechar" className={`rounded-lg p-1 text-white/60 hover:text-white ${ANEL}`}>
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-white/70">
            Toque no seu banco: você confirma com ele (leva 1 minuto) e o NovareCash traz contas, saldos e 12 meses de
            lançamentos sozinho. Ninguém vê a sua senha.
          </p>
          <label className="mt-4 flex items-center gap-2 rounded-xl border border-white/15 bg-noite px-3">
            <Search className="h-4 w-4 shrink-0 text-white/50" />
            <span className="sr-only">Buscar banco</span>
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value.slice(0, 40))}
              placeholder="Buscar outro banco…"
              className="ncash-campo min-h-11 w-full bg-transparent text-base text-white outline-none placeholder:text-white/40 sm:text-sm"
            />
          </label>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {bancos === null
              ? Array.from({ length: 6 }).map((_, i) => <span key={i} className="h-12 animate-pulse rounded-xl bg-white/[0.06]" />)
              : bancos.map((b) => (
                  <button
                    key={b.id || b.nome}
                    type="button"
                    onClick={() => abrirBanco(b)}
                    className={`flex min-h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-left text-sm font-semibold text-white transition-colors hover:border-ouro/50 ${ANEL}`}
                  >
                    <LogoBanco logo={b.logo} />
                    <span className="truncate">{b.nome}</span>
                  </button>
                ))}
          </div>
          {bancos !== null && bancos.length === 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-white/60">Não achei esse banco. Tente outro nome (ex.: “Nubank”, “Itaú”) ou abra a lista completa.</p>
              <Botao variante="contorno" Icone={Link2} onClick={conectar} desabilitado={ocupado !== null}>
                {ocupado === "conectar" ? "Abrindo…" : "Ver todos os bancos"}
              </Botao>
            </div>
          )}
        </Cartao>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Botao Icone={RefreshCw} onClick={sincronizarAgora} desabilitado={ocupado !== null || fase !== null || contas.length === 0}>
            {ocupado === "sincronizar" ? "Sincronizando…" : "Sincronizar agora"}
          </Botao>
          <Botao variante="contorno" Icone={Link2} onClick={() => setEscolhendo(true)} desabilitado={ocupado !== null || fase !== null}>
            Conectar outro banco
          </Botao>
          <Botao variante="fantasma" Icone={RefreshCw} onClick={carregar} desabilitado={ocupado !== null || fase !== null}>
            Atualizar lista
          </Botao>
        </div>
      )}

      {recado && !aberta && (
        <p role="status" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs leading-relaxed text-white">
          {recado}
        </p>
      )}

      {resultado && (
        <p role="status" className="rounded-xl border border-ouro/30 bg-ouro/[0.08] px-4 py-3 text-xs leading-relaxed text-white">
          {resultado}{" "}
          <Link href="/novarecash/app/extrato" className={`font-semibold text-ouro underline ${ANEL}`}>
            Ver no extrato
          </Link>
        </p>
      )}

      {conexoes.length > 0 && (
        <section aria-labelledby="titulo-conexoes" data-guia="banco-conexoes" className="space-y-3">
          <h2 id="titulo-conexoes" className="font-display text-base font-semibold text-white">
            Bancos conectados
          </h2>
          <ul className="space-y-2">
            {conexoes.map((c) => {
              const status = statusLegivel(c.status);
              const quando = haQuanto(c.atualizadoEm);
              const reconectarJa = precisaReconectar(c.status);
              const atualizando = progressoBanco?.item === c.itemId;
              return (
                <li key={c.itemId}>
                  <Cartao className="space-y-3 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ciano/15 text-ciano-claro">
                          <Landmark className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-white">{c.banco}</span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                            {status && <Selo tom={TOM_STATUS[status] ?? "alerta"}>{status}</Selo>}
                            {quando && <span className="text-2xs text-white/55">Atualizado {quando}</span>}
                          </span>
                        </span>
                      </span>
                      <span className="flex flex-wrap gap-2">
                        {reconectarJa ? (
                          <Botao Icone={RotateCcw} onClick={() => reconectar(c)} desabilitado={ocupado !== null || fase !== null}>
                            {ocupado === `reconectar:${c.itemId}` ? "Abrindo…" : "Reconectar"}
                          </Botao>
                        ) : (
                          <Botao variante="contorno" Icone={RefreshCw} onClick={() => atualizarAgora(c)} desabilitado={ocupado !== null || fase !== null}>
                            {atualizando ? "Atualizando…" : "Atualizar agora"}
                          </Botao>
                        )}
                        <Botao variante="fantasma" Icone={PowerOff} onClick={() => setDesligando(c)} desabilitado={ocupado !== null || fase !== null}>
                          Desligar
                        </Botao>
                      </span>
                    </div>
                    {reconectarJa && (
                      <p className="text-2xs leading-relaxed text-white/65">
                        A autorização deste banco venceu ou ele pediu uma confirmação. Reconectar renova a mesma conexão: nada duplica.
                      </p>
                    )}
                    {atualizando && (
                      <p className="flex items-center gap-2 text-2xs text-white/70" aria-live="polite">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-ouro motion-reduce:animate-none" />
                        {progressoBanco?.frase}
                      </p>
                    )}
                  </Cartao>
                </li>
              );
            })}
          </ul>

          <h2 className="pt-2 font-display text-base font-semibold text-white">Contas e saldos no banco</h2>
          {contas.length === 0 ? (
            <Cartao className="p-5">
              <p className="text-xs text-white/70">
                O banco ainda não mandou as contas. Isso pode levar alguns minutos depois de conectar: toque em
                Atualizar lista.
              </p>
            </Cartao>
          ) : (
            <ul className="space-y-2">
              {contas.map((c) => (
                <li key={c.id}>
                  <Cartao className="flex flex-wrap items-center justify-between gap-2 p-4">
                    <span className="flex min-w-0 items-center gap-2">
                      {c.cartao ? (
                        <CreditCard className="h-4 w-4 shrink-0 text-ciano-claro" />
                      ) : (
                        <Landmark className="h-4 w-4 shrink-0 text-ciano-claro" />
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-white">
                          {nomeDaConta(
                            c,
                            conexoes.find((x) => x.itemId === c.itemId)?.banco ?? (conexoes.length === 1 ? conexoes[0].banco : null),
                          )}
                        </span>
                        {c.numero && <span className="block text-2xs text-white/55">{c.numero}</span>}
                      </span>
                    </span>
                    {c.cartao && cartoesBanco.get(c.id) ? (
                      <InfoCartao cartao={cartoesBanco.get(c.id)!} saldo={c.saldo} />
                    ) : c.saldo !== null ? (
                      <span className="text-right">
                        <span className="block text-2xs text-white/55">{c.cartao ? "Fatura / saldo" : "Saldo no banco"}</span>
                        <span className="block font-display text-base font-semibold tabular-nums text-white">{brl(c.saldo)}</span>
                        {/* 06/11/2026: conta digital informa R$ 0,00 quando o dinheiro está rendendo num "bolso". */}
                        {c.saldo === 0 && !c.cartao && (
                          <span className="mt-0.5 block max-w-[15rem] text-2xs leading-snug text-white/55">
                            Dinheiro rendendo em cofrinho ou “bolso” nem sempre vem pelo Open Finance. Ajuste em{" "}
                            <Link href="/novarecash/app/extrato" className="underline underline-offset-2">
                              Extrato → Minhas contas
                            </Link>
                            .
                          </span>
                        )}
                      </span>
                    ) : (
                      <Selo>saldo não informado</Selo>
                    )}
                  </Cartao>
                </li>
              ))}
            </ul>
          )}
          <p className="text-2xs leading-relaxed text-white/55">
            O NovareCash atualiza sozinho quando você abre o app (a cada 6 horas, no máximo). &ldquo;Sincronizar
            agora&rdquo; busca na hora os últimos 90 dias. Nada duplica, e a categoria que você corrigir no extrato
            não volta atrás. Transações ainda pendentes no banco entram quando forem confirmadas.
          </p>
        </section>
      )}
    </div>
  );
}

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
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

import { ErroDados } from "@/lib/novarecash/dados";
import {
  ErroBanco,
  abrirJanelaDoBanco,
  contasComSaldo,
  esquecer,
  listarBancos,
  listarConexoes,
  marcarSincronizado,
  nomeDaConta,
  ponteDoBanco,
  reivindicar,
  sincronizar,
  statusLegivel,
  trazerTudo,
  urlParaConectar,
  type BancoParaConectar,
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
type Pendente = { quando: number; banco: string; logo: string | null; url: string | null };
type Fase = "autorizar" | "trazendo" | "pronto";

const CHAVE_ESPERA = "ncash:open-finance:esperando";

function lerEspera(): Pendente | null {
  try {
    const bruto = localStorage.getItem(CHAVE_ESPERA);
    if (!bruto) return null;
    // Até 13/11 a chave guardava só a hora.
    const p: Pendente = /^\d+$/.test(bruto) ? { quando: Number(bruto), banco: "", logo: null, url: null } : JSON.parse(bruto);
    return p && Date.now() - Number(p.quando) < 60 * 60_000 ? p : null;
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

const periodo = (dias: number) => (dias >= 365 ? "nos últimos 12 meses" : `nos últimos ${dias} dias`);

function textoDoResultado(r: ResultadoSincronizacao, dias: number): string {
  const partes: string[] = [];
  if (r.lidas === 0) partes.push(`Nenhuma transação ${periodo(dias)}.`);
  else if (r.novas === 0) partes.push(`Tudo em dia: as ${r.lidas} transações já estavam no seu extrato.`);
  else
    partes.push(
      `${r.novas} ${r.novas === 1 ? "transação entrou" : "transações entraram"} no seu extrato${
        r.jaEstavam ? ` (${r.jaEstavam} já estavam lá)` : ""
      }.`,
    );
  if (r.contas) partes.push(`${r.contas === 1 ? "Saldo atualizado" : `Saldos de ${r.contas} contas atualizados`}.`);
  if (r.falhas.length) partes.push(`Não consegui ler: ${r.falhas.join(", ")}. Tente de novo em instantes.`);
  return partes.join(" ");
}

const TOM_STATUS: Record<string, TomSelo> = { "Em dia": "verde", "Atualizando…": "ouro" };

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
  const [progresso, setProgresso] = useState("");
  const [resumo, setResumo] = useState<ResultadoSincronizacao | null>(null);
  const [falhaImport, setFalhaImport] = useState<string | null>(null);
  const [conferindo, setConferindo] = useState(false);
  const [janelaFechou, setJanelaFechou] = useState(false);
  const [bloqueada, setBloqueada] = useState(false);
  const janela = useRef<JanelaDoBanco | null>(null);
  const concluindo = useRef(false);
  const itemNovo = useRef<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const cx = await listarConexoes();
      setConexoes(cx);
      setContas(cx.length ? await contasComSaldo() : []);
    } catch (e) {
      setErro(frase(e));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Uma conexão estava em andamento (a aba recarregou na volta do banco): retoma de onde parou.
  useEffect(() => {
    const p = lerEspera();
    if (!p) return;
    setPendente(p);
    setFase("autorizar");
    setAberta(true);
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
  const importar = useCallback(async (itemId: string | null) => {
    setFalhaImport(null);
    setFase("trazendo");
    setProgresso("Banco conectado! Preparando a importação…");
    try {
      const r = await trazerTudo({ itemId, dias: 365, aoAvancar: setProgresso });
      setConexoes(r.conexoes);
      setContas(r.contas);
      setResumo(r.resultado);
      setResultado(textoDoResultado(r.resultado, 365));
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
  }, []);

  /** Achou a conexão: fecha a janelinha do banco e TRAZ TUDO sozinho. */
  const concluir = useCallback(
    async (itemId: string | null, banco?: string) => {
      if (concluindo.current) return;
      concluindo.current = true;
      itemNovo.current = itemId;
      janela.current?.fechar();
      janela.current = null;
      esquecerEspera();
      setEscolher(null);
      setRecado(null);
      if (banco) setPendente((p) => (p ? { ...p, banco } : p));
      await importar(itemId);
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

    const conferir = async () => {
      if (parar || rodando) return;
      rodando = true;
      setConferindo(true);
      try {
        const r = await reivindicar();
        if (parar) return;
        if (r.ok) {
          parar = true;
          void concluir(r.itemId ?? null, r.banco);
        } else if (r.escolher) {
          parar = true;
          setEscolher(r.escolher);
        } else if (!/ainda não encontramos/i.test(r.mensagem)) {
          parar = true;
          setRecado(r.mensagem);
        }
      } catch {
        /* rede oscilando: tenta de novo no próximo ciclo */
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
    return () => {
      parar = true;
      clearTimeout(timer);
      clearInterval(olho);
      document.removeEventListener("visibilitychange", aoVoltar);
      window.removeEventListener("focus", aoVoltar);
    };
  }, [fase, concluir]);

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
    // Renova o pedido assinado (a hora do "Conectar") para agora; a lista vem do cache.
    void listarBancos().catch(() => {});
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
      setRecado(r.mensagem);
    } catch (e) {
      setRecado(frase(e));
    } finally {
      setOcupado(null);
    }
  }

  async function desconectar(c: Conexao) {
    if (!window.confirm(`Desligar ${c.banco}? O que já entrou no seu extrato continua lá.`)) return;
    setOcupado(`forget:${c.itemId}`);
    try {
      const revogado = await esquecer(c.itemId);
      if (!revogado) setRecado(`${c.banco} saiu do NovareCash. Para encerrar também a autorização no banco, fale com a gente.`);
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
      titulo={fase === "autorizar" ? `Conectar ${nome}` : fase === "trazendo" ? "Trazendo os seus dados" : falhaImport ? "Quase lá" : "Banco conectado"}
      onFechar={fecharJanela}
    >
      <div className="space-y-4">
        {/* Importação que falhou fica na etapa 2 (não marca "Pronto"). */}
        <Passos atual={fase === "autorizar" ? 0 : fase === "trazendo" || falhaImport ? 1 : 2} />

        {fase === "autorizar" && (
          <>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <LogoBanco logo={pendente?.logo ?? null} grande />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{pendente?.banco || "Seu banco"}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/65" aria-live="polite">
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-ouro motion-reduce:animate-none" />
                  {conferindo ? "Conferindo…" : "Esperando a sua autorização"}
                </p>
              </div>
            </div>

            {bloqueada ? (
              <div className="space-y-3">
                <p className="text-xs leading-relaxed text-white/75">
                  O navegador segurou a janela do banco. Toque abaixo para abrir.
                </p>
                <Botao Icone={ExternalLink} onClick={reabrir}>
                  Abrir o {nome}
                </Botao>
                {pendente?.url && (
                  <a
                    href={ponteDoBanco(pendente.url)}
                    target="_blank"
                    rel="noopener"
                    className={`block text-2xs font-semibold text-ouro underline underline-offset-2 ${ANEL}`}
                  >
                    Não abriu? Toque aqui
                  </a>
                )}
              </div>
            ) : janelaFechou ? (
              <p className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs leading-relaxed text-white/80">
                A janela do banco fechou. Se você terminou a autorização, espere uns segundos: estamos conferindo. Se não
                terminou, toque em <strong className="text-white">Abrir o banco de novo</strong>.
              </p>
            ) : (
              <ol className="space-y-2.5 text-xs leading-relaxed text-white/75">
                {[
                  <>
                    Na janela do <strong className="text-white">{nome}</strong>, confirme o compartilhamento. No celular, o
                    app do banco abre sozinho.
                  </>,
                  <>
                    Quando o banco disser que deu certo, volte para o NovareCash. Se aparecer uma página em inglês
                    (“Connected”), é só fechar.
                  </>,
                  <>A gente percebe sozinho e traz contas, saldos e lançamentos para o seu extrato.</>,
                ].map((texto, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span aria-hidden className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-2xs font-bold text-white">
                      {i + 1}
                    </span>
                    <span>{texto}</span>
                  </li>
                ))}
              </ol>
            )}

            {escolher && escolher.length > 1 && (
              <div className="space-y-2 rounded-2xl border border-ouro/30 bg-ouro/[0.06] p-4">
                <p className="text-xs font-semibold text-white">Qual destes é o seu banco?</p>
                {escolher.map((c) => (
                  <Botao key={c.itemId} variante="contorno" Icone={Landmark} onClick={() => conferirAgora(c.itemId)} desabilitado={ocupado !== null}>
                    {c.banco}
                    {c.criado ? ` · conectado às ${new Date(c.criado).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : ""}
                  </Botao>
                ))}
                <p className="text-2xs text-white/55">Escolha só o que você acabou de conectar. Na dúvida, fale com a gente.</p>
              </div>
            )}

            {recado && (
              <p role="status" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs leading-relaxed text-white">
                {recado}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
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
            </div>
          </>
        )}

        {fase === "trazendo" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Loader2 className="h-9 w-9 animate-spin text-ouro motion-reduce:animate-none" />
            <p className="font-display text-base font-semibold text-white">{pendente?.banco ? `${pendente.banco} conectado!` : "Banco conectado!"}</p>
            <p className="max-w-xs text-xs leading-relaxed text-white/70" aria-live="polite">
              {progresso}
            </p>
            <p className="text-2xs text-white/50">Pode fechar esta janela: a importação continua.</p>
          </div>
        )}

        {fase === "pronto" && (
          <>
            {falhaImport ? (
              <p role="status" className="rounded-xl border border-warning/35 bg-warning/10 px-4 py-3 text-xs leading-relaxed text-white">
                {falhaImport}
              </p>
            ) : (
              <>
                <div className="flex flex-col items-center gap-2 pt-2 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(152_55%_41%/0.15)] text-[var(--ncash-verde)]">
                    <Check className="h-7 w-7" />
                  </span>
                  <p className="font-display text-lg font-semibold text-white">Pronto! {nome} conectado.</p>
                </div>
                {resumo && (
                  <ul className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/85">
                    <li className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ncash-verde)]" />
                      {resumo.contas === 0
                        ? "O banco ainda não listou as contas. Elas chegam sozinhas nas próximas horas."
                        : `${resumo.contas} ${resumo.contas === 1 ? "conta com saldo atualizado" : "contas e cartões com saldo atualizado"}`}
                    </li>
                    <li className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ncash-verde)]" />
                      {resumo.lidas === 0
                        ? "Os lançamentos ainda não chegaram. O NovareCash busca de novo sozinho."
                        : resumo.novas > 0
                          ? `${resumo.novas} lançamentos dos últimos 12 meses no seu extrato, já com categoria`
                          : `${resumo.lidas} lançamentos conferidos: já estavam no seu extrato`}
                    </li>
                    <li className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ncash-verde)]" />
                      Daqui para a frente, atualiza sozinho quando você abre o NovareCash
                    </li>
                    {resumo.falhas.length > 0 && (
                      <li className="text-xs text-white/65">Não consegui ler: {resumo.falhas.join(", ")}. Tente “Sincronizar agora” daqui a pouco.</li>
                    )}
                  </ul>
                )}
              </>
            )}
            <div className="flex flex-wrap gap-2">
              {falhaImport ? (
                <Botao Icone={RefreshCw} onClick={() => importar(itemNovo.current)}>
                  Tentar de novo
                </Botao>
              ) : (
                <Botao href="/novarecash/app/extrato" Icone={ArrowRight}>
                  Ver meu extrato
                </Botao>
              )}
              <Botao variante="contorno" onClick={fecharJanela}>
                Fechar
              </Botao>
            </div>
          </>
        )}

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
              return (
                <li key={c.itemId}>
                  <Cartao className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ciano/15 text-ciano-claro">
                        <Landmark className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-white">{c.banco}</span>
                        {status && (
                          <span className="mt-0.5 block">
                            <Selo tom={TOM_STATUS[status] ?? "alerta"}>{status}</Selo>
                          </span>
                        )}
                      </span>
                    </span>
                    <Botao variante="contorno" Icone={PowerOff} onClick={() => desconectar(c)} desabilitado={ocupado !== null || fase !== null}>
                      Desligar
                    </Botao>
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
                    {c.saldo !== null ? (
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

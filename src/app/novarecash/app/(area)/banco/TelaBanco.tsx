"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, CreditCard, ExternalLink, Landmark, Link2, Loader2, PowerOff, RefreshCw, Search, ShieldCheck, X } from "lucide-react";

import { ErroDados } from "@/lib/novarecash/dados";
import {
  ErroBanco,
  esquecer,
  listarConexoes,
  listarBancos,
  listarContas,
  nomeDaConta,
  reivindicar,
  saldoDaConta,
  sincronizar,
  urlParaConectar,
  type Conexao,
  type BancoParaConectar,
  type CandidataBanco,
  type ContaBanco,
  type ResultadoSincronizacao,
} from "@/lib/novarecash/openfinance";
import { ANEL, AvisoErro, AvisoSemTabela, Botao, Cartao, Esqueleto, Selo, brl } from "../pecas";

/**
 * O fluxo da tela, e é um só:
 *   1. Conectar banco → abre a página do Banco MCP (autorização no banco).
 *   2. Voltou → "Já conectei" faz o `claim` (liga a conexão à conta da pessoa).
 *   3. Lista contas e saldos do banco.
 *   4. "Sincronizar agora" grava contas e saldos em `ncash_contas` e os últimos
 *      90 dias em `ncash_transacoes`, sem duplicar.
 *
 * Nenhum erro técnico chega à tela: tudo passa por `ErroBanco`, que já vem com
 * a frase certa ("a integração está sendo reativada", etc.).
 */

const CHAVE_ESPERA = "ncash:open-finance:esperando";
const esquecerEspera = () => {
  try {
    localStorage.removeItem(CHAVE_ESPERA);
  } catch {}
};

const frase = (e: unknown) =>
  e instanceof ErroBanco ? e.message : "Não consegui falar com o banco agora. Tente de novo em instantes.";

function textoDoResultado(r: ResultadoSincronizacao): string {
  const partes: string[] = [];
  if (r.lidas === 0) partes.push("Nenhuma transação nos últimos 90 dias.");
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
  const [esperandoVolta, setEsperandoVolta] = useState(false);
  /* 12/11/2026: a hora do toque em "Conectar" (o servidor só aceita banco que nasceu depois dela)
     e, se aparecer mais de um banco novo, a lista para a pessoa escolher o dela. */
  const [desde, setDesde] = useState<string | null>(null);
  const [escolher, setEscolher] = useState<CandidataBanco[] | null>(null);
  const [linkManual, setLinkManual] = useState<string | null>(null);
  /* 13/11/2026: a ESCOLHA DO BANCO dentro do app e a ESPERA que sobrevive à volta. No celular, ir ao app
     do banco e voltar recarrega a aba: o "Já conectei" sumia e a pessoa ficava perdida. A espera fica no
     `localStorage` e, ao voltar, o app confere sozinho. */
  const [bancos, setBancos] = useState<BancoParaConectar[] | null>(null);
  const [busca, setBusca] = useState("");
  const [conferindo, setConferindo] = useState(false);
  const [escolhendo, setEscolhendo] = useState(false);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [resultado, setResultado] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const cx = await listarConexoes();
      setConexoes(cx);
      if (cx.length === 0) {
        setContas([]);
        return;
      }
      const cs = await listarContas();
      // Saldo que a lista não trouxe: pede UM POR VEZ (12/11/2026: em paralelo, uma pessoa com 6 contas
      // disparava 6 chamadas juntas no Banco MCP, cujo limite é da conta da Novare inteira).
      const comSaldo: ContaBanco[] = [];
      for (const c of cs) comSaldo.push(c.saldo !== null ? c : { ...c, saldo: await saldoDaConta(c.id).catch(() => null) });
      setContas(comSaldo);
    } catch (e) {
      setErro(frase(e));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // A lista de bancos: os mais usados de cara; digitando, a busca (com uma pausa entre as letras).
  useEffect(() => {
    if (!(conexoes.length === 0 || escolhendo) || esperandoVolta || conexoes.length >= limite) return;
    const t = setTimeout(() => {
      listarBancos(busca.trim().length >= 2 ? busca.trim() : "")
        .then(setBancos)
        .catch(() => setBancos([]));
    }, busca ? 400 : 0);
    return () => clearTimeout(t);
  }, [busca, conexoes.length, escolhendo, esperandoVolta, limite]);

  // Voltou à aba (ou a aba recarregou) com uma conexão em andamento: confere sozinho.
  useEffect(() => {
    let marcado = 0;
    try {
      marcado = Number(localStorage.getItem(CHAVE_ESPERA) || 0);
    } catch {}
    if (marcado && Date.now() - marcado < 60 * 60_000) setEsperandoVolta(true);
  }, []);
  useEffect(() => {
    if (!esperandoVolta) return;
    let tentativas = 0;
    let parar = false;
    const conferir = async () => {
      if (parar || document.visibilityState !== "visible") return;
      tentativas++;
      setConferindo(true);
      try {
        const r = await reivindicar({});
        if (r.ok) {
          parar = true;
          esquecerEspera();
          setRecado(r.mensagem);
          setEsperandoVolta(false);
          await carregar();
        } else if (r.escolher) {
          parar = true;
          setEscolher(r.escolher);
          setRecado(r.mensagem);
        } else if (!/ainda não encontramos/i.test(r.mensagem)) {
          parar = true;
          setRecado(r.mensagem);
        }
      } catch {
        /* rede oscilando: tenta de novo no próximo ciclo */
      } finally {
        setConferindo(false);
      }
    };
    conferir();
    const ciclo = setInterval(() => {
      if (tentativas < 12) conferir();
    }, 6000);
    const aoVoltar = () => {
      if (document.visibilityState === "visible") {
        tentativas = 0;
        conferir();
      }
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      parar = true;
      clearInterval(ciclo);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [esperandoVolta, carregar]);

  /** Abre a autorização do banco escolhido (a janela abre JÁ, no toque, para o navegador não bloquear). */
  function abrirBanco(b: BancoParaConectar) {
    setRecado(null);
    setEscolher(null);
    if (conexoes.length >= limite) {
      setRecado(`O plano ${nomePlano} conecta até ${limite} banco${limite > 1 ? "s" : ""}. Para conectar mais, mude de plano.`);
      return;
    }
    try {
      localStorage.setItem(CHAVE_ESPERA, String(Date.now()));
    } catch {}
    const janela = window.open(b.url, "_blank");
    if (!janela) setLinkManual(b.url);
    setDesde(new Date().toISOString());
    setEscolhendo(false);
    setEsperandoVolta(true);
  }

  function cancelarEspera() {
    esquecerEspera();
    setEsperandoVolta(false);
    setEscolher(null);
    setLinkManual(null);
  }

  async function conectar() {
    setRecado(null);
    if (conexoes.length >= limite) {
      setRecado(`O plano ${nomePlano} conecta até ${limite} banco${limite > 1 ? "s" : ""}. Para conectar mais, mude de plano.`);
      return;
    }
    setLinkManual(null);
    // A janela abre JÁ, no toque: aberta depois de um `await` o navegador a bloqueia.
    const janela = window.open("about:blank", "_blank");
    setOcupado("conectar");
    try {
      const url = await urlParaConectar();
      if (!url) {
        janela?.close();
        setRecado("A página de conexão não está disponível agora. Tente de novo em instantes.");
        return;
      }
      if (janela) janela.location.href = url;
      else setLinkManual(url);
      try {
        localStorage.setItem(CHAVE_ESPERA, String(Date.now()));
      } catch {}
      setEscolhendo(false);
      setDesde(new Date().toISOString());
      setEscolher(null);
      setEsperandoVolta(true);
    } catch (e) {
      janela?.close();
      setRecado(frase(e));
    } finally {
      setOcupado(null);
    }
  }

  async function jaConectei(itemId?: string) {
    setOcupado("claim");
    setRecado(null);
    try {
      const r = await reivindicar({ desde, itemId });
      setRecado(r.mensagem);
      setEscolher(r.escolher ?? null);
      if (r.ok) {
        esquecerEspera();
        setEsperandoVolta(false);
        setDesde(null);
        await carregar();
      }
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
      setResultado(textoDoResultado(await sincronizar({ contas, conexoes, dias: 90 })));
    } catch (e) {
      if (e instanceof ErroDados && e.motivo === "sem-tabela") setSemTabela(true);
      else setResultado(e instanceof ErroBanco ? e.message : "Não consegui gravar agora. Nada foi duplicado; tente de novo.");
    } finally {
      setOcupado(null);
    }
  }

  if (carregando) return <Esqueleto linhas={2} />;
  if (erro) return <AvisoErro titulo="Conexão com o banco indisponível" mensagem={erro} onTentar={carregar} />;

  return (
    <div className="space-y-4">
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

      {esperandoVolta ? (
        /* A ESPERA (13/11/2026): a pessoa foi ao banco. O app confere sozinho a cada 6 s e quando a aba volta. */
        <Cartao guia="banco-conectar" className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-ouro motion-reduce:animate-none" />
            <div>
              <h2 className="font-display text-base font-semibold text-white">Esperando o seu banco…</h2>
              <p className="mt-1 text-xs leading-relaxed text-white/70">
                Confirme no app ou no site do seu banco. Quando aparecer <strong className="text-white">“Pronto”</strong> ou{" "}
                <strong className="text-white">“Connected”</strong>, é só voltar para esta tela: a gente confere sozinho.
                {conferindo ? " Conferindo agora…" : ""}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Botao variante="contorno" Icone={Check} onClick={() => jaConectei()} desabilitado={ocupado !== null}>
              {ocupado === "claim" ? "Conferindo…" : "Já voltei, conferir agora"}
            </Botao>
            <Botao variante="fantasma" Icone={X} onClick={cancelarEspera} desabilitado={ocupado !== null}>
              Cancelar
            </Botao>
          </div>
          {linkManual && (
            <a
              href={linkManual}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-ouro underline"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Abrir a autorização do banco
            </a>
          )}
        </Cartao>
      ) : conexoes.length === 0 || escolhendo ? (
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
            Toque no seu banco: você confirma no app dele (leva 1 minuto) e volta para cá. Ninguém vê a sua senha.
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
                    {b.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.logo} alt="" className="h-6 w-6 shrink-0 rounded-md bg-white object-contain" />
                    ) : (
                      <Landmark className="h-5 w-5 shrink-0 text-ouro" />
                    )}
                    <span className="truncate">{b.nome}</span>
                  </button>
                ))}
          </div>
          {bancos !== null && bancos.length === 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-white/60">Não achei esse banco. Tente outro nome (ex.: “Nubank”, “Itaú”) ou abra a lista completa.</p>
              {/* Reserva: a página geral de conexão, caso a busca de bancos não responda. */}
              <Botao variante="contorno" Icone={Link2} onClick={conectar} desabilitado={ocupado !== null}>
                {ocupado === "conectar" ? "Abrindo…" : "Ver todos os bancos"}
              </Botao>
            </div>
          )}
        </Cartao>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Botao
            Icone={RefreshCw}
            onClick={sincronizarAgora}
            desabilitado={ocupado !== null || contas.length === 0}
          >
            {ocupado === "sincronizar" ? "Sincronizando…" : "Sincronizar agora"}
          </Botao>
          <Botao variante="contorno" Icone={Link2} onClick={() => setEscolhendo(true)} desabilitado={ocupado !== null}>
            Conectar outro banco
          </Botao>
          <Botao variante="fantasma" Icone={RefreshCw} onClick={carregar} desabilitado={ocupado !== null}>
            Atualizar lista
          </Botao>
        </div>
      )}

      {escolher && escolher.length > 1 && (
        <Cartao className="space-y-2 p-4">
          <p className="text-xs font-semibold text-white">Qual destes é o seu banco?</p>
          {escolher.map((c) => (
            <Botao key={c.itemId} variante="contorno" Icone={Landmark} onClick={() => jaConectei(c.itemId)} desabilitado={ocupado !== null}>
              {c.banco}
              {c.criado ? ` · conectado às ${new Date(c.criado).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : ""}
            </Botao>
          ))}
          <p className="text-2xs text-white/55">Escolha só o que você acabou de conectar. Na dúvida, fale com a gente.</p>
        </Cartao>
      )}

      {recado && (
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
            {conexoes.map((c) => (
              <li key={c.itemId}>
                <Cartao className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span
                      aria-hidden
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ciano/15 text-ciano-claro"
                    >
                      <Landmark className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-white">{c.banco}</span>
                      {c.status && <span className="block text-2xs text-white/55">{c.status}</span>}
                    </span>
                  </span>
                  <Botao
                    variante="contorno"
                    Icone={PowerOff}
                    onClick={() => desconectar(c)}
                    desabilitado={ocupado !== null}
                  >
                    Desligar
                  </Botao>
                </Cartao>
              </li>
            ))}
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
            &ldquo;Sincronizar agora&rdquo; traz os últimos 90 dias de todas as contas e atualiza os saldos. Rodar de
            novo não duplica nada, e a categoria que você corrigir no extrato não volta atrás. Transações ainda
            pendentes no banco entram quando forem confirmadas.
          </p>
        </section>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, CreditCard, ExternalLink, Landmark, Link2, PowerOff, RefreshCw, ShieldCheck } from "lucide-react";

import { ErroDados } from "@/lib/novarecash/dados";
import {
  ErroBanco,
  esquecer,
  listarConexoes,
  listarContas,
  reivindicar,
  saldoDaConta,
  sincronizar,
  urlParaConectar,
  type Conexao,
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

export function TelaBanco() {
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [semTabela, setSemTabela] = useState(false);
  const [conexoes, setConexoes] = useState<Conexao[]>([]);
  const [contas, setContas] = useState<ContaBanco[]>([]);
  const [recado, setRecado] = useState<string | null>(null);
  const [esperandoVolta, setEsperandoVolta] = useState(false);
  const [linkManual, setLinkManual] = useState<string | null>(null);
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
      // Saldo que a lista não trouxe: pede um a um, sem derrubar a tela se falhar.
      setContas(
        await Promise.all(
          cs.map(async (c) => (c.saldo !== null ? c : { ...c, saldo: await saldoDaConta(c.id).catch(() => null) })),
        ),
      );
    } catch (e) {
      setErro(frase(e));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function conectar() {
    setRecado(null);
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
      setEsperandoVolta(true);
    } catch (e) {
      janela?.close();
      setRecado(frase(e));
    } finally {
      setOcupado(null);
    }
  }

  async function jaConectei() {
    setOcupado("claim");
    setRecado(null);
    try {
      const r = await reivindicar();
      setRecado(r.mensagem);
      if (r.ok) {
        setEsperandoVolta(false);
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
      await esquecer(c.itemId);
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

      {semTabela && <AvisoSemTabela />}

      {conexoes.length === 0 || esperandoVolta ? (
        <Cartao guia="banco-conectar" className="p-5 sm:p-6">
          <h2 className="font-display text-base font-semibold text-white">
            {conexoes.length === 0 ? "Conectar o seu banco" : "Conectar outro banco"}
          </h2>
          <ol className="mt-3 space-y-2 text-xs leading-relaxed text-white/70">
            <li>
              1. Toque em <strong className="text-white">Conectar banco</strong>: abre a página segura do Open Finance.
            </li>
            <li>2. Escolha o seu banco e autorize no app ou site dele.</li>
            <li>
              3. Volte para cá e toque em <strong className="text-white">Já conectei</strong>.
            </li>
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            <Botao Icone={Link2} onClick={conectar} desabilitado={ocupado !== null}>
              {ocupado === "conectar" ? "Abrindo…" : "Conectar banco"}
            </Botao>
            {esperandoVolta && (
              <Botao variante="contorno" Icone={Check} onClick={jaConectei} desabilitado={ocupado !== null}>
                {ocupado === "claim" ? "Conferindo…" : "Já conectei"}
              </Botao>
            )}
          </div>
          {linkManual && (
            <a
              href={linkManual}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-ouro underline"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Abrir a página do Open Finance
            </a>
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
          <Botao variante="contorno" Icone={Link2} onClick={conectar} desabilitado={ocupado !== null}>
            Conectar outro banco
          </Botao>
          <Botao variante="fantasma" Icone={RefreshCw} onClick={carregar} desabilitado={ocupado !== null}>
            Atualizar lista
          </Botao>
        </div>
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
                        <span className="block truncate text-sm font-semibold text-white">{c.nome}</span>
                        {c.numero && <span className="block text-2xs text-white/55">{c.numero}</span>}
                      </span>
                    </span>
                    {c.saldo !== null ? (
                      <span className="text-right">
                        <span className="block text-2xs text-white/55">{c.cartao ? "Fatura / saldo" : "Saldo no banco"}</span>
                        <span className="block font-display text-base font-semibold tabular-nums text-white">{brl(c.saldo)}</span>
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

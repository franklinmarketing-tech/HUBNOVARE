"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, LogOut, MailPlus, MessageCircle, Trash2, Users, X } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { ErroDados } from "@/lib/novarecash/dados";
import {
  aceitarConvite,
  convidar,
  convitesParaMim,
  lerMembros,
  removerMembro,
  sairDoGrupo,
  type ConviteParaMim,
  type Membro,
} from "@/lib/novarecash/ajustes";
import { AvisoSemTabelaExtras } from "../AvisoExtras";
import { Janela } from "../Janela";
import { AvisoErro, Botao, CAMPO, Cartao, Esqueleto, ROTULO_CAMPO, Selo } from "../pecas";

/**
 * CONTA COMPARTILHADA (casal/família) — `supabase/novarecash_compartilhar.sql`.
 *
 * - O DONO (quem assina) convida pelo e-mail, vê quem aceitou e remove.
 * - O CONVIDADO, logado com aquele e-mail, aceita (`ncash_aceitar_convite`) ou
 *   recusa/sai (`ncash_sair_do_grupo`, em `novarecash_extras.sql`).
 * - Quem aceitou trabalha no NovareCash do dono: os dois veem e lançam TUDO.
 *
 * `modo="convite"` é a página `/novarecash/convite`, que fica FORA da porta do
 * app: o convidado ainda não tem acesso (só passa a ter depois de aceitar), e
 * por isso não chegaria a Ajustes. Lá só aparecem os convites para ele.
 *
 * Aceitar ou sair muda de quem é o NovareCash aberto: a página recarrega
 * inteira, para nenhuma tela continuar mostrando o NovareCash anterior.
 */

type Estado = "carregando" | "pronto" | "sem-tabela" | "erro";
type Confirmar =
  | { tipo: "sair"; convite: ConviteParaMim }
  | { tipo: "remover"; membro: Membro }
  | null;

const JUNTOS =
  "Quem entra vê e lança TUDO junto com o titular: extrato, contas, cartões, orçamento, metas e o que chega pelo banco e pelo WhatsApp. Não existe parte escondida.";

export function ContaCompartilhada({
  eu,
  meuEmail,
  modo = "ajustes",
}: {
  eu: string;
  meuEmail: string;
  modo?: "ajustes" | "convite";
}) {
  const sb = useMemo(() => createClient(), []);
  const [estado, setEstado] = useState<Estado>("carregando");
  const [convites, setConvites] = useState<ConviteParaMim[]>([]);
  const [membros, setMembros] = useState<Membro[]>([]);
  const [email, setEmail] = useState("");
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [recado, setRecado] = useState<{ tom: "ok" | "aviso"; texto: string } | null>(null);
  const [acabouDeConvidar, setAcabouDeConvidar] = useState(false);
  const [confirmar, setConfirmar] = useState<Confirmar>(null);
  const [copiado, setCopiado] = useState(false);

  const carregar = useCallback(async () => {
    setEstado("carregando");
    try {
      const [cs, ms] = await Promise.all([
        convitesParaMim(sb, meuEmail),
        modo === "ajustes" ? lerMembros(sb, eu) : Promise.resolve([]),
      ]);
      setConvites(cs);
      setMembros(ms);
      setEstado("pronto");
    } catch (e) {
      setEstado(e instanceof ErroDados && e.motivo === "sem-tabela" ? "sem-tabela" : "erro");
    }
  }, [sb, eu, meuEmail, modo]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // O mesmo critério de `ncash_dono_atual()`: o aceite mais recente.
  const grupo =
    convites
      .filter((c) => c.status === "aceito")
      .sort((a, b) => String(b.aceito_em ?? "").localeCompare(String(a.aceito_em ?? "")))[0] ?? null;
  const pendentes = convites.filter((c) => c.status === "convidado");
  const linkConvite = typeof window === "undefined" ? "/novarecash/convite" : `${window.location.origin}/novarecash/convite`;

  async function aceitar(c: ConviteParaMim) {
    setOcupado(`aceitar:${c.dono_id}`);
    setRecado(null);
    try {
      if (await aceitarConvite(sb, c.dono_id)) {
        window.location.assign("/novarecash/app");
        return;
      }
      setRecado({ tom: "aviso", texto: "Não achei esse convite no seu e-mail. Peça ao titular para convidar de novo." });
      await carregar();
    } catch {
      setRecado({ tom: "aviso", texto: "Não consegui aceitar agora. Tente de novo em instantes." });
    } finally {
      setOcupado(null);
    }
  }

  async function sair(c: ConviteParaMim) {
    setOcupado(`sair:${c.dono_id}`);
    setRecado(null);
    try {
      await sairDoGrupo(sb, c.dono_id);
      setConfirmar(null);
      if (c.status === "aceito") {
        window.location.assign(modo === "convite" ? "/novarecash" : "/novarecash/app");
        return;
      }
      setRecado({ tom: "ok", texto: "Convite recusado." });
      await carregar();
    } catch (e) {
      setConfirmar(null);
      setRecado({
        tom: "aviso",
        texto:
          e instanceof ErroDados && e.motivo === "sem-tabela"
            ? "Sair ainda não está instalado (falta rodar supabase/novarecash_extras.sql). Peça ao titular para remover você."
            : "Não consegui agora. Tente de novo em instantes.",
      });
    } finally {
      setOcupado(null);
    }
  }

  async function enviarConvite(e: React.FormEvent) {
    e.preventDefault();
    setOcupado("convidar");
    setRecado(null);
    setAcabouDeConvidar(false);
    try {
      const erro = await convidar(sb, eu, meuEmail, email);
      if (erro) {
        setRecado({ tom: "aviso", texto: erro });
        return;
      }
      setEmail("");
      setAcabouDeConvidar(true);
      setMembros(await lerMembros(sb, eu));
    } catch {
      setRecado({ tom: "aviso", texto: "Não consegui enviar o convite agora. Tente de novo em instantes." });
    } finally {
      setOcupado(null);
    }
  }

  async function remover(m: Membro) {
    setOcupado(`remover:${m.email}`);
    try {
      await removerMembro(sb, eu, m.email);
      setConfirmar(null);
      setMembros((ms) => ms.filter((x) => x.email !== m.email));
      setRecado({ tom: "ok", texto: `${m.email} não vê mais o seu NovareCash.` });
    } catch {
      setConfirmar(null);
      setRecado({ tom: "aviso", texto: "Não consegui remover agora. Tente de novo em instantes." });
    } finally {
      setOcupado(null);
    }
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(linkConvite);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      /* sem permissão de área de transferência: o link continua visível na tela */
    }
  }

  if (estado === "carregando") return <Esqueleto linhas={2} />;
  if (estado === "sem-tabela") {
    return <AvisoSemTabelaExtras oQue="A conta compartilhada" arquivo="supabase/novarecash_compartilhar.sql" />;
  }
  if (estado === "erro") {
    return <AvisoErro mensagem="Não consegui ler os convites agora. Nada foi alterado." onTentar={carregar} />;
  }

  return (
    <div className="space-y-3">
      {recado && (
        <p
          role="status"
          className={`rounded-xl border px-4 py-3 text-xs ${
            recado.tom === "ok"
              ? "border-[hsl(152_55%_41%/0.4)] bg-[hsl(152_55%_41%/0.12)] text-[hsl(152_60%_62%)]"
              : "border-warning/35 bg-warning/10 text-warning-claro"
          }`}
        >
          {recado.texto}
        </p>
      )}

      {grupo && (
        <Cartao className="border-ouro/30 p-4 sm:p-5">
          <p className="flex items-center gap-2 font-display text-base font-semibold text-white">
            <Users className="h-4 w-4 shrink-0 text-ouro" />
            <span className="min-w-0 break-words">Você está no NovareCash de {grupo.dono_nome}</span>
          </p>
          <p className="mt-1 text-xs leading-relaxed text-white/75">{JUNTOS}</p>
          <p className="mt-1 text-xs leading-relaxed text-white/60">
            O que você tinha lançado no seu próprio NovareCash continua guardado e volta a aparecer se você sair.
          </p>
          <div className="mt-3">
            <Botao variante="perigo" Icone={LogOut} onClick={() => setConfirmar({ tipo: "sair", convite: grupo })}>
              Sair deste NovareCash
            </Botao>
          </div>
        </Cartao>
      )}

      {pendentes.map((c) => (
        <Cartao key={c.dono_id} className="border-ouro/40 bg-ouro/[0.06] p-4 sm:p-5">
          <p className="font-display text-base font-semibold text-white">
            Você foi convidado para o NovareCash de <span className="break-words text-ouro">{c.dono_nome}</span>
          </p>
          <p className="mt-1 text-xs leading-relaxed text-white/75">{JUNTOS}</p>
          <p className="mt-1 text-xs leading-relaxed text-white/60">
            {grupo
              ? `Aceitando, você passa a usar o NovareCash de ${c.dono_nome} no lugar do de ${grupo.dono_nome}.`
              : "Aceitando, o app passa a abrir o NovareCash dessa pessoa. Você não precisa assinar."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Botao Icone={Check} onClick={() => aceitar(c)} desabilitado={ocupado !== null}>
              {ocupado === `aceitar:${c.dono_id}` ? "Aceitando…" : "Aceitar convite"}
            </Botao>
            <Botao variante="fantasma" Icone={X} onClick={() => sair(c)} desabilitado={ocupado !== null}>
              Recusar
            </Botao>
          </div>
        </Cartao>
      ))}

      {modo === "convite" && !grupo && pendentes.length === 0 && (
        <Cartao className="p-5">
          <p className="font-display text-base font-semibold text-white">Nenhum convite para {meuEmail}</p>
          <p className="mt-1 text-xs leading-relaxed text-white/70">
            O convite vale para o e-mail exato que o titular digitou. Confira com ele qual e-mail foi usado e entre com
            essa conta.
          </p>
        </Cartao>
      )}

      {modo === "ajustes" && !grupo && (
        <Cartao className="p-4 sm:p-5">
          <p className="rounded-xl border border-ciano/30 bg-ciano/10 px-3 py-2.5 text-xs leading-relaxed text-ciano-claro">
            <strong className="font-semibold">Atenção:</strong> {JUNTOS.replace("o titular", "você")} Convide só quem divide as
            finanças com você.
          </p>

          <form onSubmit={enviarConvite} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="block min-w-0 flex-1">
              <span className={ROTULO_CAMPO}>E-mail da pessoa</span>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@exemplo.com"
                className={`${CAMPO} mt-1`}
              />
            </label>
            <Botao type="submit" Icone={MailPlus} desabilitado={ocupado !== null || !email.trim()}>
              {ocupado === "convidar" ? "Convidando…" : "Convidar"}
            </Botao>
          </form>

          {acabouDeConvidar && (
            <div className="mt-3 rounded-xl border border-white/10 bg-noite p-3">
              <p className="text-xs leading-relaxed text-white/80">
                Convite criado. Avise a pessoa: ela entra (ou cria a conta) com esse mesmo e-mail e abre este link para aceitar:
              </p>
              <p className="mt-1.5 break-all font-mono text-2xs text-ouro">{linkConvite}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Botao variante="contorno" Icone={copiado ? Check : Copy} onClick={copiar}>
                  {copiado ? "Copiado" : "Copiar link"}
                </Botao>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Te convidei para o nosso NovareCash. Entre com este e-mail e aceite aqui: ${linkConvite}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold text-white hover:border-ouro/60 hover:bg-white/[0.04]"
                >
                  <MessageCircle className="h-4 w-4" />
                  Mandar no WhatsApp
                </a>
              </div>
            </div>
          )}

          <div className="mt-5">
            <p className="text-2xs font-semibold uppercase tracking-wider text-white/55">Quem tem acesso</p>
            {membros.length === 0 ? (
              <p className="mt-2 text-xs leading-relaxed text-white/65">
                Ninguém além de você. Convide o seu par ou alguém da família pelo e-mail acima.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-white/[0.07] rounded-xl border border-white/10">
                {membros.map((m) => (
                  <li key={m.email} className="flex items-center gap-2 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="break-all text-sm text-white">{m.email}</p>
                      <div className="mt-0.5">
                        {m.status === "aceito" ? (
                          <Selo tom="verde">
                            Aceitou
                            {m.aceito_em ? ` em ${new Date(m.aceito_em).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}` : ""}
                          </Selo>
                        ) : (
                          <Selo tom="alerta">Ainda não aceitou</Selo>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfirmar({ tipo: "remover", membro: m })}
                      aria-label={`Remover ${m.email}`}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-accent-claro hover:bg-accent-claro/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ouro"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Cartao>
      )}

      {confirmar?.tipo === "sair" && (
        <Janela titulo={`Sair do NovareCash de ${confirmar.convite.dono_nome}?`} onFechar={() => setConfirmar(null)}>
          <p className="text-sm leading-relaxed text-white/80">
            Você deixa de ver e de lançar no NovareCash dessa pessoa. Nada do que foi lançado é apagado. Sem assinatura
            própria, você perde o acesso ao app até ser convidado de novo.
          </p>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Botao variante="fantasma" onClick={() => setConfirmar(null)} desabilitado={ocupado !== null}>
              Ficar
            </Botao>
            <Botao variante="perigo" Icone={LogOut} onClick={() => sair(confirmar.convite)} desabilitado={ocupado !== null}>
              {ocupado ? "Saindo…" : "Sair"}
            </Botao>
          </div>
        </Janela>
      )}

      {confirmar?.tipo === "remover" && (
        <Janela titulo="Remover o acesso?" onFechar={() => setConfirmar(null)}>
          <p className="break-words text-sm leading-relaxed text-white/80">
            <strong className="text-white">{confirmar.membro.email}</strong> deixa de ver e de lançar no seu NovareCash.
            Nada do que essa pessoa lançou é apagado.
          </p>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Botao variante="fantasma" onClick={() => setConfirmar(null)} desabilitado={ocupado !== null}>
              Manter
            </Botao>
            <Botao variante="perigo" Icone={Trash2} onClick={() => remover(confirmar.membro)} desabilitado={ocupado !== null}>
              {ocupado ? "Removendo…" : "Remover"}
            </Botao>
          </div>
        </Janela>
      )}
    </div>
  );
}

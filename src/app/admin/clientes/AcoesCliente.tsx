"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bell, Check, Loader2, Mail, MessageCircle, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EscreverEmail, linkWhatsApp } from "../EscreverEmail";
import { CAMPO, Campo, Janela } from "../Janela";

export type Cliente = {
  id: string;
  nome: string | null;
  email: string;
  telefone: string | null;
  cidade: string | null;
  uf: string | null;
  profissao: string | null;
  objetivo: string | null;
  papel: string;
  aceita_email: boolean;
  criado_em: string;
  ultimo_acesso: string | null;
  ultimo_lancamento: string | null;
  leads: number;
  mensagens: number;
};

/** Mensagem curta para "falta rodar o SQL", em vez do inglês do PostgREST. */
function traduzir(msg: string) {
  if (/could not find the function|PGRST202/i.test(msg))
    return "Falta rodar o SQL painel_v2_INSTALAR.sql no Supabase.";
  if (/row-level security|42501/i.test(msg)) return "Seu papel não permite isso.";
  return msg;
}

/**
 * O QUE DÁ PARA FAZER COM UM CLIENTE.
 *
 * Editar o cadastro, mudar o papel (só admin), escrever, avisar no sino e
 * chamar no WhatsApp. Tudo sem sair da lista.
 */
export function AcoesCliente({
  cliente,
  souAdmin,
  meuId,
}: {
  cliente: Cliente;
  souAdmin: boolean;
  meuId: string;
}) {
  const [editando, setEditando] = useState(false);
  const [escrevendo, setEscrevendo] = useState(false);
  const [avisando, setAvisando] = useState(false);

  const zap = linkWhatsApp(cliente.telefone, cliente.nome);
  const botao =
    "flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary";

  return (
    <>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-semibold text-white transition-colors hover:bg-primary-soft"
        >
          <Pencil className="h-3.5 w-3.5" strokeWidth={2.2} />
          Editar
        </button>

        <button
          type="button"
          onClick={() => setEscrevendo(true)}
          disabled={!cliente.aceita_email}
          aria-label={`Escrever para ${cliente.nome ?? cliente.email}`}
          title={cliente.aceita_email ? "Escrever um e-mail" : "Esta pessoa pediu para não receber e-mail"}
          className={`${botao} disabled:cursor-not-allowed disabled:opacity-35`}
        >
          <Mail className="h-4 w-4" strokeWidth={2} />
        </button>

        <button
          type="button"
          onClick={() => setAvisando(true)}
          aria-label={`Avisar ${cliente.nome ?? cliente.email} no sino`}
          title="Mandar um aviso que aparece no sino dela"
          className={botao}
        >
          <Bell className="h-4 w-4" strokeWidth={2} />
        </button>

        {zap ? (
          <a
            href={zap}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`WhatsApp de ${cliente.nome ?? cliente.email}`}
            title="Abrir no WhatsApp com a mensagem pronta"
            className={`${botao} hover:border-success/50 hover:text-success`}
          >
            <MessageCircle className="h-4 w-4" strokeWidth={2} />
          </a>
        ) : (
          <span title="Sem telefone no cadastro" className={`${botao} cursor-not-allowed opacity-35`}>
            <MessageCircle className="h-4 w-4" strokeWidth={2} />
          </span>
        )}
      </div>

      <EditarCliente
        aberta={editando}
        aoFechar={() => setEditando(false)}
        cliente={cliente}
        souAdmin={souAdmin}
        souEu={cliente.id === meuId}
      />

      <EscreverEmail
        aberta={escrevendo}
        aoFechar={() => setEscrevendo(false)}
        para={cliente.email}
        nome={cliente.nome}
        usuarioId={cliente.id}
      />

      <AvisarCliente aberta={avisando} aoFechar={() => setAvisando(false)} cliente={cliente} />
    </>
  );
}

/* ═══ EDITAR ═══════════════════════════════════════════════════════════ */

const PAPEIS = [
  { valor: "cliente", rotulo: "Cliente", dica: "Usa o Hub e o FINCASH." },
  { valor: "equipe", rotulo: "Equipe", dica: "Painel: leads, clientes, iscas e avisos." },
  { valor: "admin", rotulo: "Admin", dica: "Tudo, inclusive mudar o papel dos outros." },
] as const;

function EditarCliente({
  aberta,
  aoFechar,
  cliente,
  souAdmin,
  souEu,
}: {
  aberta: boolean;
  aoFechar: () => void;
  cliente: Cliente;
  souAdmin: boolean;
  souEu: boolean;
}) {
  const router = useRouter();
  const [v, setV] = useState({
    nome: cliente.nome ?? "",
    telefone: cliente.telefone ?? "",
    cidade: cliente.cidade ?? "",
    uf: cliente.uf ?? "",
    profissao: cliente.profissao ?? "",
    objetivo: cliente.objetivo ?? "",
    aceita_email: cliente.aceita_email,
  });
  const [papel, setPapel] = useState(cliente.papel);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const muda = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setV((s) => ({ ...s, [k]: e.target.value }));

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    const supabase = createClient();

    const { error } = await supabase.rpc("hub_cliente_salvar", {
      p_id: cliente.id,
      p_nome: v.nome,
      p_telefone: v.telefone,
      p_cidade: v.cidade,
      p_uf: v.uf,
      p_profissao: v.profissao,
      p_objetivo: v.objetivo,
      p_aceita_email: v.aceita_email,
    });
    if (error) {
      setSalvando(false);
      setErro(traduzir(error.message));
      return;
    }

    /* O papel é uma escrita SEPARADA e só de admin. Só vai ao banco se
       mudou — mandar sempre faria todo "salvar" de quem é equipe falhar. */
    if (souAdmin && papel !== cliente.papel) {
      const { error: erroPapel } = await supabase.rpc("hub_cliente_papel", {
        p_id: cliente.id,
        p_papel: papel,
      });
      if (erroPapel) {
        setSalvando(false);
        setErro(
          /proprio acesso/i.test(erroPapel.message)
            ? "O cadastro foi salvo, mas você não pode tirar o seu próprio acesso de admin."
            : `O cadastro foi salvo, mas o papel não: ${traduzir(erroPapel.message)}`,
        );
        router.refresh();
        return;
      }
    }

    setSalvando(false);
    aoFechar();
    router.refresh();
  }

  return (
    <Janela
      aberta={aberta}
      aoFechar={aoFechar}
      titulo={cliente.nome?.trim() || "Editar cliente"}
      subtitulo={cliente.email}
      largura="lg"
    >
      <form onSubmit={salvar} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Nome">
            <input value={v.nome} onChange={muda("nome")} className={CAMPO} />
          </Campo>
          <Campo rotulo="Telefone" dica="Com DDD. O WhatsApp sai daqui.">
            <input type="tel" value={v.telefone} onChange={muda("telefone")} className={CAMPO} placeholder="(19) 99999-9999" />
          </Campo>
          <Campo rotulo="Cidade">
            <input value={v.cidade} onChange={muda("cidade")} className={CAMPO} />
          </Campo>
          <Campo rotulo="UF">
            <input value={v.uf} onChange={muda("uf")} maxLength={2} className={`${CAMPO} uppercase`} placeholder="SP" />
          </Campo>
          <Campo rotulo="Profissão">
            <input value={v.profissao} onChange={muda("profissao")} className={CAMPO} />
          </Campo>
          {/* ⚠️ O e-mail aparece, mas não é editável: é o login. Trocar daqui
              deixaria a pessoa sem conseguir entrar, sem aviso. */}
          <Campo rotulo="E-mail" dica="É o login — só a própria pessoa troca.">
            <input value={cliente.email} readOnly className={`${CAMPO} bg-slate-50 text-muted-foreground`} />
          </Campo>
        </div>

        <Campo rotulo="O que essa pessoa quer" dica="Objetivo, contexto, o que foi dito na conversa.">
          <textarea value={v.objetivo} onChange={muda("objetivo")} rows={3} className={`${CAMPO} resize-y`} />
        </Campo>

        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border px-3.5 py-2.5">
          <input
            type="checkbox"
            checked={v.aceita_email}
            onChange={(e) => setV((s) => ({ ...s, aceita_email: e.target.checked }))}
            className="h-4 w-4 accent-[hsl(215_50%_23%)]"
          />
          <span className="text-sm">
            <span className="font-semibold text-foreground">Aceita receber e-mail</span>
            <span className="block text-2xs text-muted-foreground">
              Desmarcado, o botão de e-mail fica travado. Respeite o "não".
            </span>
          </span>
        </label>

        {/* O PAPEL — só aparece para admin. Para equipe, mostrar e travar
            seria um convite a pedir acesso que ela não deve ter. */}
        {souAdmin && (
          <fieldset>
            <legend className="text-xs font-semibold text-foreground">Acesso</legend>
            <div className="mt-1.5 grid gap-2 sm:grid-cols-3">
              {PAPEIS.map((p) => {
                const ativo = papel === p.valor;
                const travado = souEu && p.valor !== "admin";
                return (
                  <button
                    key={p.valor}
                    type="button"
                    disabled={travado}
                    onClick={() => setPapel(p.valor)}
                    aria-pressed={ativo}
                    title={travado ? "Você não pode tirar o seu próprio acesso de admin" : undefined}
                    className={`flex min-h-11 items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      ativo ? "border-primary bg-primary/[0.05]" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                        ativo ? "border-primary" : "border-slate-300"
                      }`}
                    >
                      {ativo && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-foreground">{p.rotulo}</span>
                      <span className="block text-2xs leading-snug text-muted-foreground">{p.dica}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {erro && (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-destructive/8 px-3.5 py-2.5 text-xs font-medium text-destructive">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {erro}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={aoFechar} className="min-h-11 rounded-xl border border-border px-4 text-sm font-semibold text-muted-foreground hover:bg-slate-50">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="btn-petroleo disabled:opacity-50"
          >
            {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar
          </button>
        </div>
      </form>
    </Janela>
  );
}

/* ═══ AVISAR NO SINO ═══════════════════════════════════════════════════ */

function AvisarCliente({
  aberta,
  aoFechar,
  cliente,
}: {
  aberta: boolean;
  aoFechar: () => void;
  cliente: Cliente;
}) {
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    const supabase = createClient();
    const { error } = await supabase.from("hub_notificacoes").insert({
      usuario_id: cliente.id,
      titulo: titulo.trim(),
      texto: texto.trim() || null,
      tipo: "aviso",
    });
    if (error) {
      setEnviando(false);
      setErro(traduzir(error.message));
      return;
    }
    /* Entra no histórico da pessoa, junto com os e-mails: "o que a casa
       disse a esse cliente" inclui o que foi dito pelo sino. */
    await supabase.rpc("hub_mensagem_registrar", {
      p_para_email: cliente.email,
      p_corpo: texto.trim() || titulo.trim(),
      p_assunto: titulo.trim(),
      p_canal: "aviso",
      p_usuario_id: cliente.id,
    });
    setEnviando(false);
    setOk(true);
  }

  return (
    <Janela
      aberta={aberta}
      aoFechar={() => {
        setOk(false);
        setTitulo("");
        setTexto("");
        aoFechar();
      }}
      titulo="Aviso no sino"
      subtitulo={`Só para ${cliente.nome?.trim() || cliente.email}`}
    >
      {ok ? (
        <div className="py-4 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-success/15 text-success">
            <Check className="h-5 w-5" strokeWidth={2.6} />
          </span>
          <p className="mt-3 font-display text-base font-bold text-primary">Aviso enviado</p>
          <p className="mt-1 text-xs text-muted-foreground">Aparece no sino da próxima vez que a pessoa abrir o Hub.</p>
        </div>
      ) : (
        <form onSubmit={enviar} className="space-y-4">
          <Campo rotulo="Título">
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={120} className={CAMPO} placeholder="Sua revisão está pronta" />
          </Campo>
          <Campo rotulo="Texto (opcional)">
            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} className={`${CAMPO} resize-y`} />
          </Campo>
          {erro && (
            <p role="alert" className="flex items-start gap-2 rounded-xl bg-destructive/8 px-3.5 py-2.5 text-xs font-medium text-destructive">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {erro}
            </p>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={titulo.trim().length < 3 || enviando}
              className="btn-petroleo disabled:opacity-45"
            >
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
              Enviar aviso
            </button>
          </div>
        </form>
      )}
    </Janela>
  );
}

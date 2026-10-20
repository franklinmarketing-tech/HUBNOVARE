"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Mail, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EscreverEmail, linkWhatsApp } from "../EscreverEmail";
import { CAMPO, Campo, Janela } from "../Janela";

/**
 * O QUE DÁ PARA FAZER COM UM LEAD, numa fileira de botões.
 *
 * ⚠️ ANTES SÓ DAVA PARA OLHAR. O lead aparecia, o e-mail era um `mailto:`
 * e o telefone um link solto — corrigir um nome digitado errado, apagar um
 * teste ou responder exigiam sair do painel. Agora tudo acontece aqui, e
 * o que é escrita passa por função do banco que confere o papel.
 *
 * ⚠️ APAGAR PEDE CONFIRMAÇÃO COM O NOME DA PESSOA. "Tem certeza?" genérico
 * é clicado no automático; ver o e-mail de quem vai sumir é o que faz a
 * pessoa parar meio segundo — que é o que se quer de um botão sem desfazer.
 */
export function AcoesLead({
  id,
  nome,
  email,
  telefone,
}: {
  id: string;
  nome: string | null;
  email: string;
  telefone: string | null;
}) {
  const router = useRouter();
  const [escrevendo, setEscrevendo] = useState(false);
  const [editando, setEditando] = useState(false);
  const [apagando, setApagando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const zap = linkWhatsApp(telefone, nome);

  async function apagar() {
    if (
      !window.confirm(
        `Apagar o lead ${nome ? `${nome} (${email})` : email}?\n\nIsso não tem desfazer. As mensagens já enviadas a ele continuam no histórico.`,
      )
    ) {
      return;
    }
    setApagando(true);
    setErro(null);
    const { error } = await createClient().rpc("hub_lead_apagar", { p_id: id });
    setApagando(false);
    if (error) {
      setErro(
        /could not find the function|PGRST202/i.test(error.message)
          ? "Falta rodar o SQL painel_v2_INSTALAR.sql."
          : error.message,
      );
      return;
    }
    router.refresh();
  }

  const botao =
    "flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-40";

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setEscrevendo(true)}
          aria-label={`Responder ${nome ?? email} por e-mail`}
          title="Responder por e-mail"
          className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-semibold text-white transition-colors hover:bg-primary-soft"
        >
          <Mail className="h-3.5 w-3.5" strokeWidth={2.2} />
          Responder
        </button>

        {zap ? (
          <a
            href={zap}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`WhatsApp de ${nome ?? email}`}
            title="Abrir no WhatsApp com a mensagem pronta"
            className={`${botao} hover:border-success/50 hover:text-success`}
          >
            <MessageCircle className="h-4 w-4" strokeWidth={2} />
          </a>
        ) : (
          <span title="Sem telefone" className={`${botao} cursor-not-allowed opacity-35`}>
            <MessageCircle className="h-4 w-4" strokeWidth={2} />
          </span>
        )}

        <button
          type="button"
          onClick={() => setEditando(true)}
          aria-label={`Editar ${nome ?? email}`}
          title="Corrigir nome, e-mail ou telefone"
          className={botao}
        >
          <Pencil className="h-3.5 w-3.5" strokeWidth={2.2} />
        </button>

        <button
          type="button"
          onClick={apagar}
          disabled={apagando}
          aria-label={`Apagar ${nome ?? email}`}
          title="Apagar este lead"
          className={`${botao} hover:border-destructive/50 hover:text-destructive`}
        >
          {apagando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" strokeWidth={2.2} />}
        </button>
      </div>

      {erro && (
        <p role="alert" className="mt-1.5 text-2xs leading-snug text-destructive">
          {erro}
        </p>
      )}

      <EscreverEmail
        aberta={escrevendo}
        aoFechar={() => setEscrevendo(false)}
        para={email}
        nome={nome}
        leadId={id}
      />

      <EditarLead
        aberta={editando}
        aoFechar={() => setEditando(false)}
        id={id}
        nome={nome}
        email={email}
        telefone={telefone}
      />
    </div>
  );
}

function EditarLead({
  aberta,
  aoFechar,
  id,
  nome,
  email,
  telefone,
}: {
  aberta: boolean;
  aoFechar: () => void;
  id: string;
  nome: string | null;
  email: string;
  telefone: string | null;
}) {
  const router = useRouter();
  const [vNome, setVNome] = useState(nome ?? "");
  const [vEmail, setVEmail] = useState(email);
  const [vTel, setVTel] = useState(telefone ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    const { error } = await createClient().rpc("hub_lead_editar", {
      p_id: id,
      p_nome: vNome,
      p_email: vEmail,
      p_telefone: vTel,
    });
    setSalvando(false);
    if (error) {
      setErro(
        /could not find the function|PGRST202/i.test(error.message)
          ? "Falta rodar o SQL painel_v2_INSTALAR.sql."
          : /invalido/i.test(error.message)
            ? "Esse e-mail não parece válido."
            : error.message,
      );
      return;
    }
    aoFechar();
    router.refresh();
  }

  return (
    <Janela aberta={aberta} aoFechar={aoFechar} titulo="Corrigir o lead" subtitulo={email}>
      <form onSubmit={salvar} className="space-y-4">
        <Campo rotulo="Nome">
          <input value={vNome} onChange={(e) => setVNome(e.target.value)} className={CAMPO} />
        </Campo>
        <Campo rotulo="E-mail">
          <input
            type="email"
            value={vEmail}
            onChange={(e) => setVEmail(e.target.value)}
            className={CAMPO}
            required
          />
        </Campo>
        <Campo rotulo="Telefone" dica="Com DDD. O WhatsApp sai daqui.">
          <input
            type="tel"
            value={vTel}
            onChange={(e) => setVTel(e.target.value)}
            className={CAMPO}
            placeholder="(19) 99999-9999"
          />
        </Campo>

        {erro && (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-destructive/8 px-3.5 py-2.5 text-xs font-medium text-destructive">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {erro}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={aoFechar}
            className="min-h-11 rounded-xl border border-border px-4 text-sm font-semibold text-muted-foreground hover:bg-slate-50"
          >
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

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/* ⚠️ A LISTA SAIU DAQUI para `./situacoes.ts`. Exportada deste arquivo
   "use client", ela chegava ao servidor como referência opaca e derrubava a
   tela de leads inteira. Ver o comentário de lá. */
import { SITUACOES } from "./situacoes";

/**
 * Marcar em que pé está a conversa com um lead.
 *
 * ⚠️ SEM ISTO A LISTA NÃO ERA TRABALHÁVEL. Eram 500 e-mails em ordem de
 * chegada, sem nenhuma marca de quem já tinha sido chamado — então, na
 * prática, ou se anotava por fora (e o painel virava enfeite) ou se ligava
 * duas vezes para a mesma pessoa.
 *
 * ⚠️ A FALHA APARECE NA TELA. A escrita vai ao banco e pode ser recusada
 * (papel errado, rede caída, SQL ainda não rodado). Marcar em silêncio e
 * deixar o rótulo mudar na tela faria o Jefferson acreditar que registrou
 * algo que não existe — e descobrir isso só depois, ligando de novo para
 * quem já disse não.
 */
export function MarcarSituacao({
  id,
  situacao,
  anotacao,
}: {
  id: string;
  situacao: string;
  anotacao: string | null;
}) {
  const router = useRouter();
  const [atual, setAtual] = useState(situacao);
  const [nota, setNota] = useState(anotacao ?? "");
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function gravar(novaSituacao: string, novaNota?: string) {
    const anterior = atual;
    setSalvando(true);
    setErro(null);
    setAtual(novaSituacao); // resposta imediata; desfeita se o banco recusar

    const { error } = await createClient().rpc("hub_lead_marcar", {
      p_id: id,
      p_situacao: novaSituacao,
      p_anotacao: novaNota ?? null,
    });

    setSalvando(false);

    if (error) {
      setAtual(anterior);
      setErro(
        /could not find the function|PGRST202/i.test(error.message)
          ? "Falta rodar o SQL painel_novare_INSTALAR.sql no Supabase."
          : error.message,
      );
      return;
    }
    setEditando(false);
    router.refresh();
  }

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-1">
        {SITUACOES.map((s) => {
          const ativo = s.valor === atual;
          return (
            <button
              key={s.valor}
              type="button"
              disabled={salvando}
              onClick={() => gravar(s.valor)}
              aria-pressed={ativo}
              className={`min-h-7 rounded-full px-2.5 text-2xs font-semibold transition-colors disabled:opacity-50 ${
                ativo ? s.cls : "text-muted-foreground hover:bg-slate-100"
              }`}
            >
              {s.rotulo}
            </button>
          );
        })}
      </div>

      {editando ? (
        <div className="mt-1.5 flex items-start gap-1.5">
          <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            rows={2}
            placeholder="O que foi conversado"
            className="min-w-0 flex-1 rounded-lg border border-border px-2 py-1 text-2xs outline-none focus:border-accent"
          />
          <button
            type="button"
            disabled={salvando}
            onClick={() => gravar(atual, nota)}
            className="min-h-7 shrink-0 rounded-lg bg-primary px-2.5 text-2xs font-semibold text-white disabled:opacity-50"
          >
            {salvando ? "…" : "ok"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="mt-1 block max-w-full truncate text-left text-2xs text-muted-foreground hover:text-primary hover:underline"
        >
          {nota ? nota : "+ anotar"}
        </button>
      )}

      {erro && (
        <p role="alert" className="mt-1 text-2xs leading-snug text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}

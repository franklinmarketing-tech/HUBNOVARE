"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useQuemSou } from "@/lib/quem-sou";
import { sair } from "@/lib/acoes-sessao";
import { NOVARECASH_NOME, faseBlack, urgenciaBlack, type FaseBlack } from "@/lib/novarecash/config";

/**
 * AS PARTES DA PÁGINA DE VENDA QUE SÃO DE CADA PESSOA (21/11/2026).
 *
 * A página saiu pronta (igual para todos); o que dependia de quem estava
 * olhando passou para cá e se completa depois que a página abriu:
 *   • o botão do cabeçalho ("Abrir o NovareCash" / "Já assinei: entrar");
 *   • o aviso de quem a trava de /novarecash/app mandou de volta;
 *   • a conferência da fase da Black (HTML guardado de um dia que já virou).
 *
 * "Já tem acesso?" é a MESMA pergunta que o servidor fazia
 * (`ncash_tem_acesso`, no banco) — só que pelo navegador, com a sessão dele.
 * Serve para MOSTRAR; quem libera o app continua sendo a trava do servidor.
 */

let acessoGuardado: { usuario: string; promessa: Promise<boolean> } | null = null;

function lerAcesso(usuario: string): Promise<boolean> {
  if (acessoGuardado?.usuario !== usuario) {
    const promessa = Promise.resolve(createClient().rpc("ncash_tem_acesso"))
      .then(({ data, error }) => !error && data === true)
      .catch(() => false);
    acessoGuardado = { usuario, promessa };
  }
  return acessoGuardado.promessa;
}

/** `pronto` só depois de saber quem é E se tem acesso. */
function useAcessoNovareCash() {
  const { pronto, perfil } = useQuemSou();
  const [jaTem, setJaTem] = useState<boolean | null>(null);

  useEffect(() => {
    if (!pronto) return;
    if (!perfil) {
      setJaTem(false);
      return;
    }
    let vivo = true;
    void lerAcesso(perfil.id).then((tem) => vivo && setJaTem(tem));
    return () => {
      vivo = false;
    };
  }, [pronto, perfil]);

  return { pronto: pronto && jaTem !== null, logado: !!perfil, jaTem: jaTem === true };
}

/** O canto direito do cabeçalho. Enquanto lê, "Já assinei: entrar" guarda o lugar sem aparecer. */
export function DireitaDoCabecalhoVenda() {
  const { pronto, logado, jaTem } = useAcessoNovareCash();

  if (pronto && jaTem) {
    return (
      <Link href="/novarecash/app" className="btn-cp px-4 text-xs">
        Abrir o NovareCash
      </Link>
    );
  }
  // Logado sem o NovareCash: nada no canto (a página inteira já é o convite).
  if (pronto && logado) return null;

  return (
    <Link
      href="/login?proximo=%2Fnovarecash%2Fapp"
      aria-hidden={!pronto || undefined}
      tabIndex={pronto ? undefined : -1}
      className={`inline-flex min-h-11 items-center text-xs font-medium text-muted-foreground transition-[color,opacity] hover:text-primary ${pronto ? "opacity-100" : "invisible opacity-0"}`}
    >
      Já assinei: entrar
    </Link>
  );
}

/** Quem a trava de /novarecash/app mandou de volta (`?sem-assinatura=1`). */
export function AvisoSemAssinatura() {
  const veioDaTrava = useSearchParams().get("sem-assinatura") === "1";
  const { pronto, logado, jaTem } = useAcessoNovareCash();
  if (!veioDaTrava || !pronto || jaTem) return null;

  return (
    <div className="border-b border-border bg-gelo" role="status">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 text-sm text-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          Sua conta ainda não tem o {NOVARECASH_NOME}. Já assinou? Entre com o mesmo e-mail da compra.
        </p>
        {logado ? (
          <form action={sair}>
            <button type="submit" className="inline-flex min-h-11 items-center text-xs font-semibold text-accent-strong underline underline-offset-4">
              Sair e entrar com outro e-mail
            </button>
          </form>
        ) : (
          <Link
            href="/login?proximo=%2Fnovarecash%2Fapp"
            className="inline-flex min-h-11 items-center text-xs font-semibold text-accent-strong underline underline-offset-4"
          >
            Entrar
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * A FASE DA BLACK NO RELÓGIO DE QUEM ABRE.
 *
 * A página é remontada a cada 60 s, mas quem chega logo depois da virada de um
 * dia pode receber o HTML guardado da fase anterior (a faixa "acaba hoje" já
 * no dia seguinte, ou o preço da Black depois do fim). Se a fase ou o rótulo
 * calculados agora não batem com os do HTML, recarrega UMA vez — a essa
 * altura a página nova já foi montada. Nunca em laço: o `sessionStorage`
 * lembra para qual fase já recarregou.
 */
export function ConferirFaseBlack({ fase, rotulo }: { fase: FaseBlack; rotulo: string | null }) {
  useEffect(() => {
    const agora = new Date();
    const faseAgora = faseBlack(agora);
    const rotuloAgora = urgenciaBlack(agora)?.rotulo ?? null;
    if (faseAgora === fase && rotuloAgora === rotulo) return;

    const alvo = `${faseAgora}|${rotuloAgora ?? ""}`;
    try {
      if (sessionStorage.getItem("ncash:fase-recarregada") === alvo) return;
      sessionStorage.setItem("ncash:fase-recarregada", alvo);
    } catch {
      return; // sem storage não dá para garantir que não vira laço
    }
    const t = window.setTimeout(() => window.location.reload(), 1500);
    return () => window.clearTimeout(t);
  }, [fase, rotulo]);

  return null;
}

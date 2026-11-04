import { getPerfil } from "@/lib/perfil";
import { minhaAssinatura } from "@/lib/novarecash/acesso";
import { ehEquipe } from "@/lib/novarecash/recursos";
import { createClient } from "@/lib/supabase/server";
import { Cabecalho } from "../pecas";
import { CategoriasPersonalizadas } from "./CategoriasPersonalizadas";
import { ContaCompartilhada } from "./ContaCompartilhada";
import { MinhaAssinatura } from "./MinhaAssinatura";

export const dynamic = "force-dynamic";

/**
 * AJUSTES do NovareCash: categorias personalizadas, conta compartilhada e a
 * assinatura. Categorias e convites são telas de navegador (cada uma trata os
 * próprios estados); a assinatura é lida aqui, no servidor.
 */

/** Se a pessoa usa o NovareCash de OUTRA pessoa (convite aceito), o nome dela. Falha = `null`. */
async function nomeDoDonoSeMembro(eu: string): Promise<string | null> {
  try {
    const sb = await createClient();
    const { data: dono, error } = await sb.rpc("ncash_dono_atual");
    if (error || typeof dono !== "string" || dono === eu) return null;
    const { data } = await sb.rpc("ncash_convites_para_mim");
    const achado = ((data ?? []) as { dono_id?: string; dono_nome?: string }[]).find((c) => c.dono_id === dono);
    return achado?.dono_nome ?? "o titular";
  } catch {
    return null;
  }
}

function Secao({ id, titulo, texto, children }: { id: string; titulo: string; texto: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-2">
      <div>
        <h2 id={id} className="font-display text-lg font-semibold text-white">
          {titulo}
        </h2>
        <p className="max-w-prose text-xs leading-relaxed text-white/70">{texto}</p>
      </div>
      {children}
    </section>
  );
}

export default async function AjustesNovareCash() {
  const perfil = await getPerfil();
  const [assinatura, membroDe] = await Promise.all([minhaAssinatura(), perfil ? nomeDoDonoSeMembro(perfil.id) : null]);

  return (
    <div className="surgir space-y-8">
      <Cabecalho titulo="Ajustes" resumo="As suas categorias, quem divide o NovareCash com você e a sua assinatura." />

      <Secao
        id="ajustes-categorias"
        titulo="Categorias personalizadas"
        texto="Crie categorias além das do app. Elas aparecem na hora de escolher a categoria de um lançamento e na importação de extrato."
      >
        <CategoriasPersonalizadas />
      </Secao>

      <Secao
        id="ajustes-compartilhar"
        titulo="Conta compartilhada"
        texto="Divida o NovareCash com o seu par ou a família: quem você convidar vê e lança tudo junto com você, no mesmo extrato."
      >
        {perfil && <ContaCompartilhada eu={perfil.id} meuEmail={perfil.email} />}
      </Secao>

      <Secao id="ajustes-assinatura" titulo="Minha assinatura" texto="O estado da sua assinatura e como cancelar.">
        <MinhaAssinatura
          assinatura={assinatura}
          email={perfil?.email ?? ""}
          equipe={ehEquipe(perfil?.role)}
          membroDe={membroDe}
        />
      </Secao>
    </div>
  );
}

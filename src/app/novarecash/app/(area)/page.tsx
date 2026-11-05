import { getPerfil } from "@/lib/perfil";
import { createClient } from "@/lib/supabase/server";
import { minhaAssinatura } from "@/lib/novarecash/acesso";
import { carregarRetrato } from "@/lib/novarecash/retrato";
import { usuarioDaSessao } from "@/lib/novarecash/dados";
import { estadoDoRecurso, ehEquipe, whatsappEnvioConfigurado } from "@/lib/novarecash/recursos";
import { iaConfigurada } from "@/lib/novarecash/ia";
import { lerPrimeirosPassos } from "@/lib/novarecash/primeiros-passos";
import { lerPreferencias } from "@/lib/novarecash/preferencias";
import { TelaInicio, type CartaoRecurso } from "./TelaInicio";

export const dynamic = "force-dynamic";

/**
 * INÍCIO do NovareCash: o mês da pessoa (tabelas `ncash_*`, lidas no servidor
 * com a sessão dela), o estado dos três recursos e a assinatura.
 *
 * Os números saem de `carregarRetrato`, o MESMO que alimenta a IA. Se a tela e
 * a IA lessem por caminhos diferentes, um dia uma diria R$ 300 e a outra R$ 280.
 */
export default async function InicioNovareCash() {
  const perfil = await getPerfil();
  // A porta (`../layout.tsx`) já garantiu sessão e acesso; isto é só para o TS.
  if (!perfil) return null;

  const supabase = await createClient();
  // O DONO do NovareCash aberto (conta compartilhada), não necessariamente quem está logado.
  const dono = await usuarioDaSessao(supabase).catch(() => perfil.id);
  // O checklist "Primeiros passos" lê do DONO (o que o par já fez vale); o "dispensei" é da PESSOA logada.
  const [resultado, assinatura, passos, prefs] = await Promise.all([
    carregarRetrato(supabase, dono),
    minhaAssinatura(),
    lerPrimeirosPassos(supabase, dono),
    lerPreferencias(supabase, perfil.id),
  ]);

  const ia = estadoDoRecurso("ia", perfil.role);
  const whats = estadoDoRecurso("whatsapp", perfil.role);
  const banco = estadoDoRecurso("banco", perfil.role);

  const recursos: CartaoRecurso[] = [
    {
      chave: "ia",
      titulo: "IA",
      texto: "Pergunte sobre o seu dinheiro e a resposta sai do seu extrato.",
      href: "/novarecash/app/ia",
      situacao: !ia.liberado ? "ativacao" : iaConfigurada() ? (ia.modoEquipe ? "teste" : "pronto") : "ligando",
      liberaEm: ia.recurso.liberaEm,
    },
    {
      chave: "whatsapp",
      titulo: "WhatsApp",
      texto: "Lance um gasto por texto, áudio ou foto da nota.",
      href: "/novarecash/app/whatsapp",
      situacao: !whats.liberado
        ? "ativacao"
        : whats.modoEquipe
          ? "teste"
          : whatsappEnvioConfigurado()
            ? "pronto"
            : "ligando",
      liberaEm: whats.recurso.liberaEm,
    },
    {
      chave: "banco",
      titulo: "Banco",
      texto: "Saldo e extrato pelo Open Finance, sem digitar.",
      href: "/novarecash/app/banco",
      situacao: !banco.liberado ? "ativacao" : banco.modoEquipe ? "teste" : "pronto",
      liberaEm: banco.recurso.liberaEm,
    },
  ];

  return (
    <TelaInicio
      nome={perfil.nome?.split(" ")[0] ?? null}
      resultado={resultado}
      assinatura={assinatura}
      equipe={ehEquipe(perfil.role)}
      recursos={recursos}
      passos={passos}
      checklistDispensado={prefs?.checklistDispensado ?? false}
    />
  );
}

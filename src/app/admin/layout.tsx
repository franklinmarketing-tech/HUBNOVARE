import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { BarChart3, Megaphone, Users, UserCircle2 } from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { getPerfil } from "@/lib/perfil";

/**
 * A CASCA DO PAINEL DA NOVARE.
 *
 * ═══ POR QUE ELE PASSOU A EXISTIR (17/10/2026) ════════════════════════════
 *
 * Havia três telas de administração e **nenhum layout**: cada `page.tsx`
 * repetia o mesmo par `getPerfil()` + `notFound()`, e não havia menu nenhum.
 * De `/admin/leads` não existia link para `/admin/assinantes` — a navegação
 * era de mão única, por um link de rodapé em letra miúda.
 *
 * Duas consequências, e a segunda é a grave:
 *
 * 1. Quem entrava não sabia o que mais existia ali.
 * 2. ⚠️ A GUARDA ESTAVA COPIADA. Três cópias da mesma regra de papel é a
 *    receita de uma tela nova nascer sem ela — e uma tela de administração
 *    sem guarda é vazamento de lista de clientes, não bug de layout.
 *
 * Agora a guarda é uma só, e vale para tudo que estiver debaixo de `/admin`,
 * inclusive o que ainda não foi escrito.
 *
 * ═══ 404, NUNCA "ACESSO RESTRITO" ════════════════════════════════════════
 *
 * Quem não é admin nem equipe recebe `notFound()`. Uma página de "acesso
 * restrito" responde 200 e, ao fazer isso, CONFIRMA que existe administração
 * naquele endereço — informação que não se dá de graça a quem está
 * tentando. O 404 não confirma nada.
 *
 * ⚠️ AS PÁGINAS FILHAS MANTÊM A PRÓPRIA GUARDA, de propósito. Esta não
 * substitui aquelas — soma-se a elas. `/admin/assinantes` exige `admin` e
 * barra `equipe`, porque mexer em acesso pago é mexer em dinheiro; essa
 * regra é mais estrita que a daqui e precisa continuar onde está.
 */

const ABAS = [
  { href: "/admin/leads", rotulo: "Leads", Icone: Users },
  { href: "/admin/clientes", rotulo: "Clientes", Icone: UserCircle2 },
  { href: "/admin/uso", rotulo: "Uso", Icone: BarChart3 },
  { href: "/admin/avisos", rotulo: "Avisos", Icone: Megaphone },
  /* ⚠️ Assinantes exige `admin` (equipe é barrada lá dentro). A aba aparece
     para equipe e devolve 404 no clique — mostrar e negar é pior do que não
     mostrar, então ela só entra na lista quando o papel é admin. Ver o
     filtro em `Painel()`. */
  { href: "/admin/assinantes", rotulo: "Assinantes", Icone: Users, soAdmin: true },
] as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const perfil = await getPerfil();
  if (!perfil) redirect("/login?proximo=/admin");
  if (perfil.role !== "admin" && perfil.role !== "equipe") notFound();

  const abas = ABAS.filter((a) => !("soAdmin" in a && a.soAdmin) || perfil.role === "admin");

  return (
    <div className="min-h-dvh bg-background">
      <Cabecalho
        direita={
          <Link
            href="/"
            className="text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
          >
            Voltar ao Workspace
          </Link>
        }
      />

      <div className="border-b border-border bg-white">
        <div className="mx-auto max-w-6xl px-4">
          {/* Rola na horizontal no celular em vez de quebrar em duas linhas:
              menu de admin quebrado empurra o conteúdo para baixo em toda
              tela. */}
          <nav
            aria-label="Seções da administração"
            className="-mb-px flex gap-1 overflow-x-auto"
          >
            {abas.map(({ href, rotulo, Icone }) => (
              <Link
                key={href}
                href={href}
                className="flex shrink-0 items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:text-primary"
              >
                <Icone className="h-4 w-4" strokeWidth={1.9} />
                {rotulo}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

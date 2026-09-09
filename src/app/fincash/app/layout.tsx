import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { LogOut, Wallet } from "lucide-react";
import { getPerfil } from "@/lib/perfil";
import { CascaFincash } from "./CascaFincash";
import { sair } from "@/app/planejamento/app/actions";

/* A folha de tokens e animações DESTE app.
   Importada aqui e não no `globals.css` de propósito: o `globals` serve o Hub
   inteiro (landing, Planejamento, painel do consultor) e tudo o que entra lá
   vira contrato de todo mundo. O que é vocabulário de um produto só morre
   junto com ele. */
import "./fincash.css";

export const metadata: Metadata = {
  title: "FINCASH",
  description: "Suas contas, seus gastos e o seu saldo, no dia a dia.",
  robots: { index: false, follow: false },
};

/**
 * A casca do FINCASH.
 *
 * A navegação virou TRILHO LATERAL. Era uma fita horizontal no cabeçalho, e
 * dez telas numa fita só cabem rolando de lado — menu que rola é menu que
 * esconde. Na vertical as dez ficam à vista, com nome inteiro, e a faixa mais
 * disputada da tela (o topo) volta para quem a merece: o mês e o botão de
 * lançar, que é o que a pessoa lê ao abrir o app.
 *
 * O CABEÇALHO SOBROU SÓ NO CELULAR (`md:hidden`). Lá o trilho não cabe, e sem
 * ele a marca do produto sumiria: o Hub abriga vários apps com a mesma casca,
 * e quem chega por um link precisa saber em qual deles caiu. Do tablet para
 * cima a marca, a conta e a saída moram no trilho — repetir tudo em duas
 * molduras seria mobília dobrada ocupando altura de conteúdo.
 *
 * O QUE MUDA em relação à trilha do Planejamento: lá a navegação é uma
 * SEQUÊNCIA (seis etapas percorridas uma vez), aqui é um MENU (telas visitadas
 * todo dia, em qualquer ordem). Por isso a daqui não tem progresso nem tique —
 * nada aqui se "conclui".
 */
export default async function FincashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const perfil = await getPerfil();

  // O middleware já barra quem não tem sessão; isto é a segunda tranca.
  if (!perfil) redirect("/login?proximo=/fincash/app");

  const primeiroNome = perfil.nome?.split(" ")[0];

  return (
    <div className="aurora-clara min-h-dvh">
      {/* Nada `fixed` pode nascer aqui dentro: o `backdrop-blur` deste
          cabeçalho vira bloco de contenção e âncora qualquer `position: fixed`
          nele, não na janela. O trilho e a barra do polegar são montados fora,
          pelo `CascaFincash`. */}
      <header className="nao-imprimir sticky top-0 z-20 border-b border-border/70 bg-white/80 backdrop-blur-md md:hidden">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-5">
          <Link href="/" aria-label="Novare, início">
            <Image
              src="/marca/logo-novare.png"
              alt="Novare"
              width={112}
              height={30}
              priority
              style={{ height: 26, width: "auto" }}
            />
          </Link>

          {/* Lockup do produto: emblema + nome. A palavra solta ao lado de um
              logo parece legenda; com o emblema, parece produto.
              Navy→ciano, e não laranja: laranja neste app é AÇÃO (o botão de
              lançar), e um emblema laranja competiria com ele. */}
          <span className="flex min-w-0 items-center gap-2">
            <span aria-hidden className="h-5 w-px shrink-0 bg-border" />
            <span
              aria-hidden
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(140deg,hsl(215_50%_23%),hsl(197_70%_38%))] text-white shadow-[0_4px_10px_-4px_hsl(215_50%_23%/0.7)]"
            >
              <Wallet className="h-4 w-4" strokeWidth={2.4} />
            </span>
            <span className="font-display text-sm font-semibold tracking-[0.14em] text-primary">
              FINCASH
            </span>
          </span>

          {/* "Voltar ao Workspace" por extenso não cabe aqui ao lado da marca —
              e não precisa: a marca da Novare, à esquerda, já leva para casa e
              é o gesto que todo mundo tenta primeiro. Fica só a saída, que
              precisa ser alcançável sem abrir menu nenhum. */}
          <form action={sair} className="ml-auto">
            <button
              type="submit"
              aria-label={
                primeiroNome ? `Sair da conta de ${primeiroNome}` : "Sair"
              }
              className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground motion-reduce:transition-none"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </header>

      <CascaFincash nome={primeiroNome} sair={sair}>
        {children}
      </CascaFincash>
    </div>
  );
}

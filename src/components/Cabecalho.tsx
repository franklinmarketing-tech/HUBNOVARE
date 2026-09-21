import Link from "next/link";
import { Logo } from "@/components/Logo";
import { getIndicadores, juroReal } from "@/lib/mercado";
import { RedesSociais } from "@/components/RedesSociais";

/**
 * Header padrão das telas da Novare: branco translúcido, sticky, 64px,
 * com um indicador ao vivo à direita (mesmo padrão das ferramentas públicas).
 */
export async function Cabecalho({ direita }: { direita?: React.ReactNode }) {
  const indicadores = await getIndicadores();
  const selic = indicadores.find((i) => i.chave === "selic");
  const ipca = indicadores.find((i) => i.chave === "ipca12");
  const real = selic && ipca ? juroReal(selic.valor, ipca.valor) : null;
  const aoVivo = !!selic?.aoVivo && !!ipca?.aoVivo;

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" aria-label="Novare, página inicial">
          <Logo />
        </Link>

        {/* ⚠️ ESTE TOPO NÃO TINHA REDE SOCIAL NENHUMA, e ele cobre
            /consultoria, /assinar/em-breve e as telas de admin. O dono
            pediu as redes em todos os topos.

            Fica ao lado do indicador de juros, não no lugar dele: `direita`
            é a prop pela qual cada página manda o próprio conteúdo, e
            ocupá-la aqui tiraria esse controle de quem chama. */}
        <div className="ml-auto flex items-center gap-4">
          <RedesSociais className="flex" tamanho="h-4 w-4" />

        {direita ?? (
          real !== null && (
            <span className="hidden items-center gap-1.5 text-xs font-medium text-muted-foreground sm:flex">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  aoVivo ? "bg-success" : "bg-warning"
                }`}
              />
              Juros real ~
              {real.toLocaleString("pt-BR", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}
              % a.a.
            </span>
          )
        )}
        </div>
      </div>
    </header>
  );
}

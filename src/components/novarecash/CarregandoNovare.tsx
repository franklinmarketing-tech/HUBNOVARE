import Image from "next/image";

/**
 * A ESPERA COM A MARCA (13/11/2026): o ícone da Novare pulsando dentro de um anel ouro girando.
 * Pedido do dono: sempre que algo carrega, o logo aparece — ninguém fica sem saber se o toque pegou.
 *
 * `cheia`: ocupa a altura da tela (troca de página). Sem ela, um bloco no lugar do conteúdo.
 * `compacta`: só o selo pequeno (indicador flutuante de navegação).
 */
export function CarregandoNovare({
  texto = "Carregando…",
  cheia = false,
  compacta = false,
}: {
  texto?: string;
  cheia?: boolean;
  compacta?: boolean;
}) {
  const tam = compacta ? 22 : 36;
  const anel = compacta ? "h-9 w-9" : "h-16 w-16";
  const selo = (
    <span className={`relative flex ${anel} shrink-0 items-center justify-center`} aria-hidden>
      <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-white/10 border-t-ouro motion-reduce:animate-none" />
      <Image
        src="/marca/icone-novare.png"
        alt=""
        width={tam}
        height={tam}
        priority
        className="animate-pulse motion-reduce:animate-none"
      />
    </span>
  );
  if (compacta) return selo;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 ${cheia ? "min-h-[60dvh]" : "py-12"}`}
    >
      {selo}
      <p className="text-xs font-medium text-white/65">{texto}</p>
    </div>
  );
}

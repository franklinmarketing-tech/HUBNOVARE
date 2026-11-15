import { Esqueleto } from "./pecas";

/**
 * Troca de tela no NovareCash (15/11/2026): o MESMO desenho da espera dos dados — o cabeçalho em
 * esboço e o logo da Novare no lugar do conteúdo. Antes era um logo de tela cheia e, logo depois,
 * outro logo no meio da tela: a "espera dupla" que fazia o app parecer mais lento.
 */
export default function Carregando() {
  return (
    <div aria-hidden={false} className="space-y-6">
      <div className="flex items-center gap-3" aria-hidden>
        <span className="h-12 w-12 animate-pulse rounded-2xl bg-white/[0.06] motion-reduce:animate-none" />
        <span className="h-7 w-48 animate-pulse rounded-lg bg-white/[0.06] motion-reduce:animate-none" />
      </div>
      <Esqueleto linhas={4} />
    </div>
  );
}

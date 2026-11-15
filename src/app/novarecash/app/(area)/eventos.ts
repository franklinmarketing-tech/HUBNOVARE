/**
 * OS SINAIS DA CASCA (15/11/2026, velocidade): abrir a busca (Ctrl K) e começar o tour.
 * Num módulo pequeno de propósito: o menu, o avatar e as telas só precisam DISPARAR o sinal;
 * importar de `Paleta.tsx`/`TourNovareCash.tsx` puxava os dois arquivos inteiros para todas
 * as telas. A Paleta e o Tour agora carregam à parte (`ExtrasCasca.tsx`) e só escutam.
 */
export const EVENTO_ABRIR_PALETA = "ncash:abrir-paleta";

export function abrirPaleta() {
  window.dispatchEvent(new Event(EVENTO_ABRIR_PALETA));
}

export const EVENTO_TOUR = "ncash:tour";
export type QualTour = "app" | "tela";

export function iniciarTour(qual: QualTour) {
  window.dispatchEvent(new CustomEvent<QualTour>(EVENTO_TOUR, { detail: qual }));
}

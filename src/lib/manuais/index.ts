import type { Manual } from "./tipo";
import { MANUAIS_FERRAMENTAS_1 } from "./ferramentas-1";
import { MANUAIS_FERRAMENTAS_2 } from "./ferramentas-2";
import { MANUAIS_FINCASH } from "./fincash";

export type { Manual } from "./tipo";

/** Ferramentas por slug; FINCASH pela rota exata. Ver `tipo.ts`. */
export const MANUAIS: Record<string, Manual> = {
  ...MANUAIS_FERRAMENTAS_1,
  ...MANUAIS_FERRAMENTAS_2,
  ...MANUAIS_FINCASH,
};

/**
 * O arquivo do vídeo curto de cada manual, em /public/manuais. A rota do
 * FINCASH vira nome de arquivo ("/fincash/app/contas" → "fincash-contas").
 */
export const arquivoDoVideo = (chave: string) =>
  `/manuais/${chave === "/fincash/app" ? "fincash-painel" : chave.replace(/^\/fincash\/app\//, "fincash-").replace(/\//g, "-")}.mp4`;

import { RECURSOS, type Recurso } from "./config";
import type { Role } from "@/lib/apps";

/**
 * O que a PESSOA vê de cada recurso, decidido num lugar só.
 *
 * `RECURSOS[].noAr` (em `config.ts`) diz se o recurso funciona de verdade para
 * o cliente. Enquanto for `false`:
 *   - o CLIENTE vê "Em ativação: libera em {liberaEm}" — nunca uma tela que
 *     promete e não entrega;
 *   - a EQUIPE (admin/equipe) vê a tela funcionando, para testar antes de ligar.
 *
 * Ligar o recurso para todo mundo = trocar `noAr` para `true` em `config.ts`.
 * Nenhuma tela precisa mudar.
 */
export type EstadoRecurso = {
  recurso: Recurso;
  /** A tela funcional aparece? */
  liberado: boolean;
  /** Liberado SÓ porque quem olha é da equipe (o cliente ainda vê "em ativação"). */
  modoEquipe: boolean;
};

export function ehEquipe(role: Role | null | undefined): boolean {
  return role === "admin" || role === "equipe";
}

export function estadoDoRecurso(chave: Recurso["chave"], role: Role | null | undefined): EstadoRecurso {
  const recurso = RECURSOS.find((r) => r.chave === chave) ?? {
    chave,
    titulo: chave,
    texto: "",
    noAr: false,
  };
  const equipe = ehEquipe(role);
  return {
    recurso,
    liberado: recurso.noAr || equipe,
    modoEquipe: !recurso.noAr && equipe,
  };
}

/**
 * Há credencial da Meta para o assistente RESPONDER no WhatsApp? Sem ela o
 * servidor ainda interpreta e grava, só não entrega a resposta. Só no servidor
 * (as variáveis não chegam ao navegador).
 */
export function whatsappEnvioConfigurado(): boolean {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

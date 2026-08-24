/**
 * Sistema de Gestão e Validação de Cupons de Desconto (Briefing Slide 13).
 *
 * Cupons para campanhas de marketing do Workspace para os produtos e planos Novare.
 */

export type Cupom = {
  codigo: string;
  descontoPercentual: number;
  descricao: string;
  validoAte?: string;
  aplicavelEm: "workspace" | "consultoria" | "todos";
  ativo: boolean;
};

export const CUPONS_ATIVOS: Cupom[] = [
  {
    codigo: "NOVARE2026",
    descontoPercentual: 20,
    descricao: "20% OFF de boas-vindas ao Workspace Novare",
    aplicavelEm: "todos",
    ativo: true,
  },
  {
    codigo: "NORDPARCERIA",
    descontoPercentual: 25,
    descricao: "25% OFF especial para membros da parceria Novare + Nord",
    aplicavelEm: "consultoria",
    ativo: true,
  },
  {
    codigo: "FRANKLINVIP",
    descontoPercentual: 30,
    descricao: "30% OFF - Condição especial de parceiro de negócios",
    aplicavelEm: "todos",
    ativo: true,
  },
];

export function validarCupom(codigo: string): {
  valido: boolean;
  cupom?: Cupom;
  mensagem: string;
} {
  const normalizado = codigo.trim().toUpperCase();
  const encontrado = CUPONS_ATIVOS.find(
    (c) => c.codigo.toUpperCase() === normalizado && c.ativo
  );

  if (!encontrado) {
    return {
      valido: false,
      mensagem: "Cupom inválido ou expirado.",
    };
  }

  if (encontrado.validoAte && new Date(encontrado.validoAte) < new Date()) {
    return {
      valido: false,
      mensagem: "Cupom inválido ou expirado.",
    };
  }

  return {
    valido: true,
    cupom: encontrado,
    mensagem: `Cupom aplicado com sucesso: ${encontrado.descontoPercentual}% de desconto!`,
  };
}

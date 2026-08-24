/**
 * Utilitários e regras de negócio financeiro / split de comissões da Novare.
 * 
 * Regra acordada entre sócios:
 * - 33% de comissão para cada um dos 2 sócios (total 66%).
 * - O restante (34%) destina-se à operação / reserva da empresa.
 * - O provedor de pagamento (gateway) permanece desacoplado até definição final.
 */

export const COMISSAO_SOCIOS = 0.33; // 33% por sócio
export const NUMERO_PADRAO_SOCIOS = 2;

export interface PartnerInfo {
  id: string;
  name: string;
  email?: string;
  documento?: string; // CPF ou CNPJ para split
  pixKey?: string;
  percentual: number; // Ex: 0.33
}

export interface SplitResult {
  valorTotalBruto: number;
  valorTotalLiquido: number;
  socios: {
    id: string;
    name: string;
    percentual: number;
    valor: number;
  }[];
  reservaEmpresa: {
    percentual: number;
    valor: number;
  };
}

/**
 * Calcula a divisão exata dos valores para repasse aos sócios e retenção operacional.
 * @param valorTotal Valor total em Reais (BRL)
 * @param partners Lista opcional de sócios (por padrão utiliza os 2 sócios a 33% cada)
 */
export function calcularSplitComissao(
  valorTotal: number,
  partners?: Partial<PartnerInfo>[]
): SplitResult {
  const partnersList = partners && partners.length > 0
    ? partners.map((p, idx) => ({
        id: p.id ?? `socio_${idx + 1}`,
        name: p.name ?? `Sócio ${idx + 1}`,
        percentual: p.percentual ?? COMISSAO_SOCIOS,
      }))
    : [
        { id: "socio_1", name: "Sócio 1 (Franklin)", percentual: COMISSAO_SOCIOS },
        { id: "socio_2", name: "Sócio 2", percentual: COMISSAO_SOCIOS },
      ];

  const totalPercentualSocios = partnersList.reduce((acc, p) => acc + p.percentual, 0);
  const percentualEmpresa = Math.max(0, 1 - totalPercentualSocios);

  const socios = partnersList.map((p) => ({
    id: p.id,
    name: p.name,
    percentual: p.percentual,
    valor: Number((valorTotal * p.percentual).toFixed(2)),
  }));

  const totalSociosValor = socios.reduce((acc, s) => acc + s.valor, 0);
  const valorEmpresa = Number((valorTotal - totalSociosValor).toFixed(2));

  return {
    valorTotalBruto: valorTotal,
    valorTotalLiquido: valorTotal,
    socios,
    reservaEmpresa: {
      percentual: Number(percentualEmpresa.toFixed(4)),
      valor: valorEmpresa,
    },
  };
}

/**
 * Gera os metadados padronizados para criação de checkout em qualquer gateway futuro
 * (Stripe Connect, Asaas Split, Kiwify, Mercado Pago, etc.)
 */
export async function createCheckoutSession(
  productId: string,
  partners: PartnerInfo[] = [],
  amountCents: number = 0
): Promise<{ url: string; splitPreview: SplitResult }> {
  const valorReais = amountCents / 100;
  const splitPreview = calcularSplitComissao(valorReais, partners);

  // Endpoint de fallback/placeholder até escolha do provedor
  const checkoutBaseUrl = process.env.CHECKOUT_BASE_URL;
  if (!checkoutBaseUrl) {
    throw new Error("CHECKOUT_BASE_URL nao foi configurada");
  }

  const checkoutUrl = new URL(checkoutBaseUrl);
  checkoutUrl.searchParams.set("product", productId);
  checkoutUrl.searchParams.set("amount", String(amountCents));
  checkoutUrl.searchParams.set("split", "socios_33_33");

  return {
    url: checkoutUrl.toString(),
    splitPreview,
  };
}

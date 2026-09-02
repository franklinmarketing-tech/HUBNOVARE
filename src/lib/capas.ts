/**
 * Capa de cada app.
 *
 * As imagens vieram do app da Novare em produção (novareapp/src/assets).
 * Os apps criados aqui ainda não têm foto: recebem uma capa desenhada em
 * gradiente da marca com o ícone em marca d'água, o que é coerente com a
 * identidade e não parece um espaço vazio esperando arte.
 */

/**
 * Capa dos produtos da casa: Planejamento Financeiro, Íris e as consultorias.
 *
 * Só eles têm foto, e de propósito — são o que a Novare vende. As
 * ferramentas gratuitas ficam no tile de gradiente, o que mantém a
 * hierarquia visível sem escrever "PRO" em lugar nenhum.
 */
/**
 * Foto de capa dos cards.
 *
 * São as imagens do app da Novare em produção, então já falam a língua da
 * marca. Nem todo app tem — quem não tem fica só com o emblema, e o card
 * não parece um espaço vazio esperando arte.
 */
/**
 * São só 13 fotos reais — as mesmas 13 do app da Novare em produção.
 * Para cobrir as 22 ferramentas do catálogo, cada foto aparece em mais de
 * um card, mas nunca duas vezes dentro da MESMA área: quem rola a página
 * inteira não repete foto, só quem pula de área em área — e aí a
 * distância já disfarça a repetição.
 */
export const CAPAS: Record<string, string> = {
  // IA e Consultoria — slugs alinhados com apps.ts (5 produtos oficiais)
  "planejamento": "/cards/card-planejamento.webp",
  iris: "/cards/card-openfinance.webp",
  "consultoria-diagnostico": "/cards/card-score.webp",
  "consultoria-investimentos": "/cards/card-comparador.webp",
  "consultoria-plano-vida": "/cards/card-objetivos.webp",
  "consultoria-financeira": "/cards/card-calculadora.webp",
  "consultoria-revisao-carteira": "/cards/card-perfil.webp",

  // Vida Financeira
  "orcamento-inteligente": "/cards/card-calculadora.webp",
  "reserva-emergencia": "/cards/card-leads-objetivos.webp",
  "correcao-inflacao": "/cards/card-leads-simulador.webp",
  "reajuste-aluguel": "/cards/card-dividas.webp",

  // Trabalho e Salário
  "salario-liquido": "/cards/card-novare.webp",
  rescisao: "/cards/card-aposentadoria.webp",
  ferias: "/cards/card-simulador.webp",
  "decimo-terceiro": "/cards/card-score.webp",

  // Investimentos
  "simulador-aposentadoria": "/cards/card-objetivos.webp",
  "simulador-cdi": "/cards/card-comparador.webp",
  "tesouro-direto": "/cards/card-perfil.webp",
  "rentabilidade-real": "/cards/card-leads-simulador.webp",
  "raio-x-previdencia": "/cards/card-openfinance.webp",

  // Simuladores
  "juros-compostos": "/cards/card-calculadora.webp",
  "simulador-financiamento": "/cards/card-leads-objetivos.webp",
  "financiamento-carro": "/cards/card-dividas.webp",
  "simulador-amortizacao": "/cards/card-openfinance.webp",
};

/**
 * O emblema 3D de cada app. Todo card tem o seu: é o que dá o acabamento
 * de produto e substitui o ícone plano de traço.
 */
export const EMBLEMAS: Record<string, string> = {
  // Produtos da casa — slugs alinhados com apps.ts (5 produtos oficiais)
  "planejamento": "/icones-3d/icon-vault-3d.png",
  iris: "/icones-3d/icon-premium-3d.png",
  "consultoria-diagnostico": "/icones-3d/clipboard-3d.png",
  "consultoria-investimentos": "/icones-3d/icon-growth-3d.png",
  "consultoria-plano-vida": "/icones-3d/target-3d.png",
  "consultoria-financeira": "/icones-3d/icon-financas.png",
  "consultoria-revisao-carteira": "/icones-3d/dashboard-3d.png",

  // Vida financeira
  "orcamento-inteligente": "/icones-3d/icon-financas.png",
  "reserva-emergencia": "/icones-3d/goal-reserva.png",
  "correcao-inflacao": "/icones-3d/ipca-3d.png",
  "reajuste-aluguel": "/icones-3d/goal-familia.png",

  // Trabalho e salário
  "salario-liquido": "/icones-3d/snapshot-3d.png",
  rescisao: "/icones-3d/parecer-3d.png",
  ferias: "/icones-3d/goal-viagem.png",
  "decimo-terceiro": "/icones-3d/goal-check-done.png",

  // Investimentos
  "simulador-aposentadoria": "/icones-3d/goal-aposentadoria.png",
  "simulador-cdi": "/icones-3d/cdi-3d.png",
  "tesouro-direto": "/icones-3d/selic-3d.png",
  "rentabilidade-real": "/icones-3d/icon-growth-3d.png",
  "raio-x-previdencia": "/icones-3d/icon-vault-3d.png",

  // Simuladores
  "juros-compostos": "/icones-3d/market-3d.png",
  "simulador-financiamento": "/icones-3d/goal-imovel.png",
  "financiamento-carro": "/icones-3d/goal-veiculo.png",
  "simulador-amortizacao": "/icones-3d/goal-dividas.png",
};

export function emblemaDe(slug: string): string | null {
  return EMBLEMAS[slug] ?? null;
}

/**
 * Tom da capa desenhada, para os apps sem foto.
 * Varia o ângulo e a mistura para os cinco não ficarem idênticos.
 */
export const CAPA_DESENHADA: Record<string, string> = {
  "juros-compostos":
    "linear-gradient(135deg, hsl(215 55% 20%), hsl(200 60% 30%))",
  "financiamento-casa":
    "linear-gradient(150deg, hsl(215 50% 23%), hsl(215 40% 38%))",
  "financiamento-carro":
    "linear-gradient(120deg, hsl(215 55% 21%), hsl(16 45% 34%))",
  "financiamento-terreno":
    "linear-gradient(160deg, hsl(215 50% 22%), hsl(152 35% 28%))",
  consorcio: "linear-gradient(135deg, hsl(215 60% 18%), hsl(215 45% 33%))",
  admin: "linear-gradient(135deg, hsl(220 15% 25%), hsl(220 12% 38%))",
};

export function capaDe(slug: string): string | null {
  return CAPAS[slug] ?? null;
}

export function gradienteDe(slug: string): string {
  return (
    CAPA_DESENHADA[slug] ??
    "linear-gradient(135deg, hsl(215 50% 23%), hsl(215 42% 34%))"
  );
}

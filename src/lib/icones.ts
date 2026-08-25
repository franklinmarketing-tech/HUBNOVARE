import {
  ShieldAlert,
  Activity,
  ArrowLeftRight,
  BadgePercent,
  Banknote,
  Bot,
  Building2,
  Calculator,
  Car,
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  Coins,
  Compass,
  CircleDollarSign,
  CreditCard,
  Eye,
  FastForward,
  FileSearch,
  FileSignature,
  FileText,
  FolderOpen,
  Gauge,
  Gift,
  Goal,
  Handshake,
  HandCoins,
  History,
  Home,
  KeyRound,
  Landmark,
  LifeBuoy,
  LineChart,
  LayoutGrid,
  LayoutDashboard,
  Magnet,
  Palmtree,
  Percent,
  PieChart,
  PiggyBank,
  Radar,
  Receipt,
  Repeat,
  Scale,
  Settings,
  Shuffle,
  Target,
  TrendingUp,
  Umbrella,
  Users,
  Wallet,
  Zap,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { APPS, type Familia } from "@/lib/apps";

/**
 * Identidade visual do ecossistema.
 *
 * Com quase sessenta soluções, cor por app viraria bagunça: a cor é POR
 * CATEGORIA (o olho aprende "verde = investimentos") e o ícone é por app.
 * Receita da base ui-ux-pro-max para finanças em tema claro: minimalismo,
 * cores profissionais, acento contido.
 */

const ICONES: Record<string, LucideIcon> = {
  // Workspace
  "planejamento": Compass,
  iris: Eye,

  // Organização
  "diagnostico-financeiro": Activity,
  "orcamento-inteligente": Wallet,
  "controle-gastos": Receipt,
  "fluxo-caixa-pessoal": ArrowLeftRight,
  "fluxo-caixa-familiar": HandCoins,
  "calendario-financeiro": CalendarClock,
  "organizador-assinaturas": Repeat,
  "metas-financeiras": Goal,
  "reserva-emergencia": Umbrella,
  "score-financeiro": Gauge,
  "controle-cartoes": CreditCard,
  "correcao-inflacao": History,
  "reajuste-aluguel": FileSignature,

  // Trabalho e salário
  "assistente-ia": Bot,

  "consultoria-diagnostico": ClipboardCheck,
  "consultoria-plano-de-vida": Goal,
  "consultoria-carteira": Scale,
  "consultoria-acompanhamento": Handshake,

  "salario-liquido": Wallet,
  "rescisao": FileText,
  "ferias": Palmtree,
  "decimo-terceiro": Gift,
  "fgts": PiggyBank,
  "seguro-desemprego": LifeBuoy,
  "imposto-de-renda": Receipt,

  // Investimentos
  "juros-compostos": TrendingUp,
  "simulador-aportes": Coins,
  "simulador-aposentadoria": PiggyBank,
  "comparador-investimentos": Scale,
  "simulador-cdi": Percent,
  "tesouro-direto": Landmark,
  "calculadora-dividendos": Banknote,
  "rentabilidade-real": LineChart,
  "raio-x-previdencia": ShieldAlert,
  rebalanceador: Shuffle,
  "raio-x-carteira": PieChart,

  // Crédito
  "pix-parcelado": Zap,
  "simulador-emprestimos": Banknote,
  "calculadora-cet": Calculator,
  "sac-x-price": Scale,
  portabilidade: Shuffle,
  renegociacao: Handshake,
  "home-equity": CircleDollarSign,
  "credito-consignado": BadgePercent,
  "simulador-consorcio": KeyRound,
  "quitacao-antecipada": FastForward,
  "capacidade-endividamento": Gauge,

  // Imobiliário
  "financiamento-carro": Car,
  "simulador-financiamento": Home,
  "comprar-ou-alugar": Scale,
  "potencial-compra": Target,
  "valorizacao-imoveis": TrendingUp,
  "rentabilidade-aluguel": Building2,
  "custos-compra": Receipt,
  "simulador-amortizacao": FastForward,
  "planejamento-entrada": Coins,
  "comparador-bancos": Landmark,
  "patrimonio-imobiliario": Building2,

  // Patrimônio
  "patrimonio-liquido": CircleDollarSign,
  "dashboard-patrimonial": LayoutDashboard,
  "organizador-seguros": Umbrella,
  "organizador-previdenciario": PiggyBank,
  "inventario-digital": ClipboardList,
  "planejamento-sucessorio": Users,
  "planejamento-tributario": FileSearch,
  "central-documentos": FolderOpen,
  "radar-financeiro": Radar,

  // Interno
  "app-novare": Landmark,
  leads: Magnet,
  "vidaplan-consultor": Users,
  admin: Settings,
};

/** Tom (matiz, saturação) de cada categoria. */
const TONS: Record<Familia | "workspace" | "interno", [number, number]> = {
  workspace: [215, 60],
  ia: [188, 62],
  organizacao: [215, 55],
  investimentos: [152, 55],
  trabalho: [40, 65],
  interno: [220, 12],
};

/** Categoria de cada slug, derivada do catálogo. */
const FAMILIA_DE = new Map(
  APPS.map((a) => [
    a.slug,
    (a.plano === "pago" && !a.familia
      ? "workspace"
      : a.plano === "interno"
        ? "interno"
        : (a.familia ?? "organizacao")) as Familia | "workspace" | "interno",
  ]),
);

function tomDe(slug: string): [number, number] {
  return TONS[FAMILIA_DE.get(slug) ?? "organizacao"];
}

export function iconeDe(slug: string): LucideIcon {
  return ICONES[slug] ?? LayoutGrid;
}


/**
 * FORMA do tile por categoria: além da cor, cada área tem uma silhueta.
 * O olho reconhece a forma antes de ler o nome — e cada uma tem um porquê:
 * círculo = moeda (investimentos); diagonal = dinheiro em movimento
 * (crédito); escudo = proteção (patrimônio); balão de conversa = IA
 * (inteligentes); quadrado estável = organização.
 */
const RAIOS: Record<Familia | "workspace" | "interno", string> = {
  workspace: "rounded-2xl",
  ia: "rounded-[14px]",
  organizacao: "rounded-xl",
  investimentos: "rounded-full",
  trabalho: "rounded-t-lg rounded-b-[22px]",
  interno: "rounded-lg",
};

export function raioDe(slug: string): string {
  return RAIOS[FAMILIA_DE.get(slug) ?? "organizacao"];
}

/** Gradiente do tile — mesma fórmula para todos, só muda o tom da categoria. */
export function gradienteDe(slug: string): string {
  const [h, s] = tomDe(slug);
  return `linear-gradient(135deg, hsl(${h} ${s}% 50%), hsl(${h} ${Math.min(s + 10, 85)}% 33%))`;
}

export function sombraTileDe(slug: string): string {
  const [h, s] = tomDe(slug);
  return `0 8px 18px -8px hsl(${h} ${s}% 38% / 0.55)`;
}

export function corDe(slug: string): string {
  const [h, s] = tomDe(slug);
  return `hsl(${h} ${s}% 42%)`;
}

export function sombraCardDe(slug: string): string {
  const [h, s] = tomDe(slug);
  return `0 14px 32px -14px hsl(${h} ${s}% 35% / 0.3)`;
}

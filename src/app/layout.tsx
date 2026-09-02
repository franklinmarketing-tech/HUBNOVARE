import type { Metadata } from "next";
import { DM_Sans, Inter, Sora } from "next/font/google";
import { LuzDoCursor } from "@/components/LuzDoCursor";
import { InclinaAoCursor } from "@/components/InclinaAoCursor";
import { FitaProgresso } from "@/components/FitaProgresso";
import { BannerConsentimento } from "@/components/BannerConsentimento";
import { ConviteDeSaida } from "@/components/ConviteDeSaida";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/**
 * Display do Hub: Sora — mesma fonte do Nord Liberta, a referência de
 * UX/UI que a Novare mandou seguir. Sans geométrica moderna, tech e limpa;
 * corpo segue Inter. (Cores permanecem no navy+laranja da marca Novare.)
 */
const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

/**
 * DM Sans — a tipografia da landing do Diagnóstico Patrimonial (/assinar).
 * Fica no <html> como variável e só é aplicada por quem pede (`.lp-novare`),
 * então o resto do Hub continua em Inter/Sora sem mudar um pixel.
 */
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    // "Novare Workspace" é o nome do produto no briefing e no manifest —
    // o site inteiro fala uma marca só.
    default: "Novare Workspace",
    template: "%s · Novare Workspace",
  },
  description:
    "O ponto de entrada da Novare: todos os seus planos, simuladores e ferramentas em um lugar só.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName: "Novare Hub",
    title: "Novare Workspace · Suas contas, com a conta certa",
    description:
      "Calculadoras financeiras gratuitas, sem cadastro, com as tabelas oficiais de 2026: salário líquido, rescisão, financiamento e mais.",
    // O preview que aparece ao colar o link no WhatsApp. Gerado por
    // `node scripts/gerar-og.mjs` a partir da home de verdade — rodar de
    // novo quando a home mudar de cara.
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Novare Workspace: as ferramentas financeiras da Novare",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Novare Workspace · Suas contas, com a conta certa",
    description:
      "Calculadoras financeiras gratuitas, sem cadastro, com as tabelas oficiais de 2026.",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${sora.variable} ${dmSans.variable}`}>
      <body>
        {children}
        <LuzDoCursor />
        <InclinaAoCursor />
        <FitaProgresso />
        <BannerConsentimento />
        <ConviteDeSaida />
      </body>
    </html>
  );
}

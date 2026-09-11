import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { LuzDoCursor } from "@/components/LuzDoCursor";
import { InclinaAoCursor } from "@/components/InclinaAoCursor";
import { FitaProgresso } from "@/components/FitaProgresso";
import { BannerConsentimento } from "@/components/BannerConsentimento";
import { ConviteDeSaida } from "@/components/ConviteDeSaida";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

/**
 * DM Sans, uma família só, corpo e display.
 *
 * O Hub vinha de Inter (corpo) + Sora (display) — Sora herdada do Nord
 * Liberta, uma referência de UX que não é da casa. Só que o site oficial da
 * Novare (diagnostico.novareapp.com.br) usa DM Sans em tudo e NÃO tem fonte
 * de display separada. Quem saía do site e entrava no Hub trocava de
 * tipografia duas vezes; agora nenhuma.
 *
 * Manter Sora só no display era defensável — os 436 `font-display` do Hub
 * foram ajustados a olho com o tracking dela. Mas isso preservaria
 * justamente a fonte que não é da marca no lugar mais visível da página: o
 * título. Fidelidade ganha, e o custo se paga em duas linhas de ajuste de
 * tracking no `globals.css`.
 *
 * Sem `weight`: é fonte variável (wght 100–1000), então o eixo inteiro vem
 * num arquivo só — o que importa porque o Hub usa de 400 a 800, e uma lista
 * fixa de pesos arredondaria os 100 `font-extrabold` para 700. Itálico fica
 * de fora de propósito: seriam dois arquivos para zero ocorrência no código.
 */
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

/* Vem de `lib/site`: era aqui que o fallback caía em localhost enquanto
   robots e sitemap caíam no domínio da Vercel. Um lugar só agora. */
const siteUrl = SITE_URL;

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
    <html lang="pt-BR" className={dmSans.variable}>
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

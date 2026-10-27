import type { Metadata } from "next";

/** Metadata desta ferramenta (a página é composta por um client component). */
export const metadata: Metadata = {
  title: "Calculadora de Aposentadoria: quando você vai viver de renda",
  description:
    "Descubra quanto patrimônio você precisa para viver de renda, quanto vai ter no seu ritmo de hoje e em que idade alcança a independência financeira.",
  alternates: { canonical: "/ferramentas/aposentadoria" },
  openGraph: {
    title: "Calculadora de Aposentadoria · Novare",
    description: "Quando você vai poder viver de renda?",
    url: "/ferramentas/aposentadoria",
    type: "website",
    locale: "pt_BR",
    images: ["/api/og?t=Calculadora%20de%20Aposentadoria&s=Quando%20voc%C3%AA%20vai%20poder%20viver%20de%20renda%3F"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

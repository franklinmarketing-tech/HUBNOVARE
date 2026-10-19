import type { Metadata } from "next";

/**
 * O TÍTULO DA TELA DE ENTRAR.
 *
 * ⚠️ ESTE LAYOUT EXISTE SÓ PARA ISTO. `login/page.tsx` é componente de
 * cliente (precisa de estado para os campos e o modo), e componente de
 * cliente não exporta `metadata` — então a rota herdava o título da home e
 * as duas apareciam idênticas na busca e no histórico do navegador.
 *
 * ⚠️ `noindex` DE PROPÓSITO: tela de login não tem o que ranquear, e
 * quando aparece na busca rouba o clique da página que deveria receber a
 * pessoa. O Google trata isso como resultado de baixa qualidade.
 */
export const metadata: Metadata = {
  title: "Entrar · Novare",
  description:
    "Acesse a sua conta da Novare. É o mesmo login do app — e criar conta é grátis.",
  robots: { index: false, follow: true },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

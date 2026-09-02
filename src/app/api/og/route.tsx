import { ImageResponse } from "next/og";

/**
 * A imagem de compartilhamento, desenhada na hora.
 *
 * As 57 ferramentas dividiam um `/og.png` só. Colar o link do Salário Líquido
 * ou o do Financiamento no WhatsApp dava exatamente o mesmo cartão — o que
 * desperdiça o único pedaço de página que a pessoa vê antes de decidir clicar.
 *
 * Aqui o cartão sai do próprio título da rota, então ferramenta nova nasce com
 * a sua sem ninguém desenhar nada. Não custa imagem gerada nem arquivo em
 * disco: é HTML renderizado pelo runtime do Next e cacheado na borda.
 *
 * Uso: `/api/og?t=Salário Líquido&s=Quanto cai na conta`
 */
export const runtime = "edge";

// Os mesmos tokens do site — ver CLAUDE.md do workspace.
const NAVY = "#1d3a5f";
const NAVY_FUNDO = "#0e1b2e";
const LARANJA = "#e8703a";
const CIANO = "#38bdf8";

export function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const titulo = (searchParams.get("t") ?? "Novare Workspace").slice(0, 80);
  const sub = (searchParams.get("s") ?? "Ferramenta gratuita, sem cadastro").slice(0, 120);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: `linear-gradient(140deg, ${NAVY} 0%, ${NAVY_FUNDO} 100%)`,
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        {/* Faixa de luz no canto: o mesmo gesto das cenas do site, feito só
            com gradiente porque aqui não há como carregar imagem externa. */}
        <div
          style={{
            position: "absolute",
            top: -180,
            right: -120,
            width: 620,
            height: 620,
            borderRadius: 999,
            background: `radial-gradient(circle, ${LARANJA}55, transparent 70%)`,
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: LARANJA,
              display: "flex",
            }}
          />
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 6,
              color: "#ffffff",
              display: "flex",
            }}
          >
            NOVARE
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: titulo.length > 34 ? 66 : 84,
              fontWeight: 800,
              lineHeight: 1.05,
              color: "#ffffff",
              display: "flex",
              maxWidth: 950,
            }}
          >
            {titulo}
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 32,
              color: "#ffffffb0",
              display: "flex",
              maxWidth: 900,
            }}
          >
            {sub}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              height: 6,
              width: 90,
              borderRadius: 999,
              background: `linear-gradient(90deg, ${CIANO}, ${LARANJA})`,
              display: "flex",
            }}
          />
          <div style={{ fontSize: 26, color: "#ffffff90", display: "flex" }}>
            novareapp.com.br · sem cadastro
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}

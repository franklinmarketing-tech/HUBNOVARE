import Image from "next/image";
import Link from "next/link";
import { CONTATO } from "@/lib/contato";
import { Globe, Mail, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { InstagramLogo, YoutubeLogo, LinkedinLogo } from "@/components/LogosSociais";
import { APPS } from "@/lib/apps";

const ANO = new Date().getFullYear();


/**
 * O fecho de toda ferramenta: o convite para falar com a consultoria e o
 * rodapé institucional.
 *
 * Simular é o começo da conversa, não o fim — quem acabou de ver o próprio
 * número na tela é justamente quem está pronto para falar com gente. Vive
 * no layout das ferramentas, então cada tela nova já nasce com ele.
 */
export function RodapeNovare() {
  // As quatro primeiras do catálogo vivo: nunca aponta para rota podada.
  const ferramentas = APPS.filter(
    (a) => a.familia && a.plano === "gratis" && a.status !== "em-breve",
  ).slice(0, 4);

  const zap = `https://wa.me/${CONTATO.whatsapp}?text=${encodeURIComponent(
    "Olá! Usei as ferramentas da Novare e quero falar sobre o meu planejamento.",
  )}`;

  return (
    <>
      {/* Convite: o único bloco navy da página depois do resultado. */}
      <section className="mx-auto max-w-3xl px-4 pb-12">
        <div className="relative overflow-hidden rounded-3xl bg-primary sm:flex sm:items-stretch">
          <div className="relative z-10 p-7 sm:flex-1 sm:p-9">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[hsl(205_95%_75%)]">
              Novare · Consultoria de Investimentos
            </p>
            <h2 className="mt-3 max-w-md font-display text-2xl font-bold leading-tight text-white sm:text-[1.75rem]">
              Construindo seu futuro financeiro com clareza e propósito
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
              Simular é só o primeiro passo. Fale com quem cuida de patrimônio
              todo dia e receba uma leitura do seu caso — sem comissão, porque a
              Novare não vende produto de banco.
            </p>

            <a
              href={zap}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-primary transition-transform hover:-translate-y-0.5"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={2} />
              Falar com a Novare
            </a>
          </div>

          {/* Foto real dos sócios/consultores da Novare, mesclada no navy. */}
          <div className="relative hidden w-2/5 shrink-0 sm:block">
            <Image
              src="/marca/novare-site/socios-novare.jpg"
              alt="Sócios e consultores da Novare"
              fill
              sizes="340px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/40 to-transparent" />
          </div>
        </div>
      </section>

      {/* Rodapé institucional */}
      <footer className="pb-24 sm:pb-16 bg-primary text-white/70">
        <div className="mx-auto grid max-w-5xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Image
              src="/marca/logo-novare-branca.png"
              alt="Novare"
              width={128}
              height={32}
              className="h-7 w-auto"
            />
            <p className="mt-4 text-[13px] leading-relaxed text-white/55">
              Consultoria de investimentos independente. Planejamento
              financeiro, alocação e acompanhamento contínuo para os seus
              objetivos de vida.
            </p>

            {/* Co-branding: parceria oficial com a Nord Investimentos */}
            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
              Parceiro oficial
            </p>
            <div className="mt-2 inline-flex items-center rounded-lg bg-white px-2.5 py-1.5">
              <Image
                src="/marca/novare-site/logo-nord.png"
                alt="Nord Investimentos"
                width={96}
                height={30}
                className="h-5 w-auto"
              />
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[hsl(205_95%_75%)]">
              Ferramentas
            </h3>
            <ul className="mt-4 space-y-2.5">
              {ferramentas.map((f) => (
                <li key={f.slug}>
                  <Link
                    href={f.href}
                    className="text-[13px] text-white/60 transition-colors hover:text-white"
                  >
                    {f.nome}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/aplicativos"
                  className="text-[13px] font-medium text-white/80 transition-colors hover:text-white"
                >
                  Ver todas
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[hsl(205_95%_75%)]">
              Institucional
            </h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <a
                  href="https://novareinvestimentos.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] font-medium text-white/70 transition-colors hover:text-white"
                >
                  Site oficial da Novare ↗
                </a>
              </li>
              <li>
                <Link
                  href="/novare-news"
                  className="text-[13px] text-white/60 transition-colors hover:text-white"
                >
                  Novare News
                </Link>
              </li>
              <li>
                <Link
                  href="/consultoria"
                  className="text-[13px] text-white/60 transition-colors hover:text-white"
                >
                  Consultoria
                </Link>
              </li>
              <li>
                <Link
                  href="/assinar"
                  className="text-[13px] text-white/60 transition-colors hover:text-white"
                >
                  Workspace
                </Link>
              </li>
              <li>
                <Link
                  href="/privacidade"
                  className="text-[13px] text-white/60 transition-colors hover:text-white"
                >
                  Privacidade & LGPD
                </Link>
              </li>
              <li>
                <Link
                  href="/termos"
                  className="text-[13px] text-white/60 transition-colors hover:text-white"
                >
                  Termos de Uso
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[hsl(205_95%_75%)]">
              Fale com a gente
            </h3>
            <ul className="mt-4 space-y-2.5 text-[13px]">
              <li>
                <a
                  href={zap}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-white/60 transition-colors hover:text-white"
                >
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {CONTATO.telefone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTATO.email}`}
                  className="flex items-center gap-2 text-white/60 transition-colors hover:text-white"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  {CONTATO.email}
                </a>
              </li>
              <li>
                <a
                  href={`https://${CONTATO.site}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-white/60 transition-colors hover:text-white"
                >
                  <Globe className="h-3.5 w-3.5 shrink-0" />
                  {CONTATO.site}
                </a>
              </li>
            </ul>

            {/* Redes: os ícones oficiais, não texto — é o rodapé mais
                visível do site. */}
            <div className="mt-5 flex items-center gap-2">
              <a
                href="https://www.instagram.com/novare.invest"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Novare no Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-white/60 transition-colors hover:bg-white/15 hover:text-white"
              >
                <InstagramLogo className="h-4 w-4" />
              </a>
              <a
                href="https://www.youtube.com/channel/UCtfpNaHW_Jx7T7U91lXpJhQ"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Novare no YouTube"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-white/60 transition-colors hover:bg-white/15 hover:text-white"
              >
                <YoutubeLogo className="h-4 w-4" />
              </a>
              <a
                href="https://www.linkedin.com/in/novare-consultoria-de-investimentos-ab0808386/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Novare no LinkedIn"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-white/60 transition-colors hover:bg-white/15 hover:text-white"
              >
                <LinkedinLogo className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* O aviso legal não é enfeite: consultoria é obrigada a exibi-lo. */}
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-5">
            <p className="text-[11px] text-white/60">
              © {ANO} Novare Consultoria de Investimentos. Todos os direitos
              reservados.
            </p>
            <p className="flex items-start gap-2 text-[11px] leading-relaxed text-white/60">
              <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0" />
              <span>
                Conteúdo educacional. Não constitui recomendação nem oferta de
                investimento.
                <br className="hidden sm:block" /> Rentabilidade passada não
                garante resultados futuros.
              </span>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}

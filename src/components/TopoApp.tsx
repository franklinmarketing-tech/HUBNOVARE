"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Search, Mail, ArrowRight, Sparkles } from "lucide-react";
import { MenuVideos } from "@/components/MenuVideos";
import { CHAVE_CONTEUDO, MenuAreas } from "@/components/MenuAreas";
import { MenuConta } from "@/components/MenuConta";
import { SinoNotificacoes } from "@/components/SinoNotificacoes";
import type { Portal } from "@/lib/categorias";
import type { Notificacao } from "@/lib/notificacoes";
import { RedesSociais } from "@/components/RedesSociais";
import { BotaoNovidades } from "@/components/BotaoNovidades";

/**
 * Topo do aplicativo: saudação à esquerda, o menu das áreas no centro e o
 * selo do plano à direita.
 *
 * O menu é o que transforma o site em sistema — o catálogo inteiro fica
 * acessível de qualquer página. Por isso a busca saiu daqui e foi para a
 * linha do título: no topo ela competia com o menu pelo mesmo espaço.
 */
export function TopoApp({
  nome,
  email = "",
  assinante,
  admin = false,
  logado,
  portais = [],
  notificacoes = [],
  comBusca = false,
}: {
  nome: string | null;
  email?: string;
  assinante: boolean;
  admin?: boolean;
  logado: boolean;
  portais?: Portal[];
  notificacoes?: Notificacao[];
  /** Telas sem busca própria (as internas) mantêm o campo aqui. */
  comBusca?: boolean;
}) {
  const primeiroNome = nome?.split(" ")[0] ?? null;

  /* O topo "assenta" ao rolar (21/10/2026, "mais moderno"): no alto da
     página é vidro claro; rolando, fica mais sólido e ganha sombra. */
  const [rolou, setRolou] = useState(false);
  useEffect(() => {
    const ver = () => setRolou(window.scrollY > 8);
    ver();
    window.addEventListener("scroll", ver, { passive: true });
    return () => window.removeEventListener("scroll", ver);
  }, []);

  return (
    <header
      className={`sticky top-0 z-20 transition-[background-color,box-shadow] duration-300 ${
        rolou
          ? "bg-white/95 shadow-[0_10px_30px_-18px_hsl(199_75%_16%/0.35)] backdrop-blur-xl"
          : "bg-white/70 backdrop-blur-xl"
      }`}
    >
      {/* O fio de luz no pé do topo: ciano → laranja, as cores da casa. */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-ciano/60 to-transparent" />
      <span aria-hidden className="pointer-events-none absolute inset-x-[30%] bottom-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
      {/* ⚠️ Espaço contado (auditoria de 25/10/2026): com `gap-4` fixo o menu da conta saía da tela
          em TODA largura quando logado (360: 399px de itens; 1280: menu de 602px + rótulos). O
          espaçamento cresce com a tela, e eBooks/News/nome da conta só mostram texto a partir de 2xl. */}
      <div className="flex h-[68px] items-center gap-2 px-4 sm:px-5 md:gap-3 2xl:gap-4">
        {/* A logo oficial fica em TODAS as larguras: o monograma do trilho
            é um atalho de navegação, não substitui a marca. */}
        {/* min-h-11: o alvo seguia a altura da imagem (24px) dentro de um
             cabeçalho de 72. */}
        <Link
          href="/"
          className="inline-flex min-h-11 shrink-0 items-center"
          aria-label="Novare, início"
        >
          <Image
            src="/marca/logo-novare.png"
            alt="Novare"
            width={100}
            height={26}
            priority
            style={{ height: 24, width: "auto" }}
          />
        </Link>

        {/* As redes, à direita do logo — só a partir de lg, onde já sobra
            espaço antes do menu central. Ícone oficial colorido, não o
            traço cinza fino de antes: em 18px precisa da forma reconhecível
            da marca para não virar mancha.

            SÓ PARA VISITANTE. No app logado elas apontavam para fora numa
            barra cuja função é navegar por dentro: quem entrou para ver o
            próprio plano não está ali para abrir o Instagram. O lugar delas
            é o rodapé do site público, onde continuam. */}
        {/* ⚠️ ERA SÓ PARA DESLOGADO, e o dono pediu em TODAS as telas.

            A condição `!logado` escondia as redes exatamente de quem já é
            cliente — que é quem tem mais motivo para seguir a casa. O
            breakpoint também subiu de `lg` para `sm`: em `lg` os ícones
            sumiam no tablet e no celular, onde a maior parte da audiência
            de rede social está. */}
        {/* 06/11/2026 (menu numa linha só): entre 1024 e 1699px as redes saem do topo para os
            atalhos escritos caberem; seguem no rodapé e voltam aqui a partir de 1700px. O selo Nord volta em 1800px e o "Bem-vindo" em 2000px. */}
        <RedesSociais className="hidden shrink-0 border-l border-slate-200 pl-3 max-xl:flex min-[1366px]:flex" tamanho="h-4 w-4 sm:h-[18px] sm:w-[18px]" />

        {/* ⚠️ O "INSCREVA-SE" TAMBÉM AQUI, pedido do dono: o Novare News
            tinha esse botão no topo e o Workspace não, embora a seção de
            inscrição já vivesse na home.

            Aponta para `/#inscrever` e não para `#inscrever`: este topo
            aparece em /aplicativos e /meu-dia, onde a seção não existe — a
            âncora sozinha não faria nada nessas telas. Com a barra, o
            navegador vai para a home e rola até lá. */}
        <a
          href="/#inscrever"
          /* Só a partir de 1800px desde 19/10/2026: com o botão eBooks ao lado
             do News, em 1280px o "Entrar" saía da tela. Quem quer se
             inscrever acha a faixa no fim da home. */
          className="hidden shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-2xs font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary min-[1800px]:flex"
        >
          <Mail className="h-3.5 w-3.5" />
          Inscreva-se
        </a>

        {/* Selo de parceria oficial com a Nord Investimentos.
            Só a partir de 2xl: entre 1280 e 1536 ele disputava espaço com o
            menu de áreas e empurrava o botão "Entrar" para fora da tela. */}
        <div className="hidden shrink-0 items-center gap-2 border-l border-slate-200 pl-3 min-[1800px]:flex">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
            Parceiro
          </span>
          <Image
            src="/marca/novare-site/logo-nord.png"
            alt="Nord Investimentos"
            width={72}
            height={23}
            style={{ height: 18, width: "auto" }}
          />
        </div>

        <div className="hidden min-w-0 shrink-0 border-l border-slate-200 pl-4 min-[2000px]:block">
          <p className="truncate text-[15px] font-bold text-foreground">
            {primeiroNome ? `Olá, ${primeiroNome}` : "Bem-vindo à Novare"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            Seus aplicativos financeiros
          </p>
        </div>

        {/* O menu das áreas ocupa o centro; ele some no celular, onde o
            acesso é pela busca e pelos cards. */}
        {/* O MENU ÚNICO (06/11/2026, "reconstruir com padrão"): as áreas do catálogo e,
            no fim, "Conteúdo" (News, Vídeos, eBooks), todos no MESMO estilo de cápsula. */}
        <div className="mx-auto">
          <MenuAreas portais={[...portais, CONTEUDO]} fim={<MenuVideos />} />
        </div>

        {/* O único botão de destaque do topo: o NovareCash, em ouro. */}
        <BotaoNovareCash />
        <span aria-hidden className="hidden h-6 w-px shrink-0 bg-slate-200 md:block" />

        {/* Novidades (25/10/2026): só o ícone — o topo já é justo em 1280px.
            Fica fora do celular pelo mesmo motivo: em 390px logo, redes,
            busca, sino e avatar já ocupam a linha toda. */}
        <BotaoNovidades className="hidden sm:block" />

        {/* min-w-0 + flex-1: sem isso a busca não cede espaço e o botão da
            direita sai da tela no celular. */}
        {comBusca ? (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("novare:abrir-paleta"))}
            aria-label="Pesquisar"
            className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 text-left text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:bg-white max-[379px]:hidden sm:max-w-xs sm:px-4"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">Pesquisar...</span>
            <kbd className="hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] lg:block">
              Ctrl K
            </kbd>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("novare:abrir-paleta"))}
            aria-label="Pesquisar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-500 transition-colors hover:border-ciano/40 hover:text-primary max-[379px]:hidden xl:hidden"
          >
            <Search className="h-4 w-4" />
          </button>
        )}

        {/* Sino e avatar: o selo de plano que ficava aqui só informava, e o
            plano continua visível — agora dentro do menu, junto do caminho
            para trocá-lo, ver o cadastro e sair. */}
        {logado ? (
          <>
            <SinoNotificacoes notificacoes={notificacoes} />
            <MenuConta
              nome={nome ?? ""}
              email={email}
              assinante={assinante}
              admin={admin}
            />
          </>
        ) : (
          <Link
            href="/login"
            className="btn-petroleo shrink-0 min-h-10 px-4 text-xs"
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}

/** O item "Conteúdo" do menu: os canais da casa, no mesmo painel das áreas. */
const CONTEUDO = {
  chave: CHAVE_CONTEUDO,
  titulo: "Conteúdo",
  curto: "Conteúdo",
  descricao: "Os canais da Novare: artigos, vídeos e eBooks gratuitos.",
  capa: "",
  h: 199,
  s: 75,
  total: 3,
  rotuloTotal: "canais",
  destaques: ["novare-news"],
  destino: "/novare-news",
  destinoExterno: false,
  selo: "Grátis",
  itens: [
    { slug: "novare-news", nome: "Novare News", chamada: "Dinheiro explicado, sem letra miúda", href: "/novare-news", aberto: true, externo: false },
    { slug: "novare-videos", nome: "Novare Vídeos", chamada: "Os vídeos do canal no YouTube", href: "/novare-videos", aberto: true, externo: false },
    { slug: "ebooks", nome: "eBooks grátis", chamada: "Guias para baixar e ler com calma", href: "/ebooks", aberto: true, externo: false },
  ],
} as unknown as Portal;

/**
 * O NovareCash no topo (06/11/2026, "ele é especial"): o ÚNICO botão escuro da linha clara —
 * noite com aro dourado, o ícone num quadrado de ouro, "Novare" + "Cash" como na marca e uma
 * lâmina de brilho passando de tempos em tempos (`nc-brilho`, em globals.css; parada para quem
 * pediu menos movimento).
 */
function BotaoNovareCash() {
  const caminho = usePathname() ?? "";
  const ativo = caminho === "/novarecash" || caminho.startsWith("/novarecash/");
  return (
    <Link
      href="/novarecash"
      aria-label="NovareCash"
      aria-current={ativo ? "page" : undefined}
      className="nc-brilho group relative hidden h-10 shrink-0 items-center gap-2 overflow-hidden rounded-full bg-[linear-gradient(135deg,hsl(205_55%_12%),hsl(203_70%_6%))] pl-1 pr-4 shadow-[0_10px_24px_-12px_hsl(36_78%_32%/0.9),inset_0_1px_0_hsl(42_74%_62%/0.25)] ring-1 ring-ouro/55 transition-transform hover:-translate-y-px md:inline-flex"
    >
      <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[conic-gradient(from_210deg,hsl(36_78%_42%),hsl(45_90%_72%),hsl(36_78%_42%))] shadow-[inset_0_1px_0_hsl(0_0%_100%/0.5)]">
        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[hsl(203_70%_7%)]">
          <Sparkles className="h-3.5 w-3.5 text-ouro" strokeWidth={2.25} />
        </span>
      </span>
      <span aria-hidden className="font-display text-[14px] font-semibold tracking-[-0.02em]">
        <span className="text-white">Novare</span>
        <span className="bg-[linear-gradient(90deg,hsl(42_74%_62%),hsl(45_90%_76%))] bg-clip-text text-transparent">Cash</span>
      </span>
      <span aria-hidden className="relative ml-0.5 flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-ouro opacity-70 motion-safe:animate-ping" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-ouro" />
      </span>
    </Link>
  );
}

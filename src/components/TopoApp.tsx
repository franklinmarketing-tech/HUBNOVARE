"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { BookOpen, Newspaper, PlayCircle, Wallet, Search, Mail, ArrowRight } from "lucide-react";
import { MenuAreas } from "@/components/MenuAreas";
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
        <RedesSociais className="hidden shrink-0 max-lg:flex min-[1700px]:flex" tamanho="h-4 w-4 sm:h-[18px] sm:w-[18px]" />

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
        <div className="mx-auto">
          <MenuAreas portais={portais} />
        </div>

        {/* OS ATALHOS COM NOME ESCRITO, NA MESMA LINHA (06/11/2026, pedido do dono). */}
        <BarraAtalhos />

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

const ATALHOS = [
  { href: "/novare-news", rotulo: "News", Icone: Newspaper, aoVivo: true },
  { href: "/novare-videos", rotulo: "Vídeos", Icone: PlayCircle },
  { href: "/ebooks", rotulo: "eBooks", Icone: BookOpen },
] as const;

/**
 * Os atalhos do topo, NUMA LINHA SÓ com o menu de áreas. O NovareCash (ouro) tem o nome
 * sempre a partir do tablet; News, Vídeos e eBooks mostram o nome a partir de 1280px (abaixo,
 * só o ícone, que o espaço não dá). No celular quem faz esse papel é a `BarraInferior`.
 */
function BarraAtalhos() {
  const caminho = usePathname() ?? "";
  const ativo = (href: string) => caminho === href || caminho.startsWith(`${href}/`);

  return (
    <nav aria-label="Atalhos" className="hidden shrink-0 md:block">
      <ul className="flex items-center gap-1">
        <li>
          <Link
            href="/novarecash"
            aria-current={ativo("/novarecash") ? "page" : undefined}
            className="group inline-flex h-10 items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,hsl(42_80%_94%),hsl(42_74%_82%))] pl-1.5 pr-3 text-[13px] font-bold text-ouro-forte shadow-[0_6px_16px_-10px_hsl(36_78%_32%/0.8)] ring-1 ring-ouro/60 transition-transform hover:-translate-y-px"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ouro-forte text-white">
              <Wallet className="h-3.5 w-3.5" />
            </span>
            NovareCash
            <span className="hidden rounded-full bg-ouro-forte px-1.5 py-px text-[9px] font-black uppercase tracking-wider text-white 2xl:inline">
              Novo
            </span>
          </Link>
        </li>
        {ATALHOS.map(({ href, rotulo, Icone, ...resto }) => {
          const marcado = ativo(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-label={rotulo}
                title={rotulo}
                aria-current={marcado ? "page" : undefined}
                className={`inline-flex h-10 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-semibold transition-colors xl:px-3 ${
                  marcado ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-100 hover:text-primary"
                }`}
              >
                {"aoVivo" in resto && resto.aoVivo && (
                  <span aria-hidden className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-ciano opacity-60 motion-safe:animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-ciano" />
                  </span>
                )}
                <Icone className="h-4 w-4" />
                <span className="hidden xl:inline">{rotulo}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

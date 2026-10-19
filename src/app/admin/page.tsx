import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowRight,
  Flame,
  LineChart,
  MousePointerClick,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPerfil } from "@/lib/perfil";
import {
  BarrasPorDia,
  FaltaRodarSql,
  Hero,
  Numero,
  SeletorDePeriodo,
  variacaoPct,
} from "./pecas";

export const metadata = { title: "Saúde da Novare" };

/**
 * A SAÚDE DA NOVARE NUMA TELA.
 *
 * ⚠️ ANTES DISTO, `/admin` SÓ REDIRECIONAVA para a lista de leads. Dava para
 * ver os leads e ver os cadastros, mas não para LIGAR os dois — e é no
 * encontro deles que mora a única pergunta que importa: as iscas estão
 * virando gente de verdade?
 *
 * ⚠️ O NÚMERO DE OURO É A CONVERSÃO. Lead que nunca criou conta é e-mail
 * numa planilha. O cálculo cruza `hub_leads.email` com `auth.users.email`,
 * o que só é possível por função `security definer`: o PostgREST não expõe
 * `auth.users`.
 *
 * ⚠️ ESTA TELA NASCE QUASE VAZIA, E ISSO É ESPERADO. A medição de uso
 * começou em 18/10/2026; todo lead anterior a essa data existe sem nenhuma
 * visita registrada. Os números de visita sobem conforme o Jefferson
 * divulga — não são retroativos, e nenhum truque os faria ser.
 */

type Saude = {
  leads: number;
  leads_antes: number;
  cadastros: number;
  cadastros_antes: number;
  leads_convertidos: number;
  contas_fincash: number;
  ativos_7d: number;
  sumidos_30d: number;
  por_tratar: number;
};

type Ponto = { dia: string; leads: number; cadastros: number };

export default async function PainelSaude({
  searchParams,
}: {
  searchParams: Promise<{ dias?: string }>;
}) {
  const perfil = await getPerfil();
  if (!perfil) redirect("/login?proximo=/admin");
  if (perfil.role !== "admin" && perfil.role !== "equipe") notFound();

  const { dias: diasBruto } = await searchParams;
  const dias = [7, 30, 90, 365].includes(Number(diasBruto)) ? Number(diasBruto) : 30;

  const supabase = await createClient();
  const [{ data: saudeBruta, error: erroSaude }, { data: linha }] = await Promise.all([
    supabase.rpc("hub_saude", { p_dias: dias }),
    supabase.rpc("hub_linha_do_tempo", { p_dias: dias }),
  ]);

  if (erroSaude) {
    return (
      <div className="space-y-6">
        <Hero etiqueta="Painel da Novare" titulo="Saúde da casa" />
        <FaltaRodarSql erro={erroSaude.message} arquivo="painel_novare_INSTALAR.sql" />
      </div>
    );
  }

  /* A função devolve uma linha só; sem permissão devolve nenhuma. */
  const s = (saudeBruta as Saude[])?.[0];
  const pontos = (linha as Ponto[]) ?? [];

  if (!s) {
    return (
      <div className="space-y-6">
        <Hero etiqueta="Painel da Novare" titulo="Saúde da casa" />
        <div className="rounded-2xl border border-border bg-white p-6">
          <p className="text-sm text-muted-foreground">
            Sem dados para mostrar com o seu perfil.
          </p>
        </div>
      </div>
    );
  }

  /* ⚠️ A CONVERSÃO É SOBRE A BASE INTEIRA, não sobre o período escolhido.
     Quem deixou o e-mail em agosto e criou conta em outubro converteu — e
     uma taxa que só olhasse 7 dias chamaria isso de fracasso. */
  const conversao = s.leads > 0 || s.leads_convertidos > 0 ? s.leads_convertidos : 0;

  const cartoes = [
    {
      rotulo: "Leads no período",
      valor: s.leads,
      Icone: UserPlus,
      variacao: variacaoPct(s.leads, s.leads_antes),
      detalhe: `${s.leads_antes} antes`,
      tom: "destaque" as const,
      href: `/admin/leads?dias=${dias}`,
    },
    {
      rotulo: "Contas criadas",
      valor: s.cadastros,
      Icone: UserCheck,
      variacao: variacaoPct(s.cadastros, s.cadastros_antes),
      detalhe: `${s.cadastros_antes} antes`,
      tom: "destaque" as const,
    },
    {
      rotulo: "Leads que viraram conta",
      valor: conversao,
      Icone: MousePointerClick,
      detalhe: "desde sempre, não só no período",
      tom: "destaque" as const,
    },
    {
      rotulo: "Usam o FINCASH",
      valor: s.contas_fincash,
      Icone: Wallet,
      detalhe: "lançaram pelo menos uma vez",
    },
    {
      rotulo: "Ativos nos 7 dias",
      valor: s.ativos_7d,
      Icone: Flame,
      detalhe: "lançaram algo nesta semana",
    },
    {
      rotulo: "Sumidos há 30 dias",
      valor: s.sumidos_30d,
      Icone: Users,
      detalhe: "já usaram e pararam",
      tom: s.sumidos_30d > 0 ? ("atencao" as const) : ("normal" as const),
    },
  ];

  return (
    <div className="space-y-6">
      <Hero
        etiqueta="Painel da Novare"
        titulo="Como vai a casa"
        acao={
          s.por_tratar > 0 ? (
            <Link
              href="/admin/leads?situacao=novo"
              className="flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent/90"
            >
              {s.por_tratar} {s.por_tratar === 1 ? "lead esperando" : "leads esperando"}
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
            </Link>
          ) : undefined
        }
      >
        Quem chegou, quem ficou e quais iscas estão trabalhando. Os números
        comparam o período escolhido com o período anterior de mesmo tamanho.
      </Hero>

      {/* ⚠️ O FILTRO FICA AQUI, logo abaixo do hero — nunca no fim. */}
      <SeletorDePeriodo base="/admin" dias={dias} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cartoes.map((c) => (
          <Numero key={c.rotulo} {...c} />
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <BarrasPorDia
          rotulo="leads"
          dados={pontos.map((p) => ({ dia: p.dia, valor: p.leads }))}
        />
        <BarrasPorDia
          rotulo="cadastros"
          dados={pontos.map((p) => ({ dia: p.dia, valor: p.cadastros }))}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Atalho
          href={`/admin/iscas?dias=${dias}`}
          Icone={LineChart}
          titulo="Quais iscas trazem gente"
          texto="O desempenho de cada ferramenta, com o link pronto para divulgar."
        />
        <Atalho
          href={`/admin/leads?dias=${dias}`}
          Icone={Users}
          titulo="Trabalhar os leads"
          texto="Quem deixou contato, em que pé está a conversa e o WhatsApp a um clique."
        />
      </div>
    </div>
  );
}

function Atalho({
  href,
  Icone,
  titulo,
  texto,
}: {
  href: string;
  Icone: typeof Users;
  titulo: string;
  texto: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3.5 rounded-2xl border border-border bg-white p-4 shadow-sm transition-colors hover:border-primary/40"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
        <Icone className="h-5 w-5" strokeWidth={1.9} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-display text-sm font-bold text-primary">
          {titulo}
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
            strokeWidth={2.2}
          />
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
          {texto}
        </span>
      </span>
    </Link>
  );
}

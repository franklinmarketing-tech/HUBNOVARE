import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Landmark,
  MessageCircle,
  PenLine,
  Sparkles,
  Target,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { MinhaAssinatura } from "@/lib/novarecash/acesso";
import type { ResultadoRetrato, Retrato } from "@/lib/novarecash/retrato";
import { CartaoAlertas } from "./_inicio/CartaoAlertas";
import { CartaoMetas } from "./_inicio/CartaoMetas";
import { CartaoPrevisao } from "./_inicio/CartaoPrevisao";
import { CartaoProximasContas } from "./_inicio/CartaoProximasContas";
import {
  AvisoErro,
  AvisoSemTabela,
  Barra,
  Botao,
  COR_ENTRADA,
  COR_SAIDA,
  Cabecalho,
  Cartao,
  Selo,
  brl,
  type TomSelo,
} from "./pecas";

/**
 * O INÍCIO, desenhado no servidor (não há estado aqui: os números chegam
 * prontos de `carregarRetrato`).
 */

export type CartaoRecurso = {
  chave: "ia" | "whatsapp" | "banco";
  titulo: string;
  texto: string;
  href: string;
  /** pronto = funciona; ligando = no ar, mas falta chave; ativacao = cliente espera; teste = só a equipe vê funcionando. */
  situacao: "pronto" | "ligando" | "ativacao" | "teste";
  liberaEm?: string;
};

const ICONE: Record<CartaoRecurso["chave"], LucideIcon> = {
  ia: Sparkles,
  whatsapp: MessageCircle,
  banco: Landmark,
};

const dataLonga = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

export function TelaInicio({
  nome,
  resultado,
  assinatura,
  equipe,
  recursos,
  bancoLiberado,
  bancoLiberaEm,
}: {
  nome: string | null;
  resultado: ResultadoRetrato;
  assinatura: MinhaAssinatura;
  equipe: boolean;
  recursos: CartaoRecurso[];
  bancoLiberado: boolean;
  bancoLiberaEm?: string;
}) {
  return (
    <div className="surgir space-y-5">
      <Cabecalho
        titulo={nome ? `Olá, ${nome}` : "Início"}
        resumo="O seu dinheiro num lugar só: o extrato enche sozinho pelo banco e pelo WhatsApp, e você lança à mão quando quiser."
      />

      {resultado.estado === "sem-tabela" ? (
        <AvisoSemTabela />
      ) : resultado.estado === "erro" ? (
        <AvisoErro
          titulo="Não consegui ler o seu mês agora"
          mensagem="O que você registrou continua guardado. Recarregue a página em instantes."
          href="/novarecash/app"
        />
      ) : resultado.retrato.vazio ? (
        <PrimeiroPasso bancoLiberado={bancoLiberado} bancoLiberaEm={bancoLiberaEm} />
      ) : (
        <Painel r={resultado.retrato} />
      )}

      {/* 04/11/2026 ("todas as melhorias"): previsão, próximas contas, alertas e metas. Os dois
          primeiros buscam os próprios dados no navegador; alertas e metas vêm do MESMO retrato da IA. */}
      {resultado.estado === "ok" && !resultado.retrato.vazio && (
        <div className="grid gap-3 lg:grid-cols-2">
          <CartaoPrevisao />
          <CartaoProximasContas />
          <CartaoAlertas resultado={resultado.retrato.alertas} />
          <CartaoMetas resultado={resultado.retrato.metas} />
        </div>
      )}

      <section aria-labelledby="titulo-recursos">
        <h2 id="titulo-recursos" className="font-display text-base font-semibold text-white">
          Banco, WhatsApp e IA
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {recursos.map((r) => (
            <CartaoDeRecurso key={r.chave} r={r} />
          ))}
        </div>
      </section>

      <Assinatura assinatura={assinatura} equipe={equipe} />
    </div>
  );
}

function PrimeiroPasso({ bancoLiberado, bancoLiberaEm }: { bancoLiberado: boolean; bancoLiberaEm?: string }) {
  return (
    <Cartao className="p-5 sm:p-6">
      <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-ouro">Primeiro passo</p>
      <p className="mt-1 font-display text-lg font-semibold text-white">Comece por um destes caminhos</p>
      <p className="mt-1 max-w-prose text-xs leading-relaxed text-white/70">
        O saldo, o mês e o orçamento aparecem aqui assim que houver uma conta ou um lançamento.
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        <li>
          {bancoLiberado ? (
            <Passo
              href="/novarecash/app/banco"
              Icone={Landmark}
              titulo="Conectar o banco"
              texto="Saldo e extrato entram sozinhos, pelo Open Finance."
            />
          ) : (
            <div className="h-full rounded-2xl border border-dashed border-white/15 p-4">
              <Landmark className="h-5 w-5 text-white/50" />
              <p className="mt-2 text-sm font-semibold text-white/85">Conectar o banco</p>
              <p className="mt-0.5 text-xs leading-relaxed text-white/60">
                Em ativação: libera em {bancoLiberaEm ?? "breve"}.
              </p>
            </div>
          )}
        </li>
        <li>
          <Passo
            href="/novarecash/app/extrato?novo=1"
            Icone={PenLine}
            titulo="Lançar à mão"
            texto="Um gasto ou uma entrada, com a categoria certa."
          />
        </li>
        <li>
          <Passo
            href="/novarecash/app/extrato?contas=1"
            Icone={Wallet}
            titulo="Criar uma conta"
            texto="Conta, cartão ou investimento, com o saldo de hoje."
          />
        </li>
      </ul>
    </Cartao>
  );
}

function Passo({ href, Icone, titulo, texto }: { href: string; Icone: LucideIcon; titulo: string; texto: string }) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-4 outline-none transition-colors hover:border-ouro/50 focus-visible:ring-2 focus-visible:ring-ouro"
    >
      <Icone className="h-5 w-5 text-ouro" />
      <span className="mt-2 text-sm font-semibold text-white">{titulo}</span>
      <span className="mt-0.5 flex-1 text-xs leading-relaxed text-white/65">{texto}</span>
      <span className="mt-3 inline-flex items-center gap-1 text-2xs font-semibold text-ouro">
        Começar <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function Painel({ r }: { r: Retrato }) {
  const m = r.mes;
  const top = r.categorias.slice(0, 5);
  const maior = top[0]?.total || 1;
  const orcamento = r.orcamento.slice(0, 4);
  const alertas = r.orcamento.filter((o) => o.nivel !== "ok").length;

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-3xl border border-ouro/20 bg-[linear-gradient(150deg,hsl(200_55%_9%),hsl(203_100%_3%))] p-5 shadow-[0_30px_60px_-36px_hsl(42_74%_40%/0.55)] sm:p-6">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-ouro/10 blur-3xl"
        />
        <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-ouro">Saldo nas contas hoje</p>
        <p className="mt-1 font-display text-4xl font-semibold tabular-nums tracking-[-0.02em] text-white sm:text-5xl">
          {brl(r.saldoTotal)}
        </p>
        <p className="mt-1 text-xs text-white/65">
          {r.contas.length} {r.contas.length === 1 ? "conta" : "contas"}
          {r.faturas > 0 ? ` · faturas de cartão: ${brl(r.faturas)}` : ""}
        </p>

        <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-4 text-xs">
          <div className="min-w-0">
            <dt className="text-white/65">Entrou</dt>
            <dd className={`truncate font-semibold tabular-nums ${COR_ENTRADA}`}>{brl(m.entradas)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-white/65">Saiu</dt>
            <dd className={`truncate font-semibold tabular-nums ${COR_SAIDA}`}>{brl(m.saidas)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-white/65">Sobra</dt>
            <dd className={`truncate font-semibold tabular-nums ${m.sobra < 0 ? COR_SAIDA : "text-white"}`}>
              {brl(m.sobra)}
            </dd>
          </div>
        </dl>
        <p className="mt-2 text-2xs text-white/60">
          Em {r.nomeMes}, até hoje (dia {r.diaDoMes} de {r.diasNoMes}).
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Cartao className="p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-sm font-semibold text-white">Para onde foi</h2>
            <Link
              href="/novarecash/app/extrato"
              className="inline-flex min-h-11 items-center text-2xs font-semibold text-ouro hover:underline"
            >
              Ver extrato
            </Link>
          </div>
          {top.length === 0 ? (
            <p className="mt-2 text-xs text-white/65">Nenhum gasto neste mês ainda.</p>
          ) : (
            <ul className="mt-2 space-y-3">
              {top.map((c) => (
                <li key={c.chave}>
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="min-w-0 truncate text-white/85">{c.rotulo}</span>
                    <span className="shrink-0 font-semibold tabular-nums text-white">{brl(c.total)}</span>
                  </div>
                  <div className="mt-1">
                    <Barra fracao={c.total / maior} tom="ouro" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Cartao>

        <Cartao className="p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-white">
              Orçamento do mês
              {alertas > 0 && (
                <Selo tom="alerta">
                  <AlertTriangle className="h-3 w-3" />
                  {alertas}
                </Selo>
              )}
            </h2>
            <Link
              href="/novarecash/app/orcamento"
              className="inline-flex min-h-11 items-center text-2xs font-semibold text-ouro hover:underline"
            >
              {orcamento.length ? "Ver tudo" : "Definir"}
            </Link>
          </div>
          {orcamento.length === 0 ? (
            <div className="mt-2">
              <p className="text-xs leading-relaxed text-white/65">
                Defina um limite por categoria e o NovareCash avisa quando passar de 80% e de 100%.
              </p>
              <div className="mt-3">
                <Botao href="/novarecash/app/orcamento" variante="contorno" Icone={Target}>
                  Criar orçamento
                </Botao>
              </div>
            </div>
          ) : (
            <ul className="mt-2 space-y-3">
              {orcamento.map((o) => (
                <li key={o.chave}>
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="min-w-0 truncate text-white/85">{o.rotulo}</span>
                    <span className="shrink-0 tabular-nums text-white/70">
                      <strong className="font-semibold text-white">{brl(o.gasto)}</strong> de {brl(o.limite)}
                    </span>
                  </div>
                  <div className="mt-1">
                    <Barra
                      fracao={o.fracao}
                      tom={o.nivel === "estourou" ? "perigo" : o.nivel === "atencao" ? "alerta" : "ciano"}
                    />
                  </div>
                  {o.nivel !== "ok" && (
                    <p className={`mt-1 text-2xs font-semibold ${o.nivel === "estourou" ? "text-accent-claro" : "text-warning-claro"}`}>
                      {o.nivel === "estourou"
                        ? `Passou do limite em ${brl(o.gasto - o.limite)}`
                        : `Perto do limite: ${Math.round(o.fracao * 100)}%`}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      </div>
    </div>
  );
}

const SELO_RECURSO: Record<CartaoRecurso["situacao"], { rotulo: string; tom: TomSelo }> = {
  pronto: { rotulo: "No ar", tom: "verde" },
  teste: { rotulo: "Teste da equipe", tom: "ciano" },
  ligando: { rotulo: "Sendo ligado", tom: "alerta" },
  ativacao: { rotulo: "Em ativação", tom: "neutro" },
};

function CartaoDeRecurso({ r }: { r: CartaoRecurso }) {
  const Icone = ICONE[r.chave];
  const selo = SELO_RECURSO[r.situacao];
  return (
    <Link
      href={r.href}
      className="group block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ouro"
    >
      <Cartao className="flex h-full flex-col p-4 transition-colors group-hover:border-ouro/40">
        <div className="flex items-center justify-between gap-2">
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ciano/15 text-ciano-claro ring-1 ring-ciano/25"
          >
            <Icone className="h-4 w-4" />
          </span>
          <Selo tom={selo.tom}>{selo.rotulo}</Selo>
        </div>
        <p className="mt-3 font-display text-sm font-semibold text-white">{r.titulo}</p>
        <p className="mt-0.5 flex-1 text-xs leading-relaxed text-white/65">{r.texto}</p>
        {r.situacao === "ativacao" && (
          <p className="mt-2 text-2xs font-semibold text-ouro">Libera em {r.liberaEm ?? "breve"}</p>
        )}
        <span className="mt-3 inline-flex items-center gap-1 text-2xs font-semibold text-ouro">
          Abrir <ArrowRight className="h-3 w-3" />
        </span>
      </Cartao>
    </Link>
  );
}

const SITUACAO: Record<string, { rotulo: string; tom: TomSelo }> = {
  ativa: { rotulo: "Ativa", tom: "verde" },
  cancelada: { rotulo: "Renovação cancelada", tom: "alerta" },
  atrasada: { rotulo: "Pagamento atrasado", tom: "perigo" },
  reembolsada: { rotulo: "Reembolsada", tom: "neutro" },
  chargeback: { rotulo: "Contestada", tom: "neutro" },
};

function Assinatura({ assinatura, equipe }: { assinatura: MinhaAssinatura; equipe: boolean }) {
  const s = assinatura ? SITUACAO[assinatura.status] ?? { rotulo: assinatura.status, tom: "neutro" as const } : null;
  const plano =
    assinatura?.plano === "anual" ? "Anual" : assinatura?.plano === "mensal" ? "Mensal" : assinatura?.plano ?? null;

  return (
    <section aria-labelledby="titulo-assinatura">
      <Cartao className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="titulo-assinatura" className="flex items-center gap-2 font-display text-sm font-semibold text-white">
            <BadgeCheck className="h-4 w-4 text-ouro" />
            Minha assinatura
          </h2>
          {s ? <Selo tom={s.tom}>{s.rotulo}</Selo> : equipe ? <Selo tom="ciano">Acesso da equipe</Selo> : null}
        </div>

        {assinatura ? (
          <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            <div>
              <dt className="text-white/60">Plano</dt>
              <dd className="font-semibold text-white">{plano ?? "NovareCash"}</dd>
            </div>
            <div>
              <dt className="text-white/60">{assinatura.status === "ativa" ? "Renova / vale até" : "Acesso até"}</dt>
              <dd className="font-semibold text-white">
                {assinatura.expira_em ? dataLonga(assinatura.expira_em) : "sem data de fim"}
              </dd>
            </div>
            {assinatura.status === "cancelada" && (
              <p className="text-2xs leading-relaxed text-white/65 sm:col-span-2">
                Você cancelou a renovação: continua usando tudo até a data acima.
              </p>
            )}
            {assinatura.status === "atrasada" && (
              <p className="text-2xs leading-relaxed text-white/65 sm:col-span-2">
                A cobrança não passou. Regularize pela Hotmart (o e-mail da compra tem o link) para não perder o acesso.
              </p>
            )}
          </dl>
        ) : (
          <p className="mt-2 text-xs leading-relaxed text-white/65">
            {equipe
              ? "Você entra como equipe da Novare (acesso para suporte), sem assinatura própria."
              : "Não encontramos a assinatura pelo e-mail desta conta. Se você comprou com outro e-mail, fale com o suporte."}
          </p>
        )}
      </Cartao>
    </section>
  );
}

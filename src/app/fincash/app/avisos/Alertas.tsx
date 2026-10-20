"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Check, Loader2 } from "lucide-react";

import { faltaTabela } from "@/lib/fincash/erros";
import { createClient } from "@/lib/supabase/client";
import type { ConfigAlertas } from "@/lib/fincash/alertas";
import { AvisoSQL, Bloco, Esqueleto } from "../pecas";

/**
 * O CLIENTE ESCOLHE O QUE QUER RECEBER.
 *
 * ⚠️ TUDO COMEÇA DESLIGADO, e é a regra mais importante desta tela. Ter
 * conta no FINCASH não é permissão para a gente mandar o que quiser. Cada
 * aviso é uma escolha da pessoa, uma a uma.
 *
 * O alerta é um POP-UP DENTRO DO APP (`PopupAlertas.tsx`), e só isso: o
 * WhatsApp e o e-mail saíram do FINCASH em 19/10/2026, por decisão do dono.
 * Não volte a citá-los nesta tela.
 *
 * ⚠️ SALVA SOZINHA, SEM BOTÃO "SALVAR". Tela de preferências com botão de
 * salvar é tela onde a pessoa mexe, sai e descobre depois que não valeu.
 * Aqui cada toque grava, e o estado some do caminho.
 */

const PADRAO: ConfigAlertas = {
  contas_ligado: false,
  contas_dias_antes: 2,
  fatura_ligado: false,
  fatura_dias_antes: 3,
  orcamento_ligado: false,
  orcamento_limite: 80,
  resumo_ligado: false,
  resumo_dia_semana: 1,
  ultimo_contas: null,
  ultimo_fatura: null,
  ultimo_orcamento: null,
  ultimo_resumo: null,
};

const DIAS = [
  { v: 0, r: "domingo" },
  { v: 1, r: "segunda" },
  { v: 2, r: "terça" },
  { v: 3, r: "quarta" },
  { v: 4, r: "quinta" },
  { v: 5, r: "sexta" },
  { v: 6, r: "sábado" },
];

export function Alertas({ ligado = true }: { ligado?: boolean }) {
  const [cfg, setCfg] = useState<ConfigAlertas | null>(null);
  const [semTabela, setSemTabela] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  const carregar = useCallback(async () => {
    const supabase = createClient();
    const { data: sessao } = await supabase.auth.getUser();
    if (!sessao.user) return;

    const { data, error } = await supabase
      .from("fin_alertas")
      .select("*")
      .eq("usuario_id", sessao.user.id)
      .maybeSingle();

    if (error && faltaTabela(error)) {
      setSemTabela(true);
      return;
    }
    setCfg((data as ConfigAlertas | null) ?? PADRAO);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function gravar(mudanca: Partial<ConfigAlertas>) {
    if (!cfg) return;
    const novo = { ...cfg, ...mudanca };
    setCfg(novo);
    setSalvando(true);
    setSalvo(false);

    const supabase = createClient();
    const { data: sessao } = await supabase.auth.getUser();
    if (!sessao.user) return;

    /* `upsert` e não `update`: a linha nasce no primeiro toque, e não no
       primeiro acesso à tela — quem abre e não mexe em nada não precisa
       ocupar espaço no banco. */
    const { error } = await supabase.from("fin_alertas").upsert(
      {
        usuario_id: sessao.user.id,
        contas_ligado: novo.contas_ligado,
        contas_dias_antes: novo.contas_dias_antes,
        fatura_ligado: novo.fatura_ligado,
        fatura_dias_antes: novo.fatura_dias_antes,
        orcamento_ligado: novo.orcamento_ligado,
        orcamento_limite: novo.orcamento_limite,
        resumo_ligado: novo.resumo_ligado,
        resumo_dia_semana: novo.resumo_dia_semana,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: "usuario_id" },
    );

    setSalvando(false);
    if (!error) {
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2000);
    }
  }

  if (semTabela) {
    return <AvisoSQL arquivo="supabase/fincash_alertas.sql" />;
  }

  if (!cfg) return <Esqueleto />;

  return (
    <Bloco className="p-5">
      {/* O cabeçalho é feito aqui: `Bloco` é só o container, sem props de
          título — e inventar props nele por causa de uma tela só espalharia
          a mudança por todas as outras que o usam. */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold text-primary">
          <Bell className="h-4 w-4 text-accent-strong" strokeWidth={2} />
          Alertas do FINCASH
        </h2>
        {salvando ? (
          <span className="flex shrink-0 items-center gap-1.5 text-2xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            salvando
          </span>
        ) : salvo ? (
          <span className="flex shrink-0 items-center gap-1.5 text-2xs font-semibold text-success-strong">
            <Check className="h-3 w-3" />
            salvo
          </span>
        ) : null}
      </div>
      <p className="mb-5 text-xs leading-relaxed text-muted-foreground">
        O próprio app te avisa: quando você abre o FINCASH, os alertas do dia
        aparecem num aviso na tela. Só aparece o que você ligar aqui, cada
        assunto no máximo uma vez por dia, e você desliga quando quiser.
      </p>

      <div className="space-y-3">
        <Opcao
          titulo="Conta chegando"
          texto="As contas fixas que estão perto de vencer, com o total."
          ligado={cfg.contas_ligado}
          aoVirar={(v) => void gravar({ contas_ligado: v })}
        >
          <Escolha
            rotulo="Avisar"
            valor={cfg.contas_dias_antes}
            opcoes={[
              { v: 0, r: "no dia" },
              { v: 1, r: "1 dia antes" },
              { v: 2, r: "2 dias antes" },
              { v: 3, r: "3 dias antes" },
              { v: 5, r: "5 dias antes" },
              { v: 7, r: "7 dias antes" },
            ]}
            aoEscolher={(v) => void gravar({ contas_dias_antes: v })}
          />
        </Opcao>

        <Opcao
          titulo="Fatura fechando"
          texto="Quando o cartão está perto de fechar — o que passar depois cai no mês seguinte."
          ligado={cfg.fatura_ligado}
          aoVirar={(v) => void gravar({ fatura_ligado: v })}
        >
          <Escolha
            rotulo="Avisar"
            valor={cfg.fatura_dias_antes}
            opcoes={[
              { v: 0, r: "no dia" },
              { v: 1, r: "1 dia antes" },
              { v: 2, r: "2 dias antes" },
              { v: 3, r: "3 dias antes" },
              { v: 5, r: "5 dias antes" },
            ]}
            aoEscolher={(v) => void gravar({ fatura_dias_antes: v })}
          />
        </Opcao>

        <Opcao
          titulo="Orçamento apertando"
          texto="Quando uma categoria passa do limite que você definiu."
          ligado={cfg.orcamento_ligado}
          aoVirar={(v) => void gravar({ orcamento_ligado: v })}
        >
          <Escolha
            rotulo="A partir de"
            valor={cfg.orcamento_limite}
            opcoes={[
              { v: 50, r: "metade" },
              { v: 70, r: "70%" },
              { v: 80, r: "80%" },
              { v: 90, r: "90%" },
              { v: 100, r: "só se estourar" },
            ]}
            aoEscolher={(v) => void gravar({ orcamento_limite: v })}
          />
        </Opcao>

        <Opcao
          titulo="Resumo da semana"
          texto="Quanto ainda dá para gastar até o fim do mês, e quanto por dia."
          ligado={cfg.resumo_ligado}
          aoVirar={(v) => void gravar({ resumo_ligado: v })}
        >
          <Escolha
            rotulo="Toda"
            valor={cfg.resumo_dia_semana}
            opcoes={DIAS.map((d) => ({ v: d.v, r: d.r }))}
            aoEscolher={(v) => void gravar({ resumo_dia_semana: v })}
          />
        </Opcao>
      </div>
    </Bloco>
  );
}

/** Uma linha com interruptor; o que configura aparece só quando ligado. */
function Opcao({
  titulo,
  texto,
  ligado,
  aoVirar,
  children,
}: {
  titulo: string;
  texto: string;
  ligado: boolean;
  aoVirar: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 transition-colors ${
        ligado ? "border-accent/30 bg-accent-tint/40" : "border-border bg-white"
      }`}
    >
      <label className="flex cursor-pointer items-start gap-3">
        {/* Checkbox nativo: já chega focável, já responde à barra de espaço
            e o leitor de tela já anuncia marcado/desmarcado. */}
        <input
          type="checkbox"
          checked={ligado}
          onChange={(e) => aoVirar(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-border accent-[color:var(--accent)]"
        />
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-foreground">
            {titulo}
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
            {texto}
          </span>
        </span>
      </label>

      {ligado && <div className="mt-3 pl-8">{children}</div>}
    </div>
  );
}

function Escolha({
  rotulo,
  valor,
  opcoes,
  aoEscolher,
}: {
  rotulo: string;
  valor: number;
  opcoes: { v: number; r: string }[];
  aoEscolher: (v: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-2xs font-semibold text-muted-foreground">
        {rotulo}
      </span>
      {opcoes.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => aoEscolher(o.v)}
          aria-pressed={valor === o.v}
          className={`rounded-full border px-2.5 py-1 text-2xs font-semibold transition-colors ${
            valor === o.v
              ? "border-primary bg-primary text-white"
              : "border-border bg-white text-muted-foreground hover:border-primary/30"
          }`}
        >
          {o.r}
        </button>
      ))}
    </div>
  );
}

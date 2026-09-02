"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Loader2, TriangleAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  carregarRetrato,
  resolverCliente,
  salvarSecao,
  type EstadoCliente,
} from "@/lib/planejamento/cliente";
import {
  CATEGORIAS_DESPESA,
  ESTABILIDADES,
  ESTADOS_CIVIS,
  FREQUENCIAS,
  OBJETIVOS_SUGERIDOS,
  PRIORIDADES,
  REGIMES_BENS,
  RENDAS_EXTRAS,
  RENDAS_PRINCIPAIS,
  TIPOS_DIVIDA,
  TIPOS_PATRIMONIO,
  TIPOS_SEGURO,
  mesAtual,
} from "@/lib/planejamento/catalogos";
import {
  PERGUNTAS_COMPORTAMENTAIS,
  PERFIS,
  calcularPerfil,
  houveResposta,
  respostasIniciais,
  type RespostasComportamentais,
} from "@/lib/planejamento/perfil";
import { conferir } from "@/lib/planejamento/plausibilidade";
import { gravarPremissas, lerPremissas } from "@/lib/planejamento/premissas";
import { Chips, Escala, Escolha, Lista, Marcar, Texto } from "./campos";

/* -------------------------------------------------------------------------- */
/* O rascunho                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Tudo é string enquanto está na tela: a máscara de dinheiro trabalha assim, e
 * campo numérico vazio vira `NaN` se guardado como número. A conversão acontece
 * uma vez só, na hora de gravar.
 */
type Renda = { descricao: string; valor: string; frequencia: string; principal: boolean; estabilidade: string };
type Despesa = { categoria: string; descricao: string; valor: string; fixa: boolean; diaVencimento: string };
type Divida = { tipo: string; credor: string; total: string; parcela: string; juros: string; mesesRestantes: string };
type Bem = { tipo: string; descricao: string; valor: string };
type Seguro = { tipo: string; seguradora: string; premio: string; cobertura: string };
type Objetivo = { descricao: string; alvo: string; prazo: string; prioridade: string };

const novaRenda = (): Renda => ({ descricao: "", valor: "", frequencia: "mensal", principal: false, estabilidade: "media" });
const novaDespesa = (): Despesa => ({ categoria: "", descricao: "", valor: "", fixa: true, diaVencimento: "" });
const novaDivida = (): Divida => ({ tipo: "", credor: "", total: "", parcela: "", juros: "", mesesRestantes: "" });
const novoBem = (): Bem => ({ tipo: "", descricao: "", valor: "" });
const novoSeguro = (): Seguro => ({ tipo: "", seguradora: "", premio: "", cobertura: "" });
const novoObjetivo = (): Objetivo => ({ descricao: "", alvo: "", prazo: "", prioridade: "media" });

type Identificacao = {
  nome: string; cpf: string; nascimento: string; estadoCivil: string; regimeBens: string;
  profissao: string; empresa: string; anosProfissao: string; dependentes: string;
  idadesDependentes: string; cidade: string; uf: string;
};

const num = (s: string) => {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};
const inteiroOuNulo = (s: string) => {
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
};
const textoOuNulo = (s: string) => (s.trim() === "" ? null : s.trim());

/* -------------------------------------------------------------------------- */
/* Os blocos                                                                  */
/* -------------------------------------------------------------------------- */

const BLOCOS = [
  { chave: "abertura", titulo: "Vamos montar o seu plano", subtitulo: "São blocos curtos. Dá para parar no meio e voltar depois — o que você preencher fica salvo." },
  { chave: "identificacao", titulo: "Quem é você", subtitulo: "O básico para o plano falar da sua vida, não de uma média." },
  { chave: "renda", titulo: "Sua renda", subtitulo: "Tudo que entra. Valor líquido, o que cai na conta." },
  { chave: "despesas", titulo: "Suas despesas", subtitulo: "Para onde vai. Estimativa já ajuda — não precisa ser exato." },
  { chave: "dividas", titulo: "Suas dívidas", subtitulo: "Nem todo mundo tem. Se não tiver, é só avançar." },
  { chave: "patrimonio", titulo: "Seu patrimônio", subtitulo: "O que você já tem, líquido ou não." },
  { chave: "seguros", titulo: "Sua proteção", subtitulo: "Seguro é o que impede um imprevisto de derrubar o plano." },
  { chave: "objetivos", titulo: "Seus objetivos", subtitulo: "Sonho com número e prazo vira meta." },
  { chave: "aposentadoria", titulo: "Sua aposentadoria", subtitulo: "As duas respostas que valem mais no plano inteiro: quando parar e com quanto viver." },
  { chave: "comportamento", titulo: "Seu jeito com dinheiro", subtitulo: "Seis escalas, sem resposta certa. É sobre você, não sobre acerto." },
  { chave: "revisao", titulo: "Confira antes de fechar", subtitulo: "Depois disso o seu diagnóstico já fica pronto." },
] as const;

/* -------------------------------------------------------------------------- */

export default function MeusDadosPage() {
  const router = useRouter();
  const [estado, setEstado] = useState<EstadoCliente | null>(null);
  const [bloco, setBloco] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [ident, setIdent] = useState<Identificacao>({
    nome: "", cpf: "", nascimento: "", estadoCivil: "", regimeBens: "",
    profissao: "", empresa: "", anosProfissao: "", dependentes: "",
    idadesDependentes: "", cidade: "", uf: "",
  });
  const [rendas, setRendas] = useState<Renda[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [dividas, setDividas] = useState<Divida[]>([]);
  const [bens, setBens] = useState<Bem[]>([]);
  const [seguros, setSeguros] = useState<Seguro[]>([]);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [comportamento, setComportamento] = useState<RespostasComportamentais>(respostasIniciais());
  const [apos, setApos] = useState({ idade: "", renda: "", inss: "" });

  /* Carga inicial: quem volta encontra o que já preencheu. */
  useEffect(() => {
    (async () => {
      const resolvido = await resolverCliente();
      setEstado(resolvido);
      if (resolvido.tipo !== "ok") {
        setCarregando(false);
        return;
      }

      const supabase = createClient();
      const [{ data: user }, retrato] = await Promise.all([
        supabase.auth.getUser(),
        carregarRetrato(resolvido.clientId),
      ]);

      const [perfilRow, clienteRow, premissas] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("user_id", user.user!.id).maybeSingle(),
        supabase.from("clients").select("*").eq("id", resolvido.clientId).maybeSingle(),
        lerPremissas(),
      ]);
      setApos({
        idade: premissas.idadeAposentadoria?.toString() ?? "",
        renda: premissas.rendaDesejadaMes?.toString() ?? "",
        inss: premissas.rendaINSSMes?.toString() ?? "",
      });

      const c = clienteRow.data;
      if (c) {
        setIdent({
          nome: perfilRow.data?.full_name ?? "",
          cpf: c.cpf ?? "",
          nascimento: c.date_of_birth ?? "",
          estadoCivil: c.marital_status ?? "",
          regimeBens: c.property_regime ?? "",
          profissao: c.profession ?? "",
          empresa: c.company ?? "",
          anosProfissao: c.years_in_profession?.toString() ?? "",
          dependentes: c.dependents_count?.toString() ?? "",
          idadesDependentes: c.dependents_ages ?? "",
          cidade: c.city ?? "",
          uf: c.state ?? "",
        });
        if (c.behavioral_profile && typeof c.behavioral_profile === "object") {
          setComportamento({ ...respostasIniciais(), ...c.behavioral_profile });
        }
      }

      setRendas(retrato.rendas.map((r) => ({
        descricao: r.description, valor: String(r.amount ?? ""), frequencia: r.frequency,
        principal: r.is_primary, estabilidade: r.stability ?? "media",
      })));
      setDespesas(retrato.despesas.map((d) => ({
        categoria: d.category, descricao: d.description ?? "", valor: String(d.amount ?? ""),
        fixa: d.is_fixed, diaVencimento: d.due_day?.toString() ?? "",
      })));
      setDividas(retrato.dividas.map((d) => ({
        tipo: d.type, credor: d.creditor ?? "", total: String(d.total_amount ?? ""),
        parcela: String(d.monthly_payment ?? ""), juros: String(d.interest_rate ?? ""),
        mesesRestantes: d.remaining_months?.toString() ?? "",
      })));
      setBens(retrato.patrimonio.map((p) => ({
        tipo: p.type, descricao: p.description ?? "", valor: String(p.estimated_value ?? ""),
      })));
      setSeguros(retrato.seguros.map((s) => ({
        tipo: s.type, seguradora: s.provider ?? "", premio: String(s.monthly_premium ?? ""),
        cobertura: String(s.coverage_amount ?? ""),
      })));
      setObjetivos(retrato.objetivos.map((o) => ({
        descricao: o.description, alvo: String(o.target_amount ?? ""),
        prazo: o.deadline ?? "", prioridade: o.priority ?? "media",
      })));

      setCarregando(false);
    })();
  }, []);

  const clientId = estado?.tipo === "ok" ? estado.clientId : null;

  /** Grava o bloco que está saindo. Linha sem o campo essencial é descartada. */
  async function gravarBloco(chave: string): Promise<string | null> {
    if (!clientId) return "Não encontrei a sua ficha.";
    const supabase = createClient();
    const mes = mesAtual();

    switch (chave) {
      case "identificacao": {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return "Sua sessão expirou. Entre de novo.";
        if (ident.nome.trim()) {
          const nome = ident.nome.trim();
          // O nome vive em DOIS lugares por herança: profiles.full_name (o
          // app do planejamento) e hub_profiles.nome (a saudação do Hub).
          // Gravar só num deles fazia o cabeçalho ignorar a correção.
          await Promise.all([
            supabase.from("profiles").update({ full_name: nome }).eq("user_id", user.user.id),
            supabase.from("hub_profiles").update({ nome }).eq("id", user.user.id),
            supabase.auth.updateUser({ data: { nome } }),
          ]);
        }
        const { error } = await supabase.from("clients").update({
          cpf: textoOuNulo(ident.cpf),
          date_of_birth: textoOuNulo(ident.nascimento),
          marital_status: textoOuNulo(ident.estadoCivil),
          property_regime: textoOuNulo(ident.regimeBens),
          profession: textoOuNulo(ident.profissao),
          company: textoOuNulo(ident.empresa),
          years_in_profession: inteiroOuNulo(ident.anosProfissao),
          dependents_count: inteiroOuNulo(ident.dependentes) ?? 0,
          dependents_ages: textoOuNulo(ident.idadesDependentes),
          city: textoOuNulo(ident.cidade),
          state: textoOuNulo(ident.uf),
        }).eq("id", clientId);
        return error?.message ?? null;
      }

      case "renda": {
        const linhas = rendas
          .filter((r) => r.descricao.trim() && num(r.valor) > 0)
          .map((r) => ({
            description: r.descricao.trim(), amount: num(r.valor), frequency: r.frequencia,
            is_primary: r.principal, stability: r.estabilidade,
          }));
        return (await salvarSecao("income", clientId, linhas, mes)).erro;
      }

      case "despesas": {
        const linhas = despesas
          .filter((d) => d.categoria && num(d.valor) > 0)
          .map((d) => ({
            category: d.categoria, description: textoOuNulo(d.descricao), amount: num(d.valor),
            is_fixed: d.fixa, due_day: inteiroOuNulo(d.diaVencimento),
          }));
        return (await salvarSecao("expenses", clientId, linhas, mes)).erro;
      }

      case "dividas": {
        const linhas = dividas
          .filter((d) => d.tipo && num(d.total) > 0)
          .map((d) => ({
            type: d.tipo, creditor: textoOuNulo(d.credor), total_amount: num(d.total),
            monthly_payment: num(d.parcela), interest_rate: num(d.juros),
            remaining_months: inteiroOuNulo(d.mesesRestantes) ?? 0,
          }));
        return (await salvarSecao("debts", clientId, linhas, mes)).erro;
      }

      case "patrimonio": {
        const linhas = bens
          .filter((b) => b.tipo && num(b.valor) > 0)
          .map((b) => ({
            type: b.tipo, description: textoOuNulo(b.descricao), estimated_value: num(b.valor),
          }));
        return (await salvarSecao("assets", clientId, linhas, mes)).erro;
      }

      case "seguros": {
        const linhas = seguros
          .filter((s) => s.tipo)
          .map((s) => ({
            type: s.tipo, provider: textoOuNulo(s.seguradora),
            monthly_premium: num(s.premio), coverage_amount: num(s.cobertura),
          }));
        return (await salvarSecao("insurance", clientId, linhas, mes)).erro;
      }

      case "objetivos": {
        const linhas = objetivos
          .filter((o) => o.descricao.trim())
          .map((o) => ({
            description: o.descricao.trim(),
            target_amount: num(o.alvo) > 0 ? num(o.alvo) : null,
            deadline: textoOuNulo(o.prazo), priority: o.prioridade,
          }));
        return (await salvarSecao("goals", clientId, linhas, mes)).erro;
      }

      case "aposentadoria": {
        // Vazio é resposta válida: o motor volta ao padrão automático.
        const idade = num(apos.idade);
        if (apos.idade.trim() && (idade < 30 || idade > 90)) {
          return "A idade de aposentadoria precisa estar entre 30 e 90 anos.";
        }
        return (
          await gravarPremissas({
            idadeAposentadoria: apos.idade.trim() ? idade : null,
            rendaDesejadaMes: apos.renda.trim() ? num(apos.renda) : null,
            rendaINSSMes: apos.inss.trim() ? num(apos.inss) : null,
          })
        ).erro;
      }

      case "comportamento": {
        // Sem interação, não existe perfil: todas as escalas em 5 (o valor
        // inicial) produziam empate e o desempate do sort carimbava TODO
        // MUNDO como "Construtor" — um perfil que a pessoa nunca deu.
        const respondeu = houveResposta(comportamento);
        const { error } = await supabase.from("clients").update({
          behavioral_profile: respondeu
            ? { ...comportamento, computed_profile: calcularPerfil(comportamento) }
            : null,
        }).eq("id", clientId);
        return error?.message ?? null;
      }

      default:
        return null;
    }
  }

  async function avancar() {
    setErro(null);
    setSalvando(true);
    const falha = await gravarBloco(BLOCOS[bloco].chave);
    setSalvando(false);
    if (falha) {
      setErro(falha);
      return;
    }
    if (bloco < BLOCOS.length - 1) {
      setBloco((b) => b + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function finalizar() {
    if (!clientId) return;
    setSalvando(true);
    const supabase = createClient();
    // De 'onboarding_pendente' para 'em_diagnostico'. No app do consultor esse
    // avanço era efeito colateral de alguém abrir uma aba admin.
    await supabase.from("clients").update({ status: "em_diagnostico" }).eq("id", clientId);
    setSalvando(false);
    router.push("/planejamento/app/diagnostico");
  }

  /* ---------------------------------------------------------------------- */

  if (carregando) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-accent" />
        <span className="sr-only">Carregando seus dados</span>
      </div>
    );
  }

  if (estado?.tipo === "sem-ficha") return <SemFicha />;

  const atual = BLOCOS[bloco];
  const progresso = Math.round((bloco / (BLOCOS.length - 1)) * 100);
  const ultimo = bloco === BLOCOS.length - 1;

  return (
    <div className="surgir">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-2xs font-semibold text-muted-foreground">
          <span>
            Bloco {Math.min(bloco + 1, BLOCOS.length)} de {BLOCOS.length}
          </span>
          <span className="tabular-nums">{progresso}%</span>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
          aria-valuenow={progresso}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso do preenchimento"
        >
          <div
            className="h-full rounded-full bg-accent-btn transition-[width] duration-500"
            style={{ width: `${progresso}%` }}
          />
        </div>
      </div>

      <h1 className="font-display text-2xl font-bold tracking-tight text-primary sm:text-3xl">
        {atual.titulo}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{atual.subtitulo}</p>

      <div className="mt-6 space-y-4">
        {atual.chave === "abertura" && <Abertura />}

        {atual.chave === "identificacao" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Texto label="Seu nome completo" valor={ident.nome} aoMudar={(v) => setIdent({ ...ident, nome: v })} />
            <Texto label="CPF" valor={ident.cpf} aoMudar={(v) => setIdent({ ...ident, cpf: v })} dica="Fica só na sua conta, protegido." />
            <Texto label="Data de nascimento" tipo="date" valor={ident.nascimento} aoMudar={(v) => setIdent({ ...ident, nascimento: v })} />
            <Escolha label="Estado civil" valor={ident.estadoCivil} aoMudar={(v) => setIdent({ ...ident, estadoCivil: v })} opcoes={ESTADOS_CIVIS} />
            {(ident.estadoCivil === "casado" || ident.estadoCivil === "uniao_estavel") && (
              <Escolha label="Regime de bens" valor={ident.regimeBens} aoMudar={(v) => setIdent({ ...ident, regimeBens: v })} opcoes={REGIMES_BENS} />
            )}
            <Texto label="Profissão" valor={ident.profissao} aoMudar={(v) => setIdent({ ...ident, profissao: v })} />
            <Texto label="Empresa" valor={ident.empresa} aoMudar={(v) => setIdent({ ...ident, empresa: v })} />
            <Texto label="Anos na profissão" tipo="number" valor={ident.anosProfissao} aoMudar={(v) => setIdent({ ...ident, anosProfissao: v })} />
            <Texto label="Quantos dependentes" tipo="number" valor={ident.dependentes} aoMudar={(v) => setIdent({ ...ident, dependentes: v })} dica="Conta para o cálculo de proteção." />
            {num(ident.dependentes) > 0 && (
              <Texto label="Idades dos dependentes" valor={ident.idadesDependentes} aoMudar={(v) => setIdent({ ...ident, idadesDependentes: v })} placeholder="8, 12" />
            )}
            <Texto label="Cidade" valor={ident.cidade} aoMudar={(v) => setIdent({ ...ident, cidade: v })} />
            <Texto label="Estado" valor={ident.uf} aoMudar={(v) => setIdent({ ...ident, uf: v })} placeholder="SP" />
          </div>
        )}

        {atual.chave === "renda" && (
          <Lista
            itens={rendas} aoMudar={setRendas} novo={novaRenda} rotuloNovo="Adicionar outra renda"
            vazio="Comece pela principal — o salário ou o pró-labore."
            render={(r, mudar) => (
              <div className="grid gap-3 sm:grid-cols-2">
                <Texto label="De onde vem" valor={r.descricao} aoMudar={(v) => mudar({ descricao: v })} sugestoes={[...RENDAS_PRINCIPAIS, ...RENDAS_EXTRAS]} />
                <Texto label="Quanto" prefixo="R$" valor={r.valor} aoMudar={(v) => mudar({ valor: v })} dica="O valor líquido, o que cai na conta." />
                <Escolha label="Com que frequência" valor={r.frequencia} aoMudar={(v) => mudar({ frequencia: v })} opcoes={FREQUENCIAS} />
                <Escolha label="Quanto varia" valor={r.estabilidade} aoMudar={(v) => mudar({ estabilidade: v })} opcoes={ESTABILIDADES} />
                <div className="sm:col-span-2">
                  <Marcar label="Esta é a minha renda principal" valor={r.principal} aoMudar={(v) => mudar({ principal: v })} />
                </div>
              </div>
            )}
          />
        )}

        {atual.chave === "despesas" && (
          <Lista
            itens={despesas} aoMudar={setDespesas} novo={novaDespesa} rotuloNovo="Adicionar outra despesa"
            vazio="Moradia e alimentação costumam ser as duas maiores."
            render={(d, mudar) => (
              <div className="space-y-3">
                <Chips label="Categoria" valor={d.categoria} aoMudar={(v) => mudar({ categoria: v })} opcoes={CATEGORIAS_DESPESA} />
                <div className="grid gap-3 sm:grid-cols-3">
                  <Texto label="Quanto por mês" prefixo="R$" valor={d.valor} aoMudar={(v) => mudar({ valor: v })} />
                  <Texto label="Detalhe (opcional)" valor={d.descricao} aoMudar={(v) => mudar({ descricao: v })} placeholder="Aluguel do apartamento" />
                  <Texto label="Dia do vencimento" tipo="number" valor={d.diaVencimento} aoMudar={(v) => mudar({ diaVencimento: v })} placeholder="10" />
                </div>
                <Marcar label="É um valor fixo todo mês" valor={d.fixa} aoMudar={(v) => mudar({ fixa: v })} />
              </div>
            )}
          />
        )}

        {atual.chave === "dividas" && (
          <Lista
            itens={dividas} aoMudar={setDividas} novo={novaDivida} rotuloNovo="Adicionar outra dívida"
            vazio="Sem dívida nenhuma? Ótimo — é só avançar."
            render={(d, mudar) => (
              <div className="grid gap-3 sm:grid-cols-2">
                <Texto label="Que tipo de dívida" valor={d.tipo} aoMudar={(v) => mudar({ tipo: v })} sugestoes={TIPOS_DIVIDA} />
                <Texto label="Com quem" valor={d.credor} aoMudar={(v) => mudar({ credor: v })} placeholder="Banco, loja, financeira" />
                <Texto label="Quanto falta pagar no total" prefixo="R$" valor={d.total} aoMudar={(v) => mudar({ total: v })} />
                <Texto label="Parcela por mês" prefixo="R$" valor={d.parcela} aoMudar={(v) => mudar({ parcela: v })} />
                <Texto label="Juros ao mês" sufixo="%" tipo="number" valor={d.juros} aoMudar={(v) => mudar({ juros: v })} dica="Se não souber, deixe em branco." />
                <Texto label="Parcelas restantes" tipo="number" valor={d.mesesRestantes} aoMudar={(v) => mudar({ mesesRestantes: v })} />
              </div>
            )}
          />
        )}

        {atual.chave === "patrimonio" && (
          <Lista
            itens={bens} aoMudar={setBens} novo={novoBem} rotuloNovo="Adicionar outro bem"
            vazio="Conta corrente, investimento, imóvel, carro — tudo entra."
            render={(b, mudar) => (
              <div className="space-y-3">
                <Chips label="O que é" valor={b.tipo} aoMudar={(v) => mudar({ tipo: v })} opcoes={TIPOS_PATRIMONIO} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Texto label="Quanto vale hoje" prefixo="R$" valor={b.valor} aoMudar={(v) => mudar({ valor: v })} />
                  <Texto label="Detalhe (opcional)" valor={b.descricao} aoMudar={(v) => mudar({ descricao: v })} placeholder="Apartamento, CDB do banco…" />
                </div>
              </div>
            )}
          />
        )}

        {atual.chave === "seguros" && (
          <Lista
            itens={seguros} aoMudar={setSeguros} novo={novoSeguro} rotuloNovo="Adicionar outro seguro"
            vazio="Se você não tem nenhum, avance — o plano vai te dizer de qual você mais precisa."
            render={(s, mudar) => (
              <div className="grid gap-3 sm:grid-cols-2">
                <Texto label="Tipo de seguro" valor={s.tipo} aoMudar={(v) => mudar({ tipo: v })} sugestoes={TIPOS_SEGURO} />
                <Texto label="Seguradora" valor={s.seguradora} aoMudar={(v) => mudar({ seguradora: v })} />
                <Texto label="Quanto paga por mês" prefixo="R$" valor={s.premio} aoMudar={(v) => mudar({ premio: v })} />
                <Texto label="Quanto ele cobre" prefixo="R$" valor={s.cobertura} aoMudar={(v) => mudar({ cobertura: v })} />
              </div>
            )}
          />
        )}

        {atual.chave === "objetivos" && (
          <Lista
            itens={objetivos} aoMudar={setObjetivos} novo={novoObjetivo} rotuloNovo="Adicionar outro objetivo"
            vazio="Sonho com número e prazo vira meta. Sem isso, fica desejo."
            render={(o, mudar) => (
              <div className="grid gap-3 sm:grid-cols-2">
                <Texto label="O que você quer" valor={o.descricao} aoMudar={(v) => mudar({ descricao: v })} sugestoes={OBJETIVOS_SUGERIDOS} />
                <Texto label="Quanto custa" prefixo="R$" valor={o.alvo} aoMudar={(v) => mudar({ alvo: v })} />
                <Texto label="Para quando" tipo="date" valor={o.prazo} aoMudar={(v) => mudar({ prazo: v })} />
                <Escolha label="Prioridade" valor={o.prioridade} aoMudar={(v) => mudar({ prioridade: v })} opcoes={PRIORIDADES} />
              </div>
            )}
          />
        )}

        {atual.chave === "aposentadoria" && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Texto
                label="Parar de trabalhar aos"
                sufixo="anos"
                valor={apos.idade}
                aoMudar={(v) => setApos({ ...apos, idade: v })}
                placeholder="60"
              />
              <Texto
                label="Renda desejada por mês"
                prefixo="R$"
                valor={apos.renda}
                aoMudar={(v) => setApos({ ...apos, renda: v })}
                placeholder="igual ao seu custo de hoje"
              />
              <Texto
                label="INSS ou pensão esperada"
                prefixo="R$"
                valor={apos.inss}
                aoMudar={(v) => setApos({ ...apos, inss: v })}
                placeholder="0"
              />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Pode deixar em branco o que não souber: o plano usa um padrão
              honesto (parar aos 60 ou daqui a 5 anos, renda igual ao custo de
              hoje, INSS zero) e você ajusta quando quiser.
            </p>
          </div>
        )}

        {atual.chave === "comportamento" && (
          <div className="space-y-3">
            {PERGUNTAS_COMPORTAMENTAIS.map((p) => (
              <Escala
                key={p.campo}
                titulo={p.titulo}
                esquerda={p.esquerda}
                direita={p.direita}
                valor={comportamento[p.campo]}
                aoMudar={(v) => setComportamento({ ...comportamento, [p.campo]: v })}
              />
            ))}
            <Texto
              label="O que costuma te fazer gastar sem pensar? (opcional)"
              valor={comportamento.spending_triggers}
              aoMudar={(v) => setComportamento({ ...comportamento, spending_triggers: v })}
              placeholder="Estresse, promoção, viagem…"
            />
            {houveResposta(comportamento) && (
              <PerfilResultado respostas={comportamento} />
            )}
          </div>
        )}

        {atual.chave === "revisao" && (
          <Revisao
            rendas={rendas}
            despesas={despesas}
            dividas={dividas}
            bens={bens}
            objetivos={objetivos}
            seguros={seguros}
            aoVoltarPara={setBloco}
          />
        )}
      </div>

      {erro && (
        <p className="mt-5 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Não consegui salvar: {erro}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between gap-3 border-t border-border/70 pt-5">
        <button
          type="button"
          onClick={() => setBloco((b) => Math.max(0, b - 1))}
          disabled={bloco === 0 || salvando}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-2xs font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:invisible"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar
        </button>

        <button
          type="button"
          onClick={ultimo ? finalizar : avancar}
          disabled={salvando}
          className="flex items-center gap-2 rounded-xl bg-accent-btn px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-95 disabled:opacity-60"
        >
          {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
          {ultimo ? "Ver meu diagnóstico" : bloco === 0 ? "Começar" : "Salvar e continuar"}
          {!salvando && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Peças da tela                                                              */
/* -------------------------------------------------------------------------- */

function Abertura() {
  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <ul className="space-y-3 text-sm text-slate-600">
        {[
          "Leva uns 10 minutos. Você pode parar e voltar quando quiser.",
          "Estimativa serve. Número redondo já entrega um plano útil.",
          "Ninguém da Novare precisa liberar nada: assim que terminar, seu diagnóstico e seu plano ficam prontos.",
          "Seus dados são seus. Ficam na sua conta e você edita quando quiser.",
        ].map((linha) => (
          <li key={linha} className="flex gap-2.5">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            {linha}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PerfilResultado({ respostas }: { respostas: RespostasComportamentais }) {
  const perfil = calcularPerfil(respostas);
  const info = PERFIS[perfil];
  return (
    <div className="rounded-2xl bg-primary p-5 text-white">
      <p className="text-2xs font-semibold uppercase tracking-wider text-white/60">
        Seu perfil
      </p>
      <p className="mt-1 font-display text-xl font-bold">
        <span className="mr-2">{info.emoji}</span>
        {perfil}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-white/85">{info.descricao}</p>
      <p className="mt-3 border-t border-white/20 pt-3 text-xs text-white/75">
        {info.comoUsar}
      </p>
    </div>
  );
}

function Revisao({
  rendas, despesas, dividas, bens, seguros, objetivos, aoVoltarPara,
}: {
  rendas: Renda[]; despesas: Despesa[]; dividas: Divida[]; bens: Bem[];
  seguros: Seguro[]; objetivos: Objetivo[];
  aoVoltarPara: (bloco: number) => void;
}) {
  const soma = (v: string[]) => v.reduce((s, x) => s + num(x), 0);
  const rendaMensal = rendas.reduce(
    (s, r) => s + (r.frequencia === "anual" ? num(r.valor) / 12 : num(r.valor)),
    0,
  );
  const despesaMensal = soma(despesas.map((d) => d.valor));
  const parcelas = soma(dividas.map((d) => d.parcela));

  const avisos = conferir({
    rendaMensal,
    despesaMensal,
    parcelasMensais: parcelas,
    patrimonioTotal: soma(bens.map((b) => b.valor)),
    dividaTotal: soma(dividas.map((d) => d.total)),
  });

  const brl = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

  const linhas = [
    { rotulo: "Renda por mês", valor: brl(rendaMensal), qtd: rendas.length, bloco: 2 },
    { rotulo: "Despesas por mês", valor: brl(despesaMensal), qtd: despesas.length, bloco: 3 },
    { rotulo: "Parcelas de dívida", valor: brl(parcelas), qtd: dividas.length, bloco: 4 },
    { rotulo: "Patrimônio", valor: brl(soma(bens.map((b) => b.valor))), qtd: bens.length, bloco: 5 },
    { rotulo: "Seguros", valor: `${seguros.filter((s) => s.tipo).length} contratado(s)`, qtd: seguros.length, bloco: 6 },
    { rotulo: "Objetivos", valor: `${objetivos.filter((o) => o.descricao).length} definido(s)`, qtd: objetivos.length, bloco: 7 },
  ];

  return (
    <div className="space-y-4">
      {avisos.length > 0 && (
        <div className="rounded-2xl border border-warning/40 bg-warning/5 p-4">
          <p className="flex items-center gap-2 text-xs font-bold text-foreground">
            <TriangleAlert className="h-3.5 w-3.5 text-warning" />
            Vale conferir antes de fechar
          </p>
          <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
            {avisos.map((a) => (
              <li key={a.texto}>{a.texto}</li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-slate-500">
            Se estiver tudo certo, pode seguir — dá para ajustar depois.
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        {linhas.map((l) => (
          <div
            key={l.rotulo}
            className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 last:border-0"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">{l.rotulo}</p>
              <p className="text-[11px] text-muted-foreground">{l.qtd} item(ns)</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold tabular-nums text-primary">{l.valor}</span>
              <button
                type="button"
                onClick={() => aoVoltarPara(l.bloco)}
                className="text-2xs font-semibold text-accent-strong underline-offset-2 hover:underline"
              >
                editar
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-primary/5 p-4 text-xs text-slate-600">
        Ao fechar, seu diagnóstico é calculado na hora e seu plano fica disponível.
        Você pode voltar aqui e mudar qualquer número quando quiser.
      </div>
    </div>
  );
}

/**
 * Existe usuário logado mas não existe ficha de cliente.
 *
 * Acontece com quem virou admin da Novare: o fluxo de convite apaga a linha em
 * `clients`. Dizer isso é melhor do que deixar a tela quebrar num insert que a
 * RLS vai recusar de qualquer jeito.
 */
function SemFicha() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-white p-6 text-center">
      <h1 className="font-display text-xl font-bold text-primary">
        Sua conta é de equipe
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Contas administrativas da Novare não têm ficha de cliente, então não há
        um planejamento pessoal para abrir aqui. Para testar o produto como
        cliente, use uma conta comum.
      </p>
      <Link
        href="/hub"
        className="mt-5 inline-block rounded-xl bg-accent-btn px-5 py-2.5 text-sm font-bold text-white"
      >
        Voltar ao Workspace
      </Link>
    </div>
  );
}

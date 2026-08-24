"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight,
  KeyRound,
  Lock,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { pct } from "@/lib/calculos";
import { novoId, useArmazenado } from "@/lib/useArmazenado";

/* -------------------------------------------------------------------------- */

interface Conta {
  id: string;
  servico: string;
  email: string;
  doisFatores: boolean;
  instrucoes: string;
}

/* -------------------------------------------------------------------------- */

export default function InventarioPage() {
  const [contasBrutas, setContas, carregado] = useArmazenado<Conta[]>(
    "inventario",
    []
  );
  const contas = useMemo(
    () => (Array.isArray(contasBrutas) ? contasBrutas : []),
    [contasBrutas]
  );

  const [servico, setServico] = useState("");
  const [email, setEmail] = useState("");
  const [doisFatores, setDoisFatores] = useState(false);
  const [instrucoes, setInstrucoes] = useState("");

  const formValido = servico.trim().length > 0;

  const comDoisFatores = useMemo(
    () => contas.filter((c) => c.doisFatores).length,
    [contas]
  );
  const pctDoisFatores =
    contas.length > 0 ? (comDoisFatores / contas.length) * 100 : 0;
  const semInstrucoes = useMemo(
    () => contas.filter((c) => !c.instrucoes?.trim()).length,
    [contas]
  );

  const adicionar = (e: FormEvent) => {
    e.preventDefault();
    if (!formValido) return;
    const nova: Conta = {
      id: novoId(),
      servico: servico.trim(),
      email: email.trim(),
      doisFatores,
      instrucoes: instrucoes.trim(),
    };
    setContas((lista) => [...(Array.isArray(lista) ? lista : []), nova]);
    setServico("");
    setEmail("");
    setDoisFatores(false);
    setInstrucoes("");
  };

  const remover = (id: string) =>
    setContas((lista) =>
      (Array.isArray(lista) ? lista : []).filter((c) => c.id !== id)
    );

  const alternar2fa = (id: string) =>
    setContas((lista) =>
      (Array.isArray(lista) ? lista : []).map((c) =>
        c.id === id ? { ...c, doisFatores: !c.doisFatores } : c
      )
    );

  const vazio = carregado && contas.length === 0;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/marca/logo-novare.png"
              alt="Novare"
              width={112}
              height={28}
              className="h-7 w-auto"
              priority
            />
          </Link>
          <span className="text-xs font-medium text-slate-500 hidden sm:block">
            Inventário digital
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <section className="pt-12 pb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
            <KeyRound className="h-3.5 w-3.5" />
            Grátis, fica só no seu navegador
          </div>
          <h1 className="text-3xl sm:text-[2.6rem] leading-tight font-display font-bold text-primary">
            Sua vida financeira mora em contas. Alguém sabe onde?
          </h1>
          <p className="text-slate-500 mt-3 max-w-xl">
            Bancos, corretoras, e-mails, assinaturas, redes. Mapeie onde cada
            coisa está e o que a sua família precisa fazer com ela. Aqui você
            registra onde a conta fica, nunca a senha.
          </p>
        </section>

        {/* Número-herói */}
        <section className="rounded-3xl bg-primary text-white p-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Contas mapeadas
          </p>
          <p className="text-4xl sm:text-5xl font-black tabular-nums mt-2">
            {contas.length}
          </p>
          <p className="text-sm text-white/70 mt-3">
            {vazio
              ? "Comece pelo básico: banco principal, corretora e o e-mail que recebe tudo."
              : "Cada linha aqui é uma porta que a sua família vai saber que existe."}
          </p>
        </section>

        {/* KPIs */}
        <section className="mt-6 grid sm:grid-cols-3 gap-4">
          <Kpi
            icone={<ShieldCheck className="h-5 w-5 mx-auto text-primary" />}
            valor={pct(pctDoisFatores, 0)}
            legenda="Com verificação em duas etapas"
          />
          <Kpi
            icone={<Lock className="h-5 w-5 mx-auto text-primary" />}
            valor={`${comDoisFatores}`}
            legenda="Contas protegidas por 2FA"
          />
          <Kpi
            icone={<KeyRound className="h-5 w-5 mx-auto text-primary" />}
            valor={`${semInstrucoes}`}
            legenda="Ainda sem instrução para a família"
          />
        </section>

        {/* Por que importa */}
        <section className="mt-6 rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">
            Conta que a família não conhece some. Saldo em corretora, milhas,
            criptomoeda e cashback não aparecem em nenhuma certidão, e ninguém
            reclama o que não sabe que existe. Um inventário digital atualizado
            transforma uma busca às cegas numa lista objetiva de providências.
          </p>
        </section>

        {/* Cadastro */}
        <section className="mt-6 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">
            Mapear uma conta
          </h2>
          <p className="text-[11px] text-slate-500 mb-4">
            Nunca escreva senhas aqui. Registre onde a conta está e como a
            família chega até ela.
          </p>

          <form onSubmit={adicionar} className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Serviço
              </label>
              <input
                value={servico}
                onChange={(e) => setServico(e.target.value)}
                placeholder="Banco, corretora, e-mail, rede social..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Login ou e-mail usado
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@email.com"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Instruções para a família
              </label>
              <textarea
                value={instrucoes}
                onChange={(e) => setInstrucoes(e.target.value)}
                rows={3}
                placeholder="Onde está a chave de acesso, quem procurar, o que fazer com o saldo..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
              />
            </div>
            <div className="sm:col-span-2 flex flex-wrap items-center gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={doisFatores}
                  onChange={(e) => setDoisFatores(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Tem verificação em duas etapas
              </label>
              <button
                type="submit"
                disabled={!formValido}
                className="inline-flex items-center gap-2 rounded-xl bg-primary text-white px-4 h-11 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                Adicionar conta
              </button>
            </div>
          </form>

          {vazio ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <KeyRound className="h-5 w-5 mx-auto text-slate-500" />
              <p className="text-sm font-semibold text-slate-600 mt-3">
                Nenhuma conta mapeada ainda
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Comece pelo e-mail principal: é por ele que se recupera o acesso
                a quase todo o resto.
              </p>
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {contas.map((c) => (
                <li
                  key={c.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {c.servico}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {c.email || "login não informado"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => alternar2fa(c.id)}
                      aria-pressed={c.doisFatores}
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                        c.doisFatores
                          ? "bg-success/15 text-success-strong"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {c.doisFatores ? "2FA ligado" : "sem 2FA"}
                    </button>
                    <button
                      type="button"
                      onClick={() => remover(c.id)}
                      aria-label={`Remover conta ${c.servico}`}
                      className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-300 transition-colors hover:text-destructive hover:bg-slate-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {c.instrucoes?.trim() ? (
                    <div className="mt-3 rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500 whitespace-pre-line">
                        {c.instrucoes}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">
                        Sem instrução registrada. Uma frase já ajuda muito.
                      </p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Próximo passo */}
        <section className="mt-6 rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">
            Com o inventário feito, marque o item correspondente no{" "}
            <Link
              href="/ferramentas/sucessorio"
              className="font-semibold text-primary underline underline-offset-2"
            >
              Planejamento Sucessório
            </Link>
            .
          </p>
        </section>


        <p className="mt-6 text-[11px] text-slate-500">
          Seus dados ficam somente no seu navegador.
        </p>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Kpi({
  icone,
  valor,
  legenda,
}: {
  icone: ReactNode;
  valor: string;
  legenda: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
      {icone}
      <p className="text-2xl font-bold mt-2 tabular-nums text-slate-900">
        {valor}
      </p>
      <p className="text-[11px] text-slate-500 mt-0.5">{legenda}</p>
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Check, KeyRound, Loader2, User } from "lucide-react";
import { salvarPerfil, trocarSenha, type EstadoPerfil } from "@/app/perfil/actions";

const VAZIO: EstadoPerfil = {};

/**
 * O cadastro do cliente, em dois blocos: dados e senha.
 *
 * Cada um tem sua própria action e seu próprio aviso — salvar o endereço
 * não pode depender de a senha estar preenchida, e vice-versa.
 */
export function FormularioPerfil(props: {
  nome: string;
  email: string;
  apelido: string;
  telefone: string;
  nascimento: string;
  cidade: string;
  uf: string;
  profissao: string;
  objetivo: string;
  aceitaEmail: boolean;
}) {
  const [estado, salvar] = useActionState(salvarPerfil, VAZIO);
  const [estadoSenha, mudarSenha] = useActionState(trocarSenha, VAZIO);

  return (
    <>
      <form
        action={salvar}
        className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7"
      >
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-bold text-primary">
            Seus dados
          </h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Quanto mais completo, melhor a Novare consegue personalizar o
          atendimento. Nada aqui é obrigatório além do nome.
        </p>

        <div className="mt-5 grid gap-x-5 gap-y-4 sm:grid-cols-2">
          <Campo nome="nome" rotulo="Nome completo" valor={props.nome} obrigatorio />
          <Campo
            nome="apelido"
            rotulo="Como prefere ser chamado"
            valor={props.apelido}
            dica="É assim que a gente vai te chamar."
          />

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              E-mail
            </label>
            <input
              value={props.email}
              disabled
              className="h-11 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-3.5 text-[0.9375rem] text-slate-500"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              É o seu login. Para trocar, fale com a gente.
            </p>
          </div>

          <Campo
            nome="telefone"
            rotulo="WhatsApp"
            valor={props.telefone}
            tipo="tel"
            dica="Por onde o consultor fala com você."
          />

          <Campo
            nome="nascimento"
            rotulo="Data de nascimento"
            valor={props.nascimento}
            tipo="date"
            dica="Usada para calcular prazos do seu plano."
          />
          <Campo nome="profissao" rotulo="Profissão" valor={props.profissao} />

          <Campo nome="cidade" rotulo="Cidade" valor={props.cidade} />
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Estado
            </label>
            <input
              name="uf"
              defaultValue={props.uf}
              maxLength={2}
              placeholder="SP"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] uppercase outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              O que você quer resolver com o seu dinheiro
            </label>
            <textarea
              name="objetivo"
              defaultValue={props.objetivo}
              rows={3}
              maxLength={400}
              placeholder="Ex.: quero comprar um apartamento em 5 anos e parar de depender do cartão."
              className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              O consultor lê isso antes da primeira conversa — assim ninguém
              começa do zero.
            </p>
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 sm:col-span-2">
            <input
              type="checkbox"
              name="aceita_email"
              defaultChecked={props.aceitaEmail}
              className="h-4 w-4 rounded border-slate-300 accent-[var(--color-accent)]"
            />
            <span className="text-sm text-slate-600">
              Quero receber por e-mail as novidades e análises da Novare
            </span>
          </label>
        </div>

        <Aviso estado={estado} />
        <Enviar>Salvar meus dados</Enviar>
      </form>

      <form
        action={mudarSenha}
        className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7"
      >
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-bold text-primary">Senha</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Pelo menos 8 caracteres. Você continua conectado depois de trocar.
        </p>

        <div className="mt-5 grid gap-x-5 gap-y-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Nova senha
            </label>
            <input
              name="senha"
              type="password"
              autoComplete="new-password"
              minLength={8}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Repita a nova senha
            </label>
            <input
              name="senha2"
              type="password"
              autoComplete="new-password"
              minLength={8}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
            />
          </div>
        </div>

        <Aviso estado={estadoSenha} />
        <Enviar>Trocar senha</Enviar>
      </form>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function Campo({
  nome,
  rotulo,
  valor,
  tipo = "text",
  dica,
  obrigatorio,
}: {
  nome: string;
  rotulo: string;
  valor: string;
  tipo?: string;
  dica?: string;
  obrigatorio?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
        {rotulo}
        {obrigatorio && <span className="text-accent-strong"> *</span>}
      </label>
      <input
        name={nome}
        type={tipo}
        defaultValue={valor}
        required={obrigatorio}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[0.9375rem] outline-none focus:border-accent focus:ring-4 focus:ring-accent/12"
      />
      {dica && <p className="mt-1 text-[11px] text-slate-500">{dica}</p>}
    </div>
  );
}

function Aviso({ estado }: { estado: EstadoPerfil }) {
  if (estado.erro) {
    return (
      <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
        {estado.erro}
      </p>
    );
  }
  if (estado.ok) {
    return (
      <p className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <Check className="h-4 w-4" />
        {estado.ok}
      </p>
    );
  }
  return null;
}

/** Botão que se desabilita sozinho durante o envio. */
function Enviar({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

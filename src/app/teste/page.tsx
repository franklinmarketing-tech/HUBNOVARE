"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Entrada rápida de teste: digita só uma senha e cai no app.
 *
 * ⚠️ ATALHO TEMPORÁRIO, a pedido do dono, para testar em campo sem digitar
 * e-mail e senha. Loga sempre na conta abaixo.
 *
 * ⚠️⚠️ RISCO CONHECIDO E ACEITO PELO DONO: esta conta é ADMIN, e admin vê os
 * dados de TODOS os clientes (o Supabase é compartilhado com o novareapp).
 * A senha "adm123" é trivial e as credenciais ficam no bundle público. Ou
 * seja: quem descobrir a URL /teste entra como admin. É aceitável só
 * enquanto isto é teste fechado. ANTES DE DIVULGAR PARA QUALQUER PÚBLICO,
 * apague a pasta src/app/teste inteira.
 */

const CONTA = {
  email: "novareadmapp@gmail.com",
  password: "novareadm",
};

/** A palavra que abre a porta. */
const PORTA = "adm123";

export default function EntrarTeste() {
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const router = useRouter();

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (valor.trim() !== PORTA) {
      setErro(true);
      return;
    }
    setEntrando(true);
    setErro(false);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(CONTA);
    if (error) {
      setEntrando(false);
      setErro(true);
      return;
    }
    router.push("/planejamento/app");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-creme to-white px-5">
      <form
        onSubmit={entrar}
        className="w-full max-w-xs rounded-3xl border border-border bg-card p-7 shadow-card"
      >
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-light text-primary">
          <Lock className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <h1 className="mt-4 text-center font-display text-lg font-bold text-primary">
          Acesso de teste
        </h1>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          Digite a senha para entrar.
        </p>

        <input
          type="password"
          value={valor}
          onChange={(e) => {
            setValor(e.target.value);
            setErro(false);
          }}
          autoFocus
          placeholder="senha"
          className={`mt-5 h-11 w-full rounded-xl border bg-white px-4 text-center text-sm outline-none transition-colors ${
            erro ? "border-destructive" : "border-border focus:border-primary/40"
          }`}
        />

        {erro && (
          <p className="mt-2 text-center text-xs text-destructive">
            Senha incorreta.
          </p>
        )}

        <button
          type="submit"
          disabled={entrando}
          className="mt-4 h-11 w-full rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-soft disabled:opacity-60"
        >
          {entrando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}

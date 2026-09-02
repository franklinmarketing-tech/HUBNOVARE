"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Entrada rápida de teste: digita só uma senha e cai no app.
 *
 * ⚠️ ATALHO TEMPORÁRIO, a pedido do dono, para os consultores testarem em
 * campo sem digitar e-mail e senha. Loga sempre na conta de teste definida
 * nas variáveis de ambiente.
 *
 * SEM SEGREDO NO CÓDIGO: e-mail, senha e a "porta" vêm de env vars, não estão
 * escritos aqui — assim nada disso vai para o repositório público. A conta
 * apontada é um CLIENTE comum de teste (7 dias grátis, sem dados de
 * terceiros, sem admin), então mesmo o que a env `NEXT_PUBLIC_*` expõe no
 * navegador é descartável.
 *
 * Se as variáveis não estiverem configuradas, a página avisa em vez de tentar
 * um login vazio.
 *
 * REMOVER ANTES DE ABRIR AO PÚBLICO: apague a pasta src/app/teste.
 */

const PORTA = process.env.NEXT_PUBLIC_TESTE_PORTA ?? "";
const EMAIL = process.env.NEXT_PUBLIC_TESTE_EMAIL ?? "";
const SENHA = process.env.NEXT_PUBLIC_TESTE_SENHA ?? "";

export default function EntrarTeste() {
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);
  const router = useRouter();

  const configurado = PORTA && EMAIL && SENHA;

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (!configurado) return;
    if (valor.trim() !== PORTA) {
      setErro("Senha incorreta.");
      return;
    }
    setEntrando(true);
    setErro(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: EMAIL,
      password: SENHA,
    });
    if (error) {
      setEntrando(false);
      setErro("Não consegui entrar. A conta de teste pode ter mudado.");
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

        {!configurado ? (
          <p className="mt-5 rounded-xl bg-warning/10 px-4 py-3 text-center text-xs text-slate-700">
            A entrada de teste ainda não foi configurada. Faltam as variáveis
            NEXT_PUBLIC_TESTE_PORTA, _EMAIL e _SENHA.
          </p>
        ) : (
          <>
            <input
              type="password"
              value={valor}
              onChange={(e) => {
                setValor(e.target.value);
                setErro(null);
              }}
              autoFocus
              placeholder="senha"
              className={`mt-5 h-11 w-full rounded-xl border bg-white px-4 text-center text-sm outline-none transition-colors ${
                erro ? "border-destructive" : "border-border focus:border-primary/40"
              }`}
            />

            {erro && (
              <p className="mt-2 text-center text-xs text-destructive">{erro}</p>
            )}

            <button
              type="submit"
              disabled={entrando}
              className="mt-4 h-11 w-full rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-soft disabled:opacity-60"
            >
              {entrando ? "Entrando..." : "Entrar"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { semearDemonstracao } from "@/lib/fincash/demo";

/**
 * Entrada de demonstração do FINCASH — SEM link nenhum apontando para cá.
 *
 * É a mesma peça que o Planejamento já tem em `/planejamento/testar`, e é
 * cópia deliberada: o padrão da casa para "entrar sem cadastro" já existe,
 * já foi pensado, e inventar um segundo jeito seria criar uma segunda
 * superfície de ataque para manter.
 *
 * PARA QUE SERVE
 * A landing do FINCASH não tinha uma única imagem do produto. Esta rota cria
 * uma conta de verdade, enche de dado crível (`src/lib/fincash/demo.ts`) e
 * entra — é dela que saem as fotos do script `scripts/fotografar-fincash.mjs`.
 * Serve também para conferência interna: quem tem o endereço de cor vê o app
 * por dentro sem pedir a conta de ninguém.
 *
 * O QUE PROTEGE O RESTO DO MUNDO DESTA ROTA
 *  1. Nada é linkado para cá — nem menu, nem landing, nem sitemap.
 *  2. A conta criada é COMUM, sem privilégio. Cai em `cliente` no
 *     `getPerfil()`, que é o menor privilégio do Hub. Ela não vê painel de
 *     consultor, não vê administração.
 *  3. TUDO acontece com a sessão dessa conta nova, no navegador. A rota não
 *     recebe id de usuário, não aceita parâmetro nenhum e não tem caminho por
 *     onde escrever em conta alheia: quem barra é a RLS do Postgres, não um
 *     `if` daqui. Nenhuma chave de serviço chega perto deste arquivo.
 *  4. O e-mail carrega o prefixo `demo.fincash.` para a limpeza saber
 *     exatamente o que apagar depois — conta de demonstração que não dá para
 *     identificar é lixo que fica.
 *
 * A credencial fica no navegador para a mesma pessoa voltar à MESMA conta em
 * vez de criar uma nova a cada visita. Junto com a idempotência da semeadura,
 * é o que impede o extrato de dobrar a cada `F5`.
 */

const CHAVE_DEMO = "fincash:conta-demonstracao";

type Acesso = { email: string; senha: string };

const aleatorio = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(10)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

function lerAcesso(): Acesso | null {
  try {
    const cru = localStorage.getItem(CHAVE_DEMO);
    if (!cru) return null;
    const dados = JSON.parse(cru) as Acesso;
    return dados?.email && dados?.senha ? dados : null;
  } catch {
    return null;
  }
}

export default function EntrarNaDemonstracao() {
  const [erro, setErro] = useState<string | null>(null);
  const [etapa, setEtapa] = useState("Preparando a conta de demonstração…");
  const jaComecou = useRef(false);

  useEffect(() => {
    if (jaComecou.current) return;
    jaComecou.current = true;

    (async () => {
      const supabase = createClient();
      const salvo = lerAcesso();
      let entrou = false;

      // Já esteve aqui: volta para a MESMA conta. É o que evita acumular uma
      // conta de demonstração por visita — e o que garante que as fotos de
      // hoje mostrem a mesma vida financeira das de ontem.
      if (salvo) {
        const { error } = await supabase.auth.signInWithPassword({
          email: salvo.email,
          password: salvo.senha,
        });
        if (error) localStorage.removeItem(CHAVE_DEMO);
        else entrou = true;
      }

      if (!entrou) {
        const acesso: Acesso = {
          email: `demo.fincash.${aleatorio()}@novareapp.com.br`,
          senha: `Fc-${aleatorio()}`,
        };

        const { data, error } = await supabase.auth.signUp({
          email: acesso.email,
          password: acesso.senha,
          options: { data: { nome: "Demonstração FINCASH" } },
        });

        if (error || !data.session) {
          setErro(
            error?.message ??
              "A conta foi criada, mas a sessão não veio pronta — pode ser confirmação de e-mail ligada no projeto.",
          );
          return;
        }

        try {
          localStorage.setItem(CHAVE_DEMO, JSON.stringify(acesso));
        } catch {
          /* navegador sem storage: a sessão desta visita continua valendo */
        }
      }

      /* A semeadura roda em toda visita e decide sozinha se tem o que fazer:
         ela pergunta ao banco se já existe lançamento antes de escrever
         qualquer coisa. Chamar sempre é mais seguro que confiar num sinal
         guardado no navegador — storage limpo não pode significar conta vazia
         semeada duas vezes. */
      try {
        setEtapa("Montando o histórico de sete meses…");
        await semearDemonstracao();
      } catch (e) {
        setErro(
          e instanceof Error
            ? `Não consegui preencher a conta: ${e.message}`
            : "Não consegui preencher a conta de demonstração.",
        );
        return;
      }

      window.location.href = "/fincash/app";
    })();
  }, []);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <Image
        src="/marca/logo-novare.png"
        alt="Novare"
        width={126}
        height={35}
        style={{ height: 32, width: "auto" }}
      />
      {erro ? (
        <>
          <p className="max-w-sm text-sm text-destructive">{erro}</p>
          <p className="text-xs text-muted-foreground">
            Use o cadastro normal em{" "}
            <a href="/fincash" className="font-semibold text-primary">
              /fincash
            </a>
            .
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{etapa}</p>
      )}
    </div>
  );
}

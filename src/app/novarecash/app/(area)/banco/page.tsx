import { getPerfil } from "@/lib/perfil";
import { estadoDoRecurso } from "@/lib/novarecash/recursos";
import { AvisoModoEquipe, EmAtivacao } from "../EmAtivacao";
import { Cabecalho } from "../pecas";
import { TelaBanco } from "./TelaBanco";

export const dynamic = "force-dynamic";

/**
 * Conexão com o banco (Open Finance, pelo Banco MCP). As contas e transações
 * entram nas tabelas próprias do NovareCash (`ncash_contas`, `ncash_transacoes`).
 *
 * ⚠️ O plano atual do Banco MCP permite UMA conexão no total. Enquanto
 * `RECURSOS.banco.noAr` for false, o cliente vê "em ativação" e só a equipe vê
 * a tela funcionando (para testar com a conexão da casa).
 */
export default async function BancoNovareCash() {
  const perfil = await getPerfil();
  const estado = estadoDoRecurso("banco", perfil?.role);

  return (
    <div className="surgir">
      <Cabecalho
        titulo="Banco"
        resumo="Conecte a sua conta pelo Open Finance, o sistema oficial do Banco Central: saldo e extrato entram no NovareCash sem digitar nada."
      />
      {estado.liberado ? (
        <>
          {estado.modoEquipe && <AvisoModoEquipe liberaEm={estado.recurso.liberaEm} />}
          <TelaBanco />
        </>
      ) : (
        <EmAtivacao titulo="Conexão com o banco" liberaEm={estado.recurso.liberaEm}>
          Quando liberar, você autoriza o seu banco a compartilhar saldo e extrato (só leitura: ninguém movimenta
          dinheiro por aqui) e as transações entram no seu extrato sem duplicar. Enquanto isso, lance à mão no Extrato.
        </EmAtivacao>
      )}
    </div>
  );
}

import { Cabecalho } from "../pecas";
import { TelaImportar } from "./TelaImportar";

export const dynamic = "force-dynamic";

/**
 * IMPORTAR EXTRATO: para o banco que não está no Open Finance. A pessoa baixa
 * o OFX ou o CSV no app do banco e traz para cá. O arquivo é lido NO NAVEGADOR
 * (`src/lib/novarecash/importar.ts`) — nada sobe para servidor —, a prévia
 * mostra o que vai entrar e só o que ela confirmar é gravado.
 */
export default function ImportarNovareCash() {
  return (
    <div className="surgir">
      <Cabecalho
        titulo="Importar extrato"
        resumo="Traga o extrato do banco em OFX ou CSV. Você confere tudo antes de gravar, e importar o mesmo arquivo de novo não duplica nada."
      />
      <TelaImportar />
    </div>
  );
}

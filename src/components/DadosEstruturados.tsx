/**
 * Põe um ou mais blocos JSON-LD na página (ver `lib/dados-estruturados.ts`).
 *
 * ⚠️ O `<` VIRA `<`. O conteúdo vem dos títulos e resumos dos artigos;
 * um "</script>" num texto fecharia a tag no meio do JSON. A troca é
 * invisível para quem lê o JSON e fecha essa porta.
 */
export function DadosEstruturados({ dados }: { dados: object | object[] }) {
  const lista = Array.isArray(dados) ? dados : [dados];
  return (
    <>
      {lista.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(d).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}

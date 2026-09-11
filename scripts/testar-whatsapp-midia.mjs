/**
 * Áudio e foto no assistente do WhatsApp — as regras que custam dinheiro ou
 * gravam número errado.
 *
 * O que este arquivo prova, em ordem de gravidade:
 *   1. áudio transcrito vira o MESMO lançamento que o texto equivalente geraria
 *      (se isto quebrar, áudio e texto passam a discordar sobre a mesma frase);
 *   2. transcrição sem fala PERGUNTA, não chuta;
 *   3. comprovante legível vira PROPOSTA — nunca lançamento direto;
 *   4. valor implausível e data futura são RECUSADOS;
 *   5. arquivo grande demais morre ANTES de virar chamada paga;
 *   6. teto do mês estourado responde e não gasta;
 *   7. download que falha não derruba nada.
 *
 * NENHUMA API É CHAMADA AQUI. Transcritor e visão são injetados — é para isso
 * que eles são parâmetro, e não import escondido dentro da função.
 *
 * Roda com: node scripts/testar-whatsapp-midia.mjs
 */
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/* O mesmo gancho de `testar-dividas.mjs`, e pelo mesmo motivo: a biblioteca usa
   o alias `@/` do Next, que o node puro não resolve. O desvio fica no teste. */
const RAIZ = path.resolve(fileURLToPath(import.meta.url), "..", "..");

registerHooks({
  resolve(especificador, contexto, proximo) {
    const alvo = especificador.startsWith("@/")
      ? pathToFileURL(path.join(RAIZ, "src", especificador.slice(2))).href
      : especificador.startsWith(".")
        ? new URL(especificador, contexto.parentURL).href
        : null;

    if (alvo && !alvo.endsWith(".ts") && existsSync(fileURLToPath(`${alvo}.ts`)))
      return { url: `${alvo}.ts`, shortCircuit: true };

    return proximo(especificador, contexto);
  },
});

const { processarAudio, limparTranscricao, transcricaoUtil } = await import(
  "../src/lib/fincash/whatsapp-audio.ts"
);
const {
  processarFoto,
  validarExtracao,
  interpretarRespostaVisao,
  nfceDeTexto,
  lerChaveNfce,
  fraseDaProposta,
  ehConfirmacao,
  ehRecusa,
} = await import("../src/lib/fincash/whatsapp-foto.ts");
const { midiaAceitavel, tetoMidiasMes, custoEstimadoCentavos, respostaFalhaMidia } =
  await import("../src/lib/fincash/whatsapp-midia.ts");
const { interpretar } = await import("../src/lib/fincash/whatsapp.ts");

let falhas = 0;
let oks = 0;
const ok = (nome, condicao, detalhe = "") => {
  if (condicao) oks++;
  else falhas++;
  console.log(`${condicao ? "OK   " : "FALHA"}  ${nome}${detalhe ? `  → ${detalhe}` : ""}`);
};
const titulo = (t) => console.log(`\n── ${t} ${"─".repeat(Math.max(0, 60 - t.length))}`);

// ── Cenário ─────────────────────────────────────────────────────────────────

const HOJE = new Date(2026, 8, 10); // 10/09/2026, hora local — igual ao servidor.

const CTX = {
  categorias: [
    { id: "c1", nome: "Alimentação", tipo: "despesa" },
    { id: "c2", nome: "Transporte", tipo: "despesa" },
  ],
  contas: [{ id: "a1", nome: "Nubank" }],
  cartoes: [],
  contaPadraoId: "a1",
  cartaoPadraoId: null,
  hoje: HOJE,
};

const midia = (tamanho, mime = "audio/ogg") => ({
  bytes: new ArrayBuffer(Math.min(tamanho, 8)),
  mime,
  tamanho,
});

// ── 1. Áudio vira o mesmo lançamento que o texto ────────────────────────────

titulo("áudio → texto → o interpretador de sempre");

{
  const falado = "mercado 280";
  const r = await processarAudio(midia(40_000), async () => `  ${falado}\n`);
  ok("transcrição aceita", r.ok === true);

  const porAudio = interpretar(r.texto, CTX);
  const porTexto = interpretar(falado, CTX);

  ok("áudio virou registro", porAudio.tipo === "registrar", porAudio.tipo);
  ok(
    "MESMO resultado do texto equivalente",
    JSON.stringify(porAudio) === JSON.stringify(porTexto),
  );
  ok("valor positivo, sinal no tipo", porAudio.rascunho.valor === 280, String(porAudio.rascunho.valor));
  ok("tipo despesa", porAudio.rascunho.tipo === "despesa");
}

{
  // A regra do número por extenso precisa valer para a VOZ também: é onde ela
  // mais importa, porque o canal já erra mais.
  const r = await processarAudio(midia(30_000), async () => "gastei duzentos e oitenta no mercado");
  const i = interpretar(r.texto, CTX);
  ok("número por extenso continua virando pergunta", i.tipo === "indefinido", i.tipo);
}

// ── 2. Transcrição incompreensível ──────────────────────────────────────────

titulo("áudio sem fala pergunta, não chuta");

{
  const r = await processarAudio(midia(9_000), async () => "   ");
  ok("áudio vazio recusado", r.ok === false && r.motivo === "nao-entendi", r.motivo);
}
{
  // A alucinação campeã do Whisper em silêncio. Se passar, o assistente responde
  // uma bobagem — ou, pior, tenta achar valor nela.
  const r = await processarAudio(midia(9_000), async () => "Legendas pela comunidade Amara.org");
  ok("ruído/alucinação filtrado", r.ok === false && r.motivo === "nao-entendi", r.motivo);
}
ok("limparTranscricao normaliza espaço", limparTranscricao("  uber   35 \n") === "uber 35");
ok("transcricaoUtil recusa duas letras", transcricaoUtil("ah") === false);

// ── 3. Comprovante válido → proposta ────────────────────────────────────────

titulo("foto: proposta, nunca lançamento direto");

const visaoBoa = async () => ({
  valor: 178.4,
  estabelecimento: "Supermercado Pague Menos",
  data: "2026-09-09",
});

{
  const r = await processarFoto(midia(300_000, "image/jpeg"), visaoBoa, HOJE);
  ok("extração aceita", r.ok === true, r.ok ? "" : r.motivo);
  ok("valor preservado", r.proposta.valor === 178.4);
  ok("fonte é visão", r.proposta.fonte === "visao");

  // A proposta volta para o MESMO interpretador de texto — nada de segundo
  // caminho até o banco.
  const frase = fraseDaProposta(r.proposta, HOJE);
  const i = interpretar(frase, CTX);
  ok(`frase “${frase}” vira registro`, i.tipo === "registrar", i.tipo);
  ok("valor do lançamento bate", i.tipo === "registrar" && i.rascunho.valor === 178.4);
  ok("data de ontem preservada", i.tipo === "registrar" && i.rascunho.data === "2026-09-09", i.rascunho?.data);
}

ok("“sim” confirma", ehConfirmacao("Sim") && ehConfirmacao("👍") && ehConfirmacao("pode"));
ok("“não” recusa", ehRecusa("não") && ehRecusa("errado"));
ok("frase de gasto NÃO é confirmação", ehConfirmacao("mercado 280") === false);

// ── 4. Valor implausível e data futura ──────────────────────────────────────

titulo("o que o modelo erra, e que precisa ser recusado");

{
  // Ponto decimal perdido: R$ 17,80 vira R$ 1.780,00. Dentro da faixa, então
  // passa — e é por isso que a foto SEMPRE pede confirmação em vez de gravar.
  const r = validarExtracao({ valor: 90_000, estabelecimento: "X", data: null }, HOJE);
  ok("valor absurdo recusado", r.ok === false && r.motivo === "implausivel");
}
{
  const r = validarExtracao({ valor: 0.1, estabelecimento: "X", data: null }, HOJE);
  ok("centavo solto recusado", r.ok === false && r.motivo === "implausivel");
}
{
  const r = validarExtracao({ valor: null, estabelecimento: "Padaria", data: "2026-09-09" }, HOJE);
  ok("sem valor não vira proposta", r.ok === false);
}
{
  const r = validarExtracao({ valor: 50, estabelecimento: "X", data: "2026-12-25" }, HOJE);
  ok("data FUTURA recusada (validade lida como compra)", r.ok === false && r.motivo === "implausivel");
}
{
  const r = validarExtracao({ valor: 50, estabelecimento: "X", data: "2019-01-02" }, HOJE);
  ok("comprovante de anos atrás recusado", r.ok === false);
}
{
  const r = validarExtracao({ valor: 50, estabelecimento: "X", data: "2026-02-31" }, HOJE);
  ok("data que não existe recusada", r.ok === false);
}
{
  const r = validarExtracao({ valor: 50, estabelecimento: "", data: null }, HOJE);
  ok("sem estabelecimento AINDA vira proposta", r.ok === true && r.proposta.estabelecimento === "compra");
  ok("sem data cai em hoje", r.ok === true && r.proposta.data === "2026-09-10", r.proposta?.data);
}

titulo("o JSON que o modelo devolve na vida real");

ok(
  "“R$ 1.780,00” lido como 1780",
  interpretarRespostaVisao('{"valor":"R$ 1.780,00","estabelecimento":"A","data":""}').valor === 1780,
);
ok(
  "“17.80” lido como 17.8",
  interpretarRespostaVisao('{"valor":"17.80","estabelecimento":"A","data":"2026-09-01"}').valor === 17.8,
);
ok("campo vazio vira null", interpretarRespostaVisao('{"valor":"","estabelecimento":"","data":""}').valor === null);
ok("JSON quebrado não lança", interpretarRespostaVisao("nao é json").valor === null);

titulo("NFC-e: o caminho grátis, quando a URL chega em texto");

{
  const chave44 = "35260912345678000199650010000012341000012348";
  ok("chave com 43 dígitos recusada", lerChaveNfce(chave44.slice(0, 43)) === null);

  const d = lerChaveNfce(chave44);
  ok("chave de 44 dígitos lida", d !== null && d.mesEmissao === "2026-09", d?.mesEmissao);

  const url = `https://www.fazenda.sp.gov.br/nfce/qrcode?p=${chave44}|2|1|1|A1B2C3`;
  ok("URL da NFC-e reconhecida", nfceDeTexto(url) !== null);
  ok("texto comum não vira NFC-e", nfceDeTexto("olha a nota ai") === null);
}

// ── 5. Arquivo grande demais ────────────────────────────────────────────────

titulo("tetos: o que nunca pode virar chamada paga");

{
  let chamou = false;
  const r = await processarAudio(midia(20 * 1024 * 1024), async () => {
    chamou = true;
    return "mercado 280";
  });
  ok("áudio de 20 MB recusado", r.ok === false && r.motivo === "grande-demais", r.motivo);
  ok("e a API NÃO foi chamada", chamou === false);
}
{
  let chamou = false;
  const r = await processarFoto(
    midia(12 * 1024 * 1024, "image/jpeg"),
    async () => {
      chamou = true;
      return { valor: 10, estabelecimento: "X", data: null };
    },
    HOJE,
  );
  ok("foto de 12 MB recusada", r.ok === false && r.motivo === "grande-demais");
  ok("e a visão NÃO foi chamada", chamou === false);
}
ok("vídeo disfarçado de áudio recusado", midiaAceitavel({ mime: "video/mp4", tamanho: 1000 }, "audio").ok === false);
ok("mime genérico é aceito", midiaAceitavel({ mime: "application/octet-stream", tamanho: 1000 }, "audio").ok === true);

// ── 6. Teto do mês ──────────────────────────────────────────────────────────

titulo("teto mensal por usuário");

ok("padrão é 60/mês", tetoMidiasMes() === 60, String(tetoMidiasMes()));
{
  process.env.FINCASH_MIDIA_TETO_MES = "10";
  ok("variável de ambiente manda", tetoMidiasMes() === 10);
  process.env.FINCASH_MIDIA_TETO_MES = "0";
  ok("0 desliga mídia", tetoMidiasMes() === 0);
  process.env.FINCASH_MIDIA_TETO_MES = "abacaxi";
  ok("lixo na variável cai no padrão (não vira conta aberta)", tetoMidiasMes() === 60);
  delete process.env.FINCASH_MIDIA_TETO_MES;
}
{
  // A decisão do servidor, reproduzida: a mensagem atual já está registrada, por
  // isso a comparação é `>` e não `>=`.
  const teto = tetoMidiasMes();
  ok("na 60ª mídia ainda passa", !(60 > teto));
  ok("na 61ª estoura", 61 > teto);
  const aviso = respostaFalhaMidia("teto-do-mes", "imagem");
  ok("aviso diz o número e oferece o texto", aviso.includes("60") && aviso.toLowerCase().includes("texto"));
}

titulo("custo registrado no log");

ok("áudio de 15s ≈ 0,15 centavo", Math.abs(custoEstimadoCentavos("audio", 15) - 0.15) < 0.01, String(custoEstimadoCentavos("audio", 15)));
ok("foto ≈ 0,03 centavo", custoEstimadoCentavos("imagem") === 0.03);

// ── 7. Falha de download / motor fora do ar ─────────────────────────────────

titulo("quando o motor cai");

{
  const r = await processarAudio(midia(30_000), async () => {
    throw new Error("429 rate limit");
  });
  ok("transcrição que explode vira motivo, não exceção", r.ok === false && r.motivo === "motor-indisponivel");
}
{
  const r = await processarFoto(
    midia(200_000, "image/jpeg"),
    async () => {
      throw new Error("timeout");
    },
    HOJE,
  );
  ok("visão que explode vira motivo", r.ok === false && r.motivo === "motor-indisponivel");
  ok("e a resposta ensina o caminho que funciona", respostaFalhaMidia("download-falhou", "imagem").includes("texto"));
}

// ── Fim ─────────────────────────────────────────────────────────────────────

console.log(`\n${falhas === 0 ? "TUDO OK" : "FALHOU"} — ${oks} passaram, ${falhas} falharam.`);
process.exit(falhas === 0 ? 0 : 1);

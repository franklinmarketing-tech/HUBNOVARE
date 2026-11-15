/**
 * O TELEGRAM CHEGA AO ASSISTENTE DO JEITO CERTO? (15/11/2026)
 *
 * O assistente é um só (WhatsApp e Telegram). O que este teste prova é a
 * TRADUÇÃO do update do Telegram: quem é ("tg:<chat>"), o tipo (texto, áudio,
 * foto), o id que segura a idempotência, os comandos "/" virando texto e o
 * "/start <código>" do botão "Ligar no Telegram". E o que NÃO pode passar:
 * grupo (o extrato de uma pessoa na frente de todos) e mensagem de outro robô.
 *
 *   node scripts/testar-telegram.mjs
 */
import { traduzirTelegram } from "../src/lib/fincash/telegram.ts";

let falhas = 0;
const ver = (rotulo, ok) => {
  if (!ok) falhas++;
  console.log((ok ? "  ok  " : "FALHOU") + "  " + rotulo);
};
const msg = (m) => ({ update_id: 9, message: { message_id: 77, date: 1763200000, chat: { id: 123456, type: "private" }, from: { first_name: "Ana Paula" }, ...m } });

console.log("\nTelegram → assistente");
console.log("─────────────────────");
{
  const t = traduzirTelegram(msg({ text: "Uber 35" }));
  ver("texto: de = tg:<chat>, id = chat:msg, provedor telegram", t?.msg.de === "tg:123456" && t.msg.idMensagem === "123456:77" && t.msg.provedor === "telegram" && t.msg.texto === "Uber 35" && t.msg.tipo === "texto");
  ver("o nome de quem escreveu vem junto", t?.nome === "Ana Paula");
}
{
  const t = traduzirTelegram(msg({ text: "/start abcDEF123_-xyz" }));
  ver("/start <código> = código do vínculo, texto vazio", t?.codigoInicio === "abcDEF123_-xyz" && t.msg.texto === "");
}
ver("/start sozinho = oi (ajuda)", traduzirTelegram(msg({ text: "/start" }))?.msg.texto === "oi");
ver("/resumo vira resumo", traduzirTelegram(msg({ text: "/resumo" }))?.msg.texto === "resumo");
ver("/quem_me_deve vira quem me deve", traduzirTelegram(msg({ text: "/quem_me_deve@NovareCashBot" }))?.msg.texto === "quem me deve");
ver("/contas vira contas a pagar", traduzirTelegram(msg({ text: "/contas" }))?.msg.texto === "contas a pagar");
{
  const t = traduzirTelegram(msg({ voice: { file_id: "VOZ1", mime_type: "audio/ogg" } }));
  ver("áudio: tipo audio, mídia tg:<file_id>", t?.msg.tipo === "audio" && t.msg.midiaId === "tg:VOZ1");
}
{
  const t = traduzirTelegram(msg({ photo: [{ file_id: "P" }, { file_id: "G" }], caption: "almoço" }));
  ver("foto: a MAIOR resolução, legenda como texto", t?.msg.tipo === "imagem" && t.msg.midiaId === "tg:G" && t.msg.texto === "almoço");
}
ver("foto mandada como arquivo continua foto", traduzirTelegram(msg({ document: { file_id: "D", mime_type: "image/png" } }))?.msg.tipo === "imagem");
ver("PDF é documento (o assistente recusa com educação)", traduzirTelegram(msg({ document: { file_id: "D", mime_type: "application/pdf" } }))?.msg.tipo === "documento");
ver("grupo NÃO passa", traduzirTelegram(msg({ text: "Uber 35", chat: { id: -100, type: "group" } })) === null);
ver("outro robô NÃO passa", traduzirTelegram(msg({ text: "oi", from: { is_bot: true } })) === null);
ver("update sem mensagem (edição etc.) NÃO passa", traduzirTelegram({ update_id: 1, edited_message: {} }) === null);

console.log("");
if (falhas) {
  console.log(`${falhas} falha(s) no Telegram.`);
  process.exit(1);
}
console.log("o Telegram chega ao assistente do jeito certo.");

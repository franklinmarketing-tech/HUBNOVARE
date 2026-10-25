// Roda DENTRO da página (testar-guias.ts lê este arquivo e passa como texto — o tsx injetaria
// auxiliares que não existem no navegador). Percorre o tour inteiro e devolve o que achou.
(async () => {
  const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const problemas = [];
  const titulos = [];
  const dicas = document.querySelectorAll('button[aria-label^="O que é:"]').length;
  window.dispatchEvent(new Event("novare:tour"));
  for (let k = 0; k < 8; k++) {
    await espera(900);
    const d = document.querySelector('[aria-label^="Tour:"]');
    if (!d) {
      if (!k) problemas.push("tour não abriu");
      break;
    }
    const c = d.getBoundingClientRect();
    const titulo = d.querySelector(".font-display")?.textContent ?? "";
    titulos.push(titulo);
    if (c.top < 0 || c.bottom > innerHeight + 1 || c.left < 0 || c.right > innerWidth + 1) problemas.push(`passo ${k + 1} fora da tela`);
    if (/R\$|\d{3}/.test(titulo)) problemas.push(`título com valor: "${titulo}"`);
    const anel = [...document.querySelectorAll("[aria-hidden]")].find((e) => e.style.boxShadow.includes("9999px"));
    if (anel) {
      const a = anel.getBoundingClientRect();
      if (a.bottom < 0 || a.top > innerHeight) problemas.push(`passo ${k + 1} recorte fora da tela`);
      const cobre =
        Math.max(0, Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top)) * Math.max(0, Math.min(a.right, c.right) - Math.max(a.left, c.left));
      if (cobre > a.width * a.height * 0.35) problemas.push(`passo ${k + 1} cartão cobre o campo`);
    }
    const prox = [...d.querySelectorAll("button")].find((x) => x.textContent?.includes("Próximo"));
    if (!prox) {
      [...d.querySelectorAll("button")].find((x) => x.textContent?.includes("Concluir"))?.click();
      break;
    }
    prox.click();
  }
  await espera(400);
  if (document.querySelector('[aria-label^="Tour:"]')) problemas.push("Concluir não fechou");
  const larg = document.documentElement.scrollWidth;
  if (larg > innerWidth) problemas.push(`rolagem lateral ${larg}`);
  return { problemas, titulos, dicas };
})()

import { chromium } from "playwright";

/** Captura um portal da home com o painel de aplicativos aberto. */
const nav = await chromium.launch();
const p = await nav.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});

await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await p.waitForTimeout(700);

const portal = p.locator(".card-cine").filter({ hasText: "ORGANIZA" }).first();
await portal.hover();
await p.waitForTimeout(600);

await p.screenshot({
  path: "C:/tmp/novare-shots/painel-hover.png",
  clip: { x: 200, y: 320, width: 1120, height: 580 },
});

console.log("painel capturado");
await nav.close();

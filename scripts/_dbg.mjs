import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage();
p.on("response", r => { if (r.status() >= 400) console.log("HTTP", r.status(), r.url().slice(0,120)); });
for (let i = 0; i < 3; i++) {
  await p.goto("http://localhost:3100/fincash/testar", { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(15000);
  console.log(i, "URL:", p.url(), "| TEXT:", (await p.innerText("body")).slice(0,200).replace(/\n/g," "));
  if (p.url().includes("/fincash/app")) break;
}
await b.close();

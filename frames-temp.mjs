import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const arquivo = pathToFileURL(
  resolve("C:/Users/frank/OneDrive/Desktop/NOVARE-WS/hub/public/demo/app-em-uso.webm"),
).href;

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });

await p.setContent(
  `<body style="margin:0;background:#000">
     <video id="v" src="${arquivo}" width="1280" height="720" muted></video>
   </body>`,
);

const dur = await p.evaluate(
  () =>
    new Promise((r) => {
      const v = document.getElementById("v");
      if (v.readyState >= 1) return r(v.duration);
      v.onloadedmetadata = () => r(v.duration);
      v.onerror = () => r(-1);
    }),
);

console.log("duração:", dur < 0 ? "ERRO ao carregar" : dur.toFixed(1) + "s");
if (dur < 0) process.exit(1);

for (const t of [4, 10, 17, 24]) {
  if (t > dur) continue;
  await p.evaluate(
    (tt) =>
      new Promise((r) => {
        const v = document.getElementById("v");
        v.onseeked = () => r();
        v.currentTime = tt;
      }),
    t,
  );
  await p.waitForTimeout(400);
  await p.screenshot({ path: `/tmp/comp/frame-${t}.png` });
  console.log("quadro", t + "s");
}

await b.close();

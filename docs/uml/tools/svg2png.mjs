// Chuyển SVG (xuất từ StarUML) sang PNG độ phân giải cao
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const dir = process.argv[2];
const scale = Number(process.argv[3] || 2);
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", args: ["--no-sandbox"] });
const page = await browser.newPage();
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".svg"))) {
  const svg = fs.readFileSync(path.join(dir, f), "utf8");
  const w = Math.ceil(Number((svg.match(/<svg[^>]*\swidth="([\d.]+)/) || [])[1] || 1000));
  const h = Math.ceil(Number((svg.match(/<svg[^>]*\sheight="([\d.]+)/) || [])[1] || 800));
  await page.setViewport({ width: w, height: h, deviceScaleFactor: scale });
  await page.setContent(`<html><body style="margin:0;background:#fff">${svg}</body></html>`, { waitUntil: "load" });
  await page.screenshot({ path: path.join(dir, f.replace(/\.svg$/, ".png")), clip: { x: 0, y: 0, width: w, height: h }, omitBackground: false });
  console.log("png", f, w, h);
}
await browser.close();

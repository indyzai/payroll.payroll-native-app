// Deterministic vector sources and PNG exports. Run: bun run icons
import sharp from "sharp";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../assets/brand",
);
await mkdir(root, { recursive: true });
const svg = (size: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${body}</svg>`;
const mark = `<path d="M512 216 808 512 512 808 216 512Z" fill="#F7F8F2"/><path d="m512 308 204 204-204 204-204-204Z" fill="#173E34"/><path d="m407 515 74 74 143-154" fill="none" stroke="#E4BB69" stroke-width="48" stroke-linecap="round" stroke-linejoin="round"/>`;
async function asset(name: string, source: string, size = 1024) {
  await writeFile(resolve(root, `${name}.svg`), source);
  await sharp(Buffer.from(source))
    .resize(size, size)
    .png()
    .toFile(resolve(root, `${name}.png`));
}
await asset(
  "icon",
  svg(1024, `<path fill="#173E34" d="M0 0h1024v1024H0z"/>${mark}`),
);
// Foreground fits Android's central safe zone; the OS supplies the mask.
await asset(
  "adaptive-foreground",
  svg(1024, `<g transform="translate(128 128) scale(.75)">${mark}</g>`),
);
await asset(
  "monochrome",
  svg(
    1024,
    '<path d="m512 290 222 222-222 222-222-222Z" fill="none" stroke="#000" stroke-width="42"/><path d="m433 514 55 55 108-116" fill="none" stroke="#000" stroke-width="36" stroke-linecap="round" stroke-linejoin="round"/>',
  ),
);
await asset("splash", svg(1024, mark));
await asset(
  "favicon",
  svg(
    1024,
    `<rect width="1024" height="1024" rx="200" fill="#173E34"/>${mark}`,
  ),
  64,
);
const paths: Record<string, string> = {
  home: '<path d="m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9"/>',
  payroll: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z M9 7h6M9 11h6M9 15h3"/>',
  requests:
    '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="m8 12 3 3 5-6"/>',
  people:
    '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 4v2"/>',
  account:
    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="9" r="3"/><path d="M5.5 18a7 7 0 0 1 13 0"/>',
};
for (const [name, body] of Object.entries(paths)) {
  await asset(
    name,
    svg(
      24,
      `<g fill="none" stroke="#000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</g>`,
    ),
    96,
  );
}
console.log(
  "Generated indyzpay launcher, adaptive, monochrome, splash, favicon, and navigation icons.",
);

// Platform copies are the inputs consumed by Expo native builds.
for (const [platform, names] of Object.entries({
  ios: ["icon", "splash"],
  android: ["icon", "adaptive-foreground", "monochrome", "splash"],
})) {
  const destination = resolve(root, "../icons", platform);
  await mkdir(destination, { recursive: true });
  for (const name of names) {
    await copyFile(resolve(root, `${name}.png`), resolve(destination, `${name}.png`));
  }
}

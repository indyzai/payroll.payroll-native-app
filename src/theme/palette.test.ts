import { expect, test } from "bun:test";
import { authColors, darkPalette, lightPalette } from "./palette";
function luminance(hex: string) {
  const channels = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function contrast(a: string, b: string) {
  const values = [luminance(a), luminance(b)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
for (const [name, palette] of Object.entries({
  light: lightPalette,
  dark: darkPalette,
})) {
  test(`${name} auth and payroll use the same readable text and surface colors`, () => {
    const auth = authColors(palette);
    expect(auth.background).toBe(palette.bg);
    expect(auth.primary).toBe(palette.green);
    expect(auth.text).toBe(palette.ink);
    for (const [foreground, background] of [
      [palette.ink, palette.bg],
      [palette.muted, palette.bg],
      [palette.green, palette.surface],
      [palette.onPrimary, palette.green],
      [palette.error, palette.errorSoft],
    ])
      expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });
}

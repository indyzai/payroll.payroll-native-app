export const lightPalette = {
  bg: "#F7F8F2",
  ink: "#173E34",
  green: "#18664F",
  muted: "#637269",
  line: "#E2E7DD",
  pale: "#EAF0E5",
  gold: "#E4BB69",
  surface: "#FFFFFF",
  hero: "#173E34",
  onPrimary: "#FFFFFF",
  error: "#9C3030",
  errorSoft: "#FBE9E5",
};
export type PayrollPalette = { [K in keyof typeof lightPalette]: string };
export const darkPalette: PayrollPalette = {
  bg: "#101C17",
  ink: "#E8F0E9",
  green: "#91D5B2",
  muted: "#ABBCAF",
  line: "#35483B",
  pale: "#253B30",
  gold: "#E4BB69",
  surface: "#192A21",
  hero: "#173E34",
  onPrimary: "#10271B",
  error: "#FFB4AB",
  errorSoft: "#462421",
};
export function authColors(colors: PayrollPalette) {
  return {
    background: colors.bg,
    surface: colors.surface,
    surfaceMuted: colors.pale,
    primary: colors.green,
    primarySoft: colors.pale,
    text: colors.ink,
    textSecondary: colors.muted,
    outline: colors.line,
    outlineMuted: colors.line,
    error: colors.error,
    errorSoft: colors.errorSoft,
  };
}

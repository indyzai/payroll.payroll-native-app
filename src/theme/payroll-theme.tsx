import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authColors, darkPalette, lightPalette } from "./palette";
type ThemeMode = "light" | "dark";
function useThemeValue() {
  const [mode, setMode] = useState<ThemeMode>("light");
  return useMemo(() => {
    const colors = mode === "dark" ? darkPalette : lightPalette;
    return {
      mode,
      setMode,
      isDark: mode === "dark",
      colors,
      themeColors: authColors(colors),
    };
  }, [mode]);
}
const Context = createContext<ReturnType<typeof useThemeValue> | null>(null);
export function PayrollThemeProvider({ children }: { children: ReactNode }) {
  return (
    <Context.Provider value={useThemeValue()}>{children}</Context.Provider>
  );
}
export function usePayrollTheme() {
  const value = useContext(Context);
  if (!value) throw Error("PayrollThemeProvider is required.");
  return value;
}

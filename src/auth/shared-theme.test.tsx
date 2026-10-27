import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  AuthUiProvider,
  configureAuthUi,
  getAuthUi,
  useAuthUi,
  type AuthUiConfiguration,
} from "@indyzai/pos-auth/theme";
function configuration(
  brandName: string,
  primary: string,
): AuthUiConfiguration {
  return {
    brandName,
    useTheme: () => ({
      isDark: false,
      mode: "light",
      setMode: () => {},
      themeColors: { primary },
    }),
    showSnackbar: () => {},
    Logo: () => null,
    loginTitle: brandName,
    loginSubtitle: "",
    signupTitle: "",
    signupSubtitle: "",
  };
}
function Probe() {
  const ui = useAuthUi();
  return (
    <span>
      {ui.brandName}:{ui.useTheme().themeColors.primary}
    </span>
  );
}
test("payroll theme providers remain isolated from legacy shared consumers and nested surfaces", () => {
  const legacy = configuration("POS", "#4052C2");
  configureAuthUi(legacy);
  const payroll = configuration("IndyzPay", "#18664F");
  const dark = configuration("IndyzPay dark", "#91D5B2");
  const rendered = renderToStaticMarkup(
    <div>
      <AuthUiProvider configuration={payroll}>
        <div>
          <Probe />
          <AuthUiProvider configuration={dark}>
            <Probe />
          </AuthUiProvider>
          <Probe />
        </div>
      </AuthUiProvider>
      <Probe />
    </div>,
  );
  expect(rendered).toBe(
    "<div><div><span>IndyzPay:#18664F</span><span>IndyzPay dark:#91D5B2</span><span>IndyzPay:#18664F</span></div><span>POS:#4052C2</span></div>",
  );
  expect(getAuthUi()).toBe(legacy);
});

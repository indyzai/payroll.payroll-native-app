import { router } from "expo-router";
import { SignupScreen } from "@indyzai/pos-auth/ui";
import { PayrollAuthSurface } from "@/auth/payroll-auth";
import { usePayrollSession } from "@/auth/session";
export default function Signup() {
  const { signUp } = usePayrollSession();
  return (
    <PayrollAuthSurface>
      <SignupScreen
        onSignUp={signUp}
        onLogin={() => router.replace("/login")}
      />
    </PayrollAuthSurface>
  );
}

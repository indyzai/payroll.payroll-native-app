import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";
import {
  signInWithSocial,
  completeSocialSignIn,
  cancelSocialSignIn,
  type SocialProvider,
} from "./social";
import { identity } from "./identity";
import { loginWithDemo, type PayrollSession } from "./demo-accounts";
import type { RegistrationPayload } from "@indyzai/pos-auth/types";
type SessionContext = {
  session: PayrollSession | null;
  busy: boolean;
  initializing: boolean;
  error: string;
  retry: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signInSocial: (provider: SocialProvider) => Promise<void>;
  completeSocial: (code: string, state: string) => Promise<void>;
  selectOrganization: (id: string) => void;
  signUp: (payload: RegistrationPayload) => Promise<void>;
  signOut: () => Promise<void>;
};
const Context = createContext<SessionContext | null>(null);
export function PayrollSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PayrollSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState("");
  const locked = useRef(false);
  const alive = useRef(true);
  const pendingSignOut = useRef(false);
  const demoActive = useRef(false);
  const restore = useCallback(async () => {
    if (locked.current || demoActive.current) return;
    locked.current = true;
    try {
      const next = await identity.restore();
      if (alive.current) {
        setSession(next);
        setError("");
      }
    } catch (e) {
      if (alive.current) {
        setSession(identity.getSession());
        setError(
          e instanceof Error ? e.message : "Could not restore your session.",
        );
      }
    } finally {
      locked.current = false;
      if (alive.current) setInitializing(false);
    }
  }, []);
  useEffect(() => {
    alive.current = true;
    void Promise.resolve().then(() => {
      if (alive.current) return restore();
    });
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && identity.getSession()) void restore();
    });
    const interval = setInterval(
      () => {
        if (AppState.currentState === "active" && identity.getSession())
          void restore();
      },
      10 * 60 * 1000,
    );
    return () => {
      alive.current = false;
      subscription.remove();
      clearInterval(interval);
    };
  }, [restore]);
  async function authenticate(work: () => Promise<PayrollSession | null>) {
    if (locked.current)
      throw Error("Please wait for the identity request to finish.");
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      const next = await work();
      if (alive.current && next) {
        demoActive.current = next.kind === "demo";
        setSession(next);
      }
    } finally {
      locked.current = false;
      if (alive.current) setBusy(false);
    }
  }
  async function signOut() {
    if (demoActive.current) {
      demoActive.current = false;
      setSession(null);
      setError("");
      return;
    }
    pendingSignOut.current = true;
    setSession(null);
    setError("");
    try {
      await cancelSocialSignIn();
      const revoked = await identity.logout();
      pendingSignOut.current = false;
      if (!revoked)
        setError(
          "Signed out on this device. The identity service could not be reached to revoke the session.",
        );
    } catch {
      setError(
        "Could not clear secure session storage. Retry sign-out before closing the app.",
      );
    }
  }
  return (
    <Context.Provider
      value={{
        session,
        busy,
        initializing,
        error,
        retry: () => {
          if (pendingSignOut.current) {
            void signOut();
            return;
          }
          if (!locked.current && !demoActive.current) {
            setInitializing(true);
            void restore();
          }
        },
        signIn: (email, password) =>
          authenticate(() =>
            loginWithDemo(email, password, (identifier, secret) =>
              identity.login(identifier, secret),
            ),
          ),
        signInSocial: (provider) =>
          authenticate(() => signInWithSocial(provider)),
        completeSocial: (code, state) =>
          authenticate(() => completeSocialSignIn(code, state)),
        selectOrganization: (id) => {
          if (session?.kind === "demo") {
            const tenant = session.user.tenants.find((item) => item.id === id);
            if (!tenant) throw Error("That demo organization is unavailable.");
            setSession({ ...session, tenant });
          } else setSession(identity.selectOrganization(id));
        },
        signUp: (payload) => authenticate(() => identity.register(payload)),
        signOut,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function usePayrollSession() {
  const value = useContext(Context);
  if (!value) throw Error("PayrollSessionProvider is required.");
  return value;
}

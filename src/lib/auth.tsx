import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { recordLoginHistory, syncProfileToSupabase, flushSyncQueue } from "@/lib/sync";

export type Role = "client" | "lawyer" | "admin";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  token: string;
  phone?: string;
};

const STORAGE_KEY = "legalconsultancy.session";

/**
 * Offline demo accounts (no database, unsigned tokens) are only available when Supabase is NOT configured
 * AND we are running the dev server (or VITE_ALLOW_DEMO_AUTH=true was set on purpose at build time).
 * A production build with a configured Supabase project never falls back to demo sessions.
 */
const DEMO_AUTH_ALLOWED =
  !isSupabaseConfigured &&
  (Boolean(import.meta.env.DEV) || import.meta.env["VITE_ALLOW_DEMO_AUTH"] === "true");

const NOT_CONFIGURED_MESSAGE =
  "Sign-in is unavailable because the authentication service is not configured. Please contact support.";

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  signIn: (input: { name?: string; email: string; role: Role; password?: string; phone?: string }) => Promise<AuthUser>;
  signUp: (input: { name: string; email: string; role: Role; password?: string; phone?: string }) => Promise<AuthUser>;
  signInWithGoogle: (role: Role, customEmail?: string) => Promise<AuthUser | void>;
  signOut: () => Promise<void> | void;
  isSupabaseConnected: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Demo-only token: a JWT-shaped, unsigned payload used to simulate session state (offline demo mode only). */
function makeToken(payload: Record<string, unknown>) {
  const enc = (o: unknown) => btoa(JSON.stringify(o)).replace(/=+$/, "");
  return `${enc({ alg: "none", typ: "JWT" })}.${enc({ ...payload, iat: Date.now() })}.demo`;
}

/**
 * The account role comes from the `profiles` table, which only the platform can change.
 * It is NEVER taken from user_metadata (the browser can edit that) — least privilege on any failure.
 */
async function fetchDbRole(userId: string): Promise<Role> {
  try {
    const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
    const role = (data as { role?: unknown } | null)?.role;
    if (!error && (role === "client" || role === "lawyer" || role === "admin")) return role;
  } catch (err) {
    console.warn("Could not load account role:", err);
  }
  return "client";
}

async function toAuthUser(u: User, accessToken: string, nameOverride?: string, phone?: string): Promise<AuthUser> {
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    nameOverride?.trim() ||
    (meta["name"] as string | undefined) ||
    (meta["full_name"] as string | undefined) ||
    u.email?.split("@")[0] ||
    "User";
  const role = await fetchDbRole(u.id);
  return {
    id: u.id,
    name,
    email: u.email || "",
    role,
    token: accessToken,
    ...(phone ? { phone } : {}),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  // Initialize session from Supabase (or, in offline demo mode only, from localStorage)
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (isSupabaseConfigured) {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user) {
            const authUser = await toAuthUser(session.user, session.access_token);
            if (mounted) {
              setUser(authUser);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
            }
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        } catch (err) {
          console.warn("Supabase auth init warning:", err);
        }
        if (mounted) setReady(true);
        return;
      }

      if (mounted) {
        if (DEMO_AUTH_ALLOWED) {
          try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) setUser(JSON.parse(raw) as AuthUser);
          } catch {
            /* ignore */
          }
        }
        setReady(true);
      }
    }

    void initAuth();
    // Flush any pending sync queue from previous sessions
    void flushSyncQueue();

    if (isSupabaseConfigured) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (!mounted) return;
        if (session?.user) {
          const sessionUser = session.user;
          const token = session.access_token;
          // Defer: calling Supabase inside this callback can deadlock the auth lock.
          setTimeout(() => {
            void toAuthUser(sessionUser, token).then((authUser) => {
              if (!mounted) return;
              setUser(authUser);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
            });
          }, 0);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          localStorage.removeItem(STORAGE_KEY);
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = useCallback<AuthContextValue["signIn"]>(async ({ name, email, role, password }) => {
    if (isSupabaseConfigured) {
      if (!password) throw new Error("Password is required.");
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user || !data.session) {
        throw new Error(
          error?.message?.includes("Invalid login credentials")
            ? "Invalid email or password. Please check your credentials."
            : error?.message || "Sign-in failed. Please try again."
        );
      }
      const next = await toAuthUser(data.user, data.session.access_token, name);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setUser(next);
      // ── Real-time sync ──
      recordLoginHistory({ userId: next.id, userEmail: next.email, userName: next.name, role: next.role, provider: "email" });
      void syncProfileToSupabase({ id: next.id, name: next.name, email: next.email, role: next.role });
      return next;
    }

    if (!DEMO_AUTH_ALLOWED) throw new Error(NOT_CONFIGURED_MESSAGE);

    // ── Offline demo mode (development only) ──
    const next: AuthUser = {
      id: `${role}-${Math.random().toString(36).slice(2, 8)}`,
      name: name?.trim() || email.split("@")[0]!.replace(/[._]/g, " ") || "Guest",
      email,
      role,
      token: makeToken({ sub: email, role }),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setUser(next);
    recordLoginHistory({ userId: next.id, userEmail: next.email, userName: next.name, role: next.role, provider: "demo" });
    void syncProfileToSupabase({ id: next.id, name: next.name, email: next.email, role: next.role });
    return next;
  }, []);

  const signUp = useCallback<AuthContextValue["signUp"]>(
    async ({ name, email, role, password, phone }) => {
      if (isSupabaseConfigured) {
        if (!password) throw new Error("Password is required.");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              role,
              phone: phone || "",
            },
          },
        });

        if (error) throw new Error(error.message);
        if (!data.user) throw new Error("Could not create the account. Please try again.");
        if (!data.session) {
          throw new Error(
            "Account created. Please confirm your email address using the message we sent, then sign in."
          );
        }

        const next = await toAuthUser(data.user, data.session.access_token, name, phone);

        // Defense in depth: the database decides the role. Admin accounts are invitation-only.
        if (role === "admin" && next.role !== "admin") {
          await supabase.auth.signOut();
          throw new Error(
            "Administrator accounts are created by invitation only. Your account was not granted admin access."
          );
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setUser(next);
        recordLoginHistory({ userId: next.id, userEmail: next.email, userName: next.name, role: next.role, provider: "email" });
        void syncProfileToSupabase({
          id: next.id,
          name: next.name,
          email: next.email,
          role: next.role,
          ...(phone ? { phone } : {}),
        });
        return next;
      }

      if (!DEMO_AUTH_ALLOWED) throw new Error(NOT_CONFIGURED_MESSAGE);
      return signIn({ name, email, role, ...(password ? { password } : {}), ...(phone ? { phone } : {}) });
    },
    [signIn]
  );

  const signInWithGoogle = useCallback(async (role: Role, customEmail?: string) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) throw new Error(error.message || "Google sign-in failed. Please try again.");
      return; // browser is redirected to Google
    }

    if (!DEMO_AUTH_ALLOWED) throw new Error(NOT_CONFIGURED_MESSAGE);

    // ── Offline demo mode (development only) ──
    const googleEmail = customEmail || `client.google.${Math.floor(1000 + Math.random() * 9000)}@gmail.com`;
    const googleName = customEmail ? customEmail.split("@")[0] || "Google User" : "Google User";

    const next: AuthUser = {
      id: `google-${Math.random().toString(36).slice(2, 8)}`,
      name: googleName,
      email: googleEmail,
      role,
      token: makeToken({ sub: googleEmail, role, provider: "google" }),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setUser(next);
    recordLoginHistory({ userId: next.id, userEmail: next.email, userName: next.name, role: next.role, provider: "google" });
    void syncProfileToSupabase({ id: next.id, name: next.name, email: next.email, role: next.role });
    return next;
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn("Supabase signOut error:", err);
      }
    }
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, signIn, signUp, signInWithGoogle, signOut, isSupabaseConnected: isSupabaseConfigured }),
    [user, ready, signIn, signUp, signInWithGoogle, signOut]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export const ROLE_LABEL: Record<Role, string> = {
  client: "Client",
  lawyer: "Lawyer",
  admin: "Admin",
};

export const ROLE_HOME: Record<Role, string> = {
  client: "/client",
  lawyer: "/lawyer",
  admin: "/admin",
};

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { fetchIsAdmin, fetchMyRole, type AccountRole } from "@/lib/marketplace";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  displayName: string;
  role: AccountRole | null;
  roleLoading: boolean;
  isStudent: boolean;
  isOrganization: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AccountRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: sessionData }) => {
      setSession(sessionData.session);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      setRole(null);
      setIsAdmin(false);
      setRoleLoading(false);
      return;
    }
    let active = true;
    setRoleLoading(true);
    Promise.all([fetchMyRole(userId), fetchIsAdmin(userId)])
      .then(([value, admin]) => {
        if (active) {
          setRole(value);
          setIsAdmin(admin);
        }
      })
      .catch(() => {
        if (active) setRole(null);
      })
      .finally(() => {
        if (active) setRoleLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null;
    const metaName = (user?.user_metadata?.["display_name"] as string | undefined) ?? undefined;
    return {
      session,
      user,
      loading,
      displayName: metaName ?? user?.email?.split("@")[0] ?? "Member",
      role,
      roleLoading,
      isStudent: role === "student",
      isOrganization: role === "organization",
      isAdmin,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    };
  }, [session, loading, role, roleLoading, isAdmin]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

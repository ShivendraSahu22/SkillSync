import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  displayName: string;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null;
    const metaName = (user?.user_metadata?.["display_name"] as string | undefined) ?? undefined;
    return {
      session,
      user,
      loading,
      displayName: metaName ?? user?.email?.split("@")[0] ?? "Member",
      signOut: async () => {
        await supabase.auth.signOut();
      },
    };
  }, [session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

import { useEffect, useState, ComponentType, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";

const Chat2 = lazy(() => import("@/pages/Chat2"));

const AB_STORAGE_KEY = "orbit_ab_variant";
const AB_SPLIT = 0.5;

function getOrAssignVariant(): "lp" | "chat2" {
  const stored = sessionStorage.getItem(AB_STORAGE_KEY);
  if (stored === "lp" || stored === "chat2") return stored;
  const variant = Math.random() < AB_SPLIT ? "lp" : "chat2";
  sessionStorage.setItem(AB_STORAGE_KEY, variant);
  return variant;
}

interface ABRouterProps {
  LandingPage?: ComponentType;
}

const ABRouter = ({ LandingPage }: ABRouterProps) => {
  const [variant, setVariant] = useState<"lp" | "chat2" | null>(null);

  useEffect(() => {
    const checkAB = async () => {
      try {
        const { data } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "ab_testing_enabled")
          .single();
        if (data?.value === "true" && LandingPage) {
          setVariant(getOrAssignVariant());
        } else if (LandingPage) {
          setVariant("lp");
        } else {
          setVariant("chat2");
        }
      } catch {
        setVariant("chat2");
      }
    };
    checkAB();
  }, [LandingPage]);

  if (!variant) return null;
  if (variant === "chat2") return <Chat2 />;
  return LandingPage ? <LandingPage /> : <Chat2 />;
};

export default ABRouter;

import { ComponentType, lazy, Suspense, useMemo } from "react";

const Chat2 = lazy(() => import("@/pages/Chat2"));

type Variant = "lp" | "chat2";

/**
 * Resolves which variant to render, in order of priority:
 *   1. URL override — `?ab=lp` or `?ab=chat2`
 *   2. Default — LP (or Chat2 if no LandingPage is provided)
 *
 * Note: we deliberately do NOT query Supabase here. The previous version
 * consulted `app_settings.ab_testing_enabled` on every page load, which (a)
 * blocked render until Supabase responded (~700ms of blank screen on mobile)
 * and (b) coupled this fork's behaviour to the flag controlled from the
 * Lovable /admin panel. Keeping routing local makes LCP instant and isolates
 * this deployment from remote toggles.
 *
 * To restore Supabase-driven A/B, see docs/arquitetura-atual.md.
 */
function resolveVariant(hasLandingPage: boolean): Variant {
  try {
    const params = new URLSearchParams(window.location.search);
    const override = params.get("ab");
    if (override === "chat2") return "chat2";
    if (override === "lp" && hasLandingPage) return "lp";
  } catch {
    // window.location.search inacessível (SSR, etc.) — segue pro default
  }
  return hasLandingPage ? "lp" : "chat2";
}

interface ABRouterProps {
  LandingPage?: ComponentType;
}

const ABRouter = ({ LandingPage }: ABRouterProps) => {
  const variant = useMemo(() => resolveVariant(Boolean(LandingPage)), [LandingPage]);

  if (variant === "chat2") {
    return (
      <Suspense fallback={null}>
        <Chat2 />
      </Suspense>
    );
  }

  return LandingPage ? <LandingPage /> : null;
};

export default ABRouter;

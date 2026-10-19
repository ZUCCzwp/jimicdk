import { useEffect, useState } from "react";
import {
  deferOnboardingThisSession,
  getOnboardingStatus,
  isOnboardingDeferred,
  onOnboardingChange,
  setOnboardingStatus,
  type OnboardingStatus,
} from "@/lib/storage";

export function useOnboarding() {
  const [status, setStatus] = useState<OnboardingStatus | null>(() => getOnboardingStatus());
  const [deferred, setDeferred] = useState(() => isOnboardingDeferred());

  useEffect(
    () =>
      onOnboardingChange(() => {
        setStatus(getOnboardingStatus());
        setDeferred(isOnboardingDeferred());
      }),
    [],
  );

  return {
    status,
    deferred,
    isNewbie: status === "newbie",
    answered: status !== null,
    readyForNotices: status !== null || deferred,
    markNewbie: () => setOnboardingStatus("newbie"),
    markExperienced: () => setOnboardingStatus("experienced"),
    deferThisSession: () => deferOnboardingThisSession(),
  };
}

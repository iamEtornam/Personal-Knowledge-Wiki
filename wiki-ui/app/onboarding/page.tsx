import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { getSiteName } from "@/lib/config";
import type { Metadata } from "next";

export function generateMetadata(): Metadata {
  const siteName = getSiteName();
  return {
    title: `Setup — ${siteName}`,
    description: `Connect your data sources and build ${siteName}`,
  };
}

export default function OnboardingPage() {
  return <OnboardingWizard />;
}

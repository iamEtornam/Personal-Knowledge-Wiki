import type { Metadata } from "next";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

export const metadata: Metadata = {
  title: "Setup | Personal Wiki",
  description: "Connect your data sources and build your personal knowledge base",
};

export default function OnboardingPage() {
  return <OnboardingWizard />;
}

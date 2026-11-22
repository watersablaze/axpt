export type RepresentativeOnboardingEmailMode =
  | "send"
  | "log";

export function getRepresentativeOnboardingEmailMode():
  RepresentativeOnboardingEmailMode {
  return process.env.REPRESENTATIVE_ONBOARDING_EMAIL_MODE === "send"
    ? "send"
    : "log";
}

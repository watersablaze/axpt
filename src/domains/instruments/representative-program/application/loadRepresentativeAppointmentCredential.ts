import { loadRepresentativeAppointmentReview } from "./representativeAppointmentAcceptance";

export async function loadRepresentativeAppointmentCredential(
  params: Parameters<typeof loadRepresentativeAppointmentReview>[0],
) {
  const review = await loadRepresentativeAppointmentReview(params);
  if (!review) return null;

  const at = new Date();
  if (
    review.status !== "ACTIVE" ||
    review.standing !== "ACTIVE" ||
    !review.acceptedAt ||
    !review.effectiveAt ||
    !Number.isFinite(review.effectiveAt.getTime()) ||
    review.effectiveAt.getTime() > at.getTime() ||
    review.endedAt !== null ||
    (review.expiresAt !== null &&
      new Date(review.expiresAt).getTime() <= at.getTime())
  ) return null;

  return {
    displayName: review.displayName,
    reference: review.instrumentReference,
    version: review.instrumentVersion,
    appointmentClass: review.appointmentClass,
    appointmentForm: review.appointmentForm,
    effectiveAt: review.effectiveAt,
    expiresAt: review.expiresAt,
    generatedAt: at,
  };
}

export type RepresentativeAppointmentCredential =
  NonNullable<Awaited<ReturnType<typeof loadRepresentativeAppointmentCredential>>> & {
    authorities?: import("./appointmentCertificateAuthorities").CertificateAuthority[];
  };

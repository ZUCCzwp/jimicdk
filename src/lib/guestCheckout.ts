const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type GuestCheckoutFields = {
  email: string;
  claim: string;
};

export type GuestCheckoutError = "needEmail" | "invalidEmail" | "needClaim" | "claimFormat";

export function normalizeClaim(raw: string): string {
  return raw.trim();
}

export function validateGuestCheckout(fields: GuestCheckoutFields): GuestCheckoutError | null {
  const email = fields.email.trim();
  const claim = normalizeClaim(fields.claim);
  if (!email) return "needEmail";
  if (!emailRe.test(email)) return "invalidEmail";
  if (!claim) return "needClaim";
  if (claim.length < 4 || claim.length > 32 || /\s/.test(claim) || !/^[\x21-\x7E]+$/.test(claim)) {
    return "claimFormat";
  }
  return null;
}

export function guestCheckoutErrorKey(
  code: GuestCheckoutError,
): "shop.needGuestEmail" | "shop.needGuestClaim" | "shop.claimInvalid" | "shop.invalidEmail" {
  switch (code) {
    case "needEmail":
      return "shop.needGuestEmail";
    case "invalidEmail":
      return "shop.invalidEmail";
    case "needClaim":
      return "shop.needGuestClaim";
    case "claimFormat":
      return "shop.claimInvalid";
  }
}

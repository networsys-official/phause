export type CreateOrganizationInput = {
  fullName: string;
  organizationName: string;
  email: string;
  password: string;
  region: string;
  termsAccepted: boolean;
};

async function parseResponse(response: Response, fallback: string) {
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      result?.message || result?.error || fallback;

    throw new Error(
      Array.isArray(message) ? message.join(" ") : message
    );
  }

  return result;
}

export async function createOrganization(
  input: CreateOrganizationInput
) {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseResponse(
    response,
    "We couldn't create your organization. Please try again."
  );
}

export async function verifyEmail(email: string, otp: string) {
  const response = await fetch("/api/auth/verify-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, otp }),
  });

  return parseResponse(
    response,
    "Invalid verification code. Please try again."
  );
}

export async function resendVerificationCode(email: string) {
  const response = await fetch("/api/auth/verify-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      result?.message ||
      result?.error ||
      "Unable to resend verification code.";

    throw new Error(
      Array.isArray(message) ? message.join(" ") : message
    );
  }

  return result;
}



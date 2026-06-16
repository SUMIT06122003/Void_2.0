export function formatIndianPhoneNumber(value) {
  const digits = value.replace(/\D/g, "");
  const withoutCountryCode = digits.startsWith("91") && digits.length === 12 ? digits.slice(2) : digits;

  if (withoutCountryCode.length !== 10) {
    return "";
  }

  return `+91${withoutCountryCode}`;
}

export function getOtpErrorMessage(error) {
  return error?.message || "OTP request failed. Please try again.";
}

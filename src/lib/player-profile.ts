import { parseFlexibleDateInput } from "@/lib/date-utils";

export function buildPlayerFullName(firstName?: string | null, lastName?: string | null) {
  return [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ").trim();
}

export function splitPlayerName(fullName: string) {
  const trimmed = fullName.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return { firstName: "", lastName: "" };
  }

  const [firstName, ...rest] = trimmed.split(" ");
  return {
    firstName,
    lastName: rest.join(" "),
  };
}

export function calculateAgeFromDate(dateOfBirth?: string | Date | null, now = new Date()) {
  if (!dateOfBirth) return null;

  const birthDate = typeof dateOfBirth === "string" ? parseFlexibleDateInput(dateOfBirth) : dateOfBirth;
  if (Number.isNaN(birthDate.getTime())) return null;

  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  const hasBirthdayPassed =
    monthDiff > 0 || (monthDiff === 0 && now.getDate() >= birthDate.getDate());

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

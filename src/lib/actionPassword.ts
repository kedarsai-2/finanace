const ACTION_PASSWORD_KEY = "bm.action.password.4digit";
const ACTION_PASSWORD_VERIFIED_UNTIL_KEY = "bm.action.password.verifiedUntil";
const ACTION_PASSWORD_TTL_MS = 10 * 60 * 1000; // 10 minutes

function isFourDigit(value: string) {
  return /^\d{4}$/.test(value);
}

export function verifyActionPassword(): boolean {
  if (typeof window === "undefined") return false;

  const now = Date.now();
  const verifiedUntilRaw = window.sessionStorage.getItem(ACTION_PASSWORD_VERIFIED_UNTIL_KEY);
  const verifiedUntil = verifiedUntilRaw ? Number(verifiedUntilRaw) : 0;
  if (Number.isFinite(verifiedUntil) && verifiedUntil > now) {
    return true;
  }

  let saved = window.localStorage.getItem(ACTION_PASSWORD_KEY) ?? "";
  if (!saved) {
    const first = window.prompt("Set 4-digit security password");
    if (!first) return false;
    if (!isFourDigit(first)) {
      window.alert("Password must be exactly 4 digits.");
      return false;
    }
    const confirm = window.prompt("Confirm 4-digit security password");
    if (confirm !== first) {
      window.alert("Password mismatch.");
      return false;
    }
    window.localStorage.setItem(ACTION_PASSWORD_KEY, first);
    saved = first;
  }

  const entered = window.prompt("Enter 4-digit password to continue");
  if (!entered) return false;
  if (!isFourDigit(entered)) {
    window.alert("Password must be exactly 4 digits.");
    return false;
  }
  if (entered !== saved) {
    window.alert("Invalid password.");
    return false;
  }
  window.sessionStorage.setItem(
    ACTION_PASSWORD_VERIFIED_UNTIL_KEY,
    String(Date.now() + ACTION_PASSWORD_TTL_MS),
  );
  return true;
}

export function changeActionPassword(): boolean {
  if (typeof window === "undefined") return false;

  const saved = window.localStorage.getItem(ACTION_PASSWORD_KEY) ?? "";
  if (!saved) {
    window.alert("No password is set yet. Perform any protected action to set it first.");
    return false;
  }

  const current = window.prompt("Enter current 4-digit password");
  if (!current) return false;
  if (!isFourDigit(current) || current !== saved) {
    window.alert("Current password is incorrect.");
    return false;
  }

  const next = window.prompt("Enter new 4-digit password");
  if (!next) return false;
  if (!isFourDigit(next)) {
    window.alert("New password must be exactly 4 digits.");
    return false;
  }

  const confirm = window.prompt("Confirm new 4-digit password");
  if (confirm !== next) {
    window.alert("Password mismatch.");
    return false;
  }

  window.localStorage.setItem(ACTION_PASSWORD_KEY, next);
  window.sessionStorage.removeItem(ACTION_PASSWORD_VERIFIED_UNTIL_KEY);
  window.alert("Security password changed successfully.");
  return true;
}

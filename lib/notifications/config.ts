export function isSmsEnabled(): boolean {
  return process.env.SMS_ENABLED === "true";
}

export function isEmailEnabled(): boolean {
  return process.env.EMAIL_NOTIFICATIONS_ENABLED !== "false";
}

export function isPushEnabled(): boolean {
  return process.env.PUSH_NOTIFICATIONS_ENABLED !== "false";
}

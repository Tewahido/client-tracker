/**
 * Ready-to-send text for inviting someone: who it's from, where to go, and which email to
 * sign in with (the invite only matches that address, so it has to be in the message).
 */
export function inviteMessage({ orgName, email, appUrl }: { orgName: string; email: string; appUrl: string }): string {
  return `I've added you to ${orgName} on Lendly so we can keep track of loans together. Sign in at ${appUrl} with ${email} and your invite will be waiting.`
}

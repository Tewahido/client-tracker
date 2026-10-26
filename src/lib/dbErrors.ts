/**
 * Plain-English versions of database errors people can actually hit. Anything else keeps
 * its original message.
 */
export function friendlyDbMessage(message: string): string {
  if (message.includes('organizations_name_plain')) {
    return "This organisation's name contains a web address, which isn't allowed any more. Rename it in Settings → Organisation first."
  }
  return message
}

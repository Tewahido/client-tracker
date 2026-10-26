/**
 * Organisation names the rule must refuse or accept. Shared by the form's unit tests and
 * the database tests, so src/lib/orgName.ts and public.is_plain_org_name stay in step.
 */
export const REFUSED_ORG_NAMES = [
  'Urgent: verify at https://evil.example',
  'Visit www.example.org now',
  'Pay at lendly-support.com today',
  'Claim it on secure-bank.co.za',
  '<b>Important</b>',
  // Short links, IP addresses and TLDs that aren't on any list.
  'Details at goo.gl/x',
  'Log in at 45.33.32.156/login',
  'Go to evil.de',
  // Underscores and non-ASCII letters next to the domain.
  'x_evil.com',
  'Zoëpay.com',
  'Банкevil.com',
  'pаypal.com', // Cyrillic а
  // Look-alike dots, full-width letters, IDN and punycode TLDs.
  'evil．com',
  'evil。com',
  'ｅｖｉｌ．ｃｏｍ',
  'evil.рф',
  'evil.xn--p1ai',
]

export const ACCEPTED_ORG_NAMES = [
  "St. Mary's Stokvel",
  'J.R. & Co.',
  'J.R.’s Fund',
  'St.\u00a0Mary’s', // pasted with a non-breaking space
  'Mom & Dad',
  'Fund 2.0',
  'Dlamini Family Fund 2026',
]

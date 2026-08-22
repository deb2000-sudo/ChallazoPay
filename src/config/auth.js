/**
 * Demo-only gate.
 *
 * These credentials ship inside the JavaScript bundle, so anyone who opens the
 * page can read them and any determined visitor can bypass the check entirely.
 * This exists to keep the admin console behind a deliberate step during a demo,
 * NOT to protect anything. Real access control needs a server that verifies a
 * password it never hands to the client.
 */
export const ADMIN_CREDENTIALS = {
  email: 'admin@nxtwave.co.in',
  password: '12345',
}

export const SESSION_STORAGE_KEY = 'hackpayment_admin_session'

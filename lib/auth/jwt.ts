import { SignJWT, jwtVerify } from 'jose'

const COOKIE_NAME = 'bank_session'

function getSecret() {
  const s = process.env.BANK_SESSION_SECRET
  if (!s) throw new Error('BANK_SESSION_SECRET not set')
  return new TextEncoder().encode(s)
}

export { COOKIE_NAME }

export interface BankSessionPayload {
  id: string
  email: string
  full_name: string
  role: 'agent' | 'supervisor' | 'admin'
}

export async function signBankJWT(payload: BankSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecret())
}

export async function verifyBankJWT(token: string): Promise<BankSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as BankSessionPayload
  } catch {
    return null
  }
}

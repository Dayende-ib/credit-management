import { cookies } from 'next/headers'
import { signBankJWT, verifyBankJWT, COOKIE_NAME, BankSessionPayload } from './jwt'

export type { BankSessionPayload }
export { verifyBankJWT, signBankJWT }

export async function setBankSession(payload: BankSessionPayload) {
  const token = await signBankJWT(payload)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  })
}

export async function getBankSession(): Promise<BankSessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyBankJWT(token)
}

export async function deleteBankSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

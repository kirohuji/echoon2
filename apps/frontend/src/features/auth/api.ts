import { authClient, clearBearerToken } from './client'

export async function signInWithEmailPassword(email: string, password: string) {
  return authClient.signIn.email({ email, password })
}

export async function signUpWithEmailPassword(email: string, password: string, name: string) {
  return authClient.signUp.email({ email, password, name })
}

export async function sendEmailOtp(email: string) {
  return authClient.emailOtp.sendVerificationOtp({
    email,
    type: 'sign-in',
  })
}

export async function signInWithEmailOtp(email: string, otp: string) {
  return authClient.signIn.emailOtp({
    email,
    otp,
  })
}

export async function sendPhoneOtp(phoneNumber: string) {
  return authClient.phoneNumber.sendOtp({ phoneNumber })
}

export async function verifyPhoneOtp(phoneNumber: string, code: string) {
  return authClient.phoneNumber.verify({
    phoneNumber,
    code,
    disableSession: false,
  })
}

export async function signInWithWechat() {
  return authClient.signIn.social({
    provider: 'wechat',
    callbackURL: window.location.href,
  })
}

export async function getAuthSession() {
  return authClient.getSession()
}

export async function signOutAuth() {
  await authClient.signOut()
  clearBearerToken()
}

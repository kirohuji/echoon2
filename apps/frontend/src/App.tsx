import { HashRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/providers/theme-provider'
import { AuthProvider } from '@/providers/auth-provider'
import { AuthRouteGate } from '@/providers/auth-route-guard'
import { RootLayout } from '@/layout/root-layout'
import { HomePage } from '@/features/question-bank/pages/home-page'
import { PracticePage } from '@/features/practice/pages/practice-page'
import { MockPage } from '@/features/mock-exam/pages/mock-page'
import { ProfilePage } from '@/features/profile/pages/profile-page'
import { MemberPage } from '@/features/membership/pages/member-page'
import { AccountPage } from '@/features/account/pages/account-page'
import { AdminUsersPage } from '@/features/admin/pages/admin-users-page'
import { LoginPage } from '@/features/auth/pages/login-page'
import { RegisterPage } from '@/features/auth/pages/register-page'

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <HashRouter>
          <AuthRouteGate>
            <RootLayout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/practice/:topicId" element={<PracticePage />} />
                <Route path="/mock" element={<MockPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/member" element={<MemberPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/auth/login" element={<LoginPage />} />
                <Route path="/auth/register" element={<RegisterPage />} />
              </Routes>
            </RootLayout>
          </AuthRouteGate>
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

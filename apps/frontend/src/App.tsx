import { HashRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/providers/theme-provider'
import { AuthProvider } from '@/providers/auth-provider'
import { AuthRouteGate } from '@/providers/auth-route-guard'
import { RootLayout } from '@/layout/root-layout'
import { AdminLayout } from '@/layout/admin-layout'
import { HomePage } from '@/features/question-bank/pages/home-page'
import { PracticePage } from '@/features/practice/pages/practice-page'
import { MockPage } from '@/features/mock-exam/pages/mock-page'
import { ProfilePage } from '@/features/profile/pages/profile-page'
import { MemberPage } from '@/features/membership/pages/member-page'
import { AccountPage } from '@/features/account/pages/account-page'
import { AdminUsersPage } from '@/features/admin/pages/admin-users-page'
import { AdminMembersPage } from '@/features/admin/pages/admin-members-page'
import { AdminBillingPage } from '@/features/admin/pages/admin-billing-page'
import { AdminNotificationsPage } from '@/features/admin/pages/admin-notifications-page'
import { NotificationListPage } from '@/features/notification/pages/notification-list-page'
import { NotificationDetailPage } from '@/features/notification/pages/notification-detail-page'
import { LoginPage } from '@/features/auth/pages/login-page'
import { RegisterPage } from '@/features/auth/pages/register-page'

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <HashRouter>
          <AuthRouteGate>
            <Routes>
              {/* 管理员后台 — 独立布局 */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="members" element={<AdminMembersPage />} />
                <Route path="billing" element={<AdminBillingPage />} />
                <Route path="notifications" element={<AdminNotificationsPage />} />
              </Route>

              {/* 用户端 — RootLayout */}
              <Route element={<RootLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/practice/:topicId" element={<PracticePage />} />
                <Route path="/mock" element={<MockPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/member" element={<MemberPage />} />
                <Route path="/notifications" element={<NotificationListPage />} />
                <Route path="/notifications/:id" element={<NotificationDetailPage />} />
              </Route>

              {/* 认证页 — 无外层布局 */}
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/register" element={<RegisterPage />} />
            </Routes>
          </AuthRouteGate>
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

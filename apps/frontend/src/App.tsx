import { HashRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/providers/theme-provider'
import { RootLayout } from '@/layout/root-layout'
import { HomePage } from '@/features/question-bank/pages/home-page'
import { PracticePage } from '@/features/practice/pages/practice-page'
import { MockPage } from '@/features/mock-exam/pages/mock-page'
import { ProfilePage } from '@/features/profile/pages/profile-page'
import { MemberPage } from '@/features/membership/pages/member-page'

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <HashRouter>
        <RootLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/practice/:topicId" element={<PracticePage />} />
            <Route path="/mock" element={<MockPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/member" element={<MemberPage />} />
          </Routes>
        </RootLayout>
      </HashRouter>
    </ThemeProvider>
  )
}

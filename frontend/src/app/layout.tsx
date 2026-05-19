import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { RoleProvider } from '@/context/role-context'
import { CycleProvider } from '@/context/cycle-context'
import { AuthProvider } from '@/context/auth-context'
import { Sidebar } from '@/components/sidebar'
import { Topbar } from '@/components/topbar'
import { MainLayoutWrapper } from '@/components/main-layout-wrapper'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from "@/components/ui/tooltip"

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'AtomQuest | Enterprise Goal Tracking',
  description: 'Enterprise-grade gamified goal setting and tracking portal.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} min-h-screen bg-gray-50/50 font-sans antialiased text-slate-900`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <CycleProvider>
            <RoleProvider>
              <AuthProvider>
                <TooltipProvider delay={300}>
                  <div className="flex min-h-screen">
                    <Sidebar />
                    <MainLayoutWrapper>
                      <Topbar />
                      {children}
                    </MainLayoutWrapper>
                  </div>
                  <Toaster />
                </TooltipProvider>
              </AuthProvider>
            </RoleProvider>
          </CycleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

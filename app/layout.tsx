import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import Toaster from '@/components/ui/toaster';
import Sidebar from '@/components/sidebar';
import { AuthProvider } from '@/lib/auth';
import { listActiveModules } from '@/lib/module-registry';

export const metadata: Metadata = {
  title: 'EMR System',
  description: 'Modern Electronic Medical Records System',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const modules = await listActiveModules();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="relative flex min-h-screen flex-col">
              <div className="flex flex-1">
                <Sidebar
                  modules={modules.map((module) => ({
                    id: module.id,
                    label: module.label,
                    routePath: module.routePath,
                    icon: module.icon,
                  }))}
                />
                <main className="flex-1 overflow-y-auto">
                  <div className="container p-8">
                    {children}
                  </div>
                </main>
              </div>
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

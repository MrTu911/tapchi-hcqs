
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: {
    template: '%s | Tạp chí Nghiên cứu Khoa học Hậu cần Quân sự',
    default: 'Tạp chí Nghiên cứu Khoa học Hậu cần Quân sự'
  },
  description: 'Tạp chí chuyên ngành về lĩnh vực hậu cần quân sự, được xuất bản định kỳ nhằm phổ biến các nghiên cứu khoa học, kinh nghiệm thực tiễn và những thành tựu mới trong công tác hậu cần Quân đội nhân dân Việt Nam.',
  keywords: ['hậu cần quân sự', 'nghiên cứu khoa học', 'quân đội', 'việt nam', 'tạp chí', 'học thuật'],
  authors: [{ name: 'Học viện Hậu cần' }],
  openGraph: {
    title: 'Tạp chí Nghiên cứu Khoa học Hậu cần Quân sự',
    description: 'Tạp chí chuyên ngành về lĩnh vực hậu cần quân sự, được xuất bản định kỳ nhằm phổ biến các nghiên cứu khoa học, kinh nghiệm thực tiễn và những thành tựu mới trong công tác hậu cần Quân đội nhân dân Việt Nam.',
    url: '/',
    siteName: 'Tạp chí Nghiên cứu Khoa học Hậu cần Quân sự',
    images: ['/og-image.png'],
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tạp chí Nghiên cứu Khoa học Hậu cần Quân sự',
    description: 'Tạp chí chuyên ngành về lĩnh vực hậu cần quân sự',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col">
            {children}
          </div>
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}

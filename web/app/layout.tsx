import type { Metadata } from 'next'
import { Outfit, Zen_Kaku_Gothic_New } from 'next/font/google'
import './globals.css'

const outfit = Outfit({
    subsets: ['latin'],
    variable: '--font-outfit',
    display: 'swap',
})

const zenKaku = Zen_Kaku_Gothic_New({
    weight: ['300', '400', '500', '700'],
    subsets: ['latin'],
    variable: '--font-zen',
    display: 'swap',
})

export const metadata: Metadata = {
    title: 'NFC Shiori | Secure Audio Moment',
    description: 'Listen to exclusive moments via NFC.',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="ja" className={`${outfit.variable} ${zenKaku.variable}`}>
            <body className="font-sans antialiased bg-slate-950 text-white selection:bg-cyan-500 selection:text-white">
                {children}
            </body>
        </html>
    )
}

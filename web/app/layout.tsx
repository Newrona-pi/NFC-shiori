import type { Metadata } from 'next'
import { M_PLUS_Rounded_1c, Sora, Zen_Kaku_Gothic_New } from 'next/font/google'
import './globals.css'

const mplus = M_PLUS_Rounded_1c({
    weight: ['100', '300', '400', '500', '700', '800'],
    subsets: ['latin'],
    variable: '--font-mplus',
    display: 'swap',
})

const sora = Sora({
    subsets: ['latin'],
    variable: '--font-sora',
    display: 'swap',
})

const zenKaku = Zen_Kaku_Gothic_New({
    weight: ['400', '500', '700'],
    subsets: ['latin'],
    variable: '--font-zen',
    display: 'swap',
})

export const metadata: Metadata = {
    title: 'おとしるべ',
    description: 'Listen to exclusive moments via NFC.',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="ja" className={`${mplus.variable} ${sora.variable} ${zenKaku.variable}`}>
            <body className="font-sans antialiased">
                {children}
            </body>
        </html>
    )
}

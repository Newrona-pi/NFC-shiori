import type { Metadata } from 'next'
import { M_PLUS_Rounded_1c, Varela_Round } from 'next/font/google'
import './globals.css'

const mplus = M_PLUS_Rounded_1c({
    weight: ['100', '300', '400', '500', '700', '800'],
    subsets: ['latin'],
    variable: '--font-mplus',
    display: 'swap',
})

const varela = Varela_Round({
    weight: ['400'],
    subsets: ['latin'],
    variable: '--font-varela',
    display: 'swap',
})

export const metadata: Metadata = {
    title: 'NFC Shiori ✨ | 特別な声をあなたに',
    description: 'Listen to exclusive moments via NFC.',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="ja" className={`${mplus.variable} ${varela.variable}`}>
            <body className="font-sans antialiased bg-[#1a1625] text-white selection:bg-pink-400 selection:text-white">
                {children}
            </body>
        </html>
    )
}

import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Policy Atlas · Evidence-first intelligence',description:'Version-aware policy search with traceable evidence. A private learning project by Mufeedh Ahmed.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}

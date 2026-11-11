import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MediFlow | Autonomous Healthcare Triage Agent',
  description: 'Clinical multi-agent triage system with LangGraph, grounded RAG protocols, 25% hallucination reduction guardrails, and real-time streaming assessment.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
        {children}
      </body>
    </html>
  );
}

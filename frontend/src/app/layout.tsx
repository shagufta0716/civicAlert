import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AuthProvider from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CivicAlert — AI-Based Civic Complaint Priority System",
  description:
    "Submit civic complaints (road damage, garbage, electricity, water) and get instant AI-powered priority classification. Municipal administrators can track and resolve issues efficiently.",
  keywords: ["civic complaints", "municipality", "AI priority", "Jharkhand", "civic alert"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <Navbar />
        <AuthProvider>
          <main>{children}</main>
        </AuthProvider>
        <footer className="mt-16 py-8 border-t border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
            <p>
              © 2024 CivicAlert — AI-Powered Civic Complaint Management System
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Serving Ranchi, Jamshedpur, Dhanbad, Bokaro and more
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

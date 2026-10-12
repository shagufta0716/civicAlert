"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const linkClass = (href: string) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      pathname === href
        ? "bg-blue-700 text-white"
        : "text-blue-100 hover:bg-blue-700 hover:text-white"
    }`;

  return (
    <nav className="bg-blue-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-yellow-400 p-1.5 rounded-lg group-hover:bg-yellow-300 transition-colors">
              <AlertTriangle className="h-5 w-5 text-blue-900" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              CivicAlert
            </span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            <Link href="/" className={linkClass("/")}>
              File Complaint
            </Link>
            <Link href="/track" className={linkClass("/track")}>
              Track Complaint
            </Link>
            <Link
              href="/admin/dashboard"
              className="ml-4 px-4 py-2 bg-yellow-400 text-blue-900 rounded-md text-sm font-semibold hover:bg-yellow-300 transition-colors"
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

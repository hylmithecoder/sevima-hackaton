"use client";

import { useState } from "react";
import {
  Home,
  Users,
  Calendar,
  BarChart2,
  LogOut,
  Settings,
  UserCircle,
  Menu,
  X,
  Paperclip,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const menus = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Tambah QR", href: "/dashboard?modul=qr_code", icon: Users },
    { name: "Pengguna", href: "/dashboard?modul=user", icon: UserCircle },
    { name: "Laporan", href: "/dashboard?modul=laporan", icon: BarChart2 }
  ];

  return (
    <>
      {/* Tombol hamburger (mobile only) */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 bg-white p-2 rounded-md shadow-md"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {/* Overlay background (mobile) */}
      {open && (
        <div
          className="fixed inset-0 blur-sm bg-opacity-40 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-screen w-64 bg-white border-r shadow-sm flex flex-col transform transition-transform z-50",
          open ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0" // desktop selalu tampil
        )}
      >
        {/* Header + tombol close */}
        <div className="h-16 flex items-center justify-between border-b px-4">
          <h1 className="text-xl font-bold text-blue-600">Absensi QR</h1>
          <button
            className="md:hidden p-1 text-gray-600 hover:text-gray-900"
            onClick={() => setOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {menus.map((menu) => {
            const active = pathname === menu.href;
            return (
              <Link
                key={menu.name}
                href={menu.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                )}
                onClick={() => setOpen(false)}
              >
                <menu.icon className="w-5 h-5 mr-3" />
                {menu.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t">
          <button className="flex items-center w-full px-3 py-2 text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors">
            <LogOut className="w-5 h-5 mr-3" />
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}

"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthProvider({ children, requiredRole = null }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      // Cek apakah ada user di localStorage
      const userStr = localStorage.getItem("user");
      
      if (!userStr) {
        // Tidak ada user, redirect ke login
        router.replace("/");
        return;
      }

      const user = JSON.parse(userStr);
      
      // Validasi struktur user object
      if (!user.username || !user.role) {
        // Data user tidak valid, hapus dan redirect
        localStorage.removeItem("user");
        router.replace("/");
        return;
      }

      // Jika ada requiredRole, cek apakah role user sesuai
      if (requiredRole && user.role !== requiredRole) {
        // Role tidak sesuai, redirect berdasarkan role user
        redirectByRole(user.role);
        return;
      }

      // Semua validasi berhasil
      setIsAuthenticated(true);
      setIsLoading(false);
      
    } catch (error) {
      console.error("Error parsing user data:", error);
      // Data localStorage corrupt, hapus dan redirect
      localStorage.removeItem("user");
      router.replace("/");
    }
  };

  const redirectByRole = (role) => {
    switch (role) {
      case "admin":
        router.replace("/dashboard");
        break;
      case "satpam":
        router.replace("/mobile");
        break;
      default:
        router.replace("/");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          {/* Loading Spinner */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
            <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Memuat...</h2>
          <p className="text-gray-500">Sedang memeriksa autentikasi</p>
        </div>
      </div>
    );
  }

  // Jika belum authenticated, tampilkan loading (redirect sedang berlangsung)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
            <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Mengalihkan...</h2>
          <p className="text-gray-500">Sedang mengalihkan ke halaman login</p>
        </div>
      </div>
    );
  }

  // Jika sudah authenticated, render children
  return children;
}

// Hook untuk mendapatkan user data
export function useAuth() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const getUserData = () => {
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          setUser(JSON.parse(userStr));
        }
      } catch (error) {
        console.error("Error getting user data:", error);
        logout();
      }
    };

    getUserData();
  }, []);

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    router.replace("/");
  };

  return { user, logout };
}

// Component untuk admin only
export function AdminOnly({ children }) {
  return (
    <AuthProvider requiredRole="admin">
      {children}
    </AuthProvider>
  );
}

// Component untuk satpam only  
export function SatpamOnly({ children }) {
  return (
    <AuthProvider requiredRole="satpam">
      {children}
    </AuthProvider>
  );
}

// Component logout button
export function LogoutButton({ className = "" }) {
  const { logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar?")) {
      logout();
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={`inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200 ${className}`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      <span>Keluar</span>
    </button>
  );
}
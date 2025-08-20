"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Scanner from "../components/camera";
import { 
  User, 
  CheckCircle, 
  AlertCircle, 
  Loader,
} from "lucide-react";

const MobilePage = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [matchedQR, setMatchedQR] = useState(null);
  const [attendanceSuccess, setAttendanceSuccess] = useState(false);
  const [getLocalstorage, setGetLocalstorage] = useState(null);

  // ambil user dari localStorage
  useEffect(() => {
      // if (typeof window !== 'undefined') {
        const savedUser = localStorage.getItem("user");
        // console.log(savedUser);
     setGetLocalstorage(JSON.parse(savedUser));
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        router.push("/"); // kalau ga ada data user, balik ke login
      }
    // }
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p>Loading user...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-4">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-full mr-4">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Security Panel</h1>
              <p className="text-gray-600 text-sm">Mobile Attendance System</p>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p><span className="font-semibold text-gray-700">Nama:</span> {user.name}</p>
            <p><span className="font-semibold text-gray-700">Username:</span> {user.username}</p>
            <p><span className="font-semibold text-gray-700">Role:</span> 
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                {user.role}
              </span>
            </p>
          </div>
        </div>

        {/* Success Message */}
        {attendanceSuccess && matchedQR && (
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-green-800 mb-2">Absensi Berhasil!</h3>
            <div className="space-y-1 text-sm text-green-700">
              <p><strong>Kode:</strong> {matchedQR.code}</p>
              <p><strong>Lokasi:</strong> {matchedQR.location}</p>
              <p><strong>Shift:</strong> {matchedQR.shift}</p>
              <p><strong>Waktu:</strong> {new Date().toLocaleString('id-ID')}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}   
        <Scanner currentQrId={getLocalstorage.id} name={getLocalstorage.name}/>
  </div>
</div>
  );
};

export default MobilePage;
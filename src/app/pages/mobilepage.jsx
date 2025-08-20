"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QrReader } from "react-qr-reader";
import { Html5Qrcode } from "html5-qrcode";
import Scanner from "../components/camera";
import { 
  User, 
  QrCode, 
  Camera, 
  CheckCircle, 
  AlertCircle, 
  MapPin, 
  Clock, 
  Loader,
  RefreshCw,
  X,
  Target
} from "lucide-react";

const MobilePage = () => {
  const [scanResult, setScanResult] = useState(null);
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [matchedQR, setMatchedQR] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [attendanceSuccess, setAttendanceSuccess] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [qrScanner, setQrScanner] = useState(null);

  // ambil user dari localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        router.push("/"); // kalau ga ada data user, balik ke login
      }
    }
  }, [router]);

  // fetch data QR Codes
  useEffect(() => {
    const fetchQrCodes = async () => {
      try {
        const res = await fetch("https://ilmeee.com/api_sevima/qr_code/");
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setQrCodes(data);
      } catch (err) {
        console.error("Gagal ambil QR Codes:", err);
        setError("Gagal memuat QR codes");
      } finally {
        setLoading(false);
      }
    };

    fetchQrCodes();
  }, []);

  // Get user location
  const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation tidak didukung oleh browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          setUserLocation(location);
          resolve(location);
        },
        (error) => {
          let errorMessage = 'Gagal mendapatkan lokasi. ';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Akses lokasi ditolak.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Lokasi tidak tersedia.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Timeout mendapatkan lokasi.';
              break;
            default:
              errorMessage += 'Error tidak diketahui.';
              break;
          }
          setLocationError(errorMessage);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  // Calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  // Handle QR scan result
  const handleScan = async (result) => {
    if (result && result.text) {
      const scannedCode = result.text;
      setScanResult(scannedCode);
      
      // Cari QR code yang cocok
      const foundQR = qrCodes.find(qr => qr.code === scannedCode);
      
      if (foundQR) {
        setMatchedQR(foundQR);
        setScannerActive(false); // Stop scanner setelah berhasil
        
        // Cek apakah QR sudah expired
        const now = new Date();
        const expiredAt = new Date(foundQR.expired_at);
        
        if (now > expiredAt) {
          setError("QR Code sudah expired!");
          return;
        }
        
        // Get user location untuk validasi
        try {
          const location = await getUserLocation();
          
          // Hitung jarak
          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            parseFloat(foundQR.latitude),
            parseFloat(foundQR.longitude)
          );
          
          // Cek apakah dalam radius yang diizinkan
          if (distance > parseFloat(foundQR.radius)) {
            setError(`Anda terlalu jauh dari lokasi absen! Jarak: ${Math.round(distance)}m, Maximum: ${foundQR.radius}m`);
            return;
          }
          
          // Jika semua validasi passed, lanjut ke absensi
          await handleAbsen(foundQR, location);
          
        } catch (err) {
          setError("Gagal mendapatkan lokasi: " + err.message);
        }
        
      } else {
        setError("QR Code tidak valid atau tidak ditemukan!");
      }
    }
  };

const checkCameraPermission = async () => {
  try {
    // Cek apakah browser support getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Browser tidak mendukung akses kamera');
    }

    // Minta izin dengan constraints khusus mobile
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment', // Gunakan kamera belakang
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });

    // Stop stream setelah dapat izin
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      return true;
    }

  } catch (err) {
    console.error('Camera permission error:', err);
    let errorMessage = 'Gagal mengakses kamera: ';
    
    // Handle specific error messages
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      errorMessage += 'Izin kamera ditolak';
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      errorMessage += 'Kamera tidak ditemukan';
    } else if (err.name === 'NotSupportedError') {
      errorMessage += 'Browser tidak mendukung';
    } else {
      errorMessage += err.message;
    }

    setError(errorMessage);
    setHasPermission(false);
    return false;
  }
};

// Modifikasi fungsi startScanner
const startScanner = async () => {
  console.log("Starting scanner...");
  try {
    const hasAccess = await checkCameraPermission();
    if (!hasAccess) return;

    setError(null);
    setScanResult(null);
    setMatchedQR(null);
    setAttendanceSuccess(false);
    setLocationError(null);

    const scanner = new Html5Qrcode("qr-reader");
    setQrScanner(scanner);

    const cameras = await Html5Qrcode.getCameras();
    if (cameras && cameras.length > 0) {
      const camera = cameras[cameras.length - 1]; // Biasanya kamera belakang
      
      await scanner.start(
        camera.id,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          handleScan({ text: decodedText });
        },
        (errorMessage) => {
          console.log(errorMessage);
        }
      );
      
      setScannerActive(true);
    }
  } catch (err) {
    console.error("Error starting scanner:", err);
    setError("Gagal memulai scanner: " + err.message);
  }
};

  // Handle scan error
  const handleScanError = (error) => {
    console.warn("QR Scan Error:", error);
    if (error?.message && !error.message.includes('No MultiFormat Readers')) {
      setError("Error saat scan: " + error.message);
    }
  };

  // logic absen dengan FormData
  const handleAbsen = async (qr, location) => {
    if (!user || !location) return;
    setProcessing(true);
    setError(null);

    try {
      // Siapkan FormData untuk POST request
      const formData = new FormData();
      formData.append('user_id', user.id);
      formData.append('qr_code_id', qr.code);
      formData.append('qr_id', qr.id);
      formData.append('status', 'HADIR');
      formData.append('scan_time', new Date().toISOString());
      formData.append('latitude', location.latitude.toString());
      formData.append('longitude', location.longitude.toString());
      
      // Placeholder untuk foto (nanti bisa ditambah upload foto)
      formData.append('photo_url', '/uploads/default.png');
      
      // Log untuk debugging
      console.log('Submitting attendance data:', {
        user_id: user.id,
        qr_code_id: qr.code,
        qr_id: qr.id,
        location: location
      });

      // 1. Submit absensi
      const absenRes = await fetch("https://ilmeee.com/api_sevima/absen/", {
        method: "POST",
        body: formData
      });

      if (!absenRes.ok) {
        const errorText = await absenRes.text();
        throw new Error(`Gagal simpan absensi: ${absenRes.status} - ${errorText}`);
      }

      const absenData = await absenRes.json();
      console.log('Absensi response:', absenData);

      // 3. Success
      setAttendanceSuccess(true);
      setMatchedQR(qr);
      
      // 4. Refresh daftar QR (optional)
      // setQrCodes((prev) => prev.filter((item) => item.id !== qr.id));

    } catch (err) {
      console.error("Error saat absensi:", err);
      setError("Terjadi kesalahan saat absensi: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Stop scanner
 const stopScanner = async () => {
  if (qrScanner) {
    await qrScanner.stop();
    setQrScanner(null);
  }
  setScannerActive(false);
};


  // Reset states
  const resetStates = () => {
    setError(null);
    setScanResult(null);
    setMatchedQR(null);
    setAttendanceSuccess(false);
    setLocationError(null);
    setScannerActive(false);
  };

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
        <Scanner/>
  </div>
</div>
  );
};

export default MobilePage;
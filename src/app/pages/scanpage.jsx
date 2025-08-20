'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  QrCode, 
  MapPin, 
  Clock, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Navigation,
  Camera,
  Loader,
  Shield,
  Timer,
  Map,
  Target,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';

const QRScanPage = ( { id } ) => {
  const [qrId] = id; // Di Next.js: const { id } = useRouter().query atau useParams()
  
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [distance, setDistance] = useState(null);
  const [canAttend, setCanAttend] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSuccess, setAttendanceSuccess] = useState(false);

  // Fetch QR data from API
  const fetchQRData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://ilmeee.com/api_sevima/qr_code/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      // Cari QR berdasarkan ID
      const qrItem = data.find(item => item.id === qrId);
      
      if (!qrItem) {
        throw new Error('QR Code tidak ditemukan');
      }
      
      setQrData(qrItem);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`Gagal memuat data QR code: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Get user location
  const getUserLocation = () => {
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation tidak didukung oleh browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLoc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        setUserLocation(userLoc);
        
        if (qrData) {
          const dist = calculateDistance(
            userLoc.latitude,
            userLoc.longitude,
            parseFloat(qrData.latitude),
            parseFloat(qrData.longitude)
          );
          setDistance(dist);
          setCanAttend(dist <= parseFloat(qrData.radius));
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Gagal mendapatkan lokasi. ';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Akses lokasi ditolak. Silakan izinkan akses lokasi.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Informasi lokasi tidak tersedia.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Timeout dalam mendapatkan lokasi.';
            break;
          default:
            errorMessage += 'Error tidak diketahui.';
            break;
        }
        setLocationError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
      }
    );
  };

  // Calculate distance between two coordinates using Haversine formula
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

  // Check if QR is expired
  const isExpired = () => {
    if (!qrData) return false;
    return new Date() > new Date(qrData.expired_at);
  };

  // Format date and time
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    };
  };

  // Handle attendance submission
  const handleAttendance = async () => {
    if (!canAttend || !userLocation || isExpired() || attendanceLoading) return;
    
    setAttendanceLoading(true);
    try {
      const attendanceData = {
        qr_code_id: qrData.code,
        qr_id: qrData.id,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        scan_time: new Date().toISOString(),
        distance: Math.round(distance)
      };

      console.log('Submitting attendance:', attendanceData);

      // Simulasi API call untuk submit attendance
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Dalam implementasi nyata, uncomment code dibawah ini:
      /*
      const response = await fetch('https://ilmeee.com/api_sevima/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attendanceData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Attendance result:', result);
      */
      
      setAttendanceSuccess(true);
      
    } catch (err) {
      console.error('Attendance error:', err);
      setError(`Gagal melakukan absensi: ${err.message}`);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Retry location
  const retryLocation = () => {
    setLocationError(null);
    setUserLocation(null);
    setDistance(null);
    setCanAttend(false);
    getUserLocation();
  };

  useEffect(() => {
    fetchQRData();
  }, [qrId]);

  useEffect(() => {
    if (qrData && !attendanceSuccess) {
      getUserLocation();
    }
  }, [qrData]);

  // Update distance calculation when location changes
  useEffect(() => {
    if (qrData && userLocation) {
      const dist = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        parseFloat(qrData.latitude),
        parseFloat(qrData.longitude)
      );
      setDistance(dist);
      setCanAttend(dist <= parseFloat(qrData.radius) && !isExpired());
    }
  }, [qrData, userLocation]);

  const getStatusColor = () => {
    if (attendanceSuccess) return 'green';
    if (isExpired()) return 'red';
    if (locationError) return 'gray';
    if (canAttend) return 'green';
    if (distance !== null) return 'orange';
    return 'blue';
  };

  const getStatusText = () => {
    if (attendanceSuccess) return 'Absensi Berhasil!';
    if (isExpired()) return 'QR Code Expired';
    if (locationError) return 'Lokasi Tidak Tersedia';
    if (!userLocation) return 'Mendeteksi Lokasi...';
    if (canAttend) return 'Siap Absen';
    return `Terlalu Jauh (${Math.round(distance)}m)`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Memuat data QR...</p>
          <p className="text-gray-500 text-sm mt-2">Mengambil data dari server...</p>
        </div>
      </div>
    );
  }

  if (error && !qrData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">QR Tidak Valid</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchQRData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const expired = isExpired();
  const statusColor = getStatusColor();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-xl mr-4">
                <QrCode className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Scan Absensi</h1>
                <p className="text-gray-600">QR Code: {qrData?.code}</p>
                <p className="text-sm text-gray-500">ID: {qrData?.id}</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center ${
              statusColor === 'green' ? 'bg-green-100 text-green-800' :
              statusColor === 'red' ? 'bg-red-100 text-red-800' :
              statusColor === 'orange' ? 'bg-orange-100 text-orange-800' :
              statusColor === 'gray' ? 'bg-gray-100 text-gray-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {userLocation ? <Wifi className="w-4 h-4 mr-1" /> : <WifiOff className="w-4 h-4 mr-1" />}
              {getStatusText()}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Success Message */}
        {attendanceSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">Absensi Berhasil!</h2>
            <p className="text-green-700">Terima kasih, absensi Anda telah tercatat pada {new Date().toLocaleString('id-ID')}</p>
            <div className="mt-4 text-sm text-green-600 bg-green-100 rounded-lg p-3">
              <p><strong>Lokasi:</strong> {qrData?.location}</p>
              <p><strong>Shift:</strong> {qrData?.shift}</p>
              <p><strong>Jarak:</strong> {Math.round(distance)}m dari titik absen</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && qrData && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <div className="flex items-center">
              <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-red-800">Terjadi Kesalahan</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* QR Info Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
              <div className="flex items-center mb-4">
                <Shield className="w-6 h-6 mr-2" />
                <h2 className="text-xl font-bold">Informasi Lokasi</h2>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="text-center">
                  <div className="bg-white rounded-lg p-4 inline-block">
                    <QRCodeSVG
                      value={qrData?.code || ''}
                      size={300}
                      level="H"
                      includeMargin={true}
                      className="mx-auto"
                      bgColor="#FFFFFF"
                      fgColor="#000000"
                    />
                  </div>
                  <p className="text-lg font-semibold mt-2">{qrData?.code}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Location */}
              <div className="flex items-start">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Lokasi Absen</h3>
                  <p className="text-gray-600 capitalize">{qrData?.location}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Radius: {qrData?.radius}m dari titik koordinat
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Lat: {qrData?.latitude}, Lng: {qrData?.longitude}
                  </p>
                </div>
              </div>

              {/* Shift */}
              <div className="flex items-start">
                <div className="bg-purple-100 p-3 rounded-lg mr-4">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Shift</h3>
                  <p className="text-gray-600 capitalize">{qrData?.shift}</p>
                </div>
              </div>

              {/* Created */}
              <div className="flex items-start">
                <div className="bg-green-100 p-3 rounded-lg mr-4">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Dibuat</h3>
                  <p className="text-gray-600">{formatDateTime(qrData?.created_at).date}</p>
                  <p className="text-sm text-gray-500">{formatDateTime(qrData?.created_at).time}</p>
                </div>
              </div>

              {/* Expiry */}
              <div className="flex items-start">
                <div className={`p-3 rounded-lg mr-4 ${expired ? 'bg-red-100' : 'bg-orange-100'}`}>
                  <Timer className={`w-6 h-6 ${expired ? 'text-red-600' : 'text-orange-600'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Berlaku Hingga</h3>
                  <p className={`${expired ? 'text-red-600' : 'text-gray-600'}`}>
                    {formatDateTime(qrData?.expired_at).date}
                  </p>
                  <p className={`text-sm ${expired ? 'text-red-500' : 'text-gray-500'}`}>
                    {formatDateTime(qrData?.expired_at).time}
                    {expired && <span className="ml-2 font-semibold">(EXPIRED)</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Location & Action Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 text-white">
              <div className="flex items-center mb-4">
                <Target className="w-6 h-6 mr-2" />
                <h2 className="text-xl font-bold">Status Lokasi</h2>
              </div>
            </div>

            <div className="p-6">
              {/* Location Status */}
              {locationError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center mb-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    <h3 className="font-semibold text-red-800">Error Lokasi</h3>
                  </div>
                  <p className="text-red-700 text-sm mb-3">{locationError}</p>
                  <button
                    onClick={retryLocation}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Coba Lagi
                  </button>
                </div>
              ) : userLocation ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <h3 className="font-semibold text-green-800">Lokasi Terdeteksi</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><strong>Jarak dari titik absen:</strong> {distance ? `${Math.round(distance)}m` : 'Menghitung...'}</p>
                    <p><strong>Radius diizinkan:</strong> {qrData?.radius}m</p>
                    <p><strong>Akurasi GPS:</strong> ±{Math.round(userLocation.accuracy)}m</p>
                    <p className="text-xs text-gray-500">
                      Lat: {userLocation.latitude.toFixed(6)}, Lng: {userLocation.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center mb-3">
                    <Loader className="w-5 h-5 text-blue-600 mr-2 animate-spin" />
                    <h3 className="font-semibold text-blue-800">Mengambil Lokasi...</h3>
                  </div>
                  <p className="text-blue-700 text-sm">Pastikan GPS aktif dan izin lokasi diberikan</p>
                </div>
              )}

              {/* Attendance Button */}
              <div className="mt-6">
                <button
                  onClick={handleAttendance}
                  disabled={!canAttend || expired || attendanceLoading || attendanceSuccess}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center ${
                    canAttend && !expired && !attendanceLoading && !attendanceSuccess
                      ? 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {attendanceLoading ? (
                    <>
                      <Loader className="w-6 h-6 mr-2 animate-spin" />
                      Memproses Absensi...
                    </>
                  ) : attendanceSuccess ? (
                    <>
                      <CheckCircle className="w-6 h-6 mr-2" />
                      Absensi Berhasil
                    </>
                  ) : expired ? (
                    <>
                      <Timer className="w-6 h-6 mr-2" />
                      QR Code Expired
                    </>
                  ) : !userLocation ? (
                    <>
                      <Navigation className="w-6 h-6 mr-2" />
                      Menunggu Lokasi...
                    </>
                  ) : !canAttend ? (
                    <>
                      <AlertCircle className="w-6 h-6 mr-2" />
                      Terlalu Jauh ({Math.round(distance)}m)
                    </>
                  ) : (
                    <>
                      <Camera className="w-6 h-6 mr-2" />
                      Lakukan Absensi
                    </>
                  )}
                </button>

                {!expired && canAttend && !attendanceSuccess && (
                  <p className="text-center text-sm text-gray-600 mt-3">
                    Pastikan Anda berada dalam radius {qrData?.radius}m dari lokasi absen
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanPage;
'use client';
import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

const Scanner = ( { currentQrId, name} ) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [stream, setStream] = useState(null);
  const [qrText, setQrText] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [location, setLocation] = useState(null);

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation tidak didukung di browser ini'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          setLocation(locationData);
          resolve(locationData);
        },
        (error) => {
          let errorMessage;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Izin lokasi ditolak.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Informasi lokasi tidak tersedia.";
              break;
            case error.TIMEOUT:
              errorMessage = "Request lokasi timeout.";
              break;
            default:
              errorMessage = "Terjadi error saat mengambil lokasi.";
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    });
  };

  const handleSend = async () => {
    if (!qrText) {
      return;
    }

    try {
      // Ambil lokasi
      const locationData = await getLocation();

      const formData = new FormData();
      formData.append('qr_code_id', qrText);
      formData.append('user_id', currentQrId || '');
      formData.append('status', 'on_time');
      formData.append('scan_time', new Date().toISOString());
      formData.append('latitude', locationData.latitude.toString());
      formData.append('longitude', locationData.longitude.toString());
      formData.append('photo_url', '/uploads/default.png');

      console.log("Sending form data:");
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      const response = await fetch("https://ilmeee.com/api_sevima/absen/index.php", {
        method: "POST",
        body: formData
      });

      const responseText = await response.text();
      console.log("Raw response:", responseText);
      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log("Parsed response:", responseData);
      } catch (jsonError) {
        console.error("JSON parse error:", jsonError);
        console.error("Response was not valid JSON:", responseText);
        throw new Error(`Server mengembalikan response yang tidak valid: ${responseText.substring(0, 100)}`);
      }

      if (!response.ok || responseData.status !== "success") {
        throw new Error(responseData.message || 'Gagal menyimpan absensi');
      }

    } catch (error) {
      console.error('Error:', error);
      // alert(`Error: ${error.message}`);
    } finally {
      resetScanner();
    }
  };

  useEffect(() => {
    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          setStream(mediaStream);
        }
      } catch (err) {
        console.error("Error akses kamera:", err);
        setError("Tidak bisa akses kamera, periksa izin browser.");
      }
    };

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsProcessing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    try {
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      if (code) {
        console.log("Found QR code:", code.data);
        setQrText(code.data);
        
        // Draw marker di lokasi QR code
        context.strokeStyle = '#FF3B58';
        context.lineWidth = 5;
        
        context.beginPath();
        context.moveTo(code.location.topLeftCorner.x, code.location.topLeftCorner.y);
        context.lineTo(code.location.topRightCorner.x, code.location.topRightCorner.y);
        context.lineTo(code.location.bottomRightCorner.x, code.location.bottomRightCorner.y);
        context.lineTo(code.location.bottomLeftCorner.x, code.location.bottomLeftCorner.y);
        context.lineTo(code.location.topLeftCorner.x, code.location.topLeftCorner.y);
        context.stroke();
      } else {
        console.log("No QR code found");
        setQrText(null);
      }
    } catch (error) {
      console.error('Error processing QR:', error);
      setQrText(null);
    }

    setCapturedImage(canvas.toDataURL('image/jpeg', 0.8));

    // Stop kamera setelah capture
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    
    setIsProcessing(false);
    setIsScanning(true);
  };

  const handleCancel = () => {
    resetScanner();
  };

  const resetScanner = () => {
    setCapturedImage(null);
    setQrText(null);
    setIsScanning(false);
    setIsProcessing(false);
    
    // Restart kamera
    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          setStream(mediaStream);
        }
      } catch (err) {
        console.error("Error restart kamera:", err);
        setError("Tidak bisa restart kamera.");
      }
    };

    initCamera();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Scanner QR Code</h1>
      
      <div className="relative w-full max-w-md">
        {error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : (
          <>
            {!isScanning && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg shadow-lg"
                style={{ display: capturedImage ? 'none' : 'block' }}
              />
            )}

            {capturedImage && (
              <div className="relative">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full rounded-lg shadow-lg"
                />
                
                {isProcessing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      <p className="text-sm">Memproses QR Code...</p>
                    </div>
                  </div>
                )}
                
                {!isProcessing && (
                  <div className={`absolute top-2 left-2 right-2 p-2 rounded ${
                    qrText 
                      ? 'bg-green-500 bg-opacity-90' 
                      : 'bg-orange-500 bg-opacity-90'
                  }`}>
                    <p className="text-white text-xs font-semibold">
                      {qrText ? '✓ QR Code Terdeteksi' : '⚠ Tidak Ada QR Code'}
                    </p>
                  </div>
                )}
              </div>
            )}

            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-white border-dashed w-64 h-64 rounded-lg opacity-70"></div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-6 flex gap-4">
        {!isScanning ? (
          <button
            onClick={handleScan}
            disabled={!!error || isProcessing}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-200 flex items-center gap-2"
          >
            {isProcessing ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
            {isProcessing ? 'Memproses...' : 'Scan'}
          </button>
        ) : (
          <>
            <button
              onClick={handleSend}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Kirim
            </button>
            <button
              onClick={handleCancel}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Batal
            </button>
          </>
        )}
      </div>

      {qrText && (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded-lg max-w-md w-full">
          <h3 className="font-semibold text-green-800 mb-2">QR Code Terdeteksi:</h3>
          <p className="text-green-700 text-sm break-all">{qrText}</p>
        </div>
      )}

      {location && (
        <div className="mt-2 p-2 bg-blue-100 border border-blue-400 rounded-lg max-w-md w-full">
          <p className="text-blue-700 text-xs">
            Lokasi: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </p>
        </div>
      )}

      <p className="text-gray-600 text-sm mt-4 text-center max-w-md">
        {!isScanning 
          ? "Arahkan kamera ke QR code, lalu tekan tombol Scan"
          : qrText 
            ? "QR Code berhasil terdeteksi! Pilih Kirim untuk melanjutkan atau Batal untuk scan ulang"
            : "Tidak ada QR Code terdeteksi. Tekan Batal untuk scan ulang"
        }
      </p>
    </div>
  );
};

export default Scanner;
'use client';

import { useState, useEffect } from 'react';

export default function ExportToPDFPreview() {
  const [users, setUsers] = useState([]);
  const [qrs, setQrs] = useState([]);
  const [absensi, setAbsensi] = useState([]);
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPrintView, setIsPrintView] = useState(false);

  // 1. Fetch semua data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [userData, qrData, absenData] = await Promise.all([
        fetch('https://ilmeee.com/api_sevima/data_user/').then(r => r.json()),
        fetch('https://ilmeee.com/api_sevima/qr_code/').then(r => r.json()),
        fetch('https://ilmeee.com/api_sevima/absen/').then(r => r.json()),
      ]);
      
      setUsers(userData);
      setQrs(qrData);
      setAbsensi(absenData);
    } catch (err) {
      setError('Gagal memuat data: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Gabungkan data untuk satu baris per record absensi
  useEffect(() => {
    if (!users.length || !qrs.length || !absensi.length) return;

    const mapUsers = Object.fromEntries(users.map(u => [u.id, u]));
    const mapQrs   = Object.fromEntries(qrs.map(q => [q.code, q]));

    const combined = absensi.map(a => {
      const user = mapUsers[a.user_id] || {};
      const qr   = mapQrs[a.qr_code_id] || {};

      // Hitung keterlambatan
      const scan   = new Date(a.scan_time);
      const expiry = new Date(qr.expired_at);
      const terlambat = scan > expiry;

      return {
        id:           a.id,
        name:         user.name || 'N/A',
        qrCode:       a.qr_code_id,
        scanTime:     formatDateTime(a.scan_time),
        expiredAt:    formatDateTime(qr.expired_at),
        status:       a.status,
        latitude:     a.latitude,
        longitude:    a.longitude,
        keterangan:   terlambat ? 'Terlambat' : 'Tepat Waktu',
      };
    });

    setRows(combined);
  }, [users, qrs, absensi]);

  // Format tanggal dan waktu
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Fungsi untuk print/export PDF
  const handlePrint = () => {
    setIsPrintView(true);
    setTimeout(() => {
      window.print();
      setIsPrintView(false);
    }, 100);
  };

  // Fungsi untuk download sebagai HTML (bisa di-convert ke PDF)
  const handleDownloadHTML = () => {
    const content = document.getElementById('pdf-content').outerHTML;
    const fullHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Laporan Absensi</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; }
        .header { text-align: center; margin-bottom: 20px; }
        .company-info { margin-bottom: 10px; }
        .report-title { font-size: 18px; font-weight: bold; margin: 10px 0; }
        .report-date { margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #000; padding: 6px; text-align: left; font-size: 10px; }
        th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
        .text-center { text-align: center; }
        .text-red { color: #dc3545; }
        .text-green { color: #28a745; }
        .summary { margin-top: 20px; display: flex; gap: 20px; }
        .summary-item { border: 1px solid #000; padding: 10px; flex: 1; }
        @page { margin: 15mm; size: A4 landscape; }
    </style>
</head>
<body>
    ${content}
</body>
</html>`;

    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-absensi-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:pl-64 bg-white">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:pl-64 bg-white">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={fetchData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Control Buttons - Hidden saat print */}
      <div className={`p-6 lg:pl-64 bg-gray-50 print:hidden ${isPrintView ? 'hidden' : ''}`}>
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Export Laporan Absensi</h1>
          
          <div className="flex flex-wrap gap-4 mb-4">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print PDF
            </button>
            
            <button
              onClick={handleDownloadHTML}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download HTML
            </button>
            
            <button
              onClick={fetchData}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-blue-800">
              <strong>Total Records:</strong> {rows.length} | 
              <strong> Tepat Waktu:</strong> {rows.filter(r => r.keterangan === 'Tepat Waktu').length} | 
              <strong> Terlambat:</strong> {rows.filter(r => r.keterangan === 'Terlambat').length}
            </p>
          </div>
        </div>
      </div>

      {/* PDF Content */}
      <div 
        id="pdf-content" 
        className={`${isPrintView ? 'block' : 'p-6 lg:pl-64'} bg-white print:p-0 print:m-0`}
      >
        {/* Header untuk PDF */}
        <div className="header text-center mb-8 print:mb-4">
          <div className="company-info">
            <h1 className="text-xl font-bold">Hackathon Sevima Hylmi</h1>
            <p className="text-sm text-gray-600">Sistem Manajemen Absensi</p>
          </div>
          <h2 className="report-title text-lg font-bold mt-4">LAPORAN ABSENSI KARYAWAN</h2>
          <p className="report-date text-sm">
            Dicetak pada: {new Date().toLocaleString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        {/* Tabel Data */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-800 text-xs">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-800 px-2 py-2 text-center">No</th>
                <th className="border border-gray-800 px-2 py-2">Nama</th>
                <th className="border border-gray-800 px-2 py-2">QR Code</th>
                <th className="border border-gray-800 px-2 py-2">Waktu Scan</th>
                <th className="border border-gray-800 px-2 py-2">Batas Waktu</th>
                <th className="border border-gray-800 px-2 py-2">Status</th>
                <th className="border border-gray-800 px-2 py-2">Koordinat</th>
                <th className="border border-gray-800 px-2 py-2">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-800 px-2 py-1 text-center">{i + 1}</td>
                  <td className="border border-gray-800 px-2 py-1">{r.name}</td>
                  <td className="border border-gray-800 px-2 py-1 text-center">{r.qrCode}</td>
                  <td className="border border-gray-800 px-2 py-1">{r.scanTime}</td>
                  <td className="border border-gray-800 px-2 py-1">{r.expiredAt}</td>
                  <td className="border border-gray-800 px-2 py-1 text-center">{r.status}</td>
                  <td className="border border-gray-800 px-2 py-1 text-center">
                    {r.latitude}, {r.longitude}
                  </td>
                  <td className={`border border-gray-800 px-2 py-1 text-center font-semibold ${
                    r.keterangan === 'Terlambat' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {r.keterangan}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="summary mt-8 print:mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
          <div className="summary-item border border-gray-800 p-4 text-center">
            <h3 className="font-bold text-lg">{rows.length}</h3>
            <p className="text-sm">Total Absensi</p>
          </div>
          <div className="summary-item border border-gray-800 p-4 text-center">
            <h3 className="font-bold text-lg text-green-600">
              {rows.filter(r => r.keterangan === 'Tepat Waktu').length}
            </h3>
            <p className="text-sm">Tepat Waktu</p>
          </div>
          <div className="summary-item border border-gray-800 p-4 text-center">
            <h3 className="font-bold text-lg text-red-600">
              {rows.filter(r => r.keterangan === 'Terlambat').length}
            </h3>
            <p className="text-sm">Terlambat</p>
          </div>
        </div>

        {/* Footer untuk PDF */}
        <div className="mt-8 print:mt-4 text-center">
          <p className="text-xs text-gray-600">
            --- Dokumen ini digenerate secara otomatis oleh Sistem Manajemen Absensi ---
          </p>
        </div>
      </div>

      {/* CSS untuk Print */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #pdf-content,
          #pdf-content * {
            visibility: visible;
          }
          #pdf-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 15mm;
          }
          @page {
            margin: 10mm;
            size: A4 landscape;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:m-0 {
            margin: 0 !important;
          }
          .print\\:mb-4 {
            margin-bottom: 1rem !important;
          }
          .print\\:mt-4 {
            margin-top: 1rem !important;
          }
          .print\\:grid-cols-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
    </>
  );
}
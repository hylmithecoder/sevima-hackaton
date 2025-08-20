'use client';

import { useState, useEffect } from 'react';

export default function ExportToPDFPreview() {
  const [users, setUsers] = useState([]);
  const [qrs, setQrs] = useState([]);
  const [absensi, setAbsensi] = useState([]);
  const [rows, setRows] = useState([]);

  // 1. Fetch semua data
  useEffect(() => {
    Promise.all([
      fetch('https://ilmeee.com/api_sevima/data_user/').then(r => r.json()),
      fetch('https://ilmeee.com/api_sevima/qr_code/').then(r => r.json()),
      fetch('https://ilmeee.com/api_sevima/absen/').then(r => r.json()),
    ]).then(([userData, qrData, absenData]) => {
      setUsers(userData);
      setQrs(qrData);
      setAbsensi(absenData);
    });
  }, []);

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
        name:         user.name,
        qrCode:       a.qr_code_id,
        scanTime:     a.scan_time,
        expiredAt:    qr.expired_at,
        status:       a.status,
        latitude:     a.latitude,
        longitude:    a.longitude,
        keterangan:   terlambat ? 'Terlambat' : 'Tepat Waktu',
      };
    });

    setRows(combined);
  }, [users, qrs, absensi]);

  // 3. Render preview tabel
  return (
    <div className="p-6 lg:pl-64 bg-white shadow-lg" id="pdf-preview">
      <h1 className="text-2xl mb-4">Preview Export to PDF</h1>
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-2 py-1">No</th>
            <th className="border px-2 py-1">Nama</th>
            <th className="border px-2 py-1">QR Code</th>
            <th className="border px-2 py-1">Scan Time</th>
            <th className='border px-2 py-1'>Kadaluarsa</th>
            <th className="border px-2 py-1">Status</th>
            <th className="border px-2 py-1">Latitude</th>
            <th className="border px-2 py-1">Longitude</th>
            <th className="border px-2 py-1">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="border px-2 py-1 text-center">{i + 1}</td>
              <td className="border px-2 py-1">{r.name}</td>
              <td className="border px-2 py-1">{r.qrCode}</td>
              <td className="border px-2 py-1">{r.scanTime}</td>
              <td className="border px-2 py-1">{r.expiredAt}</td>
              <td className="border px-2 py-1">{r.status}</td>
              <td className="border px-2 py-1">{r.latitude}</td>
              <td className="border px-2 py-1">{r.longitude}</td>
              <td className={`border px-2 py-1 ${r.keterangan === 'Terlambat' ? 'text-red-600' : 'text-green-600'}`}>
                {r.keterangan}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar';
import { Calendar, Clock, MapPin, User, Eye, Trash2, RefreshCw, Users, CheckCircle, AlertCircle } from 'lucide-react';

const AttendanceDashboard = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    thisWeek: 0
  });

  // Fetch data dari API
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://ilmeee.com/api_sevima/data_absen/');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const data = await response.json();
      setAttendanceData(data);
      calculateStats(data);
      setError(null);
    } catch (err) {
      setError('Gagal mengambil data: ' + err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Hitung statistik
  const calculateStats = (data) => {
    const today = new Date().toDateString();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const todayCount = data.filter(item => {
      const scanDate = new Date(item.scan_time).toDateString();
      return scanDate === today;
    }).length;

    const thisWeekCount = data.filter(item => {
      const scanDate = new Date(item.scan_time);
      return scanDate >= oneWeekAgo;
    }).length;

    setStats({
      total: data.length,
      today: todayCount,
      thisWeek: thisWeekCount
    });
  };

  // Delete data
  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
    
    try {
      const response = await fetch(`https://ilmeee.com/api_sevima/data_absen/?id=${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setAttendanceData(prev => prev.filter(item => item.id !== id));
        alert('Data berhasil dihapus');
      } else {
        throw new Error('Failed to delete');
      }
    } catch (err) {
      alert('Gagal menghapus data: ' + err.message);
    }
  };

  // Format tanggal dan waktu
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('id-ID'),
      time: date.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  // Format koordinat
  const formatCoordinate = (lat, lng) => {
    if (!lat || !lng) return 'Tidak tersedia';
    return `${parseFloat(lat).toFixed(6)}, ${parseFloat(lng).toFixed(6)}`;
  };

  useEffect(() => {
    fetchData();
    // Auto refresh setiap 30 detik
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-xl shadow-md p-6 border-l-4" style={{borderLeftColor: color}}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="p-3 rounded-full" style={{backgroundColor: color + '20'}}>
          <Icon className="w-8 h-8" style={{color: color}} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br lg:pl-64 from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Absensi</h1>
              <p className="text-gray-600 mt-1">Monitoring data absensi karyawan</p>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Absensi"
            value={stats.total}
            icon={Users}
            color="#3B82F6"
          />
          <StatCard
            title="Absensi Hari Ini"
            value={stats.today}
            icon={CheckCircle}
            color="#10B981"
          />
          <StatCard
            title="Minggu Ini"
            value={stats.thisWeek}
            icon={Calendar}
            color="#F59E0B"
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Data Absensi</h2>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Memuat data...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      QR Code ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Waktu Scan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lokasi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Foto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceData.map((item) => {
                    const dateTime = formatDateTime(item.scan_time);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {item.user_id}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.qr_code_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.status === 'present' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                            <span className="mr-3">{dateTime.date}</span>
                            <Clock className="w-4 h-4 text-gray-400 mr-1" />
                            <span>{dateTime.time}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                            <span className="truncate max-w-32" title={formatCoordinate(item.latitude, item.longitude)}>
                              {formatCoordinate(item.latitude, item.longitude)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.photo_url ? (
                            <button
                              onClick={() => setSelectedImage(item.photo_url)}
                              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Lihat Foto
                            </button>
                          ) : (
                            <span className="text-gray-400">Tidak ada foto</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900 transition-colors p-1 rounded hover:bg-red-50"
                            title="Hapus data"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {attendanceData.length === 0 && !loading && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Belum ada data absensi</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Foto Absensi</h3>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-4">
              <img
                src={selectedImage}
                alt="Foto Absensi"
                className="max-w-full h-auto rounded"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkZvdG8gdGlkYWsgZGFwYXQgZGltdWF0PC90ZXh0Pjwvc3ZnPg==';
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceDashboard;
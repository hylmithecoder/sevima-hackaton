import React, { useState, useEffect } from 'react';
import { QrCode, MapPin, Clock, Calendar, Plus, Save, RefreshCw, AlertCircle, CheckCircle, Settings, Shield } from 'lucide-react';

const AddQRCodePanel = () => {
  const [formData, setFormData] = useState({
    code: '',
    location_id: '',
    shift_id: '',
    expired_at: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [qrList, setQrList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [locations, setLocations] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [fetchingData, setFetchingData] = useState(false);

  // Generate random QR code
  const generateQRCode = () => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    setFormData(prev => ({
      ...prev,
      code: `QR${timestamp}${randomStr}`.toUpperCase()
    }));
  };

  const fetchDropdownData = async () => {
      setFetchingData(true);
      try {
        // Fetch locations
        const locationsRes = await fetch("https://ilmeee.com/api_sevima/locations/");
        if (locationsRes.ok) {
          const locationsData = await locationsRes.json();
          console.log(locationsData);
          setLocations(locationsData);
        }

        // Fetch shifts  
        const shiftsRes = await fetch("https://ilmeee.com/api_sevima/shifts/");
        if (shiftsRes.ok) {
          const shiftsData = await shiftsRes.json();
          console.log(shiftsData);
          setShifts(shiftsData);
        }
      } catch (err) {
        console.error("Error fetching dropdown data:", err);
        // Fallback data jika API tidak tersedia
        setLocations([
          { id: 1, name: "Kantor Pusat - Lantai 1" },
          { id: 2, name: "Kantor Pusat - Lantai 2" },
          { id: 3, name: "Kantor Pusat - Lantai 3" },
          { id: 4, name: "Gedung A - Lobby" },
          { id: 5, name: "Gedung B - Entrance" },
          { id: 6, name: "Warehouse - Main Gate" },
          { id: 7, name: "Security Post" },
          { id: 8, name: "Parking Area" }
        ]);
        
        setShifts([
          { id: 1, name: "Shift Pagi (07:00 - 15:00)" },
          { id: 2, name: "Shift Siang (15:00 - 23:00)" },
          { id: 3, name: "Shift Malam (23:00 - 07:00)" },
          { id: 4, name: "Shift Normal (08:00 - 17:00)" },
          { id: 5, name: "Shift Weekend (09:00 - 18:00)" }
        ]);
      } finally {
        setFetchingData(false);
      }
    };

  // Fetch existing QR codes
  const fetchQRCodes = async () => {
    setLoadingList(true);
    try {
      const response = await fetch('https://ilmeee.com/api_sevima/qr_code/');
      if (response.ok) {
        const data = await response.json();
        setQrList(data);
      }
    } catch (err) {
      console.error('Error fetching QR codes:', err);
    } finally {
      setLoadingList(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Current form data:', formData);

    // Validation
    const emptyFields = [];
    if (!formData.code) emptyFields.push('Kode QR');
    if (!formData.location_id) emptyFields.push('Lokasi');
    if (!formData.shift_id) emptyFields.push('Shift');
    if (!formData.expired_at) emptyFields.push('Tanggal Kedaluwarsa');

    if (emptyFields.length > 0) {
        setError(`Field berikut harus diisi: ${emptyFields.join(', ')}`);
        return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
        // Buat FormData object
        const form = new FormData();
        form.append('code', formData.code);
        form.append('location_id', formData.location_id);
        form.append('shift_id', formData.shift_id);
        form.append('expired_at', formData.expired_at);
        form.append('created_at', new Date().toISOString());

        const response = await fetch('https://ilmeee.com/api_sevima/qr_code/', {
            method: 'POST',
            body: form // Kirim sebagai form data
        });

        const responseData = await response.json();
        console.log('Response:', responseData);

        if (responseData.status === 'success') {
            setSuccess(true);
            setFormData({
                code: '',
                location_id: '',
                shift_id: '',
                expired_at: ''
            });
            fetchQRCodes();
            setTimeout(() => setSuccess(false), 3000);
        } else {
            throw new Error(responseData.message || 'Gagal menambahkan QR code');
        }
    } catch (err) {
        console.error('Submit error:', err);
        setError(err.message);
    } finally {
        setLoading(false);
    }
};

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Changing ${name} to:`, value); // Debug log
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      console.log('New form data:', newData); // Debug log
      return newData;
    });
  };

  // Set default expiration (24 hours from now)
  const setDefaultExpiration = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isoString = tomorrow.toISOString().slice(0, 16);
    setFormData(prev => ({
      ...prev,
      expired_at: isoString
    }));
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('id-ID');
  };

  useEffect(() => {
    fetchDropdownData();
    fetchQRCodes();
    generateQRCode();
    setDefaultExpiration();
    
    // Set initial form data
    setFormData(prev => ({
      ...prev,
      location_id: locations[0]?.id || '',
      shift_id: shifts[0]?.id || ''
    }));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br lg:pl-64 from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="bg-indigo-600 p-3 rounded-lg mr-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-gray-600 mt-1">Kelola QR Code untuk sistem absensi</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Add QR Form */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
              <div className="flex items-center">
                <Plus className="w-6 h-6 text-white mr-2" />
                <h2 className="text-xl font-bold text-white">Tambah QR Code Baru</h2>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Success Message */}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-green-700 font-medium">QR Code berhasil ditambahkan!</span>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}

              {/* QR Code Field */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <QrCode className="w-4 h-4 mr-2" />
                  Kode QR
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Masukkan kode QR"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateQRCode}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                    title="Generate kode QR otomatis"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500">Klik tombol refresh untuk generate kode otomatis</p>
              </div>

              {/* Location ID Field */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <MapPin className="w-4 h-4 mr-2" />
                  ID Lokasi
                </label>
                <select
                  name="location_id"
                  value={formData.location_id}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="">Pilih Lokasi</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Shift ID Field */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <Clock className="w-4 h-4 mr-2" />
                  ID Shift
                </label>
                <select
                  name="shift_id"
                  value={formData.shift_id}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="">Pilih Shift</option>
                  {shifts.map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.name}
                    </option>
                  ))}
              </select>
              </div>

              {/* Expiration Field */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <Calendar className="w-4 h-4 mr-2" />
                  Tanggal Kedaluwarsa
                </label>
                <div className="flex space-x-2">
                  <input
                    type="datetime-local"
                    name="expired_at"
                    value={formData.expired_at}
                    onChange={handleChange}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={setDefaultExpiration}
                    className="px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                  >
                    +24h
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Simpan QR Code
                  </>
                )}
                </button>
              </div>
            </div>
          </div>

          {/* QR Code List */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Settings className="w-6 h-6 text-white mr-2" />
                  <h2 className="text-xl font-bold text-white">QR Code Terdaftar</h2>
                </div>
                <button
                  onClick={fetchQRCodes}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-black px-3 py-1 rounded-lg transition-all flex items-center text-sm"
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${loadingList ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            <div className="p-6">
              {loadingList ? (
                <div className="flex justify-center items-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
                  <span className="ml-2 text-gray-600">Memuat data...</span>
                </div>
              ) : qrList.length === 0 ? (
                <div className="text-center py-8">
                  <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Belum ada QR code terdaftar</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {qrList.slice(0, 10).map((qr, index) => (
                    <div key={qr.id || index} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="bg-purple-100 p-2 rounded-lg mr-3">
                            <QrCode className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{qr.code || qr.qr_code_id}</p>
                            <p className="text-sm text-gray-600">
                              Lokasi: {qr.location_id} | Shift: {qr.shift_id}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {qr.expired_at ? `Expired: ${formatDate(qr.expired_at)}` : 
                             qr.scan_time ? `Scan: ${formatDate(qr.scan_time)}` : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {qrList.length > 10 && (
                    <div className="text-center pt-4">
                      <span className="text-sm text-gray-500">
                        Dan {qrList.length - 10} QR code lainnya...
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
            <div className="flex items-center">
              <div className="bg-indigo-100 p-3 rounded-full mr-4">
                <QrCode className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total QR Codes</p>
                <p className="text-2xl font-bold text-gray-900">{qrList.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Active Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {qrList.filter(qr => {
                    const today = new Date().toDateString();
                    return qr.scan_time && new Date(qr.scan_time).toDateString() === today;
                  }).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full mr-4">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Recent Scans</p>
                <p className="text-2xl font-bold text-gray-900">
                  {qrList.filter(qr => {
                    if (!qr.scan_time) return false;
                    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
                    return new Date(qr.scan_time) > oneHourAgo;
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default AddQRCodePanel;
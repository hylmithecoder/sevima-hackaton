import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Eye, 
  EyeOff, 
  Camera, 
  Save, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Search,
  Filter,
  Edit,
  Trash2,
  Crown,
  ShieldCheck
} from 'lucide-react';

const UserManagementPanel = () => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: '',
    photo_url: ''
  });
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Fetch users from API
  const fetchUsers = async () => {
    setLoadingList(true);
    try {
      const response = await fetch('https://ilmeee.com/api_sevima/data_user/');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingList(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.username || !formData.password || !formData.role) {
      setError('Semua field wajib kecuali foto harus diisi');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('https://ilmeee.com/api_sevima/data_user/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          created_at: new Date().toISOString()
        })
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({
          name: '',
          username: '',
          password: '',
          role: '',
          photo_url: ''
        });
        fetchUsers();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal menambahkan user');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validasi file
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        setError('Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP');
        return;
      }

      if (file.size > maxSize) {
        setError('Ukuran file terlalu besar. Maksimal 5MB');
        return;
      }

      setPhotoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Clear photo_url when file is selected
      setFormData(prev => ({
        ...prev,
        photo_url: ''
      }));
    }
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  // Delete user
  const handleDelete = async (userId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini?')) return;
    
    try {
      const response = await fetch(`https://ilmeee.com/api_sevima/data_user/?id=${userId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          setUsers(prev => prev.filter(user => user.id !== userId));
          alert('User berhasil dihapus');
        } else {
          throw new Error(result.message || 'Gagal menghapus user');
        }
      } else {
        throw new Error('Gagal menghapus user');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Generate username from name
  const generateUsername = () => {
    if (formData.name) {
      const username = formData.name
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      setFormData(prev => ({
        ...prev,
        username: username + Math.floor(Math.random() * 100)
      }));
    }
  };

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get role badge
  const getRoleBadge = (role) => {
    const badges = {
      admin: {
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: Crown
      },
      satpam: {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: ShieldCheck
      }
    };
    
    const badge = badges[role] || badges.satpam;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {role?.charAt(0).toUpperCase() + role?.slice(1)}
      </span>
    );
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    satpams: users.filter(u => u.role === 'satpam').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br lg:pl-64 from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-xl mr-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600 mt-1">Kelola pengguna admin dan satpam</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
                Super Admin
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full mr-4">
                <Crown className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Administrators</p>
                <p className="text-3xl font-bold text-gray-900">{stats.admins}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <ShieldCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Security Guards</p>
                <p className="text-3xl font-bold text-gray-900">{stats.satpams}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Add User Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center">
                <UserPlus className="w-6 h-6 text-white mr-2" />
                <h2 className="text-xl font-bold text-white">Tambah User Baru</h2>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Success Message */}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <span className="text-green-700 font-medium">User berhasil ditambahkan!</span>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}

              {/* Name Field */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <Users className="w-4 h-4 mr-2" />
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>

              {/* Username Field */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <Shield className="w-4 h-4 mr-2" />
                  Username
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Username untuk login"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateUsername}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    title="Generate username dari nama"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <Eye className="w-4 h-4 mr-2" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Minimal 6 karakter"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Role Field */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <Crown className="w-4 h-4 mr-2" />
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="">Pilih Role</option>
                  <option value="admin">👑 Administrator</option>
                  <option value="satpam">🛡️ Security Guard</option>
                </select>
              </div>

              {/* Photo Upload Field */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <Camera className="w-4 h-4 mr-2" />
                  Foto Profil
                </label>
                
                {/* Photo Preview */}
                {(photoPreview || formData.photo_url) && (
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <img
                        src={photoPreview || formData.photo_url}
                        alt="Preview"
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoPreview(null);
                          setPhotoFile(null);
                          setFormData(prev => ({ ...prev, photo_url: '' }));
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {/* File Upload */}
                  <div>
                    <label className="block">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer">
                        <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <span className="text-sm text-gray-600">
                          Klik untuk upload foto atau drag & drop
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Format: JPG, PNG, GIF, WebP. Maksimal 5MB
                    </p>
                  </div>

                  {/* URL Alternative */}
                  <div className="relative">
                    <div className="flex items-center">
                      <div className="flex-1 border-t border-gray-300"></div>
                      <span className="px-3 text-xs text-gray-500 bg-white">atau</span>
                      <div className="flex-1 border-t border-gray-300"></div>
                    </div>
                  </div>

                  <input
                    type="url"
                    name="photo_url"
                    value={formData.photo_url}
                    onChange={handleChange}
                    disabled={!!photoFile}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Simpan User
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Users List */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="w-6 h-6 text-white mr-2" />
                  <h2 className="text-xl font-bold text-white">Daftar Users</h2>
                </div>
                <button
                  onClick={fetchUsers}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-black px-3 py-1 rounded-lg transition-all flex items-center text-sm"
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${loadingList ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="p-4 bg-gray-50 border-b">
              <div className="flex space-x-4">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Cari nama atau username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <Filter className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="all">Semua Role</option>
                    <option value="admin">Admin</option>
                    <option value="satpam">Satpam</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6">
              {loadingList ? (
                <div className="flex justify-center items-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Memuat users...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm || roleFilter !== 'all' ? 'Tidak ada user yang sesuai filter' : 'Belum ada user terdaftar'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          <div className="flex-shrink-0 mr-4">
                            {user.photo_url ? (
                              <img
                                src={"https://ilmeee.com/api_sevima/"+user.photo_url}
                                alt={user.name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow cursor-pointer"
                                onClick={() => setSelectedImage(user.photo_url)}
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                {user.name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-gray-900">{user.name}</h3>
                              {getRoleBadge(user.role)}
                            </div>
                            <p className="text-sm text-gray-600">@{user.username}</p>
                            <p className="text-xs text-gray-500">
                              Bergabung: {user.created_at ? formatDate(user.created_at) : 'Tidak diketahui'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title="Hapus user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Foto Profile</h3>
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
                alt="Profile"
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

export default UserManagementPanel;
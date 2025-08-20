<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header("Content-Type: application/json");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

include "../db.php";

$method = $_SERVER['REQUEST_METHOD'];

// Handle PUT via POST with _method parameter
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['_method']) && $_POST['_method'] === 'PUT') {
    $method = 'PUT';
}

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $id = intval($_GET['id']);
            $sql = "SELECT * FROM users WHERE id=$id";
            $result = $conn->query($sql);
            if ($result && $result->num_rows > 0) {
                echo json_encode($result->fetch_assoc());
            } else {
                echo json_encode(["status" => "error", "message" => "User tidak ditemukan"]);
            }
        }
        else if (isset($_GET['username'])) {
            $username = $conn->real_escape_string($_GET['username']);
            $sql = "SELECT * FROM users WHERE username='$username'";
            $result = $conn->query($sql);
            if ($result && $result->num_rows > 0) {
                echo json_encode($result->fetch_assoc());
            } else {
                echo json_encode(["status" => "error", "message" => "User tidak ditemukan"]);
            }
        }
         else {
            $sql = "SELECT * FROM users ORDER BY created_at DESC";
            $result = $conn->query($sql);
            $rows = [];
            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    $rows[] = $row;
                }
            }
            echo json_encode($rows);
        }
        break;

    case 'POST':
        // Ambil data dari JSON atau form-data
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Jika JSON
        if ($input) {
            $name = $conn->real_escape_string($input['name']);
            $username = $conn->real_escape_string($input['username']);
            $password = $conn->real_escape_string($input['password']);
            $role = $conn->real_escape_string($input['role']);
            $photo_url = isset($input['photo_url']) ? $conn->real_escape_string($input['photo_url']) : '';
            $created_at = isset($input['created_at']) ? $conn->real_escape_string($input['created_at']) : date('Y-m-d H:i:s');
        } 
        // Jika form-data
        else {
            $name = $conn->real_escape_string($_POST['name']);
            $username = $conn->real_escape_string($_POST['username']);
            $password = $conn->real_escape_string($_POST['password']);
            $role = $conn->real_escape_string($_POST['role']);
            $photo_url = isset($_POST['photo_url']) ? $conn->real_escape_string($_POST['photo_url']) : '';
            $created_at = isset($_POST['created_at']) ? $conn->real_escape_string($_POST['created_at']) : date('Y-m-d H:i:s');

            // Handle upload file untuk photo
            if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
                $uploadDir = "uploads/users/";
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }
                
                // Validasi file
                $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                $fileType = $_FILES['photo']['type'];
                $maxSize = 5 * 1024 * 1024; // 5MB
                
                if (!in_array($fileType, $allowedTypes)) {
                    echo json_encode(["status" => "error", "message" => "Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP"]);
                    exit;
                }
                
                if ($_FILES['photo']['size'] > $maxSize) {
                    echo json_encode(["status" => "error", "message" => "Ukuran file terlalu besar. Maksimal 5MB"]);
                    exit;
                }
                
                $fileName = time() . "_" . uniqid() . "_" . basename($_FILES['photo']['name']);
                $targetFile = $uploadDir . $fileName;

                if (move_uploaded_file($_FILES['photo']['tmp_name'], $targetFile)) {
                    // Buat URL lengkap untuk akses foto
                    $baseURL = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://" . $_SERVER['HTTP_HOST'];
                    $currentDir = dirname($_SERVER['REQUEST_URI']);
                    $photo_url = $baseURL . $currentDir . "/" . $targetFile;
                }
            }
        }

        // Validasi input
        if (empty($name) || empty($username) || empty($password) || empty($role)) {
            echo json_encode(["status" => "error", "message" => "Semua field wajib diisi kecuali foto"]);
            exit;
        }

        // Validasi role
        if (!in_array($role, ['admin', 'satpam'])) {
            echo json_encode(["status" => "error", "message" => "Role harus admin atau satpam"]);
            exit;
        }

        // Validasi password
        if (strlen($password) < 6) {
            echo json_encode(["status" => "error", "message" => "Password minimal 6 karakter"]);
            exit;
        }

        // Cek apakah username sudah ada
        $checkUsername = "SELECT id FROM users WHERE username='$username'";
        $checkResult = $conn->query($checkUsername);
        if ($checkResult && $checkResult->num_rows > 0) {
            echo json_encode(["status" => "error", "message" => "Username sudah digunakan"]);
            exit;
        }

        // Hash password
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        $sql = "INSERT INTO users (name, username, password, role, photo_url, created_at) 
                VALUES ('$name', '$username', '$hashedPassword', '$role', '$photo_url', '$created_at')";
        
        if ($conn->query($sql)) {
            $userId = $conn->insert_id;
            // Return user data yang baru dibuat
            $getUserSql = "SELECT * FROM users WHERE id=$userId";
            $userResult = $conn->query($getUserSql);
            $userData = $userResult->fetch_assoc();
            
            echo json_encode([
                "status" => "success", 
                "message" => "User berhasil ditambahkan",
                "data" => $userData
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal menambahkan user: " . $conn->error]);
        }
        break;

    case 'PUT':
        if (!isset($_GET['id'])) {
            echo json_encode(["status" => "error", "message" => "ID wajib diisi"]);
            exit;
        }
        $id = intval($_GET['id']);

        // Ambil data dari JSON atau form-data
        $input = json_decode(file_get_contents('php://input'), true);
        
        if ($input) {
            $name = $conn->real_escape_string($input['name']);
            $username = $conn->real_escape_string($input['username']);
            $role = $conn->real_escape_string($input['role']);
            $photo_url = isset($input['photo_url']) ? $conn->real_escape_string($input['photo_url']) : '';
            $password = isset($input['password']) ? $conn->real_escape_string($input['password']) : '';
        } else {
            $name = $conn->real_escape_string($_POST['name']);
            $username = $conn->real_escape_string($_POST['username']);
            $role = $conn->real_escape_string($_POST['role']);
            $photo_url = isset($_POST['photo_url']) ? $conn->real_escape_string($_POST['photo_url']) : '';
            $password = isset($_POST['password']) ? $conn->real_escape_string($_POST['password']) : '';

            // Handle upload file baru
            if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
                $uploadDir = "uploads/users/";
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }
                
                $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                $fileType = $_FILES['photo']['type'];
                $maxSize = 5 * 1024 * 1024; // 5MB
                
                if (!in_array($fileType, $allowedTypes)) {
                    echo json_encode(["status" => "error", "message" => "Format file tidak didukung"]);
                    exit;
                }
                
                if ($_FILES['photo']['size'] > $maxSize) {
                    echo json_encode(["status" => "error", "message" => "Ukuran file terlalu besar"]);
                    exit;
                }
                
                $fileName = time() . "_" . uniqid() . "_" . basename($_FILES['photo']['name']);
                $targetFile = $uploadDir . $fileName;

                if (move_uploaded_file($_FILES['photo']['tmp_name'], $targetFile)) {
                    $baseURL = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://" . $_SERVER['HTTP_HOST'];
                    $currentDir = dirname($_SERVER['REQUEST_URI']);
                    $photo_url = $baseURL . $currentDir . "/" . $targetFile;
                }
            }
        }

        // Validasi
        if (empty($name) || empty($username) || empty($role)) {
            echo json_encode(["status" => "error", "message" => "Name, username, dan role wajib diisi"]);
            exit;
        }

        if (!in_array($role, ['admin', 'satpam'])) {
            echo json_encode(["status" => "error", "message" => "Role harus admin atau satpam"]);
            exit;
        }

        // Cek username duplikat (kecuali untuk user ini sendiri)
        $checkUsername = "SELECT id FROM users WHERE username='$username' AND id != $id";
        $checkResult = $conn->query($checkUsername);
        if ($checkResult && $checkResult->num_rows > 0) {
            echo json_encode(["status" => "error", "message" => "Username sudah digunakan"]);
            exit;
        }

        // Build SQL update
        $updateFields = "name='$name', username='$username', role='$role'";
        
        if (!empty($photo_url)) {
            $updateFields .= ", photo_url='$photo_url'";
        }
        
        if (!empty($password)) {
            if (strlen($password) < 6) {
                echo json_encode(["status" => "error", "message" => "Password minimal 6 karakter"]);
                exit;
            }
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            $updateFields .= ", password='$hashedPassword'";
        }

        $sql = "UPDATE users SET $updateFields WHERE id=$id";

        if ($conn->query($sql)) {
            // Return updated user data
            $getUserSql = "SELECT * FROM users WHERE id=$id";
            $userResult = $conn->query($getUserSql);
            $userData = $userResult->fetch_assoc();
            
            echo json_encode([
                "status" => "success", 
                "message" => "User berhasil diupdate",
                "data" => $userData
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal mengupdate user: " . $conn->error]);
        }
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            echo json_encode(["status" => "error", "message" => "ID wajib diisi"]);
            exit;
        }
        $id = intval($_GET['id']);
        
        // Ambil data user untuk hapus foto jika ada
        $getUserSql = "SELECT photo_url FROM users WHERE id=$id";
        $userResult = $conn->query($getUserSql);
        if ($userResult && $userResult->num_rows > 0) {
            $userData = $userResult->fetch_assoc();
            
            // Hapus file foto jika ada dan bukan URL eksternal
            if (!empty($userData['photo_url']) && strpos($userData['photo_url'], 'uploads/') !== false) {
                $photoPath = str_replace($_SERVER['HTTP_HOST'], '', $userData['photo_url']);
                $photoPath = ltrim(parse_url($photoPath, PHP_URL_PATH), '/');
                if (file_exists($photoPath)) {
                    unlink($photoPath);
                }
            }
        }
        
        $sql = "DELETE FROM users WHERE id=$id";

        if ($conn->query($sql)) {
            if ($conn->affected_rows > 0) {
                echo json_encode(["status" => "success", "message" => "User berhasil dihapus"]);
            } else {
                echo json_encode(["status" => "error", "message" => "User tidak ditemukan"]);
            }
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal menghapus user: " . $conn->error]);
        }
        break;

    default:
        echo json_encode(["status" => "error", "message" => "Metode HTTP tidak didukung"]);
        break;
}

$conn->close();
?>
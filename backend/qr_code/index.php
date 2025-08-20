<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Max-Age: 3600");
header("Content-Type: application/json; charset=UTF-8");

// Handle OPTIONS preflight request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}
include "../db.php";

$method = $_SERVER['REQUEST_METHOD'];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['_method']) && $_POST['_method'] === 'PUT') {
    $method = 'PUT';
}

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $id = intval($_GET['id']);
            $sql = "SELECT * FROM qr_codes WHERE id=$id";
            $result = $conn->query($sql);
            echo json_encode($result->fetch_assoc());
        } else {
            $sql = "SELECT qr_codes.id, qr_codes.code, locations.name as location, shifts.name as shift, qr_codes.created_at, qr_codes.expired_at, locations.latitude as latitude, locations.longitude as longitude, locations.radius_m as radius FROM qr_codes INNER JOIN locations, shifts WHERE qr_codes.location_id = locations.id AND qr_codes.shift_id = shifts.id";
            $result = $conn->query($sql);
            $rows = [];
            while ($row = $result->fetch_assoc()) {
                $rows[] = $row;
            }
            echo json_encode($rows);
        }
        break;

        // Backend PHP seharusnya handle seperti ini:
    case 'POST':
        // Validasi input yang diperlukan
        if (!isset($_POST['code']) || !isset($_POST['location_id']) || !isset($_POST['shift_id']) || !isset($_POST['expired_at'])) {
            echo json_encode(["status" => "error", "message" => "Field code, location_id, shift_id, dan expired_at wajib diisi"]);
            exit;
        }

        $code = $conn->real_escape_string($_POST['code']);
        $location_id = intval($_POST['location_id']);
        $shift_id = intval($_POST['shift_id']);
        $expired_at = $conn->real_escape_string($_POST['expired_at']);
        
        // Set created_at ke waktu sekarang
        $created_at = date('Y-m-d H:i:s');

        // Insert QR code baru
        $sql = "INSERT INTO qr_codes (code, location_id, shift_id, created_at, expired_at) 
                VALUES ('$code', $location_id, $shift_id, '$created_at', '$expired_at')";
        
        if ($conn->query($sql)) {
            $new_id = $conn->insert_id;
            
            // Ambil data QR yang baru dibuat dengan JOIN untuk response
            $get_new_qr = "SELECT qr_codes.id, qr_codes.code, locations.name as location, shifts.name as shift, qr_codes.created_at, qr_codes.expired_at, locations.latitude as latitude, locations.longitude as longitude, locations.radius_m as radius 
                           FROM qr_codes 
                           INNER JOIN locations ON qr_codes.location_id = locations.id 
                           INNER JOIN shifts ON qr_codes.shift_id = shifts.id 
                           WHERE qr_codes.id = $new_id";
            
            $result = $conn->query($get_new_qr);
            $new_qr_data = $result->fetch_assoc();
            
            echo json_encode([
                "status" => "success", 
                "message" => "QR Code berhasil ditambahkan",
                "id" => $new_id,
                "data" => $new_qr_data
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal menambahkan QR Code: " . $conn->error]);
        }
        break;

    case 'PUT':
        if (!isset($_GET['id'])) {
            echo json_encode(["status" => "error", "message" => "ID wajib diisi"]);
            exit;
        }
        $id = intval($_GET['id']);

        // Karena PUT form-data agak tricky, biasanya frontend kirim via POST + _method=PUT
        // Jadi kita pakai $_POST tetap
        $nama          = $conn->real_escape_string($_POST['nama']);
        $kelas         = $conn->real_escape_string($_POST['kelas']);
        $tanggal_lahir = $conn->real_escape_string($_POST['tanggal_lahir']);
        $jurusan       = $conn->real_escape_string($_POST['jurusan']);
        $agama         = $conn->real_escape_string($_POST['agama']);
        $alamat        = $conn->real_escape_string($_POST['alamat']);

        // Handle upload file (jika ada)
        $foto_path = "";
        if (isset($_FILES['foto']) && $_FILES['foto']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = "uploads/";
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            $fileName = time() . "_" . basename($_FILES['foto']['name']);
            $targetFile = $uploadDir . $fileName;

            if (move_uploaded_file($_FILES['foto']['tmp_name'], $targetFile)) {
                $foto_path = $targetFile;
            }
        }

        // Kalau ada foto baru, update dengan foto_path
        if ($foto_path != "") {
            $sql = "UPDATE tbl_siswa 
                    SET nama='$nama', kelas='$kelas', tanggal_lahir='$tanggal_lahir',
                        jurusan='$jurusan', foto_path='$foto_path', agama='$agama', alamat='$alamat'
                    WHERE id=$id";
        } else {
            $sql = "UPDATE tbl_siswa 
                    SET nama='$nama', kelas='$kelas', tanggal_lahir='$tanggal_lahir',
                        jurusan='$jurusan', agama='$agama', alamat='$alamat'
                    WHERE id=$id";
        }

        if ($conn->query($sql)) {
            echo json_encode(["status" => "success"]);
        } else {
            echo json_encode(["status" => "error", "message" => $conn->error]);
        }
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            echo json_encode(["status" => "error", "message" => "ID wajib diisi"]);
            exit;
        }
        $id = intval($_GET['id']);
        $sql = "DELETE FROM qr_codes WHERE id=$id";

        if ($conn->query($sql)) {
            echo json_encode(["status" => "success"]);
        } else {
            echo json_encode(["status" => "error", "message" => $conn->error]);
        }
        break;

    default:
        echo json_encode(["status" => "error", "message" => "Metode tidak didukung"]);
        break;
}

$conn->close();

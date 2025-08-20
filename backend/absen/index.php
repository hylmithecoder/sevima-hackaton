<?php 
header('Access-Control-Allow-Origin: *'); 
header('Content-Type: application/json; charset=utf-8'); 
header('Access-Control-Allow-Methods: POST, GET, OPTIONS'); 
header('Access-Control-Allow-Headers: Content-Type'); 

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include "../db.php";  

$method = $_SERVER['REQUEST_METHOD'];  

try {
    switch ($method) {
        case 'POST':
            // Validasi input
            if (!isset($_POST['user_id']) || !isset($_POST['qr_code_content'])) {
                echo json_encode([
                    "status" => "error", 
                    "message" => "user_id dan qr_code_content wajib diisi"
                ]);
                exit;
            }

            $user_id = $conn->real_escape_string($_POST['user_id']);
            $qr_code_content = $conn->real_escape_string($_POST['qr_code_content']);
            $status = $conn->real_escape_string($_POST['status'] ?? 'on_time');
            $scan_time = $conn->real_escape_string($_POST['scan_time']);
            $latitude = $conn->real_escape_string($_POST['latitude']);
            $longitude = $conn->real_escape_string($_POST['longitude']);
            $photo_url = $conn->real_escape_string($_POST['photo_url'] ?? '/uploads/default.png');
            
            // 1. Cek apakah QR code sudah ada di tabel qr_codes
            $checkQR = "SELECT id FROM qr_codes WHERE content = '$qr_code_content' OR id = '$qr_code_content'";
            $resultQR = $conn->query($checkQR);
            
            if ($resultQR->num_rows > 0) {
                // QR Code sudah ada, ambil ID-nya
                $qrRow = $resultQR->fetch_assoc();
                $qr_code_id = $qrRow['id'];
            } else {
                // QR Code belum ada, insert dulu ke tabel qr_codes
                $insertQR = "INSERT INTO qr_codes (content, created_at) VALUES ('$qr_code_content', NOW())";
                if ($conn->query($insertQR)) {
                    $qr_code_id = $conn->insert_id;
                } else {
                    echo json_encode([
                        "status" => "error", 
                        "message" => "Gagal menyimpan QR code: " . $conn->error
                    ]);
                    exit;
                }
            }
            
            // 2. Insert ke tabel absensi dengan qr_code_id yang valid
            $sql = "INSERT INTO absensi (user_id, qr_code_id, status, scan_time, latitude, longitude, photo_url) 
                    VALUES ('$user_id', '$qr_code_id', '$status', '$scan_time', '$latitude', '$longitude', '$photo_url')";
            
            if ($conn->query($sql)) {
                echo json_encode([
                    "status" => "success", 
                    "message" => "Absensi berhasil disimpan",
                    "data" => [
                        "absensi_id" => $conn->insert_id,
                        "qr_code_id" => $qr_code_id,
                        "user_id" => $user_id,
                        "qr_content" => $qr_code_content
                    ]
                ]);
            } else {
                echo json_encode([
                    "status" => "error", 
                    "message" => "Gagal menyimpan absensi: " . $conn->error
                ]);
            }
            break;
            
        default:
            echo json_encode([
                "status" => "error", 
                "message" => "Metode tidak didukung"
            ]);
            break;
    }
} catch (Exception $e) {
    echo json_encode([
        "status" => "error", 
        "message" => "Server error: " . $e->getMessage()
    ]);
}

$conn->close();
?>
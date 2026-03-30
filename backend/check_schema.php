<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=mukalla_sea_port_management', 'root', '');
$stmt = $pdo->query('DESCRIBE anchorage_requests');
$cols = $stmt->fetchAll(PDO::FETCH_COLUMN);
file_put_contents('schema_result.json', json_encode($cols));

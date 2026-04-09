=== VESSELS ===
ID:1 | Name:desert vessel | Status:awaiting | Type:general
Total: 1

=== CONTAINERS COLUMNS ===
id (bigint unsigned)
vessel_id (bigint unsigned)
manifest_file_path (varchar(255))
port_of_loading (varchar(255))
arrival_date (date)
description_of_goods (text)
storage_type (enum('chemical','frozen','dry'))
consignee_name (varchar(255))
consignee_phone (varchar(255))
trader_user_id (bigint unsigned)
status (enum('pending','in_wharf','cleared'))
extraction_status (enum('success','incomplete','failed'))
extraction_errors (json)
created_at (timestamp)
updated_at (timestamp)
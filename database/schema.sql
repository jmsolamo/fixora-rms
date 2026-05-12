-- Optional: create the database if it does not exist yet.
CREATE DATABASE IF NOT EXISTS fixora_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE fixora_db;

-- The app uses your existing `users` table (see `database/fixora_db.sql` for structure).
-- Login reads `username` and `password` (bcrypt). Do not recreate `users` here.

-- --------------------------------------------------------

--
-- Table structure for table `itemTools`
--

CREATE TABLE IF NOT EXISTS `itemTools` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `PartNumber` varchar(100) NOT NULL,
  `PartDescription` text NOT NULL,
  `Unit` varchar(50) DEFAULT NULL,
  `Brand` varchar(100) DEFAULT NULL,
  `OEM` varchar(100) DEFAULT NULL,
  `TType` varchar(100) DEFAULT NULL,
  `ExtraDescription` text DEFAULT NULL,
  `Onhand` int DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `PartNumber` (`PartNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `item_inventory`
-- Each row represents a single physical unit of a tool.
-- ControlNumber = PartNumber (dashes removed) + "-" + zero-padded index (starting at 0000).
--

CREATE TABLE IF NOT EXISTS `item_inventory` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ControlNumber` varchar(150) NOT NULL,
  `PartNumber` varchar(100) NOT NULL,
  `PartDescription` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ControlNumber` (`ControlNumber`),
  KEY `idx_part` (`PartNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personnel`
--

CREATE TABLE IF NOT EXISTS `personnel` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `EmployeeCode` varchar(50) NOT NULL,
  `EmployeeName` varchar(255) NOT NULL,
  `Department` varchar(100) DEFAULT NULL,
  `Position` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `EmployeeCode` (`EmployeeCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `department`
--

CREATE TABLE IF NOT EXISTS `department` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `DepartmentName` varchar(100) NOT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `DepartmentName` (`DepartmentName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `repair_request`
-- Request for Repair (Tools / Equipment / Machinery)
--

CREATE TABLE IF NOT EXISTS `repair_request` (
  `id` int NOT NULL AUTO_INCREMENT,
  `form_no` varchar(50) DEFAULT NULL,
  `form_date` date NOT NULL,
  `to_purchase` tinyint(1) NOT NULL DEFAULT 0,
  `for_filing` tinyint(1) NOT NULL DEFAULT 0,
  `part_number` varchar(100) DEFAULT NULL,
  `brand_model` varchar(255) DEFAULT NULL,
  `quantity` varchar(50) DEFAULT NULL,
  `tool_description` text,
  `control_number` varchar(150) DEFAULT NULL,
  `utilization` varchar(20) DEFAULT NULL COMMENT 'site or shop',
  `service_priority` varchar(20) DEFAULT NULL COMMENT 'high, medium, low',
  `low_repair_date` date DEFAULT NULL,
  `jo_no` varchar(100) DEFAULT NULL,
  `jo_customer` varchar(255) DEFAULT NULL,
  `jo_desc` text,
  `faults_json` json DEFAULT NULL,
  `summary_problems` text,
  `requester_name` varchar(255) DEFAULT NULL,
  `designation` varchar(150) DEFAULT NULL,
  `bay_section` varchar(150) DEFAULT NULL,
  `foreman` varchar(255) DEFAULT NULL,
  `requester_signature` varchar(255) DEFAULT NULL,
  `tool_keeper_name` varchar(255) DEFAULT NULL,
  `accepted_by` varchar(255) DEFAULT NULL,
  `service_findings` text,
  `corrective_reconditioned` tinyint(1) NOT NULL DEFAULT 0,
  `corrective_parts_replaced` tinyint(1) NOT NULL DEFAULT 0,
  `corrective_others` text,
  `parts_needed_json` json DEFAULT NULL,
  `final_repairable` tinyint(1) NOT NULL DEFAULT 0,
  `final_usable_parts_extraction` tinyint(1) NOT NULL DEFAULT 0,
  `final_disposal` tinyint(1) NOT NULL DEFAULT 0,
  `final_unit_replacement` tinyint(1) NOT NULL DEFAULT 0,
  `pr_no` varchar(100) DEFAULT NULL,
  `pr_date` date DEFAULT NULL,
  `requested_by` varchar(255) DEFAULT NULL,
  `prepared_by` varchar(255) DEFAULT NULL,
  `inspected_by` varchar(255) DEFAULT NULL,
  `approved_by` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_repair_form_date` (`form_date`),
  KEY `idx_repair_priority` (`service_priority`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;




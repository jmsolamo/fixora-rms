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


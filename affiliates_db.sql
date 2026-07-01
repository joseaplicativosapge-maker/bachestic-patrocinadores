-- --------------------------------------------------------
-- SISTEMA DE PATROCINADORES — Elite Sports Urban Hub
-- Ejecutar en la misma base de datos que bachestic_db.sql
-- --------------------------------------------------------

-- ─── TABLA: sponsors ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `sponsors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(20) NULL,
  `sponsor_code` VARCHAR(30) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `commission_percent` DECIMAL(5,2) DEFAULT 5.00,
  `status` ENUM('pending','active','rejected') DEFAULT 'active',
  `clicks` INT DEFAULT 0,
  `reset_token` VARCHAR(255) NULL,
  `reset_token_expires` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_sponsor_code` (`sponsor_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ─── TABLA: sponsor_product_commissions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS `sponsor_product_commissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sponsor_id` INT NOT NULL,
  `product_id` VARCHAR(50) NOT NULL,
  `commission_percent` DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  UNIQUE KEY `uq_sponsor_product` (`sponsor_id`, `product_id`),
  FOREIGN KEY (`sponsor_id`) REFERENCES `sponsors`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ─── ALTER: orders — agregar columna sponsor_code ─────────────────────────
ALTER TABLE `orders`
  ADD COLUMN `sponsor_code` VARCHAR(30) NULL;

-- ─── ALTER: order_items — agregar columnas de comisión ──────────────────────
ALTER TABLE `order_items`
  ADD COLUMN `commission_percent` DECIMAL(5,2) NULL,
  ADD COLUMN `commission_amount` DECIMAL(10,2) NULL;

-- ─── MIGRACIÓN: copiar datos de affiliates (si existe la tabla legacy) ─────
-- INSERT IGNORE INTO sponsors (id, name, email, phone, sponsor_code, password_hash, commission_percent, status, created_at, clicks)
--   SELECT id, name, email, phone, affiliate_code, password_hash, commission_percent, status, created_at, COALESCE(clicks, 0)
--   FROM affiliates;

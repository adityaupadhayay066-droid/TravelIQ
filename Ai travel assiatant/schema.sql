-- =========================================================================
-- TravelIQ Database Schema Blueprint (Advanced MySQL DDL Script)
-- =========================================================================

CREATE DATABASE IF NOT EXISTS `traveliq`;
USE `traveliq`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TRIGGER IF EXISTS `trg_after_booking_cancel`;
DROP PROCEDURE IF EXISTS `sp_process_refund`;
DROP VIEW IF EXISTS `view_payment_stats`;
DROP VIEW IF EXISTS `view_booking_summaries`;
DROP TABLE IF EXISTS `model_metrics`;
DROP TABLE IF EXISTS `recommendation_logs`;
DROP TABLE IF EXISTS `crowd_predictions`;
DROP TABLE IF EXISTS `occupancy_predictions`;
DROP TABLE IF EXISTS `delay_predictions`;
DROP TABLE IF EXISTS `fare_forecasts`;
DROP TABLE IF EXISTS `ai_predictions`;
DROP TABLE IF EXISTS `payment_logs`;
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `bookings`;
DROP TABLE IF EXISTS `routes`;
DROP TABLE IF EXISTS `carbon_emissions`;
DROP TABLE IF EXISTS `trips`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `stations`;
DROP TABLE IF EXISTS `train_fares`;
DROP TABLE IF EXISTS `trains`;
DROP TABLE IF EXISTS `destination_foods`;
DROP TABLE IF EXISTS `food_reviews`;
DROP TABLE IF EXISTS `food_favorites`;
DROP TABLE IF EXISTS `food_prices`;
DROP TABLE IF EXISTS `foods`;
DROP TABLE IF EXISTS `food_categories`;
DROP TABLE IF EXISTS `restaurants`;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users Table
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) DEFAULT 'User',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Trips Table
CREATE TABLE `trips` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `source` VARCHAR(100) NOT NULL,
  `destination` VARCHAR(100) NOT NULL,
  `departure_date` DATE DEFAULT NULL,
  `return_date` DATE DEFAULT NULL,
  `budget` DECIMAL(10, 2) DEFAULT NULL,
  `travel_mode` VARCHAR(100) DEFAULT 'Train',
  `predicted_price` DECIMAL(10, 2) DEFAULT NULL,
  `predicted_time` DECIMAL(5, 2) DEFAULT NULL,
  `ai_score` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_trips_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bookings Table
CREATE TABLE `bookings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `trip_id` INT NOT NULL,
  `source_station_code` VARCHAR(50) NOT NULL,
  `destination_station_code` VARCHAR(50) NOT NULL,
  `train_number` VARCHAR(50) DEFAULT NULL,
  `travel_class` VARCHAR(50) DEFAULT 'SL',
  `ticket_fare` INT DEFAULT 0,
  `seat_preference` VARCHAR(100) DEFAULT 'No Preference',
  `berth_preference` VARCHAR(100) DEFAULT 'No Preference',
  `adult_count` INT DEFAULT 1,
  `child_count` INT DEFAULT 0,
  `infant_count` INT DEFAULT 0,
  `senior_count` INT DEFAULT 0,
  `total_passengers` INT DEFAULT 1,
  `passengers` JSON DEFAULT NULL,
  `payment_status` VARCHAR(50) DEFAULT 'Paid',
  `booking_status` VARCHAR(50) DEFAULT 'Confirmed',
  `booking_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_bookings_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bookings_trip_id` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Transactions Table
CREATE TABLE `transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `transaction_id` VARCHAR(100) NOT NULL UNIQUE,
  `amount` DECIMAL(10, 2) NOT NULL,
  `payment_method` VARCHAR(100) NOT NULL,
  `status` VARCHAR(50) DEFAULT 'Success',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_transactions_booking_id` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_transactions_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Payment Logs Table
CREATE TABLE `payment_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `event_type` VARCHAR(100) NOT NULL, -- INITIATED, COMPLETED, FAILED, REFUNDED
  `payment_method` VARCHAR(100) DEFAULT NULL,
  `details` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_payment_logs_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Stations Table
CREATE TABLE `stations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `station_code` VARCHAR(50) NOT NULL UNIQUE,
  `station_name` VARCHAR(255) NOT NULL,
  `city` VARCHAR(255) DEFAULT NULL,
  `state` VARCHAR(255) DEFAULT NULL,
  `latitude` DECIMAL(10, 8) DEFAULT NULL,
  `longitude` DECIMAL(11, 8) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Trains Table
CREATE TABLE `trains` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `train_number` VARCHAR(50) NOT NULL UNIQUE,
  `train_name` VARCHAR(255) NOT NULL,
  `source_station` VARCHAR(50) DEFAULT NULL,
  `destination_station` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7.1 Train Fares Table
CREATE TABLE `train_fares` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `train_number` VARCHAR(50) NOT NULL,
  `class_code` VARCHAR(10) NOT NULL,
  `fare` INT NOT NULL,
  `distance` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_train_fares_train` FOREIGN KEY (`train_number`) REFERENCES `trains` (`train_number`) ON DELETE CASCADE,
  UNIQUE KEY `uk_train_class` (`train_number`, `class_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Restaurants Table
CREATE TABLE `restaurants` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `city` VARCHAR(255) NOT NULL,
  `latitude` DECIMAL(10, 8) DEFAULT NULL,
  `longitude` DECIMAL(11, 8) DEFAULT NULL,
  `rating` DECIMAL(3, 1) DEFAULT 0.0,
  `cuisine` VARCHAR(255) DEFAULT NULL,
  `is_open` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Food Categories Table
CREATE TABLE `food_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Foods Table
CREATE TABLE `foods` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `restaurant_id` INT NOT NULL,
  `category_id` INT DEFAULT NULL,
  `food_name` VARCHAR(255) NOT NULL,
  `image_url` TEXT DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `is_veg` BOOLEAN DEFAULT FALSE,
  `is_vegan` BOOLEAN DEFAULT FALSE,
  `is_jain` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_foods_restaurant_id` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_foods_category_id` FOREIGN KEY (`category_id`) REFERENCES `food_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Food Prices Table (For cross-platform comparison)
CREATE TABLE `food_prices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `food_id` INT NOT NULL,
  `platform` VARCHAR(50) NOT NULL, -- 'Swiggy', 'Zomato', 'IRCTC', 'Local'
  `price` DECIMAL(10, 2) NOT NULL,
  `delivery_fee` DECIMAL(10, 2) DEFAULT 0.00,
  `delivery_time_mins` INT DEFAULT NULL,
  `order_url` TEXT DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_food_prices_food_id` FOREIGN KEY (`food_id`) REFERENCES `foods` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_food_platform` (`food_id`, `platform`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Food Favorites Table
CREATE TABLE `food_favorites` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `food_id` INT DEFAULT NULL,
  `restaurant_id` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_food_fav_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_food_fav_food` FOREIGN KEY (`food_id`) REFERENCES `foods` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_food_fav_rest` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Food Reviews Table
CREATE TABLE `food_reviews` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `restaurant_id` INT NOT NULL,
  `rating` INT NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
  `review` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_food_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_food_reviews_rest` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Destination Foods Table (AI curation)
CREATE TABLE `destination_foods` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `city` VARCHAR(255) NOT NULL,
  `food_id` INT NOT NULL,
  `is_must_try` BOOLEAN DEFAULT FALSE,
  CONSTRAINT `fk_dest_foods_food` FOREIGN KEY (`food_id`) REFERENCES `foods` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Cuisines Table (Advanced Cuisine Explorer)
CREATE TABLE `cuisines` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `city` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `image_url` TEXT DEFAULT NULL,
  `popularity_score` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Station Foods Table (Original Food Price & Water Bottle Guide)
CREATE TABLE `station_foods` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `station_code` VARCHAR(50) NOT NULL,
  `vendor_type` VARCHAR(100) NOT NULL, -- 'Railway Platform', 'Train Vendor', 'Local Shop', 'Food Court'
  `vendor_name` VARCHAR(255) DEFAULT 'Generic Vendor',
  `food_item` VARCHAR(255) NOT NULL, -- e.g., 'Tea', 'Rail Neer', 'Veg Thali'
  `category` VARCHAR(100) DEFAULT NULL, -- 'Beverage', 'Water', 'Meal', 'Snack'
  `price` DECIMAL(10, 2) NOT NULL,
  `mrp` DECIMAL(10, 2) DEFAULT NULL,
  `is_overpriced` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_station_foods_station` FOREIGN KEY (`station_code`) REFERENCES `stations` (`station_code`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Support Tickets Table
CREATE TABLE `support_tickets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ticket_number` VARCHAR(50) NOT NULL UNIQUE,
  `user_id` INT NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `priority` VARCHAR(50) DEFAULT 'Low', -- Low, Medium, High, Critical
  `status` VARCHAR(50) DEFAULT 'Open', -- Open, In Progress, Resolved, Closed, Rejected
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_support_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Support Messages Table (Live Chat/Replies)
CREATE TABLE `support_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ticket_id` INT NOT NULL,
  `sender_type` VARCHAR(50) NOT NULL, -- 'User' or 'Admin'
  `message` TEXT NOT NULL,
  `attachment_url` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_support_msg_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Support Attachments Table (Screenshots)
CREATE TABLE `support_attachments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ticket_id` INT NOT NULL,
  `file_url` TEXT NOT NULL,
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_support_att_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================================
-- ⚡ ADVANCED SQL FEATURE 1: Speed Performance Indexes
-- =========================================================================
CREATE INDEX `idx_users_email` ON `users` (`email`);
CREATE INDEX `idx_trips_user_id` ON `trips` (`user_id`);
CREATE INDEX `idx_bookings_user_id` ON `bookings` (`user_id`);
CREATE INDEX `idx_bookings_trip_id` ON `bookings` (`trip_id`);
CREATE INDEX `idx_transactions_booking_id` ON `transactions` (`booking_id`);
CREATE INDEX `idx_restaurants_city` ON `restaurants` (`city`);
CREATE INDEX `idx_foods_restaurant_id` ON `foods` (`restaurant_id`);
CREATE INDEX `idx_food_prices_food_id` ON `food_prices` (`food_id`);
CREATE INDEX `idx_dest_foods_city` ON `destination_foods` (`city`);
CREATE INDEX `idx_food_favorites_user` ON `food_favorites` (`user_id`);
CREATE INDEX `idx_food_reviews_restaurant` ON `food_reviews` (`restaurant_id`);
CREATE INDEX `idx_cuisines_city` ON `cuisines` (`city`);
CREATE INDEX `idx_station_foods_station` ON `station_foods` (`station_code`);
CREATE INDEX `idx_support_tickets_user` ON `support_tickets` (`user_id`);
CREATE INDEX `idx_support_tickets_status` ON `support_tickets` (`status`);
CREATE INDEX `idx_support_msg_ticket` ON `support_messages` (`ticket_id`);


-- =========================================================================
-- ⚡ ADVANCED SQL FEATURE 2: Dynamic Views (Consolidated Reporting)
-- =========================================================================

-- View 1: Consolidated Bookings Summary
CREATE VIEW `view_booking_summaries` AS
SELECT 
    b.`id` AS `booking_id`,
    u.`name` AS `user_name`,
    u.`email` AS `user_email`,
    b.`train_number`,
    b.`source_station_code`,
    b.`destination_station_code`,
    b.`ticket_fare`,
    b.`booking_status`,
    t.`transaction_id`,
    t.`payment_method`,
    t.`status` AS `payment_status`,
    b.`booking_date`
FROM `bookings` b
INNER JOIN `users` u ON b.`user_id` = u.`id`
LEFT JOIN `transactions` t ON b.`id` = t.`booking_id`;

-- View 2: Payment Revenue Statistics
CREATE VIEW `view_payment_stats` AS
SELECT 
    `payment_method`,
    COUNT(*) AS `total_transactions`,
    SUM(`amount`) AS `total_revenue`,
    AVG(`amount`) AS `avg_ticket_value`
FROM `transactions`
WHERE `status` = 'Success'
GROUP BY `payment_method`;


-- =========================================================================
-- ⚡ ADVANCED SQL FEATURE 3: Transaction-Safe Stored Procedures (Refund Handler)
-- =========================================================================
DELIMITER //

CREATE PROCEDURE `sp_process_refund`(
    IN p_booking_id INT,
    IN p_admin_id INT
)
BEGIN
    DECLARE v_user_id INT;
    DECLARE v_fare DECIMAL(10, 2);
    
    -- Error Handler to rollback on failure
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
    END;

    START TRANSACTION;
        
        -- Fetch user and ticket details
        SELECT `user_id`, `ticket_fare` INTO v_user_id, v_fare 
        FROM `bookings` 
        WHERE `id` = p_booking_id;
        
        -- Update booking status to Cancelled
        UPDATE `bookings` 
        SET `booking_status` = 'Cancelled', `payment_status` = 'Refunded' 
        WHERE `id` = p_booking_id;
        
        -- Create a refund record in transactions
        INSERT INTO `transactions` (`booking_id`, `user_id`, `transaction_id`, `amount`, `payment_method`, `status`)
        VALUES (p_booking_id, v_user_id, CONCAT('REF-', p_booking_id, '-', UNIX_TIMESTAMP()), -v_fare, 'REFUND', 'Success');
        
        -- Log refund audit trail
        INSERT INTO `payment_logs` (`user_id`, `event_type`, `payment_method`, `details`)
        VALUES (v_user_id, 'REFUNDED', 'SYSTEM', CONCAT('Refund processed by Admin #', p_admin_id, ' for booking #', p_booking_id));
        
    COMMIT;
END //

DELIMITER ;


-- =========================================================================
-- ⚡ ADVANCED SQL FEATURE 4: Database Triggers (Automated Audit Logging)
-- =========================================================================
DELIMITER //

CREATE TRIGGER `trg_after_booking_cancel`
AFTER UPDATE ON `bookings`
FOR EACH ROW
BEGIN
    -- Automatically log cancellation events to payment_logs when booking status switches to 'Cancelled'
    IF NEW.`booking_status` = 'Cancelled' AND OLD.`booking_status` <> 'Cancelled' THEN
        INSERT INTO `payment_logs` (`user_id`, `event_type`, `payment_method`, `details`)
        VALUES (NEW.`user_id`, 'FAILED', NEW.`travel_class`, CONCAT('Trigger Alert: Booking ticket #', NEW.`id`, ' cancelled by passenger.'));
    END IF;
END //

DELIMITER ;


-- =========================================================================
-- ⚡ ADVANCED SQL FEATURE 5: AI Tables
-- =========================================================================

-- 20. AI Predictions Log Table
CREATE TABLE `ai_predictions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `prediction_type` VARCHAR(100) NOT NULL,
  `input_data` JSON NOT NULL,
  `output_data` JSON NOT NULL,
  `confidence` DECIMAL(5, 2) DEFAULT NULL,
  `latency_ms` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_ai_pred_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. Fare Forecasts Table
CREATE TABLE `fare_forecasts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `source` VARCHAR(100) NOT NULL,
  `destination` VARCHAR(100) NOT NULL,
  `class_code` VARCHAR(50) NOT NULL,
  `travel_date` DATE NOT NULL,
  `current_fare` INT NOT NULL,
  `forecasted_fare_7d` INT NOT NULL,
  `recommendation` VARCHAR(50) NOT NULL,
  `demand_level` VARCHAR(50) DEFAULT 'Medium',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. Delay Predictions Table
CREATE TABLE `delay_predictions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `train_number` VARCHAR(50) NOT NULL,
  `route` VARCHAR(255) DEFAULT NULL,
  `departure_delay_mins` INT DEFAULT 0,
  `arrival_delay_mins` INT DEFAULT 0,
  `delay_probability` DECIMAL(5, 2) DEFAULT 0.00,
  `confidence` DECIMAL(5, 2) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 23. Occupancy Predictions Table
CREATE TABLE `occupancy_predictions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `train_number` VARCHAR(50) NOT NULL,
  `travel_date` DATE NOT NULL,
  `class_code` VARCHAR(50) NOT NULL,
  `availability_probability` DECIMAL(5, 2) NOT NULL,
  `expected_waiting_list` VARCHAR(50) DEFAULT NULL,
  `seat_demand` VARCHAR(50) DEFAULT 'Medium',
  `coach_occupancy_percent` DECIMAL(5, 2) DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 24. Crowd Predictions Table
CREATE TABLE `crowd_predictions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `station_code` VARCHAR(50) NOT NULL,
  `prediction_date` DATE NOT NULL,
  `hour_of_day` INT NOT NULL,
  `crowd_level` VARCHAR(50) NOT NULL,
  `expected_crowd_percent` DECIMAL(5, 2) NOT NULL,
  `platform_congestion_percent` DECIMAL(5, 2) NOT NULL,
  `peak_time_alert` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_crowd_pred_station` FOREIGN KEY (`station_code`) REFERENCES `stations` (`station_code`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 25. Recommendation Logs Table
CREATE TABLE `recommendation_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `recommendation_type` VARCHAR(100) NOT NULL,
  `criteria` JSON NOT NULL,
  `results` JSON NOT NULL,
  `feedback_rating` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_rec_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 26. Model Metrics Table
CREATE TABLE `model_metrics` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `model_name` VARCHAR(100) NOT NULL,
  `model_version` VARCHAR(50) NOT NULL,
  `accuracy` DECIMAL(5, 2) DEFAULT NULL,
  `loss` DECIMAL(8, 4) DEFAULT NULL,
  `training_samples` INT DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'Active',
  `metrics_data` JSON DEFAULT NULL,
  `last_trained_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_model_version` (`model_name`, `model_version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_ai_pred_type` ON `ai_predictions` (`prediction_type`);
CREATE INDEX `idx_fare_forecasts_route` ON `fare_forecasts` (`source`, `destination`);
CREATE INDEX `idx_delay_pred_train` ON `delay_predictions` (`train_number`);
CREATE INDEX `idx_occupancy_pred_train` ON `occupancy_predictions` (`train_number`);
CREATE INDEX `idx_crowd_pred_station` ON `crowd_predictions` (`station_code`);
CREATE INDEX `idx_rec_logs_user` ON `recommendation_logs` (`user_id`);

-- =========================================================================
-- Sample Seed Data
-- =========================================================================
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`) VALUES
(1, 'System Admin', 'admin@traveliq.com', '$2b$10$wN1Qy/UfR5tFh9t24N6PseT8392019488392019488392019488', 'Admin');

INSERT INTO `stations` (`station_code`, `station_name`, `city`, `state`, `latitude`, `longitude`) VALUES
('NDLS', 'NEW DELHI', 'New Delhi', 'Delhi', 28.64000000, 77.21000000),
('BBS', 'BHUBANESWAR', 'Bhubaneswar', 'Odisha', 20.26000000, 85.82000000);

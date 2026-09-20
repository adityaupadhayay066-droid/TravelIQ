const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'traveliq'
    });

    try {
        console.log('Starting migration...');
        
        await connection.query(`
        CREATE TABLE IF NOT EXISTS \`restaurants\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`name\` VARCHAR(255) NOT NULL,
          \`city\` VARCHAR(255) NOT NULL,
          \`latitude\` DECIMAL(10, 8) DEFAULT NULL,
          \`longitude\` DECIMAL(11, 8) DEFAULT NULL,
          \`rating\` DECIMAL(3, 1) DEFAULT 0.0,
          \`cuisine\` VARCHAR(255) DEFAULT NULL,
          \`is_open\` BOOLEAN DEFAULT TRUE,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await connection.query(`
        CREATE TABLE IF NOT EXISTS \`food_categories\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`name\` VARCHAR(100) NOT NULL UNIQUE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await connection.query(`
        CREATE TABLE IF NOT EXISTS \`foods\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`restaurant_id\` INT NOT NULL,
          \`category_id\` INT DEFAULT NULL,
          \`food_name\` VARCHAR(255) NOT NULL,
          \`image_url\` TEXT DEFAULT NULL,
          \`description\` TEXT DEFAULT NULL,
          \`is_veg\` BOOLEAN DEFAULT FALSE,
          \`is_vegan\` BOOLEAN DEFAULT FALSE,
          \`is_jain\` BOOLEAN DEFAULT FALSE,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT \`fk_foods_restaurant_id\` FOREIGN KEY (\`restaurant_id\`) REFERENCES \`restaurants\` (\`id\`) ON DELETE CASCADE,
          CONSTRAINT \`fk_foods_category_id\` FOREIGN KEY (\`category_id\`) REFERENCES \`food_categories\` (\`id\`) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        await connection.query(`
        CREATE TABLE IF NOT EXISTS \`food_prices\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`food_id\` INT NOT NULL,
          \`platform\` VARCHAR(50) NOT NULL,
          \`price\` DECIMAL(10, 2) NOT NULL,
          \`delivery_fee\` DECIMAL(10, 2) DEFAULT 0.00,
          \`delivery_time_mins\` INT DEFAULT NULL,
          \`order_url\` TEXT DEFAULT NULL,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT \`fk_food_prices_food_id\` FOREIGN KEY (\`food_id\`) REFERENCES \`foods\` (\`id\`) ON DELETE CASCADE,
          UNIQUE KEY \`uk_food_platform\` (\`food_id\`, \`platform\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // Seed some data so frontend has something to display
        console.log('Seeding initial data...');
        const [restaurants] = await connection.query('SELECT id FROM restaurants LIMIT 1');
        if (restaurants.length === 0) {
            await connection.query(`INSERT INTO restaurants (name, city, rating, cuisine) VALUES 
                ('Bhubaneswar Biryani House', 'Bhubaneswar', 4.5, 'North Indian'),
                ('Delhi Darbar', 'Delhi', 4.8, 'Mughlai'),
                ('Goa Seafoods', 'Goa', 4.2, 'Seafood'),
                ('Annapurna Veg', 'Bhubaneswar', 4.1, 'South Indian')
            `);
            
            await connection.query(`INSERT INTO food_categories (name) VALUES ('Main Course'), ('Dessert'), ('Snacks'), ('Beverages')`);
            
            await connection.query(`INSERT INTO foods (restaurant_id, category_id, food_name, is_veg, is_jain, image_url) VALUES 
                (1, 1, 'Chicken Dum Biryani', false, false, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500'),
                (2, 1, 'Butter Chicken', false, false, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500'),
                (4, 1, 'Masala Dosa', true, true, 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=500'),
                (4, 2, 'Rasgulla', true, true, 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=500')
            `);

            await connection.query(`INSERT INTO food_prices (food_id, platform, price, delivery_fee) VALUES 
                (1, 'Swiggy', 250.00, 40.00),
                (1, 'Zomato', 260.00, 30.00),
                (1, 'Local', 220.00, 0.00),
                (2, 'Swiggy', 350.00, 40.00),
                (2, 'Zomato', 340.00, 35.00),
                (3, 'Swiggy', 120.00, 20.00),
                (3, 'Local', 90.00, 0.00),
                (3, 'IRCTC', 110.00, 15.00),
                (4, 'Zomato', 60.00, 10.00)
            `);
        }

        console.log('Migration completed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await connection.end();
    }
}

migrate();

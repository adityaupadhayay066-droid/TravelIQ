const sequelize = require('../config/db');
const { QueryTypes } = require('sequelize');
const { FoodRecommendation } = require('../models');

exports.discoverFood = async (req, res) => {
    try {
        const { city, veg, mustTry, budget } = req.query;
        const targetCity = city || 'Bhubaneswar';

        let foods = [];
        try {
            let query = `
                SELECT f.id, f.food_name, f.image_url, f.is_veg, f.is_jain, r.name as restaurant, r.rating, 
                (SELECT MIN(price) FROM food_prices WHERE food_id = f.id) as min_price,
                df.is_must_try
                FROM foods f
                JOIN restaurants r ON f.restaurant_id = r.id
                LEFT JOIN destination_foods df ON df.food_id = f.id AND df.city = r.city
                WHERE r.city = :city
            `;
            
            const replacements = { city: targetCity };

            if (veg === 'true') {
                query += ` AND f.is_veg = true`;
            }
            if (mustTry === 'true') {
                query += ` AND df.is_must_try = true`;
            }

            foods = await sequelize.query(query, {
                replacements,
                type: QueryTypes.SELECT
            });

            if (foods.length > 0) {
                const foodIds = foods.map(f => f.id);
                const prices = await sequelize.query(`
                    SELECT food_id, platform, price, delivery_fee, order_url 
                    FROM food_prices 
                    WHERE food_id IN (:foodIds)
                `, {
                    replacements: { foodIds },
                    type: QueryTypes.SELECT
                });

                foods.forEach(food => {
                    food.prices = prices.filter(p => p.food_id === food.id);
                });
            }
        } catch (dbErr) {
            console.warn('[Food Primary Query Warning]:', dbErr.message);
        }

        // Fallback: Query FoodRecommendation dataset model if primary table has no rows
        if (!foods || foods.length === 0) {
            const dbRecs = await FoodRecommendation.findAll({
                where: sequelize.where(
                    sequelize.fn('LOWER', sequelize.col('city')),
                    'LIKE',
                    `%${targetCity.toLowerCase()}%`
                )
            });

            if (dbRecs && dbRecs.length > 0) {
                foods = dbRecs.map(rec => ({
                    id: rec.id,
                    food_name: rec.food_name,
                    restaurant: rec.restaurant,
                    image_url: rec.image_url,
                    is_veg: Boolean(rec.is_veg),
                    is_jain: false,
                    rating: rec.rating || 4.7,
                    min_price: rec.price_range === '$' ? 120 : rec.price_range === '$$' ? 220 : 350,
                    is_must_try: rec.must_try ? 1 : 0,
                    prices: [
                        { platform: 'IRCTC', price: rec.price_range === '$' ? 120 : 220, delivery_fee: 0 },
                        { platform: 'Zomato', price: rec.price_range === '$' ? 140 : 250, delivery_fee: 30 },
                        { platform: 'Swiggy', price: rec.price_range === '$' ? 135 : 240, delivery_fee: 25 }
                    ]
                }));
            }
        }

        res.json({ success: true, recommendations: foods });
    } catch (err) {
        console.error('Discover food error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getRestaurantDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const [restaurant] = await sequelize.query(`SELECT * FROM restaurants WHERE id = :id`, {
            replacements: { id },
            type: QueryTypes.SELECT
        });

        if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });

        const foods = await sequelize.query(`
            SELECT f.id, f.food_name, f.image_url, f.is_veg, f.description,
            (SELECT MIN(price) FROM food_prices WHERE food_id = f.id) as starting_price
            FROM foods f
            WHERE f.restaurant_id = :id
        `, {
            replacements: { id },
            type: QueryTypes.SELECT
        });

        res.json({ success: true, restaurant, menu: foods });
    } catch (err) {
        console.error('Restaurant details error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

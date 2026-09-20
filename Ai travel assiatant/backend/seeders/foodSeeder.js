const { FoodRecommendation } = require('../models');

const CULINARY_DIRECTORY = [
  // Bhubaneswar
  {
    city: 'Bhubaneswar',
    food_name: 'Dahibara Aloodum',
    restaurant: 'Bapuji Nagar Dahibara Stall',
    rating: 4.9,
    price_range: '$',
    is_veg: true,
    image_url: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?q=80&w=300&auto=format&fit=crop',
    must_try: true
  },
  {
    city: 'Bhubaneswar',
    food_name: 'Chhena Poda (Baked Cheese Delicacy)',
    restaurant: 'Ganguram Sweets, Master Canteen',
    rating: 4.8,
    price_range: '$',
    is_veg: true,
    image_url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=300&auto=format&fit=crop',
    must_try: true
  },
  {
    city: 'Bhubaneswar',
    food_name: 'Traditional Odia Dalma',
    restaurant: 'Dalma Restaurant, Madhusudan Nagar',
    rating: 4.6,
    price_range: '$$',
    is_veg: true,
    image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=300&auto=format&fit=crop',
    must_try: false
  },

  // Delhi
  {
    city: 'Delhi',
    food_name: 'Spicy Chole Bhature',
    restaurant: 'Rama Chole Bhature, Karol Bagh',
    rating: 4.8,
    price_range: '$',
    is_veg: true,
    image_url: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?q=80&w=300&auto=format&fit=crop',
    must_try: true
  },
  {
    city: 'Delhi',
    food_name: 'Original Butter Chicken',
    restaurant: 'Moti Mahal, Daryaganj',
    rating: 4.7,
    price_range: '$$$',
    is_veg: false,
    image_url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=300&auto=format&fit=crop',
    must_try: true
  },
  {
    city: 'Delhi',
    food_name: 'Mutton Korma & Khamiri Roti',
    restaurant: 'Karims, Jama Masjid',
    rating: 4.6,
    price_range: '$$',
    is_veg: false,
    image_url: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?q=80&w=300&auto=format&fit=crop',
    must_try: false
  },

  // Mumbai
  {
    city: 'Mumbai',
    food_name: 'Classic Vada Pav',
    restaurant: 'Ashok Vada Pav, Dadar',
    rating: 4.9,
    price_range: '$',
    is_veg: true,
    image_url: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?q=80&w=300&auto=format&fit=crop',
    must_try: true
  },
  {
    city: 'Mumbai',
    food_name: 'Special Pav Bhaji',
    restaurant: 'Sardar Pav Bhaji, Tardeo',
    rating: 4.7,
    price_range: '$',
    is_veg: true,
    image_url: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?q=80&w=300&auto=format&fit=crop',
    must_try: true
  },
  {
    city: 'Mumbai',
    food_name: 'Spicy Misal Pav',
    restaurant: 'Aaswad, Shivaji Park',
    rating: 4.8,
    price_range: '$',
    is_veg: true,
    image_url: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?q=80&w=300&auto=format&fit=crop',
    must_try: false
  },

  // Goa
  {
    city: 'Goa',
    food_name: 'Goan Fish Curry Rice',
    restaurant: 'Ritz Classic, Panaji',
    rating: 4.8,
    price_range: '$$',
    is_veg: false,
    image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=300&auto=format&fit=crop',
    must_try: true
  },
  {
    city: 'Goa',
    food_name: 'Pork Vindaloo',
    restaurant: 'Souza Lobo, Calangute',
    rating: 4.6,
    price_range: '$$$',
    is_veg: false,
    image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=300&auto=format&fit=crop',
    must_try: true
  },
  {
    city: 'Goa',
    food_name: 'Traditional Bebinca Dessert',
    restaurant: 'Mum\'s Kitchen, Panaji',
    rating: 4.7,
    price_range: '$$',
    is_veg: true,
    image_url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?q=80&w=300&auto=format&fit=crop',
    must_try: false
  },

  // Bangalore
  {
    city: 'Bangalore',
    food_name: 'Masala Dosa',
    restaurant: 'MTR (Mavalli Tiffin Room), Lalbagh',
    rating: 4.8,
    price_range: '$',
    is_veg: true,
    image_url: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?q=80&w=300&auto=format&fit=crop',
    must_try: true
  },
  {
    city: 'Bangalore',
    food_name: 'Idli Vada with Filter Coffee',
    restaurant: 'Veena Stores, Malleshwaram',
    rating: 4.9,
    price_range: '$',
    is_veg: true,
    image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=300&auto=format&fit=crop',
    must_try: true
  }
];

async function seedFoodRecommendations() {
  try {
    const count = await FoodRecommendation.count();
    if (count > 0) {
      console.log('🍽️  Food recommendations already seeded. Skipping...');
      return;
    }

    await FoodRecommendation.bulkCreate(CULINARY_DIRECTORY);
    console.log('✅ Culinary directory recommendations seeded successfully.');
  } catch (err) {
    console.error('❌ Failed to seed food recommendations:', err.message);
  }
}

module.exports = { seedFoodRecommendations };

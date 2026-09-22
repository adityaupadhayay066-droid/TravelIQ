/**
 * Hotel Controller — Handles hotel search and listing API requests.
 * Follows the same pattern as foodController.js.
 */

const hotelService = require('../services/hotelService');

/**
 * GET /api/hotels/search?destination=Tata&sort=rating&limit=20
 * 
 * Search hotels by destination city. Supports sorting and limiting results.
 * Also returns dining options (hotels with in-house restaurants).
 */
exports.searchHotels = async (req, res) => {
    try {
        const { destination, sort, limit, category, isHostel } = req.query;

        if (!destination || !destination.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Destination query parameter is required.'
            });
        }

        // Check if hotel data is loaded
        if (!hotelService.isDataLoaded()) {
            return res.status(503).json({
                success: false,
                message: 'Hotel data is not available. Please try again later.'
            });
        }

        const parsedLimit = parseInt(limit) || 100;
        const sortBy = ['rating', 'price_low', 'price_high'].includes(sort) ? sort : 'rating';

        // Search all hotels for the destination
        const hotelResults = hotelService.searchHotels(destination.trim(), {
            sort: sortBy,
            limit: parsedLimit,
            category: category,
            isHostelOnly: isHostel === 'true' || isHostel === '1'
        });

        // Search hotels with restaurant amenity
        const diningResults = hotelService.getHotelsWithRestaurant(destination.trim(), {
            sort: sortBy,
            limit: 20
        });

        res.json({
            success: true,
            destination: destination.trim(),
            matchedCity: hotelResults.matchedCity,
            hotels: hotelResults.hotels,
            diningOptions: diningResults.hotels,
            totalHotels: hotelResults.hotels.length,
            totalDining: diningResults.hotels.length
        });
    } catch (err) {
        console.error('Hotel search error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * POST /api/hotels/reserve
 * Process and confirm a hotel / hostel stay reservation
 */
exports.reserveStay = async (req, res) => {
    try {
        const {
            hotelName,
            city,
            category,
            isHostel,
            roomType,
            unitsCount,
            guestName,
            guestEmail,
            guestPhone,
            govIdType,
            govIdNumber,
            govIdVerified,
            checkInDate,
            checkOutDate,
            nights,
            guestsCount,
            mealPlan,
            specialRequests,
            paymentMethod,
            ratePerNight,
            baseTotal,
            mealsTotal,
            discount,
            promoCode,
            taxes,
            grandTotal
        } = req.body;

        if (!hotelName || !guestName || !guestEmail || !guestPhone || !checkInDate || !checkOutDate) {
            return res.status(400).json({
                success: false,
                message: 'Guest full name, mandatory email, phone number, hotel name, and valid dates are required.'
            });
        }

        const reservation = hotelService.createReservation({
            hotelName,
            city,
            category,
            isHostel,
            roomType,
            unitsCount: parseInt(unitsCount) || 1,
            guestName,
            guestEmail: guestEmail.trim(),
            guestPhone: guestPhone.trim(),
            govIdType: govIdType || 'Aadhaar Card',
            govIdNumber: govIdNumber || 'XXXX-XXXX-4829',
            govIdVerified: govIdVerified !== undefined ? govIdVerified : true,
            checkInDate,
            checkOutDate,
            nights: parseInt(nights) || 1,
            guestsCount: parseInt(guestsCount) || 1,
            mealPlan: mealPlan || 'Room Only',
            specialRequests: specialRequests || [],
            paymentMethod: paymentMethod || 'Pay at Property',
            ratePerNight: parseFloat(ratePerNight) || 1000,
            baseTotal: parseFloat(baseTotal) || 1000,
            mealsTotal: parseFloat(mealsTotal) || 0,
            discount: parseFloat(discount) || 0,
            promoCode,
            taxes: parseFloat(taxes) || 120,
            grandTotal: parseFloat(grandTotal) || 1120
        });

        res.status(201).json({
            success: true,
            message: 'Reservation confirmed successfully!',
            reservation
        });
    } catch (err) {
        console.error('Reservation error:', err);
        res.status(500).json({ success: false, message: 'Failed to process reservation.' });
    }
};

/**
 * GET /api/hotels/reservations
 * Get user reservations
 */
exports.getReservations = async (req, res) => {
    try {
        const reservations = hotelService.getAllReservations();
        res.json({
            success: true,
            reservations,
            count: reservations.length
        });
    } catch (err) {
        console.error('Get reservations error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * GET /api/hotels/cities
 * 
 * Returns all available cities in the hotel dataset.
 */
exports.getHotelCities = async (req, res) => {
    try {
        if (!hotelService.isDataLoaded()) {
            return res.status(503).json({
                success: false,
                message: 'Hotel data is not available.'
            });
        }

        const cities = hotelService.getAvailableCities();

        res.json({
            success: true,
            cities,
            totalCities: cities.length
        });
    } catch (err) {
        console.error('Hotel cities error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

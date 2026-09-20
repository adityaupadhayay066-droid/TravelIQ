const {
    User, Destination, Report, AdminNotification, SearchAnalytics, AiQuery, Train, Station
} = require('../models');
const bcrypt = require('bcryptjs');

const seedAdminPanelData = async () => {
    try {
        console.log('🌱 Checking Admin Panel datasets (Destinations, Reports, Notifications)...');


        // 2. Seed Destinations
        const destinationSeeds = [
            {
                name: 'Varanasi',
                state: 'Uttar Pradesh',
                country: 'India',
                description: 'The spiritual capital of India, known for holy ghats along the sacred Ganges river and centuries-old temples.',
                image_url: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?q=80&w=1200',
                popularity: 96,
                best_time_to_visit: 'October to March',
                estimated_budget: 8500,
                attractions: ['Dashashwamedh Ghat', 'Kashi Vishwanath Temple', 'Assi Ghat', 'Sarnath'],
                food_recommendations: ['Banarasi Paan', 'Kachori Sabzi', 'Malaiyo', 'Tamatar Chaat'],
                safety_info: 'Very safe for solo and group travelers. Watch personal belongings in crowded ghats.',
                local_transport: 'Auto rickshaws, e-rickshaws, and walking along ghat walkways.',
                tags: ['Historical', 'Spiritual', 'Culture', 'Budget'],
                status: 'active'
            },
            {
                name: 'Goa',
                state: 'Goa',
                country: 'India',
                description: 'World-renowned coastal haven famous for golden sand beaches, vibrant nightlife, Portuguese architecture, and fresh seafood.',
                image_url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1200',
                popularity: 98,
                best_time_to_visit: 'November to February',
                estimated_budget: 18000,
                attractions: ['Baga Beach', 'Fort Aguada', 'Dudhsagar Falls', 'Basilica of Bom Jesus'],
                food_recommendations: ['Goan Fish Curry', 'Bebinca', 'Pork Vindaloo', 'Prawn Balchao'],
                safety_info: 'Safe tourist destination with dedicated tourist police helpline.',
                local_transport: 'Scooter rentals, self-drive cars, local private taxis.',
                tags: ['Beach', 'Nightlife', 'Luxury', 'Adventure'],
                status: 'active'
            },
            {
                name: 'Manali',
                state: 'Himachal Pradesh',
                country: 'India',
                description: 'High-altitude Himalayan resort town nestled on the Beas River, famous for snow adventures, pine valleys, and backpacking.',
                image_url: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=1200',
                popularity: 94,
                best_time_to_visit: 'October to June',
                estimated_budget: 12500,
                attractions: ['Solang Valley', 'Rohtang Pass', 'Hadimba Temple', 'Old Manali Cafe Street'],
                food_recommendations: ['Siddu', 'Trout Fish', 'Kullu Dham', 'Yak Cheese Pizzas'],
                safety_info: 'Check mountain weather forecasts and road permits for high passes.',
                local_transport: 'Local 4x4 cabs, rented motorbikes.',
                tags: ['Mountains', 'Adventure', 'Snow', 'Family'],
                status: 'active'
            },
            {
                name: 'Jaipur',
                state: 'Rajasthan',
                country: 'India',
                description: 'The Pink City of India, steeped in royal palaces, imposing hilltop forts, rich heritage bazaars, and vibrant Rajasthani arts.',
                image_url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?q=80&w=1200',
                popularity: 92,
                best_time_to_visit: 'November to March',
                estimated_budget: 11000,
                attractions: ['Hawa Mahal', 'Amber Fort', 'City Palace', 'Jantar Mantar'],
                food_recommendations: ['Dal Baati Churma', 'Ghevar', 'Pyaaz Kachori', 'Laal Maas'],
                safety_info: 'High tourist safety index; negotiate fares beforehand or use rideshare apps.',
                local_transport: 'Metro, auto-rickshaws, Ola/Uber.',
                tags: ['Historical', 'Culture', 'Family', 'Budget'],
                status: 'active'
            },
            {
                name: 'Puri',
                state: 'Odisha',
                country: 'India',
                description: 'Coastal spiritual epicenter home to the magnificent Jagannath Temple, pristine Golden Beach, and rich Odissi craftsmanship.',
                image_url: 'https://images.unsplash.com/photo-1608958435020-e8a7109ba809?q=80&w=1200',
                popularity: 90,
                best_time_to_visit: 'October to March',
                estimated_budget: 7500,
                attractions: ['Shree Jagannath Temple', 'Golden Beach', 'Chilika Lake', 'Raghurajpur Crafts Village'],
                food_recommendations: ['Mahaprasad / Abadha', 'Khaja', 'Chhena Poda', 'Puri Fried Fish'],
                safety_info: 'Blue Flag certified beach with trained lifeguards.',
                local_transport: 'Auto rickshaws, town buses, seaside cycling.',
                tags: ['Spiritual', 'Beach', 'Culture', 'Budget'],
                status: 'active'
            }
        ];

        for (const d of destinationSeeds) {
            const [dest, created] = await Destination.findOrCreate({
                where: { name: d.name },
                defaults: d
            });
        }

        // 3. Seed Reports & Issues
        const reportSeeds = [
            {
                report_id: 'REP-10842',
                user_name: 'Vikram Singh',
                user_email: 'vikram.travel@gmail.com',
                category: 'Wrong train data',
                subject: 'Train 12801 Purushottam Exp departure time discrepancy',
                description: 'The app shows departure as 21:45 from BBS, but official IRCTC timetable updated it to 22:05 from October 1st.',
                priority: 'High',
                status: 'Investigating',
                assigned_admin_name: 'Priya Patel',
                internal_notes: 'Checking new IRCTC circular for East Coast Railway timetable update.'
            },
            {
                report_id: 'REP-10843',
                user_name: 'Ananya Roy',
                user_email: 'ananya.roy@outlook.com',
                category: 'AI response problem',
                subject: 'AI suggested non-existent bus route between Manali and Leh during December',
                description: 'The AI assistant recommended HRTC bus via Rohtang pass in December when the highway is snowbound and closed.',
                priority: 'Critical',
                status: 'Open',
                internal_notes: 'Need to update seasonal restriction rules in RAG prompt context.'
            },
            {
                report_id: 'REP-10844',
                user_name: 'Kavita Menon',
                user_email: 'kavita.m@yahoo.com',
                category: 'Incorrect destination info',
                subject: 'Entry timing updated for Hawa Mahal Jaipur',
                description: 'The night viewing timing is now extended to 10:00 PM on weekends.',
                priority: 'Low',
                status: 'Resolved',
                assigned_admin_name: 'Neha Gupta',
                resolution_summary: 'Updated destination details for Jaipur Hawa Mahal.'
            },
            {
                report_id: 'REP-10845',
                user_name: 'Siddharth Nair',
                user_email: 'sid.nair@traveliq.com',
                category: 'Website bug',
                subject: 'Search filter on mobile screen overlaps fare card',
                description: 'When tapping filter modal on Safari iOS 18, the apply button is partially obscured by safe area margin.',
                priority: 'Medium',
                status: 'Open'
            }
        ];

        for (const r of reportSeeds) {
            await Report.findOrCreate({
                where: { report_id: r.report_id },
                defaults: r
            });
        }

        // 4. Seed Admin Notifications
        const notificationSeeds = [
            {
                type: 'critical_report',
                title: 'Critical Issue Reported on AI Routing',
                message: 'User reported high-pass winter road recommended in Leh-Manali region. Review prompt safety constraints.',
                severity: 'critical',
                read: false,
                action_url: '/admin/reports'
            },
            {
                type: 'data_import',
                title: 'Indian Railways Master Schedule Synced',
                message: '1,420 express trains and 640 station coordinates successfully verified.',
                severity: 'success',
                read: true,
                action_url: '/admin/trains'
            },
            {
                type: 'security_alert',
                title: 'Multiple Failed Admin Login Attempts',
                message: '5 failed login attempts detected from IP 192.168.1.104 targeting admin@traveliq.com. Rate limit triggered.',
                severity: 'warning',
                read: false,
                action_url: '/admin/audit-logs'
            },
            {
                type: 'system_alert',
                title: 'High AI Model Query Volume',
                message: 'AI Travel Assistant handled over 2,400 multi-modal queries in the last 24 hours with 98.4% uptime.',
                severity: 'info',
                read: true,
                action_url: '/admin/ai'
            }
        ];

        for (const n of notificationSeeds) {
            await AdminNotification.findOrCreate({
                where: { title: n.title },
                defaults: n
            });
        }

        // 5. Seed sample Search Analytics & AI Query logs
        const sampleSearches = [
            { source: 'NDLS', destination: 'MMCT', transport_type: 'Train', travel_date: new Date() },
            { source: 'BBS', destination: 'NDLS', transport_type: 'Train', travel_date: new Date() },
            { source: 'DEL', destination: 'BOM', transport_type: 'Flight', travel_date: new Date() },
            { source: 'BLR', destination: 'HYD', transport_type: 'Bus', travel_date: new Date() },
            { source: 'HWH', destination: 'PURI', transport_type: 'Train', travel_date: new Date() }
        ];

        for (const s of sampleSearches) {
            await SearchAnalytics.create(s).catch(() => {});
        }

        console.log('✅ Admin Panel datasets successfully seeded.');
    } catch (err) {
        console.error('⚠️ Admin seeder error:', err.message);
    }
};

module.exports = { seedAdminPanelData };

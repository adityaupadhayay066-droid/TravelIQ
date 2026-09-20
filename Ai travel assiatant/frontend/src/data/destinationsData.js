export const DESTINATIONS_CATALOG = [
  {
    id: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    region: 'West',
    category: 'metro',
    tag: 'Financial Capital & Arabian Sea',
    tagline: "India's financial capital, celebrated for its Arabian Sea coastline, street food, colonial Victorian architecture, and Bollywood energy.",
    heroImage: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1400&q=80',
    bestTime: 'Oct – Mar (Pleasant coastal breeze, 20°C - 30°C)',
    avgBudget: '₹2,500 – ₹6,000 / day',
    idealDays: '2 - 4 Days',
    rating: 4.8,
    reviews: '12.4k',
    gettingAround: 'Local trains, BEST buses, auto-rickshaws, metro, and coastal taxis.',
    tags: ['Coastal', 'City Life', 'Heritage', 'Nightlife', 'Food Haven'],
    topHighlights: ['Marine Drive Sunset', 'Gateway of India', 'Elephanta Caves', 'Chowpatty Street Food'],
    weather: {
      temp: '28°C',
      condition: 'Sunny & Pleasant Breeze',
      clothingTip: 'Light cotton wear and comfortable walking shoes.',
      bestMonths: 'October to March'
    },
    howToReach: {
      flight: { title: 'Chhatrapati Shivaji Maharaj Int. Airport (BOM)', distance: 'In-city (Andheri/Vile Parle)', duration: '2h from Delhi / BLR', startingFare: '₹2,899' },
      train: { title: 'CSMT & Mumbai Central Terminus (BCT)', distance: 'South / Central Mumbai', duration: 'Overnight Rajdhani / Vande Bharat', startingFare: '₹750' },
      bus: { title: 'MSRTC & Private Multi-Axle Volvo Terminals', distance: 'Dadar / Borivali / Navi Mumbai', duration: 'Frequent from Pune, Goa, Surat', startingFare: '₹600' }
    },
    curatedStays: [
      {
        id: 'mum_stay_1',
        name: 'The Taj Mahal Palace & Tower',
        type: '5-Star Luxury Heritage',
        rating: 4.9,
        reviewsCount: 3840,
        price: 18500,
        originalPrice: 24000,
        discountBadge: '23% OFF',
        image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
        address: 'Apollo Bunder, Colaba, Mumbai',
        amenities: ['Sea View', 'Infinity Pool', 'Spa & Wellness', 'Complimentary High Tea', 'Free WiFi'],
        verified: true,
        rooms: [
          { type: 'Tower Heritage Sea View', price: 18500, originalPrice: 24000, capacity: '2 Adults', perks: ['Arabian Sea View', 'Free Breakfast', 'Butler Service'] },
          { type: 'Luxury Palace Suite', price: 34000, originalPrice: 42000, capacity: '3 Adults', perks: ['Club Lounge Access', 'Airport Limo Transfer', 'Spa Credit'] }
        ]
      },
      {
        id: 'mum_stay_2',
        name: 'OYO Townhouse 088 South Mumbai',
        type: 'Premium Smart Hotel',
        rating: 4.6,
        reviewsCount: 1420,
        price: 2699,
        originalPrice: 4200,
        discountBadge: '36% OFF',
        image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
        address: 'Fort / Kala Ghoda Heritage District, Mumbai',
        amenities: ['Free High-Speed WiFi', '24/7 Room Dining', 'AC & Work Desk', 'Sanitized Stay'],
        verified: true,
        rooms: [
          { type: 'Townhouse Classic AC', price: 2699, originalPrice: 4200, capacity: '2 Adults', perks: ['Free Breakfast', 'Express Check-in', '100% Sanitized'] },
          { type: 'Townhouse Deluxe Suite', price: 3599, originalPrice: 5000, capacity: '3 Adults', perks: ['City View', 'Mini Refrigerator', 'Free WiFi'] }
        ]
      },
      {
        id: 'mum_stay_3',
        name: 'Zostel Mumbai Backpacker & Social Hub',
        type: 'Boutique Hostel',
        rating: 4.7,
        reviewsCount: 980,
        price: 999,
        originalPrice: 1500,
        discountBadge: '33% OFF',
        image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
        address: 'Marol / Andheri East, Mumbai',
        amenities: ['Rooftop Cafe', 'Community Games', 'High-Speed WiFi', 'Shared Kitchen'],
        verified: true,
        rooms: [
          { type: '6-Bed AC Mixed Dorm Bed', price: 999, originalPrice: 1500, capacity: '1 Guest', perks: ['Personal Locker', 'Reading Light & Socket', 'Free Linen'] },
          { type: 'Private Deluxe Double Room', price: 2499, originalPrice: 3200, capacity: '2 Adults', perks: ['Ensuite Bathroom', 'Smart TV', 'Balcony'] }
        ]
      }
    ],
    activityPool: [
      { id: 'm1', title: 'Walk along Marine Drive at sunset', category: 'sightseeing', timeSlot: '17:30', duration: '1.5 hrs', cost: 'Free', tip: 'Sit on the promenade wall as the Queen’s Necklace lights up.', location: 'Marine Drive, Churchgate', bestTimeOfDay: 'evening' },
      { id: 'm2', title: 'Gateway of India & Taj Mahal Palace tour', category: 'heritage', timeSlot: '09:30', duration: '2 hrs', cost: 'Free / ₹50', tip: 'Catch early morning views before tourist crowds arrive.', location: 'Apollo Bunder, Colaba', bestTimeOfDay: 'morning' },
      { id: 'm3', title: 'Ferry trip to Elephanta Island Rock-cut Caves', category: 'heritage', timeSlot: '09:00', duration: '4 hrs', cost: '₹260 ferry + entry', tip: 'UNESCO World Heritage cave temples dedicated to Lord Shiva.', location: 'Elephanta Island (Ferry from Gateway)', bestTimeOfDay: 'morning' },
      { id: 'm4', title: 'Victorian Gothic & Art Deco architectural walk', category: 'heritage', timeSlot: '15:30', duration: '2 hrs', cost: 'Free', tip: 'Explore Kala Ghoda, Oval Maidan, and CSMT railway facade.', location: 'Fort & Kala Ghoda', bestTimeOfDay: 'afternoon' },
      { id: 'm5', title: 'Street Food Crawl at Chowpatty & Mohammed Ali Road', category: 'food', timeSlot: '19:30', duration: '2.5 hrs', cost: '₹350 – ₹600', tip: 'Must try: Vada Pav, Pav Bhaji, Bhel Puri & Malpua with Rabdi.', location: 'Girgaon Chowpatty & Minara Masjid', bestTimeOfDay: 'night' },
      { id: 'm6', title: 'Bandra Coastal Promenade & Street Art Walk', category: 'sightseeing', timeSlot: '16:00', duration: '2 hrs', cost: 'Free', tip: 'See Bollywood star houses, Chapel Road murals & Bandstand.', location: 'Bandstand & Carter Road, Bandra West', bestTimeOfDay: 'afternoon' },
      { id: 'm7', title: 'Colaba Causeway & Fashion Street bargain shopping', category: 'shopping', timeSlot: '14:00', duration: '2.5 hrs', cost: 'Variable', tip: 'Bargain politely for vintage sunglasses, leather goods, and handicrafts.', location: 'Colaba Causeway', bestTimeOfDay: 'afternoon' },
      { id: 'm8', title: 'Authentic Coastal Seafood Lunch at Mahesh Lunch Home', category: 'food', timeSlot: '13:00', duration: '1.5 hrs', cost: '₹800 – ₹1,400', tip: 'Try Surmai Fry, Butter Garlic Crab, and Neer Dosa.', location: 'Fort / Juhu', bestTimeOfDay: 'afternoon' },
      { id: 'm9', title: 'Sanjay Gandhi National Park & Kanheri Caves cycling', category: 'nature', timeSlot: '07:30', duration: '3.5 hrs', cost: '₹120 entry + cycle', tip: 'Green oasis in the north; rent bicycles inside park gate.', location: 'Borivali East', bestTimeOfDay: 'morning' },
      { id: 'm10', title: 'Sunset Cocktails & Rooftop Nightlife in Lower Parel', category: 'nightlife', timeSlot: '21:00', duration: '3 hrs', cost: '₹1,500 – ₹2,500', tip: 'Enjoy skyline views and high-energy music at Kamala Mills.', location: 'Lower Parel', bestTimeOfDay: 'night' },
      { id: 'm11', title: 'Haji Ali Dargah causeway walk in the Arabian Sea', category: 'spiritual', timeSlot: '11:00', duration: '1.5 hrs', cost: 'Free', tip: 'Check high tide timings before walking the pathway into the sea.', location: 'Worli Coast', bestTimeOfDay: 'morning' },
      { id: 'm12', title: 'Morning Heritage Walk at Sassoon Docks & Fish Auction', category: 'cultural', timeSlot: '06:30', duration: '1.5 hrs', cost: 'Free', tip: 'Vibrant bustle of Koli fishermen boats unloading fresh morning catch.', location: 'Colaba', bestTimeOfDay: 'morning' }
    ],
    thingsToDo: [
      'Walk along Marine Drive at sunset',
      'Visit the Gateway of India and take a ferry to Elephanta Caves',
      'Explore Victorian Gothic architecture in South Mumbai',
      'Sample street food at Chowpatty & Mohammed Ali Road',
      'Take a tour of Bandra\'s art district and coastal promenade'
    ],
    localFood: [
      'Vada Pav & Pav Bhaji at Ashok Vada Pav',
      'Bombay Duck Fry & Malvani Seafood Thali',
      'Bun Maska & Irani Chai at Kyani & Co.',
      'Bhel Puri & Sev Puri at Juhu Beach'
    ],
    popularPlaces: [
      { name: 'Gateway of India', type: 'Historical Landmark', desc: 'Monument built during British Raj overlooking Mumbai Harbour.' },
      { name: 'Marine Drive', type: 'Promenade', desc: '3.6 km long boulevard known as the Queen\'s Necklace.' },
      { name: 'Colaba Causeway', type: 'Shopping & Dining', desc: 'Bustling market streets lined with cafes and boutiques.' },
      { name: 'Chhatrapati Shivaji Terminus', type: 'UNESCO Heritage Site', desc: 'Historic railway station blending Victorian and Indian architecture.' }
    ]
  },
  {
    id: 'manali',
    name: 'Manali',
    state: 'Himachal Pradesh',
    region: 'North',
    category: 'hillstation',
    tag: 'Snow Valleys & Alpine Adventure',
    tagline: 'Snow-capped Himalayan peaks, pine forests, cascading waterfalls, and thrilling alpine adventure activities.',
    heroImage: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1400&q=80',
    bestTime: 'Oct – Jun (Snow Dec-Feb, pleasant summer 12°C - 25°C)',
    avgBudget: '₹2,200 – ₹5,500 / day',
    idealDays: '3 - 5 Days',
    rating: 4.8,
    reviews: '16.7k',
    gettingAround: 'Local taxis, private rental 4x4 cabs, scooties, and scenic walks.',
    tags: ['Mountains', 'Snow & Adventure', 'Trekking', 'River Rafting', 'Scenic'],
    topHighlights: ['Solang Valley Snow Sports', 'Atal Tunnel & Sissu Waterfall', 'Hadimba Temple & Cedar Forest', 'Jogini Falls Trek'],
    weather: {
      temp: '14°C',
      condition: 'Crisp Mountain Breeze & Clear Skies',
      clothingTip: 'Heavy woollens & windproof jacket for Solang/Atal Tunnel; light jackets for valley.',
      bestMonths: 'October to June'
    },
    howToReach: {
      flight: { title: 'Bhuntar / Kullu Airport (KUU)', distance: '50 km (1.5h cab drive to Manali)', duration: '1h 15m from Delhi (ATRs)', startingFare: '₹5,400' },
      train: { title: 'Chandigarh (CDG) / Kalka Railway Station', distance: '310 km (7-8h scenic hill drive)', duration: 'Vande Bharat / Shatabdi Express', startingFare: '₹680' },
      bus: { title: 'Overnight AC Volvo / Scania Sleeper (HRTC / Zingbus)', distance: 'ISBT Kashmiri Gate / Majnu Ka Tila (Delhi)', duration: '11-13h overnight journey', startingFare: '₹899' }
    },
    curatedStays: [
      {
        id: 'mn_stay_1',
        name: 'The Himalayan Luxury Castle & Resort',
        type: '5-Star Alpine Resort',
        rating: 4.9,
        reviewsCount: 2190,
        price: 8499,
        originalPrice: 12500,
        discountBadge: '32% OFF',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        address: 'Hadimba Road, Manali, Himachal Pradesh',
        amenities: ['Snow Peak Mountain View', 'Fireplace & Central Heating', 'Heated Outdoor Pool', 'Free Buffet Breakfast', 'High-Speed WiFi'],
        verified: true,
        rooms: [
          { type: 'Premier Castle Chamber (Snow View)', price: 8499, originalPrice: 12500, capacity: '2 Adults', perks: ['Himalayan Peak View', 'Free Breakfast & Dinner', 'Fireplace'] },
          { type: 'Grand Royal Victorian Suite', price: 14500, originalPrice: 19000, capacity: '3 Adults', perks: ['Private Jacuzzi', 'Bonfire on Balcony', 'All Meals Included'] }
        ]
      },
      {
        id: 'mn_stay_2',
        name: 'OYO Townhouse 432 Pine Valley Manali',
        type: 'Premium Mountain Hotel',
        rating: 4.7,
        reviewsCount: 1840,
        price: 1899,
        originalPrice: 3200,
        discountBadge: '41% OFF',
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
        address: 'Aleo, Near Mall Road, Manali',
        amenities: ['Geyser / 24h Hot Water', 'Mountain Balcony', 'In-house Restaurant', 'Free High-Speed WiFi'],
        verified: true,
        rooms: [
          { type: 'Deluxe Pine Mountain View Room', price: 1899, originalPrice: 3200, capacity: '2 Adults', perks: ['Free Breakfast', 'Room Heater', 'Instant Hot Water'] },
          { type: 'Family Quad Suite with Balcony', price: 2999, originalPrice: 4800, capacity: '4 Guests', perks: ['Snow Peak Panorama', '2 Queen Beds', 'Free WiFi'] }
        ]
      },
      {
        id: 'mn_stay_3',
        name: 'Zostel Old Manali Backpacker & Cafe',
        type: 'Scenic Riverside Hostel',
        rating: 4.8,
        reviewsCount: 3120,
        price: 799,
        originalPrice: 1200,
        discountBadge: '34% OFF',
        image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
        address: 'Manu Temple Road, Old Manali',
        amenities: ['Rooftop Mountain Cafe', 'Bonfire & Acoustic Nights', 'High-Speed Workation WiFi', 'Apple Orchard Lawn'],
        verified: true,
        rooms: [
          { type: '6-Bed Mixed Dorm Bed (Apple Orchard View)', price: 799, originalPrice: 1200, capacity: '1 Guest', perks: ['Locker with Charging Socket', 'Reading Light', 'Comforter'] },
          { type: 'Private Alpine Wooden Cottage', price: 2399, originalPrice: 3500, capacity: '2 Adults', perks: ['Private Balcony', 'Valley View', 'Electric Blanket'] }
        ]
      }
    ],
    activityPool: [
      { id: 'mn1', title: 'Solang Valley Snow Sports (Paragliding, Zorbing & Quad Biking)', category: 'adventure', timeSlot: '09:00', duration: '4 hrs', cost: '₹1,500 – ₹3,200', tip: 'Soar over the Pir Panjal range in high-fly tandem paragliding; rent snow suits at the valley entrance.', location: 'Solang Valley (14 km from Mall Road)', bestTimeOfDay: 'morning' },
      { id: 'mn2', title: 'Atal Tunnel & Sissu Waterfall Day Excursion (Lahaul Valley)', category: 'nature', timeSlot: '09:30', duration: '5.5 hrs', cost: '₹2,500 cab pool', tip: 'Cross the 9.02 km engineering marvel under Rohtang Pass into dramatic barren Lahaul mountains and Sissu waterfall.', location: 'Atal Tunnel / Sissu (North Portal)', bestTimeOfDay: 'morning' },
      { id: 'mn3', title: 'Hadimba Devi Wooden Temple & Dhungri Cedar Pine Forest Walk', category: 'heritage', timeSlot: '14:30', duration: '1.5 hrs', cost: 'Free', tip: 'Pagoda-style 16th-century wooden temple tucked amidst giant deodar trees; pose with Himalayan yaks and angora rabbits.', location: 'Dhungri Village, Manali', bestTimeOfDay: 'afternoon' },
      { id: 'mn4', title: 'Jogini Waterfall Scenic Trek through Apple Orchards', category: 'nature', timeSlot: '10:00', duration: '3 hrs', cost: 'Free', tip: 'Easy 3 km hike starting from Vashisht village through pine trails with multi-tiered cascading falls.', location: 'Vashisht Village', bestTimeOfDay: 'morning' },
      { id: 'mn5', title: 'Vashisht Village Hot Sulphur Springs & Ancient Sage Temple', category: 'wellness', timeSlot: '08:00', duration: '1.5 hrs', cost: 'Free', tip: 'Natural hot sulphur baths believed to hold medicinal skin healing properties.', location: 'Vashisht Temple Complex', bestTimeOfDay: 'morning' },
      { id: 'mn6', title: 'Old Manali Bohemian Cafes, Israeli Bakeries & Live Music', category: 'food', timeSlot: '16:30', duration: '3 hrs', cost: '₹400 – ₹900', tip: 'Taste freshly caught Himalayan trout, Shakshuka, Nutella pancakes, and wood-fired pizzas at Dylan’s / Cafe 1947.', location: 'Old Manali Bridge Road', bestTimeOfDay: 'evening' },
      { id: 'mn7', title: 'Mall Road Evening Stroll & Tibetan Handloom Market Shopping', category: 'shopping', timeSlot: '18:30', duration: '2.5 hrs', cost: 'Variable', tip: 'Shop for authentic Kullu shawls, wooden carvings, dry fruits, and hot gulab jamuns.', location: 'The Mall Road, Central Manali', bestTimeOfDay: 'evening' },
      { id: 'mn8', title: 'White Water River Rafting in Beas River (Kullu to Jhiri)', category: 'adventure', timeSlot: '11:00', duration: '2.5 hrs', cost: '₹800 – ₹1,200', tip: 'Tackle Grade III rapids across 14 km stretch in freezing glacial waters with certified guides.', location: 'Babeli / Pirdi, Kullu', bestTimeOfDay: 'morning' },
      { id: 'mn9', title: 'Naggar Castle Heritage Tour & Nicholas Roerich Art Gallery', category: 'heritage', timeSlot: '13:30', duration: '3 hrs', cost: '₹30 entry', tip: 'Medieval wood-and-stone castle with breathtaking panoramas of the Beas Valley and Russian painter gallery.', location: 'Naggar (21 km south of Manali)', bestTimeOfDay: 'afternoon' },
      { id: 'mn10', title: 'Jana Waterfall & Traditional Himachali Siddu Feast', category: 'food', timeSlot: '12:30', duration: '2 hrs', cost: '₹200 – ₹400', tip: 'Try steaming hot Siddu with pure ghee and walnut chutney at village wooden shacks.', location: 'Jana Village, Naggar', bestTimeOfDay: 'afternoon' },
      { id: 'mn11', title: 'Gulaba Snow Point & High Altitude Viewpoint Drive', category: 'nature', timeSlot: '08:30', duration: '4 hrs', cost: '₹1,800 cab', tip: 'Scenic snow zone on the route to Rohtang Pass surrounded by meadows.', location: 'Gulaba, Manali-Leh Highway', bestTimeOfDay: 'morning' },
      { id: 'mn12', title: 'Riverside Bonfire, Barbecue & Stargazing by the Beas River', category: 'nightlife', timeSlot: '20:30', duration: '2 hrs', cost: '₹500 / person', tip: 'Unwind with acoustic guitar music and crackling pine campfire under the crystal clear Himalayan night sky.', location: 'Club House / Aleo Riverside', bestTimeOfDay: 'night' },
      { id: 'mn13', title: 'Manikaran Sahib Gurdwara & Parvati Valley Excursion', category: 'spiritual', timeSlot: '08:00', duration: '6 hrs', cost: '₹3,000 cab pool', tip: 'Holy hot springs where langar rice is boiled in natural thermal boiling water tanks.', location: 'Manikaran, Parvati Valley', bestTimeOfDay: 'morning' },
      { id: 'mn14', title: 'Sethan Village & Hampta Valley Winter Igloo Stay Walk', category: 'adventure', timeSlot: '14:00', duration: '3.5 hrs', cost: '₹600 entry/visit', tip: 'Curving drive to Buddhist village with panoramic view of Dhauladhar ranges.', location: 'Sethan, Hampta Valley', bestTimeOfDay: 'afternoon' }
    ],
    thingsToDo: [
      'Paragliding, skiing, and snowmobiling at Solang Valley',
      'Drive through the engineering marvel of Atal Tunnel into Lahaul',
      'Trek to Jogini Waterfall & bathe in Vashisht hot sulphur springs',
      'Sip hot apple cider and enjoy live music in Old Manali cafes',
      'Visit historic Naggar Castle and savor authentic Himachali Siddu'
    ],
    localFood: [
      'Himachali Siddu with Pure Desi Ghee & Walnut Chutney',
      'Fresh Himalayan Pan-Fried Trout at Cafe 1947',
      'Traditional Himachali Dham festive feast (Madra & Babru)',
      'Steaming Thukpa, Tibetan Momos & Cinnamon Apple Pie'
    ],
    popularPlaces: [
      { name: 'Solang Valley', type: 'Adventure Hub', desc: 'Alpine valley known for paragliding, zorbing, snow skiing, and quad biking.' },
      { name: 'Hadimba Devi Temple', type: 'Ancient Wooden Temple', desc: '16th-century pagoda-style wooden sanctuary nestled among towering deodars.' },
      { name: 'Atal Tunnel & Sissu', type: 'High Altitude Valley', desc: 'World’s longest highway tunnel opening into the dramatic mountains of Lahaul.' },
      { name: 'Jogini Falls', type: 'Scenic Waterfall Trek', desc: 'Picturesque multi-tiered cascading falls through village apple orchards.' }
    ]
  },
  {
    id: 'delhi',
    name: 'Delhi',
    state: 'National Capital Territory',
    region: 'North',
    category: 'heritage',
    tag: 'Historic Capital & Mughlai Food',
    tagline: 'A historic metropolis blending ancient Mughal monuments, sprawling royal gardens, and world-renowned street food.',
    heroImage: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1400&q=80',
    bestTime: 'Oct – Mar (Crisp winter sunshine 10°C - 24°C)',
    avgBudget: '₹2,000 – ₹5,000 / day',
    idealDays: '2 - 3 Days',
    rating: 4.7,
    reviews: '15.8k',
    gettingAround: 'Delhi Metro (fast & cheap), auto-rickshaws, and ride-hailing apps.',
    tags: ['Heritage', 'Mughal History', 'Street Food', 'Shopping', 'Monuments'],
    topHighlights: ['Qutub Minar', 'Red Fort & Chandni Chowk', 'Humayun’s Tomb', 'India Gate'],
    weather: {
      temp: '22°C',
      condition: 'Sunny & Pleasant Winter Sun',
      clothingTip: 'Layers / light jacket for mornings and evenings.',
      bestMonths: 'October to March'
    },
    howToReach: {
      flight: { title: 'Indira Gandhi International Airport (DEL)', distance: 'Terminal 1/2/3 (Airport Metro direct)', duration: 'Direct from all global & domestic cities', startingFare: '₹2,500' },
      train: { title: 'New Delhi (NDLS) / Hazrat Nizamuddin (NZM)', distance: 'Central / South Delhi', duration: 'Origin point for Vande Bharat & Rajdhanis', startingFare: '₹450' },
      bus: { title: 'ISBT Kashmiri Gate & Anand Vihar Bus Terminal', distance: 'North & East Delhi', duration: 'Direct buses to Himachal, Uttarakhand, Rajasthan', startingFare: '₹350' }
    },
    curatedStays: [
      {
        id: 'del_stay_1',
        name: 'The Imperial New Delhi',
        type: '5-Star Heritage Hotel',
        rating: 4.9,
        reviewsCount: 2900,
        price: 14500,
        originalPrice: 19500,
        discountBadge: '25% OFF',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        address: 'Janpath, Connaught Place, New Delhi',
        amenities: ['Art Deco Pool', 'Award-Winning Spa', 'Fine-Dining Mughlai Cuisine', 'Free WiFi'],
        verified: true,
        rooms: [
          { type: 'Heritage Deco Room', price: 14500, originalPrice: 19500, capacity: '2 Adults', perks: ['Free Breakfast', 'Garden View', 'Luxury Amenities'] }
        ]
      },
      {
        id: 'del_stay_2',
        name: 'OYO Townhouse 284 Connaught Place',
        type: 'Premium Smart City Hotel',
        rating: 4.6,
        reviewsCount: 1670,
        price: 2199,
        originalPrice: 3800,
        discountBadge: '42% OFF',
        image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
        address: 'Pahar Ganj / Connaught Place, New Delhi',
        amenities: ['AC & Work Station', 'Free High-Speed WiFi', '24/7 Room Service'],
        verified: true,
        rooms: [
          { type: 'Townhouse Standard Double', price: 2199, originalPrice: 3800, capacity: '2 Adults', perks: ['Free Breakfast', 'Express Check-in'] }
        ]
      }
    ],
    activityPool: [
      { id: 'd1', title: 'Qutub Minar & Mehrauli Archaeological Park', category: 'heritage', timeSlot: '09:00', duration: '2.5 hrs', cost: '₹50 entry', tip: 'Tallest brick minaret in the world surrounded by ancient ruins.', location: 'Mehrauli', bestTimeOfDay: 'morning' },
      { id: 'd2', title: 'Old Delhi Rickshaw Safari & Chandni Chowk Food Tour', category: 'food', timeSlot: '11:30', duration: '3 hrs', cost: '₹300 – ₹700', tip: 'Feast on Paranthe Wali Gali, Natraj Dahi Bhalle, and Jaleba.', location: 'Chandni Chowk', bestTimeOfDay: 'morning' },
      { id: 'd3', title: 'Red Fort & Jama Masjid exploration', category: 'heritage', timeSlot: '15:00', duration: '2.5 hrs', cost: '₹50 entry', tip: 'Grand Mughal fortress and India’s largest historic mosque.', location: 'Netaji Subhash Marg', bestTimeOfDay: 'afternoon' },
      { id: 'd4', title: 'Humayun’s Tomb & Sunder Nursery garden stroll', category: 'nature', timeSlot: '16:30', duration: '2 hrs', cost: '₹50 + ₹40 entry', tip: 'Precursor to the Taj Mahal with lush Persian-style charbagh gardens.', location: 'Nizamuddin East', bestTimeOfDay: 'afternoon' },
      { id: 'd5', title: 'Dilli Haat handicrafts & regional food court dinner', category: 'shopping', timeSlot: '19:00', duration: '2.5 hrs', cost: '₹30 entry + shopping', tip: 'Artisans from all Indian states offering authentic handlooms and momos.', location: 'INA Market', bestTimeOfDay: 'evening' },
      { id: 'd6', title: 'India Gate & Kartavya Path evening illuminated walk', category: 'sightseeing', timeSlot: '20:30', duration: '1.5 hrs', cost: 'Free', tip: 'Beautiful evening lights and street ice creams.', location: 'Kartavya Path', bestTimeOfDay: 'night' },
      { id: 'd7', title: 'Lotus Temple & Quiet Meditation Gardens', category: 'spiritual', timeSlot: '10:30', duration: '1.5 hrs', cost: 'Free', tip: 'Bahá\'í House of Worship with flowerlike architecture.', location: 'Kalkaji', bestTimeOfDay: 'morning' },
      { id: 'd8', title: 'Akshardham Temple Grand Water & Light Show', category: 'cultural', timeSlot: '17:45', duration: '2.5 hrs', cost: '₹90 show', tip: 'Magnificent pink sandstone complex with musical fountain show.', location: 'NH 24, Noida Mor', bestTimeOfDay: 'evening' },
      { id: 'd9', title: 'Hauz Khas Village Fort Sunset & Lakeside Cafes', category: 'nightlife', timeSlot: '16:30', duration: '3 hrs', cost: '₹500 – ₹1,200', tip: 'Medieval ruins overlooking a lake surrounded by chic cocktail bars.', location: 'Hauz Khas Village', bestTimeOfDay: 'evening' },
      { id: 'd10', title: 'Lodhi Art District Open-Air Street Murals', category: 'sightseeing', timeSlot: '14:00', duration: '2 hrs', cost: 'Free', tip: 'India’s first public art district with massive painted wall murals.', location: 'Lodhi Colony', bestTimeOfDay: 'afternoon' }
    ],
    thingsToDo: [
      'Tour Qutub Minar, Humayun\'s Tomb, and Red Fort',
      'Rickshaw ride through Chandni Chowk',
      'Walk through Lodhi Garden monuments',
      'Shop at Dilli Haat and Khan Market'
    ],
    localFood: [
      'Chole Bhature & Paranthas at Sita Ram / Chandni Chowk',
      'Moti Mahal Butter Chicken & Karim’s Mutton Kebab',
      'Natraj Dahi Bhalla & Old Famous Jalebi Wala',
      'Rabri Falooda & Kulfi at Giani’s'
    ],
    popularPlaces: [
      { name: 'Red Fort & Chandni Chowk', type: 'Historical', desc: 'Mughal citadel and historic street markets.' },
      { name: 'Humayun\'s Tomb', type: 'UNESCO Site', desc: '16th-century Mughal garden tomb architecture.' },
      { name: 'India Gate', type: 'Memorial', desc: 'War memorial flanked by sprawling lawns.' },
      { name: 'Qutub Minar', type: 'UNESCO Site', desc: '73m minaret built in 1193 AD.' }
    ]
  },
  {
    id: 'goa',
    name: 'Goa',
    state: 'Goa',
    region: 'West',
    category: 'beaches',
    tag: 'Beaches, Shacks & Portuguese Charm',
    tagline: 'Sun-kissed Arabian Sea beaches, Portuguese colonial villas, vibrant beach shacks, and exhilarating water sports.',
    heroImage: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1400&q=80',
    bestTime: 'Nov – Feb (Sunny days & ocean breeze 22°C - 32°C)',
    avgBudget: '₹2,800 – ₹7,000 / day',
    idealDays: '3 - 5 Days',
    rating: 4.9,
    reviews: '21.1k',
    gettingAround: 'Scooter / car rentals, private cabs, and ferry boats.',
    tags: ['Beaches', 'Water Sports', 'Portuguese Heritage', 'Nightlife', 'Seafood'],
    topHighlights: ['Palolem & Baga Beaches', 'Dudhsagar Falls', 'Fontainhas Latin Quarter', 'Chapora Fort'],
    weather: {
      temp: '29°C',
      condition: 'Tropical Breeze & Clear Ocean Sunshine',
      clothingTip: 'Beachwear, flip-flops, sunglasses & sunscreen.',
      bestMonths: 'November to February'
    },
    howToReach: {
      flight: { title: 'Mopa International (GOX) / Dabolim (GOI)', distance: 'North Goa (GOX) & South Goa (GOI)', duration: '1h 15m from Mumbai / BLR', startingFare: '₹2,699' },
      train: { title: 'Madgaon (MAO) / Thivim (THVM) Railway Station', distance: 'South & North Goa corridors', duration: 'Vande Bharat Express from Mumbai', startingFare: '₹850' },
      bus: { title: 'Kadamba Transport & Private Sleeper Buses', distance: 'Panjim / Mapusa / Margao', duration: 'Overnight from Mumbai, Pune, Bangalore', startingFare: '₹950' }
    },
    curatedStays: [
      {
        id: 'goa_stay_1',
        name: 'Taj Fort Aguada Resort & Spa',
        type: '5-Star Beachfront Luxury',
        rating: 4.9,
        reviewsCount: 3410,
        price: 15500,
        originalPrice: 21000,
        discountBadge: '26% OFF',
        image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
        address: 'Sinquerim Beach, Candolim, Goa',
        amenities: ['Direct Beach Access', 'Infinity Pool', 'Spa by the Sea', 'Sunset Bar', 'Free WiFi'],
        verified: true,
        rooms: [
          { type: 'Superior Sea View Room', price: 15500, originalPrice: 21000, capacity: '2 Adults', perks: ['Ocean Horizon View', 'Free Breakfast', 'Pool Access'] }
        ]
      },
      {
        id: 'goa_stay_2',
        name: 'OYO Flagship 1423 Candolim Beach Road',
        type: 'Smart Beach Hotel',
        rating: 4.5,
        reviewsCount: 1290,
        price: 1999,
        originalPrice: 3400,
        discountBadge: '41% OFF',
        image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
        address: 'Main Candolim Road, North Goa',
        amenities: ['Swimming Pool', 'AC & Balcony', 'Free WiFi', '5 min Walk to Beach'],
        verified: true,
        rooms: [
          { type: 'Standard AC Room', price: 1999, originalPrice: 3400, capacity: '2 Adults', perks: ['Free WiFi', 'Pool Access'] }
        ]
      }
    ],
    activityPool: [
      { id: 'g1', title: 'Parasailing, Jet Skiing & Banana Ride at Calangute Beach', category: 'adventure', timeSlot: '09:30', duration: '2.5 hrs', cost: '₹1,200 – ₹2,500', tip: 'Book certified operators early in morning for calm waters.', location: 'Calangute / Baga Beach', bestTimeOfDay: 'morning' },
      { id: 'g2', title: 'Fontainhas Latin Quarter colorful heritage walk', category: 'heritage', timeSlot: '11:30', duration: '2 hrs', cost: 'Free', tip: 'Walk through Panjim’s pastel Portuguese villas and art cafes.', location: 'Fontainhas, Panaji', bestTimeOfDay: 'morning' },
      { id: 'g3', title: 'Beach Shack Lunch & Chilled King’s Beer at Anjuna / Curlies', category: 'food', timeSlot: '13:30', duration: '2 hrs', cost: '₹600 – ₹1,200', tip: 'Try Goan Fish Curry Thali, Prawn Balchao, and Bebinca.', location: 'Anjuna Beach', bestTimeOfDay: 'afternoon' },
      { id: 'g4', title: 'Sunset Views from Chapora Fort ("Dil Chahta Hai")', category: 'sightseeing', timeSlot: '17:00', duration: '1.5 hrs', cost: 'Free', tip: 'Panoramic vantage point over Vagator Beach and Ozran cove.', location: 'Vagator, North Goa', bestTimeOfDay: 'evening' },
      { id: 'g5', title: 'Sunset River Cruise on Mandovi with Goan folk dance', category: 'sightseeing', timeSlot: '18:45', duration: '1.5 hrs', cost: '₹500 / person', tip: 'Enjoy breezy river views, DJ music, and cultural performances.', location: 'Santa Monica Jetty, Panaji', bestTimeOfDay: 'evening' },
      { id: 'g6', title: 'Dudhsagar Four-Tier Waterfall Jeep Safari & Spice Farm', category: 'nature', timeSlot: '08:00', duration: '6 hrs', cost: '₹1,500 cab pool', tip: 'Gigantic milky waterfall located inside Bhagwan Mahaveer Sanctuary.', location: 'Kulem, South Goa', bestTimeOfDay: 'morning' },
      { id: 'g7', title: 'Kayaking in Sal Backwaters & Bird Watching', category: 'nature', timeSlot: '07:00', duration: '2 hrs', cost: '₹800 / person', tip: 'Glide quietly through mangrove canopies filled with kingfishers.', location: 'Sal River, Mobor', bestTimeOfDay: 'morning' },
      { id: 'g8', title: 'Anjuna Wednesday Flea Market & Hippie Souvenirs', category: 'shopping', timeSlot: '15:30', duration: '3 hrs', cost: 'Free entry', tip: 'Boho jewellery, leather crafts, hammocks, and live drumming.', location: 'Anjuna Coast', bestTimeOfDay: 'afternoon' },
      { id: 'g9', title: 'Old Goa UNESCO Churches & Basilica of Bom Jesus', category: 'heritage', timeSlot: '10:00', duration: '2 hrs', cost: 'Free', tip: 'Marvel at 16th-century Manueline and Baroque architecture.', location: 'Velha Goa', bestTimeOfDay: 'morning' },
      { id: 'g10', title: 'Beach Club & Electronic Music Night at Thalassa / HillTop', category: 'nightlife', timeSlot: '21:30', duration: '3.5 hrs', cost: '₹1,500 – ₹3,000', tip: 'World-famous psychedelic trance and Greek open-air dining.', location: 'Siolim / Vagator', bestTimeOfDay: 'night' }
    ],
    thingsToDo: [
      'Relax on Palolem and Anjuna beaches',
      'Explore the colorful Latin Quarter of Fontainhas',
      'Water sports & dolphin spotting cruises',
      'Visit Old Goa historic churches & spice plantations'
    ],
    localFood: [
      'Goan Fish Curry & Rice with Kokum Kadi',
      'Pork Vindaloo & Chicken Xacuti',
      'Prawn Rava Fry & Poi bread',
      'Traditional Bebinca & Feni cocktail'
    ],
    popularPlaces: [
      { name: 'Palolem Beach', type: 'Beach Cove', desc: 'Serene white-sand crescent beach lined with coconut palms.' },
      { name: 'Fontainhas', type: 'Heritage Quarter', desc: 'Old Latin quarter of Panjim with vibrant Portuguese houses.' },
      { name: 'Aguada Fort', type: 'Portuguese Fort', desc: '17th-century lighthouse fort overlooking Sinquerim beach.' },
      { name: 'Basilica of Bom Jesus', type: 'UNESCO Site', desc: 'Baroque architecture preserving sacred historical relics.' }
    ]
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    state: 'Rajasthan',
    region: 'North',
    category: 'heritage',
    tag: 'The Royal Pink City',
    tagline: 'The Pink City of Rajasthan, celebrated for royal palaces, hilltop forts, grand havelis, and block-print handicrafts.',
    heroImage: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1400&q=80',
    bestTime: 'Oct – Mar (Crisp royal winter 12°C - 26°C)',
    avgBudget: '₹2,200 – ₹5,500 / day',
    idealDays: '2 - 3 Days',
    rating: 4.8,
    reviews: '18.3k',
    gettingAround: 'Auto-rickshaws, e-rickshaws, cabs, and metro.',
    tags: ['Royal Palaces', 'Forts', 'Handicrafts', 'Rajasthani Thali', 'Heritage'],
    topHighlights: ['Amber Fort', 'Hawa Mahal', 'City Palace', 'Nahargarh Sunset'],
    weather: {
      temp: '24°C',
      condition: 'Sunny & Golden Sunshine',
      clothingTip: 'Cotton ethnic wear, sunglasses & comfortable shoes for fort climbs.',
      bestMonths: 'October to March'
    },
    howToReach: {
      flight: { title: 'Jaipur International Airport (JAI)', distance: 'Sanganer (12 km from city center)', duration: '50m from Delhi / 1h 45m from Mumbai', startingFare: '₹2,200' },
      train: { title: 'Jaipur Junction (JP)', distance: 'Central Jaipur', duration: 'Vande Bharat / Ajmer Shatabdi (4h from Delhi)', startingFare: '₹480' },
      bus: { title: 'Sindhi Camp Central Bus Stand', distance: 'Central Jaipur', duration: 'Deluxe AC Buses on Delhi-Jaipur Expressway (4.5h)', startingFare: '₹450' }
    },
    curatedStays: [
      {
        id: 'jpr_stay_1',
        name: 'Rambagh Palace Jaipur (IHCL)',
        type: '5-Star Royal Palace',
        rating: 4.9,
        reviewsCount: 3100,
        price: 26000,
        originalPrice: 35000,
        discountBadge: '25% OFF',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        address: 'Bhawani Singh Road, Jaipur',
        amenities: ['Peacock Courtyards', 'Indoor & Outdoor Heated Pools', 'Royal Butler Service', 'Jiva Grande Spa'],
        verified: true,
        rooms: [
          { type: 'Palace Historical Room', price: 26000, originalPrice: 35000, capacity: '2 Adults', perks: ['Palace Garden View', 'Royal High Tea', 'Free Breakfast'] }
        ]
      },
      {
        id: 'jpr_stay_2',
        name: 'OYO Townhouse 045 MI Road Pink City',
        type: 'Smart Heritage Hotel',
        rating: 4.6,
        reviewsCount: 1540,
        price: 1999,
        originalPrice: 3500,
        discountBadge: '43% OFF',
        image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
        address: 'MI Road, Jaipur',
        amenities: ['AC & High-Speed WiFi', '24/7 Front Desk', 'In-house Rajasthani Dining'],
        verified: true,
        rooms: [
          { type: 'Townhouse Deluxe Room', price: 1999, originalPrice: 3500, capacity: '2 Adults', perks: ['Free Breakfast', 'Central Location'] }
        ]
      }
    ],
    activityPool: [
      { id: 'j1', title: 'Amber Fort & Palace Jeep ascent & mirror palace', category: 'heritage', timeSlot: '08:30', duration: '3 hrs', cost: '₹100 entry', tip: 'Marvel at the Sheesh Mahal reflecting single candle lights.', location: 'Amer, Jaipur', bestTimeOfDay: 'morning' },
      { id: 'j2', title: 'Hawa Mahal (Palace of Winds) street photography', category: 'sightseeing', timeSlot: '11:45', duration: '1 hr', cost: '₹50 entry', tip: 'Best photographed from Wind View Cafe across main street.', location: 'Badi Chaupar', bestTimeOfDay: 'morning' },
      { id: 'j3', title: 'City Palace & Jantar Mantar Astronomical Observatory', category: 'heritage', timeSlot: '13:30', duration: '2.5 hrs', cost: '₹200 entry', tip: 'Home to royal family and world’s largest stone sundial.', location: 'Old City', bestTimeOfDay: 'afternoon' },
      { id: 'j4', title: 'Rajasthani Thali Feast at LMB or Chokhi Dhani', category: 'food', timeSlot: '15:00', duration: '1.5 hrs', cost: '₹450 – ₹900', tip: 'Try Dal Baati Churma, Gatte ki Sabzi, and Ghevar sweets.', location: 'Johari Bazaar', bestTimeOfDay: 'afternoon' },
      { id: 'j5', title: 'Sunset & City Skyline from Nahargarh Fort', category: 'sightseeing', timeSlot: '18:00', duration: '2 hrs', cost: '₹50 entry', tip: 'Watch the entire Pink City glow golden under twilight at Padao cafe.', location: 'Aravalli Hills', bestTimeOfDay: 'evening' },
      { id: 'j6', title: 'Jaigarh Fort & Jaivana (World\'s Largest Cannon on Wheels)', category: 'heritage', timeSlot: '10:30', duration: '2 hrs', cost: '₹70 entry', tip: 'Interconnected underground tunnels leading from Amber Fort.', location: 'Amer Hilltop', bestTimeOfDay: 'morning' },
      { id: 'j7', title: 'Johari Bazaar & Bapu Bazaar Gem & Textile Shopping', category: 'shopping', timeSlot: '16:30', duration: '2.5 hrs', cost: 'Variable', tip: 'Shop for Jaipuri razai quilts, blue pottery, and silver jewellery.', location: 'Walled City', bestTimeOfDay: 'afternoon' },
      { id: 'j8', title: 'Patrika Gate Photography & Jawahar Circle Garden Walk', category: 'sightseeing', timeSlot: '07:30', duration: '1.5 hrs', cost: 'Free', tip: 'Nine vibrant hand-painted arches representing Rajasthan history.', location: 'Jawahar Circle', bestTimeOfDay: 'morning' },
      { id: 'j9', title: 'Galta Ji (Monkey Temple) Natural Spring Kund Walk', category: 'nature', timeSlot: '16:00', duration: '2 hrs', cost: 'Free', tip: 'Ancient Hindu pilgrimage site built between narrow mountain cliff pass.', location: 'Galta Hill', bestTimeOfDay: 'afternoon' },
      { id: 'j10', title: 'Traditional Puppet Show & Folk Music at Chokhi Dhani', category: 'cultural', timeSlot: '19:30', duration: '3.5 hrs', cost: '₹900 buffet', tip: 'Ethnic village resort with camel rides, acrobatics, and royal dining.', location: 'Tonk Road', bestTimeOfDay: 'night' }
    ],
    thingsToDo: [
      'Ascend Amber Fort and view the Mirror Palace',
      'Photograph the iconic facade of Hawa Mahal',
      'Shop for textiles in Johari and Bapu Bazaars',
      'Enjoy sunset from Nahargarh Fort overlooking Jaipur'
    ],
    localFood: [
      'Dal Baati Churma with Pure Ghee at LMB',
      'Pyaaz Kachori with spicy tamarind chutney at Rawat',
      'Laal Maas (Royal mutton curry) at Handi',
      'Ghevar & Mawa Kachori sweets'
    ],
    popularPlaces: [
      { name: 'Amber Fort', type: 'Royal Fortress', desc: 'Hilltop fort with ornate courtyards and panoramic valley views.' },
      { name: 'Hawa Mahal', type: 'Palace Facade', desc: 'Five-story pink sandstone palace with 953 honeycombed windows.' },
      { name: 'City Palace', type: 'Royal Residence', desc: 'Grand courtyards, museums, and Rajasthani-Mughal architecture.' },
      { name: 'Nahargarh Fort', type: 'Hilltop Vantage', desc: 'Historic defensive fortification on the edge of the Aravalli hills.' }
    ]
  },
  {
    id: 'agra',
    name: 'Agra',
    state: 'Uttar Pradesh',
    region: 'North',
    category: 'heritage',
    tag: 'Wonder of the World',
    tagline: 'Home of the timeless Taj Mahal, red sandstone Mughal palaces, and rich Mughlai petha confections.',
    heroImage: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1400&q=80',
    bestTime: 'Oct – Mar (Pleasant temperatures 12°C - 26°C)',
    avgBudget: '₹2,000 – ₹4,800 / day',
    idealDays: '1 - 2 Days',
    rating: 4.9,
    reviews: '28.9k',
    gettingAround: 'Battery rickshaws, auto-rickshaws, and app cabs.',
    tags: ['Taj Mahal', 'UNESCO World Heritage', 'Mughal Architecture', 'History'],
    topHighlights: ['Taj Mahal Sunrise', 'Agra Fort', 'Mehtab Bagh Sunset', 'Fatehpur Sikri'],
    weather: {
      temp: '23°C',
      condition: 'Sunny & Clear',
      clothingTip: 'Comfortable footwear (shoe covers provided at Taj).',
      bestMonths: 'October to March'
    },
    howToReach: {
      flight: { title: 'Agra Airport (AGR) / DEL Airport', distance: '12 km / Delhi (2.5h Yamuna Expressway)', duration: 'Direct flights from BLR / BOM / DEL', startingFare: '₹2,700' },
      train: { title: 'Agra Cantt Railway Station (AGC)', distance: 'Central Agra', duration: 'Gatimaan Express (1h 40m from Delhi)', startingFare: '₹390' },
      bus: { title: 'ISBT Agra & Yamuna Expressway Buses', distance: 'Transport Nagar', duration: 'Frequent Volvo AC buses from Delhi & Jaipur', startingFare: '₹380' }
    },
    curatedStays: [
      {
        id: 'agr_stay_1',
        name: 'The Oberoi Amarvilas Agra',
        type: '5-Star Luxury Monument View',
        rating: 4.9,
        reviewsCount: 3800,
        price: 28000,
        originalPrice: 38000,
        discountBadge: '26% OFF',
        image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
        address: 'Taj East Gate Road, Agra',
        amenities: ['Direct Taj Mahal View from Every Room', 'Golf Buggy to Taj', 'Mughal Swimming Pool', 'Luxury Spa'],
        verified: true,
        rooms: [
          { type: 'Premier Room with Taj View', price: 28000, originalPrice: 38000, capacity: '2 Adults', perks: ['Unobstructed Taj View', 'Free Breakfast', 'Private Balcony'] }
        ]
      },
      {
        id: 'agr_stay_2',
        name: 'OYO Townhouse 092 Taj Ganj',
        type: 'Smart Budget Stay',
        rating: 4.5,
        reviewsCount: 1420,
        price: 1599,
        originalPrice: 2800,
        discountBadge: '43% OFF',
        image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
        address: 'Taj Ganj, 800m from Taj East Gate, Agra',
        amenities: ['Rooftop Taj View Cafe', 'Free High-Speed WiFi', '24h Hot Water'],
        verified: true,
        rooms: [
          { type: 'Classic AC Room', price: 1599, originalPrice: 2800, capacity: '2 Adults', perks: ['Free Breakfast', 'Walk to Taj Mahal'] }
        ]
      }
    ],
    activityPool: [
      { id: 'ag1', title: 'Taj Mahal Sunrise viewing tour', category: 'heritage', timeSlot: '06:00', duration: '3 hrs', cost: '₹50 entry', tip: 'Arrive early at East Gate to see the white marble glow pink in morning light.', location: 'Taj Mahal East Gate', bestTimeOfDay: 'morning' },
      { id: 'ag2', title: 'Agra Fort royal halls and Sheesh Mahal', category: 'heritage', timeSlot: '10:30', duration: '2.5 hrs', cost: '₹50 entry', tip: 'View the Taj Mahal across the Yamuna River from Shah Jahan’s prison tower.', location: 'Agra Fort', bestTimeOfDay: 'morning' },
      { id: 'ag3', title: 'Traditional Mughlai lunch and Agra Petha tasting', category: 'food', timeSlot: '13:30', duration: '1.5 hrs', cost: '₹300 – ₹700', tip: 'Try authentic Angoori and Kesar Petha at Panchhi Petha.', location: 'Sadars Bazaar', bestTimeOfDay: 'afternoon' },
      { id: 'ag4', title: 'Mehtab Bagh sunset silhouette view of Taj Mahal', category: 'nature', timeSlot: '17:00', duration: '2 hrs', cost: '₹25 entry', tip: 'Quiet garden complex directly behind Taj across the river.', location: 'Across Yamuna River', bestTimeOfDay: 'evening' },
      { id: 'ag5', title: 'Fatehpur Sikri Mughal Red Sandstone Ghost City Excursion', category: 'heritage', timeSlot: '14:00', duration: '3.5 hrs', cost: '₹50 entry', tip: 'Buland Darwaza and Sufi shrine of Salim Chishti (37 km from Agra).', location: 'Fatehpur Sikri', bestTimeOfDay: 'afternoon' },
      { id: 'ag6', title: 'Itmad-ud-Daulah (Baby Taj) Intricate Marble Inlay Tour', category: 'heritage', timeSlot: '11:00', duration: '1.5 hrs', cost: '₹30 entry', tip: 'First Mughal structure constructed completely from white marble.', location: 'Moti Bagh', bestTimeOfDay: 'morning' },
      { id: 'ag7', title: 'Sadar Bazaar Handicrafts & Marble Miniature Souvenirs', category: 'shopping', timeSlot: '18:30', duration: '2 hrs', cost: 'Variable', tip: 'Buy Pietra Dura marble inlay boxes and leather footwear.', location: 'Sadar Bazaar', bestTimeOfDay: 'evening' }
    ],
    thingsToDo: ['Watch sunrise at Taj Mahal', 'Tour Agra Fort and Diwan-i-Khas', 'Day trip to ghost city Fatehpur Sikri', 'Sample fresh Agra Petha sweets'],
    localFood: ['Panchhi Petha (Angoori & Paan Flavors)', 'Bedmi Puri & Aloo Sabzi breakfast', 'Mughlai Biryani & Korma at Pinch of Spice', 'Hot Jalebi & Rabri at Deviram'],
    popularPlaces: [
      { name: 'Taj Mahal', type: 'World Wonder', desc: 'Ivory-white marble mausoleum on the south bank of the Yamuna River.' },
      { name: 'Agra Fort', type: 'UNESCO Fortress', desc: 'Main residence of the emperors of the Mughal Dynasty till 1638.' },
      { name: 'Fatehpur Sikri', type: 'Ancient Mughal City', desc: 'Red sandstone fortified city built by Emperor Akbar.' },
      { name: 'Mehtab Bagh', type: 'Mughal Garden', desc: 'Moonlight garden aligned perfectly with the Taj Mahal.' }
    ]
  },
  {
    id: 'varanasi',
    name: 'Varanasi',
    state: 'Uttar Pradesh',
    region: 'North',
    category: 'spiritual',
    tag: 'Spiritual Capital on the Holy Ganges',
    tagline: 'The world’s oldest living city, famous for ancient ghats along the sacred Ganges, evening Aarti rituals, and silk weavers.',
    heroImage: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1400&q=80',
    bestTime: 'Oct – Mar (Pleasant temperatures & misty ghats 14°C - 28°C)',
    avgBudget: '₹1,500 – ₹4,000 / day',
    idealDays: '2 - 3 Days',
    rating: 4.9,
    reviews: '19.8k',
    gettingAround: 'E-rickshaws, cycle rickshaws, boat rides, and walking narrow lanes.',
    tags: ['Spiritual', 'Ghats & Boats', 'Ganga Aarti', 'Ancient History', 'Silk Sarees'],
    topHighlights: ['Sunrise Boat Ride on Ganges', 'Dashashwamedh Evening Ganga Aarti', 'Kashi Vishwanath Corridor', 'Sarnath Buddhist Sites'],
    weather: {
      temp: '22°C',
      condition: 'Misty Mornings & Sacred Ghat Sunshine',
      clothingTip: 'Modest traditional attire for temples and boat rides.',
      bestMonths: 'October to March'
    },
    howToReach: {
      flight: { title: 'Lal Bahadur Shastri Int. Airport (VNS)', distance: 'Babatpur (24 km to city center)', duration: '1h 20m from Delhi / 2h from Mumbai', startingFare: '₹2,600' },
      train: { title: 'Varanasi Junction (BSB) / Banaras (BSBS)', distance: 'Central City', duration: 'Vande Bharat Express (8h from Delhi)', startingFare: '₹550' },
      bus: { title: 'UPSRTC Kashi Bus Stand', distance: 'Cantt Varanasi', duration: 'Connected with Lucknow, Prayagraj, Patna', startingFare: '₹400' }
    },
    curatedStays: [
      {
        id: 'var_stay_1',
        name: 'BrijRama Palace Varanasi (Heritage on Ghat)',
        type: '5-Star Heritage Ghat Palace',
        rating: 4.9,
        reviewsCount: 2200,
        price: 16500,
        originalPrice: 22000,
        discountBadge: '25% OFF',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        address: 'Darbhanga Ghat, Varanasi',
        amenities: ['Private Boat Transfer', 'Direct Ghat Access', 'Live Classical Sitar Music', 'Pure Vegetarian Royal Dining'],
        verified: true,
        rooms: [
          { type: 'Nadidhara River View Suite', price: 16500, originalPrice: 22000, capacity: '2 Adults', perks: ['Ganges River View', 'Sunrise Boat Ride', 'Free Breakfast'] }
        ]
      },
      {
        id: 'var_stay_2',
        name: 'OYO Flagship 8823 Godowlia Kashi',
        type: 'Comfort City Hotel',
        rating: 4.5,
        reviewsCount: 1120,
        price: 1499,
        originalPrice: 2500,
        discountBadge: '40% OFF',
        image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
        address: 'Godowlia Chowk, 400m from Kashi Vishwanath',
        amenities: ['AC Room', 'Free WiFi', 'Walk to Temple & Ghats'],
        verified: true,
        rooms: [
          { type: 'Deluxe AC Room', price: 1499, originalPrice: 2500, capacity: '2 Adults', perks: ['Free WiFi', 'Prime Temple Location'] }
        ]
      }
    ],
    activityPool: [
      { id: 'v1', title: 'Sunrise Hand-rowed Boat Ride along the Ghats', category: 'wellness', timeSlot: '05:30', duration: '2 hrs', cost: '₹300 – ₹600', tip: 'Watch morning rituals and cremations at Manikarnika and Harishchandra Ghats.', location: 'Assi Ghat to Dashashwamedh', bestTimeOfDay: 'morning' },
      { id: 'v2', title: 'Kashi Vishwanath Temple Corridor Darshan', category: 'heritage', timeSlot: '08:30', duration: '2.5 hrs', cost: 'Free / VIP ₹300', tip: 'Golden temple dedicated to Lord Shiva; carry photo ID.', location: 'Vishwanath Gali', bestTimeOfDay: 'morning' },
      { id: 'v3', title: 'Narrow Alleyways Street Food Trail (Kachori & Lassi)', category: 'food', timeSlot: '11:30', duration: '2 hrs', cost: '₹200 – ₹400', tip: 'Try Blue Lassi Shop, Ram Bhandar Kachori, and Malaiyyo foam sweet.', location: 'Thatheri Bazaar', bestTimeOfDay: 'morning' },
      { id: 'v4', title: 'Sarnath Buddhist Pilgrimage & Dhamek Stupa', category: 'heritage', timeSlot: '14:30', duration: '3 hrs', cost: '₹25 entry', tip: 'Site where Lord Buddha gave his first sermon after enlightenment.', location: 'Sarnath (10 km)', bestTimeOfDay: 'afternoon' },
      { id: 'v5', title: 'Grand Evening Ganga Aarti at Dashashwamedh Ghat', category: 'cultural', timeSlot: '18:30', duration: '1.5 hrs', cost: 'Free', tip: 'Reserve a wooden boat on the river for the best unobstructed view.', location: 'Dashashwamedh Ghat', bestTimeOfDay: 'evening' },
      { id: 'v6', title: 'Banarasi Silk Saree Weavers Colony Workshop Tour', category: 'shopping', timeSlot: '16:00', duration: '2 hrs', cost: 'Free', tip: 'Watch master craftsmen weave real zari gold threads on handlooms.', location: 'Chowk / Madanpura', bestTimeOfDay: 'afternoon' },
      { id: 'v7', title: 'Subah-e-Banaras Morning Ragas & Yoga at Assi Ghat', category: 'wellness', timeSlot: '05:00', duration: '1.5 hrs', cost: 'Free', tip: 'Classical Vedic chants, morning flute music, and free yoga.', location: 'Assi Ghat', bestTimeOfDay: 'morning' }
    ],
    thingsToDo: ['Sunrise boat ride on the sacred Ganges', 'Witness the spectacular evening Ganga Aarti', 'Visit Kashi Vishwanath Golden Temple', 'Excursion to Sarnath deer park & stupas'],
    localFood: ['Banarasi Kachori Jalebi at Ram Bhandar', 'Banarasi Maghai Paan at Keshav Tambool', 'Malaiyyo (Winter saffron milk foam sweet)', 'Blue Lassi with fresh pomegranate & rabri'],
    popularPlaces: [
      { name: 'Dashashwamedh Ghat', type: 'Sacred Ghat', desc: 'Main ghat where the world-famous evening Ganga Aarti is performed.' },
      { name: 'Kashi Vishwanath Temple', type: 'Jyotirlinga Temple', desc: 'One of the twelve sacred Jyotirlingas of Lord Shiva.' },
      { name: 'Assi Ghat', type: 'Cultural Ghat', desc: 'Southernmost ghat known for morning yoga and music concerts.' },
      { name: 'Sarnath', type: 'Buddhist Site', desc: 'Ancient deer park where Buddha preached his first sermon.' }
    ]
  },
  {
    id: 'kerala',
    name: 'Kerala (Kochi & Munnar)',
    state: 'Kerala',
    region: 'South',
    category: 'nature',
    tag: "God's Own Country & Backwaters",
    tagline: 'Tranquil emerald backwaters, rolling Munnar tea estates, spice plantations, and Ayurvedic healing sanctuaries.',
    heroImage: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1400&q=80',
    bestTime: 'Sep – Mar (Cool breezes, lush post-monsoon greenery 18°C - 30°C)',
    avgBudget: '₹2,500 – ₹6,500 / day',
    idealDays: '4 - 6 Days',
    rating: 4.9,
    reviews: '24.2k',
    gettingAround: 'Houseboats, private cabs, auto-rickshaws, and ferries.',
    tags: ['Backwaters', 'Tea Estates', 'Houseboats', 'Ayurveda', 'Spice Plantations'],
    topHighlights: ['Alleppey Houseboat Cruise', 'Munnar Tea Gardens', 'Fort Kochi Chinese Nets', 'Kathakali Dance Show'],
    weather: {
      temp: '26°C',
      condition: 'Tropical Coastal Breeze & Lush Greenery',
      clothingTip: 'Breathable cottons; light woollens for Munnar hill stations.',
      bestMonths: 'September to March'
    },
    howToReach: {
      flight: { title: 'Cochin International Airport (COK)', distance: 'Nedumbassery (Solar-powered airport)', duration: 'Direct from all metro cities & Middle East', startingFare: '₹2,900' },
      train: { title: 'Ernakulam Junction (ERS) / Town (ERN)', distance: 'Central Kochi', duration: 'Vande Bharat & Superfast Kerala Express', startingFare: '₹680' },
      bus: { title: 'KSRTC Central Bus Stand Ernakulam', distance: 'Kochi & Munnar routes', duration: 'Scenic hill route buses to Munnar (4h)', startingFare: '₹300' }
    },
    curatedStays: [
      {
        id: 'ker_stay_1',
        name: 'Kumarakom Lake Resort & Luxury Houseboats',
        type: '5-Star Backwater Sanctuary',
        rating: 4.9,
        reviewsCount: 3900,
        price: 18000,
        originalPrice: 24000,
        discountBadge: '25% OFF',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        address: 'Kumarakom, Vembanad Lake, Kerala',
        amenities: ['Meandering Pool Villa', 'Ayurvedic Spa', 'Lakefront Dining', 'Sunset Cruise', 'Free WiFi'],
        verified: true,
        rooms: [
          { type: 'Heritage Meandering Pool Villa', price: 18000, originalPrice: 24000, capacity: '2 Adults', perks: ['Direct Pool Access', 'Free Breakfast', 'Evening High Tea'] }
        ]
      },
      {
        id: 'ker_stay_2',
        name: 'OYO Townhouse 522 Fort Kochi',
        type: 'Heritage Boutique Stay',
        rating: 4.6,
        reviewsCount: 1320,
        price: 2199,
        originalPrice: 3800,
        discountBadge: '42% OFF',
        image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
        address: 'Princess Street, Fort Kochi',
        amenities: ['AC & Balcony', 'Free WiFi', 'Walk to Chinese Fishing Nets'],
        verified: true,
        rooms: [
          { type: 'Heritage AC Room', price: 2199, originalPrice: 3800, capacity: '2 Adults', perks: ['Free Breakfast', 'Historic Quarter Walk'] }
        ]
      }
    ],
    activityPool: [
      { id: 'k1', title: 'Overnight Houseboat Cruise in Alleppey Backwaters', category: 'nature', timeSlot: '12:00', duration: 'Overnight', cost: '₹6,000 – ₹12,000', tip: 'Glaze past palm-fringed canals, paddy fields, and enjoy fresh Karimeen fish.', location: 'Punnamada Jetty, Alleppey', bestTimeOfDay: 'afternoon' },
      { id: 'k2', title: 'Munnar Tea Plantation walk & Lockhart Tea Museum', category: 'nature', timeSlot: '09:00', duration: '3 hrs', cost: '₹150 entry', tip: 'Rolling hills wrapped in mist; sample freshly plucked Orthodox tea.', location: 'Munnar Valley', bestTimeOfDay: 'morning' },
      { id: 'k3', title: 'Fort Kochi Heritage walk & Chinese Fishing Nets', category: 'heritage', timeSlot: '16:00', duration: '2.5 hrs', cost: 'Free', tip: 'Watch fishermen lower cantilevered giant nets during sunset.', location: 'Vasco da Gama Square, Fort Kochi', bestTimeOfDay: 'afternoon' },
      { id: 'k4', title: 'Traditional Kathakali & Kalaripayattu Martial Art Show', category: 'cultural', timeSlot: '18:00', duration: '2 hrs', cost: '₹400 entry', tip: 'Arrive 30 mins early to witness the elaborate facial makeup ritual.', location: 'Kerala Kathakali Centre, Fort Kochi', bestTimeOfDay: 'evening' },
      { id: 'k5', title: 'Authentic Ayurvedic Full-Body Abhyanga Rejuvenation Massage', category: 'wellness', timeSlot: '10:30', duration: '1.5 hrs', cost: '₹1,500 – ₹2,500', tip: 'Herbal medicated oils applied by certified traditional therapists.', location: 'Ayurveda Sanatorium, Fort Kochi / Munnar', bestTimeOfDay: 'morning' },
      { id: 'k6', title: 'Eravikulam National Park Nilgiri Tahr Safari & Anamudi View', category: 'adventure', timeSlot: '08:30', duration: '3 hrs', cost: '₹200 entry', tip: 'Spot the endangered mountain goat and view South India’s highest peak.', location: 'Munnar', bestTimeOfDay: 'morning' },
      { id: 'k7', title: 'Periyar Wildlife Sanctuary Bamboo Rafting & Spice Garden Tour', category: 'nature', timeSlot: '07:30', duration: '4 hrs', cost: '₹1,800 package', tip: 'Spot wild elephants and learn about cardamom, pepper, and cinnamon trees.', location: 'Thekkady', bestTimeOfDay: 'morning' }
    ],
    thingsToDo: ['Cruise backwaters on a traditional Kettuvallam', 'Walk through emerald tea gardens of Munnar', 'Watch Kathakali dance and Kalaripayattu show', 'Try an authentic Ayurvedic rejuvenation massage'],
    localFood: ['Kerala Sadya served on Banana Leaf', 'Appam with Vegetable Stew & Egg Roast', 'Karimeen Pollichathu (Pearl Spot Fish wrapped in banana leaf)', 'Malabar Parotta with Pepper Chicken Curry'],
    popularPlaces: [
      { name: 'Alleppey Backwaters', type: 'Canal Network', desc: 'Vast network of interconnected palm-fringed lagoons.' },
      { name: 'Munnar Tea Hills', type: 'Hill Station', desc: 'Rolling tea estates at 1,600m above sea level.' },
      { name: 'Fort Kochi', type: 'Colonial Port', desc: 'Historic neighborhood blending Portuguese, Dutch and British charm.' },
      { name: 'Eravikulam National Park', type: 'Wildlife Sanctuary', desc: 'Home to the endangered Nilgiri Tahr mountain goat.' }
    ]
  },
  {
    id: 'ladakh',
    name: 'Ladakh (Leh)',
    state: 'Ladakh',
    region: 'Himalayas',
    category: 'adventure',
    tag: 'The Land of High Mountain Passes',
    tagline: 'High-altitude desert mountains, crystal blue Pangong Lake, Buddhist gompas, and world’s highest motorable roads.',
    heroImage: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1400&q=80',
    bestTime: 'May – Sep (Open mountain passes & clear skies 8°C - 20°C)',
    avgBudget: '₹3,000 – ₹7,500 / day',
    idealDays: '5 - 7 Days',
    rating: 4.9,
    reviews: '14.5k',
    gettingAround: '4x4 SUVs, local taxis, and Royal Enfield motorcycle rentals.',
    tags: ['High Altitude', 'Pangong Lake', 'Monasteries', 'Motorcycling', 'Stargazing'],
    topHighlights: ['Pangong Tso Lake', 'Nubra Valley & Double-Humped Camels', 'Khardung La Pass (17,582 ft)', 'Thiksey Monastery'],
    weather: {
      temp: '12°C',
      condition: 'Bright Alpine Sun & Cool Mountain Winds',
      clothingTip: 'Thermal innerwear, fleece, windproof jacket, and UV-400 sunglasses.',
      bestMonths: 'May to September'
    },
    howToReach: {
      flight: { title: 'Kushok Bakula Rimpochee Airport (IXL)', distance: 'Leh (Highest commercial airport in India)', duration: '1h 15m scenic flight from Delhi', startingFare: '₹4,800' },
      train: { title: 'Jammu Tawi (JAT) / Chandigarh Station', distance: 'Requires 2-day road journey via Manali or Srinagar', duration: 'Scenic Himalayan overland road trip', startingFare: '₹950' },
      bus: { title: 'HRTC Delhi-Leh Special / HPTDC Luxury Bus', distance: 'ISBT Delhi / Manali', duration: 'Overnight stop at Keylong (Seasonal Jun-Oct)', startingFare: '₹1,600' }
    },
    curatedStays: [
      {
        id: 'lad_stay_1',
        name: 'The Grand Dragon Ladakh',
        type: '5-Star Luxury Eco-Resort',
        rating: 4.9,
        reviewsCount: 2100,
        price: 13500,
        originalPrice: 18000,
        discountBadge: '25% OFF',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        address: 'Old Road, Sheynam, Leh, Ladakh',
        amenities: ['Oxygen-Enriched Heated Rooms', 'Stok Kangri Mountain View', 'Multi-Cuisine Dining', 'Free WiFi'],
        verified: true,
        rooms: [
          { type: 'Deluxe Heritage Mountain View', price: 13500, originalPrice: 18000, capacity: '2 Adults', perks: ['Snow Peak Panorama', 'Free Breakfast & Dinner', 'Oxygen Assistance'] }
        ]
      },
      {
        id: 'lad_stay_2',
        name: 'OYO Home 38401 Pangong Alpine Retreat',
        type: 'Glamping Camp on Lake',
        rating: 4.6,
        reviewsCount: 890,
        price: 2899,
        originalPrice: 4500,
        discountBadge: '35% OFF',
        image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
        address: 'Spangmik Village, Pangong Tso Lake',
        amenities: ['Lake View Tents', 'Attached Bathroom with Hot Water', 'Stargazing Lawn', 'Campfire'],
        verified: true,
        rooms: [
          { type: 'Luxury Swiss Lake View Tent', price: 2899, originalPrice: 4500, capacity: '2 Adults', perks: ['Lake Shore View', 'Dinner & Breakfast Included'] }
        ]
      }
    ],
    activityPool: [
      { id: 'l1', title: 'Pangong Tso Lake excursion & camp under stars', category: 'nature', timeSlot: '08:00', duration: 'Full Day', cost: '₹4,000 SUV pool', tip: 'Endorheic lake changing colors from turquoise to deep indigo.', location: 'Pangong Tso (140 km from Leh)', bestTimeOfDay: 'morning' },
      { id: 'l2', title: 'Nubra Valley sand dunes & Bactrian Camel Safari', category: 'adventure', timeSlot: '09:00', duration: 'Full Day', cost: '₹500 ride', tip: 'Cross Khardung La Pass into high-altitude white sand dunes of Hunder.', location: 'Hunder, Nubra Valley', bestTimeOfDay: 'morning' },
      { id: 'l3', title: 'Thiksey Monastery sunrise morning chanting prayer', category: 'spiritual', timeSlot: '06:00', duration: '2.5 hrs', cost: '₹30 entry', tip: 'Resembles the Potala Palace of Lhasa; houses a 49-ft Maitreya Buddha.', location: 'Thiksey Gompa', bestTimeOfDay: 'morning' },
      { id: 'l4', title: 'Leh Palace & Shanti Stupa evening sunset view', category: 'sightseeing', timeSlot: '17:30', duration: '2 hrs', cost: 'Free', tip: 'Panoramic 360-degree sunset over Leh town and Indus river.', location: 'Chanspa, Leh', bestTimeOfDay: 'evening' },
      { id: 'l5', title: 'Magnetic Hill & Sangam (Indus-Zanskar River Confluence)', category: 'sightseeing', timeSlot: '11:00', duration: '2.5 hrs', cost: 'Free', tip: 'Experience anti-gravity vehicle roll and gaze at two distinct colored rivers meeting.', location: 'Nimmu, Leh-Srinagar Highway', bestTimeOfDay: 'morning' },
      { id: 'l6', title: 'Stargazing & Milky Way Photography in Hanle / Nubra', category: 'nature', timeSlot: '21:00', duration: '3 hrs', cost: 'Free', tip: 'India’s premier Dark Sky Reserve with crystal clear celestial skies.', location: 'Hanle / Hunder', bestTimeOfDay: 'night' }
    ],
    thingsToDo: ['Drive to Pangong Lake & camp under the Milky Way', 'Ride across Khardung La Pass (17,582 ft)', 'Ride Bactrian double-humped camels in Nubra dunes', 'Experience anti-gravity at Magnetic Hill'],
    localFood: ['Ladakhi Thukpa & Steamed Tingmo', 'Butter Tea (Gur Gur Chai) with Tsampa', 'Mutton Momos with Spicy Sesame Chutney', 'Skyu (Traditional Ladakhi vegetable pasta stew)'],
    popularPlaces: [
      { name: 'Pangong Tso', type: 'Alpine Lake', desc: '134 km long lake extending from India to Tibetan China.' },
      { name: 'Nubra Valley', type: 'Desert Valley', desc: 'Tri-armed valley famous for sand dunes and double-humped camels.' },
      { name: 'Shanti Stupa', type: 'Peace Pagoda', desc: 'White-domed Buddhist stupa offering spectacular valley vistas.' },
      { name: 'Khardung La', type: 'Mountain Pass', desc: 'One of the world’s highest motorable roads at 17,582 ft.' }
    ]
  },
  {
    id: 'udaipur',
    name: 'Udaipur',
    state: 'Rajasthan',
    region: 'North',
    category: 'heritage',
    tag: 'City of Lakes & Royal Romance',
    tagline: 'The Venice of the East, famed for shimmering Lake Pichola, royal marble palaces, and romantic heritage courtyards.',
    heroImage: 'https://images.unsplash.com/photo-1605649487212-47bdab064df8?auto=format&fit=crop&w=1400&q=80',
    bestTime: 'Oct – Mar (Pleasant lake breezes 14°C - 28°C)',
    avgBudget: '₹2,500 – ₹6,500 / day',
    idealDays: '2 - 3 Days',
    rating: 4.8,
    reviews: '17.2k',
    gettingAround: 'Auto-rickshaws, boats, and walking heritage streets.',
    tags: ['Lakes', 'Palaces', 'Romance', 'Rooftop Dining', 'Royal Heritage'],
    topHighlights: ['City Palace Complex', 'Lake Pichola Boat Cruise', 'Jag Mandir Palace', 'Sajjangarh Monsoon Palace'],
    weather: {
      temp: '25°C',
      condition: 'Sunny & Shimmering Waters',
      clothingTip: 'Smart casuals and comfortable footwear for stone courtyards.',
      bestMonths: 'October to March'
    },
    howToReach: {
      flight: { title: 'Maharana Pratap Airport (UDR)', distance: 'Dabok (22 km from Old City)', duration: '1h 10m from Mumbai / Delhi', startingFare: '₹2,400' },
      train: { title: 'Udaipur City Railway Station (UDZ)', distance: 'Central Udaipur (3 km to Pichola)', duration: 'Vande Bharat / Mewar Express', startingFare: '₹520' },
      bus: { title: 'Udaipur Central Bus Stand (Udiapole)', distance: 'Udiapole', duration: 'Frequent AC Sleeper from Ahmedabad, Jaipur, Jodhpur', startingFare: '₹450' }
    },
    curatedStays: [
      {
        id: 'udr_stay_1',
        name: 'Taj Lake Palace Udaipur (Floating Island)',
        type: '5-Star Royal Palace',
        rating: 4.9,
        reviewsCount: 3890,
        price: 32000,
        originalPrice: 44000,
        discountBadge: '27% OFF',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        address: 'Lake Pichola, Udaipur',
        amenities: ['Private Boat Arrival', 'Jharokha Lake Views', 'Jiva Spa Boat', 'Royal Mewari Dinners'],
        verified: true,
        rooms: [
          { type: 'Luxury Palace Lake View Chamber', price: 32000, originalPrice: 44000, capacity: '2 Adults', perks: ['Panoramic Pichola View', 'Royal Butler', 'Free Breakfast'] }
        ]
      },
      {
        id: 'udr_stay_2',
        name: 'OYO Townhouse 182 Lake View Jagdish Chowk',
        type: 'Heritage Smart Hotel',
        rating: 4.6,
        reviewsCount: 1650,
        price: 2299,
        originalPrice: 3900,
        discountBadge: '41% OFF',
        image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
        address: 'Near Jagdish Temple & Pichola Ghat, Udaipur',
        amenities: ['Rooftop Lake View Cafe', 'AC & High-Speed WiFi', '24h Hot Water'],
        verified: true,
        rooms: [
          { type: 'Deluxe Heritage View Room', price: 2299, originalPrice: 3900, capacity: '2 Adults', perks: ['Rooftop Pichola View', 'Free Breakfast'] }
        ]
      }
    ],
    activityPool: [
      { id: 'u1', title: 'City Palace tour & crystal gallery', category: 'heritage', timeSlot: '09:30', duration: '3 hrs', cost: '₹300 entry', tip: 'Rajasthan’s largest palace complex overlooking Lake Pichola.', location: 'Old City, Udaipur', bestTimeOfDay: 'morning' },
      { id: 'u2', title: 'Lake Pichola Sunset Boat Cruise to Jagmandir', category: 'sightseeing', timeSlot: '16:30', duration: '1.5 hrs', cost: '₹500 / person', tip: 'Watch the marble walls of Taj Lake Palace illuminate at dusk.', location: 'Rameshwar Ghat Jetty', bestTimeOfDay: 'evening' },
      { id: 'u3', title: 'Rooftop Candlelight Dinner overlooking Lake Pichola', category: 'food', timeSlot: '19:30', duration: '2.5 hrs', cost: '₹900 – ₹2,000', tip: 'Dine at Upre, Ambrai, or Charcoal with illuminated palace views.', location: 'Hanuman Ghat', bestTimeOfDay: 'night' },
      { id: 'u4', title: 'Bagore Ki Haveli Dharohar Folk Dance Show', category: 'cultural', timeSlot: '19:00', duration: '1.5 hrs', cost: '₹100 entry', tip: 'Thrilling Rajasthani folk dances, puppet acts, and fire dancing.', location: 'Gangaur Ghat', bestTimeOfDay: 'night' },
      { id: 'u5', title: 'Sajjangarh (Monsoon Palace) Hilltop Sunset Panorama', category: 'sightseeing', timeSlot: '16:00', duration: '2 hrs', cost: '₹60 entry', tip: 'High hilltop fort offering 360-degree views of Udaipur lakes and Aravallis.', location: 'Bansdara Peak', bestTimeOfDay: 'afternoon' },
      { id: 'u6', title: 'Saheliyon Ki Bari Royal Fountains & Lotus Pools', category: 'nature', timeSlot: '11:00', duration: '1.5 hrs', cost: '₹20 entry', tip: 'Lush historic garden with marble elephants and natural rain fountains.', location: 'Panchwati', bestTimeOfDay: 'morning' }
    ],
    thingsToDo: ['Explore City Palace & museum', 'Sunset boat ride on Lake Pichola', 'Dharohar folk dance at Bagore Ki Haveli', 'Visit Monsoon Palace on high hilltop'],
    localFood: ['Ker Sangri & Dal Baati Churma with Ghee', 'Gatte Ki Khichdi', 'Mirchi Bada & Pyaaz Kachori at Jagdish Chowk', 'Mawa Malpua with Rabri'],
    popularPlaces: [
      { name: 'City Palace', type: 'Royal Complex', desc: 'Granite and marble palace complex built over 400 years.' },
      { name: 'Lake Pichola', type: 'Artificial Freshwater Lake', desc: 'Picturesque lake with islands hosting royal palaces.' },
      { name: 'Jag Mandir', type: 'Island Palace', desc: 'Lake garden palace used by royals as a summer retreat.' },
      { name: 'Sajjangarh Palace', type: 'Hilltop Fortress', desc: 'Monsoon palace built to watch monsoon clouds.' }
    ]
  },
  {
    id: 'rishikesh',
    name: 'Rishikesh',
    state: 'Uttarakhand',
    region: 'North',
    category: 'adventure',
    tag: 'Yoga Capital & Ganga River Rafting',
    tagline: 'The Yoga Capital of the World, nestled at Himalayan foothills with thrilling white-water rafting, suspension bridges, and evening Ganga Aarti.',
    heroImage: 'https://images.unsplash.com/photo-1600100397608-f010e47c1869?auto=format&fit=crop&w=1400&q=80',
    bestTime: 'Sep – Nov & Mar – May (Ideal for river rafting 15°C - 30°C)',
    avgBudget: '₹1,800 – ₹4,500 / day',
    idealDays: '2 - 4 Days',
    rating: 4.8,
    reviews: '15.9k',
    gettingAround: 'Scooters, auto-rickshaws, and walking across bridges.',
    tags: ['Yoga & Meditation', 'River Rafting', 'Ganga Aarti', 'Ashrams', 'Bungee Jumping'],
    topHighlights: ['White Water River Rafting (16km/24km)', 'Triveni Ghat Evening Aarti', 'Beatles Ashram Tour', 'Laxman & Ram Jhula Walks'],
    weather: {
      temp: '22°C',
      condition: 'Fresh Himalayan Breeze & Clear Waters',
      clothingTip: 'Quick-dry sports clothing for rafting; modest attire for ashrams.',
      bestMonths: 'September to May'
    },
    howToReach: {
      flight: { title: 'Jolly Grant Airport Dehradun (DED)', distance: '21 km (35 mins cab ride)', duration: '50m from Delhi / 2h from Mumbai', startingFare: '₹2,300' },
      train: { title: 'Yog Nagari Rishikesh (YNRK) / Haridwar (HW)', distance: 'In-city / Haridwar (25 km)', duration: 'Vande Bharat / Jan Shatabdi from Delhi', startingFare: '₹420' },
      bus: { title: 'Rishikesh ISBT / Tapovan Stop', distance: 'Tapovan / Muni Ki Reti', duration: 'Frequent Volvo AC buses from Delhi ISBT (5h)', startingFare: '₹400' }
    },
    curatedStays: [
      {
        id: 'rsh_stay_1',
        name: 'Ananda in the Himalayas (Luxury Wellness)',
        type: '5-Star Ayurvedic Palace Resort',
        rating: 4.9,
        reviewsCount: 1900,
        price: 24000,
        originalPrice: 32000,
        discountBadge: '25% OFF',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        address: 'The Palace Estate, Narendra Nagar, Rishikesh',
        amenities: ['Private Yoga Pavilion', 'Ayurvedic Wellness Consult', 'Ganga River Valley View', 'Organic Gourmet Dining'],
        verified: true,
        rooms: [
          { type: 'Palace Valley View Room', price: 24000, originalPrice: 32000, capacity: '2 Adults', perks: ['Himalayan Panorama', 'Custom Wellness Program', 'All Organic Meals'] }
        ]
      },
      {
        id: 'rsh_stay_2',
        name: 'OYO Townhouse 382 Tapovan Riverside',
        type: 'Comfort Adventure Stay',
        rating: 4.6,
        reviewsCount: 1480,
        price: 1799,
        originalPrice: 3100,
        discountBadge: '42% OFF',
        image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
        address: 'Badrinath Road, Tapovan, Rishikesh',
        amenities: ['Mountain View Balcony', 'High-Speed WiFi', 'Cafe & Yoga Deck'],
        verified: true,
        rooms: [
          { type: 'Deluxe AC Mountain View', price: 1799, originalPrice: 3100, capacity: '2 Adults', perks: ['Free Breakfast', 'Walk to Cafes'] }
        ]
      }
    ],
    activityPool: [
      { id: 'r1', title: 'Shivpuri to Rishikesh White Water River Rafting (16km)', category: 'adventure', timeSlot: '09:00', duration: '3.5 hrs', cost: '₹800 – ₹1,200', tip: 'Tackle Grade III rapids like Roller Coaster and Golf Course with cliff jumping.', location: 'Shivpuri to NIM Beach', bestTimeOfDay: 'morning' },
      { id: 'r2', title: 'The Beatles Ashram (Chaurasi Kutia) graffiti walk', category: 'heritage', timeSlot: '14:00', duration: '2 hrs', cost: '₹150 entry', tip: 'Where The Beatles stayed in 1968 to learn Transcendental Meditation.', location: 'Swarg Ashram', bestTimeOfDay: 'afternoon' },
      { id: 'r3', title: 'Grand Ganga Aarti at Triveni Ghat', category: 'spiritual', timeSlot: '18:00', duration: '1.5 hrs', cost: 'Free', tip: 'Float diya leaf lamps into the sacred waters with Vedic chants.', location: 'Triveni Ghat', bestTimeOfDay: 'evening' },
      { id: 'r4', title: 'Morning Yoga & Sound Healing Session by the river', category: 'wellness', timeSlot: '06:30', duration: '1.5 hrs', cost: '₹300 – ₹600', tip: 'Rejuvenate your senses with certified Himalayan yoga masters.', location: 'Parmarth Niketan / Tapovan', bestTimeOfDay: 'morning' },
      { id: 'r5', title: 'India’s Highest Bungee Jump (83m) at Jumpin Heights', category: 'adventure', timeSlot: '10:30', duration: '3 hrs', cost: '₹3,500 jump', tip: 'Fixed cantilever platform over the Hall river gorge operated by ex-Army jump masters.', location: 'Mohan Chatti (15 km)', bestTimeOfDay: 'morning' },
      { id: 'r6', title: 'Little Buddha Cafe organic pizza & herbal smoothie break', category: 'food', timeSlot: '13:00', duration: '1.5 hrs', cost: '₹300 – ₹600', tip: 'Treehouse-style multi-level wooden cafe directly overlooking Laxman Jhula.', location: 'Laxman Jhula Road', bestTimeOfDay: 'afternoon' }
    ],
    thingsToDo: ['Experience 16km or 24km river rafting', 'Attend morning yoga by the holy river', 'Explore Beatles Ashram art murals', 'Bungee jumping at Jumpin Heights (83m)'],
    localFood: ['Ayurvedic Thali & Organic Salads', 'Aloo Puri & Chai by Triveni Ghat', 'Wood-fired Pizza at Little Buddha Cafe', 'Nutella Banoffee Pie & Herbal Teas'],
    popularPlaces: [
      { name: 'Laxman Jhula & Ram Jhula', type: 'Suspension Bridge', desc: 'Iconic iron suspension bridges over the holy river Ganges.' },
      { name: 'Triveni Ghat', type: 'Spiritual Ghat', desc: 'Confluence of three holy rivers where grand Aarti takes place.' },
      { name: 'Beatles Ashram', type: 'Historical Ashram', desc: 'Forest ashram adorned with murals and meditation caves.' },
      { name: 'Neelkanth Mahadev', type: 'Ancient Shrine', desc: 'Temple situated at 1,330m in forest valley.' }
    ]
  },
  {
    id: 'amritsar',
    name: 'Amritsar',
    state: 'Punjab',
    region: 'North',
    category: 'spiritual',
    tag: 'The Golden Temple & Patriotic Spirit',
    tagline: 'Heart of Sikh culture, home to the resplendent Sri Harmandir Sahib (Golden Temple), Wagah border ceremony, and Punjabi kulcha feasts.',
    heroImage: 'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=1400&q=80',
    bestTime: 'Oct – Mar (Pleasant sunny days 12°C - 25°C)',
    avgBudget: '₹1,500 – ₹4,000 / day',
    idealDays: '2 Days',
    rating: 4.9,
    reviews: '23.4k',
    gettingAround: 'E-rickshaws, auto-rickshaws, and walking heritage corridor.',
    tags: ['Golden Temple', 'Langar Kitchen', 'Wagah Border', 'Amritsari Kulcha', 'History'],
    topHighlights: ['Golden Temple Day & Night Darshan', 'World’s Largest Free Langar', 'Wagah Border Beating Retreat', 'Jallianwala Bagh Memorial'],
    weather: {
      temp: '21°C',
      condition: 'Crisp Sunshine & Warm Hospitality',
      clothingTip: 'Headscarf required inside Golden Temple (provided free).',
      bestMonths: 'October to March'
    },
    howToReach: {
      flight: { title: 'Sri Guru Ram Dass Jee Int. Airport (ATQ)', distance: 'Raja Sansi (11 km to city center)', duration: '1h from Delhi / 2h 30m from Mumbai', startingFare: '₹2,500' },
      train: { title: 'Amritsar Junction (ASR)', distance: 'Central Amritsar', duration: 'Vande Bharat / Shatabdi Express from Delhi (6h)', startingFare: '₹550' },
      bus: { title: 'Amritsar Central Bus Stand', distance: 'Grand Trunk Road', duration: 'Frequent AC Volvos from Chandigarh, Delhi, Ludhiana', startingFare: '₹450' }
    },
    curatedStays: [
      {
        id: 'amr_stay_1',
        name: 'Taj Swarna Amritsar',
        type: '5-Star Luxury City Hotel',
        rating: 4.9,
        reviewsCount: 2800,
        price: 9500,
        originalPrice: 13500,
        discountBadge: '30% OFF',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        address: 'Majitha Verka Bypass, Amritsar',
        amenities: ['Outdoor Pool', 'Jiva Spa', 'Free Golden Temple Shuttle', 'Grand Punjabi Buffet'],
        verified: true,
        rooms: [
          { type: 'Superior Luxury Room', price: 9500, originalPrice: 13500, capacity: '2 Adults', perks: ['Free Breakfast', 'Temple Shuttle', 'Luxury Spa Credit'] }
        ]
      },
      {
        id: 'amr_stay_2',
        name: 'OYO Townhouse 068 Golden Temple Heritage Corridor',
        type: 'Smart Pilgrim Hotel',
        rating: 4.6,
        reviewsCount: 1890,
        price: 1899,
        originalPrice: 3200,
        discountBadge: '41% OFF',
        image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
        address: 'Heritage Street, 300m from Golden Temple',
        amenities: ['AC & High-Speed WiFi', 'Pure Vegetarian Kitchen', 'Walk to Golden Temple'],
        verified: true,
        rooms: [
          { type: 'Townhouse Classic AC', price: 1899, originalPrice: 3200, capacity: '2 Adults', perks: ['Free Breakfast', 'Walk to Darbar Sahib'] }
        ]
      }
    ],
    activityPool: [
      { id: 'am1', title: 'Sri Harmandir Sahib (Golden Temple) Darshan & Langar', category: 'spiritual', timeSlot: '08:00', duration: '3.5 hrs', cost: 'Free', tip: 'Eat at the 24/7 free community kitchen feeding 100,000 pilgrims daily.', location: 'Golden Temple Complex', bestTimeOfDay: 'morning' },
      { id: 'am2', title: 'Jallianwala Bagh Historic Memorial & Partition Museum', category: 'heritage', timeSlot: '12:00', duration: '2 hrs', cost: 'Free / ₹10', tip: 'Pay homage to national martyrs and view the historic bullet marks.', location: 'Heritage Street', bestTimeOfDay: 'afternoon' },
      { id: 'am3', title: 'Authentic Amritsari Kulcha feast at Kulcha Land / Bhai Kulwant Singh', category: 'food', timeSlot: '14:00', duration: '1 hr', cost: '₹120 – ₹250', tip: 'Crispy tandoori kulcha stuffed with spicy aloo/paneer dipped in melting butter.', location: 'Ranjit Avenue / Heritage Corridor', bestTimeOfDay: 'afternoon' },
      { id: 'am4', title: 'Wagah Border Beating Retreat Flag Ceremony', category: 'sightseeing', timeSlot: '16:00', duration: '3 hrs', cost: 'Free', tip: 'High-octane patriotic military drill at the India-Pakistan border gate.', location: 'Attari-Wagah Border (30 km)', bestTimeOfDay: 'evening' },
      { id: 'am5', title: 'Illuminated Golden Temple night Palki Sahib ceremony', category: 'spiritual', timeSlot: '21:30', duration: '1.5 hrs', cost: 'Free', tip: 'Watch the holy Guru Granth Sahib carried in a golden palanquin.', location: 'Darbar Sahib Sanctum', bestTimeOfDay: 'night' }
    ],
    thingsToDo: ['Visit Golden Temple at sunrise and night', 'Volunteer at the mega Langar community kitchen', 'Cheer at Wagah Border ceremony', 'Shop for Phulkari dupattas and Punjabi juttis'],
    localFood: ['Amritsari Butter Kulcha with Chole', 'Makki di Roti & Sarson da Saag at Bharawan Da Dhaba', 'Kesar Da Dhaba Dal Makhani & Firni', 'Giant Brass Glass of Creamy Malai Lassi at Ahuja'],
    popularPlaces: [
      { name: 'Golden Temple', type: 'Spiritual Shrine', desc: 'Central worship place for Sikhs gilded in 500 kg of pure gold.' },
      { name: 'Wagah Border', type: 'International Border', desc: 'Daily military ceremony at India-Pakistan border.' },
      { name: 'Jallianwala Bagh', type: 'Historical Monument', desc: 'Memorial grounds of the 1919 historic massacre.' },
      { name: 'Partition Museum', type: 'Historical Museum', desc: 'World’s first museum dedicated to the 1947 Partition of India.' }
    ]
  },
  {
    id: 'bengaluru',
    name: 'Bengaluru',
    state: 'Karnataka',
    region: 'South',
    category: 'metro',
    tag: 'Silicon Valley & Garden City',
    tagline: "India's technological capital celebrated for pleasant year-round weather, craft beer culture, botanical gardens, and filter coffee cafes.",
    heroImage: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1400&q=80',
    bestTime: 'Sep – Mar (Mild, breezy weather 18°C - 28°C)',
    avgBudget: '₹2,200 – ₹5,500 / day',
    idealDays: '2 - 3 Days',
    rating: 4.7,
    reviews: '13.9k',
    gettingAround: 'Namma Metro, app cabs, auto-rickshaws, and BMTC buses.',
    tags: ['Garden City', 'Craft Breweries', 'Filter Coffee', 'Tech Capital', 'Parks'],
    topHighlights: ['Lalbagh Botanical Glasshouse', 'Bangalore Palace', 'Cubbon Park Morning Walk', 'Indiranagar Microbreweries'],
    weather: {
      temp: '24°C',
      condition: 'Pleasant Breeze & Mild Sunshine',
      clothingTip: 'Light casuals; light sweater for cool evenings.',
      bestMonths: 'September to March'
    },
    howToReach: {
      flight: { title: 'Kempegowda International Airport (BLR)', distance: 'Devanahalli (35 km to center, Vayu Vajra buses)', duration: 'Direct from all global & domestic airports', startingFare: '₹2,400' },
      train: { title: 'KSR Bengaluru City (SBC) / Yesvantpur (YPR)', distance: 'Central / North Bangalore', duration: 'Vande Bharat from Chennai, Hyderabad, Coimbatore', startingFare: '₹500' },
      bus: { title: 'Majestic KSRTC Bus Stand', distance: 'Central Majestic', duration: 'Direct Volvos from Mysore, Ooty, Coorg, Goa, Hyderabad', startingFare: '₹400' }
    },
    curatedStays: [
      {
        id: 'blr_stay_1',
        name: 'The Leela Palace Bengaluru',
        type: '5-Star Royal Palace',
        rating: 4.9,
        reviewsCount: 3600,
        price: 16500,
        originalPrice: 22000,
        discountBadge: '25% OFF',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        address: 'Old Airport Road, Kodihalli, Bengaluru',
        amenities: ['Vijayanagara Architecture', 'Lush Gardens', 'Heated Pool', 'Fine Dining Jamavar', 'Free WiFi'],
        verified: true,
        rooms: [
          { type: 'Royal Premiere Garden View', price: 16500, originalPrice: 22000, capacity: '2 Adults', perks: ['Garden View', 'Free Breakfast', 'Butler Service'] }
        ]
      },
      {
        id: 'blr_stay_2',
        name: 'OYO Townhouse 019 Indiranagar 100ft Road',
        type: 'Trendy Smart Hotel',
        rating: 4.6,
        reviewsCount: 1540,
        price: 2399,
        originalPrice: 4100,
        discountBadge: '41% OFF',
        image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
        address: '100ft Road, Indiranagar, Bengaluru',
        amenities: ['AC & High-Speed WiFi', 'Walk to Top Microbreweries', '24h Hot Water'],
        verified: true,
        rooms: [
          { type: 'Townhouse Deluxe AC', price: 2399, originalPrice: 4100, capacity: '2 Adults', perks: ['Free Breakfast', 'Brewery District Location'] }
        ]
      }
    ],
    activityPool: [
      { id: 'b1', title: 'Lalbagh Botanical Garden & historic Glasshouse walk', category: 'nature', timeSlot: '07:30', duration: '2 hrs', cost: '₹25 entry', tip: '240-acre botanical garden with century-old trees and lotus ponds.', location: 'Mavalli', bestTimeOfDay: 'morning' },
      { id: 'b2', title: 'MTR or CTR Crispy Benne Dosa & Filter Coffee breakfast', category: 'food', timeSlot: '09:30', duration: '1 hr', cost: '₹150 – ₹300', tip: 'Try the iconic butter-soaked Masala Dosa at Central Tiffin Room.', location: 'Malleshwaram / Lalbagh', bestTimeOfDay: 'morning' },
      { id: 'b3', title: 'Bangalore Palace Tudor architecture tour', category: 'heritage', timeSlot: '11:30', duration: '2 hrs', cost: '₹250 entry', tip: 'Modeled after London’s Windsor Castle with fortified towers and wood carvings.', location: 'Vasanth Nagar', bestTimeOfDay: 'morning' },
      { id: 'b4', title: 'Craft Microbrewery hop in Indiranagar & Koramangala', category: 'nightlife', timeSlot: '19:00', duration: '3 hrs', cost: '₹1,200 – ₹2,500', tip: 'Sip fresh Mango Cider and Belgian Witbier at Toit or Arbor Brewing.', location: 'Indiranagar 100ft Road', bestTimeOfDay: 'night' },
      { id: 'b5', title: 'Cubbon Park Bamboo Groves & State Central Library stroll', category: 'nature', timeSlot: '07:00', duration: '1.5 hrs', cost: 'Free', tip: 'Lush green lung with red brick Victorian architecture.', location: 'Kasturba Road', bestTimeOfDay: 'morning' }
    ],
    thingsToDo: ['Stroll through lush Lalbagh and Cubbon Park', 'Explore royal Tudor halls of Bangalore Palace', 'Savor crispy Benne Masala Dosa and filter coffee', 'Experience rooftop craft brewery culture'],
    localFood: ['CTR Benne Masala Dosa at Malleshwaram', 'Bisi Bele Bath with Ghee & Boondi at MTR', 'Mangalorean Ghee Roast Prawns at Nagarjuna', 'Authentic South Indian Filter Kaapi at Brahmin’s Coffee Bar'],
    popularPlaces: [
      { name: 'Lalbagh Botanical Garden', type: 'Botanical Garden', desc: 'Historic 18th-century garden with famous Victorian glasshouse.' },
      { name: 'Bangalore Palace', type: 'Royal Palace', desc: '19th-century royal palace with Tudor-style architecture.' },
      { name: 'Cubbon Park', type: 'Green Lung', desc: '300-acre park in the heart of the city with colonial statues.' },
      { name: 'Bannerghatta National Park', type: 'Safari Zoo', desc: 'Biological park with tiger, lion and bear safaris.' }
    ]
  },
  {
    id: 'kolkata',
    name: 'Kolkata',
    state: 'West Bengal',
    region: 'East',
    category: 'metro',
    tag: 'The City of Joy & Cultural Soul',
    tagline: 'India’s intellectual and cultural capital, celebrated for colonial grandeur, yellow ambassador cabs, tramcars, and literary cafes.',
    heroImage: 'https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=1400&q=80',
    bestTime: 'Oct – Mar (Pleasant winter & Durga Puja festivities 15°C - 27°C)',
    avgBudget: '₹1,800 – ₹4,500 / day',
    idealDays: '2 - 3 Days',
    rating: 4.8,
    reviews: '14.1k',
    gettingAround: 'Kolkata Metro, iconic yellow taxis, tramcars, and river ferries.',
    tags: ['Colonial Heritage', 'Street Food', 'Art & Literature', 'Sweets', 'Howrah Bridge'],
    topHighlights: ['Victoria Memorial Hall', 'Howrah Bridge & Flower Market', 'Park Street Food Crawl', 'Dakshineswar Temple'],
    weather: {
      temp: '23°C',
      condition: 'Pleasant Winter Sunshine & Evening Breeze',
      clothingTip: 'Cotton clothing & comfortable walking shoes for heritage addas.',
      bestMonths: 'October to March'
    },
    howToReach: {
      flight: { title: 'Netaji Subhash Chandra Bose Int. Airport (CCU)', distance: 'Dum Dum (15 km to city center)', duration: 'Direct from all domestic metros & SE Asia', startingFare: '₹2,600' },
      train: { title: 'Howrah Junction (HWH) & Sealdah (SDAH)', distance: 'Riverside / Central Kolkata', duration: 'Busiest railway hub in India (Vande Bharat & Rajdhanis)', startingFare: '₹550' },
      bus: { title: 'Esplanade Bus Terminus', distance: 'Dharmatala, Central Kolkata', duration: 'Direct buses to Digha, Sundarbans, Siliguri, Puri', startingFare: '₹350' }
    },
    curatedStays: [
      {
        id: 'ccu_stay_1',
        name: 'The Oberoi Grand Kolkata',
        type: '5-Star Colonial Heritage Grande Dame',
        rating: 4.9,
        reviewsCount: 3200,
        price: 12500,
        originalPrice: 17000,
        discountBadge: '26% OFF',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        address: '15 Jawaharlal Nehru Road, New Market, Kolkata',
        amenities: ['Colonial Courtyard Pool', 'Spa & Wellness', 'Heritage Thai & Bengali Fine Dining', 'Free WiFi'],
        verified: true,
        rooms: [
          { type: 'Premier Heritage Room', price: 12500, originalPrice: 17000, capacity: '2 Adults', perks: ['Colonial Courtyard View', 'Free Breakfast', 'High Tea'] }
        ]
      },
      {
        id: 'ccu_stay_2',
        name: 'OYO Townhouse 040 Park Street',
        type: 'Smart City Stay',
        rating: 4.6,
        reviewsCount: 1720,
        price: 1999,
        originalPrice: 3400,
        discountBadge: '41% OFF',
        image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
        address: 'Park Street Dining Hub, Kolkata',
        amenities: ['AC & High-Speed WiFi', 'Walk to Iconic Cafes & Pubs', '24h Front Desk'],
        verified: true,
        rooms: [
          { type: 'Townhouse Standard AC', price: 1999, originalPrice: 3400, capacity: '2 Adults', perks: ['Free Breakfast', 'Walk to Flurys & Mocambo'] }
        ]
      }
    ],
    activityPool: [
      { id: 'kl1', title: 'Victoria Memorial marble palace & gardens', category: 'heritage', timeSlot: '10:00', duration: '2.5 hrs', cost: '₹30 entry', tip: 'Magnificent white Makrana marble monument dedicated to Queen Victoria.', location: 'Queens Way, Maidan', bestTimeOfDay: 'morning' },
      { id: 'kl2', title: 'Mullick Ghat Flower Market & Howrah Bridge walk', category: 'sightseeing', timeSlot: '07:00', duration: '2 hrs', cost: 'Free', tip: 'Asia’s largest flower market bursting with orange marigolds at dawn.', location: 'Howrah Bridge Riverside', bestTimeOfDay: 'morning' },
      { id: 'kl3', title: 'College Street Boi Para & Indian Coffee House adda', category: 'cultural', timeSlot: '14:00', duration: '2 hrs', cost: '₹150 – ₹300', tip: 'World’s largest second-hand book market and historic intellectual hub.', location: 'College Street', bestTimeOfDay: 'afternoon' },
      { id: 'kl4', title: 'Street Food Feast (Kathi Roll, Puchka, Mishti Doi)', category: 'food', timeSlot: '17:30', duration: '2.5 hrs', cost: '₹200 – ₹450', tip: 'Try Kusum Rolls on Park Street, Russell Street Puchka, and K.C. Das Rasgulla.', location: 'Park Street / New Market', bestTimeOfDay: 'evening' },
      { id: 'kl5', title: 'Dakshineswar Kali Temple & Belur Math Ferry Ride', category: 'spiritual', timeSlot: '09:00', duration: '3 hrs', cost: '₹20 ferry', tip: 'Navaratna temple on the Hooghly river associated with Ramakrishna Paramahamsa.', location: 'Dakshineswar', bestTimeOfDay: 'morning' }
    ],
    thingsToDo: ['Admire white marble Victoria Memorial', 'Ride a historic wooden tramcar or yellow cab', 'Experience energetic Durga Puja pandals', 'Sample authentic Bengali sweets & Hilsa fish'],
    localFood: ['Kolkata Double Egg Chicken Roll at Kusum Rolls', 'Tangy Bengali Puchka with Tamarind & Gondhoraj Lemon', 'Mishti Doi & Warm Nolen Gur Sandesh at Balaram Mullick', 'Authentic Kosha Mangsho with Luchi at Golbari'],
    popularPlaces: [
      { name: 'Victoria Memorial', type: 'Monumental Museum', desc: 'Iconic white marble building in the heart of Kolkata.' },
      { name: 'Howrah Bridge', type: 'Cantilever Bridge', desc: 'Iconic cantilever bridge over the Hooghly River opened in 1943.' },
      { name: 'Dakshineswar Kali Temple', type: 'Riverside Temple', desc: 'Navaratna style Hindu temple dedicated to Bhavatarini.' },
      { name: 'Park Street', type: 'Dining & Nightlife', desc: 'Historic street famed for heritage restaurants and live music.' }
    ]
  }
];

export const DESTINATION_MAP = DESTINATIONS_CATALOG.reduce((acc, curr) => {
  acc[curr.id] = curr;
  return acc;
}, {});

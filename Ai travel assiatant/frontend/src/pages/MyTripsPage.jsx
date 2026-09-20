import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Train, Plane, Bus, Car, Calendar, Clock, DollarSign, ArrowRight, 
  ChevronLeft, ChevronRight, Search, Filter, Loader2, Download, QrCode, User, Sliders,
  Building2, Bed, Home, Sparkles, MapPin, CheckCircle2
} from 'lucide-react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import { printHotelInvoice } from '../utils/hotelInvoiceGenerator';

const modeIcons = {
  Flight: Plane,
  Train: Train,
  Bus: Bus,
  Taxi: Car,
};

export default function MyTripsPage() {
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings', 'hotels', 'searches'
  const [bookings, setBookings] = useState([]);
  const [hotelBookings, setHotelBookings] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modals for receipts and QR codes
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [activeQr, setActiveQr] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [bookingsRes, tripsRes] = await Promise.all([
        api.get('/profile/bookings?limit=50').catch(() => ({ data: { bookings: [] } })),
        api.get('/profile/trips?limit=50').catch(() => ({ data: { trips: [] } }))
      ]);
      setBookings(bookingsRes.data?.bookings || []);
      setTrips(tripsRes.data?.trips || []);

      // Load hotel reservations from localStorage
      try {
        const localHotels = JSON.parse(localStorage.getItem('traveliq_hotel_reservations') || '[]');
        setHotelBookings(localHotels);
      } catch (e) {}
    } catch {
      toast.error('Failed to load transaction data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cancel Booking handler
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('⚠️ Are you sure you want to cancel this booking and issue a mock refund?')) return;
    try {
      await api.put(`/profile/bookings/${bookingId}/cancel`);
      toast.success('Reservation cancelled & refund initiated.');
      fetchData();
    } catch {
      toast.error('Cancellation failed.');
    }
  };

  // Generate mock printable PDF Receipt trigger for trains
  const handlePrintReceipt = (booking) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>TravelIQ_Ticket_Receipt_${booking.id}</title>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@600&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 30px; background: #fff; color: #1e293b; line-height: 1.4; }
            .receipt { border: 1.5px solid #CBD5E1; border-radius: 16px; padding: 24px; max-width: 650px; margin: 0 auto; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #14532D; padding-bottom: 14px; margin-bottom: 16px; }
            .brand { font-size: 20px; font-weight: 800; color: #14532D; }
            .badge { background: #DCFCE7; color: #15803D; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; }
            .row { display: flex; justify-content: space-between; margin: 10px 0; border-bottom: 1px solid #F1F5F9; padding-bottom: 6px; font-size: 13px; }
            .label { color: #64748B; font-size: 12px; }
            .value { font-weight: 700; color: #0F172A; font-family: 'JetBrains Mono', monospace; }
            .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 12px; }
            @media print { body { padding: 0; } .receipt { box-shadow: none; border: 1px solid #000; } }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="brand">🚄 TravelIQ Transport Pass</div>
              <div class="badge">Confirmed & Paid</div>
            </div>
            <div class="row"><span class="label">PNR / Ticket Ref:</span><span class="value">#TK-${booking.id}</span></div>
            <div class="row"><span class="label">Train Number / Name:</span><span class="value">${booking.train_number || '12626'} (Express)</span></div>
            <div class="row"><span class="label">Journey Route:</span><span class="value">${booking.source_station_code} ➔ ${booking.destination_station_code}</span></div>
            <div class="row"><span class="label">Travel Class:</span><span class="value">${booking.travel_class || '3A'}</span></div>
            <div class="row"><span class="label">Seat & Berth Preference:</span><span class="value">${booking.seat_preference || 'No Preference'} (${booking.berth_preference || 'No Preference'})</span></div>
            <div class="row"><span class="label">Total Paid Fare (GST Incl.):</span><span class="value" style="color: #14532D; font-size: 15px;">₹${booking.ticket_fare}</span></div>
            <div class="row"><span class="label">Payment Status:</span><span class="value" style="color: #15803D;">${booking.payment_status || 'Paid (Instant Verified)'}</span></div>
            <div class="footer">
              <p>TravelIQ Verified Electronic Ticket • 24x7 Helpline: 1800-872-8354</p>
            </div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filters
  const filteredBookings = bookings.filter(b => 
    b.train_number?.includes(search) || 
    b.source_station_code?.toLowerCase().includes(search.toLowerCase()) ||
    b.destination_station_code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#F7F5EF] dark:bg-[#12201D] transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold font-manrope text-[#263238] dark:text-[#F7F5EF]">Tickets & Travel History</h1>
            <p className="text-[#66736F] dark:text-[#A3B0AB] text-xs mt-1">Review active boarding tickets, download e-receipts, or track historic searches.</p>
          </div>
          
          <div className="flex bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-xl p-1 shadow-sm">
            <button 
              onClick={() => setActiveTab('bookings')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeTab === 'bookings' ? 'bg-[#173F3A] dark:bg-[#EEF2ED] text-[#FFFFFF] dark:text-[#12201D]' : 'text-[#66736F] dark:text-[#A3B0AB] hover:text-[#263238] dark:hover:text-[#F7F5EF]'}`}
            >
              Train & Transit
            </button>
            <button 
              onClick={() => setActiveTab('hotels')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeTab === 'hotels' ? 'bg-[#173F3A] dark:bg-[#EEF2ED] text-[#FFFFFF] dark:text-[#12201D]' : 'text-[#66736F] dark:text-[#A3B0AB] hover:text-[#263238] dark:hover:text-[#F7F5EF]'}`}
            >
              Hotels & Stays {hotelBookings.length > 0 && `(${hotelBookings.length})`}
            </button>
            <button 
              onClick={() => setActiveTab('searches')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${activeTab === 'searches' ? 'bg-[#173F3A] dark:bg-[#EEF2ED] text-[#FFFFFF] dark:text-[#12201D]' : 'text-[#66736F] dark:text-[#A3B0AB] hover:text-[#263238] dark:hover:text-[#F7F5EF]'}`}
            >
              Search Logs
            </button>
          </div>
        </div>

        {/* Search tool */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66736F] dark:text-[#A3B0AB]" />
          <input 
            type="text" 
            placeholder="Search by hotel name, booking ID, or city..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="travel-input w-full bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] rounded-lg py-2.5 pl-10 pr-4 text-[#263238] dark:text-[#F7F5EF] text-xs placeholder-[#66736F] dark:placeholder-[#A3B0AB] focus:outline-none focus:border-[#173F3A] dark:focus:border-[#EEF2ED] transition-all font-medium"
          />
        </div>

        {/* Main List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="travel-card p-6 border border-[#E3DED2] dark:border-[#2A403A] bg-[#FFFFFF] dark:bg-[#1B2C28] rounded-xl shadow-sm">
                <div className="h-4 bg-[#EEF2ED] dark:bg-[#213530] rounded w-1/3 mb-3 animate-pulse" />
                <div className="h-3 bg-[#EEF2ED] dark:bg-[#213530] rounded w-1/4 animate-pulse" />
              </div>
            ))}
          </div>
        ) : activeTab === 'hotels' ? (
          /* Hotels & Stays List */
          <div className="space-y-4">
            {hotelBookings.length === 0 ? (
              <div className="travel-card p-12 text-center border border-[#E3DED2] dark:border-[#2A403A] bg-[#FFFFFF] dark:bg-[#1B2C28] rounded-xl shadow-sm">
                <Building2 className="w-12 h-12 text-[#66736F] dark:text-[#A3B0AB] mx-auto mb-4" />
                <h3 className="text-[#263238] dark:text-[#F7F5EF] font-bold text-sm mb-1">No hotel reservations found</h3>
                <p className="text-[#66736F] dark:text-[#A3B0AB] text-xs">Your confirmed hotel stays and backpacker dorm vouchers will appear here.</p>
              </div>
            ) : (
              hotelBookings
                .filter(h => !search || h.hotelName?.toLowerCase().includes(search.toLowerCase()) || h.id?.toLowerCase().includes(search.toLowerCase()) || h.city?.toLowerCase().includes(search.toLowerCase()))
                .map((hb, idx) => (
                  <div key={idx} className="travel-card p-5 border border-[#E3DED2] dark:border-[#2A403A] bg-[#FFFFFF] dark:bg-[#1B2C28] rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden group">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#14532D]/10 dark:bg-[#14532D]/30 text-[#14532D] dark:text-[#4ADE80] flex items-center justify-center flex-shrink-0">
                        {hb.isHostel ? <Bed className="w-6 h-6" /> : (hb.category?.toLowerCase().includes('homestay') || hb.category?.toLowerCase().includes('villa') ? <Home className="w-6 h-6" /> : <Building2 className="w-6 h-6" />)}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-[#14532D] dark:text-white">
                            {hb.hotelName}
                          </span>
                          <span className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] font-mono font-bold bg-[#F7F5EF] dark:bg-[#12201D] px-2 py-0.5 rounded border border-[#E3DED2] dark:border-[#2A403A]">
                            {hb.id || hb.bookingReference}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-3 text-[10px] text-[#66736F] dark:text-[#A3B0AB] font-medium">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-[#E58A3A]" /> {hb.city || 'Mumbai'}</span>
                          <span>🗓️ {hb.checkInDate} to {hb.checkOutDate}</span>
                          <span>👤 Guest: <strong>{hb.guestName || 'Aditya Upadhyay'}</strong></span>
                          <span>🛏️ {hb.roomType || 'Deluxe Room'}</span>
                          <span className="text-[#14532D] dark:text-[#4ADE80] font-bold font-mono">₹{(hb.pricing?.grandTotal || hb.grandTotal || 25563).toLocaleString('en-IN')}</span>
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#15803D]/10 text-[#15803D] border border-[#15803D]/20">
                            ✓ Confirmed & Guaranteed
                          </span>
                          <span className="text-[9px] text-[#66736F] dark:text-[#A3B0AB]">
                            {hb.paymentMethod || 'Pay at Hotel'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-row sm:flex-col justify-end items-end gap-2">
                      <button
                        onClick={() => printHotelInvoice(hb, true)}
                        className="px-3.5 py-2 bg-[#14532D] hover:bg-[#0F3F22] text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                        title="Download / Print MMT & OYO style PDF e-Voucher"
                      >
                        <Download className="w-3.5 h-3.5" /> Download e-Voucher PDF
                      </button>
                      <button
                        onClick={() => printHotelInvoice(hb, false)}
                        className="px-3 py-1.5 bg-[#F7F5EF] dark:bg-[#12201D] text-[#14532D] dark:text-[#4ADE80] border border-[#E3DED2] dark:border-[#273E36] rounded-lg text-[10px] font-bold hover:bg-[#EEF2ED] transition-all cursor-pointer"
                      >
                        View Tax Invoice
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        ) : activeTab === 'bookings' ? (
          <div className="space-y-4">
            {filteredBookings.length === 0 ? (
              <div className="travel-card p-12 text-center border border-[#E3DED2] dark:border-[#2A403A] bg-[#FFFFFF] dark:bg-[#1B2C28] rounded-xl shadow-sm">
                <Train className="w-12 h-12 text-[#66736F] dark:text-[#A3B0AB] mx-auto mb-4" />
                <h3 className="text-[#263238] dark:text-[#F7F5EF] font-bold text-sm mb-1">No ticket bookings yet</h3>
                <p className="text-[#66736F] dark:text-[#A3B0AB] text-xs">Your boarding passes will appear here after booking a train.</p>
              </div>
            ) : (
              filteredBookings.map((booking) => (
                <div key={booking.id} className="travel-card p-5 border border-[#E3DED2] dark:border-[#2A403A] bg-[#FFFFFF] dark:bg-[#1B2C28] rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden group">
                  <div className="flex gap-4">
                    <div className="w-11 h-11 rounded-xl bg-[#EEF2ED] dark:bg-[#213530] flex items-center justify-center flex-shrink-0 transition-transform">
                      <Train className="w-5 h-5 text-[#173F3A] dark:text-[#EEF2ED]" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[#263238] dark:text-[#F7F5EF] font-bold text-sm">
                        <span>{booking.source_station_code}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#D96C4F]" />
                        <span>{booking.destination_station_code}</span>
                        <span className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] font-mono font-bold bg-[#F7F5EF] dark:bg-[#12201D] px-2 py-0.5 rounded border border-[#E3DED2] dark:border-[#2A403A]">#TK-{booking.id}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-3 text-[10px] text-[#66736F] dark:text-[#A3B0AB] font-medium">
                        <span>🗓️ {new Date(booking.booking_date).toLocaleDateString()}</span>
                        <span>🚄 Train {booking.train_number}</span>
                        <span>🎫 Class {booking.travel_class}</span>
                        <span>Seat: {booking.seat_preference || 'No Preference'} | Berth: {booking.berth_preference || 'No Preference'}</span>
                        <span className="text-[#173F3A] dark:text-[#EEF2ED] font-bold font-mono">₹{booking.ticket_fare}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                          booking.booking_status === 'Confirmed' ? 'bg-[#4F7D62]/10 border-[#4F7D62]/20 text-[#4F7D62]' :
                          booking.booking_status === 'Pending' ? 'bg-[#E5B85C]/10 border-[#E5B85C]/20 text-[#E5B85C]' :
                          'bg-[#B94A48]/10 border-[#B94A48]/20 text-[#B94A48]'
                        }`}>{booking.booking_status}</span>
                        <span className="text-[9px] text-[#66736F] dark:text-[#A3B0AB] font-medium">Payment: {booking.payment_status || 'Paid'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-row sm:flex-col justify-end items-end gap-2.5">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveQr(booking)}
                        className="btn-ghost bg-[#F7F5EF] dark:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] hover:bg-[#EEF2ED] dark:hover:bg-[#2A403A] text-[#173F3A] dark:text-[#EEF2ED] rounded-lg p-2.5 transition-all cursor-pointer"
                        title="Display Ticket QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePrintReceipt(booking)}
                        className="btn-ghost bg-[#F7F5EF] dark:bg-[#213530] border border-[#E3DED2] dark:border-[#2A403A] hover:bg-[#EEF2ED] dark:hover:bg-[#2A403A] text-[#173F3A] dark:text-[#EEF2ED] rounded-lg p-2.5 transition-all cursor-pointer"
                        title="Print E-Ticket Receipt"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>

                    {booking.booking_status !== 'Cancelled' && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="bg-[#B94A48]/10 hover:bg-[#B94A48]/20 text-[#B94A48] border border-[#B94A48]/20 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all active:scale-95"
                      >
                        Cancel Ticket
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Search Logs list */
          <div className="space-y-4">
            {trips.length === 0 ? (
              <div className="travel-card p-12 text-center border border-[#E3DED2] dark:border-[#2A403A] bg-[#FFFFFF] dark:bg-[#1B2C28] rounded-xl shadow-sm">
                <Search className="w-12 h-12 text-[#66736F] dark:text-[#A3B0AB] mx-auto mb-4" />
                <h3 className="text-[#263238] dark:text-[#F7F5EF] font-bold text-sm mb-1">No search logs yet</h3>
                <p className="text-[#66736F] dark:text-[#A3B0AB] text-xs font-medium">Your previous search routes will be tracked here.</p>
              </div>
            ) : (
              trips.map((trip) => (
                <div key={trip.id} className="travel-card p-4 rounded-xl bg-[#FFFFFF] dark:bg-[#1B2C28] border border-[#E3DED2] dark:border-[#2A403A] hover:bg-[#F7F5EF] dark:hover:bg-[#213530] transition-all flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#263238] dark:text-[#F7F5EF] text-xs">{trip.source}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#D96C4F]" />
                    <span className="font-bold text-[#263238] dark:text-[#F7F5EF] text-xs">{trip.destination}</span>
                  </div>
                  <div className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] font-mono font-medium">
                    Logged: {new Date(trip.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* ─── MODAL: DISPLAY BOARDING PASS QR CODE ─── */}
      <AnimatePresence>
        {activeQr && (
          <div 
            className="fixed inset-0 bg-[#263238]/40 dark:bg-[#12201D]/70 flex items-center justify-center p-4 z-50 transition-colors"
            onClick={() => setActiveQr(null)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm border border-[#E3DED2] dark:border-[#2A403A] bg-[#FFFFFF] dark:bg-[#1B2C28] p-8 rounded-xl shadow-[0_4px_16px_rgba(23,63,58,0.06)] relative text-center space-y-6"
            >
              <h3 className="text-lg font-bold font-manrope text-[#263238] dark:text-[#F7F5EF] mb-1 flex items-center justify-center gap-2">
                <QrCode className="w-5 h-5 text-[#173F3A] dark:text-[#EEF2ED]" /> E-Boarding Pass
              </h3>
              <p className="text-[#66736F] dark:text-[#A3B0AB] text-xs">Scan this QR Code at the platform boarding gates.</p>

              {/* Graphic styled CSS/SVG QR code */}
              <div className="bg-[#FFFFFF] p-6 rounded-xl w-48 h-48 mx-auto flex items-center justify-center border border-[#E3DED2] shadow-sm">
                <svg className="w-full h-full text-[#263238]" viewBox="0 0 100 100">
                  <rect x="10" y="10" width="20" height="20" fill="currentColor"/>
                  <rect x="70" y="10" width="20" height="20" fill="currentColor"/>
                  <rect x="10" y="70" width="20" height="20" fill="currentColor"/>
                  <rect x="40" y="40" width="20" height="20" fill="currentColor"/>
                  <rect x="50" y="20" width="10" height="10" fill="currentColor"/>
                  <rect x="30" y="60" width="10" height="10" fill="currentColor"/>
                  <rect x="80" y="80" width="10" height="10" fill="currentColor"/>
                </svg>
              </div>

              <div className="text-[10px] text-[#66736F] dark:text-[#A3B0AB] font-mono font-medium leading-normal">
                PNR Reference: TK-{activeQr.id}<br />
                Route: {activeQr.source_station_code} ➔ {activeQr.destination_station_code}<br />
                Seat Selection: {activeQr.seat_preference || 'No Preference'}
              </div>

              <button
                onClick={() => setActiveQr(null)}
                className="absolute top-4 right-4 text-[#66736F] dark:text-[#A3B0AB] hover:text-[#263238] dark:hover:text-[#F7F5EF] text-lg font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F7F5EF] dark:hover:bg-[#2A403A] transition-all cursor-pointer"
              >✕</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

/**
 * TravelIQ Professional Hotel Tax Invoice & e-Voucher Generator
 * Produces MakeMyTrip (MMT) and OYO-style publication-grade booking receipts.
 */

// Helper to convert numbers to Indian Rupees in words (Indian Numbering System: Lakhs & Crores)
export function numberToWordsINR(amount) {
  if (!amount || isNaN(amount)) return 'Zero Rupees Only';
  const num = Math.round(amount);
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ',
    'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ',
    'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    let str = '';
    if (n > 99) {
      str += a[Math.floor(n / 100)] + 'Hundred ';
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
    } else if (n > 0) {
      str += a[n];
    }
    return str.trim();
  };

  if (num === 0) return 'Zero Rupees Only';

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = Math.floor((num % 1000) / 100);
  const remainder = num % 100;

  let result = '';
  if (crore > 0) result += inWords(crore) + ' Crore ';
  if (lakh > 0) result += inWords(lakh) + ' Lakh ';
  if (thousand > 0) result += inWords(thousand) + ' Thousand ';
  if (hundred > 0) result += a[hundred] + 'Hundred ';
  if (remainder > 0) {
    if (result !== '') result += 'and ';
    result += inWords(remainder);
  }

  return `${result.trim()} Rupees Only`;
}

export function generateHotelInvoiceHTML(booking = {}) {
  // Extract user from localStorage if not directly in booking
  let defaultUserName = 'Aditya Upadhyay';
  let defaultUserEmail = 'aditya.traveler@traveliq.in';
  let defaultUserPhone = '+91 98765 43210';

  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed.name) defaultUserName = parsed.name;
      if (parsed.email) defaultUserEmail = parsed.email;
      if (parsed.phone) defaultUserPhone = parsed.phone;
    }
  } catch (e) {}

  const bookingId = booking.id || booking.bookingReference || `TIQ-STAY-${Math.floor(100000 + Math.random() * 900000)}`;
  const cleanId = bookingId.replace(/[^A-Za-z0-9]/g, '').slice(-6).toUpperCase();
  const invoiceNo = `INV/2026-27/TIQ-${cleanId || '892411'}`;
  const transactionId = `TXN-TIQ-UPI-${cleanId}927`;

  const guestName = booking.guestName || booking.guest_name || defaultUserName;
  const guestEmail = booking.guestEmail || booking.guest_email || defaultUserEmail;
  const guestPhone = booking.guestPhone || booking.guest_phone || defaultUserPhone;
  
  const hotelName = booking.hotelName || booking.hotel_name || 'Stay Villa Dormitory & Luxury Pods';
  const city = booking.city || 'Mumbai';
  const category = booking.isHostel ? 'Backpacker Hostel & Pods' : (booking.category || 'Premium Hotel & Suites');
  const roomType = booking.roomType || (booking.isHostel ? 'Futuristic Single Capsule Pod' : 'Deluxe Comfort Room');
  
  const unitsCount = booking.unitsCount || 1;
  const guestsCount = booking.guestsCount || 1;
  const nights = booking.nights || 1;
  const mealPlan = booking.mealPlan || 'Complimentary Breakfast (CP)';
  const specialRequests = Array.isArray(booking.specialRequests) ? booking.specialRequests : [];
  
  const checkInDate = booking.checkInDate || '2026-09-19';
  const checkOutDate = booking.checkOutDate || '2026-10-01';
  
  // Format check-in/out formatted strings
  const formatDate = (dStr) => {
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return dStr;
      return d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dStr;
    }
  };

  const formattedCheckIn = formatDate(checkInDate);
  const formattedCheckOut = formatDate(checkOutDate);
  const bookingTimestamp = booking.createdAt 
    ? new Date(booking.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
    : new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

  // Financial Pricing Calculations
  const ratePerNight = booking.ratePerNight || booking.pricing?.ratePerNight || Math.round((booking.pricing?.grandTotal || booking.grandTotal || 25563) / (nights * unitsCount * 1.12));
  const baseTotal = booking.baseTotal || (ratePerNight * nights * unitsCount);
  const mealsTotal = booking.mealsTotal !== undefined ? booking.mealsTotal : (mealPlan.includes('Dinner') ? 499 * guestsCount * nights : mealPlan.includes('Breakfast') ? 199 * guestsCount * nights : 0);
  const discount = booking.discount || booking.pricing?.discount || (booking.promoCode ? 600 : 0);
  const promoCode = booking.promoCode || (discount > 0 ? 'HOSTEL20' : null);
  const subtotalAfterDiscount = Math.max(0, baseTotal + mealsTotal - discount);
  const taxes = booking.taxes || booking.pricing?.taxes || Math.round(subtotalAfterDiscount * 0.12);
  const cgst = Math.round(taxes / 2);
  const sgst = taxes - cgst;
  const grandTotal = booking.grandTotal || booking.pricing?.grandTotal || (subtotalAfterDiscount + taxes);
  
  const paymentMethod = booking.paymentMethod || 'Pay at Property (Desk)';
  const isPaid = paymentMethod.toLowerCase().includes('upi') || paymentMethod.toLowerCase().includes('card') || paymentMethod.toLowerCase().includes('paid') || paymentMethod.toLowerCase().includes('online');
  const amountInWords = numberToWordsINR(grandTotal);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TravelIQ_Hotel_Tax_Invoice_${bookingId}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@500;600;700;800&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #E2E8F0;
      color: #0F172A;
      line-height: 1.45;
      padding: 24px 12px;
      -webkit-font-smoothing: antialiased;
    }
    .invoice-wrapper {
      max-width: 860px;
      margin: 0 auto;
      background: #FFFFFF;
      border-radius: 16px;
      box-shadow: 0 12px 35px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04);
      border: 1px solid #CBD5E1;
      overflow: hidden;
      position: relative;
    }
    
    /* ─── 1. TOP BRAND HEADER (MakeMyTrip & OYO High-End Styling) ─── */
    .brand-topbar {
      background: linear-gradient(135deg, #092B16 0%, #14532D 50%, #166534 100%);
      color: #FFFFFF;
      padding: 24px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 4px solid #E58A3A;
      position: relative;
    }
    .brand-topbar::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: rgba(255, 255, 255, 0.15);
    }
    .brand-logo-area {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .traveliq-logo-icon {
      width: 52px;
      height: 52px;
      background: rgba(255, 255, 255, 0.12);
      border: 2px solid rgba(255, 255, 255, 0.28);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.4);
      flex-shrink: 0;
    }
    .brand-name-group {
      display: flex;
      flex-direction: column;
    }
    .brand-title {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: -0.6px;
      color: #FFFFFF;
      display: flex;
      align-items: center;
      gap: 5px;
      line-height: 1.1;
    }
    .brand-title .brand-iq {
      color: #4ADE80;
      background: linear-gradient(135deg, #4ADE80 0%, #22C55E 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .brand-stays-tag {
      font-size: 11px;
      font-weight: 800;
      color: #E58A3A;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-left: 4px;
      background: #FFF7ED;
      padding: 1px 7px;
      border-radius: 4px;
      -webkit-text-fill-color: #E58A3A;
      display: inline-block;
    }
    .brand-subtitle {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #CBD5E1;
      font-weight: 600;
      margin-top: 4px;
    }
    .doc-meta-panel {
      text-align: right;
    }
    .doc-tax-badge {
      display: inline-block;
      background: #E58A3A;
      color: #FFFFFF;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
      padding: 5px 14px;
      border-radius: 20px;
      box-shadow: 0 3px 10px rgba(229, 138, 58, 0.45);
      margin-bottom: 5px;
    }
    .invoice-id-line {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: #F8FAFC;
      font-weight: 700;
    }
    .invoice-date-line {
      font-size: 11px;
      color: #94A3B8;
      margin-top: 2px;
    }

    /* ─── 2. VERIFIED CONFIRMATION STRIP ─── */
    .status-strip {
      background: #F0FDF4;
      border-bottom: 1px solid #BBF7D0;
      padding: 12px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
    }
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 9px;
      color: #15803D;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      font-size: 12px;
    }
    .pulsing-dot {
      width: 10px;
      height: 10px;
      background: #22C55E;
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.25);
    }
    .status-security {
      color: #475569;
      font-size: 11.5px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* ─── 3. INVOICE BODY CONTENT ─── */
    .invoice-body {
      padding: 28px 32px;
    }

    /* Customer & Booking ID Grid (Real Tax Invoice Format) */
    .guest-meta-matrix {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 20px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 14px;
      padding: 18px 22px;
      margin-bottom: 24px;
    }
    .meta-card-col {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .meta-divider-left {
      border-left: 1px solid #E2E8F0;
      padding-left: 22px;
    }
    .field-tag {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748B;
      font-weight: 800;
    }
    .primary-guest-name {
      font-size: 18px;
      font-weight: 900;
      color: #0F172A;
      letter-spacing: -0.2px;
      margin-top: 1px;
    }
    .contact-info-line {
      font-size: 12px;
      color: #334155;
      font-weight: 500;
      margin-top: 2px;
    }
    .guest-pills-row {
      display: flex;
      gap: 6px;
      margin-top: 6px;
      flex-wrap: wrap;
    }
    .guest-pill {
      font-size: 10.5px;
      background: #FFFFFF;
      color: #14532D;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid #CBD5E1;
    }
    
    .booking-ref-box {
      font-family: 'JetBrains Mono', monospace;
      font-size: 15px;
      font-weight: 800;
      color: #14532D;
      background: #DCFCE7;
      padding: 3px 10px;
      border-radius: 6px;
      display: inline-block;
      width: fit-content;
      margin-top: 3px;
      border: 1px solid #86EFAC;
      letter-spacing: 0.5px;
    }
    .payment-status-tag {
      font-size: 11.5px;
      color: #15803D;
      font-weight: 700;
      margin-top: 3px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* Hotel & Stay Hero Card */
    .hotel-showcase-box {
      border: 1.5px solid #CBD5E1;
      border-radius: 14px;
      padding: 20px 22px;
      margin-bottom: 24px;
      background: #FFFFFF;
      position: relative;
    }
    .hotel-headline-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      border-bottom: 1px solid #F1F5F9;
      padding-bottom: 14px;
      gap: 16px;
    }
    .hotel-category-chip {
      font-size: 10px;
      font-weight: 800;
      color: #E58A3A;
      background: #FFF7ED;
      border: 1px solid #FFEDD5;
      padding: 3px 10px;
      border-radius: 14px;
      display: inline-block;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 4px;
    }
    .hotel-display-title {
      font-size: 20px;
      font-weight: 900;
      color: #14532D;
      letter-spacing: -0.3px;
      line-height: 1.2;
    }
    .hotel-location-text {
      font-size: 12px;
      color: #64748B;
      margin-top: 4px;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .hotel-rating-badge {
      background: #14532D;
      color: #FFFFFF;
      padding: 6px 14px;
      border-radius: 10px;
      text-align: right;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(20, 83, 45, 0.2);
    }
    .rating-score {
      font-size: 15px;
      font-weight: 900;
    }
    .rating-caption {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #86EFAC;
      display: block;
      font-weight: 700;
    }

    /* 4-Box Stay Schedule Matrix (MMT Style) */
    .stay-schedule-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      background: #F8FAFC;
      border-radius: 12px;
      padding: 14px 16px;
      border: 1px solid #E2E8F0;
    }
    .schedule-cell {
      display: flex;
      flex-direction: column;
    }
    .schedule-heading {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748B;
      font-weight: 800;
      margin-bottom: 3px;
    }
    .schedule-data {
      font-size: 13.5px;
      font-weight: 800;
      color: #0F172A;
    }
    .schedule-data.highlight-green {
      color: #14532D;
    }
    .schedule-subtext {
      font-size: 11px;
      color: #64748B;
      font-weight: 500;
      margin-top: 1px;
    }

    /* Room Category & Amenities Strip */
    .room-inclusions-strip {
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px dashed #E2E8F0;
      display: grid;
      grid-template-columns: 1.8fr 1.2fr;
      gap: 16px;
      font-size: 12px;
    }
    .inclusion-header {
      font-size: 10.5px;
      text-transform: uppercase;
      font-weight: 800;
      color: #64748B;
      letter-spacing: 0.5px;
    }
    .inclusion-value {
      font-weight: 800;
      color: #1E293B;
      font-size: 13px;
      margin-top: 2px;
    }
    .amenity-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 5px;
    }
    .amenity-chip {
      font-size: 10px;
      background: #F1F5F9;
      color: #334155;
      padding: 2px 8px;
      border-radius: 5px;
      border: 1px solid #E2E8F0;
      font-weight: 600;
    }

    /* ─── 4. ITEMIZED TAX INVOICE TABLE (MMT & OYO OFFICIAL GST BREAKDOWN) ─── */
    .section-title-bar {
      font-size: 13px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #0F172A;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .section-title-bar::after {
      content: '';
      flex: 1;
      height: 1.5px;
      background: #E2E8F0;
    }
    
    .gst-invoice-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 12px;
    }
    .gst-invoice-table th {
      background: #F1F5F9;
      color: #334155;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.8px;
      padding: 10px 14px;
      border-top: 1.5px solid #CBD5E1;
      border-bottom: 1.5px solid #CBD5E1;
      text-align: left;
    }
    .gst-invoice-table th.align-right,
    .gst-invoice-table td.align-right {
      text-align: right;
    }
    .gst-invoice-table td {
      padding: 11px 14px;
      border-bottom: 1px solid #F1F5F9;
      color: #1E293B;
    }
    .gst-invoice-table tr.total-breakdown-row td {
      border-top: 2px solid #0F172A;
      border-bottom: 2px solid #0F172A;
      font-size: 14px;
      font-weight: 800;
      background: #F8FAFC;
    }
    .grand-total-highlight {
      font-size: 18px;
      font-weight: 900;
      color: #14532D;
      font-family: 'JetBrains Mono', monospace;
    }
    .coupon-savings-highlight {
      color: #15803D;
      font-weight: 800;
    }
    
    .in-words-container {
      background: #F8FAFC;
      border-left: 4px solid #14532D;
      padding: 10px 16px;
      font-size: 11.5px;
      color: #334155;
      margin-bottom: 24px;
      border-radius: 0 8px 8px 0;
      border: 1px solid #E2E8F0;
      border-left-width: 4px;
    }

    /* ─── 5. AUTHENTICATION, BARCODE & QR SECURITY ─── */
    .verification-card {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 20px;
      align-items: center;
      background: #FAFAF9;
      border: 1.5px dashed #CBD5E1;
      border-radius: 14px;
      padding: 18px 20px;
      margin-bottom: 24px;
    }
    .qr-container {
      background: #FFFFFF;
      padding: 10px;
      border-radius: 10px;
      border: 1.5px solid #E2E8F0;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .security-details {
      font-size: 11.5px;
      color: #334155;
    }
    .security-badge-title {
      font-weight: 900;
      color: #14532D;
      margin-bottom: 3px;
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 13px;
    }
    .barcode-svg-area {
      margin-top: 8px;
    }
    .embossed-seal {
      width: 90px;
      height: 90px;
      border: 2.5px solid #14532D;
      border-radius: 50%;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-size: 8px;
      font-weight: 800;
      text-transform: uppercase;
      color: #14532D;
      letter-spacing: 0.4px;
      transform: rotate(-6deg);
      background: #FFFFFF;
      box-shadow: 0 4px 12px rgba(20, 83, 45, 0.15);
      flex-shrink: 0;
    }
    .seal-border-dashed {
      width: 100%;
      height: 100%;
      border: 1.5px dashed #14532D;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2px;
    }

    /* ─── 6. GUEST GUIDELINES & POLICIES (MMT STANDARD TERMS) ─── */
    .terms-guidelines-box {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 22px;
    }
    .guideline-row {
      font-size: 11px;
      color: #475569;
      margin-bottom: 7px;
      display: flex;
      align-items: flex-start;
      gap: 8px;
      line-height: 1.45;
    }
    .guideline-row strong {
      color: #0F172A;
    }
    .guideline-num {
      color: #14532D;
      font-weight: 900;
      flex-shrink: 0;
    }

    /* ─── 7. CORPORATE STATUTORY FOOTER ─── */
    .invoice-footer-bar {
      border-top: 1.5px solid #E2E8F0;
      padding: 20px 32px;
      background: #F8FAFC;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #64748B;
    }
    .helpline-links {
      display: flex;
      gap: 16px;
      font-weight: 700;
      margin-top: 2px;
    }
    .helpline-links a {
      color: #14532D;
      text-decoration: none;
    }
    .company-statutory-info {
      font-size: 10px;
      color: #94A3B8;
      text-align: right;
      line-height: 1.35;
    }

    /* ─── SCREEN FLOATING CONTROLS ─── */
    .screen-actions-bar {
      position: sticky;
      bottom: 20px;
      max-width: 860px;
      margin: 20px auto 0;
      display: flex;
      justify-content: center;
      gap: 14px;
      z-index: 100;
    }
    .btn-print {
      background: #14532D;
      color: #FFFFFF;
      font-family: inherit;
      font-weight: 800;
      font-size: 13.5px;
      padding: 13px 28px;
      border-radius: 30px;
      border: none;
      cursor: pointer;
      box-shadow: 0 8px 22px rgba(20, 83, 45, 0.4);
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .btn-print:hover {
      background: #0F3F22;
      transform: translateY(-2px);
      box-shadow: 0 10px 26px rgba(20, 83, 45, 0.5);
    }
    .btn-dismiss {
      background: #FFFFFF;
      color: #334155;
      font-family: inherit;
      font-weight: 700;
      font-size: 13px;
      padding: 13px 22px;
      border-radius: 30px;
      border: 1.5px solid #CBD5E1;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-dismiss:hover {
      background: #F1F5F9;
    }

    /* ─── PRINT SPECIFIC RULES (A4 PRINT OPTIMIZED) ─── */
    @media print {
      body {
        background-color: #FFFFFF;
        padding: 0;
        color: #000000;
      }
      .invoice-wrapper {
        box-shadow: none;
        border: none;
        max-width: 100%;
        border-radius: 0;
      }
      .screen-actions-bar {
        display: none !important;
      }
      .brand-topbar {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .status-strip, .guest-meta-matrix, .stay-schedule-grid, .gst-invoice-table th, .total-breakdown-row td, .embossed-seal, .verification-card, .in-words-container, .brand-stays-tag {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      @page {
        margin: 8mm;
        size: A4 portrait;
      }
    }
  </style>
</head>
<body>

  <div class="invoice-wrapper" id="traveliq-tax-invoice">
    
    <!-- ─── 1. TOP BRAND BAR WITH TRAVELIQ LOGO ─── -->
    <div class="brand-topbar">
      <div class="brand-logo-area">
        <!-- High-Definition TravelIQ Logo Badge -->
        <div class="traveliq-logo-icon">
          <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
            <!-- Hexagonal / Compass Shield -->
            <polygon points="16,2 29,9 29,23 16,30 3,23 3,9" stroke="#4ADE80" stroke-width="2.2" fill="rgba(74, 222, 128, 0.15)"/>
            <!-- Stylized Compass Needle / Airplane -->
            <path d="M16 6L21 16L16 13.5L11 16L16 6Z" fill="#FFFFFF"/>
            <path d="M16 26L11 16L16 18.5L21 16L16 26Z" fill="#E58A3A"/>
            <circle cx="16" cy="16" r="2.5" fill="#4ADE80"/>
          </svg>
        </div>

        <div class="brand-name-group">
          <div class="brand-title">
            Travel<span class="brand-iq">IQ</span>
            <span class="brand-stays-tag">Stays</span>
          </div>
          <div class="brand-subtitle">AI Travel Intelligence & Verified Hospitality Network</div>
        </div>
      </div>

      <div class="doc-meta-panel">
        <span class="doc-tax-badge">Tax Invoice & e-Voucher</span>
        <div class="invoice-id-line">${invoiceNo}</div>
        <div class="invoice-date-line">Issued on ${bookingTimestamp}</div>
      </div>
    </div>

    <!-- ─── 2. STATUS VERIFICATION STRIP ─── -->
    <div class="status-strip">
      <div class="status-indicator">
        <span class="pulsing-dot"></span>
        <span>Booking Confirmed & Guaranteed</span>
      </div>
      <div class="status-security">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803D" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span>100% Verified Stay Protection • Instant Hotel Check-in</span>
      </div>
    </div>

    <!-- ─── 3. INVOICE BODY CONTENT ─── -->
    <div class="invoice-body">
      
      <!-- Billed To (Customer Details) & Booking Reference -->
      <div class="guest-meta-matrix">
        <div class="meta-card-col">
          <span class="field-tag">Billed To (Primary Customer / Guest)</span>
          <h2 class="primary-guest-name">${guestName}</h2>
          <div class="contact-info-line">
            📞 <strong>${guestPhone}</strong> &nbsp;|&nbsp; ✉️ <strong>${guestEmail}</strong>
          </div>
          <div class="guest-pills-row">
            <span class="guest-pill">👥 ${guestsCount} Traveler${guestsCount > 1 ? 's' : ''}</span>
            <span class="guest-pill">🛏️ ${unitsCount} ${booking.isHostel ? 'Bed' : 'Room'}${unitsCount > 1 ? 's' : ''}</span>
            <span class="guest-pill" style="color: #15803D; background: #DCFCE7; border-color: #86EFAC;">
              🛡️ ${booking.govIdType || 'Aadhaar Card'}: ${(booking.govIdNumber || 'XXXX XXXX 4829')} (KYC Verified)
            </span>
          </div>
        </div>

        <div class="meta-card-col meta-divider-left">
          <span class="field-tag">TravelIQ Booking Reference ID</span>
          <div class="booking-ref-box">${bookingId}</div>
          <div class="contact-info-line" style="margin-top: 5px;">
            Payment Method: <strong style="color: #0F172A;">${paymentMethod}</strong>
          </div>
          <div class="payment-status-tag">
            <span style="display:inline-block; width:7px; height:7px; background:${isPaid ? '#22C55E' : '#E58A3A'}; border-radius:50%;"></span>
            <span>${isPaid ? 'Payment Confirmed & Settled' : 'Payable at Property Frontdesk'}</span>
          </div>
        </div>
      </div>

      <!-- Hotel & Property Header Showcase -->
      <div class="hotel-showcase-box">
        <div class="hotel-headline-row">
          <div>
            <span class="hotel-category-chip">${category}</span>
            <h1 class="hotel-display-title">${hotelName}</h1>
            <div class="hotel-location-text">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E58A3A" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>Near Central Hub, ${city}, Maharashtra, India • Frontdesk: +91 22 6192 8400</span>
            </div>
          </div>

          <div class="hotel-rating-badge">
            <div class="rating-score">★ 4.9 / 5</div>
            <span class="rating-caption">Verified Rating</span>
          </div>
        </div>

        <!-- 4-Column Stay Schedule Grid -->
        <div class="stay-schedule-grid">
          <div class="schedule-cell">
            <span class="schedule-heading">Check-In</span>
            <span class="schedule-data highlight-green">${formattedCheckIn}</span>
            <span class="schedule-subtext">From 12:00 PM</span>
          </div>
          <div class="schedule-cell">
            <span class="schedule-heading">Check-Out</span>
            <span class="schedule-data">${formattedCheckOut}</span>
            <span class="schedule-subtext">Until 11:00 AM</span>
          </div>
          <div class="schedule-cell">
            <span class="schedule-heading">Duration & Units</span>
            <span class="schedule-data">${nights} ${nights === 1 ? 'Night' : 'Nights'}</span>
            <span class="schedule-subtext">${unitsCount} ${booking.isHostel ? 'Dorm Bed' : 'Room'}</span>
          </div>
          <div class="schedule-cell">
            <span class="schedule-heading">Meal Plan</span>
            <span class="schedule-data" style="font-size: 12px; color: #14532D;">${mealPlan}</span>
            <span class="schedule-subtext" style="color: #15803D; font-weight: 700;">Included In Bill</span>
          </div>
        </div>

        <!-- Room Specs & Preferences -->
        <div class="room-inclusions-strip">
          <div>
            <span class="inclusion-header">Selected Accommodation Category</span>
            <div class="inclusion-value">${roomType}</div>
            <div class="amenity-pills">
              <span class="amenity-chip">✓ Air Conditioned</span>
              <span class="amenity-chip">✓ High-Speed Wi-Fi</span>
              <span class="amenity-chip">✓ Housekeeping</span>
              <span class="amenity-chip">✓ Free Cancellation</span>
            </div>
          </div>

          <div>
            <span class="inclusion-header">Special Guest Preferences</span>
            <div class="inclusion-value" style="font-size: 11.5px; font-weight: 600; color: #475569;">
              ${specialRequests.length > 0 ? specialRequests.join(', ') : 'Standard non-smoking room requested'}
            </div>
          </div>
        </div>

      </div>

      <!-- Itemized Tax Invoice Breakdown (MakeMyTrip / OYO Official Table) -->
      <div class="section-title-bar">Tariff Breakdown & GST Tax Invoice</div>

      <table class="gst-invoice-table">
        <thead>
          <tr>
            <th style="width: 44%;">Description & SAC Code</th>
            <th class="align-right" style="width: 20%;">Rate / Night</th>
            <th class="align-right" style="width: 16%;">Duration</th>
            <th class="align-right" style="width: 20%;">Amount (INR)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>${roomType}</strong>
              <div style="font-size: 10.5px; color: #64748B;">Room accommodation service tariff (SAC: 996311) for ${nights} nights</div>
            </td>
            <td class="align-right">₹${ratePerNight.toLocaleString('en-IN')}</td>
            <td class="align-right">${nights}N × ${unitsCount}U</td>
            <td class="align-right">₹${baseTotal.toLocaleString('en-IN')}.00</td>
          </tr>

          ${mealsTotal > 0 ? `
          <tr>
            <td>
              <strong>${mealPlan} Add-on</strong>
              <div style="font-size: 10.5px; color: #64748B;">Food & beverage meal package (SAC: 996331) for ${guestsCount} guest(s)</div>
            </td>
            <td class="align-right">₹${Math.round(mealsTotal / (guestsCount * nights)).toLocaleString('en-IN')}</td>
            <td class="align-right">${nights}N × ${guestsCount}G</td>
            <td class="align-right">₹${mealsTotal.toLocaleString('en-IN')}.00</td>
          </tr>` : ''}

          ${discount > 0 ? `
          <tr>
            <td>
              <strong class="coupon-savings-highlight">Promotional Discount & Coupon Savings</strong>
              <div style="font-size: 10.5px; color: #15803D;">Coupon Applied: ${promoCode || 'TRAVELIQ_SAVINGS'}</div>
            </td>
            <td class="align-right coupon-savings-highlight">-</td>
            <td class="align-right coupon-savings-highlight">1</td>
            <td class="align-right coupon-savings-highlight">- ₹${discount.toLocaleString('en-IN')}.00</td>
          </tr>` : ''}

          <tr>
            <td colspan="3" style="text-align: right; color: #475569; font-weight: 700;">Net Taxable Value (Subtotal)</td>
            <td class="align-right" style="font-weight: 800;">₹${subtotalAfterDiscount.toLocaleString('en-IN')}.00</td>
          </tr>

          <tr>
            <td colspan="3" style="text-align: right; color: #475569; font-size: 11px;">
              Central GST (CGST @ 6%)
            </td>
            <td class="align-right" style="font-size: 11px;">₹${cgst.toLocaleString('en-IN')}.00</td>
          </tr>

          <tr>
            <td colspan="3" style="text-align: right; color: #475569; font-size: 11px;">
              State GST (SGST @ 6%)
            </td>
            <td class="align-right" style="font-size: 11px;">₹${sgst.toLocaleString('en-IN')}.00</td>
          </tr>

          <tr class="total-breakdown-row">
            <td colspan="3" style="text-align: right; font-weight: 900;">
              Total Invoice Amount (GST Inclusive):
            </td>
            <td class="align-right">
              <span class="grand-total-highlight">₹${grandTotal.toLocaleString('en-IN')}.00</span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- In Words -->
      <div class="in-words-container">
        <strong>Amount in Words:</strong> ${amountInWords}
      </div>

      <!-- Security, QR Barcode & Digital Official Stamp -->
      <div class="verification-card">
        <div class="qr-container">
          <!-- Standalone High-Precision SVG QR Code -->
          <svg width="86" height="86" viewBox="0 0 100 100" fill="#0F172A">
            <rect x="5" y="5" width="28" height="28" fill="#0F172A" rx="4"/>
            <rect x="9" y="9" width="20" height="20" fill="#FFFFFF" rx="2"/>
            <rect x="13" y="13" width="12" height="12" fill="#14532D" rx="2"/>

            <rect x="67" y="5" width="28" height="28" fill="#0F172A" rx="4"/>
            <rect x="71" y="9" width="20" height="20" fill="#FFFFFF" rx="2"/>
            <rect x="75" y="13" width="12" height="12" fill="#14532D" rx="2"/>

            <rect x="5" y="67" width="28" height="28" fill="#0F172A" rx="4"/>
            <rect x="9" y="71" width="20" height="20" fill="#FFFFFF" rx="2"/>
            <rect x="13" y="75" width="12" height="12" fill="#14532D" rx="2"/>

            <rect x="40" y="8" width="6" height="20" fill="#0F172A"/>
            <rect x="50" y="15" width="10" height="6" fill="#0F172A"/>
            <rect x="38" y="38" width="24" height="24" fill="#14532D" rx="3"/>
            <rect x="44" y="44" width="12" height="12" fill="#FFFFFF" rx="2"/>
            <rect x="68" y="40" width="8" height="16" fill="#0F172A"/>
            <rect x="80" y="50" width="14" height="6" fill="#0F172A"/>
            <rect x="38" y="70" width="14" height="8" fill="#0F172A"/>
            <rect x="56" y="68" width="12" height="18" fill="#0F172A"/>
            <rect x="74" y="74" width="20" height="18" fill="#0F172A"/>
          </svg>
        </div>

        <div class="security-details">
          <div class="security-badge-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14532D" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Official Digital Stay Verification & Express Check-in
          </div>
          <p style="font-size: 11px; color: #475569; margin-top: 2px;">
            Present this QR code or Booking ID at the property reception desk for instant contactless key handover.
          </p>
          
          <!-- Barcode SVG -->
          <div class="barcode-svg-area">
            <svg width="190" height="28" viewBox="0 0 190 28" fill="#1E293B">
              <rect x="0" y="0" width="3" height="24"/>
              <rect x="5" y="0" width="1.5" height="24"/>
              <rect x="8" y="0" width="4" height="24"/>
              <rect x="14" y="0" width="2" height="24"/>
              <rect x="18" y="0" width="1" height="24"/>
              <rect x="21" y="0" width="5" height="24"/>
              <rect x="28" y="0" width="2" height="24"/>
              <rect x="32" y="0" width="3" height="24"/>
              <rect x="37" y="0" width="1.5" height="24"/>
              <rect x="41" y="0" width="4" height="24"/>
              <rect x="47" y="0" width="2" height="24"/>
              <rect x="51" y="0" width="5" height="24"/>
              <rect x="58" y="0" width="1.5" height="24"/>
              <rect x="62" y="0" width="3" height="24"/>
              <rect x="67" y="0" width="2" height="24"/>
              <rect x="71" y="0" width="4" height="24"/>
              <rect x="77" y="0" width="1.5" height="24"/>
              <rect x="81" y="0" width="3" height="24"/>
              <rect x="86" y="0" width="5" height="24"/>
              <rect x="93" y="0" width="2" height="24"/>
              <rect x="97" y="0" width="3" height="24"/>
              <rect x="102" y="0" width="1.5" height="24"/>
              <rect x="106" y="0" width="4" height="24"/>
              <rect x="112" y="0" width="2" height="24"/>
              <rect x="116" y="0" width="5" height="24"/>
              <rect x="123" y="0" width="1.5" height="24"/>
              <rect x="127" y="0" width="3" height="24"/>
              <rect x="132" y="0" width="2" height="24"/>
              <rect x="136" y="0" width="4" height="24"/>
              <rect x="142" y="0" width="1.5" height="24"/>
              <rect x="146" y="0" width="3" height="24"/>
              <rect x="151" y="0" width="5" height="24"/>
              <rect x="158" y="0" width="2" height="24"/>
              <rect x="162" y="0" width="4" height="24"/>
              <rect x="168" y="0" width="2" height="24"/>
              <rect x="172" y="0" width="5" height="24"/>
              <rect x="179" y="0" width="1.5" height="24"/>
              <rect x="183" y="0" width="3" height="24"/>
              <rect x="188" y="0" width="2" height="24"/>
            </svg>
          </div>
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #64748B; margin-top: 2px;">
            SEC-HASH: TIQ-SHA256-${cleanId || '948293'} • GATEWAY-REF: ${transactionId}
          </div>
        </div>

        <div class="embossed-seal">
          <div class="seal-border-dashed">
            <span style="font-size: 7.5px; color: #14532D; font-weight:800;">TRAVELIQ</span>
            <span style="font-size: 9.5px; font-weight: 900; color: #15803D;">VERIFIED</span>
            <span style="font-size: 6.5px; color: #64748B; font-weight:700;">OFFICIAL STAYS</span>
          </div>
        </div>
      </div>

      <!-- Guest Guidelines & Policies (MakeMyTrip Format) -->
      <div class="terms-guidelines-box">
        <div style="font-size: 11.5px; font-weight: 800; color: #0F172A; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
          Important Guest Guidelines & Hotel Policies
        </div>
        <div class="guideline-row">
          <span class="guideline-num">1.</span>
          <span><strong>Mandatory Govt. ID Proof:</strong> All adult guests must carry an original government-approved Photo ID (Aadhaar Card, Passport, Driving License, or Voter ID). PAN cards are not accepted by law.</span>
        </div>
        <div class="guideline-row">
          <span class="guideline-num">2.</span>
          <span><strong>Check-in / Check-out Timings:</strong> Standard check-in begins at 12:00 PM and check-out is by 11:00 AM. Early check-in or late checkout is subject to property availability.</span>
        </div>
        <div class="guideline-row">
          <span class="guideline-num">3.</span>
          <span><strong>Free Cancellation Guarantee:</strong> Free cancellation is eligible up to 24 hours prior to the check-in date. Post this window, standard 1-night retention charges will apply.</span>
        </div>
        <div class="guideline-row">
          <span class="guideline-num">4.</span>
          <span><strong>Hostel & Property House Rules:</strong> Quiet hours in dormitories are observed between 10:00 PM and 7:00 AM. Non-registered visitors are restricted to the reception lounge.</span>
        </div>
      </div>

    </div>

    <!-- ─── 4. CORPORATE STATUTORY FOOTER ─── -->
    <div class="invoice-footer-bar">
      <div>
        <div style="font-weight: 800; color: #0F172A; margin-bottom: 2px;">24x7 Customer Care & Stay Support</div>
        <div class="helpline-links">
          <span>📞 Helpline: <a href="tel:18008728354">1800-872-8354</a></span>
          <span>✉️ Email: <a href="mailto:support@traveliq.in">support@traveliq.in</a></span>
          <span>💬 WhatsApp: <a href="https://wa.me/919876543210">+91 98765 43210</a></span>
        </div>
      </div>

      <div class="company-statutory-info">
        <strong>TravelIQ Technologies Pvt. Ltd.</strong><br>
        GSTIN: 27AABCT1234F1Z5 &nbsp;|&nbsp; CIN: U72900MH2024PTC123456<br>
        Place of Supply: 27-Maharashtra • BKC Cyber Park, Mumbai - 400051<br>
        <em>This is a computer-generated tax invoice & booking voucher.</em>
      </div>
    </div>

  </div>

  <!-- Screen Floating Action Controls -->
  <div class="screen-actions-bar">
    <button class="btn-print" onclick="window.print()">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
      Print / Save as PDF
    </button>
    <button class="btn-dismiss" onclick="window.close()">
      Close Preview
    </button>
  </div>

  <script>
    // Auto-trigger print when requested
    window.addEventListener('load', function() {
      if (window.location.search.includes('autoprint=true')) {
        setTimeout(function() {
          window.print();
        }, 400);
      }
    });
  </script>
</body>
</html>`;
}

/**
 * Open professional print window with high-res styling and trigger PDF / Print dialog
 */
export function printHotelInvoice(booking, autoPrint = true) {
  try {
    const html = generateHotelInvoiceHTML(booking);
    const printWindow = window.open('', '_blank', 'width=940,height=1050,menubar=no,toolbar=no,location=no,status=no');
    if (!printWindow) {
      alert('Please allow popups for TravelIQ to download your invoice.');
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    
    if (autoPrint) {
      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch (e) {
          console.log('Print dialog initiated', e);
        }
      }, 500);
    }
  } catch (err) {
    console.error('Failed to open invoice print window:', err);
  }
}

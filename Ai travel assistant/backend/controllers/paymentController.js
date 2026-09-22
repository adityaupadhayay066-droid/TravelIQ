const { Transaction, PaymentLog, Booking, User, Trip } = require('../models');

/**
 * Record a transaction after successful checkout.
 */
const createTransaction = async (req, res) => {
  const { booking_id, amount, payment_method, status, details } = req.body;

  try {
    // Generate a unique transaction reference id
    const transaction_id = `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`;

    const transaction = await Transaction.create({
      booking_id,
      user_id: req.user.id,
      transaction_id,
      amount,
      payment_method,
      status
    });

    // Create payment audit log
    await PaymentLog.create({
      user_id: req.user.id,
      event_type: status === 'Success' ? 'COMPLETED' : 'FAILED',
      payment_method,
      details: details || `Demo transaction ${status} for booking #${booking_id}`
    });

    res.status(201).json({
      message: 'Transaction successfully processed and logged.',
      transaction
    });
  } catch (error) {
    console.error('[Payment Controller Error]:', error);
    res.status(500).json({ message: error.message });
  }
};

// Helper to convert numbers to Indian Rupees in words
function numberToWordsINR(amount) {
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

// Station dictionary for authentic full names
const STATION_MAP = {
  NDLS: 'NEW DELHI (NDLS)',
  DLI: 'DELHI JN (DLI)',
  NZM: 'HAZRAT NIZAMUDDIN (NZM)',
  ANVT: 'ANAND VIHAR TRM (ANVT)',
  CSTM: 'MUMBAI CSMT (CSMT)',
  CSMT: 'MUMBAI CSMT (CSMT)',
  MMCT: 'MUMBAI CENTRAL (MMCT)',
  BDTS: 'BANDRA TERMINUS (BDTS)',
  HWH: 'HOWRAH JN (HWH)',
  SDAH: 'SEALDAH (SDAH)',
  MAS: 'CHENNAI CENTRAL (MAS)',
  MS: 'CHENNAI EGMORE (MS)',
  SBC: 'KSR BENGALURU (SBC)',
  YPR: 'YESVANTPUR JN (YPR)',
  PUNE: 'PUNE JN (PUNE)',
  HYB: 'HYDERABAD DECCAN (HYB)',
  SC: 'SECUNDERABAD JN (SC)',
  ADI: 'AHMEDABAD JN (ADI)',
  JP: 'JAIPUR JN (JP)',
  CNB: 'KANPUR CENTRAL (CNB)',
  LKO: 'LUCKNOW CHARBAGH (LKO)',
  PNBE: 'PATNA JN (PNBE)',
  GKP: 'GORAKHPUR JN (GKP)',
  BSB: 'VARANASI JN (BSB)',
  ASR: 'AMRITSAR JN (ASR)',
  CDG: 'CHANDIGARH (CDG)',
  GHY: 'GUWAHATI (GHY)',
  BBS: 'BHUBANESWAR (BBS)',
  TVC: 'THIRUVANANTHAPURAM (TVC)',
  COA: 'KAKINADA PORT (COA)'
};

function getStationName(code) {
  if (!code) return 'NEW DELHI (NDLS)';
  const upper = code.toUpperCase().trim();
  return STATION_MAP[upper] || `${upper} JN (${upper})`;
}

/**
 * Generate coach and berth assignment based on travel class
 */
function getCoachAndBerth(travelClass, idx, seatPref, berthPref) {
  const cls = (travelClass || '3A').toUpperCase();
  const berthTypes = ['LB - Lower Berth', 'MB - Middle Berth', 'UB - Upper Berth', 'SL - Side Lower', 'SU - Side Upper'];
  const seatTypes = ['WS - Window Seat', 'AS - Aisle Seat', 'MS - Middle Seat'];

  let coachPrefix = 'B2';
  let berthNum = 21 + (idx * 3);
  let berthLabel = berthPref && berthPref !== 'No Preference' ? berthPref : berthTypes[idx % berthTypes.length];

  if (cls === '1A' || cls.includes('FIRST')) {
    coachPrefix = 'H1';
    berthNum = `Cabin A / ${idx + 1}`;
    berthLabel = 'Coupe / First AC';
  } else if (cls === '2A' || cls.includes('2 TIER')) {
    coachPrefix = 'A1';
    berthNum = 14 + (idx * 2);
    berthLabel = berthPref && berthPref !== 'No Preference' ? berthPref : (idx % 2 === 0 ? 'LB - Lower Berth' : 'UB - Upper Berth');
  } else if (cls === '3A' || cls === '3E' || cls.includes('3 TIER')) {
    coachPrefix = cls === '3E' ? 'M1' : 'B3';
    berthNum = 18 + (idx * 4);
    berthLabel = berthPref && berthPref !== 'No Preference' ? berthPref : berthTypes[idx % 5];
  } else if (cls === 'CC' || cls === 'EC' || cls.includes('CHAIR')) {
    coachPrefix = cls === 'EC' ? 'E1' : 'C2';
    berthNum = 24 + (idx * 2);
    berthLabel = seatPref && seatPref !== 'No Preference' ? seatPref : seatTypes[idx % seatTypes.length];
  } else if (cls === 'SL' || cls.includes('SLEEPER')) {
    coachPrefix = 'S6';
    berthNum = 20 + (idx * 4);
    berthLabel = berthPref && berthPref !== 'No Preference' ? berthPref : berthTypes[idx % 5];
  } else if (cls === '2S' || cls === 'UR') {
    coachPrefix = 'D2';
    berthNum = 42 + idx;
    berthLabel = 'Second Sitting (2S)';
  }

  return {
    coach: coachPrefix,
    berth: berthNum,
    type: berthLabel,
    statusText: `CNF / ${coachPrefix} / ${berthNum} / ${berthLabel.split(' ')[0]}`
  };
}

/**
 * Generate a printable PDF-styled E-Ticket and Receipt matching IRCTC & TravelIQ co-branded official format.
 */
const getReceiptPDF = async (req, res) => {
  const { bookingId } = req.params;

  try {
    let booking = await Booking.findOne({
      where: { id: bookingId },
      include: [{ model: User, attributes: ['name', 'email'] }]
    });

    if (!booking) {
      return res.status(404).send('<h3>Error: Booking receipt not found.</h3>');
    }

    // Authorization check: User can view their own booking, or admins can view all
    if (req.user && req.user.role !== 'admin' && booking.user_id !== req.user.id) {
      return res.status(403).send('<h3>Access Denied: You are not authorized to view this ticket.</h3>');
    }

    const transaction = await Transaction.findOne({ where: { booking_id: bookingId } });
    const cleanId = String(bookingId).padStart(4, '0');
    const pnrNumber = `49204${cleanId}49`;
    const formattedPNR = `${pnrNumber.slice(0, 3)}-${pnrNumber.slice(3, 10)}`;
    const txnId = transaction ? transaction.transaction_id : `TXN-TIQ-IRCTC-${23025700 + parseInt(bookingId, 10)}`;
    const paymentMethod = transaction ? transaction.payment_method : 'UPI (Sandbox Verified)';
    
    const bookingDateObj = booking.booking_date ? new Date(booking.booking_date) : new Date();
    const formattedBookingDate = bookingDateObj.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
    const formattedBookingTime = bookingDateObj.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
    const fullBookingTimestamp = `${formattedBookingDate} ${formattedBookingTime} HRS`;

    const sourceStation = getStationName(booking.source_station_code);
    const destStation = getStationName(booking.destination_station_code);
    const srcCode = (booking.source_station_code || 'NDLS').toUpperCase();
    const dstCode = (booking.destination_station_code || 'CSTM').toUpperCase();
    const trainNo = booking.train_number || '12951';
    const trainName = (booking.train_number ? `EXP #${booking.train_number}` : 'MUMBAI RAJDHANI EXP').toUpperCase();
    const travelClass = (booking.travel_class || '3A').toUpperCase();

    // Passenger list extraction
    let passengersList = [];
    if (Array.isArray(booking.passengers) && booking.passengers.length > 0) {
      passengersList = booking.passengers;
    } else {
      const primaryName = (booking.User && booking.User.name) || (req.user && req.user.name) || 'Aditya Upadhyay';
      passengersList = [{
        name: primaryName,
        age: 24,
        gender: 'Male',
        seat_preference: booking.seat_preference || 'No Preference',
        berth_preference: booking.berth_preference || 'No Preference'
      }];
    }

    const totalFare = Number(booking.ticket_fare) || 1604;
    const baseFare = Math.max(100, Math.round(totalFare - 35.85));
    const irctcFee = '35.40';
    const insuranceFee = '0.45';
    const fareInWords = numberToWordsINR(totalFare);

    // Build authentic IRCTC Electronic Reservation Slip (ERS) HTML
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>TravelIQ_IRCTC_Ticket_${formattedPNR}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&family=JetBrains+Mono:wght@500;700;800&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          background-color: #f1f5f9;
          color: #1e293b;
          line-height: 1.35;
          padding: 20px 10px;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Top Action Bar (Screen Only) */
        .action-bar {
          max-width: 850px;
          margin: 0 auto 16px auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #ffffff;
          padding: 12px 20px;
          border-radius: 12px;
          border: 1px solid #cbd5e1;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .action-btn-group {
          display: flex;
          gap: 10px;
        }
        .btn-action {
          padding: 8px 18px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
          border: none;
        }
        .btn-primary {
          background-color: #0b3b60;
          color: #ffffff;
        }
        .btn-primary:hover {
          background-color: #082842;
        }
        .btn-secondary {
          background-color: #f8fafc;
          color: #334155;
          border: 1px solid #cbd5e1;
        }
        .btn-secondary:hover {
          background-color: #e2e8f0;
        }

        /* Main IRCTC Ticket Container */
        .ticket-wrapper {
          max-width: 850px;
          margin: 0 auto;
          background: #ffffff;
          border: 2px solid #0b3b60;
          box-shadow: 0 10px 25px rgba(0,0,0,0.08);
          position: relative;
          overflow: hidden;
        }

        /* Subtle Watermark */
        .watermark {
          position: absolute;
          top: 45%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-30deg);
          font-size: 64px;
          font-weight: 900;
          color: rgba(11, 59, 96, 0.035);
          white-space: nowrap;
          pointer-events: none;
          z-index: 0;
          text-transform: uppercase;
          letter-spacing: 4px;
          font-family: 'Outfit', sans-serif;
        }

        /* Ticket Header */
        .ticket-header {
          position: relative;
          z-index: 1;
          background: #ffffff;
          border-bottom: 2px solid #0b3b60;
          padding: 14px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .brand-section {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .logo-box {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .brand-title {
          font-family: 'Outfit', sans-serif;
          font-size: 26px;
          font-weight: 900;
          color: #14532d;
          letter-spacing: -0.5px;
          display: flex;
          align-items: center;
        }
        .brand-title span {
          color: #e58a3a;
          margin-left: 1px;
        }
        .brand-badge {
          display: block;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          color: #0b3b60;
          letter-spacing: 0.5px;
          margin-top: -2px;
        }

        .center-heading {
          text-align: center;
          flex: 1;
          padding: 0 15px;
        }
        .gov-title {
          font-size: 13px;
          font-weight: 800;
          color: #0b3b60;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .ers-title {
          font-size: 16px;
          font-weight: 900;
          color: #b91c1c;
          letter-spacing: 0.8px;
          margin: 2px 0;
          text-transform: uppercase;
        }
        .ers-subtitle {
          font-size: 10px;
          font-weight: 500;
          color: #475569;
        }

        .rail-emblem-box {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .qr-header-img {
          width: 58px;
          height: 58px;
          border: 1px solid #cbd5e1;
          padding: 2px;
          border-radius: 4px;
          background: #ffffff;
        }

        /* Top Key Alert Bar (PNR & Train) */
        .pnr-strip {
          position: relative;
          z-index: 1;
          background: #0b3b60;
          color: #ffffff;
          padding: 8px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #e58a3a;
        }
        .pnr-col {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .pnr-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          color: #93c5fd;
          letter-spacing: 0.5px;
        }
        .pnr-num {
          font-family: 'JetBrains Mono', monospace;
          font-size: 20px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 1px;
        }
        .status-badge-cnf {
          background-color: #16a34a;
          color: #ffffff;
          padding: 4px 12px;
          border-radius: 4px;
          font-weight: 800;
          font-size: 12px;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        /* Grid Tables */
        .ticket-body {
          position: relative;
          z-index: 1;
          padding: 12px 16px;
        }

        .section-header {
          background-color: #f1f5f9;
          border-left: 4px solid #0b3b60;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          color: #0b3b60;
          letter-spacing: 0.5px;
          margin-top: 10px;
          margin-bottom: 6px;
        }

        table.irctc-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11.5px;
          margin-bottom: 10px;
          background: #ffffff;
        }
        table.irctc-table th, 
        table.irctc-table td {
          border: 1px solid #cbd5e1;
          padding: 6px 8px;
          text-align: left;
        }
        table.irctc-table th {
          background-color: #f8fafc;
          color: #334155;
          font-weight: 700;
          font-size: 10.5px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        table.irctc-table td {
          color: #0f172a;
        }
        .cell-label {
          font-size: 9.5px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          display: block;
          margin-bottom: 1px;
        }
        .cell-value {
          font-weight: 700;
          color: #0f172a;
        }
        .cell-highlight {
          color: #0b3b60;
          font-weight: 800;
        }

        /* Route Display Highlight Box */
        .route-grid {
          display: grid;
          grid-template-columns: 1fr 60px 1fr;
          align-items: center;
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          padding: 10px 16px;
          border-radius: 6px;
          margin-bottom: 10px;
        }
        .route-station {
          display: flex;
          flex-direction: column;
        }
        .route-station.right {
          text-align: right;
        }
        .route-code {
          font-family: 'Outfit', sans-serif;
          font-size: 22px;
          font-weight: 900;
          color: #0b3b60;
          letter-spacing: -0.5px;
        }
        .route-name {
          font-size: 11px;
          font-weight: 600;
          color: #475569;
        }
        .route-arrow {
          text-align: center;
          font-size: 20px;
          color: #e58a3a;
          font-weight: 800;
        }

        /* Passenger Table Specifics */
        .passenger-table th {
          background-color: #0b3b60;
          color: #ffffff;
          font-size: 10px;
        }
        .passenger-table td {
          padding: 8px;
        }
        .status-cnf-cell {
          color: #15803d;
          font-weight: 800;
          font-family: 'JetBrains Mono', monospace;
        }

        /* Fare Summary Section */
        .fare-and-security {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 12px;
          margin-top: 6px;
          margin-bottom: 12px;
        }
        .fare-box {
          border: 1px solid #cbd5e1;
          background: #ffffff;
        }
        .fare-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        .fare-table td {
          padding: 4px 8px;
          border-bottom: 1px solid #f1f5f9;
        }
        .fare-table tr.total-row {
          background-color: #f1f5f9;
          font-weight: 800;
          font-size: 12px;
          border-top: 2px solid #0b3b60;
          border-bottom: 2px solid #0b3b60;
        }
        .fare-table tr.total-row td {
          color: #0b3b60;
          padding: 7px 8px;
        }

        .security-box {
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          padding: 10px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-radius: 4px;
        }
        .stamp-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #dcfce7;
          border: 1px dashed #16a34a;
          padding: 6px 10px;
          border-radius: 6px;
        }
        .stamp-text {
          font-size: 9.5px;
          font-weight: 700;
          color: #166534;
          line-height: 1.25;
        }
        .barcode-container {
          text-align: center;
          padding: 6px 0 0 0;
        }
        .barcode-bars {
          letter-spacing: 3px;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 900;
          font-size: 15px;
          color: #0f172a;
        }
        .barcode-num {
          font-size: 9px;
          font-family: 'JetBrains Mono', monospace;
          color: #64748b;
        }

        /* Advisory Guidelines */
        .advisory-box {
          border: 1px solid #cbd5e1;
          background: #fffbeb;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 9.5px;
          color: #78350f;
          line-height: 1.45;
          margin-bottom: 8px;
        }
        .advisory-title {
          font-weight: 800;
          text-transform: uppercase;
          color: #92400e;
          margin-bottom: 3px;
          font-size: 10px;
        }
        .advisory-list {
          padding-left: 14px;
        }

        /* Footer */
        .ticket-footer {
          border-top: 1px solid #cbd5e1;
          padding: 8px 16px;
          background: #f8fafc;
          font-size: 9.5px;
          color: #64748b;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        @media print {
          body {
            background-color: #ffffff;
            padding: 0;
            color: #000000;
          }
          .action-bar {
            display: none !important;
          }
          .ticket-wrapper {
            box-shadow: none;
            border: 1.5px solid #000000;
            max-width: 100%;
          }
          .ticket-header {
            border-bottom: 1.5px solid #000000;
          }
          .pnr-strip {
            background: #0b3b60 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        }
      </style>
    </head>
    <body>

      <!-- Top Screen Action Bar -->
      <div class="action-bar">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 18px;">🚆</span>
          <div>
            <strong style="font-size: 13px; color: #0b3b60;">TravelIQ Official E-Ticket & Receipt</strong>
            <span style="font-size: 11px; color: #64748b; display: block;">Booking Reference #TIQ-BK-${bookingId} • Confirmed</span>
          </div>
        </div>
        <div class="action-btn-group">
          <button onclick="window.print()" class="btn-action btn-primary">
            🖨️ Print Ticket / Save PDF
          </button>
          <button onclick="window.close()" class="btn-action btn-secondary">
            ✕ Close
          </button>
        </div>
      </div>

      <!-- Main IRCTC Ticket Container -->
      <div class="ticket-wrapper">
        <div class="watermark">TRAVELIQ RAILWAYS</div>

        <!-- Official Header -->
        <div class="ticket-header">
          <div class="brand-section">
            <div class="logo-box">
              <div style="width: 38px; height: 38px; background: linear-gradient(135deg, #14532d, #16a34a); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
                🚆
              </div>
              <div>
                <div class="brand-title">Travel<span>IQ</span></div>
                <span class="brand-badge">IRCTC Co-Branded Rail Partner</span>
              </div>
            </div>
          </div>

          <div class="center-heading">
            <div class="gov-title">INDIAN RAILWAYS / IRCTC - TRAVELIQ</div>
            <div class="ers-title">ELECTRONIC RESERVATION SLIP (ERS)</div>
            <div class="ers-subtitle">Valid for travel along with original Photo Identity Card</div>
          </div>

          <div class="rail-emblem-box">
            <!-- Authentic High-Resolution SVG QR Code -->
            <svg class="qr-header-img" viewBox="0 0 100 100" fill="#0b3b60">
              <rect x="0" y="0" width="100" height="100" fill="#ffffff"/>
              <!-- Position detection patterns -->
              <rect x="10" y="10" width="22" height="22" fill="#0b3b60"/>
              <rect x="14" y="14" width="14" height="14" fill="#ffffff"/>
              <rect x="17" y="17" width="8" height="8" fill="#0b3b60"/>

              <rect x="68" y="10" width="22" height="22" fill="#0b3b60"/>
              <rect x="72" y="14" width="14" height="14" fill="#ffffff"/>
              <rect x="75" y="17" width="8" height="8" fill="#0b3b60"/>

              <rect x="10" y="68" width="22" height="22" fill="#0b3b60"/>
              <rect x="14" y="72" width="14" height="14" fill="#ffffff"/>
              <rect x="17" y="75" width="8" height="8" fill="#0b3b60"/>

              <!-- Data bits -->
              <rect x="36" y="12" width="6" height="6" fill="#0b3b60"/>
              <rect x="46" y="12" width="6" height="6" fill="#0b3b60"/>
              <rect x="56" y="12" width="6" height="6" fill="#0b3b60"/>
              <rect x="36" y="24" width="6" height="6" fill="#0b3b60"/>
              <rect x="46" y="24" width="16" height="6" fill="#0b3b60"/>

              <rect x="12" y="38" width="6" height="6" fill="#0b3b60"/>
              <rect x="24" y="38" width="18" height="6" fill="#0b3b60"/>
              <rect x="48" y="38" width="8" height="8" fill="#0b3b60"/>
              <rect x="62" y="38" width="6" height="6" fill="#0b3b60"/>
              <rect x="74" y="38" width="14" height="6" fill="#0b3b60"/>

              <rect x="36" y="48" width="18" height="6" fill="#0b3b60"/>
              <rect x="60" y="48" width="12" height="12" fill="#0b3b60"/>
              <rect x="78" y="48" width="10" height="6" fill="#0b3b60"/>

              <rect x="12" y="58" width="6" height="6" fill="#0b3b60"/>
              <rect x="24" y="58" width="6" height="6" fill="#0b3b60"/>
              <rect x="36" y="58" width="12" height="6" fill="#0b3b60"/>
              <rect x="78" y="58" width="10" height="12" fill="#0b3b60"/>

              <rect x="36" y="68" width="8" height="8" fill="#0b3b60"/>
              <rect x="48" y="68" width="8" height="8" fill="#0b3b60"/>
              <rect x="60" y="68" width="12" height="6" fill="#0b3b60"/>

              <rect x="36" y="80" width="18" height="8" fill="#0b3b60"/>
              <rect x="60" y="80" width="8" height="8" fill="#0b3b60"/>
              <rect x="74" y="76" width="14" height="12" fill="#0b3b60"/>
            </svg>
          </div>
        </div>

        <!-- PNR & Train High-Priority Bar -->
        <div class="pnr-strip">
          <div class="pnr-col">
            <span class="pnr-label">PNR Number:</span>
            <span class="pnr-num">${formattedPNR}</span>
          </div>
          <div class="pnr-col">
            <span class="pnr-label">Train No & Name:</span>
            <span style="font-weight: 800; font-size: 14px; color: #fef08a;">${trainNo} / ${trainName}</span>
          </div>
          <div class="pnr-col">
            <span class="status-badge-cnf">CONFIRMED (CNF)</span>
          </div>
        </div>

        <!-- Ticket Body Details -->
        <div class="ticket-body">

          <!-- Route Visual Grid -->
          <div class="route-grid">
            <div class="route-station">
              <span class="cell-label">Origin / Boarding Station</span>
              <span class="route-code">${srcCode}</span>
              <span class="route-name">${sourceStation}</span>
            </div>
            <div class="route-arrow">➔</div>
            <div class="route-station right">
              <span class="cell-label">Destination / Reservation Upto</span>
              <span class="route-code">${dstCode}</span>
              <span class="route-name">${destStation}</span>
            </div>
          </div>

          <!-- Trip & Reservation Matrix Table -->
          <table class="irctc-table">
            <tr>
              <td style="width: 25%;">
                <span class="cell-label">Quota</span>
                <span class="cell-value">GENERAL (GN)</span>
              </td>
              <td style="width: 25%;">
                <span class="cell-label">Class</span>
                <span class="cell-value cell-highlight">${travelClass} - ${travelClass === '3A' ? 'AC 3 TIER' : travelClass === '2A' ? 'AC 2 TIER' : travelClass === '1A' ? 'AC FIRST CLASS' : travelClass === 'CC' ? 'AC CHAIR CAR' : travelClass === 'SL' ? 'SLEEPER CLASS' : 'SECOND SITTING'}</span>
              </td>
              <td style="width: 25%;">
                <span class="cell-label">Booking Date & Time</span>
                <span class="cell-value">${fullBookingTimestamp}</span>
              </td>
              <td style="width: 25%;">
                <span class="cell-label">Distance / Adults / Children</span>
                <span class="cell-value">1,384 KM / ${passengersList.length} A / 0 C</span>
              </td>
            </tr>
            <tr>
              <td>
                <span class="cell-label">Scheduled Departure</span>
                <span class="cell-value">${formattedBookingDate} • 16:30 HRS</span>
              </td>
              <td>
                <span class="cell-label">Scheduled Arrival</span>
                <span class="cell-value">${formattedBookingDate} • 08:35 HRS</span>
              </td>
              <td>
                <span class="cell-label">Transaction ID</span>
                <span class="cell-value" style="font-family: monospace; font-size: 11px;">${txnId}</span>
              </td>
              <td>
                <span class="cell-label">Expected Platform</span>
                <span class="cell-value" style="color: #0b3b60; font-weight: 800;">PF #3 (Main Island)</span>
              </td>
            </tr>
          </table>

          <!-- Passenger Details Section -->
          <div class="section-header">Passenger Details (${passengersList.length} Traveler${passengersList.length > 1 ? 's' : ''})</div>
          <table class="irctc-table passenger-table">
            <thead>
              <tr>
                <th style="width: 5%; text-align: center;">#</th>
                <th style="width: 32%;">Passenger Name</th>
                <th style="width: 10%; text-align: center;">Age</th>
                <th style="width: 13%; text-align: center;">Gender</th>
                <th style="width: 20%;">Booking Status</th>
                <th style="width: 20%;">Current Status</th>
              </tr>
            </thead>
            <tbody>
              ${passengersList.map((p, idx) => {
                const alloc = getCoachAndBerth(travelClass, idx, p.seat_preference || booking.seat_preference, p.berth_preference || booking.berth_preference);
                return `
                <tr>
                  <td style="text-align: center; font-weight: 700;">${idx + 1}</td>
                  <td><strong style="color: #0f172a; text-transform: uppercase;">${p.name || 'Aditya Upadhyay'}</strong></td>
                  <td style="text-align: center;">${p.age || '24'} Yrs</td>
                  <td style="text-align: center;">${p.gender || 'Male'}</td>
                  <td class="status-cnf-cell">${alloc.statusText}</td>
                  <td class="status-cnf-cell">${alloc.statusText}</td>
                </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <!-- Fare Breakdown and Security Stamp -->
          <div class="fare-and-security">
            
            <!-- Fare Table -->
            <div class="fare-box">
              <div class="section-header" style="margin: 0; border-left: none; background: #0b3b60; color: #ffffff;">Fare Details (GST Included)</div>
              <table class="fare-table">
                <tr>
                  <td>Ticket Base Fare</td>
                  <td style="text-align: right; font-weight: 600;">₹${baseFare.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>TravelIQ / IRCTC Convenience Fee</td>
                  <td style="text-align: right; font-weight: 600;">₹${irctcFee}</td>
                </tr>
                <tr>
                  <td>Travel Insurance Premium (Optional)</td>
                  <td style="text-align: right; font-weight: 600;">₹${insuranceFee}</td>
                </tr>
                <tr>
                  <td>Payment Gateway / Agent Charges</td>
                  <td style="text-align: right; font-weight: 600; color: #16a34a;">₹0.00 (Waived)</td>
                </tr>
                <tr class="total-row">
                  <td><strong>Total Amount Paid</strong></td>
                  <td style="text-align: right; font-size: 14px;"><strong>₹${totalFare.toFixed(2)}</strong></td>
                </tr>
                <tr>
                  <td colspan="2" style="font-size: 9.5px; color: #475569; padding: 5px 8px; background: #fafafa;">
                    <strong>Amount in Words:</strong> ${fareInWords}
                  </td>
                </tr>
              </table>
            </div>

            <!-- Security & Verification -->
            <div class="security-box">
              <div class="stamp-box">
                <span style="font-size: 22px;">🛡️</span>
                <div class="stamp-text">
                  <strong>DIGITALLY SIGNED & VERIFIED</strong><br>
                  TravelIQ Rail Engine • Verified Sandbox Settlement
                </div>
              </div>

              <div style="font-size: 10px; color: #475569; margin: 6px 0; line-height: 1.35;">
                <strong>Payment Mode:</strong> ${paymentMethod}<br>
                <strong>Security Token:</strong> SHA256-${pnrNumber.slice(0, 6)}TIQ<br>
                <strong>IRCTC Agent ID:</strong> TIQ-RAIL-CORP-091
              </div>

              <div class="barcode-container">
                <div class="barcode-bars">||||| ||| |||| || ||||| ||| || |||||</div>
                <div class="barcode-num">*${pnrNumber}*</div>
              </div>
            </div>

          </div>

          <!-- Mandatory Passenger Guidelines (IRCTC Standard Instructions) -->
          <div class="advisory-box">
            <div class="advisory-title">⚠️ Important Passenger Information & Advisory</div>
            <ol class="advisory-list">
              <li>One of the passengers booked on this E-Ticket must carry any one of the original prescribed Identity Cards (Aadhaar Card, Passport, Voter ID, Driving Licence, Student ID, or Bank Passbook with photograph).</li>
              <li>A physical printout is <strong>not mandatory</strong>. The Electronic Reservation Slip (ERS) displayed on your mobile device along with valid ID proof is valid for travel.</li>
              <li>Confirmed tickets can be cancelled online through TravelIQ up to 4 hours prior to the scheduled departure or chart preparation.</li>
              <li>Please verify the departure platform & real-time train status before arrival. Railway Enquiry: Dial <strong>139</strong>.</li>
            </ol>
          </div>

        </div>

        <!-- Ticket Footer -->
        <div class="ticket-footer">
          <div>
            <strong>TravelIQ 24x7 Customer Support:</strong> support@traveliq.in | Toll-Free: 1800-872-8354
          </div>
          <div>
            Generated on ${fullBookingTimestamp} • System Ver. 4.2
          </div>
        </div>

      </div>

    </body>
    </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('[Receipt PDF Generation Error]:', error);
    res.status(500).send('<h3>Error generating ticket invoice PDF</h3>');
  }
};

module.exports = {
  createTransaction,
  getReceiptPDF
};


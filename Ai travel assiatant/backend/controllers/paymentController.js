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

/**
 * Generate a printable PDF-styled E-Ticket and Receipt.
 */
const getReceiptPDF = async (req, res) => {
  const { bookingId } = req.params;

  try {
    const booking = await Booking.findOne({
      where: { id: bookingId, user_id: req.user.id },
      include: [{ model: User, attributes: ['name', 'email'] }]
    });

    if (!booking) {
      return res.status(404).send('<h3>Error: Booking receipt not found or unauthorized.</h3>');
    }

    const transaction = await Transaction.findOne({ where: { booking_id: bookingId } });
    const txnId = transaction ? transaction.transaction_id : `MOCK-TXN-${100000 + Math.floor(Math.random() * 900000)}`;
    const paymentMethod = transaction ? transaction.payment_method : 'UPI (Demo)';
    const bookingTimestamp = booking.booking_date ? new Date(booking.booking_date).toLocaleString() : new Date().toLocaleString();

    // Render a high-fidelity print template matching TravelIQ colors
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>TravelIQ_Ticket_Receipt_${bookingId}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        body {
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #0b0f19;
          color: #f8fafc;
        }
        .ticket-box {
          max-width: 750px;
          margin: 0 auto;
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          position: relative;
          overflow: hidden;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 20px;
          margin-bottom: 25px;
        }
        .logo {
          font-size: 24px;
          font-weight: 800;
          color: #3b82f6;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .logo span {
          color: #00f2fe;
        }
        .badge {
          background-color: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .pnr-box {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          margin-bottom: 25px;
        }
        .pnr-item {
          display: flex;
          flex-direction: column;
        }
        .pnr-label {
          font-size: 10px;
          color: #94a3b8;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 1px;
        }
        .pnr-value {
          font-size: 16px;
          font-weight: 800;
          color: #ffffff;
          margin-top: 4px;
          font-family: monospace;
        }
        .route-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding: 10px 0;
        }
        .station {
          flex: 1;
        }
        .station.right {
          text-align: right;
        }
        .station-code {
          font-size: 32px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.5px;
        }
        .station-name {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 2px;
        }
        .connector {
          flex: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          padding: 0 20px;
        }
        .connector-line {
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, #3b82f6, #00f2fe);
          position: relative;
        }
        .connector-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #00f2fe;
          position: absolute;
          top: -3px;
        }
        .train-badge {
          margin-top: 10px;
          font-size: 11px;
          font-weight: 700;
          color: #00f2fe;
          background: rgba(0, 242, 254, 0.1);
          padding: 4px 10px;
          border-radius: 20px;
        }
        .details-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 30px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 20px 0;
        }
        .detail-item {
          display: flex;
          flex-direction: column;
        }
        .detail-label {
          font-size: 9px;
          color: #94a3b8;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .detail-val {
          font-size: 13px;
          font-weight: 600;
          color: #f1f5f9;
          margin-top: 3px;
        }
        .passengers-section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 12px;
          color: #94a3b8;
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 12px;
          letter-spacing: 0.5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th {
          text-align: left;
          font-size: 10px;
          text-transform: uppercase;
          color: #64748b;
          padding: 8px 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        td {
          font-size: 12px;
          color: #e2e8f0;
          padding: 10px 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        }
        .footer {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: #64748b;
        }
        .barcode {
          font-family: monospace;
          background: #ffffff;
          color: #000000;
          padding: 4px 10px;
          letter-spacing: 4px;
          font-size: 12px;
          border-radius: 4px;
        }
        @media print {
          body {
            background-color: #ffffff;
            color: #000000;
          }
          .ticket-box {
            box-shadow: none;
            border: 1px solid #e2e8f0;
            background: #ffffff;
            color: #000000;
          }
          .station-code, .logo, .pnr-value, td, th {
            color: #000000;
          }
        }
      </style>
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </head>
    <body>
      <div class="ticket-box">
        <div class="header">
          <div class="logo">🚄 Travel<span>IQ</span></div>
          <div class="badge">Demo E-Ticket Confirmed</div>
        </div>

        <div class="pnr-box">
          <div class="pnr-item">
            <span class="pnr-label">PNR Number</span>
            <span class="pnr-value">49204${bookingId}49</span>
          </div>
          <div class="pnr-item">
            <span class="pnr-label">Transaction ID</span>
            <span class="pnr-value">${txnId}</span>
          </div>
          <div class="pnr-item" style="text-align: right;">
            <span class="pnr-label">Booking ID</span>
            <span class="pnr-value">#TIQ-BK-${bookingId}</span>
          </div>
        </div>

        <div class="route-info">
          <div class="station">
            <div class="station-code">${booking.source_station_code}</div>
            <div class="station-name">Origin Station</div>
          </div>
          <div class="connector">
            <div class="connector-line">
              <div class="connector-dot" style="left: 0;"></div>
              <div class="connector-dot" style="right: 0;"></div>
            </div>
            <div class="train-badge">Train #${booking.train_number || '12012'}</div>
          </div>
          <div class="station right">
            <div class="station-code">${booking.destination_station_code}</div>
            <div class="station-name">Destination Station</div>
          </div>
        </div>

        <div class="details-grid">
          <div class="detail-item">
            <span class="detail-label">Journey Date</span>
            <span class="detail-val">${bookingTimestamp.split(',')[0]}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Class Category</span>
            <span class="detail-val">${booking.travel_class || 'SL'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Total Paid Fare</span>
            <span class="detail-val" style="color: #10b981; font-weight: 700;">₹${booking.ticket_fare || 1000}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Berth Pref.</span>
            <span class="detail-val">${booking.berth_preference || 'No Preference'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Seat Pref.</span>
            <span class="detail-val">${booking.seat_preference || 'No Preference'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Payment Mode</span>
            <span class="detail-val">${paymentMethod}</span>
          </div>
        </div>

        <div class="passengers-section">
          <div class="section-title">Passenger List</div>
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Passenger Name</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${(booking.passengers || [{ name: req.user.name, age: '25', gender: 'Male' }]).map((p, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${p.name || 'Aditya upadhaya'}</strong></td>
                  <td>${p.age || '19'}</td>
                  <td>${p.gender || 'Male'}</td>
                  <td style="color: #10b981; font-weight: bold;">CNF / S6 / Seat ${20 + idx}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <div>Generated on ${new Date().toLocaleString()} (TravelIQ Secure System)</div>
          <div class="barcode">||| | | || ||| || ||| |</div>
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

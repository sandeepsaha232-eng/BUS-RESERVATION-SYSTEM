// utils/emailService.js - Email Notification Service
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Sends a booking confirmation email to the passenger.
 * @param {object} reservationData Details of the booking
 */
async function sendBookingConfirmationEmail(reservationData) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('⚠️ Email credentials not configured. Skipping email send.');
    return;
  }

  const {
    reservationId,
    passengerName,
    passengerEmail,
    seatNumber,
    totalFare,
    startCity,
    endCity,
    departureTime,
    arrivalTime,
    busNumber
  } = reservationData;

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formattedFare = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(totalFare);

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #7c3aed, #0ea5e9); padding: 30px; text-align: center; color: white;">
        <span style="font-size: 40px; display: block; margin-bottom: 10px;">🚌</span>
        <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">Booking Confirmed!</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Thank you for riding with BusReserve</p>
      </div>
      
      <div style="padding: 30px; background-color: #ffffff; color: #334155; line-height: 1.6;">
        <h3 style="margin-top: 0; color: #1e1b4b; font-size: 18px;">Hello ${passengerName},</h3>
        <p style="font-size: 15px;">Your seat has been successfully reserved! Here are your ticket and itinerary details:</p>
        
        <!-- Ticket Summary Card -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Booking ID</td>
              <td style="padding: 6px 0; text-align: right; color: #7c3aed; font-weight: 700;">#${reservationId}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Route</td>
              <td style="padding: 6px 0; text-align: right; color: #1e1b4b; font-weight: 600;">${startCity} → ${endCity}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Bus Number</td>
              <td style="padding: 6px 0; text-align: right; color: #334155;">${busNumber}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Seat Number</td>
              <td style="padding: 6px 0; text-align: right; color: #334155; font-weight: 600;">Seat #${seatNumber}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Departure</td>
              <td style="padding: 6px 0; text-align: right; color: #334155;">${formatDate(departureTime)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Arrival (Est)</td>
              <td style="padding: 6px 0; text-align: right; color: #334155;">${formatDate(arrivalTime)}</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="padding: 12px 0 0 0; color: #1e1b4b; font-weight: 700; font-size: 16px;">Total Paid</td>
              <td style="padding: 12px 0 0 0; text-align: right; color: #0ea5e9; font-weight: 700; font-size: 18px;">${formattedFare}</td>
            </tr>
          </table>
        </div>
        
        <p style="font-size: 14px; color: #64748b; margin-bottom: 0;">Please present a copy of this email or your Booking ID at boarding. Wish you a safe and comfortable journey!</p>
      </div>
      
      <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0;">© 2026 BusReserve Inc. All rights reserved.</p>
        <p style="margin: 5px 0 0 0;">Need help? Contact support at support@busreserve.com</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"BusReserve" <${process.env.EMAIL_USER}>`,
    to: passengerEmail,
    subject: `Ticket Confirmed! Booking #${reservationId} - ${startCity} to ${endCity}`,
    html: htmlContent
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Confirmation email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send confirmation email:', error);
    return false;
  }
}

module.exports = {
  sendBookingConfirmationEmail
};

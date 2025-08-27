import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { format } from 'date-fns';
import type { Booking, Flight, User } from '../../shared/schema';

export interface ETicketData {
  booking: Booking;
  flight: Flight;
  user: User;
}

export class ETicketService {
  static async generateETicket(data: ETicketData): Promise<Buffer> {
    const { booking, flight, user } = data;
    
    // Create new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Colors
    const primaryColor = '#1E40AF'; // Blue
    const secondaryColor = '#3B82F6'; // Light blue
    const darkColor = '#1F2937'; // Dark gray
    const lightColor = '#F3F4F6'; // Light gray

    // Header background
    doc.setFillColor(30, 64, 175); // Primary blue
    doc.rect(0, 0, 210, 40, 'F');

    // White header text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('✈️ E-TICKET', 15, 20);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Electronic Flight Ticket', 15, 30);

    // Booking reference in header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const refWidth = doc.getTextWidth(`REF: ${booking.bookingReference}`);
    doc.text(`REF: ${booking.bookingReference}`, 210 - refWidth - 15, 25);

    // Reset text color
    doc.setTextColor(31, 41, 55);

    // Passenger Information Section
    let yPos = 60;
    
    // Section header
    doc.setFillColor(59, 130, 246);
    doc.rect(15, yPos - 5, 180, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PASSENGER INFORMATION', 20, yPos);

    yPos += 15;
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    // Passenger details in two columns
    const leftCol = 20;
    const rightCol = 120;

    doc.setFont('helvetica', 'bold');
    doc.text('Name:', leftCol, yPos);
    doc.text('Age:', rightCol, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.text(booking.passengerName, leftCol + 25, yPos);
    doc.text(booking.passengerAge.toString(), rightCol + 20, yPos);

    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Email:', leftCol, yPos);
    doc.text('Passport:', rightCol, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.text(user.email, leftCol + 25, yPos);
    doc.text(booking.passportNumber, rightCol + 25, yPos);

    // Flight Information Section
    yPos += 25;
    
    // Section header
    doc.setFillColor(59, 130, 246);
    doc.rect(15, yPos - 5, 180, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('FLIGHT INFORMATION', 20, yPos);

    yPos += 15;
    doc.setTextColor(31, 41, 55);

    // Flight number and airline
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`${flight.flightNumber} - ${flight.airlineName}`, leftCol, yPos);

    yPos += 15;
    
    // Route visualization
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(flight.departureCity, leftCol, yPos);
    doc.text('✈️', leftCol + 60, yPos);
    doc.text(flight.arrivalCity, leftCol + 80, yPos);

    // Departure and arrival times
    yPos += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const depTime = new Date(flight.departureTime);
    const arrTime = new Date(flight.arrivalTime);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Departure:', leftCol, yPos);
    doc.text('Arrival:', rightCol, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.text(format(depTime, 'MMM dd, yyyy'), leftCol, yPos + 8);
    doc.text(format(depTime, 'HH:mm'), leftCol, yPos + 16);
    
    doc.text(format(arrTime, 'MMM dd, yyyy'), rightCol, yPos + 8);
    doc.text(format(arrTime, 'HH:mm'), rightCol, yPos + 16);

    // Booking Details Section
    yPos += 35;
    
    // Section header
    doc.setFillColor(59, 130, 246);
    doc.rect(15, yPos - 5, 180, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('BOOKING DETAILS', 20, yPos);

    yPos += 15;
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(10);

    // Booking details
    doc.setFont('helvetica', 'bold');
    doc.text('Seat Number:', leftCol, yPos);
    doc.text('Total Price:', rightCol, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.text(booking.seatNumber || 'TBA', leftCol + 35, yPos);
    doc.text(`$${booking.totalPrice}`, rightCol + 35, yPos);

    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Status:', leftCol, yPos);
    doc.text('Booked:', rightCol, yPos);
    
    doc.setFont('helvetica', 'normal');
    doc.text(booking.status.toUpperCase(), leftCol + 35, yPos);
    doc.text(format(new Date(booking.createdAt), 'MMM dd, yyyy HH:mm'), rightCol + 35, yPos);

    // Generate QR Code
    const qrData = `Flight: ${flight.flightNumber}\nPassenger: ${booking.passengerName}\nBooking: ${booking.bookingReference}\nSeat: ${booking.seatNumber || 'TBA'}`;
    const qrCodeUrl = await QRCode.toDataURL(qrData, {
      width: 200,
      margin: 2,
      color: {
        dark: '#1E40AF',
        light: '#FFFFFF'
      }
    });

    // Add QR code
    yPos += 25;
    doc.addImage(qrCodeUrl, 'PNG', 15, yPos, 40, 40);

    // QR code description
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Scan QR code for quick', 60, yPos + 15);
    doc.text('check-in at the airport', 60, yPos + 22);

    // Important Information Section
    yPos += 55;
    
    // Section header
    doc.setFillColor(239, 68, 68); // Red background for important info
    doc.rect(15, yPos - 5, 180, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('IMPORTANT INFORMATION', 20, yPos);

    yPos += 10;
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    const importantInfo = [
      '• Please arrive at the airport at least 2 hours before domestic flights',
      '• Carry valid photo identification and passport for international flights',
      '• Check-in online 24 hours before departure for faster processing',
      '• Baggage allowance: 20kg checked, 7kg carry-on',
      '• Contact airline for any changes or cancellations'
    ];

    importantInfo.forEach(info => {
      doc.text(info, 20, yPos);
      yPos += 6;
    });

    // Footer
    yPos = 280;
    doc.setFillColor(243, 244, 246);
    doc.rect(0, yPos, 210, 17, 'F');
    
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for choosing our flight booking service!', 15, yPos + 8);
    doc.text(`Generated on ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 15, yPos + 14);
    
    const supportText = 'Support: support@flightbooking.com | +1-800-FLY-BOOK';
    const supportWidth = doc.getTextWidth(supportText);
    doc.text(supportText, 210 - supportWidth - 15, yPos + 11);

    return Buffer.from(doc.output('arraybuffer'));
  }

  static async generateAndSaveETicket(data: ETicketData): Promise<{ success: boolean; fileName?: string; error?: string }> {
    try {
      const pdfBuffer = await this.generateETicket(data);
      const fileName = `eticket-${data.booking.bookingReference}.pdf`;
      
      // In a real application, you would save this to a file system or cloud storage
      // For now, we'll return the buffer info
      
      console.log(`✈️ E-ticket generated successfully: ${fileName}`);
      console.log(`📄 PDF size: ${pdfBuffer.length} bytes`);
      
      return {
        success: true,
        fileName
      };
    } catch (error) {
      console.error('❌ Error generating e-ticket:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
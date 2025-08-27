import { randomBytes } from "crypto";

export const generateBookingReference = (): string => {
  const prefix = "FB2025";
  const timestamp = Date.now().toString().slice(-6);
  const random = randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

export const generateSeatNumber = (): string => {
  const rows = Math.floor(Math.random() * 30) + 1;
  const seats = ['A', 'B', 'C', 'D', 'E', 'F'];
  const seatLetter = seats[Math.floor(Math.random() * seats.length)];
  return `${rows}${seatLetter}`;
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

export const formatPrice = (price: string | number): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(numPrice);
};

export const validateUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const sanitizeSearchTerm = (term: string): string => {
  return term.trim().replace(/[^\w\s-]/g, '');
};

export const calculateLayoverTime = (arrivalTime: Date, departureTime: Date): number => {
  return (departureTime.getTime() - arrivalTime.getTime()) / (1000 * 60); // minutes
};

export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const formatDateForDisplay = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatTimeForDisplay = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

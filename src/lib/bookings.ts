import { BOOKINGS, type Booking } from "./mock-data";
export type { Booking } from "./mock-data";

const STORAGE_KEY = "legalconsultancy.bookings";

export function getStoredBookings(): Booking[] {
  if (typeof window === "undefined") {
    return BOOKINGS;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(BOOKINGS));
      return BOOKINGS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Failed to load bookings from storage:", err);
    return BOOKINGS;
  }
}

export function saveBookings(bookings: Booking[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  } catch (err) {
    console.error("Failed to save bookings to storage:", err);
  }
}

export function addStoredBooking(booking: Booking): Booking {
  const current = getStoredBookings();
  const updated = [booking, ...current];
  saveBookings(updated);
  return booking;
}

export function updateStoredBookingStatus(
  id: string,
  status: "Confirmed" | "Pending" | "Completed" | "Cancelled"
): void {
  const current = getStoredBookings();
  const updated = current.map((b) => (b.id === id ? { ...b, status } : b));
  saveBookings(updated);
}

export function getLawyerBookingsFromStorage(lawyerIdOrName?: string): Booking[] {
  const all = getStoredBookings();
  if (!lawyerIdOrName) return all;
  const search = lawyerIdOrName.toLowerCase();
  return all.filter((b) => {
    if (b.lawyerId && b.lawyerId.toLowerCase() === search) return true;
    if (b.lawyerId && (b.lawyerId === "lw-1" || b.lawyerId === "lw-pending-1")) {
      // Default fallback for demo accounts
    }
    return true; // Return all or filtered
  });
}

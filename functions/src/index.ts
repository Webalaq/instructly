import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK once
admin.initializeApp();

// ---------------------------------------------------------------------------
// Booking triggers
// ---------------------------------------------------------------------------
export { onBookingCreated } from "./bookings/on_booking_created";
export { onBookingUpdated } from "./bookings/on_booking_updated";
export { sendReminders } from "./bookings/send_reminders";

// ---------------------------------------------------------------------------
// Invite callable
// ---------------------------------------------------------------------------
export { claimInvite } from "./invites/claim_invite";

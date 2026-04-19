Product Documentation
Driving Instructor Operating System (DIOS)

1. 🧭 Product Overview

Product Name: Instructly
Type: Mobile App (iOS + Android) + Admin Web Panel
Target Users:

Independent Driving Instructors (Primary)
Driving Schools (Secondary)
Students (End users)

Goal:
Provide a complete system for instructors to manage:

Students
Bookings
Progress tracking
Communication
Business operations
No payment for students and even they will not pay instructors through this app

2. 🎯 Core Value Proposition

Replace multiple tools (calendar, WhatsApp, notes, payments tracking) with one unified system.

3. 👥 User Roles
   3.1 Instructor
   Main user
   Pays subscription
   Full control over students, bookings, progress
   3.2 Student
   Books lessons
   Tracks progress
   Communicates with instructor
   3.3 Admin (Internal)
   Manages platform
   Handles subscriptions
   Controls pricing tiers
4. 🔑 Core Modules
   4.1 🔐 Authentication & Onboarding

Instructor
Register (email, phone)
Upload:
Driving license / certification (optional verification later)
Set:
Availability
Teaching areas (location radius)
Test Center Instructor preferred

Student
Register via:
Phone/email
Join instructor via:
Invite link / code

4.2 👨‍🎓 Student Management (CRM)

Instructor can:

Add student manually
View student profile:
Name, contact
Lesson history
Progress
Status:
Active / Inactive / Passed
4.3 📅 Smart Booking System
Features:
Calendar (daily/weekly view)
Lesson duration:
1 hour / 2 hours / custom
Booking Modes:
Instructor-controlled booking
Student self-booking (if enabled)
Advanced:
Recurring slots
Buffer time between lessons
Travel time consideration
Availability rules

4.4 🔔 Notifications System
In-App:
Booking confirmation
Reminder (24h and 2h before)

External:
WhatsApp integration via WhatsApp Business
Only critical alerts:
Booking confirmed
Cancellation
Schedule changes

4.5 💬 Communication Module
1-to-1 chat (Instructor ↔ Student)
Predefined templates:
“Next lesson reminder”
“You passed!”
File sharing:
PDFs / images / video links

4.6 📈 Student Progress Tracking (USP Module)

Aligned with Driver and Vehicle Standards Agency standards.

Skills Tracking:
Manoeuvres:
Parallel parking
Bay parking
Emergency stop
Road skills:
Junctions
Roundabouts
Speed control
Features:
Rating system (1–5)
Instructor notes per lesson
Weak area detection
“Test Ready” indicator

4.7 🧪 Mock Test System
Instructor schedules mock test
Evaluation:
Pass / Fail
Fault tracking (minor/major)
Report shared with student

4.8 🎥 Learning Resources
Instructor uploads:
Video links (YouTube/private)

Categorised lessons:
Parking
Roundabouts
Accessible anytime by students

4.9 💼 Subscription System (Core Business Model)
Model:
Monthly subscription (Instructor only)
Flexible Pricing Strategy:
£5 → Basic
£20 → Premium

Custom pricing per instructor (intro offers, scaling)
Managed via:
Stripe
Plans Example:
Basic (£5)
Limited students
Basic booking
No WhatsApp alerts
Pro (£10–£15)
Unlimited students
Progress tracking
Messaging
Premium (£20+)
WhatsApp integration
Analytics
Mock tests
Priority support

4.10 📊 Instructor Dashboard (Analytics)

Total lessons
Student pass rate
Cancellation stats
Popular time slots

4.11 🗺️ Location & Route Support (Phase 2)

Integration with Google Maps

Lesson start/end location
Save routes
Practice zones
4.12 🧾 Notes & Lesson Logs

After each lesson:

Instructor writes notes
Student can view:
What was covered
What to improve
4.13 🏫 Multi-Instructor Mode (Driving Schools)
Admin dashboard
Assign students to instructors
Shared calendar
Revenue tracking
4.14 ⚙️ Admin Panel (Web)
Manage users
Manage subscriptions
Monitor activity
Handle disputes 5. 🔄 Key User Flows
Flow 1: Student Booking
Student selects instructor
Views available slots
Books lesson
Gets confirmation
Reminder sent
Flow 2: Lesson Completion
Lesson ends
Instructor logs:
Skills covered
Notes
Student views progress update
Flow 3: Subscription
Instructor signs up
Chooses plan
Pays via Stripe
Gains feature access 6. 🔐 Security & Compliance
GDPR compliant
Secure authentication (JWT/OAuth)
Data encryption
Role-based access 7. 📱 Tech Architecture (Suggested)
Frontend:
Mobile: React Native / Flutter
Web Admin: Next.js
Backend:
Node.js (NestJS recommended)
PostgreSQL
Integrations:
Payments: Stripe
Messaging: WhatsApp API
Maps: Google Maps 8. 🚀 MVP Scope (What to Build First)
MUST HAVE:
Auth (Instructor + Student)
Student management
Booking system
Notes per lesson
Basic progress tracking
Subscription system
NICE TO HAVE:
Messaging
Analytics
Mock tests
LATER:
WhatsApp integration
Route tracking
Multi-instructor system 9. 💡 Future Expansion
Marketplace (students find instructors)
AI lesson feedback
Auto skill recommendations
Theory test preparation

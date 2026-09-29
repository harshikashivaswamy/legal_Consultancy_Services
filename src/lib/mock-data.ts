export type Lawyer = {
  id: string;
  name: string;
  photo: string;
  specialization: string;
  extraSpecializations: string[];
  city: string;
  languages: string[];
  experience: number;
  fee: number;
  rating: number;
  reviews: number;
  verified: boolean;
  availableToday: boolean;
  bio: string;
  court: string;
  cases: number;
  barNumber?: string;
};

export const LEGAL_CATEGORIES = [
  "Criminal Law",
  "Family & Divorce",
  "Property & Real Estate",
  "Corporate & Startup",
  "Cyber Crime",
  "Consumer Protection",
  "Employment & Labour",
  "Taxation & GST",
  "Intellectual Property",
  "Immigration",
  "Banking & Finance",
  "Civil Disputes",
];

export const CITIES = [
  "New Delhi",
  "Mumbai",
  "Bengaluru",
  "Hyderabad",
  "Chennai",
  "Pune",
  "Kolkata",
  "Ahmedabad",
];

export const LANGUAGES = [
  "English",
  "Hindi",
  "Marathi",
  "Tamil",
  "Telugu",
  "Bengali",
  "Kannada",
  "Gujarati",
];

const NAMES = [
  "Adv. Ananya Iyer",
  "Adv. Rohan Mehta",
  "Adv. Kavita Deshmukh",
  "Adv. Arjun Nair",
  "Adv. Farhan Qureshi",
  "Adv. Meera Chatterjee",
  "Adv. Vikram Singh",
  "Adv. Sneha Raghavan",
  "Adv. Imran Sheikh",
  "Adv. Pooja Bansal",
  "Adv. Karthik Reddy",
  "Adv. Nandini Joshi",
  "Adv. Sameer Kulkarni",
  "Adv. Divya Menon",
  "Adv. Rajat Khanna",
  "Adv. Aditi Verma",
];

const COURTS = [
  "Supreme Court of India",
  "Delhi High Court",
  "Bombay High Court",
  "Karnataka High Court",
  "Madras High Court",
  "District & Sessions Court",
];

export const LAWYERS: Lawyer[] = NAMES.map((name, i) => {
  const spec = LEGAL_CATEGORIES[i % LEGAL_CATEGORIES.length]!;
  return {
    id: `lw-${i + 1}`,
    name,
    photo: `https://i.pravatar.cc/320?img=${(i % 70) + 5}`,
    specialization: spec,
    extraSpecializations: [
      LEGAL_CATEGORIES[(i + 3) % LEGAL_CATEGORIES.length]!,
      LEGAL_CATEGORIES[(i + 7) % LEGAL_CATEGORIES.length]!,
    ],
    city: CITIES[i % CITIES.length]!,
    languages: ["English", LANGUAGES[(i % 6) + 1]!],
    experience: 3 + ((i * 3) % 22),
    fee: 800 + ((i * 450) % 5200),
    rating: Number((4.2 + ((i * 7) % 8) / 10).toFixed(1)),
    reviews: 24 + ((i * 37) % 380),
    verified: i % 7 !== 3,
    availableToday: i % 3 !== 0,
    court: COURTS[i % COURTS.length]!,
    cases: 60 + ((i * 53) % 900),
    bio: `${name.replace("Adv. ", "")} is a ${spec.toLowerCase()} specialist practising at the ${COURTS[i % COURTS.length]}. Known for pragmatic, outcome-focused counsel, they have advised individuals, founders and enterprises across India on complex matters, with a strong record in negotiation, mediation and courtroom advocacy.`,
  };
});

export const getLawyer = (id: string) => LAWYERS.find((l) => l.id === id);

export const TIME_SLOTS = [
  "09:30 AM",
  "10:30 AM",
  "11:30 AM",
  "01:00 PM",
  "02:30 PM",
  "04:00 PM",
  "05:30 PM",
  "07:00 PM",
];

export type Booking = {
  id: string;
  lawyerId: string;
  client: string;
  date: string;
  time: string;
  mode: "Video" | "Audio" | "Chat" | "In-person";
  status: "Confirmed" | "Pending" | "Completed" | "Cancelled";
  category: string;
  amount: number;
};

export const BOOKINGS: Booking[] = [
  { id: "BK-2411", lawyerId: "lw-1", client: "Rahul Sharma", date: "2026-08-05", time: "10:30 AM", mode: "Video", status: "Confirmed", category: "Criminal Law", amount: 2400 },
  { id: "BK-2410", lawyerId: "lw-4", client: "Rahul Sharma", date: "2026-08-07", time: "02:30 PM", mode: "Chat", status: "Pending", category: "Corporate & Startup", amount: 1800 },
  { id: "BK-2402", lawyerId: "lw-2", client: "Priya Nair", date: "2026-07-28", time: "05:30 PM", mode: "Audio", status: "Completed", category: "Family & Divorce", amount: 3200 },
  { id: "BK-2398", lawyerId: "lw-6", client: "Aman Gupta", date: "2026-07-21", time: "11:30 AM", mode: "In-person", status: "Completed", category: "Property & Real Estate", amount: 4500 },
  { id: "BK-2390", lawyerId: "lw-3", client: "Sara Khan", date: "2026-07-14", time: "09:30 AM", mode: "Video", status: "Cancelled", category: "Cyber Crime", amount: 1500 },
  { id: "BK-2412", lawyerId: "lw-8", client: "Neha Bose", date: "2026-08-06", time: "04:00 PM", mode: "Video", status: "Confirmed", category: "Consumer Protection", amount: 2100 },
];

export type LegalDocument = {
  id: string;
  name: string;
  type: string;
  size: string;
  uploaded: string;
  sharedWith: string;
  status: "Reviewed" | "Pending review" | "Draft";
};

export const DOCUMENTS: LegalDocument[] = [
  { id: "D-91", name: "Rental_Agreement_2026.pdf", type: "Agreement", size: "1.2 MB", uploaded: "2026-08-01", sharedWith: "Adv. Kavita Deshmukh", status: "Reviewed" },
  { id: "D-90", name: "FIR_Copy_Ranchi.pdf", type: "FIR", size: "480 KB", uploaded: "2026-07-29", sharedWith: "Adv. Ananya Iyer", status: "Pending review" },
  { id: "D-88", name: "Founders_Agreement_v3.docx", type: "Contract", size: "820 KB", uploaded: "2026-07-24", sharedWith: "Adv. Arjun Nair", status: "Draft" },
  { id: "D-84", name: "Property_Sale_Deed.pdf", type: "Deed", size: "3.4 MB", uploaded: "2026-07-11", sharedWith: "Adv. Meera Chatterjee", status: "Reviewed" },
];

export type Review = {
  id: string;
  author: string;
  lawyer: string;
  rating: number;
  date: string;
  text: string;
};

export const REVIEWS: Review[] = [
  { id: "R-1", author: "Rahul Sharma", lawyer: "Adv. Ananya Iyer", rating: 5, date: "2026-07-30", text: "Explained my options clearly within the first ten minutes. The bail application was filed the same evening." },
  { id: "R-2", author: "Priya Nair", lawyer: "Adv. Rohan Mehta", rating: 5, date: "2026-07-22", text: "Handled a sensitive mutual divorce with patience and zero jargon. Worth every rupee." },
  { id: "R-3", author: "Aman Gupta", lawyer: "Adv. Kavita Deshmukh", rating: 4, date: "2026-07-15", text: "Thorough review of my sale deed and flagged two clauses my builder had slipped in." },
  { id: "R-4", author: "Neha Bose", lawyer: "Adv. Arjun Nair", rating: 5, date: "2026-07-09", text: "Set up our ESOP pool and cap table paperwork in under a week." },
];

export const PAYMENTS = [
  { id: "PAY-8821", date: "2026-08-01", counterparty: "Adv. Ananya Iyer", method: "UPI", amount: 2400, status: "Paid" },
  { id: "PAY-8814", date: "2026-07-28", counterparty: "Adv. Rohan Mehta", method: "Card", amount: 3200, status: "Paid" },
  { id: "PAY-8802", date: "2026-07-21", counterparty: "Adv. Meera Chatterjee", method: "Netbanking", amount: 4500, status: "Paid" },
  { id: "PAY-8790", date: "2026-07-14", counterparty: "Adv. Kavita Deshmukh", method: "UPI", amount: 1500, status: "Refunded" },
];

export const REVENUE_SERIES = [
  { month: "Feb", revenue: 182000, consultations: 96 },
  { month: "Mar", revenue: 214000, consultations: 118 },
  { month: "Apr", revenue: 241000, consultations: 132 },
  { month: "May", revenue: 268000, consultations: 149 },
  { month: "Jun", revenue: 312000, consultations: 168 },
  { month: "Jul", revenue: 358000, consultations: 191 },
];

export const CATEGORY_SPLIT = [
  { name: "Criminal", value: 28 },
  { name: "Family", value: 22 },
  { name: "Property", value: 19 },
  { name: "Corporate", value: 17 },
  { name: "Others", value: 14 },
];

export const PLATFORM_USERS = [
  { id: "U-1042", name: "Rahul Sharma", email: "rahul@example.com", role: "Client", joined: "2026-06-12", status: "Active" },
  { id: "U-1041", name: "Adv. Ananya Iyer", email: "ananya@example.com", role: "Lawyer", joined: "2026-05-30", status: "Active" },
  { id: "U-1039", name: "Priya Nair", email: "priya@example.com", role: "Client", joined: "2026-05-18", status: "Active" },
  { id: "U-1035", name: "Adv. Farhan Qureshi", email: "farhan@example.com", role: "Lawyer", joined: "2026-04-27", status: "Suspended" },
  { id: "U-1030", name: "Neha Bose", email: "neha@example.com", role: "Client", joined: "2026-04-02", status: "Active" },
];

export const VERIFICATIONS = [
  { id: "V-311", lawyer: "Adv. Sneha Raghavan", barId: "MAH/2231/2016", city: "Pune", submitted: "2026-08-02", status: "Pending" },
  { id: "V-310", lawyer: "Adv. Imran Sheikh", barId: "DL/7781/2013", city: "New Delhi", submitted: "2026-08-01", status: "Pending" },
  { id: "V-308", lawyer: "Adv. Karthik Reddy", barId: "TS/4410/2019", city: "Hyderabad", submitted: "2026-07-30", status: "In review" },
  { id: "V-305", lawyer: "Adv. Nandini Joshi", barId: "KA/1192/2011", city: "Bengaluru", submitted: "2026-07-27", status: "Approved" },
];

export const NOTIFICATIONS = [
  { id: "N-1", title: "Appointment confirmed", body: "Adv. Ananya Iyer confirmed your video consultation on 5 Aug, 10:30 AM.", time: "2h ago", unread: true },
  { id: "N-2", title: "Document reviewed", body: "Your rental agreement has been reviewed with 3 comments.", time: "1d ago", unread: true },
  { id: "N-3", title: "Payment receipt", body: "₹2,400 paid to Adv. Ananya Iyer. Invoice PAY-8821.", time: "1d ago", unread: false },
  { id: "N-4", title: "TekoraAI summary ready", body: "Summary of FIR_Copy_Ranchi.pdf is available in Documents.", time: "3d ago", unread: false },
];
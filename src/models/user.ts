export interface User {
  userId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  profileImage: string;
  dob: string;
  gender: "male" | "female" | "other";
  role: "admin" | "salesman" | "customer";
  createdAt: string; // ISO date string for account creation
}

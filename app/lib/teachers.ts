// Kleine Demo-Datenbank im Code (später echte DB)
export type Teacher = {
  id: string;
  name: string;
  subject: string;
  rating: number; // 1..5
  avatarUrl?: string; // später echte Bilder
};

export const TEACHERS: Teacher[] = [
  { id: "t1", name: "Anna Weber",  subject: "Mathematik", rating: 5 },
  { id: "t2", name: "Paul Schmidt", subject: "Englisch",   rating: 5 },
  { id: "t3", name: "Maria Fischer",subject: "Biologie",    rating: 5 },
  { id: "t4", name: "David Müller", subject: "Physik",      rating: 5 },
];

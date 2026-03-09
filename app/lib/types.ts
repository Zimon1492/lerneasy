// Zentrale Typdefinition – überall genau diesen importieren
export type Teacher = {
  id: string | number;
  name: string;
  subject: string;
  rating?: number;
  avgRating?: number | null;
  ratingCount?: number;
  avatarUrl?: string;
  profilePicture?: string | null;
  description?: string | null;
};

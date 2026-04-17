export interface Business {
  id: string;
  name: string;
  logoUrl?: string;
  gstNumber?: string;
  city: string;
  state: string;
  hasData?: boolean;
}

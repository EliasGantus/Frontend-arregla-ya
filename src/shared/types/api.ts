export type UserRole = 'cliente' | 'profesional' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  city?: string;
  zone?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SessionPayload extends AuthTokens {
  user: AuthUser;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  fullName: string;
  role: Exclude<UserRole, 'admin'>;
}

export interface RefreshInput {
  refreshToken: string;
}

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
}

export interface ProfessionalSearchResult extends AuthUser {
  ratingAverage: number;
  ratingCount: number;
  available: boolean;
  specialties: CategorySummary[];
}

export interface ProfessionalSearchFilters {
  categoryId?: string;
  categorySlug?: string;
  zone?: string;
  availableAt?: string;
}

export interface ProfessionalReview {
  id: string;
  bookingId: string;
  serviceRequestId: string;
  clientId: string;
  clientName: string;
  professionalId: string;
  professionalName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export type ServiceRequestStatus =
  | 'draft'
  | 'open'
  | 'quoted'
  | 'assigned'
  | 'cancelled';

export interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  status: ServiceRequestStatus;
  category: CategorySummary;
  city: string;
  zone: string;
  budget?: string;
  createdAt: string;
}

export interface CreateServiceRequestInput {
  title: string;
  description: string;
  categoryId: string;
  city: string;
  zone: string;
  budget?: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  city?: string;
  zone?: string;
}

export type QuoteStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface Quote {
  id: string;
  serviceRequestId: string;
  professionalName: string;
  professionalId: string;
  amount: string;
  status: QuoteStatus;
  message: string;
  createdAt: string;
}

export interface CreateQuoteInput {
  serviceRequestId: string;
  amount: string;
  message: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  serviceRequestId: string;
  serviceRequestTitle: string;
  clientId: string;
  clientName: string;
  professionalId: string;
  professionalName: string;
  scheduledAt: string;
  status: BookingStatus;
  notes?: string;
  createdAt: string;
}

export interface CreateBookingInput {
  serviceRequestId: string;
  professionalId: string;
  scheduledAt: string;
  notes?: string;
}

export interface UpdateBookingInput {
  scheduledAt?: string;
  status?: BookingStatus;
  notes?: string;
}

export interface CreateEmergencyInput {
  title: string;
  description: string;
  categoryId: string;
  city: string;
  zone: string;
  scheduledAt: string;
  budget?: string;
  notes?: string;
}

export interface EmergencyResponse {
  serviceRequest: ServiceRequest;
  booking: Booking;
}

export interface AdminUserSummary {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

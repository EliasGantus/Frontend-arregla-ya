import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Ingresa un email valido.'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

export const registerSchema = loginSchema.extend({
  fullName: z.string().min(3, 'Ingresa tu nombre completo.'),
  role: z.enum(['cliente', 'profesional'], {
    required_error: 'Selecciona el tipo de cuenta.',
  }),
});

export const serviceRequestSchema = z.object({
  title: z.string().min(12, 'Describí mejor el problema (mín. 12 caracteres).'),
  categoryId: z.string().min(1, 'Selecciona una categoría.'),
  city: z.string().min(2, 'Ingresa una ciudad valida.'),
  zone: z.string().min(2, 'Ingresa una zona o barrio.'),
  budget: z.string().optional(),
});

export const professionalSearchSchema = z.object({
  categoryId: z.string().min(1, 'Selecciona una especialidad.'),
  zone: z.string().min(2, 'Ingresa una zona o barrio.'),
  availableNow: z.boolean(),
});

export const quoteSchema = z.object({
  serviceRequestId: z.string().min(1),
  amount: z.string().min(1, 'Ingresa un monto estimado.'),
  message: z.string().min(10, 'Explica alcance y tiempos.'),
});

export const bookingSchema = z.object({
  serviceRequestId: z.string().min(1, 'Selecciona la solicitud a reservar.'),
  scheduledDate: z.string().min(1, 'Selecciona una fecha.'),
  scheduledTime: z.string().min(1, 'Selecciona un horario.'),
  notes: z.string().optional(),
});

export const emergencySchema = z.object({
  categoryId: z.string().min(1, 'Selecciona el tipo de emergencia.'),
  title: z.string().min(4, 'Describe el problema en pocas palabras.'),
  description: z
    .string()
    .min(
      12,
      'Agrega detalle para que el profesional pueda evaluar la urgencia.',
    ),
  city: z.string().min(2, 'Ingresa una ciudad valida.'),
  zone: z.string().min(2, 'Ingresa una zona o barrio.'),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
  notes: z.string().optional(),
});

export const paymentSchema = z.object({
  bookingId: z.string().min(1, 'Selecciona el servicio a pagar.'),
  amount: z.string().min(1, 'Ingresa el monto del servicio.'),
  method: z.enum(['mercado_pago_wallet', 'mercado_pago_card'], {
    required_error: 'Selecciona un metodo de pago.',
  }),
});

export const reviewSchema = z.object({
  bookingId: z.string().min(1, 'Selecciona el servicio completado.'),
  rating: z.coerce.number().int().min(1, 'Selecciona una calificacion.').max(5),
  comment: z
    .string()
    .trim()
    .max(500, 'La resena no puede superar 500 caracteres.')
    .optional()
    .refine(
      (value) => !value || value.length >= 3,
      'La resena debe tener al menos 3 caracteres.',
    ),
});

export const profileSchema = z.object({
  fullName: z.string().min(3, 'Ingresa un nombre válido.'),
  city: z.string().min(2, 'Ingresa una ciudad válida.'),
  zone: z.string().min(2, 'Ingresa una zona válida.'),
  phone: z.string().min(8, 'Ingresa un telefono válido.'),
  profilePhotoUrl: z
    .string()
    .url('Ingresa una URL valida para la foto.')
    .optional()
    .or(z.literal('')),
  available: z.boolean(),
  specialties: z.array(z.string()).optional(),
  workPhotos: z.string().optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ServiceRequestFormValues = z.infer<typeof serviceRequestSchema>;
export type ProfessionalSearchFormValues = z.infer<
  typeof professionalSearchSchema
>;
export type QuoteFormValues = z.infer<typeof quoteSchema>;
export type BookingFormValues = z.infer<typeof bookingSchema>;
export type EmergencyFormValues = z.infer<typeof emergencySchema>;
export type PaymentFormValues = z.infer<typeof paymentSchema>;
export type ReviewFormValues = z.infer<typeof reviewSchema>;
export type ProfileFormValues = z.infer<typeof profileSchema>;

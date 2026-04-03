import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Ingresa un email valido.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

export const serviceRequestSchema = z.object({
  title: z.string().min(4, 'Describe mejor el trabajo.'),
  description: z.string().min(12, 'Agrega más detalle para los profesionales.'),
  categoryId: z.string().min(1, 'Selecciona una categoría.'),
  city: z.string().min(2, 'Ingresa una ciudad valida.'),
  zone: z.string().min(2, 'Ingresa una zona o barrio.'),
  budget: z.string().optional(),
});

export const quoteSchema = z.object({
  serviceRequestId: z.string().min(1),
  amount: z.string().min(1, 'Ingresa un monto estimado.'),
  message: z.string().min(10, 'Explica alcance y tiempos.'),
});

export const profileSchema = z.object({
  fullName: z.string().min(3, 'Ingresa un nombre válido.'),
  city: z.string().min(2, 'Ingresa una ciudad válida.'),
  zone: z.string().min(2, 'Ingresa una zona válida.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type ServiceRequestFormValues = z.infer<typeof serviceRequestSchema>;
export type QuoteFormValues = z.infer<typeof quoteSchema>;
export type ProfileFormValues = z.infer<typeof profileSchema>;

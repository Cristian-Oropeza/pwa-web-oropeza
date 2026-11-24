import { z } from "zod";

/**
 * Validacion client-side del login. El backend tambien valida; esto es
 * para feedback inmediato en el formulario.
 */
export const loginSchema = z.object({
  correo: z
    .string()
    .trim()
    .min(1, "El correo es obligatorio")
    .email("Formato de correo invalido")
    .max(100, "Maximo 100 caracteres"),
  password: z
    .string()
    .min(1, "La contrasenia es obligatoria")
    .max(72, "Maximo 72 caracteres"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

/** Codigo TOTP: 6 digitos o scratch code de 10 chars alfanumericos. */
export const totpCodeSchema = z.object({
  codigo: z
    .string()
    .trim()
    .regex(
      /^([0-9]{6}|[A-Z2-9]{10})$/,
      "Debe ser un codigo de 6 digitos o un codigo de respaldo de 10 caracteres"
    ),
});

export type TotpCodeFormValues = z.infer<typeof totpCodeSchema>;

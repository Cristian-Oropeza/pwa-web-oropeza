// Contratos TypeScript que espejan los DTOs del backend Spring Boot.
// Mantener sincronizado con los records de prueba/src/main/.../dto/.

export interface LoginRequest {
  correo: string;
  password: string;
}

/** Respuesta de /auth/login y /auth/2fa/verificar (campos null se omiten). */
export interface LoginResponse {
  /** Presente cuando el login es directo o cuando se completo 2FA. */
  token?: string;
  tipo?: "Bearer";
  expiraEn?: number;
  clienteId: number;
  correo: string;
  /** True cuando la respuesta de /auth/login indica que falta el codigo 2FA. */
  requiere2FA: boolean;
  /** JWT corto (5 min) para intercambiar por token real en /auth/2fa/verificar. */
  preAuthToken?: string;
}

export interface Totp2FAVerificarRequest {
  preAuthToken: string;
  codigo: string;
}

export interface SesionActivaDto {
  sesionId: number;
  dispositivo: string | null;
  ipAddress: string | null;
  fechaCreacion: string;
  ultimaActividad: string;
  esSesionActual: boolean;
}

/** Shape del 409 CONFLICT cuando hay sesion duplicada. */
export interface SesionDuplicadaBody {
  codigo: 409;
  mensaje: string;
  detalles: SesionActivaDto[];
}

/** Error generico de la API (otros codigos). */
export interface ApiError {
  codigo: number;
  mensaje: string;
  detalles?: string[];
}


// ====================== Setup/Administracion 2FA ======================

export interface Totp2FASetupResponse {
  issuer: string;
  label: string;
  otpauthUri: string;
  qrImageDataUri: string;
  scratchCodes: string[];
}

export interface Totp2FAActivarRequest {
  codigo: string;
}

export interface Totp2FADesactivarRequest {
  password: string;
}

export interface GenericResponse {
  codigo: number;
  mensaje: string;
  detalles?: string[];
}

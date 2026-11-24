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


export interface Totp2FAStatusResponse {
  activo: boolean;
}


// ====================== Paginacion generica ======================

/**
 * Paginacion estandar que acepta el backend (PaginacionRequest).
 * sort: "campo,direccion" ej "descripcion,asc".
 */
export interface PaginacionRequest {
  page?: number;
  size?: number;
  sort?: string;
}

/**
 * Subset del Page<T> que serializa Spring Data. Se omiten campos
 * internos (pageable, sort) que la UI no consume.
 */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  /** Numero de pagina actual, indexado en cero. */
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  numberOfElements: number;
}


// ====================== Catalogo ======================

export interface CatalogoConsultarRequest {
  idServicio?: string;
  descripcion?: string;
  incluirInactivos?: boolean;
  paginacion?: PaginacionRequest;
}

/**
 * Shape de un producto del catalogo (espeja CatalogoProductoResponse).
 * Los montos llegan como string (BigDecimal serializado) o number,
 * siempre los normalizamos a string en la UI para evitar perdida de
 * precision al formatear.
 */
export interface CatalogoProducto {
  id: number;
  idServicio: string;
  idProducto: string;
  descripcion: string;
  /** 1 = recarga a precio fijo, 2 = pago con referencia (monto abierto). */
  tipoFront: number;
  precio: string | number | null;
  montoMin: string | number | null;
  montoMax: string | number | null;
  moneda: string;
  activo: boolean;
  imagenUrl: string | null;
  /** ISO-8601, puede ser null si nunca sincronizo. */
  fechaSincronizacion: string | null;
}

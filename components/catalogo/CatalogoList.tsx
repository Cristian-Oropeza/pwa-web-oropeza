"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid2";
import InputAdornment from "@mui/material/InputAdornment";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import ClearIcon from "@mui/icons-material/Clear";
import { apiPost } from "@/lib/api-client";
import { useCatalogoStore } from "@/lib/store/catalogo-store";
import type {
  CatalogoConsultarRequest,
  CatalogoProducto,
  PageResponse,
} from "@/lib/types";
import ProductoCard from "./ProductoCard";

const PAGE_SIZE_OPTIONS = [12, 24, 48];
const DEFAULT_PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 350;

/**
 * Vista principal del catalogo. Todo el estado vive aqui (filtros,
 * paginacion, resultado). Cada cambio de filtro resetea a page=0 para
 * no quedar en una pagina que ya no existe. El texto de busqueda se
 * debouncea para evitar disparar fetch por cada tecla.
 */
export default function CatalogoList() {
  // Filtros "en edicion" (lo que el user ve/escribe).
  const [idServicio, setIdServicio] = useState("");
  const [descripcionInput, setDescripcionInput] = useState("");
  const [incluirInactivos, setIncluirInactivos] = useState(false);

  // Filtro "aplicado" para descripcion (debounced).
  const [descripcionAplicada, setDescripcionAplicada] = useState("");

  // Paginacion.
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);

  // Estado de red.
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [data, setData] = useState<PageResponse<CatalogoProducto> | null>(null);

  // Evita race conditions si el usuario dispara varias peticiones rapidas:
  // solo la ultima actualiza el estado.
  const requestIdRef = useRef(0);

  const upsertMany = useCatalogoStore((s) => s.upsertMany);

  // Debounce del input de descripcion.
  useEffect(() => {
    const trimmed = descripcionInput.trim();
    const timer = window.setTimeout(() => {
      setDescripcionAplicada(trimmed);
      setPage(0);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [descripcionInput]);

  const body = useMemo<CatalogoConsultarRequest>(
    () => ({
      idServicio: idServicio.trim() || undefined,
      descripcion: descripcionAplicada || undefined,
      incluirInactivos,
      paginacion: {
        page,
        size,
        sort: "descripcion,asc",
      },
    }),
    [idServicio, descripcionAplicada, incluirInactivos, page, size]
  );

  const fetchCatalogo = useCallback(async () => {
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setErrorMsg(null);
    const res = await apiPost<PageResponse<CatalogoProducto>>(
      "/api/v1/catalogo/consultar",
      body
    );
    // Solo la peticion mas reciente pisa el estado.
    if (reqId !== requestIdRef.current) return;

    if (res.ok && res.data) {
      setData(res.data);
      upsertMany(res.data.content);
    } else {
      setData(null);
      setErrorMsg(res.error?.mensaje ?? "No se pudo cargar el catalogo");
    }
    setLoading(false);
  }, [body, upsertMany]);

  useEffect(() => {
    void fetchCatalogo();
  }, [fetchCatalogo]);

  function handleLimpiarFiltros() {
    setIdServicio("");
    setDescripcionInput("");
    setDescripcionAplicada("");
    setIncluirInactivos(false);
    setPage(0);
  }

  const totalElements = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  // MUI Pagination es 1-indexed; el backend es 0-indexed.
  const currentPageUi = (data?.number ?? page) + 1;
  const productos = data?.content ?? [];

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Catalogo de productos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Consulta los servicios disponibles y abre el detalle para iniciar una compra.
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ md: "center" }}
        >
          <TextField
            label="Buscar por descripcion"
            value={descripcionInput}
            onChange={(e) => setDescripcionInput(e.target.value)}
            size="small"
            fullWidth
            inputProps={{ maxLength: 100, "aria-label": "Buscar producto por descripcion" }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="ID de servicio"
            placeholder="TELCEL"
            value={idServicio}
            onChange={(e) => {
              setIdServicio(e.target.value.toUpperCase());
              setPage(0);
            }}
            size="small"
            sx={{ minWidth: { md: 180 } }}
            inputProps={{ maxLength: 50, "aria-label": "Filtrar por id de servicio" }}
          />
          <TextField
            label="Por pagina"
            select
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setPage(0);
            }}
            size="small"
            sx={{ minWidth: 120 }}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
            ))}
          </TextField>
          <FormControlLabel
            control={
              <Switch
                checked={incluirInactivos}
                onChange={(e) => {
                  setIncluirInactivos(e.target.checked);
                  setPage(0);
                }}
              />
            }
            label="Incluir inactivos"
          />
          <Stack direction="row" spacing={1}>
            <Button
              variant="text"
              startIcon={<ClearIcon />}
              onClick={handleLimpiarFiltros}
              disabled={
                !idServicio && !descripcionInput && !incluirInactivos && size === DEFAULT_PAGE_SIZE
              }
            >
              Limpiar
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => void fetchCatalogo()}
              disabled={loading}
            >
              Recargar
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {loading && <LinearProgress aria-label="Cargando catalogo" />}

      {errorMsg && (
        <Alert severity="error" role="alert">
          {errorMsg}
        </Alert>
      )}

      {!loading && !errorMsg && productos.length === 0 && (
        <Alert severity="info">
          No encontramos productos con esos filtros. Prueba a limpiarlos o a incluir inactivos.
        </Alert>
      )}

      {productos.length > 0 && (
        <>
          <Typography variant="body2" color="text.secondary" aria-live="polite">
            Mostrando {productos.length} de {totalElements} productos.
          </Typography>
          <Grid container spacing={2}>
            {productos.map((p) => (
              <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <ProductoCard producto={p} />
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Stack direction="row" justifyContent="center" sx={{ pt: 1 }}>
              <Pagination
                page={currentPageUi}
                count={totalPages}
                color="primary"
                shape="rounded"
                onChange={(_, uiPage) => {
                  setPage(uiPage - 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={loading}
                aria-label="Paginacion del catalogo"
              />
            </Stack>
          )}
        </>
      )}
    </Stack>
  );
}

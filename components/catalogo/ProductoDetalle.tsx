"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid2";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { apiPost } from "@/lib/api-client";
import { formatDateTime, formatMoney } from "@/lib/format";
import { useCatalogoStore } from "@/lib/store/catalogo-store";
import type {
  CatalogoConsultarRequest,
  CatalogoProducto,
  PageResponse,
} from "@/lib/types";

interface Props {
  id: number;
}

/**
 * Vista detalle de un producto. Intenta leer del cache del store (caso
 * normal cuando el user viene del listado); si no esta ahi, hace un
 * fallback consultando un page amplio contra el backend y buscando por id.
 * El backend aun no expone GET by id; cuando lo haga, bastara reemplazar
 * el fetch del fallback por una sola llamada.
 */
export default function ProductoDetalle({ id }: Props) {
  const cached = useCatalogoStore((s) => s.getById(id));
  const upsertMany = useCatalogoStore((s) => s.upsertMany);

  const [producto, setProducto] = useState<CatalogoProducto | null>(cached ?? null);
  const [loading, setLoading] = useState(!cached);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchFallback = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    const body: CatalogoConsultarRequest = {
      incluirInactivos: true,
      paginacion: { page: 0, size: 100, sort: "id,asc" },
    };
    const res = await apiPost<PageResponse<CatalogoProducto>>(
      "/api/v1/catalogo/consultar",
      body
    );
    if (res.ok && res.data) {
      upsertMany(res.data.content);
      const found = res.data.content.find((p) => p.id === id) ?? null;
      if (found) {
        setProducto(found);
      } else {
        setErrorMsg("No encontramos ese producto en el catalogo actual.");
      }
    } else {
      setErrorMsg(res.error?.mensaje ?? "No se pudo cargar el producto.");
    }
    setLoading(false);
  }, [id, upsertMany]);

  useEffect(() => {
    if (cached) {
      setProducto(cached);
      return;
    }
    void fetchFallback();
  }, [cached, fetchFallback]);

  if (loading) {
    return (
      <Stack spacing={2}>
        <LinearProgress aria-label="Cargando producto" />
        <Typography variant="body2" color="text.secondary">
          Cargando producto...
        </Typography>
      </Stack>
    );
  }

  if (errorMsg || !producto) {
    return (
      <Stack spacing={2}>
        <Alert severity="error" role="alert">
          {errorMsg ?? "Producto no disponible."}
        </Alert>
        <Box>
          <Button
            component={Link}
            href="/dashboard/catalogo"
            startIcon={<ArrowBackIcon />}
          >
            Volver al catalogo
          </Button>
        </Box>
      </Stack>
    );
  }

  const esPrecioFijo = producto.tipoFront === 1;
  // La compra se habilita en Fase 2B.3-b. Por ahora el boton es informativo
  // para que el flujo sea obvio sin dejar un link muerto.
  const hrefComprar = `/dashboard/comprar/${producto.id}`;

  return (
    <Stack spacing={3}>
      <Breadcrumbs aria-label="breadcrumb">
        <Link href="/dashboard" style={{ color: "inherit", textDecoration: "none" }}>
          Dashboard
        </Link>
        <Link
          href="/dashboard/catalogo"
          style={{ color: "inherit", textDecoration: "none" }}
        >
          Catalogo
        </Link>
        <Typography color="text.primary">{producto.descripcion}</Typography>
      </Breadcrumbs>

      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
            <Chip label={producto.idServicio} color="primary" variant="outlined" />
            <Chip label={esPrecioFijo ? "Precio fijo" : "Monto abierto"} />
            {!producto.activo && <Chip label="Inactivo" color="warning" />}
          </Stack>

          <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 0.5 }}>
            {producto.descripcion}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Codigo del producto: {producto.idProducto}
          </Typography>

          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            {esPrecioFijo ? (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="overline" color="text.secondary">
                  Precio
                </Typography>
                <Typography variant="h5" color="primary" fontWeight={700}>
                  {formatMoney(producto.precio, producto.moneda)}
                </Typography>
              </Grid>
            ) : (
              <>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="overline" color="text.secondary">
                    Monto minimo
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {formatMoney(producto.montoMin, producto.moneda)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="overline" color="text.secondary">
                    Monto maximo
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {formatMoney(producto.montoMax, producto.moneda)}
                  </Typography>
                </Grid>
              </>
            )}
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="overline" color="text.secondary">
                Moneda
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {producto.moneda || "MXN"}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="overline" color="text.secondary">
                Ultima sincronizacion
              </Typography>
              <Typography variant="body1">
                {formatDateTime(producto.fechaSincronizacion)}
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              component={Link}
              href="/dashboard/catalogo"
              variant="text"
              startIcon={<ArrowBackIcon />}
            >
              Volver al catalogo
            </Button>
            <Button
              component={Link}
              href={hrefComprar}
              variant="contained"
              color="primary"
              startIcon={<ShoppingCartIcon />}
              disabled={!producto.activo}
            >
              {producto.activo ? "Comprar" : "No disponible"}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

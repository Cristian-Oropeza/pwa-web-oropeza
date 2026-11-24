"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { CatalogoProducto } from "@/lib/types";
import { formatMoney } from "@/lib/format";

interface Props {
  producto: CatalogoProducto;
}

/**
 * Card del grid del catalogo. Toda la card es clickable via CardActionArea
 * (link accesible: keyboard-focuseable y lector de pantalla lo anuncia como enlace).
 * El precio se muestra solo si el producto es de precio fijo (tipoFront=1);
 * los de referencia (tipo=2) muestran el rango permitido.
 */
export default function ProductoCard({ producto }: Props) {
  const esPrecioFijo = producto.tipoFront === 1;
  const hrefDetalle = `/dashboard/catalogo/${producto.id}`;

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 160ms ease, border-color 160ms ease",
        "&:hover": {
          boxShadow: 3,
          borderColor: "primary.main",
        },
      }}
    >
      <CardActionArea
        component={Link}
        href={hrefDetalle}
        aria-label={`Ver detalle de ${producto.descripcion}`}
        sx={{ flexGrow: 1, display: "flex", alignItems: "stretch", p: 0 }}
      >
        <CardContent sx={{ flexGrow: 1, width: "100%" }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }} flexWrap="wrap">
            <Chip
              label={producto.idServicio}
              size="small"
              color="primary"
              variant="outlined"
            />
            {!producto.activo && (
              <Chip label="Inactivo" size="small" color="warning" />
            )}
            {esPrecioFijo ? (
              <Chip label="Precio fijo" size="small" />
            ) : (
              <Chip label="Monto abierto" size="small" />
            )}
          </Stack>

          <Typography variant="h6" component="h2" fontWeight={600} sx={{ mb: 0.5 }}>
            {producto.descripcion}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {producto.idProducto}
          </Typography>

          <Box sx={{ mt: 2 }}>
            {esPrecioFijo ? (
              <Typography variant="h5" component="p" color="primary" fontWeight={700}>
                {formatMoney(producto.precio, producto.moneda)}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                De {formatMoney(producto.montoMin, producto.moneda)} a{" "}
                {formatMoney(producto.montoMax, producto.moneda)}
              </Typography>
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

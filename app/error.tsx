"use client";

import { useEffect } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Hook para instrumentacion futura (Sentry, etc).
    // eslint-disable-next-line no-console
    console.error("Unhandled error boundary:", error);
  }, [error]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
        bgcolor: "background.default",
      }}
    >
      <Stack spacing={2} alignItems="center" sx={{ textAlign: "center", maxWidth: 480 }}>
        <Typography variant="h2" component="h1" fontWeight={700} color="error">
          Algo salio mal
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Ocurrio un error inesperado al procesar tu solicitud. Puedes intentarlo de nuevo o volver al dashboard.
        </Typography>
        {error.digest && (
          <Typography variant="caption" color="text.secondary" fontFamily="monospace">
            ref: {error.digest}
          </Typography>
        )}
        <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
          <Button variant="contained" onClick={() => reset()}>
            Reintentar
          </Button>
          <Button component={Link} href="/dashboard" variant="text">
            Ir al dashboard
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

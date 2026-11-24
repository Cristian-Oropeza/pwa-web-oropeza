import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export const metadata = {
  title: "Pagina no encontrada - PWA Oropeza",
};

export default function NotFound() {
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
      <Stack spacing={2} alignItems="center" sx={{ textAlign: "center", maxWidth: 420 }}>
        <Typography variant="h2" component="h1" fontWeight={700} color="primary">
          404
        </Typography>
        <Typography variant="h5" component="h2" fontWeight={600}>
          Esta pagina no existe
        </Typography>
        <Typography variant="body1" color="text.secondary">
          La ruta que buscas no esta disponible o fue movida.
        </Typography>
        <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
          <Button component={Link} href="/dashboard" variant="contained">
            Ir al dashboard
          </Button>
          <Button component={Link} href="/login" variant="text">
            Iniciar sesion
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

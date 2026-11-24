import TotpVerifyForm from "@/components/auth/TotpVerifyForm";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export default function TotpVerifyPage() {
  return (
    <Paper elevation={3} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h5" component="h1" fontWeight={700}>
          Verificacion en dos pasos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Ingresa el codigo de 6 digitos que muestra tu aplicacion autenticadora
          (Google Authenticator, Authy, etc.), o un codigo de respaldo de 10
          caracteres.
        </Typography>
        <TotpVerifyForm />
      </Stack>
    </Paper>
  );
}

import LoginForm from "@/components/auth/LoginForm";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export default function LoginPage() {
  return (
    <Paper elevation={3} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h5" component="h1" fontWeight={700}>
          Iniciar sesion
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Accede con tu correo y contrasenia registrados. Si tienes 2FA activo
          se te pedira el codigo despues.
        </Typography>
        <LoginForm />
      </Stack>
    </Paper>
  );
}

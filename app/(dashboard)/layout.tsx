"use client";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api-client";
import { useAuthStore } from "@/lib/store/auth-store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const clear = useAuthStore((s) => s.clear);

  async function handleLogout() {
    await apiPost("/api/v1/auth/logout");
    clear();
    router.push("/login");
    router.refresh();
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky" color="primary">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            PWA Oropeza
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Cerrar sesion
          </Button>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: "auto" }}>{children}</Box>
    </Box>
  );
}

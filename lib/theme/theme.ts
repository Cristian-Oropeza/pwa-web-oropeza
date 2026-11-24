"use client";

import { createTheme } from "@mui/material/styles";

// Paleta base: azul profundo corporativo. Puedes cambiar los valores
// despues sin tocar componentes.
const theme = createTheme({
  cssVariables: true,
  colorSchemes: { light: true, dark: true },
  palette: {
    primary:   { main: "#1E4FBF" },
    secondary: { main: "#F5A623" },
    error:     { main: "#D32F2F" },
    success:   { main: "#2E7D32" },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: `"Roboto", "Segoe UI", system-ui, -apple-system, sans-serif`,
    h1: { fontWeight: 600 },
    h2: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiTextField: { defaultProps: { fullWidth: true, variant: "outlined", size: "medium" } },
  },
});

export default theme;

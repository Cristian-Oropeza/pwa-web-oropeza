import { notFound } from "next/navigation";
import ProductoDetalle from "@/components/catalogo/ProductoDetalle";

export const metadata = {
  title: "Detalle de producto - PWA Oropeza",
};

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * Valida que el segmento [id] sea un entero positivo antes de renderizar.
 * Esto evita que URLs basura disparen fetchs innecesarios en el cliente.
 */
export default async function ProductoDetallePage({ params }: Props) {
  const { id } = await params;
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) notFound();
  return <ProductoDetalle id={parsed} />;
}

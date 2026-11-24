import { notFound } from "next/navigation";
import ComprarForm from "@/components/comprar/ComprarForm";

export const metadata = {
  title: "Comprar - PWA Oropeza",
};

interface Props {
  params: Promise<{ productoId: string }>;
}

export default async function ComprarPage({ params }: Props) {
  const { productoId } = await params;
  const parsed = Number(productoId);
  if (!Number.isInteger(parsed) || parsed <= 0) notFound();
  return <ComprarForm productoId={parsed} />;
}

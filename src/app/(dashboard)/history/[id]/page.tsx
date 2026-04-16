import { getSaleById } from "@/services/sales";
import { notFound } from "next/navigation";
import { SaleDetailsClient } from "@/components/history/SaleDetailsClient";

export default async function SaleDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const sale = await getSaleById(id);

  if (!sale) {
    notFound();
  }

  return <SaleDetailsClient sale={sale} />;
}

import { NextRequest, NextResponse } from "next/server";
import { getSaleById } from "@/services/sales";
import jsPDF from "jspdf";
import { formatCurrency, formatDate } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ saleId: string }> }
) {
  const { saleId } = await params;

  // Basic validation to prevent 22P02 errors
  if (!saleId || saleId.length < 32) {
    return new NextResponse("Invalid Sale ID", { status: 400 });
  }

  const sale = await getSaleById(saleId);

  if (!sale) {
    return new NextResponse("Sale not found", { status: 404 });
  }

  const doc = new jsPDF();
  const margin = 20;
  let y = 30;

  // Header
  doc.setFontSize(22);
  doc.setTextColor(219, 39, 119); // Pink-600
  doc.text("BeautyPOS Invoice", margin, y);
  
  y += 10;
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Invoice ID: #${sale.id.toUpperCase()}`, margin, y);
  doc.text(`Date: ${formatDate(sale.created_at)}`, margin, y + 5);
  doc.text(`Time: ${new Date(sale.created_at).toLocaleTimeString()}`, margin, y + 10);

  y += 30;
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text("Product", margin, y);
  doc.text("Qty", 120, y);
  doc.text("Price", 140, y);
  doc.text("Total", 170, y);
  
  y += 5;
  doc.line(margin, y, 190, y);
  
  y += 10;
  doc.setFont("helvetica", "normal");
  
  sale.sale_items.forEach((item: any) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(item.product.name, margin, y, { maxWidth: 90 });
    doc.text(item.quantity.toString(), 120, y);
    doc.text(formatCurrency(item.price), 140, y);
    doc.text(formatCurrency(item.subtotal), 170, y);
    y += 10;
  });

  y += 10;
  doc.line(margin, y, 190, y);
  y += 15;
  
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Total Amount:", 120, y);
  doc.text(formatCurrency(sale.total), 170, y);

  // Footer
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150);
  doc.text("Thank you for your business!", margin, 280);

  const pdfOutput = doc.output("arraybuffer");

  return new NextResponse(pdfOutput, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=invoice-${sale.id.slice(0, 8)}.pdf`,
    },
  });
}

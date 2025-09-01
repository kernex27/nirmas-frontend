import jsPDF from "jspdf";

export function downloadReport({ start, end, rows, totals, profile }) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Laporan Gizi - Nirmas.id", 105, 15, { align: "center" });

  doc.setFontSize(10);
  doc.text(`Rentang: ${start} s/d ${end}`, 14, 25);

  if (profile) {
    doc.text(
      `Profil: ${profile.gender || "-"}, lahir ${profile.birthdate || "-"}, ` +
      `TB ${profile.height || "-"} cm, BB ${profile.weight || "-"} kg, aktivitas ${profile.activityLevel || "-"}`,
      14, 32
    );
  }

  doc.text(
    `Total: ${Math.round(totals.kcal)} Kkal | P ${Math.round(totals.protein)}g | K ${Math.round(totals.carbs)}g | L ${Math.round(totals.fat)}g`,
    14, 38
  );

  let y = 48;
  rows.forEach(r => {
    const line = `${r.date} ${r.time} — ${r.food} (${r.portion}) • ${r.kcal||0}Kkal | P${r.protein||0} K${r.carbs||0} L${r.fat||0}`;
    doc.text(line, 14, y);
    y += 6;
    if (y > 280) { doc.addPage(); y = 20; }
  });

  doc.save(`nirmas-report-${start}-to-${end}.pdf`);
}

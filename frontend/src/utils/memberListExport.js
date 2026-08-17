import jsPDF from "jspdf";

const escapeXml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const triggerDownload = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const stamp = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
};

/**
 * @param {Array<object>} rows
 * @param {Array<{ key?: string, label: string, get?: (row: object) => string }>} columns
 * @param {string} title
 * @param {string} [filePrefix]
 */
export function downloadMembersExcel(rows, columns, title, filePrefix = "SLS_Members") {
  const headerCells = columns
    .map((col) => `<Cell><Data ss:Type="String">${escapeXml(col.label)}</Data></Cell>`)
    .join("");

  const bodyRows = rows
    .map((row) => {
      const cells = columns
        .map((col) => {
          const value = typeof col.get === "function" ? col.get(row) : row[col.key];
          return `<Cell><Data ss:Type="String">${escapeXml(value ?? "")}</Data></Cell>`;
        })
        .join("");
      return `<Row>${cells}</Row>`;
    })
    .join("");

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="${escapeXml(title).slice(0, 31) || "Members"}">
  <Table>
   <Row>${headerCells}</Row>
   ${bodyRows}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
  triggerDownload(blob, `${filePrefix}_${stamp()}.xls`);
}

/**
 * @param {Array<object>} rows
 * @param {Array<{ key?: string, label: string, get?: (row: object) => string }>} columns
 * @param {string} title
 * @param {string} [filePrefix]
 */
export function downloadMembersPdf(rows, columns, title, filePrefix = "SLS_Members") {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 28;
  const usableWidth = pageWidth - marginX * 2;
  const colWidth = usableWidth / columns.length;
  const lineH = 14;
  let y = 36;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(0, 33, 71);
  doc.text(title, marginX, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated ${new Date().toLocaleString()} · ${rows.length} record(s)`, marginX, y);
  y += 18;

  const drawHeader = () => {
    doc.setFillColor(241, 245, 249);
    doc.rect(marginX, y - 10, usableWidth, 18, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    columns.forEach((col, i) => {
      doc.text(String(col.label), marginX + i * colWidth + 4, y, {
        maxWidth: colWidth - 8,
      });
    });
    y += 16;
  };

  drawHeader();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  rows.forEach((row, idx) => {
    const values = columns.map((col) => {
      const value = typeof col.get === "function" ? col.get(row) : row[col.key];
      return String(value ?? "");
    });
    const cellLines = values.map((v) => doc.splitTextToSize(v, colWidth - 8));
    const rowHeight = Math.max(lineH, ...cellLines.map((lines) => lines.length * lineH));

    if (y + rowHeight > pageHeight - 28) {
      doc.addPage();
      y = 36;
      drawHeader();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(marginX, y - 10, usableWidth, rowHeight, "F");
    }

    cellLines.forEach((lines, i) => {
      doc.text(lines, marginX + i * colWidth + 4, y);
    });
    y += rowHeight;
  });

  if (rows.length === 0) {
    doc.setTextColor(148, 163, 184);
    doc.text("No records matched the current filters.", marginX, y + 8);
  }

  doc.save(`${filePrefix}_${stamp()}.pdf`);
}

export const ACTIVE_MEMBER_EXPORT_COLUMNS = [
  { label: "Member ID", get: (m) => m.member_id || "" },
  { label: "Name", get: (m) => m.name || "" },
  { label: "Email", get: (m) => m.email || "" },
  { label: "WhatsApp", get: (m) => m.whatsapp || m.phone || "" },
  { label: "Role", get: (m) => m.role || "General" },
  { label: "Status", get: (m) => (m.status === "blocked" ? "Suspended" : "Active") },
  { label: "Province", get: (m) => m.province || "" },
  { label: "District", get: (m) => m.district || "" },
  { label: "Tehsil / City", get: (m) => m.tehsil || m.city || "" },
  { label: "Joining Year", get: (m) => m.joining_year || "" },
];

export const PENDING_MEMBER_EXPORT_COLUMNS = [
  { label: "Name", get: (m) => m.name || "" },
  { label: "Email", get: (m) => m.email || "" },
  { label: "WhatsApp", get: (m) => m.whatsapp || m.phone || "" },
  { label: "Requested Role", get: (m) => m.requestedRole || m.role || "General" },
  { label: "Status", get: (m) => m.status || "pending" },
  { label: "Interview", get: (m) => (m.interview_called ? "Called" : "Pending") },
  { label: "Fee Status", get: (m) => m.feeStatus || "not_requested" },
  { label: "Province", get: (m) => m.province || "" },
  { label: "District", get: (m) => m.district || "" },
  { label: "Tehsil / City", get: (m) => m.tehsil || m.city || "" },
  { label: "Joining Year", get: (m) => m.joining_year || "" },
];

export const PENDING_EXEC_EXPORT_COLUMNS = [
  { label: "Type", get: () => "Executive Upgrade" },
  { label: "Name", get: (a) => a.name || a.memberId?.name || "" },
  { label: "Email", get: (a) => a.memberId?.email || "" },
  { label: "Member ID", get: (a) => a.member_id_str || a.memberId?.member_id || "" },
  { label: "City", get: (a) => a.city || a.memberId?.city || "" },
  { label: "Status", get: (a) => a.status || "pending" },
];

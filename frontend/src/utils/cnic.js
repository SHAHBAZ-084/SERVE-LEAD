/** Pakistani CNIC / B-Form: 13 digits as #####-#######-# */

export function formatCnicInput(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

export function cnicDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

export function isValidCnic(value) {
  return /^\d{5}-\d{7}-\d$/.test(String(value || "").trim())
    || cnicDigits(value).length === 13;
}

export function normalizeCnic(value) {
  const d = cnicDigits(value);
  if (d.length !== 13) return String(value || "").trim();
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}

// Normaliza strings: sin tildes, trim y lowercase
export const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();


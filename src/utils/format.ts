const _fmtCLP = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});
export const formatCLP = (v: number) => _fmtCLP.format(Math.round(v || 0));

// Formateador con separador de miles para Chile (sin decimales)
export const fmtMiles = new Intl.NumberFormat("es-CL", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});


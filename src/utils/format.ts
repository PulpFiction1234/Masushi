// utils/format.ts
// Formateadores para CLP (punto como separador de miles, sin decimales)
const _fmtCLP = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export const formatCLP = (v: number) => _fmtCLP.format(Math.round(v || 0));

// Si alguna vez quieres sólo miles sin símbolo, puedes exportar esto:
// const _fmtMiles = new Intl.NumberFormat("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
// export const formatMiles = (v: number) => _fmtMiles.format(Math.round(v || 0));

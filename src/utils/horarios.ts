// src/utils/horarios.ts
export type HHMM = `${number}:${number}`;
export type Intervalo = [HHMM, HHMM];
type DiaKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export const BUSINESS_TZ = "America/Santiago";

// Horario MASUSHI (según tu LOCAL):
// Lun-Jue 16:30–22:30 • Viernes 16:30–23:00 • Sábado 13:30–22:30 • Domingo cerrado
export const HORARIO_SEMANAL: Record<DiaKey, Intervalo[]> = {
  sun: [],
  mon: [["16:30", "22:30"]],
  tue: [["16:30", "22:30"]],
  wed: [["16:30", "22:30"]],
  thu: [["16:30", "22:30"]],
  fri: [["16:30", "23:00"]],
  sat: [["13:30", "22:30"]],
};

// Feriados / excepciones por fecha (YYYY-MM-DD). null o [] => cerrado todo el día.
export const OVERRIDES: Record<string, Intervalo[] | null | undefined> = {
  // "2025-09-18": null,
  // "2025-12-24": [["16:30","20:30"]],
};

// última orden X minutos antes del cierre
export const ULTIMA_ORDEN_MIN = 5; 

// ===== Helpers de TZ/fecha =====
function getPartsInTZ(d: Date, tz: string) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(d).map(p => [p.type, p.value]));
  const year = Number(parts.year), month = Number(parts.month), day = Number(parts.day);
  const hour = Number(parts.hour), minute = Number(parts.minute);
  const map: Record<string, DiaKey> = { sun:"sun", mon:"mon", tue:"tue", wed:"wed", thu:"thu", fri:"fri", sat:"sat" };
  const weekday = map[(parts.weekday || "").toLowerCase()] ?? "sun";
  return { year, month, day, hour, minute, weekday };
}
function toMinutes(hhmm: HHMM) { const [h,m] = hhmm.split(":").map(Number); return h*60+m; }
function pad(n:number){ return n<10?`0${n}`:`${n}`; }
function ymd(y:number,m:number,d:number){ return `${y}-${pad(m)}-${pad(d)}`; }

function intervalsForYMD(y:number,m:number,d:number,tz:string): Intervalo[] {
  const key = ymd(y,m,d);
  const ov = OVERRIDES[key];
  if (ov === null) return [];
  if (Array.isArray(ov)) return ov;
  const weekday = getPartsInTZ(new Date(Date.UTC(y,m-1,d,12,0)), tz).weekday;
  return HORARIO_SEMANAL[weekday] ?? [];
}

function applyUltimaOrden([ini, fin]: Intervalo): Intervalo {
  if (!ULTIMA_ORDEN_MIN) return [ini, fin];
  const end = Math.max(0, toMinutes(fin) - ULTIMA_ORDEN_MIN);
  const h = Math.floor(end / 60), m = end % 60;
  const finAjust = `${pad(h)}:${pad(m)}` as HHMM;
  return [ini, finAjust];
}

export function estaAbiertoAhora(now: Date = new Date(), tz = BUSINESS_TZ) {
  const { year, month, day, hour, minute } = getPartsInTZ(now, tz);
  const mins = hour*60 + minute;
  const todays = intervalsForYMD(year, month, day, tz).map(applyUltimaOrden);

  for (const [aS, bS] of todays) {
    const a = toMinutes(aS), b = toMinutes(bS);
    if (a <= b) { if (mins >= a && mins < b) return true; }
    else { if (mins >= a || mins < b) return true; } // overnight
  }
  // Tramos de AYER que cruzan medianoche:
  const yDate = new Date(Date.UTC(year, month-1, day));
  yDate.setUTCDate(yDate.getUTCDate()-1);
  const { year: y2, month: m2, day: d2 } = getPartsInTZ(yDate, tz);
  const yIntervals = intervalsForYMD(y2, m2, d2, tz).map(applyUltimaOrden);
  for (const [aS, bS] of yIntervals) {
    const a = toMinutes(aS), b = toMinutes(bS);
    if (a > b && mins < b) return true;
  }
  return false;
}

export function proximoCambio(now: Date = new Date(), tz = BUSINESS_TZ) {
  const parts = getPartsInTZ(now, tz);
  const nowM = parts.hour*60 + parts.minute;
  const isOpen = estaAbiertoAhora(now, tz);

  const days: { key:string, ints:Intervalo[] }[] = [];
  let c = new Date(now);
  for (let i=0;i<8;i++){
    const {year,month,day} = getPartsInTZ(c, tz);
    days.push({ key: ymd(year,month,day), ints: intervalsForYMD(year,month,day,tz).map(applyUltimaOrden) });
    c = new Date(c.getTime()+24*60*60*1000);
  }
  const fmtHuman = (key:string, hhmm:HHMM) => {
    const today = ymd(parts.year, parts.month, parts.day);
    const tmrwD = new Date(now.getTime()+24*60*60*1000);
    const tmrwP = getPartsInTZ(tmrwD, tz);
    const tmrw = ymd(tmrwP.year, tmrwP.month, tmrwP.day);
    const dia = key===today ? "hoy" : key===tmrw ? "mañana" : key;
    return `${dia} a las ${hhmm}`;
  };

  if (isOpen) {
    const today = days[0];
    for (const [aS,bS] of today.ints){
      const a=toMinutes(aS), b=toMinutes(bS);
      if (a<=b && nowM>=a && nowM<b) return { isOpen:true, nextClose:{ ymd:today.key, hhmm:bS, human:fmtHuman(today.key,bS) } };
      if (a>b && nowM>=a) {
        const tomo = days[1]?.key ?? today.key;
        return { isOpen:true, nextClose:{ ymd:tomo, hhmm:bS, human:fmtHuman(tomo,bS) } };
      }
      if (a>b && nowM<b) return { isOpen:true, nextClose:{ ymd:today.key, hhmm:bS, human:fmtHuman(today.key,bS) } };
    }
    return { isOpen:true, nextClose:null };
  }

  for (let i=0;i<days.length;i++){
    const d = days[i];
    for (const [aS] of d.ints){
      const a = toMinutes(aS);
      if (i===0 && a>nowM) return { isOpen:false, nextOpen:{ ymd:d.key, hhmm:aS, human:fmtHuman(d.key,aS) } };
      if (i>0) return { isOpen:false, nextOpen:{ ymd:d.key, hhmm:aS, human:fmtHuman(d.key,aS) } };
    }
  }
  return { isOpen:false, nextOpen:null };
}


// src/utils/deliveryTime.ts

export function getEstimatedDeliveryTime(date: Date, tipo: 'delivery' | 'retiro'): { range: string, arrivalTime: string, maxArrivalTime: string } {
  const day = date.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
  const hour = date.getHours();
  const minute = date.getMinutes();
  const time = hour * 60 + minute;

  // Helper para sumar minutos y devolver hora en formato HH:mm
  function addMinutesToTime(date: Date, minutes: number): string {
    const newDate = new Date(date.getTime() + minutes * 60000);
    const h = newDate.getHours().toString().padStart(2, '0');
    const m = newDate.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  let range = '';
  let minMinutes = 0;
  let maxMinutes = 0;

  if (tipo === 'delivery') {
    // Sábado
    if (day === 6) {
      if (time >= 13*60+30 && time < 15*60+30) { range = '30 a 50 min'; minMinutes = 30; maxMinutes = 50; }
      else if (time >= 15*60+30 && time < 19*60) { range = '30 a 45 min'; minMinutes = 30; maxMinutes = 45; }
      else if (time >= 19*60 && time < 22*60+30) { range = '60 a 80 min'; minMinutes = 60; maxMinutes = 80; }
    }
    // Viernes
    else if (day === 5) {
      if (time >= 18*60 && time < 19*60+30) { range = '30 a 50 min'; minMinutes = 30; maxMinutes = 50; }
      else if (time >= 19*60+30 && time < 21*60+30) { range = '60 a 90 min'; minMinutes = 60; maxMinutes = 90; }
      else if (time >= 21*60+30 && time < 22*60+30) { range = '30 a 50 min'; minMinutes = 30; maxMinutes = 50; }
    }
    // Jueves
    else if (day === 4) {
      if (time >= 18*60 && time < 19*60+30) { range = '30 a 50 min'; minMinutes = 30; maxMinutes = 50; }
      else if (time >= 19*60+30 && time < 21*60+30) { range = '50 a 70 min'; minMinutes = 50; maxMinutes = 70; }
      else if (time >= 21*60+30 && time < 22*60+30) { range = '30 a 50 min'; minMinutes = 30; maxMinutes = 50; }
    }
    // Lunes a Miércoles
    else if (day >= 1 && day <= 3) {
      if (time >= 18*60 && time < 19*60+30) { range = '30 a 45 min'; minMinutes = 30; maxMinutes = 45; }
      else if (time >= 19*60+30 && time < 21*60+30) { range = '45 a 60 min'; minMinutes = 45; maxMinutes = 60; }
      else if (time >= 21*60+30 && time < 22*60+30) { range = '30 a 45 min'; minMinutes = 30; maxMinutes = 45; }
    }
    else { range = 'Fuera de horario de reparto'; minMinutes = 0; maxMinutes = 0; }
  }
  else if (tipo === 'retiro') {
    // Sábado
    if (day === 6) {
      if (time >= 13*60+30 && time < 15*60+30) { range = '35 a 45 min'; minMinutes = 35; maxMinutes = 45; }
      else if (time >= 15*60+30 && time < 19*60) { range = '20 a 35 min'; minMinutes = 20; maxMinutes = 35; }
      else if (time >= 19*60 && time < 22*60+30) { range = '30 a 50 min'; minMinutes = 30; maxMinutes = 50; }
    }
    // Viernes
    else if (day === 5) {
      if (time >= 18*60 && time < 19*60+30) { range = '20 a 40 min'; minMinutes = 20; maxMinutes = 40; }
      else if (time >= 19*60+30 && time < 21*60+30) { range = '40 a 60 min'; minMinutes = 40; maxMinutes = 60; }
      else if (time >= 21*60+30 && time < 22*60+30) { range = '35 a 45 min'; minMinutes = 35; maxMinutes = 45; }
    }
    // Jueves
    else if (day === 4) {
      if (time >= 18*60 && time < 19*60+30) { range = '20 a 40 min'; minMinutes = 20; maxMinutes = 40; }
      else if (time >= 19*60+30 && time < 21*60+30) { range = '30 a 40 min'; minMinutes = 30; maxMinutes = 40; }
      else if (time >= 21*60+30 && time < 22*60+30) { range = '20 a 40 min'; minMinutes = 20; maxMinutes = 40; }
    }
    // Lunes a Miércoles
    else if (day >= 1 && day <= 3) {
      if (time >= 18*60 && time < 19*60+30) { range = '20 a 30 min'; minMinutes = 20; maxMinutes = 30; }
      else if (time >= 19*60+30 && time < 21*60+30) { range = '25 a 40 min'; minMinutes = 25; maxMinutes = 40; }
      else if (time >= 21*60+30 && time < 22*60+30) { range = '25 a 35 min'; minMinutes = 25; maxMinutes = 35; }
    }
    else { range = 'Fuera de horario de retiro'; minMinutes = 0; maxMinutes = 0; }
  }
  else {
    range = 'Fuera de horario';
    minMinutes = 0;
    maxMinutes = 0;
  }

  const arrivalTime = minMinutes > 0 ? addMinutesToTime(date, minMinutes) : '';
  const maxArrivalTime = maxMinutes > 0 ? addMinutesToTime(date, maxMinutes) : '';
  return { range, arrivalTime, maxArrivalTime };
}

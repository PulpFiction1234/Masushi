import { useRouter } from "next/router";
import { BIRTHDAY_DISCOUNT_PERCENT, BIRTHDAY_WEEK_LENGTH_DAYS } from "@/utils/birthday";

interface BirthdayReminderModalProps {
  open: boolean;
  onClose: () => void;
  onNeverShow: () => void;
  profileName?: string | null;
}

const formatGreeting = (name?: string | null) => {
  if (!name) return "Hola";
  const trimmed = name.trim();
  if (!trimmed) return "Hola";
  return `Hola, ${trimmed}`;
};

export default function BirthdayReminderModal({
  open,
  onClose,
  onNeverShow,
  profileName,
}: BirthdayReminderModalProps) {
  const router = useRouter();

  if (!open) return null;

  const goToProfile = () => {
    void router.push({ pathname: "/profile", query: { openBirthday: "1" } });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-8">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-gray-900/95 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-300">Cupón de cumpleaños</p>
            <h2 className="mt-2 text-xl font-semibold text-white">{formatGreeting(profileName)}</h2>
          </div>
          <button
            type="button"
            aria-label="Cerrar recordatorio"
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 transition hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="space-y-4 px-6 py-6 text-sm leading-relaxed text-gray-300">
          <p>
            Registra tu fecha de cumpleaños y desbloquea un descuento del {BIRTHDAY_DISCOUNT_PERCENT}% válido por una compra durante {BIRTHDAY_WEEK_LENGTH_DAYS} días alrededor de tu celebración.
          </p>
          <p>
            Solo puedes ingresarla una vez, así que asegúrate de que sea correcta. Podemos avisarte cuando el beneficio esté disponible.
          </p>
        </div>
        <div className="flex flex-col gap-3 border-t border-white/10 bg-gray-900/80 px-6 py-5 text-sm font-medium text-gray-200 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={goToProfile}
            className="flex-1 rounded-xl bg-green-500 px-4 py-2 text-gray-900 transition hover:bg-green-400 sm:flex-initial"
          >
            Agregar mi cumpleaños
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-gray-300 transition hover:bg-white/10"
          >
            Quizás después
          </button>
          <button
            type="button"
            onClick={onNeverShow}
            className="rounded-xl px-4 py-2 text-gray-400 transition hover:bg-white/10"
          >
            No mostrar más
          </button>
        </div>
      </div>
    </div>
  );
}

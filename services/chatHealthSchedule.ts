import {
  bookAppointment,
  formatTime,
  getAvailableSlots,
  getHealthUnits,
  localDayKey,
  type Appointment,
  type HealthSlot,
  type HealthUnit,
} from '@/services/healthApi';

export type ChatUiOption = { id: string; label: string; emoji?: string };

function dayLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
}

export async function loadChatUbsOptions(): Promise<{
  units: HealthUnit[];
  options: ChatUiOption[];
}> {
  const units = (await getHealthUnits({ type: 'UBS' })).filter(
    (unit) => unit.specialties.length > 0,
  );
  return {
    units,
    options: units.map((unit) => ({
      id: `pick-ubs-${unit.id}`,
      label: unit.neighborhood ? `${unit.name} (${unit.neighborhood})` : unit.name,
      emoji: '🏥',
    })),
  };
}

export function specialtyOptionsForUnit(unit: HealthUnit): ChatUiOption[] {
  return unit.specialties.map((specialty) => ({
    id: `pick-specialty-${encodeURIComponent(specialty)}`,
    label: specialty,
    emoji: '🩺',
  }));
}

export async function loadSlotsForChat(
  unitId: string,
  specialty: string,
): Promise<{
  slots: HealthSlot[];
  dateOptions: ChatUiOption[];
  slotsByDay: Record<string, HealthSlot[]>;
}> {
  const slots = await getAvailableSlots(unitId, {
    kind: 'CONSULTATION',
    specialty,
    days: 21,
  });
  const slotsByDay: Record<string, HealthSlot[]> = {};
  for (const slot of slots) {
    const key = localDayKey(slot.startsAt);
    if (!slotsByDay[key]) slotsByDay[key] = [];
    slotsByDay[key].push(slot);
  }
  const dateOptions = Object.keys(slotsByDay)
    .sort()
    .slice(0, 6)
    .map((key) => ({
      id: `pick-date-${key}`,
      label: dayLabel(key),
      emoji: '📅',
    }));
  return { slots, dateOptions, slotsByDay };
}

export function timeOptionsForDay(slots: HealthSlot[]): ChatUiOption[] {
  return [...slots]
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))
    .map((slot) => ({
      id: `pick-slot-${slot.id}`,
      label: formatTime(slot.startsAt),
      emoji: '⏰',
    }));
}

export async function bookChatAppointment(input: {
  slotId: string;
  patientName: string;
  patientCpf?: string;
  reason?: string;
}): Promise<Appointment> {
  return bookAppointment({
    slotId: input.slotId,
    patientName: input.patientName,
    patientCpf: input.patientCpf,
    reason: input.reason,
  });
}

export function briefDelay(ms = 650): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

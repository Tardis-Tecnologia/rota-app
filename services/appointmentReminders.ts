import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { formatSlotDateTime, kindLabel, type Appointment } from './healthApi';

const REMINDER_BEFORE_MS = 24 * 60 * 60 * 1000;
const ANDROID_CHANNEL = 'health-reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function reminderId(appointmentId: string): string {
  return `health-appointment-${appointmentId}`;
}

async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
      name: 'Lembretes de consulta',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/**
 * Agenda (ou reagenda) o lembrete local 24h antes do atendimento.
 * Retorna false quando não foi possível (sem permissão, web ou falta menos de 24h).
 */
export async function scheduleAppointmentReminder(appointment: Appointment): Promise<boolean> {
  try {
    await cancelAppointmentReminder(appointment.id);
    const fireAt = new Date(appointment.startsAt).getTime() - REMINDER_BEFORE_MS;
    if (fireAt <= Date.now() + 60_000) return false;
    if (!(await ensurePermission())) return false;
    await Notifications.scheduleNotificationAsync({
      identifier: reminderId(appointment.id),
      content: {
        title: `${kindLabel(appointment.kind)} amanhã: ${appointment.specialty}`,
        body: `${formatSlotDateTime(appointment.startsAt)} em ${appointment.unit.name}. Não pode ir? Remarque ou cancele pelo app para liberar a vaga.`,
        data: { appointmentId: appointment.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(fireAt),
        ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL } : {}),
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function cancelAppointmentReminder(appointmentId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(reminderId(appointmentId));
  } catch {
    // ignora: lembrete pode não existir
  }
}

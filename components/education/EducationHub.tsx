import CoursesSection from '@/components/education/CoursesSection';
import EnrollmentsComponent, { mockEnrollments } from '@/components/EnrollmentsComponent';
import ModalCompleteEnrollment from '@/components/ModalCompleteEnrollment';
import SearchEnrollmentComponent from '@/components/SearchEnrollmentComponent';
import { AppColors } from '@/constants/theme';
import {
  CALENDAR_LABEL,
  DECLARATION_LABEL,
  LEVEL_LABEL,
  NOTICE_LABEL,
  REQUEST_STATUS_LABEL,
  createEducationRequest,
  getCalendar,
  getMenus,
  getMyRequests,
  getMyStudent,
  getNotices,
  getRoutes,
  getSchools,
  type CalendarEvent,
  type School,
  type EducationRequest,
  type SchoolMenu,
  type SchoolNotice,
  type StudentRecord,
  type TransportRoute,
} from '@/services/educationServicesApi';
import {
  mockCalendar,
  mockMenus,
  mockNoticesFallback,
  mockRequests,
  mockRoutes,
  mockSchools,
  mockStudent,
  preferList,
} from '@/services/educationMocks';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

type ServiceKey =
  | 'prematricula'
  | 'digital'
  | 'my-enrollments'
  | 'vacancies'
  | 'tracking'
  | 'transfer'
  | 'daycare'
  | 'grades'
  | 'attendance'
  | 'calendar'
  | 'notices'
  | 'menu'
  | 'transport'
  | 'declarations'
  | 'documents'
  | 'map'
  | 'ombudsman'
  | 'courses';

const CATEGORIES: { title: string; items: { key: ServiceKey; title: string; description: string }[] }[] = [
  {
    title: 'Matrículas e vagas',
    items: [
      { key: 'digital', title: 'Matrícula digital', description: 'Aluno, escola e situação do pedido.' },
      { key: 'vacancies', title: 'Consulta de vagas', description: 'Escolas, séries e quantidade de vagas.' },
      { key: 'tracking', title: 'Acompanhar solicitação', description: 'Análise, pendência, fila ou deferimento.' },
      { key: 'my-enrollments', title: 'Minhas matrículas', description: 'Pré-matrículas já iniciadas.' },
      { key: 'transfer', title: 'Transferência escolar', description: 'Pedido para outra escola da rede.' },
      { key: 'daycare', title: 'Vaga em creche', description: 'Educação infantil e fila de espera.' },
    ],
  },
  {
    title: 'Vida escolar',
    items: [
      { key: 'grades', title: 'Boletim escolar', description: 'Disciplinas, notas e períodos.' },
      { key: 'attendance', title: 'Frequência e faltas', description: 'Presença, faltas e percentual.' },
      { key: 'calendar', title: 'Calendário escolar', description: 'Provas, reuniões, feriados e férias.' },
      { key: 'notices', title: 'Comunicados e avisos', description: 'Reuniões, suspensão e eventos.' },
      { key: 'menu', title: 'Alimentação escolar', description: 'Cardápio da merenda.' },
      { key: 'transport', title: 'Transporte escolar', description: 'Rota, escola e horários.' },
    ],
  },
  {
    title: 'Serviços e documentos',
    items: [
      { key: 'declarations', title: 'Solicitar declaração', description: 'Matrícula e escolaridade.' },
      { key: 'documents', title: 'Documentos escolares', description: 'Pedidos e status de cada documento.' },
      { key: 'map', title: 'Escolas próximas', description: 'Rede pública no mapa.' },
      { key: 'ombudsman', title: 'Ouvidoria educacional', description: 'Pedido, reclamação ou sugestão.' },
      { key: 'courses', title: 'Cursos da prefeitura', description: 'EJA, informática e idiomas.' },
    ],
  },
];

const SERVICE_TITLES = Object.fromEntries(
  CATEGORIES.flatMap((category) => category.items.map((item) => [item.key, item.title])),
) as Record<ServiceKey, string>;
SERVICE_TITLES.prematricula = 'Pré-matrícula';

export default function EducationHub() {
  const [service, setService] = useState<ServiceKey | null>(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState<(typeof mockEnrollments)[number] | null>(null);

  if (!service) {
    return (
      <ScrollView contentContainerStyle={styles.menu}>
        <Pressable style={styles.hero} onPress={() => setService('prematricula')}>
          <Text style={styles.heroKicker}>Matrícula 2026</Text>
          <Text style={styles.heroTitle}>Pré-matrícula</Text>
          <Text style={styles.heroText}>
            Escolha creche, fundamental ou médio e reserve a vaga na escola da rede.
          </Text>
          <Text style={styles.heroAction}>Começar pré-matrícula</Text>
        </Pressable>
        {CATEGORIES.map((category) => (
          <View key={category.title} style={styles.category}>
            <Text style={styles.categoryTitle}>{category.title}</Text>
            <View style={styles.grid}>
              {category.items.map((item) => (
                <Pressable key={item.key} style={styles.menuCard} onPress={() => setService(item.key)}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuDescription}>{item.description}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  }

  return (
    <View style={styles.panel}>
      <Pressable style={styles.backRow} onPress={() => setService(null)}>
        <Ionicons name="arrow-back" size={18} color={AppColors.primary} />
        <Text style={styles.backLabel}>{SERVICE_TITLES[service]}</Text>
      </Pressable>
      {service === 'prematricula' ? <SearchEnrollmentComponent /> : null}
      {service === 'my-enrollments' ? (
        <EnrollmentsComponent onSelectEnrollment={setSelectedEnrollment} />
      ) : null}
      {service === 'courses' ? <CoursesSection /> : null}
      {service !== 'prematricula' && service !== 'my-enrollments' && service !== 'courses' ? (
        <ServicePanel service={service} />
      ) : null}
      {selectedEnrollment ? (
        <View style={styles.modalOverlay}>
          <ModalCompleteEnrollment
            onClose={() => setSelectedEnrollment(null)}
            onSubmit={() => setSelectedEnrollment(null)}
            initialData={{ studentName: selectedEnrollment.studentName }}
          />
        </View>
      ) : null}
    </View>
  );
}

function ServicePanel({ service }: { service: Exclude<ServiceKey, 'courses'> }) {
  const [schools, setSchools] = useState<School[]>([]);
  const [requests, setRequests] = useState<EducationRequest[]>([]);
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [calendar, setCalendar] = useState<CalendarEvent[]>([]);
  const [menus, setMenus] = useState<SchoolMenu[]>([]);
  const [notices, setNotices] = useState<SchoolNotice[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [region, setRegion] = useState('');
  const [series, setSeries] = useState('');
  const [studentName, setStudentName] = useState('');
  const [message, setMessage] = useState('');
  const [targetSchoolId, setTargetSchoolId] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    const load = async () => {
      const needsStudent = ['grades', 'attendance', 'declarations', 'documents', 'digital'].includes(service);
      const needsRequests = ['tracking', 'digital', 'documents'].includes(service);
      const needsSchools = ['vacancies', 'daycare', 'transfer', 'map', 'digital'].includes(service);
      const [remoteSchools, remoteRequests, remoteStudent, remoteCalendar, remoteMenus, remoteNotices, remoteRoutes] =
        await Promise.all([
          needsSchools ? getSchools().catch(() => []) : Promise.resolve([]),
          needsRequests ? getMyRequests().catch(() => []) : Promise.resolve([]),
          needsStudent ? getMyStudent().catch(() => null) : Promise.resolve(null),
          service === 'calendar' ? getCalendar().catch(() => []) : Promise.resolve([]),
          service === 'menu' ? getMenus().catch(() => []) : Promise.resolve([]),
          service === 'notices' ? getNotices().catch(() => []) : Promise.resolve([]),
          service === 'transport' ? getRoutes().catch(() => []) : Promise.resolve([]),
        ]);
      if (!active) return;
      const schoolsPick = preferList(remoteSchools, mockSchools);
      const requestsPick = preferList(remoteRequests, mockRequests);
      const calendarPick = preferList(remoteCalendar, mockCalendar);
      const menusPick = preferList(remoteMenus, mockMenus);
      const noticesPick = preferList(remoteNotices, mockNoticesFallback);
      const routesPick = preferList(remoteRoutes, mockRoutes);
      setSchools(schoolsPick.items);
      setRequests(requestsPick.items);
      setStudent(remoteStudent ?? mockStudent);
      setCalendar(calendarPick.items);
      setMenus(menusPick.items);
      setNotices(noticesPick.items);
      setRoutes(routesPick.items);
    };
    load()
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Não foi possível carregar.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [service]);

  const vacancies = useMemo(() => {
    const level = service === 'daycare' ? 'INFANTIL' : '';
    return schools
      .filter((school) => !level || school.level === level)
      .filter((school) => !region.trim() || school.region.toLowerCase().includes(region.trim().toLowerCase()))
      .flatMap((school) =>
        school.vacancies
          .filter((vacancy) => !series.trim() || vacancy.series.toLowerCase().includes(series.trim().toLowerCase()))
          .map((vacancy) => ({ school, vacancy })),
      );
  }, [schools, region, series, service]);

  async function send(kind: string, extra?: { schoolId?: string; series?: string; targetSchoolId?: string }) {
    setError(null);
    setInfo(null);
    try {
      await createEducationRequest({
        kind,
        studentName: studentName.trim() || student?.name || 'Aluno',
        series: extra?.series || series.trim() || student?.series,
        schoolId: extra?.schoolId,
        targetSchoolId: extra?.targetSchoolId || targetSchoolId || undefined,
        message: message.trim() || undefined,
      });
      setInfo('Solicitação enviada. Acompanhe o status em Acompanhar solicitação.');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar.');
    }
  }

  if (loading) return <ActivityIndicator style={styles.loader} color={AppColors.primary} />;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {info ? <Text style={styles.info}>{info}</Text> : null}

      {service === 'digital' && student ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{student.name}</Text>
          <Text style={styles.cardBody}>{student.series} · {student.school.name}</Text>
          <Text style={styles.cardBody}>{student.school.region}</Text>
          {requests
            .filter((item) => item.kind === 'ENROLLMENT')
            .map((item) => (
              <Text key={item.id} style={styles.cardBody}>
                Pedido: {REQUEST_STATUS_LABEL[item.status] ?? item.status}
                {item.school ? ` · ${item.school.name}` : ''}
              </Text>
            ))}
        </View>
      ) : null}

      {service === 'documents' && (
        <>
          <StudentDeclarations student={student} />
          {requests
            .filter((item) => item.kind === 'DECLARATION' || item.kind === 'TRANSFER')
            .map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.cardTitle}>{item.kind === 'TRANSFER' ? 'Histórico para transferência' : 'Declaração'}</Text>
                <Text style={styles.cardBody}>{REQUEST_STATUS_LABEL[item.status] ?? item.status}</Text>
                {item.note ? <Text style={styles.cardBody}>{item.note}</Text> : null}
              </View>
            ))}
        </>
      )}

      {(service === 'vacancies' || service === 'daycare') && (
        <>
          <TextInput style={styles.input} placeholder="Região" value={region} onChangeText={setRegion} />
          <TextInput style={styles.input} placeholder="Série" value={series} onChangeText={setSeries} />
          <TextInput style={styles.input} placeholder="Nome do aluno" value={studentName} onChangeText={setStudentName} />
          {vacancies.map(({ school, vacancy }) => (
            <View key={vacancy.id} style={styles.card}>
              <Text style={styles.cardTitle}>{school.name}</Text>
              <Text style={styles.cardBody}>
                {school.region} · {LEVEL_LABEL[school.level]} · {vacancy.series} · {vacancy.shift}
              </Text>
              <Text style={styles.cardBody}>
                {vacancy.availableSeats} vagas · fila {vacancy.waitlist}
              </Text>
              <Pressable
                style={styles.button}
                onPress={() =>
                  send(service === 'daycare' ? 'DAYCARE' : 'ENROLLMENT', {
                    schoolId: school.id,
                    series: vacancy.series,
                  })
                }
              >
                <Text style={styles.buttonText}>
                  {service === 'daycare' ? 'Entrar na fila' : 'Solicitar vaga'}
                </Text>
              </Pressable>
            </View>
          ))}
          {!vacancies.length ? <Text style={styles.empty}>Nenhuma vaga para os filtros atuais.</Text> : null}
        </>
      )}

      {service === 'tracking' &&
        (requests.length ? (
          requests.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.cardTitle}>{item.studentName}</Text>
              <Text style={styles.cardBody}>
                {REQUEST_STATUS_LABEL[item.status] ?? item.status}
                {item.school ? ` · ${item.school.name}` : ''}
              </Text>
              {item.note ? <Text style={styles.cardBody}>{item.note}</Text> : null}
              {item.message ? <Text style={styles.cardBody}>{item.message}</Text> : null}
            </View>
          ))
        ) : (
          <Text style={styles.empty}>Você ainda não tem solicitações.</Text>
        ))}

      {service === 'transfer' && (
        <>
          <TextInput style={styles.input} placeholder="Nome do aluno" value={studentName} onChangeText={setStudentName} />
          <TextInput style={styles.input} placeholder="Série" value={series} onChangeText={setSeries} />
          <Text style={styles.label}>Escola de destino</Text>
          {schools.map((school) => (
            <Pressable key={school.id} style={styles.choice} onPress={() => setTargetSchoolId(school.id)}>
              <Text style={targetSchoolId === school.id ? styles.choiceActive : styles.cardBody}>{school.name}</Text>
            </Pressable>
          ))}
          <TextInput style={styles.input} placeholder="Motivo" value={message} onChangeText={setMessage} />
          <Pressable style={styles.button} onPress={() => send('TRANSFER', { targetSchoolId })}>
            <Text style={styles.buttonText}>Solicitar transferência</Text>
          </Pressable>
        </>
      )}

      {service === 'grades' && <StudentGrades student={student} />}
      {service === 'attendance' && <StudentAttendance student={student} />}

      {service === 'declarations' && (
        <>
          <StudentDeclarations student={student} />
          <TextInput style={styles.input} placeholder="Observação" value={message} onChangeText={setMessage} />
          <Pressable style={styles.button} onPress={() => send('DECLARATION')}>
            <Text style={styles.buttonText}>Solicitar declaração</Text>
          </Pressable>
        </>
      )}

      {service === 'calendar' &&
        calendar.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardBody}>{item.date} · {CALENDAR_LABEL[item.kind] ?? item.kind}</Text>
          </View>
        ))}

      {service === 'menu' &&
        menus.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.cardTitle}>{item.date} · {item.meal}</Text>
            <Text style={styles.cardBody}>{item.description}</Text>
          </View>
        ))}

      {service === 'notices' &&
        notices.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardBody}>{item.date} · {NOTICE_LABEL[item.kind] ?? item.kind}</Text>
            <Text style={styles.cardBody}>{item.body}</Text>
          </View>
        ))}

      {service === 'transport' && (
        <>
          {routes.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardBody}>
                {item.neighborhood} · {item.schoolName} · sai {item.departure} · chega {item.arrival}
              </Text>
            </View>
          ))}
          <TextInput style={styles.input} placeholder="Nome do aluno" value={studentName} onChangeText={setStudentName} />
          <TextInput style={styles.input} placeholder="Bairro ou observação" value={message} onChangeText={setMessage} />
          <Pressable style={styles.button} onPress={() => send('TRANSPORT')}>
            <Text style={styles.buttonText}>Solicitar transporte</Text>
          </Pressable>
        </>
      )}

      {service === 'map' && <SchoolsMap schools={schools} />}

      {service === 'ombudsman' && (
        <>
          <TextInput style={styles.input} placeholder="Seu nome" value={studentName} onChangeText={setStudentName} />
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Pedido, reclamação ou sugestão"
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <Pressable style={styles.button} onPress={() => send('OMBUDSMAN')}>
            <Text style={styles.buttonText}>Enviar à ouvidoria</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

function StudentGrades({ student }: { student: StudentRecord | null }) {
  if (!student) return <Text style={styles.empty}>Nenhum aluno vinculado a esta conta.</Text>;
  const average = student.grades.length
    ? student.grades.reduce((sum, grade) => sum + grade.grade, 0) / student.grades.length
    : 0;
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{student.name}</Text>
      <Text style={styles.cardBody}>{student.series} · {student.school.name}</Text>
      <Text style={styles.cardBody}>Média geral: {average.toFixed(1)}</Text>
      {student.grades.map((grade) => (
        <Text key={grade.id} style={styles.cardBody}>
          {grade.subject} · {grade.period} · {grade.grade.toFixed(1)}
        </Text>
      ))}
    </View>
  );
}

function StudentAttendance({ student }: { student: StudentRecord | null }) {
  if (!student) return <Text style={styles.empty}>Nenhum aluno vinculado a esta conta.</Text>;
  const presences = student.attendance.reduce((sum, item) => sum + item.presences, 0);
  const absences = student.attendance.reduce((sum, item) => sum + item.absences, 0);
  const total = presences + absences;
  const percent = total ? Math.round((presences / total) * 100) : 0;
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{student.name}</Text>
      <Text style={styles.cardBody}>Frequência no período: {percent}%</Text>
      <Text style={styles.cardBody}>{presences} presenças · {absences} faltas</Text>
      {student.attendance.map((item) => {
        const monthTotal = item.presences + item.absences;
        const monthPercent = monthTotal ? Math.round((item.presences / monthTotal) * 100) : 0;
        return (
          <Text key={item.id} style={styles.cardBody}>
            {item.month} · {item.presences} presenças · {item.absences} faltas · {monthPercent}%
          </Text>
        );
      })}
    </View>
  );
}

function StudentDeclarations({ student }: { student: StudentRecord | null }) {
  if (!student) return <Text style={styles.empty}>Nenhum aluno vinculado a esta conta.</Text>;
  return (
    <>
      {student.declarations.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.cardTitle}>{DECLARATION_LABEL[item.kind] ?? item.kind}</Text>
          <Text style={styles.cardBody}>{item.status === 'READY' ? 'Pronta para consulta' : 'Solicitada'}</Text>
          {item.body ? <Text style={styles.cardBody}>{item.body}</Text> : null}
        </View>
      ))}
    </>
  );
}

function SchoolsMap({ schools }: { schools: School[] }) {
  const html = useMemo(() => {
    const markers = schools
      .map(
        (school) =>
          `L.marker([${school.latitude}, ${school.longitude}]).addTo(map).bindPopup(${JSON.stringify(school.name)});`,
      )
      .join('');
    return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>html,body,#map{height:100%;margin:0}</style></head><body><div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>const map=L.map('map').setView([-22.93,-42.9],12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
      ${markers}</script></body></html>`;
  }, [schools]);
  return <WebView originWhitelist={['*']} source={{ html }} style={styles.map} />;
}

const styles = StyleSheet.create({
  menu: { padding: 16, gap: 16 },
  hero: {
    backgroundColor: AppColors.primary,
    borderRadius: 20,
    padding: 18,
    gap: 6,
  },
  heroKicker: { color: '#dbeafe', fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
  heroTitle: { color: AppColors.text.white, fontSize: 26, fontWeight: '800' },
  heroText: { color: '#e0f2fe', fontSize: 14, lineHeight: 20 },
  heroAction: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: AppColors.text.white,
    color: AppColors.primary,
    fontWeight: '800',
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  category: { gap: 10 },
  categoryTitle: { fontSize: 13, fontWeight: '800', color: AppColors.text.tertiary, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  menuCard: {
    width: '48%',
    backgroundColor: AppColors.background.default,
    borderRadius: 16,
    padding: 14,
    minHeight: 96,
  },
  menuTitle: { fontSize: 15, fontWeight: '700', color: AppColors.text.secondary },
  menuDescription: { marginTop: 4, fontSize: 12, color: AppColors.text.tertiary },
  modalOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  panel: { flex: 1 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  backLabel: { fontSize: 16, fontWeight: '700', color: AppColors.text.secondary },
  content: { padding: 16, gap: 10, paddingBottom: 32 },
  loader: { marginTop: 32 },
  input: {
    backgroundColor: AppColors.background.default,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: AppColors.text.secondary,
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  card: { backgroundColor: AppColors.background.default, borderRadius: 16, padding: 14, gap: 4 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: AppColors.text.secondary },
  cardBody: { fontSize: 13, color: AppColors.text.tertiary },
  button: { marginTop: 8, backgroundColor: AppColors.primary, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  buttonText: { color: AppColors.text.white, fontWeight: '700' },
  empty: { color: AppColors.text.tertiary, fontSize: 14 },
  error: { color: '#b91c1c' },
  info: { color: '#047857' },
  label: { fontSize: 13, fontWeight: '700', color: AppColors.text.secondary },
  choice: { paddingVertical: 4 },
  choiceActive: { fontSize: 13, fontWeight: '700', color: AppColors.primary },
  map: { height: 420, borderRadius: 16, overflow: 'hidden' },
});

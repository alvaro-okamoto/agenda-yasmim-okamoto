import React, { useMemo, useState } from "react";

type Location = {
  id: string;
  name: string;
};

type Patient = {
  id: string;
  name: string;
  phone: string;
  defaultLocationId: string;
  frequency: string;
  status: string;
  notes: string;
};

type Appointment = {
  id: string;
  patientId: string;
  type: string;
  locationId: string;
  date: string;
  time: string;
  duration: number;
  status: string;
  notes: string;
  recurrenceGroupId?: string;
  recurrenceLabel?: string;
};

type CompanyBlock = {
  id: string;
  companyName: string;
  locationId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  notes: string;
  active: boolean;
};

type EnrichedAppointment = Appointment & {
  patient?: Patient;
  location?: Location;
};

type AgendaEvent =
  | {
      id: string;
      kind: "appointment";
      date: string;
      startTime: string;
      endTime: string;
      title: string;
      subtitle: string;
      locationId: string;
      status?: string;
      sourceAppointment?: EnrichedAppointment;
    }
  | {
      id: string;
      kind: "company";
      date: string;
      startTime: string;
      endTime: string;
      title: string;
      subtitle: string;
      locationId: string;
      notes?: string;
      sourceCompany?: CompanyBlock;
    };

type RecurrenceDay = {
  weekday: number;
  label: string;
  selected: boolean;
  times: string[];
};

type NewAppointmentState = {
  patientId: string;
  type: string;
  locationId: string;
  date: string;
  time: string;
  duration: number;
  status: string;
  notes: string;
  scheduleMode: "single" | "recurring";
  recurrenceWeeks: number;
  recurrenceDays: RecurrenceDay[];
};

type ToastState = {
  open: boolean;
  type: "success" | "error";
  message: string;
};

type ReturnTarget = null | "monthly" | "patient" | "location";

type CompanyFormState = {
  companyName: string;
  locationId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  notes: string;
  active: boolean;
};

const colors = {
  bg: "#f5f7fb",
  card: "#ffffff",
  cardSoft: "#fbfdff",
  border: "#d9e4f1",
  borderStrong: "#c7d5e6",
  text: "#0f172a",
  subtext: "#61748f",
  primary: "#0f172a",
  primaryText: "#ffffff",
  soft: "#f4f8fd",
  softBlue: "#eef5ff",
  successBg: "#ecfdf5",
  successText: "#047857",
  dangerBg: "#fef2f2",
  dangerText: "#b91c1c",
  freeBg: "#eefcf4",
  freeBorder: "#bfeccf",
  warningBg: "#fff7ed",
  warningText: "#c2410c",
  companyBg: "#f8f1ff",
  companyBorder: "#e9d5ff",
  companyText: "#7c3aed",
  shadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
};

const locationsSeed: Location[] = [
  { id: "l1", name: "Clínica X" },
  { id: "l2", name: "Consultório" },
  { id: "l3", name: "Atendimento domiciliar" },
];

const patientsSeed: Patient[] = [
  {
    id: "p1",
    name: "Ana Souza",
    phone: "79 99999-1111",
    defaultLocationId: "l1",
    frequency: "Semanal",
    status: "Ativo",
    notes: "Paciente infantil",
  },
  {
    id: "p2",
    name: "João Pedro",
    phone: "79 99999-2222",
    defaultLocationId: "l2",
    frequency: "Avulso",
    status: "Ativo",
    notes: "Primeira avaliação",
  },
  {
    id: "p3",
    name: "Marina Lima",
    phone: "79 99999-3333",
    defaultLocationId: "l1",
    frequency: "Semanal",
    status: "Ativo",
    notes: "Integração sensorial",
  },
];

const appointmentsSeed: Appointment[] = [
  {
    id: "a1",
    patientId: "p1",
    type: "Sessão",
    locationId: "l1",
    date: "2026-04-01",
    time: "08:00",
    duration: 50,
    status: "Confirmado",
    notes: "Quarta pela manhã",
    recurrenceLabel: "Único",
  },
  {
    id: "a2",
    patientId: "p3",
    type: "Sessão",
    locationId: "l1",
    date: "2026-04-01",
    time: "10:00",
    duration: 50,
    status: "Agendado",
    notes: "Paciente fixo",
    recurrenceLabel: "Único",
  },
  {
    id: "a3",
    patientId: "p2",
    type: "Anamnese",
    locationId: "l2",
    date: "2026-04-01",
    time: "14:00",
    duration: 60,
    status: "Agendado",
    notes: "Atendimento particular",
    recurrenceLabel: "Único",
  },
  {
    id: "a4",
    patientId: "p1",
    type: "Sessão",
    locationId: "l1",
    date: "2026-04-08",
    time: "08:00",
    duration: 50,
    status: "Agendado",
    notes: "Próxima semana",
    recurrenceLabel: "Recorrente • Quarta",
  },
];

const companyBlocksSeed: CompanyBlock[] = [
  {
    id: "c1",
    companyName: "Consultório Y",
    locationId: "l2",
    weekday: 3,
    startTime: "13:00",
    endTime: "18:00",
    notes: "Prestação de serviço fixa",
    active: true,
  },
  {
    id: "c2",
    companyName: "Consultório H",
    locationId: "l1",
    weekday: 1,
    startTime: "08:00",
    endTime: "11:30",
    notes: "Atendimento fixo semanal",
    active: true,
  },
];

const weekdayLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const weekdayFullLabels = [
  "",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];

const recurrenceWeekdaysSeed: RecurrenceDay[] = [
  { weekday: 1, label: "Segunda", selected: false, times: ["08:00"] },
  { weekday: 2, label: "Terça", selected: false, times: ["08:00"] },
  { weekday: 3, label: "Quarta", selected: false, times: ["08:00"] },
  { weekday: 4, label: "Quinta", selected: false, times: ["08:00"] },
  { weekday: 5, label: "Sexta", selected: false, times: ["08:00"] },
  { weekday: 6, label: "Sábado", selected: false, times: ["08:00"] },
];

const hourSlots = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

const locationTheme: Record<
  string,
  {
    bg: string;
    border: string;
    text: string;
  }
> = {
  l1: {
    bg: "#eff6ff",
    border: "#bfdbfe",
    text: "#1d4ed8",
  },
  l2: {
    bg: "#f5f3ff",
    border: "#ddd6fe",
    text: "#6d28d9",
  },
  l3: {
    bg: "#fff7ed",
    border: "#fed7aa",
    text: "#c2410c",
  },
  default: {
    bg: "#f8fafc",
    border: "#dbe2ea",
    text: "#475569",
  },
};

function getLocationTheme(locationId?: string) {
  if (!locationId) return locationTheme.default;
  return locationTheme[locationId] || locationTheme.default;
}

function nextId(prefix: string) {
  return `${prefix}${Math.random().toString(36).slice(2, 8)}`;
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateLong(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getNextOccurrenceDate(startDate: string, weekday: number) {
  const base = new Date(`${startDate}T00:00:00`);
  const currentWeekday = base.getDay();
  const normalizedCurrent = currentWeekday === 0 ? 7 : currentWeekday;
  const diff = weekday - normalizedCurrent;
  const next = new Date(base);
  next.setDate(base.getDate() + (diff >= 0 ? diff : diff + 7));
  return next;
}

function summarizeFreeWindows(items: Array<{ startTime: string }>) {
  const occupied = new Set(items.map((item) => item.startTime));
  const freeSlots = hourSlots.filter((hour) => !occupied.has(hour));
  if (freeSlots.length === 0) return "Sem horários livres";

  const ranges: string[] = [];
  let start = freeSlots[0];
  let prevIndex = hourSlots.indexOf(freeSlots[0]);

  for (let i = 1; i < freeSlots.length; i++) {
    const currentIndex = hourSlots.indexOf(freeSlots[i]);
    if (currentIndex !== prevIndex + 1) {
      ranges.push(
        start === hourSlots[prevIndex]
          ? `${start} livre`
          : `${start} às ${hourSlots[prevIndex]} livre`
      );
      start = freeSlots[i];
    }
    prevIndex = currentIndex;
  }

  ranges.push(
    start === hourSlots[prevIndex]
      ? `${start} livre`
      : `${start} às ${hourSlots[prevIndex]} livre`
  );

  return ranges.slice(0, 2).join(" • ");
}

function timeToMinutes(value: string) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function addMinutes(time: string, minutes: number) {
  const total = timeToMinutes(time) + minutes;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function isTimeWithinSlot(slot: string, startTime: string, endTime: string) {
  const slotMinutes = timeToMinutes(slot);
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  return slotMinutes >= startMinutes && slotMinutes < endMinutes;
}

function createDefaultAppointmentState(
  selectedDate: string,
  patientId = patientsSeed[0]?.id || "",
  locationId = locationsSeed[0]?.id || "l1"
): NewAppointmentState {
  return {
    patientId,
    type: "Sessão",
    locationId,
    date: selectedDate,
    time: "08:00",
    duration: 50,
    status: "Agendado",
    notes: "",
    scheduleMode: "single",
    recurrenceWeeks: 4,
    recurrenceDays: recurrenceWeekdaysSeed.map((day) => ({
      ...day,
      times: [...day.times],
    })),
  };
}

function createDefaultCompanyForm(locationId = locationsSeed[0]?.id || "l1"): CompanyFormState {
  return {
    companyName: "",
    locationId,
    weekday: 1,
    startTime: "08:00",
    endTime: "12:00",
    notes: "",
    active: true,
  };
}

function useWindowWidth() {
  const [width, setWidth] = React.useState(window.innerWidth);

  React.useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return width;
}

function Modal({
  open,
  title,
  description,
  children,
  onClose,
  onBack,
}: {
  open: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
  onBack?: () => void;
}) {
  if (!open) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {onBack ? (
              <button style={styles.iconButton} onClick={onBack} title="Voltar">
                ←
              </button>
            ) : null}
            <div>
              <h3 style={styles.modalTitle}>{title}</h3>
              {description ? <p style={styles.modalDescription}>{description}</p> : null}
            </div>
          </div>

          <button style={styles.iconButton} onClick={onClose} title="Fechar">
            ✕
          </button>
        </div>

        <div style={{ marginTop: 20 }}>{children}</div>
      </div>
    </div>
  );
}

function SectionCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return <div style={{ ...styles.card, ...style }}>{children}</div>;
}

function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "success" | "danger" | "soft";
}) {
  const toneStyles: Record<string, React.CSSProperties> = {
    default: {
      background: colors.soft,
      color: colors.text,
      border: `1px solid ${colors.border}`,
    },
    success: {
      background: colors.successBg,
      color: colors.successText,
      border: "1px solid #a7f3d0",
    },
    danger: {
      background: colors.dangerBg,
      color: colors.dangerText,
      border: "1px solid #fecaca",
    },
    soft: {
      background: "#ffffff",
      color: colors.subtext,
      border: `1px solid ${colors.border}`,
    },
  };

  return <span style={{ ...styles.badge, ...toneStyles[tone] }}>{children}</span>;
}

const statusTone = (status?: string): "default" | "success" | "danger" => {
  if (status === "Confirmado" || status === "Realizado") return "success";
  if (status === "Cancelado") return "danger";
  return "default";
};

export default function App() {
  const width = useWindowWidth();
  const isMobile = width < 900;
  const isSmallMobile = width < 640;

  const [locations, setLocations] = useState<Location[]>(locationsSeed);
  const [patients, setPatients] = useState<Patient[]>(patientsSeed);
  const [appointments, setAppointments] = useState<Appointment[]>(appointmentsSeed);
  const [companyBlocks, setCompanyBlocks] = useState<CompanyBlock[]>(companyBlocksSeed);

  const [tab, setTab] = useState("agenda");
  const [calendarView, setCalendarView] = useState("week");
  const [selectedDate, setSelectedDate] = useState("2026-04-01");
  const [search, setSearch] = useState("");

  const [selectedAppointment, setSelectedAppointment] =
    useState<EnrichedAppointment | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedCompanyBlock, setSelectedCompanyBlock] = useState<CompanyBlock | null>(null);

  const [appointmentReturnTo, setAppointmentReturnTo] = useState<ReturnTarget>(null);
  const [patientReturnTo, setPatientReturnTo] = useState<ReturnTarget>(null);

  const [patientDialogOpen, setPatientDialogOpen] = useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [monthlyOpen, setMonthlyOpen] = useState(false);

  const [manageLocationsOpen, setManageLocationsOpen] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [locationFormName, setLocationFormName] = useState("");
  const [deleteLocationTarget, setDeleteLocationTarget] = useState<Location | null>(null);

  const [companyManagerOpen, setCompanyManagerOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [companyForm, setCompanyForm] = useState<CompanyFormState>(
    createDefaultCompanyForm()
  );
  const [deleteCompanyTarget, setDeleteCompanyTarget] = useState<CompanyBlock | null>(null);

  const [monthlyPatientDetails, setMonthlyPatientDetails] = useState<{
    name: string;
    appointments: EnrichedAppointment[];
  } | null>(null);

  const [toast, setToast] = useState<ToastState>({
    open: false,
    type: "success",
    message: "",
  });

  const [newPatient, setNewPatient] = useState({
    name: "",
    phone: "",
    defaultLocationId: "l1",
    frequency: "Semanal",
    status: "Ativo",
    notes: "",
  });

  const [newAppointment, setNewAppointment] = useState<NewAppointmentState>(
    createDefaultAppointmentState(selectedDate)
  );

  const [rescheduleForm, setRescheduleForm] = useState({
    date: "2026-04-01",
    time: "08:00",
    locationId: "l1",
    notes: "",
  });

  function showToast(type: "success" | "error", message: string) {
    setToast({ open: true, type, message });
    window.setTimeout(
      () => setToast({ open: false, type: "success", message: "" }),
      2500
    );
  }

  const enrichedAppointments = useMemo<EnrichedAppointment[]>(() => {
    return appointments.map((a) => ({
      ...a,
      patient: patients.find((p) => p.id === a.patientId),
      location: locations.find((l) => l.id === a.locationId),
    }));
  }, [appointments, patients, locations]);

  const generatedCompanyEvents = useMemo<AgendaEvent[]>(() => {
    const datesNeeded = new Set<string>();
    const base = new Date(`${selectedDate}T00:00:00`);

    datesNeeded.add(toIsoDate(base));

    const diffToMonday = base.getDay() === 0 ? -6 : 1 - base.getDay();
    const monday = new Date(base);
    monday.setDate(base.getDate() + diffToMonday);
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      datesNeeded.add(toIsoDate(d));
    }

    const first = new Date(base.getFullYear(), base.getMonth(), 1);
    const last = new Date(base.getFullYear(), base.getMonth() + 1, 0);
    const cursor = new Date(first);
    while (cursor <= last) {
      datesNeeded.add(toIsoDate(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    const result: AgendaEvent[] = [];
    Array.from(datesNeeded).forEach((dateStr) => {
      const d = new Date(`${dateStr}T00:00:00`);
      const weekday = d.getDay() === 0 ? 7 : d.getDay();

      companyBlocks
        .filter((block) => block.active && block.weekday === weekday)
        .forEach((block) => {
          const location = locations.find((loc) => loc.id === block.locationId);
          result.push({
            id: `company-${block.id}-${dateStr}`,
            kind: "company",
            date: dateStr,
            startTime: block.startTime,
            endTime: block.endTime,
            title: block.companyName,
            subtitle: `${location?.name || "Local"} • Empresa`,
            locationId: block.locationId,
            notes: block.notes,
            sourceCompany: block,
          });
        });
    });

    return result.sort((a, b) =>
      `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)
    );
  }, [companyBlocks, locations, selectedDate]);

  const agendaEvents = useMemo<AgendaEvent[]>(() => {
    const appointmentEvents: AgendaEvent[] = enrichedAppointments.map((appt) => ({
      id: `appointment-${appt.id}`,
      kind: "appointment",
      date: appt.date,
      startTime: appt.time,
      endTime: addMinutes(appt.time, appt.duration),
      title: appt.patient?.name || "Paciente",
      subtitle: `${appt.location?.name || "Local"} • ${appt.type}`,
      locationId: appt.locationId,
      status: appt.status,
      sourceAppointment: appt,
    }));

    return [...appointmentEvents, ...generatedCompanyEvents];
  }, [enrichedAppointments, generatedCompanyEvents]);

  const filteredAgendaEvents = useMemo(() => {
    return agendaEvents.filter((event) => {
      if (!search.trim()) return true;
      const query = search.toLowerCase();
      return (
        event.title.toLowerCase().includes(query) ||
        event.subtitle.toLowerCase().includes(query)
      );
    });
  }, [agendaEvents, search]);

  const stats = useMemo(() => {
    const today = filteredAgendaEvents.filter((a) => a.date === selectedDate);
    return {
      total: today.length,
      confirmed: today.filter((a) => a.kind === "appointment" && a.status === "Confirmado")
        .length,
      pending: today.filter((a) => a.kind === "appointment" && a.status === "Agendado")
        .length,
      companies: today.filter((a) => a.kind === "company").length,
    };
  }, [filteredAgendaEvents, selectedDate]);

  const dayEvents = useMemo(() => {
    return filteredAgendaEvents
      .filter((a) => a.date === selectedDate)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [filteredAgendaEvents, selectedDate]);

  const daySchedule = useMemo(() => {
    return hourSlots.map((hour) => ({
      hour,
      events: dayEvents.filter((event) =>
        event.kind === "company"
          ? isTimeWithinSlot(hour, event.startTime, event.endTime)
          : event.startTime === hour
      ),
    }));
  }, [dayEvents]);

  const weekDates = useMemo(() => {
    const base = new Date(`${selectedDate}T00:00:00`);
    const diffToMonday = base.getDay() === 0 ? -6 : 1 - base.getDay();
    const monday = new Date(base);
    monday.setDate(base.getDate() + diffToMonday);

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return {
        iso: toIsoDate(d),
        dayNumber: d.getDate(),
        label: weekdayLabels[i],
      };
    });
  }, [selectedDate]);

  const monthDates = useMemo(() => {
    const base = new Date(`${selectedDate}T00:00:00`);
    const first = new Date(base.getFullYear(), base.getMonth(), 1);
    const last = new Date(base.getFullYear(), base.getMonth() + 1, 0);

    const start = new Date(first);
    start.setDate(first.getDate() + (start.getDay() === 0 ? -6 : 1 - start.getDay()));

    const end = new Date(last);
    end.setDate(last.getDate() + (end.getDay() === 0 ? 0 : 7 - end.getDay()));

    const list: Array<{ iso: string; dayNumber: number; currentMonth: boolean }> = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      list.push({
        iso: toIsoDate(cursor),
        dayNumber: cursor.getDate(),
        currentMonth: cursor.getMonth() === base.getMonth(),
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return list;
  }, [selectedDate]);

  const eventsByDate = useMemo(() => {
    return filteredAgendaEvents.reduce<Record<string, AgendaEvent[]>>((acc, event) => {
      if (!acc[event.date]) acc[event.date] = [];
      acc[event.date].push(event);
      acc[event.date].sort((a, b) => a.startTime.localeCompare(b.startTime));
      return acc;
    }, {});
  }, [filteredAgendaEvents]);

  const monthlySummaryByPatient = useMemo(() => {
    const monthPrefix = selectedDate.slice(0, 7);
    const scoped = enrichedAppointments.filter((appt) => appt.date.startsWith(monthPrefix));

    const grouped = scoped.reduce<
      Record<
        string,
        {
          name: string;
          appointments: EnrichedAppointment[];
          total: number;
          completed: number;
          pending: number;
        }
      >
    >((acc, appt) => {
      const key = appt.patientId;
      if (!acc[key]) {
        acc[key] = {
          name: appt.patient?.name || "Paciente",
          appointments: [],
          total: 0,
          completed: 0,
          pending: 0,
        };
      }

      acc[key].appointments.push(appt);
      acc[key].total += 1;
      if (appt.status === "Realizado") acc[key].completed += 1;
      if (appt.status === "Agendado" || appt.status === "Confirmado") {
        acc[key].pending += 1;
      }

      acc[key].appointments.sort((a, b) =>
        `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
      );

      return acc;
    }, {});

    return Object.values(grouped).sort(
      (a, b) => b.total - a.total || a.name.localeCompare(b.name)
    );
  }, [enrichedAppointments, selectedDate]);

  const recurrenceSelection = useMemo(() => {
    const selectedDays = newAppointment.recurrenceDays.filter((day) => day.selected);
    const validDays = selectedDays.filter(
      (day) => day.times.filter((time) => time.trim()).length > 0
    );
    const sessionsPerWeek = validDays.reduce(
      (acc, day) => acc + day.times.filter((time) => time.trim()).length,
      0
    );

    return {
      selectedDays,
      validDays,
      sessionsPerWeek,
      totalAppointments: sessionsPerWeek * Number(newAppointment.recurrenceWeeks || 0),
    };
  }, [newAppointment]);

  const selectedPatientAppointments = useMemo(() => {
    if (!selectedPatient) return [];
    return enrichedAppointments
      .filter((appt) => appt.patientId === selectedPatient.id)
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  }, [selectedPatient, enrichedAppointments]);

  const selectedLocationAppointments = useMemo(() => {
    if (!selectedLocation) return [];
    return agendaEvents
      .filter((evt) => evt.locationId === selectedLocation.id)
      .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  }, [selectedLocation, agendaEvents]);

  const selectedLocationPatients = useMemo(() => {
    if (!selectedLocation) return [];
    const ids = Array.from(
      new Set(
        enrichedAppointments
          .filter((appt) => appt.locationId === selectedLocation.id)
          .map((appt) => appt.patientId)
      )
    );
    return ids
      .map((id) => patients.find((patient) => patient.id === id))
      .filter(Boolean) as Patient[];
  }, [selectedLocation, enrichedAppointments, patients]);

  const deleteLocationAppointments = useMemo(() => {
    if (!deleteLocationTarget) return [];
    return agendaEvents.filter((evt) => evt.locationId === deleteLocationTarget.id);
  }, [deleteLocationTarget, agendaEvents]);

  const deleteLocationPatients = useMemo(() => {
    if (!deleteLocationTarget) return [];
    const ids = Array.from(
      new Set(
        enrichedAppointments
          .filter((appt) => appt.locationId === deleteLocationTarget.id)
          .map((appt) => appt.patientId)
      )
    );
    return ids
      .map((id) => patients.find((patient) => patient.id === id))
      .filter(Boolean) as Patient[];
  }, [deleteLocationTarget, enrichedAppointments, patients]);

  function resetAppointmentForm() {
    setNewAppointment(
      createDefaultAppointmentState(
        selectedDate,
        patients[0]?.id || "",
        locations[0]?.id || "l1"
      )
    );
  }

  function resetCompanyForm() {
    setCompanyForm(createDefaultCompanyForm(locations[0]?.id || "l1"));
    setEditingCompanyId(null);
  }

  function createPatient() {
    if (!newPatient.name.trim()) {
      return showToast("error", "Informe o nome do paciente.");
    }

    setPatients((prev) => [...prev, { ...newPatient, id: nextId("p") }]);
    setNewPatient({
      name: "",
      phone: "",
      defaultLocationId: locations[0]?.id || "l1",
      frequency: "Semanal",
      status: "Ativo",
      notes: "",
    });
    setPatientDialogOpen(false);
    showToast("success", "Paciente cadastrado com sucesso.");
  }

  function toggleRecurrenceDay(weekday: number) {
    setNewAppointment((prev) => ({
      ...prev,
      recurrenceDays: prev.recurrenceDays.map((day) =>
        day.weekday === weekday
          ? {
              ...day,
              selected: !day.selected,
              times: day.times.length > 0 ? day.times : [prev.time || "08:00"],
            }
          : day
      ),
    }));
  }

  function updateRecurrenceTime(weekday: number, timeIndex: number, value: string) {
    setNewAppointment((prev) => ({
      ...prev,
      recurrenceDays: prev.recurrenceDays.map((day) =>
        day.weekday === weekday
          ? {
              ...day,
              times: day.times.map((time, index) =>
                index === timeIndex ? value : time
              ),
            }
          : day
      ),
    }));
  }

  function addRecurrenceTime(weekday: number) {
    setNewAppointment((prev) => ({
      ...prev,
      recurrenceDays: prev.recurrenceDays.map((day) =>
        day.weekday === weekday
          ? {
              ...day,
              times: [...day.times, day.times[day.times.length - 1] || "08:00"],
            }
          : day
      ),
    }));
  }

  function removeRecurrenceTime(weekday: number, timeIndex: number) {
    setNewAppointment((prev) => ({
      ...prev,
      recurrenceDays: prev.recurrenceDays.map((day) => {
        if (day.weekday !== weekday) return day;
        if (day.times.length === 1) return day;
        return {
          ...day,
          times: day.times.filter((_, index) => index !== timeIndex),
        };
      }),
    }));
  }

  function createSingleAppointment() {
    if (!newAppointment.patientId || !newAppointment.date || !newAppointment.time) {
      return showToast("error", "Preencha paciente, data e horário.");
    }

    setAppointments((prev) => [
      ...prev,
      {
        id: nextId("a"),
        patientId: newAppointment.patientId,
        type: newAppointment.type,
        locationId: newAppointment.locationId,
        date: newAppointment.date,
        time: newAppointment.time,
        duration: Number(newAppointment.duration),
        status: newAppointment.status,
        notes: newAppointment.notes,
        recurrenceLabel: "Único",
      },
    ]);

    setAppointmentDialogOpen(false);
    resetAppointmentForm();
    showToast("success", "Agendamento salvo com sucesso.");
  }

  function createRecurringAppointments() {
    if (!newAppointment.patientId || !newAppointment.date) {
      return showToast("error", "Preencha paciente e data inicial.");
    }

    if (newAppointment.recurrenceWeeks < 1) {
      return showToast("error", "Informe pelo menos 1 semana.");
    }

    if (recurrenceSelection.validDays.length === 0) {
      return showToast("error", "Selecione ao menos um dia e um horário válido.");
    }

    const groupId = nextId("rg");
    const generated: Appointment[] = [];

    recurrenceSelection.validDays.forEach((day) => {
      const firstDate = getNextOccurrenceDate(newAppointment.date, day.weekday);

      day.times
        .filter((time) => time.trim())
        .forEach((time) => {
          for (let week = 0; week < Number(newAppointment.recurrenceWeeks); week++) {
            const occurrenceDate = new Date(firstDate);
            occurrenceDate.setDate(firstDate.getDate() + week * 7);

            generated.push({
              id: nextId("a"),
              patientId: newAppointment.patientId,
              type: newAppointment.type,
              locationId: newAppointment.locationId,
              date: toIsoDate(occurrenceDate),
              time,
              duration: Number(newAppointment.duration),
              status: newAppointment.status,
              notes: newAppointment.notes,
              recurrenceGroupId: groupId,
              recurrenceLabel: `Recorrente • ${day.label}`,
            });
          }
        });
    });

    generated.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    setAppointments((prev) => [...prev, ...generated]);
    setAppointmentDialogOpen(false);
    resetAppointmentForm();
    showToast(
      "success",
      `${generated.length} agendamento(s) recorrente(s) criado(s) com sucesso.`
    );
  }

  function createAppointment() {
    if (newAppointment.scheduleMode === "single") createSingleAppointment();
    else createRecurringAppointments();
  }

  function openMonthly(patient: {
    name: string;
    appointments: EnrichedAppointment[];
  }) {
    setMonthlyPatientDetails(patient);
    setMonthlyOpen(true);
  }

  function openAppointment(appt: EnrichedAppointment, returnTo: ReturnTarget = null) {
    setAppointmentReturnTo(returnTo);
    setSelectedAppointment(appt);
  }

  function openPatient(patient: Patient, returnTo: ReturnTarget = null) {
    setPatientReturnTo(returnTo);
    setSelectedPatient(patient);
  }

  function handleBackFromAppointment() {
    setSelectedAppointment(null);
    if (appointmentReturnTo === "monthly" && monthlyPatientDetails) setMonthlyOpen(true);
    if (appointmentReturnTo === "patient" && selectedPatient) setSelectedPatient(selectedPatient);
    setAppointmentReturnTo(null);
  }

  function handleBackFromPatient() {
    setSelectedPatient(null);
    setPatientReturnTo(null);
  }

  function openRescheduleDialog() {
    if (!selectedAppointment) return;
    setRescheduleForm({
      date: selectedAppointment.date,
      time: selectedAppointment.time,
      locationId: selectedAppointment.locationId,
      notes: selectedAppointment.notes || "",
    });
    setRescheduleDialogOpen(true);
  }

  function saveReschedule() {
    if (!selectedAppointment) return;

    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === selectedAppointment.id
          ? {
              ...appt,
              date: rescheduleForm.date,
              time: rescheduleForm.time,
              locationId: rescheduleForm.locationId,
              notes: rescheduleForm.notes,
              status: appt.status === "Cancelado" ? "Agendado" : appt.status,
            }
          : appt
      )
    );

    setSelectedAppointment((prev) =>
      prev
        ? {
            ...prev,
            date: rescheduleForm.date,
            time: rescheduleForm.time,
            locationId: rescheduleForm.locationId,
            notes: rescheduleForm.notes,
            location: locations.find((l) => l.id === rescheduleForm.locationId),
            status: prev.status === "Cancelado" ? "Agendado" : prev.status,
          }
        : prev
    );

    setRescheduleDialogOpen(false);
    showToast("success", "Agendamento reagendado com sucesso.");
  }

  function updateSelectedAppointmentStatus(status: string) {
    if (!selectedAppointment) return;

    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === selectedAppointment.id ? { ...appt, status } : appt
      )
    );

    setSelectedAppointment((prev) => (prev ? { ...prev, status } : prev));
    showToast("success", `Agendamento atualizado para ${status}.`);
  }

  function openManageLocations() {
    setManageLocationsOpen(true);
    setEditingLocationId(null);
    setLocationFormName("");
    setDeleteLocationTarget(null);
  }

  function startAddLocation() {
    setEditingLocationId("new");
    setLocationFormName("");
  }

  function startEditLocation(location: Location) {
    setEditingLocationId(location.id);
    setLocationFormName(location.name);
  }

  function cancelLocationForm() {
    setEditingLocationId(null);
    setLocationFormName("");
  }

  function saveLocationForm() {
    const name = locationFormName.trim();
    if (!name) {
      showToast("error", "Informe o nome do local.");
      return;
    }

    if (editingLocationId === "new") {
      const newLocation = { id: nextId("l"), name };
      setLocations((prev) => [...prev, newLocation]);
      showToast("success", "Local adicionado com sucesso.");
    } else if (editingLocationId) {
      setLocations((prev) =>
        prev.map((location) =>
          location.id === editingLocationId ? { ...location, name } : location
        )
      );
      showToast("success", "Local atualizado com sucesso.");
    }

    setEditingLocationId(null);
    setLocationFormName("");
  }

  function requestDeleteLocation(location: Location) {
    setDeleteLocationTarget(location);
  }

  function confirmDeleteLocation() {
    if (!deleteLocationTarget) return;

    const fallbackLocationId =
      locations.find((location) => location.id !== deleteLocationTarget.id)?.id || "";

    setLocations((prev) =>
      prev.filter((location) => location.id !== deleteLocationTarget.id)
    );

    setPatients((prev) =>
      prev.map((patient) =>
        patient.defaultLocationId === deleteLocationTarget.id
          ? { ...patient, defaultLocationId: fallbackLocationId }
          : patient
      )
    );

    setAppointments((prev) =>
      prev.filter((appt) => appt.locationId !== deleteLocationTarget.id)
    );

    setCompanyBlocks((prev) =>
      prev.filter((block) => block.locationId !== deleteLocationTarget.id)
    );

    showToast("success", "Local removido com sucesso.");
    setDeleteLocationTarget(null);
  }

  function openCompanyManager() {
    setCompanyManagerOpen(true);
    setDeleteCompanyTarget(null);
    resetCompanyForm();
  }

  function startAddCompany() {
    resetCompanyForm();
    setEditingCompanyId("new");
  }

  function startEditCompany(block: CompanyBlock) {
    setEditingCompanyId(block.id);
    setCompanyForm({
      companyName: block.companyName,
      locationId: block.locationId,
      weekday: block.weekday,
      startTime: block.startTime,
      endTime: block.endTime,
      notes: block.notes,
      active: block.active,
    });
  }

  function cancelCompanyForm() {
    resetCompanyForm();
  }

  function saveCompanyForm() {
    if (!companyForm.companyName.trim()) {
      showToast("error", "Informe o nome da empresa.");
      return;
    }

    if (!companyForm.locationId) {
      showToast("error", "Selecione o local.");
      return;
    }

    if (timeToMinutes(companyForm.endTime) <= timeToMinutes(companyForm.startTime)) {
      showToast("error", "A hora final deve ser maior que a hora inicial.");
      return;
    }

    if (editingCompanyId === "new") {
      setCompanyBlocks((prev) => [
        ...prev,
        {
          id: nextId("c"),
          companyName: companyForm.companyName,
          locationId: companyForm.locationId,
          weekday: companyForm.weekday,
          startTime: companyForm.startTime,
          endTime: companyForm.endTime,
          notes: companyForm.notes,
          active: companyForm.active,
        },
      ]);
      showToast("success", "Rotina da empresa criada com sucesso.");
    } else if (editingCompanyId) {
      setCompanyBlocks((prev) =>
        prev.map((block) =>
          block.id === editingCompanyId
            ? {
                ...block,
                companyName: companyForm.companyName,
                locationId: companyForm.locationId,
                weekday: companyForm.weekday,
                startTime: companyForm.startTime,
                endTime: companyForm.endTime,
                notes: companyForm.notes,
                active: companyForm.active,
              }
            : block
        )
      );
      showToast("success", "Rotina da empresa atualizada com sucesso.");
    }

    resetCompanyForm();
  }

  function requestDeleteCompany(block: CompanyBlock) {
    setDeleteCompanyTarget(block);
  }

  function confirmDeleteCompany() {
    if (!deleteCompanyTarget) return;
    setCompanyBlocks((prev) => prev.filter((block) => block.id !== deleteCompanyTarget.id));
    setDeleteCompanyTarget(null);
    showToast("success", "Rotina da empresa removida com sucesso.");
  }

  return (
    <div style={styles.page}>
      <style>{`
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body {
          margin: 0;
          font-family: Inter, Arial, Helvetica, sans-serif;
          background:
            radial-gradient(circle at top left, #fbfdff 0%, #f5f7fb 45%, #eef3fb 100%);
          color: ${colors.text};
        }
        button, input, select, textarea {
          font: inherit;
        }
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #94a3b8;
          box-shadow: 0 0 0 4px rgba(148, 163, 184, 0.15);
        }
      `}</style>

      {toast.open ? (
        <div
          style={{
            ...styles.toast,
            background: toast.type === "success" ? colors.successBg : colors.dangerBg,
            color: toast.type === "success" ? colors.successText : colors.dangerText,
            borderColor: toast.type === "success" ? "#a7f3d0" : "#fecaca",
          }}
        >
          {toast.message}
        </div>
      ) : null}

      <div style={styles.container}>
        <SectionCard style={styles.heroCard}>
          <div
            style={{
              ...styles.heroHeader,
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "stretch" : "center",
            }}
          >
            <div style={{ flex: 1 }}>
              <p style={styles.overline}>Sistema de agenda profissional</p>
              <h1
                style={{
                  ...styles.title,
                  fontSize: isSmallMobile ? 28 : isMobile ? 34 : 40,
                }}
              >
                Agenda Terapêutica
              </h1>
              <p style={styles.subtitle}>
                Uma agenda leve, organizada e agradável para acompanhar pacientes,
                empresas, horários e locais de atendimento.
              </p>
            </div>

            <div
              style={{
                ...styles.heroButtons,
                width: isMobile ? "100%" : "auto",
                flexDirection: isMobile ? "column" : "row",
              }}
            >
              <button
                style={{ ...styles.primaryButton, width: isMobile ? "100%" : "auto" }}
                onClick={() => setPatientDialogOpen(true)}
              >
                <span style={styles.buttonIcon}>👤</span>
                Novo paciente
              </button>

              <button
                style={{ ...styles.secondaryButton, width: isMobile ? "100%" : "auto" }}
                onClick={() => setAppointmentDialogOpen(true)}
              >
                <span style={styles.buttonIcon}>🗓</span>
                Novo agendamento
              </button>

              <button
                style={{ ...styles.secondaryButton, width: isMobile ? "100%" : "auto" }}
                onClick={openCompanyManager}
              >
                <span style={styles.buttonIcon}>🏢</span>
                Empresas fixas
              </button>

              <button
                style={{ ...styles.secondaryButton, width: isMobile ? "100%" : "auto" }}
                onClick={openManageLocations}
              >
                <span style={styles.buttonIcon}>📍</span>
                Gerenciar locais
              </button>
            </div>
          </div>
        </SectionCard>

        <div
          style={{
            ...styles.statGrid,
            gridTemplateColumns: isSmallMobile
              ? "1fr"
              : isMobile
              ? "1fr 1fr"
              : "repeat(auto-fit, minmax(180px, 1fr))",
          }}
        >
          <SectionCard style={styles.statCard}>
            <div style={styles.statLine}>
              <span>Eventos do dia</span>
              <strong>{stats.total}</strong>
            </div>
          </SectionCard>
          <SectionCard style={styles.statCard}>
            <div style={styles.statLine}>
              <span>Confirmados</span>
              <strong>{stats.confirmed}</strong>
            </div>
          </SectionCard>
          <SectionCard style={styles.statCard}>
            <div style={styles.statLine}>
              <span>Pendentes</span>
              <strong>{stats.pending}</strong>
            </div>
          </SectionCard>
          <SectionCard style={styles.statCard}>
            <div style={styles.statLine}>
              <span>Empresas no dia</span>
              <strong>{stats.companies}</strong>
            </div>
          </SectionCard>
        </div>

        <SectionCard style={styles.topTabsCard}>
          <div style={styles.tabsWrap}>
            {[
              { id: "agenda", label: "Agenda", icon: "🗓" },
              { id: "pacientes", label: "Pacientes", icon: "👤" },
              { id: "locais", label: "Locais", icon: "📍" },
            ].map((item) => (
              <button
                key={item.id}
                style={tab === item.id ? styles.tabActive : styles.tabButton}
                onClick={() => setTab(item.id)}
              >
                <span style={styles.buttonIcon}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </SectionCard>

        {tab === "agenda" ? (
          <div
            style={{
              ...styles.mainGrid,
              gridTemplateColumns: isMobile ? "1fr" : "1.5fr 0.85fr",
            }}
          >
            <SectionCard style={{ order: isMobile ? 1 : 0 }}>
              <div style={{ display: "grid", gap: 18 }}>
                <div>
                  <h2 style={styles.sectionTitle}>Agenda</h2>
                  <p style={styles.sectionDescription}>
                    Visualização por dia, semana ou mês.
                  </p>
                </div>

                <div style={styles.viewSwitch}>
                  {[
                    { id: "day", label: "Dia" },
                    { id: "week", label: "Semana" },
                    { id: "month", label: "Mês" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      style={calendarView === item.id ? styles.viewButtonActive : styles.viewButton}
                      onClick={() => setCalendarView(item.id)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div
                  style={{
                    ...styles.formGrid2,
                    gridTemplateColumns: isMobile
                      ? "1fr"
                      : "repeat(auto-fit, minmax(220px, 1fr))",
                  }}
                >
                  <div>
                    <label style={styles.label}>Data</label>
                    <input
                      style={styles.input}
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                    <div style={styles.inlineHint}>{formatDateLong(selectedDate)}</div>
                  </div>

                  <div>
                    <label style={styles.label}>Buscar</label>
                    <input
                      style={styles.input}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Paciente, empresa ou local"
                    />
                  </div>
                </div>

                {calendarView === "day" ? (
                  <div style={{ display: "grid", gap: 12 }}>
                    {daySchedule.map((slot) => (
                      <div key={slot.hour} style={styles.slotCard}>
                        <div style={styles.rowBetween}>
                          <strong style={{ fontSize: 16 }}>{slot.hour}</strong>
                          <span
                            style={{
                              color:
                                slot.events.length > 0 ? colors.subtext : colors.successText,
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            {slot.events.length > 0
                              ? `${slot.events.length} evento(s)`
                              : "Livre"}
                          </span>
                        </div>

                        {slot.events.length > 0 ? (
                          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                            {slot.events.map((event) => {
                              if (event.kind === "company") {
                                return (
                                  <button
                                    key={event.id}
                                    style={styles.companyEventButton}
                                    onClick={() => setSelectedCompanyBlock(event.sourceCompany || null)}
                                  >
                                    <div style={styles.rowBetween}>
                                      <div style={{ textAlign: "left" }}>
                                        <div style={{ fontWeight: 700 }}>🏢 {event.title}</div>
                                        <div style={{ color: colors.subtext, fontSize: 13 }}>
                                          {event.subtitle}
                                        </div>
                                        <div style={{ color: colors.companyText, fontSize: 12 }}>
                                          {event.startTime} às {event.endTime}
                                        </div>
                                      </div>
                                      <Badge tone="soft">Empresa</Badge>
                                    </div>
                                  </button>
                                );
                              }

                              const theme = getLocationTheme(event.locationId);
                              return (
                                <button
                                  key={event.id}
                                  style={{
                                    ...styles.appointmentButton,
                                    background: theme.bg,
                                    borderColor: theme.border,
                                  }}
                                  onClick={() =>
                                    event.sourceAppointment &&
                                    openAppointment(event.sourceAppointment)
                                  }
                                >
                                  <div style={styles.rowBetween}>
                                    <div style={{ textAlign: "left" }}>
                                      <div style={{ fontWeight: 700 }}>{event.title}</div>
                                      <div style={{ color: colors.subtext, fontSize: 13 }}>
                                        {event.subtitle}
                                      </div>
                                      <div style={{ color: colors.subtext, fontSize: 12 }}>
                                        {event.startTime}
                                      </div>
                                    </div>
                                    <Badge tone={statusTone(event.status)}>{event.status}</Badge>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={styles.freeBox}>Horário disponível</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}

                {calendarView === "week" ? (
                  <div style={{ overflowX: "auto", paddingBottom: 6 }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7, minmax(120px, 1fr))",
                        gap: 12,
                        minWidth: isMobile ? 720 : 0,
                      }}
                    >
                      {weekDates.map((day) => {
                        const items = eventsByDate[day.iso] || [];
                        const isSelected = day.iso === selectedDate;
                        const freeSummary = summarizeFreeWindows(items);

                        return (
                          <div
                            key={day.iso}
                            style={{
                              ...styles.weekCard,
                              borderColor: isSelected ? colors.primary : colors.border,
                              background: isSelected ? "#fbfdff" : colors.cardSoft,
                            }}
                          >
                            <button
                              style={{ ...styles.dayHeaderButton, color: colors.text }}
                              onClick={() => {
                                setSelectedDate(day.iso);
                                setCalendarView("day");
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 12,
                                  color: colors.subtext,
                                  textTransform: "uppercase",
                                  letterSpacing: 0.6,
                                }}
                              >
                                {day.label}
                              </div>
                              <div style={{ fontSize: 30, fontWeight: 800 }}>{day.dayNumber}</div>
                            </button>

                            {items.length === 0 ? (
                              <div style={styles.freeBox}>Livre o dia todo</div>
                            ) : (
                              <div style={{ display: "grid", gap: 8 }}>
                                {items.map((event) => {
                                  if (event.kind === "company") {
                                    return (
                                      <button
                                        key={event.id}
                                        style={styles.companyMiniButton}
                                        onClick={() =>
                                          setSelectedCompanyBlock(event.sourceCompany || null)
                                        }
                                      >
                                        <div style={{ fontWeight: 700, fontSize: 12 }}>
                                          🏢 {event.title}
                                        </div>
                                        <div style={{ color: colors.companyText, fontSize: 11 }}>
                                          {event.startTime} às {event.endTime}
                                        </div>
                                      </button>
                                    );
                                  }

                                  const theme = getLocationTheme(event.locationId);
                                  return (
                                    <button
                                      key={event.id}
                                      style={{
                                        ...styles.appointmentMini,
                                        background: theme.bg,
                                        borderColor: theme.border,
                                      }}
                                      onClick={() =>
                                        event.sourceAppointment &&
                                        openAppointment(event.sourceAppointment)
                                      }
                                    >
                                      <div style={{ fontWeight: 700, fontSize: 12 }}>
                                        {event.startTime} • {event.title}
                                      </div>
                                      <div style={{ color: colors.subtext, fontSize: 11 }}>
                                        {event.subtitle}
                                      </div>
                                    </button>
                                  );
                                })}
                                <div style={{ color: colors.subtext, fontSize: 11 }}>
                                  {freeSummary}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {calendarView === "month" ? (
                  <div style={{ overflowX: "auto", paddingBottom: 6 }}>
                    <div style={{ minWidth: isMobile ? 720 : 0 }}>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(7, 1fr)",
                          gap: 8,
                          marginBottom: 10,
                        }}
                      >
                        {weekdayLabels.map((label) => (
                          <div
                            key={label}
                            style={{
                              textAlign: "center",
                              fontSize: 12,
                              color: colors.subtext,
                              fontWeight: 700,
                              letterSpacing: 0.5,
                            }}
                          >
                            {label}
                          </div>
                        ))}
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(7, 1fr)",
                          gap: 8,
                        }}
                      >
                        {monthDates.map((day) => {
                          const items = eventsByDate[day.iso] || [];
                          const isSelected = day.iso === selectedDate;

                          return (
                            <button
                              key={day.iso}
                              style={{
                                ...styles.monthCell,
                                borderColor: isSelected ? colors.primary : colors.border,
                                opacity: day.currentMonth ? 1 : 0.45,
                                background: isSelected ? "#fbfdff" : colors.cardSoft,
                              }}
                              onClick={() => {
                                setSelectedDate(day.iso);
                                setCalendarView("week");
                              }}
                            >
                              <div style={styles.rowBetween}>
                                <strong>{day.dayNumber}</strong>
                                {items.length > 0 ? <Badge>{items.length}</Badge> : null}
                              </div>

                              {items.length === 0 ? (
                                <div style={styles.freeBox}>Livre</div>
                              ) : (
                                <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
                                  {items.slice(0, 4).map((event) => {
                                    if (event.kind === "company") {
                                      return (
                                        <div
                                          key={event.id}
                                          style={styles.monthCompanyPill}
                                        >
                                          🏢 {event.startTime}
                                        </div>
                                      );
                                    }

                                    const theme = getLocationTheme(event.locationId);
                                    return (
                                      <div
                                        key={event.id}
                                        style={{
                                          ...styles.monthEventPill,
                                          background: theme.bg,
                                          borderColor: theme.border,
                                          color: theme.text,
                                        }}
                                      >
                                        {event.startTime}
                                      </div>
                                    );
                                  })}
                                  {items.length > 4 ? (
                                    <div style={{ fontSize: 11, color: colors.subtext }}>
                                      + {items.length - 4} evento(s)
                                    </div>
                                  ) : null}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <div style={styles.monthLegend}>
                        <div style={styles.monthLegendItem}>
                          <span
                            style={{
                              ...styles.legendDot,
                              background: colors.freeBg,
                              borderColor: colors.freeBorder,
                            }}
                          />
                          Livre
                        </div>

                        <div style={styles.monthLegendItem}>
                          <span
                            style={{
                              ...styles.legendDot,
                              background: colors.companyBg,
                              borderColor: colors.companyBorder,
                            }}
                          />
                          Empresa fixa
                        </div>

                        {locations.map((location) => {
                          const theme = getLocationTheme(location.id);
                          return (
                            <div key={location.id} style={styles.monthLegendItem}>
                              <span
                                style={{
                                  ...styles.legendDot,
                                  background: theme.bg,
                                  borderColor: theme.border,
                                }}
                              />
                              {location.name}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </SectionCard>

            <SectionCard style={{ order: isMobile ? 2 : 0 }}>
              <h2 style={styles.sectionTitle}>Resumo do mês por paciente</h2>
              <p style={styles.sectionDescription}>
                Veja quem mais atendeu no mês e toque para abrir os detalhes.
              </p>

              <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                {monthlySummaryByPatient.length > 0 ? (
                  monthlySummaryByPatient.map((patient) => (
                    <button
                      key={patient.name}
                      style={styles.summaryButton}
                      onClick={() =>
                        openMonthly({
                          name: patient.name,
                          appointments: patient.appointments,
                        })
                      }
                    >
                      <div style={styles.rowBetween}>
                        <div style={{ textAlign: "left" }}>
                          <div style={{ fontWeight: 700 }}>{patient.name}</div>
                          <div style={{ color: colors.subtext, fontSize: 14 }}>
                            {patient.total} atendimento(s) no mês
                          </div>
                          <div style={{ color: colors.subtext, fontSize: 12 }}>
                            {patient.completed} realizado(s) • {patient.pending} pendente(s)
                          </div>
                        </div>
                        <Badge tone="soft">{patient.total}</Badge>
                      </div>
                    </button>
                  ))
                ) : (
                  <div style={styles.empty}>Nenhum atendimento encontrado neste mês.</div>
                )}
              </div>
            </SectionCard>
          </div>
        ) : null}

        {tab === "pacientes" ? (
          <SectionCard>
            <h2 style={styles.sectionTitle}>Pacientes</h2>
            <p style={styles.sectionDescription}>
              Toque em um paciente para ver sessões, horários e mais detalhes.
            </p>

            <div
              style={{
                ...styles.patientGrid,
                marginTop: 16,
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : "repeat(auto-fit, minmax(240px, 1fr))",
              }}
            >
              {patients.map((patient) => {
                const patientAppointments = enrichedAppointments.filter(
                  (appt) => appt.patientId === patient.id
                );

                return (
                  <button
                    key={patient.id}
                    style={styles.patientCardButton}
                    onClick={() => openPatient(patient)}
                  >
                    <div style={styles.rowBetween}>
                      <strong>{patient.name}</strong>
                      <Badge>{patient.status}</Badge>
                    </div>

                    <div
                      style={{
                        color: colors.subtext,
                        fontSize: 14,
                        display: "grid",
                        gap: 8,
                        marginTop: 10,
                        textAlign: "left",
                      }}
                    >
                      <div>Telefone: {patient.phone}</div>
                      <div>
                        Local: {" "}
                        {locations.find((l) => l.id === patient.defaultLocationId)?.name ||
                          "Sem local"}
                      </div>
                      <div>{patientAppointments.length} sessão(ões) cadastrada(s)</div>
                    </div>

                    <div
                      style={{
                        marginTop: 10,
                        color: colors.subtext,
                        fontSize: 14,
                        textAlign: "left",
                      }}
                    >
                      {patient.notes || "Sem observações."}
                    </div>
                  </button>
                );
              })}
            </div>
          </SectionCard>
        ) : null}

        {tab === "locais" ? (
          <SectionCard>
            <h2 style={styles.sectionTitle}>Locais</h2>
            <p style={styles.sectionDescription}>
              Toque em um local para ver quem atende lá e os próximos eventos.
            </p>

            <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
              {locations.map((loc) => {
                const locationEvents = agendaEvents.filter((a) => a.locationId === loc.id);
                const patientNames = Array.from(
                  new Set(
                    enrichedAppointments
                      .filter((a) => a.locationId === loc.id)
                      .map((a) => a.patient?.name)
                      .filter(Boolean)
                  )
                );
                const theme = getLocationTheme(loc.id);

                return (
                  <button
                    key={loc.id}
                    style={{
                      ...styles.locationButton,
                      background: theme.bg,
                      borderColor: theme.border,
                    }}
                    onClick={() => setSelectedLocation(loc)}
                  >
                    <div style={styles.rowBetween}>
                      <strong>{loc.name}</strong>
                      <span style={{ color: colors.subtext, fontSize: 14 }}>
                        {locationEvents.length} evento(s)
                      </span>
                    </div>

                    <div
                      style={{
                        marginTop: 10,
                        color: colors.subtext,
                        fontSize: 13,
                        textAlign: "left",
                      }}
                    >
                      {patientNames.length > 0
                        ? `Atende: ${patientNames.join(", ")}`
                        : "Sem pacientes vinculados no momento"}
                    </div>
                  </button>
                );
              })}
            </div>
          </SectionCard>
        ) : null}
      </div>

      <Modal
        open={monthlyOpen}
        onClose={() => setMonthlyOpen(false)}
        title="📊 Resumo do mês"
        description={monthlyPatientDetails?.name || "Detalhes dos atendimentos deste mês."}
      >
        <div style={{ display: "grid", gap: 12 }}>
          {monthlyPatientDetails?.appointments.map((appt) => (
            <button
              key={appt.id}
              style={styles.summaryButton}
              onClick={() => {
                setMonthlyOpen(false);
                openAppointment(appt, "monthly");
              }}
            >
              <div style={styles.rowBetween}>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontWeight: 700 }}>
                    {formatDate(appt.date)} às {appt.time}
                  </div>
                  <div style={{ color: colors.subtext, fontSize: 14 }}>
                    {appt.location?.name} • {appt.type}
                  </div>
                  <div style={{ color: colors.subtext, fontSize: 13 }}>
                    {appt.notes || "Sem observações"}
                  </div>
                  <div style={{ color: colors.subtext, fontSize: 12 }}>
                    {appt.recurrenceLabel || "Único"}
                  </div>
                </div>
                <Badge tone={statusTone(appt.status)}>{appt.status}</Badge>
              </div>
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        open={!!selectedAppointment}
        onClose={() => {
          setSelectedAppointment(null);
          setAppointmentReturnTo(null);
        }}
        onBack={appointmentReturnTo ? handleBackFromAppointment : undefined}
        title="🗓 Detalhes do atendimento"
        description="Resumo rápido do agendamento."
      >
        {selectedAppointment ? (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={styles.infoGrid}>
              <div>
                <strong>Paciente:</strong> {selectedAppointment.patient?.name || "Paciente"}
              </div>
              <div>
                <strong>Data:</strong> {formatDate(selectedAppointment.date)}
              </div>
              <div>
                <strong>Horário:</strong> {selectedAppointment.time}
              </div>
              <div>
                <strong>Local:</strong>{" "}
                {locations.find((l) => l.id === selectedAppointment.locationId)?.name}
              </div>
              <div>
                <strong>Tipo:</strong> {selectedAppointment.type}
              </div>
              <div>
                <strong>Plano:</strong> {selectedAppointment.recurrenceLabel || "Único"}
              </div>
              <div>
                <strong>Observações:</strong>{" "}
                {selectedAppointment.notes || "Sem observações"}
              </div>
            </div>

            <div
              style={{
                ...styles.formGrid2,
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : "repeat(auto-fit, minmax(220px, 1fr))",
              }}
            >
              <button style={styles.secondaryButton} onClick={openRescheduleDialog}>
                <span style={styles.buttonIcon}>↻</span>
                Reagendar
              </button>
              <button
                style={styles.secondaryButton}
                onClick={() => updateSelectedAppointmentStatus("Confirmado")}
              >
                <span style={styles.buttonIcon}>✓</span>
                Confirmar
              </button>
              <button
                style={styles.secondaryButton}
                onClick={() => updateSelectedAppointmentStatus("Realizado")}
              >
                <span style={styles.buttonIcon}>✔</span>
                Marcar realizado
              </button>
              <button
                style={styles.secondaryButton}
                onClick={() => updateSelectedAppointmentStatus("Cancelado")}
              >
                <span style={styles.buttonIcon}>✕</span>
                Cancelar
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={!!selectedCompanyBlock}
        onClose={() => setSelectedCompanyBlock(null)}
        title={`🏢 ${selectedCompanyBlock?.companyName || "Empresa"}`}
        description="Rotina fixa de prestação de serviço."
      >
        {selectedCompanyBlock ? (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={styles.infoGrid}>
              <div>
                <strong>Empresa:</strong> {selectedCompanyBlock.companyName}
              </div>
              <div>
                <strong>Local:</strong>{" "}
                {locations.find((l) => l.id === selectedCompanyBlock.locationId)?.name}
              </div>
              <div>
                <strong>Dia:</strong> {weekdayFullLabels[selectedCompanyBlock.weekday]}
              </div>
              <div>
                <strong>Horário:</strong> {selectedCompanyBlock.startTime} às {selectedCompanyBlock.endTime}
              </div>
              <div>
                <strong>Status:</strong>{" "}
                {selectedCompanyBlock.active ? "Ativo" : "Inativo"}
              </div>
              <div>
                <strong>Observações:</strong>{" "}
                {selectedCompanyBlock.notes || "Sem observações"}
              </div>
            </div>

            <div style={styles.footerButtons}>
              <button
                style={styles.secondaryButton}
                onClick={() => {
                  setSelectedCompanyBlock(null);
                  setCompanyManagerOpen(true);
                  startEditCompany(selectedCompanyBlock);
                }}
              >
                Editar rotina
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={!!selectedPatient}
        onClose={() => {
          setSelectedPatient(null);
          setPatientReturnTo(null);
        }}
        onBack={patientReturnTo ? handleBackFromPatient : undefined}
        title={`👤 ${selectedPatient?.name || "Paciente"}`}
        description="Resumo do paciente, sessões e próximos horários."
      >
        {selectedPatient ? (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={styles.infoGrid}>
              <div>
                <strong>Telefone:</strong> {selectedPatient.phone}
              </div>
              <div>
                <strong>Local padrão:</strong>{" "}
                {locations.find((l) => l.id === selectedPatient.defaultLocationId)?.name ||
                  "Sem local"}
              </div>
              <div>
                <strong>Frequência:</strong> {selectedPatient.frequency}
              </div>
              <div>
                <strong>Status:</strong> {selectedPatient.status}
              </div>
              <div>
                <strong>Total de sessões:</strong> {selectedPatientAppointments.length}
              </div>
              <div>
                <strong>Observações:</strong> {selectedPatient.notes || "Sem observações"}
              </div>
            </div>

            <div style={styles.infoBox}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Próximas sessões</div>
              {selectedPatientAppointments.length > 0 ? (
                <div style={{ display: "grid", gap: 10 }}>
                  {selectedPatientAppointments.slice(0, 8).map((appt) => (
                    <button
                      key={appt.id}
                      style={styles.miniInfoButton}
                      onClick={() => openAppointment(appt, "patient")}
                    >
                      <div style={{ fontWeight: 700 }}>
                        {formatDate(appt.date)} às {appt.time}
                      </div>
                      <div style={{ color: colors.subtext, fontSize: 13 }}>
                        {appt.location?.name} • {appt.type}
                      </div>
                      <div style={{ color: colors.subtext, fontSize: 12 }}>
                        {appt.recurrenceLabel || "Único"}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ color: colors.subtext }}>Nenhuma sessão encontrada.</div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={!!selectedLocation}
        onClose={() => setSelectedLocation(null)}
        title={`📍 ${selectedLocation?.name || "Local"}`}
        description="Veja os pacientes atendidos aqui e os próximos eventos."
      >
        {selectedLocation ? (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={styles.infoGrid}>
              <div>
                <strong>Total de eventos:</strong> {selectedLocationAppointments.length}
              </div>
              <div>
                <strong>Pacientes vinculados:</strong> {selectedLocationPatients.length}
              </div>
            </div>

            <div style={styles.infoBox}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Pacientes deste local</div>
              {selectedLocationPatients.length > 0 ? (
                <div style={{ display: "grid", gap: 10 }}>
                  {selectedLocationPatients.map((patient) => (
                    <button
                      key={patient.id}
                      style={styles.miniInfoButton}
                      onClick={() => openPatient(patient)}
                    >
                      <div style={{ fontWeight: 700 }}>{patient.name}</div>
                      <div style={{ color: colors.subtext, fontSize: 13 }}>
                        {patient.frequency} • {patient.status}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ color: colors.subtext }}>Nenhum paciente encontrado.</div>
              )}
            </div>

            <div style={styles.infoBox}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Próximos eventos</div>
              {selectedLocationAppointments.length > 0 ? (
                <div style={{ display: "grid", gap: 10 }}>
                  {selectedLocationAppointments.slice(0, 8).map((event) => (
                    <div key={event.id} style={styles.miniInfoButton}>
                      <div style={{ fontWeight: 700 }}>
                        {formatDate(event.date)} • {event.startTime}
                      </div>
                      <div style={{ color: colors.subtext, fontSize: 13 }}>
                        {event.kind === "company" ? `Empresa: ${event.title}` : event.title}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: colors.subtext }}>Nenhum evento encontrado.</div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={manageLocationsOpen}
        onClose={() => {
          setManageLocationsOpen(false);
          setEditingLocationId(null);
          setLocationFormName("");
          setDeleteLocationTarget(null);
        }}
        title="📍 Gerenciar locais"
        description="Adicione, edite ou remova locais de atendimento."
      >
        <div style={{ display: "grid", gap: 16 }}>
          <div style={styles.formSection}>
            <div style={styles.rowBetween}>
              <strong>Locais cadastrados</strong>
              {editingLocationId ? null : (
                <button style={styles.primaryButton} onClick={startAddLocation}>
                  <span style={styles.buttonIcon}>＋</span>
                  Adicionar local
                </button>
              )}
            </div>

            {editingLocationId ? (
              <div style={{ ...styles.infoBox, marginTop: 14 }}>
                <div style={{ display: "grid", gap: 12 }}>
                  <div>
                    <label style={styles.label}>
                      {editingLocationId === "new" ? "Novo local" : "Editar local"}
                    </label>
                    <input
                      style={styles.input}
                      value={locationFormName}
                      onChange={(e) => setLocationFormName(e.target.value)}
                      placeholder="Nome do local"
                    />
                  </div>

                  <div style={styles.footerButtons}>
                    <button style={styles.secondaryButton} onClick={cancelLocationForm}>
                      Cancelar
                    </button>
                    <button style={styles.primaryButton} onClick={saveLocationForm}>
                      Salvar
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
              {locations.map((location) => {
                const linkedEvents = agendaEvents.filter(
                  (evt) => evt.locationId === location.id
                );
                const linkedPatients = Array.from(
                  new Set(
                    enrichedAppointments
                      .filter((appt) => appt.locationId === location.id)
                      .map((appt) => appt.patient?.name)
                      .filter(Boolean)
                  )
                );
                const theme = getLocationTheme(location.id);

                return (
                  <div
                    key={location.id}
                    style={{
                      ...styles.manageLocationCard,
                      background: theme.bg,
                      borderColor: theme.border,
                    }}
                  >
                    <div style={styles.rowBetween}>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontWeight: 700 }}>{location.name}</div>
                        <div style={{ color: colors.subtext, fontSize: 13, marginTop: 6 }}>
                          {linkedPatients.length > 0
                            ? `Pacientes: ${linkedPatients.join(", ")}`
                            : "Sem pacientes vinculados"}
                        </div>
                        <div style={{ color: colors.subtext, fontSize: 12, marginTop: 4 }}>
                          {linkedEvents.length} evento(s) vinculados
                        </div>
                      </div>

                      <div style={styles.manageActions}>
                        <button
                          style={styles.secondaryButton}
                          onClick={() => setSelectedLocation(location)}
                        >
                          Ver
                        </button>
                        <button
                          style={styles.secondaryButton}
                          onClick={() => startEditLocation(location)}
                        >
                          Editar
                        </button>
                        <button
                          style={styles.deleteButton}
                          onClick={() => requestDeleteLocation(location)}
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {deleteLocationTarget ? (
            <div style={styles.warningBox}>
              <div style={{ fontWeight: 800, marginBottom: 10 }}>
                Confirmar remoção de local
              </div>
              <div style={{ color: colors.warningText, marginBottom: 10 }}>
                Você está removendo <strong>{deleteLocationTarget.name}</strong>.
              </div>

              <div style={{ color: colors.subtext, fontSize: 14, lineHeight: 1.5 }}>
                {deleteLocationPatients.length > 0 ? (
                  <>
                    Este local possui pacientes vinculados:
                    <div style={{ marginTop: 8 }}>
                      {deleteLocationPatients.map((patient) => (
                        <div key={patient.id}>• {patient.name}</div>
                      ))}
                    </div>
                  </>
                ) : (
                  "Este local não possui pacientes vinculados."
                )}
              </div>

              <div style={{ color: colors.subtext, fontSize: 14, marginTop: 12 }}>
                Também serão removidos os agendamentos e rotinas fixas ligados a este local.
                Tem certeza?
              </div>

              <div style={{ ...styles.footerButtons, marginTop: 14 }}>
                <button
                  style={styles.secondaryButton}
                  onClick={() => setDeleteLocationTarget(null)}
                >
                  Cancelar
                </button>
                <button style={styles.deleteButton} onClick={confirmDeleteLocation}>
                  Confirmar remoção
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={companyManagerOpen}
        onClose={() => {
          setCompanyManagerOpen(false);
          setDeleteCompanyTarget(null);
          resetCompanyForm();
        }}
        title="🏢 Empresas / rotinas fixas"
        description="Cadastre e edite dias e horários fixos de atendimento para empresas."
      >
        <div style={{ display: "grid", gap: 16 }}>
          <div style={styles.formSection}>
            <div style={styles.rowBetween}>
              <strong>Rotinas cadastradas</strong>
              {editingCompanyId ? null : (
                <button style={styles.primaryButton} onClick={startAddCompany}>
                  <span style={styles.buttonIcon}>＋</span>
                  Nova rotina
                </button>
              )}
            </div>

            {editingCompanyId ? (
              <div style={{ ...styles.infoBox, marginTop: 14 }}>
                <div style={{ display: "grid", gap: 12 }}>
                  <div>
                    <label style={styles.label}>Empresa / contrato</label>
                    <input
                      style={styles.input}
                      value={companyForm.companyName}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, companyName: e.target.value })
                      }
                      placeholder="Nome da empresa ou consultório"
                    />
                  </div>

                  <div
                    style={{
                      ...styles.formGrid2,
                      gridTemplateColumns: isMobile
                        ? "1fr"
                        : "repeat(auto-fit, minmax(220px, 1fr))",
                    }}
                  >
                    <div>
                      <label style={styles.label}>Local</label>
                      <select
                        style={styles.input}
                        value={companyForm.locationId}
                        onChange={(e) =>
                          setCompanyForm({ ...companyForm, locationId: e.target.value })
                        }
                      >
                        {locations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={styles.label}>Dia da semana</label>
                      <select
                        style={styles.input}
                        value={companyForm.weekday}
                        onChange={(e) =>
                          setCompanyForm({ ...companyForm, weekday: Number(e.target.value) })
                        }
                      >
                        <option value={1}>Segunda</option>
                        <option value={2}>Terça</option>
                        <option value={3}>Quarta</option>
                        <option value={4}>Quinta</option>
                        <option value={5}>Sexta</option>
                        <option value={6}>Sábado</option>
                        <option value={7}>Domingo</option>
                      </select>
                    </div>
                  </div>

                  <div
                    style={{
                      ...styles.formGrid2,
                      gridTemplateColumns: isMobile
                        ? "1fr"
                        : "repeat(auto-fit, minmax(220px, 1fr))",
                    }}
                  >
                    <div>
                      <label style={styles.label}>Hora inicial</label>
                      <input
                        style={styles.input}
                        type="time"
                        value={companyForm.startTime}
                        onChange={(e) =>
                          setCompanyForm({ ...companyForm, startTime: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label style={styles.label}>Hora final</label>
                      <input
                        style={styles.input}
                        type="time"
                        value={companyForm.endTime}
                        onChange={(e) =>
                          setCompanyForm({ ...companyForm, endTime: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label style={styles.label}>Observações</label>
                    <textarea
                      style={styles.textarea}
                      value={companyForm.notes}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, notes: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label style={styles.label}>Status</label>
                    <select
                      style={styles.input}
                      value={companyForm.active ? "ativo" : "inativo"}
                      onChange={(e) =>
                        setCompanyForm({
                          ...companyForm,
                          active: e.target.value === "ativo",
                        })
                      }
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>

                  <div style={styles.footerButtons}>
                    <button style={styles.secondaryButton} onClick={cancelCompanyForm}>
                      Cancelar
                    </button>
                    <button style={styles.primaryButton} onClick={saveCompanyForm}>
                      Salvar rotina
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
              {companyBlocks.map((block) => {
                const location = locations.find((loc) => loc.id === block.locationId);
                return (
                  <div key={block.id} style={styles.companyManagerCard}>
                    <div style={styles.rowBetween}>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontWeight: 700 }}>🏢 {block.companyName}</div>
                        <div style={{ color: colors.subtext, fontSize: 13, marginTop: 6 }}>
                          {location?.name || "Local"} • {weekdayFullLabels[block.weekday]} •{" "}
                          {block.startTime} às {block.endTime}
                        </div>
                        <div style={{ color: colors.subtext, fontSize: 12, marginTop: 4 }}>
                          {block.notes || "Sem observações"}
                        </div>
                      </div>

                      <div style={styles.manageActions}>
                        <button
                          style={styles.secondaryButton}
                          onClick={() => setSelectedCompanyBlock(block)}
                        >
                          Ver
                        </button>
                        <button
                          style={styles.secondaryButton}
                          onClick={() => startEditCompany(block)}
                        >
                          Editar
                        </button>
                        <button
                          style={styles.deleteButton}
                          onClick={() => requestDeleteCompany(block)}
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {deleteCompanyTarget ? (
            <div style={styles.warningBox}>
              <div style={{ fontWeight: 800, marginBottom: 10 }}>
                Confirmar remoção da rotina
              </div>
              <div style={{ color: colors.warningText, marginBottom: 10 }}>
                Você está removendo a rotina de <strong>{deleteCompanyTarget.companyName}</strong>.
              </div>

              <div style={{ color: colors.subtext, fontSize: 14 }}>
                {weekdayFullLabels[deleteCompanyTarget.weekday]} • {deleteCompanyTarget.startTime} às{" "}
                {deleteCompanyTarget.endTime}
              </div>

              <div style={{ ...styles.footerButtons, marginTop: 14 }}>
                <button
                  style={styles.secondaryButton}
                  onClick={() => setDeleteCompanyTarget(null)}
                >
                  Cancelar
                </button>
                <button style={styles.deleteButton} onClick={confirmDeleteCompany}>
                  Confirmar remoção
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={rescheduleDialogOpen}
        onClose={() => setRescheduleDialogOpen(false)}
        title="↻ Reagendar atendimento"
        description="Altere data, horário, local e observações."
      >
        <div style={{ display: "grid", gap: 14 }}>
          <div
            style={{
              ...styles.formGrid2,
              gridTemplateColumns: isMobile
                ? "1fr"
                : "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            <div>
              <label style={styles.label}>Nova data</label>
              <input
                style={styles.input}
                type="date"
                value={rescheduleForm.date}
                onChange={(e) =>
                  setRescheduleForm({ ...rescheduleForm, date: e.target.value })
                }
              />
            </div>

            <div>
              <label style={styles.label}>Novo horário</label>
              <input
                style={styles.input}
                type="time"
                value={rescheduleForm.time}
                onChange={(e) =>
                  setRescheduleForm({ ...rescheduleForm, time: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label style={styles.label}>Local</label>
            <select
              style={styles.input}
              value={rescheduleForm.locationId}
              onChange={(e) =>
                setRescheduleForm({ ...rescheduleForm, locationId: e.target.value })
              }
            >
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={styles.label}>Observações</label>
            <textarea
              style={styles.textarea}
              value={rescheduleForm.notes}
              onChange={(e) =>
                setRescheduleForm({ ...rescheduleForm, notes: e.target.value })
              }
            />
          </div>

          <div style={styles.footerButtons}>
            <button style={styles.secondaryButton} onClick={() => setRescheduleDialogOpen(false)}>
              Fechar
            </button>
            <button style={styles.primaryButton} onClick={saveReschedule}>
              Salvar reagendamento
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={patientDialogOpen}
        onClose={() => setPatientDialogOpen(false)}
        title="👤 Novo paciente"
        description="Cadastre um novo paciente com informações básicas."
      >
        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <label style={styles.label}>Nome</label>
            <input
              style={styles.input}
              value={newPatient.name}
              onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
            />
          </div>

          <div>
            <label style={styles.label}>Telefone</label>
            <input
              style={styles.input}
              value={newPatient.phone}
              onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
            />
          </div>

          <div
            style={{
              ...styles.formGrid2,
              gridTemplateColumns: isMobile
                ? "1fr"
                : "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            <div>
              <label style={styles.label}>Local padrão</label>
              <select
                style={styles.input}
                value={newPatient.defaultLocationId}
                onChange={(e) =>
                  setNewPatient({ ...newPatient, defaultLocationId: e.target.value })
                }
              >
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={styles.label}>Frequência</label>
              <select
                style={styles.input}
                value={newPatient.frequency}
                onChange={(e) =>
                  setNewPatient({ ...newPatient, frequency: e.target.value })
                }
              >
                <option>Semanal</option>
                <option>Quinzenal</option>
                <option>Mensal</option>
                <option>Avulso</option>
              </select>
            </div>
          </div>

          <div>
            <label style={styles.label}>Status</label>
            <select
              style={styles.input}
              value={newPatient.status}
              onChange={(e) => setNewPatient({ ...newPatient, status: e.target.value })}
            >
              <option>Ativo</option>
              <option>Inativo</option>
            </select>
          </div>

          <div>
            <label style={styles.label}>Observações</label>
            <textarea
              style={styles.textarea}
              value={newPatient.notes}
              onChange={(e) => setNewPatient({ ...newPatient, notes: e.target.value })}
            />
          </div>

          <div style={styles.footerButtons}>
            <button style={styles.secondaryButton} onClick={() => setPatientDialogOpen(false)}>
              Fechar
            </button>
            <button style={styles.primaryButton} onClick={createPatient}>
              Salvar paciente
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={appointmentDialogOpen}
        onClose={() => setAppointmentDialogOpen(false)}
        title="🗓 Novo agendamento"
        description="Cadastre um atendimento único ou monte um plano recorrente."
      >
        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <label style={styles.label}>Paciente</label>
            <select
              style={styles.input}
              value={newAppointment.patientId}
              onChange={(e) =>
                setNewAppointment({ ...newAppointment, patientId: e.target.value })
              }
            >
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              ...styles.formGrid2,
              gridTemplateColumns: isMobile
                ? "1fr"
                : "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            <div>
              <label style={styles.label}>Tipo</label>
              <select
                style={styles.input}
                value={newAppointment.type}
                onChange={(e) => setNewAppointment({ ...newAppointment, type: e.target.value })}
              >
                <option>Sessão</option>
                <option>Anamnese</option>
                <option>Avaliação</option>
                <option>Retorno</option>
              </select>
            </div>

            <div>
              <label style={styles.label}>Modo do agendamento</label>
              <select
                style={styles.input}
                value={newAppointment.scheduleMode}
                onChange={(e) =>
                  setNewAppointment({
                    ...newAppointment,
                    scheduleMode: e.target.value as "single" | "recurring",
                  })
                }
              >
                <option value="single">Atendimento único</option>
                <option value="recurring">Plano recorrente</option>
              </select>
            </div>
          </div>

          <div
            style={{
              ...styles.formGrid2,
              gridTemplateColumns: isMobile
                ? "1fr"
                : "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            <div>
              <label style={styles.label}>Local</label>
              <select
                style={styles.input}
                value={newAppointment.locationId}
                onChange={(e) =>
                  setNewAppointment({ ...newAppointment, locationId: e.target.value })
                }
              >
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={styles.label}>Status</label>
              <select
                style={styles.input}
                value={newAppointment.status}
                onChange={(e) => setNewAppointment({ ...newAppointment, status: e.target.value })}
              >
                <option>Agendado</option>
                <option>Confirmado</option>
                <option>Realizado</option>
                <option>Cancelado</option>
              </select>
            </div>
          </div>

          <div
            style={{
              ...styles.formGrid2,
              gridTemplateColumns: isMobile
                ? "1fr"
                : "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            <div>
              <label style={styles.label}>
                {newAppointment.scheduleMode === "single" ? "Data" : "Data de início"}
              </label>
              <input
                style={styles.input}
                type="date"
                value={newAppointment.date}
                onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
              />
            </div>

            <div>
              <label style={styles.label}>Duração (min)</label>
              <input
                style={styles.input}
                type="number"
                value={newAppointment.duration}
                onChange={(e) =>
                  setNewAppointment({
                    ...newAppointment,
                    duration: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>

          {newAppointment.scheduleMode === "single" ? (
            <div
              style={{
                ...styles.formGrid2,
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : "repeat(auto-fit, minmax(220px, 1fr))",
              }}
            >
              <div>
                <label style={styles.label}>Horário</label>
                <input
                  style={styles.input}
                  type="time"
                  value={newAppointment.time}
                  onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                />
              </div>
              <div style={styles.infoBox}>
                Será criado 1 agendamento único para este paciente.
              </div>
            </div>
          ) : (
            <div style={styles.recurringBox}>
              <div
                style={{
                  ...styles.formGrid2,
                  gridTemplateColumns: isMobile
                    ? "1fr"
                    : "repeat(auto-fit, minmax(220px, 1fr))",
                }}
              >
                <div>
                  <label style={styles.label}>Quantidade de semanas</label>
                  <input
                    style={styles.input}
                    type="number"
                    min={1}
                    value={newAppointment.recurrenceWeeks}
                    onChange={(e) =>
                      setNewAppointment({
                        ...newAppointment,
                        recurrenceWeeks: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div style={styles.infoBox}>
                  O sistema criará automaticamente os atendimentos da rotina semanal.
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700, marginBottom: 10 }}>
                  Dias e horários da rotina
                </div>

                <div
                  style={{
                    ...styles.recurringGrid,
                    gridTemplateColumns: isMobile
                      ? "1fr"
                      : "repeat(auto-fit, minmax(230px, 1fr))",
                  }}
                >
                  {newAppointment.recurrenceDays.map((day) => (
                    <div key={day.weekday} style={styles.recurringDayCard}>
                      <button
                        style={day.selected ? styles.daySelectActive : styles.daySelect}
                        onClick={() => toggleRecurrenceDay(day.weekday)}
                      >
                        {day.label}
                      </button>

                      {day.selected ? (
                        <div style={{ display: "grid", gap: 8 }}>
                          {day.times.map((time, index) => (
                            <div
                              key={`${day.weekday}-${index}`}
                              style={{
                                display: "grid",
                                gap: 8,
                                gridTemplateColumns: isMobile ? "1fr" : "1fr auto",
                              }}
                            >
                              <input
                                style={styles.input}
                                type="time"
                                value={time}
                                onChange={(e) =>
                                  updateRecurrenceTime(day.weekday, index, e.target.value)
                                }
                              />
                              {day.times.length > 1 ? (
                                <button
                                  style={styles.deleteButton}
                                  onClick={() => removeRecurrenceTime(day.weekday, index)}
                                >
                                  Remover
                                </button>
                              ) : null}
                            </div>
                          ))}

                          <button
                            style={styles.secondaryButton}
                            onClick={() => addRecurrenceTime(day.weekday)}
                          >
                            Adicionar horário
                          </button>
                        </div>
                      ) : (
                        <div style={{ color: colors.subtext, fontSize: 13 }}>
                          Toque para ativar este dia.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.infoBox}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Resumo do plano</div>
                <div>{recurrenceSelection.validDays.length} dia(s) selecionado(s)</div>
                <div>{recurrenceSelection.sessionsPerWeek} atendimento(s) por semana</div>
                <div>{newAppointment.recurrenceWeeks} semana(s)</div>
                <div style={{ fontWeight: 700, marginTop: 6 }}>
                  Total previsto: {recurrenceSelection.totalAppointments} agendamento(s)
                </div>
              </div>
            </div>
          )}

          <div>
            <label style={styles.label}>Observações</label>
            <textarea
              style={styles.textarea}
              value={newAppointment.notes}
              onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
            />
          </div>

          <div style={styles.footerButtons}>
            <button
              style={styles.secondaryButton}
              onClick={() => setAppointmentDialogOpen(false)}
            >
              Fechar
            </button>
            <button style={styles.primaryButton} onClick={createAppointment}>
              {newAppointment.scheduleMode === "single"
                ? "Salvar agendamento"
                : "Criar plano recorrente"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: colors.bg,
    padding: 12,
  },
  container: {
    maxWidth: 1320,
    margin: "0 auto",
    display: "grid",
    gap: 20,
  },
  heroCard: {
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(247,250,255,0.98) 100%)",
  },
  topTabsCard: {
    padding: 10,
    background: "rgba(255,255,255,0.92)",
  },
  card: {
    background: colors.card,
    borderRadius: 28,
    border: `1px solid ${colors.border}`,
    padding: 20,
    boxShadow: colors.shadow,
  },
  heroHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 18,
    alignItems: "center",
    flexWrap: "wrap",
  },
  overline: {
    margin: 0,
    color: colors.subtext,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  title: {
    margin: "10px 0 0",
    fontSize: 40,
    lineHeight: 1.02,
    color: colors.text,
    fontWeight: 800,
  },
  subtitle: {
    margin: "10px 0 0",
    color: colors.subtext,
    fontSize: 15,
    lineHeight: 1.55,
    maxWidth: 620,
  },
  heroButtons: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButton: {
    background: colors.primary,
    color: colors.primaryText,
    border: "none",
    borderRadius: 16,
    padding: "13px 18px",
    cursor: "pointer",
    fontWeight: 700,
    boxShadow: "0 12px 24px rgba(15, 23, 42, 0.16)",
  },
  secondaryButton: {
    background: "#ffffff",
    color: colors.text,
    border: `1px solid ${colors.borderStrong}`,
    borderRadius: 16,
    padding: "13px 18px",
    cursor: "pointer",
    fontWeight: 600,
  },
  deleteButton: {
    background: colors.dangerBg,
    color: colors.dangerText,
    border: "1px solid #fecaca",
    borderRadius: 16,
    padding: "13px 18px",
    cursor: "pointer",
    fontWeight: 700,
  },
  iconButton: {
    background: "#ffffff",
    border: `1px solid ${colors.border}`,
    borderRadius: 14,
    padding: "9px 12px",
    cursor: "pointer",
    minWidth: 44,
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
  },
  statCard: {
    padding: 16,
    background: "rgba(255,255,255,0.92)",
  },
  statLine: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: colors.subtext,
    fontSize: 14,
  },
  tabsWrap: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
  },
  tabButton: {
    background: colors.card,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderRadius: 18,
    padding: "14px 14px",
    cursor: "pointer",
    fontWeight: 700,
  },
  tabActive: {
    background: colors.primary,
    color: colors.primaryText,
    border: `1px solid ${colors.primary}`,
    borderRadius: 18,
    padding: "14px 14px",
    cursor: "pointer",
    fontWeight: 700,
    boxShadow: "0 10px 20px rgba(15, 23, 42, 0.14)",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1.5fr 0.85fr",
    gap: 20,
    alignItems: "start",
  },
  sectionTitle: {
    margin: 0,
    fontSize: 24,
    color: colors.text,
    fontWeight: 800,
  },
  sectionDescription: {
    margin: "8px 0 0",
    color: colors.subtext,
    fontSize: 14,
    lineHeight: 1.5,
  },
  viewSwitch: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
    background: colors.softBlue,
    padding: 6,
    borderRadius: 22,
    border: `1px solid ${colors.border}`,
  },
  viewButton: {
    background: "#ffffff",
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderRadius: 18,
    padding: "12px 10px",
    cursor: "pointer",
    fontWeight: 700,
  },
  viewButtonActive: {
    background: colors.primary,
    color: colors.primaryText,
    border: `1px solid ${colors.primary}`,
    borderRadius: 18,
    padding: "12px 10px",
    cursor: "pointer",
    fontWeight: 700,
    boxShadow: "0 10px 20px rgba(15, 23, 42, 0.14)",
  },
  formGrid2: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },
  label: {
    display: "block",
    marginBottom: 6,
    color: colors.subtext,
    fontSize: 13,
    fontWeight: 700,
  },
  inlineHint: {
    fontSize: 12,
    color: colors.subtext,
    marginTop: 6,
    paddingLeft: 2,
  },
  input: {
    width: "100%",
    borderRadius: 16,
    border: `1px solid ${colors.borderStrong}`,
    padding: "13px 14px",
    background: "#ffffff",
    color: colors.text,
  },
  textarea: {
    width: "100%",
    minHeight: 110,
    borderRadius: 16,
    border: `1px solid ${colors.borderStrong}`,
    padding: "13px 14px",
    background: "#ffffff",
    color: colors.text,
    resize: "vertical",
  },
  slotCard: {
    borderRadius: 22,
    border: `1px solid ${colors.border}`,
    padding: 14,
    background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
  },
  rowBetween: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  freeBox: {
    marginTop: 10,
    borderRadius: 16,
    border: `1px dashed ${colors.freeBorder}`,
    background: colors.freeBg,
    color: colors.successText,
    padding: 13,
    fontSize: 13,
    textAlign: "center",
    fontWeight: 600,
  },
  appointmentButton: {
    width: "100%",
    border: `1px solid ${colors.border}`,
    borderRadius: 18,
    padding: 12,
    cursor: "pointer",
  },
  companyEventButton: {
    width: "100%",
    background: colors.companyBg,
    border: `1px solid ${colors.companyBorder}`,
    borderRadius: 18,
    padding: 12,
    cursor: "pointer",
  },
  weekCard: {
    borderRadius: 22,
    border: `1px solid ${colors.border}`,
    padding: 12,
    background: colors.cardSoft,
    minHeight: 190,
  },
  dayHeaderButton: {
    background: "transparent",
    border: "none",
    padding: 0,
    cursor: "pointer",
    width: "100%",
    textAlign: "left",
    marginBottom: 12,
  },
  appointmentMini: {
    width: "100%",
    border: `1px solid ${colors.border}`,
    borderRadius: 16,
    padding: 9,
    cursor: "pointer",
    textAlign: "left",
  },
  companyMiniButton: {
    width: "100%",
    background: colors.companyBg,
    border: `1px solid ${colors.companyBorder}`,
    borderRadius: 16,
    padding: 9,
    cursor: "pointer",
    textAlign: "left",
  },
  monthCell: {
    minHeight: 170,
    borderRadius: 22,
    border: `1px solid ${colors.border}`,
    background: colors.cardSoft,
    padding: 10,
    cursor: "pointer",
    textAlign: "left",
  },
  monthEventPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    borderRadius: 12,
    border: "1px solid",
    padding: "6px 8px",
    fontSize: 11,
    fontWeight: 700,
  },
  monthCompanyPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    borderRadius: 12,
    border: `1px solid ${colors.companyBorder}`,
    background: colors.companyBg,
    color: colors.companyText,
    padding: "6px 8px",
    fontSize: 11,
    fontWeight: 700,
  },
  monthLegend: {
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
    marginTop: 14,
    paddingTop: 10,
  },
  monthLegendItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: colors.subtext,
    fontSize: 12,
    fontWeight: 600,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 999,
    border: "1px solid",
    display: "inline-block",
  },
  summaryButton: {
    width: "100%",
    background: "linear-gradient(180deg, #f8fbff 0%, #f2f6fc 100%)",
    border: `1px solid ${colors.border}`,
    borderRadius: 18,
    padding: 14,
    cursor: "pointer",
  },
  empty: {
    borderRadius: 16,
    border: `1px dashed ${colors.border}`,
    background: colors.soft,
    padding: 16,
    color: colors.subtext,
    fontSize: 14,
  },
  patientGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 14,
  },
  patientCardButton: {
    borderRadius: 22,
    border: `1px solid ${colors.border}`,
    padding: 16,
    background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
    cursor: "pointer",
    textAlign: "left",
  },
  locationButton: {
    display: "block",
    width: "100%",
    borderRadius: 20,
    border: `1px solid ${colors.border}`,
    padding: 16,
    cursor: "pointer",
    textAlign: "left",
  },
  miniInfoButton: {
    width: "100%",
    background: "#ffffff",
    border: `1px solid ${colors.border}`,
    borderRadius: 16,
    padding: 12,
    textAlign: "left",
    cursor: "pointer",
  },
  formSection: {
    borderRadius: 20,
    border: `1px solid ${colors.border}`,
    background: colors.cardSoft,
    padding: 16,
  },
  manageLocationCard: {
    borderRadius: 18,
    border: `1px solid ${colors.border}`,
    padding: 14,
  },
  companyManagerCard: {
    borderRadius: 18,
    border: `1px solid ${colors.companyBorder}`,
    background: colors.companyBg,
    padding: 14,
  },
  manageActions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  warningBox: {
    borderRadius: 20,
    border: "1px solid #fed7aa",
    background: colors.warningBg,
    padding: 16,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.40)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    zIndex: 1000,
    backdropFilter: "blur(4px)",
  },
  modal: {
    width: "min(920px, 100%)",
    maxHeight: "90vh",
    overflowY: "auto",
    background: colors.card,
    borderRadius: 28,
    padding: 22,
    border: `1px solid ${colors.border}`,
    boxShadow: "0 26px 48px rgba(15,23,42,0.14)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "start",
    gap: 12,
  },
  modalTitle: {
    margin: 0,
    color: colors.text,
    fontSize: 24,
    fontWeight: 800,
  },
  modalDescription: {
    margin: "8px 0 0",
    color: colors.subtext,
    fontSize: 14,
  },
  footerButtons: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
    flexWrap: "wrap",
  },
  infoGrid: {
    display: "grid",
    gap: 10,
    color: colors.text,
    fontSize: 14,
    lineHeight: 1.55,
  },
  infoBox: {
    borderRadius: 18,
    border: `1px solid ${colors.border}`,
    background: "linear-gradient(180deg, #f8fbff 0%, #f2f6fc 100%)",
    padding: 14,
    color: colors.subtext,
    fontSize: 14,
    lineHeight: 1.5,
  },
  recurringBox: {
    borderRadius: 20,
    border: `1px solid ${colors.border}`,
    background: colors.softBlue,
    padding: 14,
    display: "grid",
    gap: 14,
  },
  recurringGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: 12,
  },
  recurringDayCard: {
    borderRadius: 18,
    border: `1px solid ${colors.border}`,
    background: "#ffffff",
    padding: 12,
  },
  daySelect: {
    width: "100%",
    background: colors.soft,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderRadius: 14,
    padding: "10px 12px",
    cursor: "pointer",
    textAlign: "left",
    fontWeight: 700,
    marginBottom: 10,
  },
  daySelectActive: {
    width: "100%",
    background: colors.primary,
    color: colors.primaryText,
    border: `1px solid ${colors.primary}`,
    borderRadius: 14,
    padding: "10px 12px",
    cursor: "pointer",
    textAlign: "left",
    fontWeight: 700,
    marginBottom: 10,
    boxShadow: "0 10px 20px rgba(15, 23, 42, 0.14)",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  toast: {
    position: "fixed",
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 1200,
    border: "1px solid",
    borderRadius: 16,
    padding: "12px 16px",
    boxShadow: "0 10px 30px rgba(15,23,42,0.12)",
    maxWidth: "calc(100vw - 24px)",
  },
};

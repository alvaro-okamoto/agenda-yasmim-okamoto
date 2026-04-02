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

type EnrichedAppointment = Appointment & {
  patient?: Patient;
  location?: Location;
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

const colors = {
  bg: "#f4f7fb",
  bgAccent: "#eef3fb",
  card: "#ffffff",
  border: "#d9e2ee",
  borderStrong: "#c8d4e3",
  text: "#0f172a",
  subtext: "#64748b",
  primary: "#0f172a",
  primarySoft: "#1e293b",
  primaryText: "#ffffff",
  soft: "#f8fafc",
  softBlue: "#f4f8ff",
  successBg: "#ecfdf5",
  successText: "#047857",
  dangerBg: "#fef2f2",
  dangerText: "#b91c1c",
  freeBg: "#ecfdf5",
  freeBorder: "#bbf7d0",
  shadow: "0 14px 34px rgba(15, 23, 42, 0.06)",
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

const weekdayLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const recurrenceWeekdaysSeed: RecurrenceDay[] = [
  { weekday: 1, label: "Segunda", selected: false, times: ["08:00"] },
  { weekday: 2, label: "Terça", selected: false, times: ["08:00"] },
  { weekday: 3, label: "Quarta", selected: false, times: ["08:00"] },
  { weekday: 4, label: "Quinta", selected: false, times: ["08:00"] },
  { weekday: 5, label: "Sexta", selected: false, times: ["08:00"] },
  { weekday: 6, label: "Sábado", selected: false, times: ["08:00"] },
];
const hourSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

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

function summarizeFreeWindows(items: Array<{ time: string }>) {
  const occupied = new Set(items.map((item) => item.time));
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
}: {
  open: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "start",
            gap: 12,
          }}
        >
          <div>
            <h3 style={{ margin: 0, color: colors.text, fontSize: 22 }}>{title}</h3>
            {description ? (
              <p style={{ margin: "8px 0 0", color: colors.subtext, fontSize: 14 }}>
                {description}
              </p>
            ) : null}
          </div>
          <button style={styles.iconButton} onClick={onClose}>
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

const statusTone = (status: string): "default" | "success" | "danger" => {
  if (status === "Confirmado" || status === "Realizado") return "success";
  if (status === "Cancelado") return "danger";
  return "default";
};

export default function App() {
  const width = useWindowWidth();
  const isMobile = width < 900;
  const isSmallMobile = width < 640;

  const [locations] = useState<Location[]>(locationsSeed);
  const [patients, setPatients] = useState<Patient[]>(patientsSeed);
  const [appointments, setAppointments] = useState<Appointment[]>(appointmentsSeed);

  const [tab, setTab] = useState("agenda");
  const [calendarView, setCalendarView] = useState("week");
  const [selectedDate, setSelectedDate] = useState("2026-04-01");
  const [search, setSearch] = useState("");

  const [selectedAppointment, setSelectedAppointment] =
    useState<EnrichedAppointment | null>(null);
  const [patientDialogOpen, setPatientDialogOpen] = useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [monthlyOpen, setMonthlyOpen] = useState(false);
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

  const filteredAppointments = useMemo(() => {
    return enrichedAppointments.filter((a) => {
      if (!search.trim()) return true;
      return a.patient?.name.toLowerCase().includes(search.toLowerCase());
    });
  }, [enrichedAppointments, search]);

  const stats = useMemo(() => {
    const today = enrichedAppointments.filter((a) => a.date === selectedDate);
    return {
      total: today.length,
      confirmed: today.filter((a) => a.status === "Confirmado").length,
      pending: today.filter((a) => a.status === "Agendado").length,
      changes: today.filter((a) => a.notes.toLowerCase().includes("reag")).length,
    };
  }, [enrichedAppointments, selectedDate]);

  const dayItems = useMemo(() => {
    return filteredAppointments
      .filter((a) => a.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [filteredAppointments, selectedDate]);

  const daySchedule = useMemo(() => {
    return hourSlots.map((hour) => ({
      hour,
      appointments: dayItems.filter((item) => item.time === hour),
    }));
  }, [dayItems]);

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

  const appointmentsByDate = useMemo(() => {
    return filteredAppointments.reduce<Record<string, EnrichedAppointment[]>>(
      (acc, appt) => {
        if (!acc[appt.date]) acc[appt.date] = [];
        acc[appt.date].push(appt);
        acc[appt.date].sort((a, b) => a.time.localeCompare(b.time));
        return acc;
      },
      {}
    );
  }, [filteredAppointments]);

  const monthlySummaryByPatient = useMemo(() => {
    const monthPrefix = selectedDate.slice(0, 7);
    const scoped = filteredAppointments.filter((appt) =>
      appt.date.startsWith(monthPrefix)
    );

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
      if (appt.status === "Agendado" || appt.status === "Confirmado")
        acc[key].pending += 1;

      acc[key].appointments.sort((a, b) =>
        `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
      );

      return acc;
    }, {});

    return Object.values(grouped).sort(
      (a, b) => b.total - a.total || a.name.localeCompare(b.name)
    );
  }, [filteredAppointments, selectedDate]);

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

  function resetAppointmentForm() {
    setNewAppointment(
      createDefaultAppointmentState(
        selectedDate,
        patients[0]?.id || "",
        locations[0]?.id || "l1"
      )
    );
  }

  function createPatient() {
    if (!newPatient.name.trim()) {
      return showToast("error", "Informe o nome do paciente.");
    }

    setPatients((prev) => [...prev, { ...newPatient, id: nextId("p") }]);
    setNewPatient({
      name: "",
      phone: "",
      defaultLocationId: "l1",
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

  return (
    <div style={styles.page}>
      <style>{`
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body {
          margin: 0;
          font-family: Inter, Arial, Helvetica, sans-serif;
          background:
            radial-gradient(circle at top left, #f9fbff 0%, #f4f7fb 45%, #eef3fb 100%);
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
                  fontSize: isSmallMobile ? 28 : isMobile ? 34 : 38,
                }}
              >
                Agenda Terapêutica
              </h1>
              <p style={styles.subtitle}>
                Uma agenda clara, prática e elegante para acompanhar atendimentos,
                rotina semanal e organização da clínica.
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
                Novo paciente
              </button>
              <button
                style={{ ...styles.secondaryButton, width: isMobile ? "100%" : "auto" }}
                onClick={() => setAppointmentDialogOpen(true)}
              >
                Novo agendamento
              </button>
              <button
                style={{ ...styles.secondaryButton, width: isMobile ? "100%" : "auto" }}
                onClick={() => setTab("locais")}
              >
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
              <span>Atendimentos do dia</span>
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
              <span>Mudanças</span>
              <strong>{stats.changes}</strong>
            </div>
          </SectionCard>
        </div>

        <SectionCard style={styles.topTabsCard}>
          <div
            style={{
              ...styles.tabsWrap,
              gridTemplateColumns: "repeat(3, 1fr)",
            }}
          >
            {[
              { id: "agenda", label: "Agenda" },
              { id: "pacientes", label: "Pacientes" },
              { id: "locais", label: "Locais" },
            ].map((item) => (
              <button
                key={item.id}
                style={tab === item.id ? styles.tabActive : styles.tabButton}
                onClick={() => setTab(item.id)}
              >
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
                      placeholder="Paciente"
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
                                slot.appointments.length > 0
                                  ? colors.subtext
                                  : colors.successText,
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            {slot.appointments.length > 0
                              ? `${slot.appointments.length} agendamento(s)`
                              : "Livre"}
                          </span>
                        </div>

                        {slot.appointments.length > 0 ? (
                          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                            {slot.appointments.map((appt) => (
                              <button
                                key={appt.id}
                                style={styles.appointmentButton}
                                onClick={() => setSelectedAppointment(appt)}
                              >
                                <div style={styles.rowBetween}>
                                  <div style={{ textAlign: "left" }}>
                                    <div style={{ fontWeight: 700 }}>{appt.patient?.name}</div>
                                    <div style={{ color: colors.subtext, fontSize: 13 }}>
                                      {appt.location?.name} • {appt.type}
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
                        const items = appointmentsByDate[day.iso] || [];
                        const isSelected = day.iso === selectedDate;
                        const freeSummary = summarizeFreeWindows(items);

                        return (
                          <div
                            key={day.iso}
                            style={{
                              ...styles.weekCard,
                              borderColor: isSelected ? colors.primary : colors.border,
                              background: isSelected ? "#fbfdff" : colors.card,
                            }}
                          >
                            <button
                              style={{ ...styles.dayHeaderButton, color: colors.text }}
                              onClick={() => setSelectedDate(day.iso)}
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
                                {items.map((appt) => (
                                  <button
                                    key={appt.id}
                                    style={styles.appointmentMini}
                                    onClick={() => setSelectedAppointment(appt)}
                                  >
                                    <div style={{ fontWeight: 700, fontSize: 12 }}>
                                      {appt.time} • {appt.patient?.name}
                                    </div>
                                    <div style={{ color: colors.subtext, fontSize: 11 }}>
                                      {appt.location?.name}
                                    </div>
                                  </button>
                                ))}
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
                          const items = appointmentsByDate[day.iso] || [];
                          const isSelected = day.iso === selectedDate;

                          return (
                            <button
                              key={day.iso}
                              style={{
                                ...styles.monthCell,
                                borderColor: isSelected ? colors.primary : colors.border,
                                opacity: day.currentMonth ? 1 : 0.45,
                                background: isSelected ? "#fbfdff" : colors.card,
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
                                  {items.slice(0, 3).map((appt) => (
                                    <div key={appt.id} style={styles.monthTime}>
                                      {appt.time}
                                    </div>
                                  ))}
                                  {items.length > 3 ? (
                                    <div style={{ fontSize: 11, color: colors.subtext }}>
                                      + {items.length - 3} horário(s)
                                    </div>
                                  ) : null}
                                </div>
                              )}
                            </button>
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
              Cadastro simples com frequência e observações.
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
              {patients.map((patient) => (
                <div key={patient.id} style={styles.patientCard}>
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
                    }}
                  >
                    <div>Telefone: {patient.phone}</div>
                    <div>
                      Local:{" "}
                      {locations.find((l) => l.id === patient.defaultLocationId)?.name ||
                        "Sem local"}
                    </div>
                  </div>

                  <div style={{ marginTop: 10, color: colors.subtext, fontSize: 14 }}>
                    {patient.notes || "Sem observações."}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        ) : null}

        {tab === "locais" ? (
          <SectionCard>
            <h2 style={styles.sectionTitle}>Locais</h2>
            <p style={styles.sectionDescription}>Locais de atendimento cadastrados.</p>

            <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
              {locations.map((loc) => (
                <div key={loc.id} style={styles.locationRow}>
                  <strong>{loc.name}</strong>
                  <span style={{ color: colors.subtext, fontSize: 14 }}>
                    {filteredAppointments.filter((a) => a.locationId === loc.id).length} atend.
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        ) : null}
      </div>

      <Modal
        open={monthlyOpen}
        onClose={() => setMonthlyOpen(false)}
        title={monthlyPatientDetails?.name || "Paciente"}
        description="Detalhes dos atendimentos deste mês."
      >
        <div style={{ display: "grid", gap: 12 }}>
          {monthlyPatientDetails?.appointments.map((appt) => (
            <button
              key={appt.id}
              style={styles.summaryButton}
              onClick={() => {
                setMonthlyOpen(false);
                setSelectedAppointment(appt);
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
        onClose={() => setSelectedAppointment(null)}
        title="Detalhes do atendimento"
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
                Reagendar
              </button>
              <button
                style={styles.secondaryButton}
                onClick={() => updateSelectedAppointmentStatus("Confirmado")}
              >
                Confirmar
              </button>
              <button
                style={styles.secondaryButton}
                onClick={() => updateSelectedAppointmentStatus("Realizado")}
              >
                Marcar realizado
              </button>
              <button
                style={styles.secondaryButton}
                onClick={() => updateSelectedAppointmentStatus("Cancelado")}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={rescheduleDialogOpen}
        onClose={() => setRescheduleDialogOpen(false)}
        title="Reagendar atendimento"
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
        title="Novo paciente"
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
        title="Novo agendamento"
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
                                  style={styles.smallDanger}
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
    background: "rgba(255,255,255,0.9)",
  },
  card: {
    background: colors.card,
    borderRadius: 26,
    border: `1px solid ${colors.border}`,
    padding: 20,
    boxShadow: colors.shadow,
    backdropFilter: "blur(6px)",
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
    fontSize: 38,
    lineHeight: 1.05,
    color: colors.text,
    fontWeight: 800,
  },
  subtitle: {
    margin: "10px 0 0",
    color: colors.subtext,
    fontSize: 15,
    lineHeight: 1.5,
    maxWidth: 620,
  },
  heroButtons: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  primaryButton: {
    background: colors.primary,
    color: colors.primaryText,
    border: "none",
    borderRadius: 16,
    padding: "13px 18px",
    cursor: "pointer",
    fontWeight: 700,
    boxShadow: "0 12px 24px rgba(15, 23, 42, 0.18)",
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
  iconButton: {
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    padding: "8px 10px",
    cursor: "pointer",
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
    borderRadius: 16,
    padding: "14px 14px",
    cursor: "pointer",
    fontWeight: 700,
  },
  tabActive: {
    background: colors.primary,
    color: colors.primaryText,
    border: `1px solid ${colors.primary}`,
    borderRadius: 16,
    padding: "14px 14px",
    cursor: "pointer",
    fontWeight: 700,
    boxShadow: "0 10px 20px rgba(15, 23, 42, 0.16)",
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
    borderRadius: 20,
    border: `1px solid ${colors.border}`,
  },
  viewButton: {
    background: "rgba(255,255,255,0.9)",
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderRadius: 16,
    padding: "12px 10px",
    cursor: "pointer",
    fontWeight: 700,
  },
  viewButtonActive: {
    background: colors.primary,
    color: colors.primaryText,
    border: `1px solid ${colors.primary}`,
    borderRadius: 16,
    padding: "12px 10px",
    cursor: "pointer",
    fontWeight: 700,
    boxShadow: "0 10px 20px rgba(15, 23, 42, 0.16)",
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
    background: colors.card,
    color: colors.text,
  },
  textarea: {
    width: "100%",
    minHeight: 110,
    borderRadius: 16,
    border: `1px solid ${colors.borderStrong}`,
    padding: "13px 14px",
    background: colors.card,
    color: colors.text,
    resize: "vertical",
  },
  slotCard: {
    borderRadius: 20,
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
    background: "linear-gradient(180deg, #f8fbff 0%, #f3f7fc 100%)",
    border: `1px solid ${colors.border}`,
    borderRadius: 16,
    padding: 12,
    cursor: "pointer",
  },
  weekCard: {
    borderRadius: 20,
    border: `1px solid ${colors.border}`,
    padding: 12,
    background: colors.card,
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
    background: "linear-gradient(180deg, #f8fbff 0%, #f3f7fc 100%)",
    border: `1px solid ${colors.border}`,
    borderRadius: 14,
    padding: 9,
    cursor: "pointer",
    textAlign: "left",
  },
  monthCell: {
    minHeight: 170,
    borderRadius: 20,
    border: `1px solid ${colors.border}`,
    background: colors.card,
    padding: 10,
    cursor: "pointer",
    textAlign: "left",
  },
  monthTime: {
    background: "linear-gradient(180deg, #f8fbff 0%, #f2f6fc 100%)",
    borderRadius: 12,
    padding: "6px 8px",
    fontSize: 11,
    border: `1px solid ${colors.border}`,
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
  patientCard: {
    borderRadius: 20,
    border: `1px solid ${colors.border}`,
    padding: 16,
    background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
  },
  locationRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 18,
    border: `1px solid ${colors.border}`,
    padding: 14,
    background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.38)",
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
    borderRadius: 26,
    padding: 22,
    border: `1px solid ${colors.border}`,
    boxShadow: "0 24px 48px rgba(15,23,42,0.14)",
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
    lineHeight: 1.5,
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
    background: colors.card,
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
  smallDanger: {
    background: colors.dangerBg,
    color: colors.dangerText,
    border: "1px solid #fecaca",
    borderRadius: 14,
    padding: "0 12px",
    cursor: "pointer",
    minHeight: 46,
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

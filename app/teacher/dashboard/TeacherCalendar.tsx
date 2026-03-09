"use client";

import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { de } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
  de: de,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export default function TeacherCalendar({ events }: { events: any[] }) {
  return (
    <div className="bg-white shadow p-4 rounded-xl mt-6">
      <h2 className="text-xl font-semibold mb-4">Kalender</h2>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        views={["month", "week", "day"]}
        messages={{
          next: "Weiter",
          previous: "Zurück",
          today: "Heute",
          month: "Monat",
          week: "Woche",
          day: "Tag",
        }}
      />
    </div>
  );
}

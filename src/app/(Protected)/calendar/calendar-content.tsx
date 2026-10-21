"use client";

import { EventCalendar } from "@/components/event-calendar";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { getCurrentDay } from "@/lib/utils";
import {
  EventClickInfo,
  EventDisplayInfo,
  EventSourceInput,
} from "@fullcalendar/react";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { cn } from "cn";
import { CheckCircle2Icon, ClockIcon } from "lucide-react";
import { useState } from "react";
interface Props {
  initialEvents: EventSourceInput;
}

function renderEventContent(eventInfo: EventDisplayInfo) {
  if (eventInfo.event.extendedProps.type !== "study") {
    return (
      <div className="flex flex-col p-1 sm:p-2 min-w-0 overflow-hidden leading-tight">
        <p className="text-xs sm:text-sm font-semibold truncate">
          {eventInfo.event.title}
        </p>
      </div>
    );
  }

  const extendedProps = eventInfo.event
    .extendedProps as DailyScheduleWithRelations;
  const isCompleted = extendedProps.status === "completed";
  const isOverdue = extendedProps.status === "overdue";
  const isOverload = extendedProps.is_overload;

  return (
    <div
      className={cn(
        "flex flex-col p-1 sm:p-2 gap-0.5 sm:gap-1 min-w-0 overflow-hidden leading-tight rounded-xs transition-opacity",
        isCompleted && "opacity-75 hover:opacity-100",
        isOverdue && "",
        isOverload &&
          !isCompleted &&
          !isOverdue &&
          "border-l-2 border-l-amber-500 pl-1.5",
      )}
    >
      <div className="flex items-center gap-1 min-w-0">
        {isCompleted && (
          <CheckCircle2Icon className="size-3 sm:size-3.5 text-emerald-500 shrink-0" />
        )}
        <p
          className={cn(
            "text-xs sm:text-sm font-semibold truncate",
            isCompleted && "line-through",
            isOverdue && "text-destructive font-bold",
          )}
        >
          {extendedProps.course.title}
        </p>
      </div>

      <div className="flex items-center justify-between gap-1 text-[10px] sm:text-xs">
        {extendedProps.target_pages} hlm
      </div>

      <Badge
        variant="secondary"
        className="mt-0.5 w-fit max-w-full text-[10px] sm:text-xs px-1 sm:px-1.5 py-0 truncate font-normal"
      >
        <span className="truncate">{extendedProps.milestone.title}</span>
      </Badge>

      <div className="mt-1 flex flex-wrap gap-1">
        {isCompleted && (
          <Badge
            variant="default"
            className="w-fit gap-1 text-[10px] sm:text-xs px-1.5 py-0 bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
          >
            <CheckCircle2Icon className="size-3 shrink-0" />
            <span>Selesai</span>
          </Badge>
        )}

        {isOverdue && (
          <Badge
            variant="destructive"
            className="w-fit gap-1 text-[10px] sm:text-xs px-1.5 py-0 bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <ClockIcon className="size-3 shrink-0" />
            <span>Terlewat</span>
          </Badge>
        )}

        {isOverload && (
          <Badge
            variant="outline"
            className={cn(
              "w-fit gap-1 text-[10px] sm:text-xs px-1.5 py-0 border",
              isCompleted
                ? "border-muted-foreground/30 text-muted-foreground"
                : "border-amber-400 bg-amber-500/10 text-amber-700 dark:text-amber-400 dark:border-amber-500/40 font-medium",
            )}
          >
            <WarningCircleIcon className="size-3 shrink-0" />
            <span>Overload</span>
          </Badge>
        )}
      </div>
    </div>
  );
}

function formatDate(dateStr?: string | Date | null) {
  if (!dateStr) return "-";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function StudyDetailContent({
  schedule,
  date,
}: {
  schedule: DailyScheduleWithRelations;
  date?: Date | null;
}) {
  const isCompleted = schedule.status === "completed";
  const isOverdue = schedule.status === "overdue";
  const isCritical = schedule.status === "critical";
  const isOverload = schedule.is_overload;
  const milestoneProgress = schedule.milestone
    ? Math.min(
        100,
        Math.round(
          ((schedule.milestone.readed_pages || 0) /
            (schedule.milestone.target_pages || 1)) *
            100,
        ),
      )
    : 0;

  return (
    <div className="space-y-3.5 text-sm px-4">
      {isOverload && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 p-2.5 text-xs text-amber-800 dark:text-amber-300">
          <WarningCircleIcon className="size-4 shrink-0 mt-0.5" />
          <span>
            Target membaca {schedule.target_pages} hlm melebihi kapasitas
            rekomendasi per hari (Overload).
          </span>
        </div>
      )}

      {/* Jadwal */}
      <div className="rounded-lg border bg-card p-3 space-y-2">
        <div className="flex items-center justify-between border-b pb-2">
          <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
            Jadwal Belajar
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {isCompleted && (
              <Badge className="bg-emerald-600 text-white gap-1 text-xs">
                <CheckCircle2Icon className="size-3" /> Selesai
              </Badge>
            )}
            {isOverdue && (
              <Badge variant="destructive" className="gap-1 text-xs">
                <ClockIcon className="size-3" /> Terlambat
              </Badge>
            )}
            {isCritical && (
              <Badge variant="destructive" className="gap-1 text-xs">
                <WarningCircleIcon className="size-3" /> Kritis
              </Badge>
            )}
            {!isCompleted && !isOverdue && !isCritical && (
              <Badge variant="secondary" className="text-xs">
                Belum Selesai
              </Badge>
            )}
            {isOverload && (
              <Badge
                variant="outline"
                className="border-amber-400 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs gap-1"
              >
                <WarningCircleIcon className="size-3" /> Overload
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Tanggal</p>
            <p className="font-medium mt-0.5">
              {formatDate(schedule.date || date)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Target Hari Ini</p>
            <p className="font-medium mt-0.5">
              Hal {schedule.from_page} - {schedule.to_page} (
              {schedule.target_pages} hlm)
            </p>
          </div>
        </div>
      </div>

      {/* Mata Kuliah */}
      <div className="rounded-lg border bg-card p-3 space-y-2">
        <div className="flex items-center gap-2 border-b pb-2">
          <span
            className="size-2.5 rounded-full shrink-0"
            style={{ backgroundColor: schedule.course?.color || "#3b82f6" }}
          />
          <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
            Mata Kuliah
          </span>
        </div>

        <div className="space-y-1.5 text-xs">
          <p className="font-semibold text-sm">
            {schedule.course?.title || "-"}
          </p>
          <div className="grid grid-cols-3 gap-2 pt-1 border-t text-muted-foreground">
            <div>
              Bobot:{" "}
              <strong className="text-foreground">
                {schedule.course?.credits ?? "-"} SKS
              </strong>
            </div>
            <div>
              Total:{" "}
              <strong className="text-foreground">
                {schedule.course?.page_count ?? "-"} Hlm
              </strong>
            </div>
            <div>
              Ujian:{" "}
              <strong className="text-foreground">
                {schedule.course?.exam_date
                  ? formatDate(schedule.course.exam_date)
                  : "-"}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Milestone */}
      {schedule.milestone && (
        <div className="rounded-lg border bg-card p-3 space-y-2">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
              Milestone Capaian
            </span>
            <Badge variant="outline" className="text-xs">
              {schedule.milestone.status === "completed"
                ? "Selesai"
                : schedule.milestone.status === "overdue"
                  ? "Terlambat"
                  : schedule.milestone.status === "critical"
                    ? "Kritis"
                    : "Dalam Proses"}
            </Badge>
          </div>

          <div className="space-y-2 text-xs">
            <p className="font-medium">{schedule.milestone.title}</p>
            <div>
              <div className="flex justify-between text-muted-foreground mb-1">
                <span>Progress Milestone</span>
                <span>
                  {schedule.milestone.readed_pages} /{" "}
                  {schedule.milestone.target_pages} hlm ({milestoneProgress}%)
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${milestoneProgress}%` }}
                />
              </div>
            </div>
            <p className="text-muted-foreground pt-1 border-t">
              Deadline:{" "}
              <span className="font-medium text-foreground">
                {formatDate(schedule.milestone.deadline)}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface DetailSheetProps {
  selectedEvent: EventClickInfo | null;
  isSheetOpen: boolean;
  setIsSheetOpen: (open: boolean) => void;
}

const DetailSheet = ({
  selectedEvent,
  isSheetOpen,
  setIsSheetOpen,
}: DetailSheetProps) => {
  const isStudy = selectedEvent?.event.extendedProps.type === "study";
  const extendedProps = (
    isStudy ? selectedEvent?.event.extendedProps : null
  ) as DailyScheduleWithRelations | null;

  return (
    <Sheet open={isSheetOpen} onOpenChange={(open) => setIsSheetOpen(open)}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {isStudy ? "Detail Jadwal Belajar" : "Detail Kegiatan"}
          </SheetTitle>
        </SheetHeader>

        {isStudy && extendedProps ? (
          <StudyDetailContent
            schedule={extendedProps}
            date={selectedEvent?.event.start}
          />
        ) : (
          <div className="space-y-3 text-sm">
            <Table>
              <TableBody>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableCell>{selectedEvent?.event.title || "-"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableHead>Tanggal Mulai</TableHead>
                  <TableCell>
                    {formatDate(selectedEvent?.event.start)}
                  </TableCell>
                </TableRow>
                {selectedEvent?.event.end && (
                  <TableRow>
                    <TableHead>Tanggal Selesai</TableHead>
                    <TableCell>
                      {formatDate(selectedEvent?.event.end)}
                    </TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableHead>Deskripsi</TableHead>
                  <TableCell className="whitespace-pre-line">
                    {selectedEvent?.event.extendedProps?.description ||
                      "Tidak ada deskripsi."}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default function CalendarContent({ initialEvents }: Props) {
  const [events, setEvents] = useState<EventSourceInput>(initialEvents);
  const [selectedEvent, setSelectedEvent] = useState<EventClickInfo | null>(
    null,
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const onEventClick = (eventInfo: EventClickInfo) => {
    setSelectedEvent(eventInfo);
    setIsSheetOpen(true);
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6 h-full fc-responsive-wrapper">
      <EventCalendar
        now={getCurrentDay()}
        showNonCurrentDates={false}
        availableViews={["dayGridMonth", "timeGridWeek", "listWeek"]}
        expandRows
        height="100%"
        locale="id"
        editable
        selectable
        events={events}
        eventClick={onEventClick}
        eventContent={renderEventContent}
        eventClass={(arg) => {
          if (arg.event.extendedProps.type === "study") {
            const extendedProps = arg.event
              .extendedProps as DailyScheduleWithRelations;

            const classes: string[] = ["transition-all"];
            if (extendedProps.status === "completed") {
              classes.push("opacity-75 hover:opacity-100");
            } else if (extendedProps.status === "overdue") {
              classes.push("ring-2 ring-destructive");
            }

            if (
              extendedProps.is_overload &&
              extendedProps.status !== "completed"
            ) {
              classes.push("ring-2 ring-amber-400");
            }

            return classes.join(" ");
          }
        }}
      />

      <DetailSheet
        selectedEvent={selectedEvent}
        isSheetOpen={isSheetOpen}
        setIsSheetOpen={setIsSheetOpen}
      />
    </div>
  );
}

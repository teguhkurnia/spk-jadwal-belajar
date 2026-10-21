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
import { ScheduleDayItem } from "@/lib/schedule";
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
      <div className="flex flex-col p-1 sm:p-2.5 min-w-0 overflow-hidden leading-tight">
        <p className="text-xs sm:text-sm font-semibold truncate">
          {eventInfo.event.title}
        </p>
      </div>
    );
  }

  const extendedProps = eventInfo.event
    .extendedProps as DailyScheduleWithRelations;
  return (
    <div className="flex flex-col p-1 sm:p-2.5 gap-0.5 sm:gap-1 min-w-0 overflow-hidden leading-tight">
      <div className="flex items-center justify-between min-w-0">
        <p className="text-xs sm:text-sm font-semibold truncate">
          {extendedProps.status === "completed" ? (
            <s>{extendedProps.course.title}</s>
          ) : (
            extendedProps.course.title
          )}
        </p>
      </div>
      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
        Target: {extendedProps.target_pages} Hlm
      </p>
      <Badge
        variant="secondary"
        className="mt-0.5 sm:mt-1 w-fit max-w-full text-[10px] sm:text-xs px-1 sm:px-2 py-0 truncate font-normal"
      >
        <span className="truncate">{extendedProps.milestone.title}</span>
      </Badge>

      <div className="mt-1 sm:mt-2 flex flex-wrap gap-1">
        {extendedProps.status === "completed" && (
          <Badge
            variant="default"
            className="w-fit gap-1 text-[10px] sm:text-xs px-1 sm:px-2 py-0"
          >
            <CheckCircle2Icon className="size-3 sm:size-3.5 shrink-0" />
            <span>Selesai</span>
          </Badge>
        )}

        {extendedProps.status === "overdue" && (
          <Badge
            variant="destructive"
            className="w-fit gap-1 text-[10px] sm:text-xs px-1 sm:px-2 py-0"
          >
            <ClockIcon className="size-3 sm:size-3.5 shrink-0" />
            <span>Terlambat</span>
          </Badge>
        )}

        {extendedProps.is_overload && (
          <Badge
            variant="default"
            className={cn(
              "w-fit gap-1 text-[10px] sm:text-xs px-1 sm:px-2 py-0",
              "bg-yellow-500 text-black hover:bg-yellow-600 focus:ring-yellow-500",
            )}
          >
            <WarningCircleIcon className="size-3 sm:size-3.5 shrink-0" />
            <span>Overload</span>
          </Badge>
        )}
      </div>
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
  const extendedProps = (
    selectedEvent?.event.extendedProps.type == "study"
      ? selectedEvent?.event.extendedProps
      : null
  ) as ScheduleDayItem | null;

  return (
    <Sheet open={isSheetOpen} onOpenChange={(open) => setIsSheetOpen(open)}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Detail Kegiatan</SheetTitle>
        </SheetHeader>
        <Table>
          <TableBody>
            {[
              {
                title: "Judul",
                value: selectedEvent?.event.title || "-",
              },
              {
                title: "Tanggal",
                value:
                  selectedEvent?.event.start?.toISOString().split("T")[0] ||
                  "-",
              },
              {
                title: "Mata Kuliah",
                value: extendedProps?.course.title || "-",
              },
              {
                title: "Milestone",
                value: extendedProps?.milestone.title || "-",
              },
              {
                title: "Halaman",
                value: extendedProps
                  ? `${extendedProps.from_page} - ${extendedProps.to_page}`
                  : "-",
              },
            ].map((item, index) => (
              <TableRow key={index}>
                <TableHead>{item.title}</TableHead>
                <TableCell className="whitespace-pre-line">
                  {item.value}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Description */}
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            {selectedEvent?.event.extendedProps.description ||
              "Tidak ada deskripsi."}
          </p>
        </div>
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
    const event = eventInfo.event;
    setSelectedEvent(eventInfo);
    setIsSheetOpen(true);
  };

  return (
    <div className="p-4 lg:p-6 h-full fc-responsive-wrapper">
      <EventCalendar
        now={getCurrentDay()}
        showNonCurrentDates={false}
        availableViews={["dayGridMonth", "timeGridWeek", "listWeek"]}
        // addButton={{
        //   text: "Add Event",
        //   click() {
        //     alert("add event...");
        //   },
        // }}
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

            // if (extendedProps.status === "completed") {
            //   return "bg-green-400 border border-green-400";
            // } else if (extendedProps.status === "overdue") {
            //   return "bg-red-100 border border-red-400 text-red-800";
            // }

            return extendedProps.is_overload ? "ring-2 ring-red-500!" : "";
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

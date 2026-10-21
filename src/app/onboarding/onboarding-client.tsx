"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useRouter } from "next/navigation";
import * as React from "react";
import { match } from "ts-pattern";
import { AnimatePresence, motion } from "motion/react";
import { milestone } from "@/lib/utils";
import { PlusIcon, TrashIcon, BookOpenIcon } from "@phosphor-icons/react";
import { CalendarIcon } from "lucide-react";
import { saveOnboardingData } from "@/actions/onboarding";
import { createClient } from "@/utils/supabase/client";
import { AddCourseModal } from "@/components/add-course-modal";
import { courseSchema } from "@/actions/type";
import z from "zod";

const DAYS = [
  { id: "Senin", label: "Senin", weekend: false },
  { id: "Selasa", label: "Selasa", weekend: false },
  { id: "Rabu", label: "Rabu", weekend: false },
  { id: "Kamis", label: "Kamis", weekend: false },
  { id: "Jumat", label: "Jumat", weekend: false },
  { id: "Sabtu", label: "Sabtu", weekend: true },
  { id: "Minggu", label: "Minggu", weekend: true },
];

const COLOR_PRESETS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
] as const;

const stepVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 30 : -30,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -30 : 30,
    opacity: 0,
  }),
};

interface LocalCourse {
  id: string;
  title: string;
  credits: number;
  pageCount: number;
  examDate: string;
  color: string;
  milestone1: number;
  milestone2: number;
  milestone3: number;
}

export default function OnboardingPageClient() {
  const router = useRouter();
  const [step, setStep] = React.useState<1 | 2 | 3 | 4 | 5>(1);
  const [direction, setDirection] = React.useState<1 | -1>(1);

  const goToStep = (nextStep: 1 | 2 | 3 | 4 | 5) => {
    setDirection(nextStep > step ? 1 : -1);
    setStep(nextStep);
  };

  const [semesterName, setSemesterName] = React.useState("Semester 1");
  const [kmaks, setKmaks] = React.useState(30);
  const [days, setDays] = React.useState<string[]>(DAYS.map((d) => d.id));
  const [tutonDate, setTutonDate] = React.useState("");

  // Step 5: local courses
  const [localCourses, setLocalCourses] = React.useState<LocalCourse[]>([]);

  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const toggleDay = (id: string) => {
    setDays((p) => (p.includes(id) ? p.filter((d) => d !== id) : [...p, id]));
  };

  const onFinish = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await saveOnboardingData({
        semesterName: semesterName || "Semester 1",
        startTutonDate: tutonDate,
        kmax: kmaks,
        daysOfWeek: days,
        courses: localCourses.map(({ id: _, ...course }) => course),
      });

      if (res?.error) {
        setErrorMsg(res.error);
        setLoading(false);
        return;
      }

      // resync
      const supabase = createClient();
      await supabase.auth.refreshSession();

      router.replace("/dashboard");
    } catch {
      setErrorMsg("Terjadi kesalahan saat menyimpan data.");
      setLoading(false);
    }
  };

  return (
    <>
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      <div className="flex min-h-dvh items-center justify-center p-4">
        <div
          className={`w-full ${step === 5 ? "max-w-3xl" : "max-w-xl"} space-y-4 transition-all duration-300 overflow-hidden`}
        >
          {errorMsg && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2 text-center mb-4">
              {errorMsg}
            </p>
          )}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="w-full"
            >
              {match(step)
                .with(1, () => (
                  <div className="flex flex-col items-center gap-6">
                    <h1 className="text-2xl font-medium leading-tight text-center">
                      Selamat datang di Asisten Belajar Mandiri PJJ! Mari atur
                      profil semester agar sistem bisa menyusun jadwal yang
                      paling realistis untuk Anda.
                    </h1>

                    <div className="w-full space-y-2 text-left">
                      <Label htmlFor="semester-name">Nama Semester</Label>
                      <Input
                        id="semester-name"
                        value={semesterName}
                        onChange={(e) => setSemesterName(e.target.value)}
                        placeholder="Contoh: 2026.1 / Semester 1"
                        required
                      />
                    </div>

                    <Separator />

                    <Button type="button" onClick={() => goToStep(2)}>
                      Lanjutkan
                    </Button>
                  </div>
                ))
                .with(2, () => (
                  <div className="space-y-6">
                    <h1 className="text-2xl font-medium leading-tight text-center mb-10">
                      Berapa batas maksimal halaman modul yang sanggup Anda
                      pelajari dalam satu hari?
                    </h1>

                    <Separator />

                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="">Max Halaman</Label>
                      <span className="text-sm text-muted-foreground">
                        {kmaks} hal/hari
                      </span>
                    </div>
                    <Slider
                      max={200}
                      step={1}
                      onValueChange={(value) => setKmaks(value as number)}
                      value={kmaks}
                    />
                    <p className="text-xs text-muted-foreground">
                      Note: Jika auto-reschedule &gt; {kmaks} hal/hari, sistem
                      memicu Overload Alert!
                    </p>

                    <div className="flex items-center gap-2 justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => goToStep(1)}
                      >
                        Kembali
                      </Button>
                      <Button type="button" onClick={() => goToStep(3)}>
                        Lanjutkan
                      </Button>
                    </div>
                  </div>
                ))
                .with(3, () => (
                  <div className="space-y-6">
                    <h1 className="text-2xl font-medium leading-tight text-center mb-10">
                      Kapan Anda biasanya memiliki waktu luang untuk fokus
                      belajar?
                    </h1>

                    <Separator />

                    {/* Badges Checkboxes */}
                    <div className="flex flex-wrap gap-2.5 justify-center max-w-lg mx-auto">
                      {DAYS.map((d) => {
                        const checked = days.includes(d.id);
                        return (
                          <Badge
                            key={d.id}
                            variant={checked ? "default" : "outline"}
                            className="cursor-pointer p-5 min-w-30 text-center"
                            onClick={() => toggleDay(d.id)}
                          >
                            {d.label}
                          </Badge>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2 justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => goToStep(2)}
                      >
                        Kembali
                      </Button>
                      <Button
                        type="button"
                        onClick={() => goToStep(4)}
                        disabled={days.length === 0}
                      >
                        Lanjutkan
                      </Button>
                    </div>
                  </div>
                ))
                .with(4, () => (
                  <div className="space-y-6">
                    <h1 className="text-2xl font-medium leading-tight text-center mb-10">
                      Tentukan kerangka waktu akademik semester ini agar sistem
                      dapat menyusun milestone tugas Anda.
                    </h1>

                    <Separator />

                    {/* Badges Checkboxes */}
                    <div className="space-y-2">
                      <Label htmlFor="tuton">
                        Tanggal Mulai Tutorial Online (Tuton)
                      </Label>
                      <Input
                        id="tuton"
                        type="date"
                        value={tutonDate}
                        onChange={(e) => setTutonDate(e.target.value)}
                        required
                      />
                      {tutonDate && (
                        <div className="rounded border bg-muted/40 p-2.5 text-xs space-y-1">
                          <p className="font-semibold text-foreground">
                            Acuan Jadwal Milestone Tugas:
                          </p>
                          <p>
                            • Tuton 1 (Minggu ke-3):{" "}
                            <span className="font-medium text-foreground">
                              {milestone(tutonDate, 3)?.toLocaleDateString(
                                "id-ID",
                              )}
                            </span>
                          </p>
                          <p>
                            • Tuton 2 (Minggu ke-5):{" "}
                            <span className="font-medium text-foreground">
                              {milestone(tutonDate, 5)?.toLocaleDateString(
                                "id-ID",
                              )}
                            </span>
                          </p>
                          <p>
                            • Tuton 3 (Minggu ke-7):{" "}
                            <span className="font-medium text-foreground">
                              {milestone(tutonDate, 7)?.toLocaleDateString(
                                "id-ID",
                              )}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                    <Separator />

                    <div className="flex items-center gap-2 justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => goToStep(3)}
                      >
                        Kembali
                      </Button>
                      <Button
                        type="button"
                        onClick={() => goToStep(5)}
                        disabled={!tutonDate}
                      >
                        Lanjutkan
                      </Button>
                    </div>
                  </div>
                ))
                .with(5, () => (
                  <Step5Courses
                    localCourses={localCourses}
                    setLocalCourses={setLocalCourses}
                    tutonDate={tutonDate}
                    loading={loading}
                    onBack={() => goToStep(4)}
                    onFinish={onFinish}
                  />
                ))
                .otherwise(() => (
                  <></>
                ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

function Step5Courses({
  localCourses,
  setLocalCourses,
  tutonDate,
  loading,
  onBack,
  onFinish,
}: {
  localCourses: LocalCourse[];
  setLocalCourses: React.Dispatch<React.SetStateAction<LocalCourse[]>>;
  tutonDate: string;
  loading: boolean;
  onBack: () => void;
  onFinish: () => void;
}) {
  const [title, setTitle] = React.useState("");
  const [credits, setCredits] = React.useState(3);
  const [pageCount, setPageCount] = React.useState(100);
  const [examDate, setExamDate] = React.useState("");
  const [color, setColor] = React.useState("#3b82f6");
  const [milestone1, setMilestone1] = React.useState(0);
  const [milestone2, setMilestone2] = React.useState(0);
  const [milestone3, setMilestone3] = React.useState(0);
  const [showAddForm, setShowAddForm] = React.useState(false);

  const handleAddCourse = (data: z.infer<typeof courseSchema>) => {
    setLocalCourses((prev) => [
      ...prev,
      data as LocalCourse, // Type assertion to LocalCourse
    ]);

    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Tambah Mata Kuliah
          </h1>
          <p className="text-sm text-muted-foreground">
            Tambahkan mata kuliah Anda untuk semester ini agar sistem dapat
            menyusun jadwal belajar.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="gap-2"
          disabled={loading}
        >
          <PlusIcon className="size-4" />
          <span>Tambah Mata Kuliah</span>
        </Button>
      </div>

      <AddCourseModal
        onOpenChange={setShowAddForm}
        open={showAddForm}
        isLoading={loading}
        onSave={handleAddCourse}
      />

      {localCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <BookOpenIcon className="size-6" />
          </div>
          <h3 className="text-lg font-semibold">Belum ada mata kuliah</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-6">
            Tambahkan mata kuliah Anda untuk menyusun jadwal belajar SPK.
          </p>
          <Button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="gap-2"
          >
            <PlusIcon className="size-4" />
            <span>Tambah Mata Kuliah</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          {localCourses.map((course) => (
            <div
              key={course.id}
              className="group relative flex flex-col justify-between rounded-xl border bg-card p-6 shadow-xs"
            >
              <div className="absolute top-4 right-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive hover:text-destructive"
                  onClick={() =>
                    setLocalCourses((prev) =>
                      prev.filter((c) => c.id !== course.id),
                    )
                  }
                >
                  <TrashIcon className="size-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span
                    className="size-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: course.color || "#3b82f6" }}
                  />
                  <h3 className="font-semibold text-base leading-snug pr-8">
                    {course.title}
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2 text-xs font-medium">
                  <span className="inline-flex items-center rounded-md bg-secondary px-2.5 py-1 text-secondary-foreground">
                    {course.credits} SKS
                  </span>
                  <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-muted-foreground">
                    {course.pageCount} Halaman Modul
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                  <CalendarIcon className="size-4 shrink-0" />
                  <span>
                    Ujian:{" "}
                    {new Date(course.examDate).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Separator />

      <div className="flex flex-col items-center gap-2 justify-center pt-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={loading}
          >
            Kembali
          </Button>
          <Button
            type="button"
            onClick={onFinish}
            disabled={loading || localCourses.length === 0}
          >
            {loading
              ? "Menyimpan & Menyusun Jadwal..."
              : "Selesai & Buat Jadwal"}
          </Button>
        </div>
        {localCourses.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Tambahkan minimal 1 mata kuliah untuk melanjutkan ke dashboard.
          </p>
        )}
      </div>
    </div>
  );
}

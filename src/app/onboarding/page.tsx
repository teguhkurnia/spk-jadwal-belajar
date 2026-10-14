"use client";

import { createClient } from "@/utils/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useRouter } from "next/navigation";
import * as React from "react";
import { match } from "ts-pattern";
import { milestone } from "@/lib/utils";

const DAYS = [
  { id: "Senin", label: "Senin", weekend: false },
  { id: "Selasa", label: "Selasa", weekend: false },
  { id: "Rabu", label: "Rabu", weekend: false },
  { id: "Kamis", label: "Kamis", weekend: false },
  { id: "Jumat", label: "Jumat", weekend: false },
  { id: "Sabtu", label: "Sabtu", weekend: true },
  { id: "Minggu", label: "Minggu", weekend: true },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);
  const [semesterName, setSemesterName] = React.useState("Semester 1");
  const [kmaks, setKmaks] = React.useState(30);
  const [days, setDays] = React.useState<string[]>(DAYS.map((d) => d.id));
  const [tutonDate, setTutonDate] = React.useState("");
  const [ktpuDate, setKtpuDate] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const toggleDay = (id: string) => {
    setDays((p) => (p.includes(id) ? p.filter((d) => d !== id) : [...p, id]));
  };

  const onFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMsg("Sesi tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("semesters").insert({
      user_id: user.id,
      name: semesterName || "Semester 1",
      is_active: true,
      max_study_pages: kmaks,
      days_of_week: days,
      start_tuton_date: tutonDate,
      start_study_date: tutonDate,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    // refresh the session to get the updated app_metadata
    await supabase.auth.refreshSession();

    router.replace("/dashboard");
  };

  return (
    <>
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      <div className="flex min-h-dvh items-center justify-center p-4">
        <div className="w-full max-w-xl space-y-4">
          <form onSubmit={onFinish}>
            {errorMsg && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2 text-center mb-4">
                {errorMsg}
              </p>
            )}
            {match(step)
              .with(1, () => (
                <div className="flex flex-col items-center gap-6">
                  <h1 className="text-2xl font-medium leading-tight text-center">
                    Selamat datang di Asisten Belajar Mandiri PJJ! Mari atur
                    profil semester agar sistem bisa menyusun jadwal yang paling
                    realistis untuk Anda.
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

                  <Button type="button" onClick={() => setStep(2)}>
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
                      onClick={() => setStep(1)}
                    >
                      Kembali
                    </Button>
                    <Button type="button" onClick={() => setStep(3)}>
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
                      onClick={() => setStep(2)}
                    >
                      Kembali
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setStep(4)}
                      disabled={days.length === 0}
                    >
                      Lanjutkan
                    </Button>
                  </div>
                </div>
              ))
              .with(4, () => (
                <>
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
                              {milestone(tutonDate, 3)?.toLocaleDateString("id-ID")}
                            </span>
                          </p>
                          <p>
                            • Tuton 2 (Minggu ke-5):{" "}
                            <span className="font-medium text-foreground">
                              {milestone(tutonDate, 5)?.toLocaleDateString("id-ID")}
                            </span>
                          </p>
                          <p>
                            • Tuton 3 (Minggu ke-7):{" "}
                            <span className="font-medium text-foreground">
                              {milestone(tutonDate, 7)?.toLocaleDateString("id-ID")}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="ktpu">
                        Estimasi Tanggal Ujian (KTPU)
                      </Label>
                      <Input
                        id="ktpu"
                        type="date"
                        value={ktpuDate}
                        onChange={(e) => setKtpuDate(e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        (Tanggal ini dapat diubah secara fleksibel nanti saat
                        jadwal pasti KTPU diterbitkan).
                      </p>
                    </div>

                    <div className="flex items-center gap-2 justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep(3)}
                      >
                        Kembali
                      </Button>
                      <Button
                        type="submit"
                        disabled={!tutonDate || !ktpuDate || loading}
                      >
                        {loading ? "Menyimpan..." : "Selesai"}
                      </Button>
                    </div>
                  </div>
                </>
              ))
              .otherwise(() => (
                <></>
              ))}
          </form>
        </div>
      </div>
    </>
  );
}

"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { SpinnerIcon } from "@phosphor-icons/react";

const DAYS_LIST = [
  { id: "Senin", label: "Senin" },
  { id: "Selasa", label: "Selasa" },
  { id: "Rabu", label: "Rabu" },
  { id: "Kamis", label: "Kamis" },
  { id: "Jumat", label: "Jumat" },
  { id: "Sabtu", label: "Sabtu" },
  { id: "Minggu", label: "Minggu" },
];

interface Props {
  semesterName: string;
  initialPages: number;
  initialDays: string[];
  onSave: (pages: number, days: string[]) => Promise<void>;
  saving: boolean;
}

export function PreferenceSettingsCard({
  semesterName,
  initialPages,
  initialDays,
  onSave,
  saving,
}: Props) {
  const [maxPages, setMaxPages] = React.useState<number>(initialPages);
  const [activeDays, setActiveDays] = React.useState<string[]>(initialDays);

  const toggleDay = (id: string) => {
    setActiveDays((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeDays.length === 0) return;
    onSave(maxPages, activeDays);
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Pengaturan Kecepatan & Waktu Belajar</CardTitle>
          <CardDescription>
            Menyesuaikan parameter Sistem Pendukung Keputusan (SPK) untuk
            semester aktif:{" "}
            <span className="font-semibold text-foreground">
              {semesterName}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="max_study_pages">
              Kapasitas Baca Harian (Halaman){" "}
              <span className="text-muted-foreground font-normal">
                (K_maks)
              </span>
            </Label>
            <Input
              id="max_study_pages"
              type="number"
              min={1}
              max={1000}
              value={maxPages}
              onChange={(e) => setMaxPages(Math.max(1, Number(e.target.value)))}
              required
            />
            <p className="text-xs text-muted-foreground">
              Tingkatkan kapasitas ini jika jadwal Anda sering berstatus Kritis.
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Hari Aktif Belajar</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {DAYS_LIST.map((day) => {
                const isChecked = activeDays.includes(day.id);
                return (
                  <Label
                    key={day.id}
                    htmlFor={`day-${day.id}`}
                    className={`flex items-center space-x-2 border rounded-lg p-3 cursor-pointer transition-colors ${
                      isChecked
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-input hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <Checkbox
                      id={`day-${day.id}`}
                      checked={isChecked}
                      onCheckedChange={() => toggleDay(day.id)}
                    />
                    <span className="text-sm cursor-pointer select-none">
                      {day.label}
                    </span>
                  </Label>
                );
              })}
            </div>
            {activeDays.length === 0 && (
              <p className="text-xs text-destructive">
                Pilih minimal 1 hari aktif belajar.
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t bg-muted/20 px-6 py-4">
          <Button type="submit" disabled={saving || activeDays.length === 0}>
            {saving && <SpinnerIcon className="mr-2 size-4 animate-spin" />}
            {saving
              ? "Sedang menyusun ulang kalender belajar Anda..."
              : "Simpan Perubahan Jadwal"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

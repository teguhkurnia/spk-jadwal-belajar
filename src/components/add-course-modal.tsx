"use client";

import * as React from "react";

import { courseSchema } from "@/actions/type";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import z from "zod";

const COLOR_PRESETS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
] as const;

interface AddCourseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: z.infer<typeof courseSchema>) => void;
  isLoading?: boolean;
}

export function AddCourseModal({
  open,
  onOpenChange,
  onSave,
  isLoading,
}: AddCourseModalProps) {
  const [selectedColor, setSelectedColor] = React.useState("#3b82f6");
  const [milestones, setMilestones] = React.useState({
    milestone1: 0,
    milestone2: 0,
    milestone3: 0,
  });
  const formRef = React.useRef<HTMLFormElement>(null);

  const onSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget as HTMLFormElement);

    const data: z.infer<typeof courseSchema> = {
      title: formData.get("title") as string,
      credits: Number(formData.get("credits")),
      pageCount: Number(formData.get("pageCount")),
      examDate: formData.get("examDate") as string,
      color: formData.get("color") as string,
      milestone1: Number(formData.get("milestone1")),
      milestone2: Number(formData.get("milestone2")),
      milestone3: Number(formData.get("milestone3")),
    };

    onSave(data);
  };

  const handlePageCountChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const pageCount = Number(event.target.value);

    // Generate milstone predictions based on the page count
    // with ratio 6:5:4
    // the total must be equal to pageCount
    const milestone1 = Math.floor((pageCount * 6) / 15);
    const milestone2 = Math.floor((pageCount * 5) / 15);
    const milestone3 = Math.floor((pageCount * 4) / 15);

    const total = milestone1 + milestone2 + milestone3;

    // Adjust the last milestone to ensure the total matches the page count
    const adjustedMilestone3 = milestone3 + (pageCount - total);

    setMilestones({
      milestone1,
      milestone2,
      milestone3: adjustedMilestone3,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val);
        if (!val) {
          formRef.current?.reset();
          setSelectedColor("#3b82f6");
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Tambah Mata Kuliah Baru</DialogTitle>
            <DialogDescription>
              Isi rincian mata kuliah untuk dimasukkan ke jadwal belajar.
            </DialogDescription>
          </DialogHeader>

          <Field>
            <FieldLabel htmlFor="course-title">
              Nama / Judul Mata Kuliah
            </FieldLabel>
            <FieldContent>
              <Input
                id="course-title"
                name="title"
                placeholder="Contoh: Pemrograman Berbasis Web"
                required
              />
            </FieldContent>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="course-credits">Jumlah SKS</FieldLabel>
              <FieldContent>
                <Input
                  id="course-credits"
                  name="credits"
                  type="number"
                  min={1}
                  max={10}
                  defaultValue={3}
                  required
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="course-pages">
                Jumlah Halaman Modul
              </FieldLabel>
              <FieldContent>
                <Input
                  id="course-pages"
                  name="pageCount"
                  type="number"
                  min={1}
                  defaultValue={100}
                  required
                  onChange={handlePageCountChange}
                />
              </FieldContent>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="course-exam">Tanggal Ujian (KTPU)</FieldLabel>
            <FieldContent>
              <Input id="course-exam" name="examDate" type="date" required />
            </FieldContent>
          </Field>

          <input type="hidden" name="color" value={selectedColor} />

          <Field>
            <FieldLabel>Warna Label</FieldLabel>
            <div className="flex items-center gap-2 pt-1">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSelectedColor(preset)}
                  className={`size-6 rounded-full transition-transform ${
                    selectedColor === preset
                      ? "scale-125 ring-2 ring-ring ring-offset-2"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: preset }}
                  aria-label={`Pilih warna ${preset}`}
                />
              ))}
            </div>
          </Field>

          <Field>
            <FieldLabel>Target Halaman per Milestone</FieldLabel>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Tuton 1</p>
                <Input
                  name="milestone1"
                  type="number"
                  min={0}
                  value={milestones.milestone1}
                  onChange={(e) =>
                    setMilestones((prev) => ({
                      ...prev,
                      milestone1: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Tuton 2</p>
                <Input
                  name="milestone2"
                  type="number"
                  min={0}
                  defaultValue={0}
                  value={milestones.milestone2}
                  onChange={(e) =>
                    setMilestones((prev) => ({
                      ...prev,
                      milestone2: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Tuton 3</p>
                <Input
                  name="milestone3"
                  type="number"
                  min={0}
                  value={milestones.milestone3}
                  onChange={(e) =>
                    setMilestones((prev) => ({
                      ...prev,
                      milestone3: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
          </Field>

          <DialogFooter className="pt-2">
            <DialogClose
              render={
                <Button type="button" variant="outline" disabled={isLoading}>
                  Batal
                </Button>
              }
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

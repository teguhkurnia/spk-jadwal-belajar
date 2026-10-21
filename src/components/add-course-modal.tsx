"use client";

import * as React from "react";
import { useActionState } from "react";
import { addCourse, type AddCourseState } from "@/actions/course";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldLabel,
  FieldContent,
} from "@/components/ui/field";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
}

export function AddCourseModal({ open, onOpenChange }: AddCourseModalProps) {
  const [selectedColor, setSelectedColor] = React.useState("#3b82f6");
  const formRef = React.useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState<AddCourseState, FormData>(
    addCourse,
    {},
  );

  React.useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setSelectedColor("#3b82f6");
      onOpenChange(false);
    }
  }, [state, onOpenChange]);

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
        <form ref={formRef} action={formAction} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Tambah Mata Kuliah Baru</DialogTitle>
            <DialogDescription>
              Isi rincian mata kuliah untuk dimasukkan ke jadwal belajar.
            </DialogDescription>
          </DialogHeader>

          {state.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">
              {state.error}
            </div>
          )}

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
                />
              </FieldContent>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="course-exam">
              Tanggal Ujian (KTPU)
            </FieldLabel>
            <FieldContent>
              <Input
                id="course-exam"
                name="examDate"
                type="date"
                required
              />
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
                <Input name="milestone1" type="number" min={0} defaultValue={0} />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Tuton 2</p>
                <Input name="milestone2" type="number" min={0} defaultValue={0} />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Tuton 3</p>
                <Input name="milestone3" type="number" min={0} defaultValue={0} />
              </div>
            </div>
          </Field>

          <DialogFooter className="pt-2">
            <DialogClose
              render={
                <Button type="button" variant="outline" disabled={isPending}>
                  Batal
                </Button>
              }
            />
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan..." : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

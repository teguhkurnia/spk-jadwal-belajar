"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SpinnerIcon, WarningCircleIcon } from "@phosphor-icons/react";

interface Props {
  semesterName: string;
  onEndSemester: () => Promise<void>;
  loading: boolean;
}

export function DangerZoneCard({ semesterName, onEndSemester, loading }: Props) {
  const [openModal, setOpenModal] = React.useState(false);

  const handleConfirm = async () => {
    await onEndSemester();
  };

  return (
    <>
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <WarningCircleIcon className="size-5 text-destructive" />
            Manajemen Semester (Danger Zone)
          </CardTitle>
          <CardDescription>
            Tindakan di area ini akan mengarsipkan semester saat ini dan Anda akan diarahkan untuk mengatur mata kuliah dari awal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted/40 p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status Semester
              </p>
              <p className="text-base font-semibold text-foreground">
                Saat ini Anda berada di {semesterName || "Semester Aktif"}
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground whitespace-nowrap"
              onClick={() => setOpenModal(true)}
              disabled={loading}
            >
              Akhiri Semester Ini & Mulai Baru
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Akhiri Semester & Mulai Baru?</DialogTitle>
            <DialogDescription className="pt-2 text-sm leading-relaxed">
              Apakah Anda yakin? Semester saat ini akan diarsipkan dan Anda akan diarahkan untuk mengatur mata kuliah dari awal.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenModal(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading && <SpinnerIcon className="mr-2 size-4 animate-spin" />}
              Ya, Akhiri Semester
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

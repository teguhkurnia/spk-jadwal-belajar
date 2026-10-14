import { Suspense } from "react";

export default function Home() {
  return (
    <Suspense fallback={<div className="p-6">Memuat...</div>}>
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight">SPK Jadwal Belajar UT</h1>
        <p className="text-muted-foreground mt-2 max-w-md">
          Sistem Pendukung Keputusan Penjadwalan Belajar Mandiri Mahasiswa Universitas Terbuka.
        </p>
        <div className="mt-6 flex gap-4">
          <a href="/login" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90">
            Masuk / Login
          </a>
          <a href="/dashboard" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground">
            Dashboard
          </a>
        </div>
      </div>
    </Suspense>
  );
}



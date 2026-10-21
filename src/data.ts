const metadatas = {
  "/login": {
    title: "Login",
    description: "Halaman login pengguna",
  },
  "/register": {
    title: "Register",
    description: "Halaman pendaftaran pengguna baru",
  },
  "/onboarding": {
    title: "Onboarding",
    description: "Halaman onboarding pengguna baru",
  },
  "/calendar": {
    title: "Kalendar",
    description: "Kalendar jadwal belajar",
  },
  "/dashboard": {
    title: "Dashboard",
    description: "Dashboard utama aplikasi",
  },
  "/courses": {
    title: "Mata Kuliah",
    description: "Daftar mata kuliah pengguna",
  },
  "/settings": {
    title: "Settings",
    description: "Pengaturan akun pengguna",
  },
};

export function getMetadata(pathname: string) {
  return (
    metadatas[pathname as keyof typeof metadatas] || {
      title: "Aplikasi Jadwal Belajar",
      description: "Aplikasi untuk mengatur jadwal belajar",
    }
  );
}

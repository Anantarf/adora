import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Profil Saya | ADORA Basketball",
  description: "Kelola profil dan pengaturan akun Portal Keluarga.",
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch fresh user data from DB just in case session is stale
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, username: true },
  });

  if (!user) {
    redirect("/login");
  }

  const initialData = {
    name: user.name || "",
    email: user.email || "",
    username: user.username || "",
  };

  return (
    <div className="py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ProfileForm initialData={initialData} />
    </div>
  );
}

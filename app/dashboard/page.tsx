import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function DashboardPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-black">Your Projects</h1>
          <p className="text-gray-600">Build and manage your projects</p>
        </div>

      </div>
    </div>
  );
}


export default async function Dashboard() {
  return (
    <Suspense
      fallback={
        <p>Loading...</p>
      }
    >
      <DashboardPage />
    </Suspense>
  );
}
import { Metadata } from "next";
import LogoutButton from "components/logout-button";

export const metadata: Metadata = {
  title: "Inflearngram clone",
  description: "nextjs supabase Instagram clone project",
};

export default function Home() {
  return (
    <main className="w-full h-screen flex flex-col gap-2 items-center justify-center">
      <h1 className="font-bold text-xl">Welcome {"user name"}</h1>
      <LogoutButton />
    </main>
  );
}

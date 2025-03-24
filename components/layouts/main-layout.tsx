import Sidebar from "components/sidebar";

export default function MainLayout({ children }) {
  return (
    <main className="w-full h-screen flex justify-center items-center">
      <Sidebar />
      {children}
    </main>
  );
}

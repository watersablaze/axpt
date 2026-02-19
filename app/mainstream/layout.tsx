import "@/src/styles/mainstream-globals.css";
import Sidebar from "@/src/components/mainstream/Sidebar";

export default function MainstreamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mainstream-root">
      <div className="ms-layout">
        <Sidebar />
        <main className="ms-content">
          {children}
        </main>
      </div>
    </div>
  );
}
import { useLocation } from "wouter";
import Navbar from "./Navbar";
import Footer from "./Footer";
import FloatingActionDock from "./FloatingActionDock";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function Layout({ children, className }: LayoutProps) {
  const [location] = useLocation();
  const internalMode = location.startsWith("/admin") || location.startsWith("/partner") || location.startsWith("/provider");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className={`flex-1 ${className ?? ""}`}>
        {children}
      </main>
      <Footer />
      {!internalMode && <FloatingActionDock />}
    </div>
  );
}

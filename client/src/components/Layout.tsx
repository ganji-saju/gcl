import Navbar from "./Navbar";
import Footer from "./Footer";
import FloatingActionDock from "./FloatingActionDock";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function Layout({ children, className }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className={`flex-1 ${className ?? ""}`}>
        {children}
      </main>
      <Footer />
      <FloatingActionDock />
    </div>
  );
}

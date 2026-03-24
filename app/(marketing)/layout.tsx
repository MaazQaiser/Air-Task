import type { Metadata } from "next";
import "../../app/globals.css";

export const metadata: Metadata = {
  title: "AirTasks — Think Without Limits",
  description:
    "The infinite canvas where tasks, notes, mind maps, and flows live side by side. Control it with your voice, your hands, or your keyboard.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="marketing-root" style={{ 
      margin: 0, 
      background: "#ffffff", 
      color: "#000000",
      fontFamily: "'Inter', system-ui, sans-serif", 
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
      position: "relative"
    }}>
      {children}
    </div>
  );
}

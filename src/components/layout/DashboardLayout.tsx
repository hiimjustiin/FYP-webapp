import React from "react";
import Sidebar from "./sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="h-screen overflow-hidden bg-gradient-background">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-y-auto h-screen">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;

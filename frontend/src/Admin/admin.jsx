"use client";
import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "./Navbar/Navbar.jsx";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="flex min-h-screen">
      <SidebarProvider>
        <AppSidebar onNavigate={handleNavigation} />
        <div className="flex-1 p-6">
          <h1 className="text-2xl font-bold">Welcome Admin</h1>
        </div>
      </SidebarProvider>
    </div>
  );
}
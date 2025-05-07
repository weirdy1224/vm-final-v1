"use client";
import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Users, Upload, UserCog } from "lucide-react";

export default function AppSidebar({ onNavigate }) {
  return (
    <Sidebar className="border-r bg-background w-64">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                >
                  <button
                    onClick={() => onNavigate("/client")}
                    className="flex items-center w-full text-left"
                    aria-label="Navigate to Clients"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    <span>Clients</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                >
                  <button
                    onClick={() => onNavigate("/user-management")}
                    className="flex items-center w-full text-left"
                    aria-label="Navigate to User Management"
                  >
                    <UserCog className="h-4 w-4 mr-2" />
                    <span>User Management</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                >
                  <button
                    onClick={() => onNavigate("/upload-reports")}
                    className="flex items-center w-full text-left"
                    aria-label="Navigate to Upload Reports"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    <span>Upload Reports</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

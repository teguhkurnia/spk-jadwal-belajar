"use client";

import * as React from "react";
import Link from "next/link";
import { PlusCircleIcon } from "@phosphor-icons/react";
import { Settings2Icon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import { AddCourseModal } from "./add-course-modal";
import z from "zod";
import { courseSchema } from "@/actions/type";
import { addCourse } from "@/actions/course";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: React.ReactNode;
  }[];
}) {
  const [open, setOpen] = React.useState(false);

  const [isAddLoading, setIsAddLoading] = React.useState(false);

  const handleAddCourse = async (data: z.infer<typeof courseSchema>) => {
    setIsAddLoading(true);
    const result = await addCourse({}, data);
    setIsAddLoading(false);
    if (result.success) {
    } else if (result.error) {
      console.error(result.error);
    }
  };

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent className="flex flex-col gap-2">
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
              <SidebarMenuButton
                tooltip="Quick Create"
                onClick={() => setOpen(true)}
                className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
              >
                <PlusCircleIcon />
                <span>Mata Kuliah Baru</span>
              </SidebarMenuButton>
              <Button
                size="icon"
                className="size-8 group-data-[collapsible=icon]:opacity-0"
                variant="outline"
                render={<Link href="/settings" />}
                nativeButton={false}
              >
                <Settings2Icon />
                <span className="sr-only">Settings</span>
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  render={<Link href={item.url} />}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <AddCourseModal
        open={open}
        onOpenChange={setOpen}
        onSave={handleAddCourse}
        isLoading={isAddLoading}
      />
    </>
  );
}

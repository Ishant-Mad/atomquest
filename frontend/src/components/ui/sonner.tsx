"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      duration={2000}
      closeButton
      icons={{
        success: <CircleCheckIcon className="size-3.5" />,
        info: <InfoIcon className="size-3.5" />,
        warning: <TriangleAlertIcon className="size-3.5" />,
        error: <OctagonXIcon className="size-3.5" />,
        loading: <Loader2Icon className="size-3.5 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: [
            "!text-xs !font-medium !py-2 !px-3 !min-h-0 !gap-2",
            "!rounded-lg !shadow-lg",
            "!bg-white/70 !backdrop-blur-md !border !border-white/40",
            "!text-slate-800",
          ].join(" "),
          title: "!text-xs !font-semibold",
          description: "!text-[11px] !text-slate-500",
          icon: "!w-3.5 !h-3.5",
          closeButton: [
            "!top-1/2 !-translate-y-1/2 !right-1.5 !left-auto",
            "!h-4 !w-4 !rounded !border-0",
            "!bg-transparent hover:!bg-slate-200/80",
            "!text-slate-400 hover:!text-slate-700",
            "!transition-colors",
          ].join(" "),
          success: "!border-emerald-200/60 !bg-emerald-50/70 !text-emerald-900 [&>[data-icon]]:!text-emerald-600",
          error: "!border-red-200/60 !bg-red-50/70 !text-red-900 [&>[data-icon]]:!text-red-600",
          warning: "!border-amber-200/60 !bg-amber-50/70 !text-amber-900 [&>[data-icon]]:!text-amber-600",
          info: "!border-blue-200/60 !bg-blue-50/70 !text-blue-900 [&>[data-icon]]:!text-blue-600",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

"use client"

import { toast as sonnerToast } from "sonner"

interface ToastOptions {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

export function toast(options: ToastOptions) {
  if (options.variant === "destructive") {
    sonnerToast.error(options.title, {
      description: options.description,
    })
  } else {
    sonnerToast.success(options.title, {
      description: options.description,
    })
  }
}

export function useToast() {
  return {
    toasts: [] as any[],
    toast,
    dismiss: () => {},
  }
}

export { sonnerToast as toastOriginal }
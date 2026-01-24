import * as React from "react";
import { cn } from "@/lib/utils";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { Button } from "./button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  type?: "success" | "error" | "info" | "warning";
  showCloseButton?: boolean;
  className?: string;
}

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const colorMap = {
  success: "text-green-500 bg-green-100 dark:bg-green-900/30",
  error: "text-red-500 bg-red-100 dark:bg-red-900/30",
  info: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
  warning: "text-amber-500 bg-amber-100 dark:bg-amber-900/30",
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  type,
  showCloseButton = true,
  className,
}: ModalProps) {
  const Icon = type ? iconMap[type] : null;

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative z-10 w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl",
          "animate-in zoom-in-95 fade-in duration-200",
          className
        )}
      >
        {/* Close button */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        )}

        <div className="p-6">
          {/* Icon */}
          {Icon && (
            <div className="flex justify-center mb-4">
              <div className={cn("p-3 rounded-full", colorMap[type!])}>
                <Icon className="h-8 w-8" />
              </div>
            </div>
          )}

          {/* Title */}
          {title && (
            <h2 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-2">
              {title}
            </h2>
          )}

          {/* Content */}
          <div className="text-center text-gray-600 dark:text-gray-300">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  type = "info",
  loading = false,
}: ConfirmModalProps) {
  const colorClasses = {
    danger: "bg-red-500 hover:bg-red-600",
    warning: "bg-amber-500 hover:bg-amber-600",
    info: "bg-primary hover:bg-primary/90",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} showCloseButton={false}>
      <p className="mb-6">{message}</p>
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          className={cn(colorClasses[type], "text-white")}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? "Chargement..." : confirmText}
        </Button>
      </div>
    </Modal>
  );
}

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  buttonText?: string;
}

export function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  type,
  buttonText = "OK",
}: AlertModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} type={type}>
      <p className="mb-6">{message}</p>
      <Button onClick={onClose} className="min-w-[100px]">
        {buttonText}
      </Button>
    </Modal>
  );
}

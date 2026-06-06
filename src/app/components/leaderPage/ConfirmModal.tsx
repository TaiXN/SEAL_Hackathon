import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText: string;
  isDestructive?: boolean;
  hideCancel?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  isDestructive = true,
  hideCancel = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Dialog */}
      <div className="relative bg-card w-full max-w-md rounded-radius-lg border border-border shadow-lg sm:my-8 animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-radius-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${isDestructive ? 'bg-destructive/10' : 'bg-primary/10'}`}>
              <AlertTriangle className={`h-5 w-5 ${isDestructive ? 'text-destructive' : 'text-primary'}`} />
            </div>
            <div className="mt-1">
              <h3 className="text-lg font-semibold leading-none tracking-tight text-foreground">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                {description}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 p-6 border-t border-border bg-muted/20">
          {!hideCancel && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-radius-md text-sm font-medium transition-colors hover:bg-muted border border-border bg-background h-10 px-4 py-2"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`inline-flex items-center justify-center rounded-radius-md text-sm font-medium transition-colors h-10 px-4 py-2 ${
              isDestructive 
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' 
                : 'bg-primary text-primary-foreground hover:opacity-90'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

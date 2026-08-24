// ============================================================
// FORESKILLS — UI PRIMITIVES
// Consolidated UI kit:
//   • cn()           — Tailwind class merger (clsx + tailwind-merge)
//   • Toast system   — Radix-based toasts: state hook, emitter and
//                      presentational components (previously
//                      src/components/ui/{use-toast,toast,toaster}.jsx)
//
// Only the primitives actually reachable from the application are
// kept here; the remaining unused shadcn template components were
// removed after full reference verification.
// ============================================================

import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva } from "class-variance-authority";
import { X } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ------------------------------------------------------------
// CLASS NAME UTILITY
// ------------------------------------------------------------

/** @param {...import("clsx").ClassValue} inputs */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const isIframe = window.self !== window.top;

// ------------------------------------------------------------
// TOAST — STATE HOOK + EMITTER (previously ui/use-toast.jsx)
// Inspired by react-hot-toast library
// ------------------------------------------------------------

const TOAST_LIMIT = 20;
const TOAST_REMOVE_DELAY = 1000000;

const actionTypes = /** @type {{ ADD_TOAST: 'ADD_TOAST', UPDATE_TOAST: 'UPDATE_TOAST', DISMISS_TOAST: 'DISMISS_TOAST', REMOVE_TOAST: 'REMOVE_TOAST' }} */ ({
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
});

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

/**
 * @typedef {React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & {
 *   id: string,
 *   title?: React.ReactNode,
 *   description?: React.ReactNode,
 *   variant?: 'default' | 'destructive',
 *   action?: React.ReactElement,
 * }} ToastItem
 *
 * @typedef {{ toasts: ToastItem[] }} ToastState
 *
 * @typedef {(
 *   | { type: 'ADD_TOAST', toast: ToastItem }
 *   | { type: 'UPDATE_TOAST', toast: Partial<ToastItem> & { id: string } }
 *   | { type: 'DISMISS_TOAST', toastId?: string }
 *   | { type: 'REMOVE_TOAST', toastId?: string }
 * )} ToastAction
 */

/** @type {Map<string, ReturnType<typeof setTimeout>>} */
const toastTimeouts = new Map();

/** @param {string} toastId */
const addToRemoveQueue = (toastId) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: actionTypes.REMOVE_TOAST,
      toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

/** @param {string} toastId */
const _clearFromRemoveQueue = (toastId) => {
  const timeout = toastTimeouts.get(toastId);
  if (timeout) {
    clearTimeout(timeout);
    toastTimeouts.delete(toastId);
  }
};

/**
 * @param {ToastState} state
 * @param {ToastAction} action
 * @returns {ToastState}
 */
export const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case actionTypes.DISMISS_TOAST: {
      const { toastId } = action;

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    case actionTypes.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

/** @type {Array<(state: ToastState) => void>} */
const listeners = [];

/** @type {ToastState} */
let memoryState = { toasts: [] };

/** @param {ToastAction} action */
function dispatch(action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

/** @param {Partial<ToastItem>} props */
function toast({ ...props }) {
  const id = genId();

  /** @param {Partial<ToastItem>} props */
  const update = (props) =>
    dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast: { ...props, id },
    });

  const dismiss = () =>
    dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id });

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id,
    dismiss,
    update,
  };
}

function useToast() {
  const [state, setState] = React.useState(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (/** @type {string} */ toastId) =>
      dispatch({ type: actionTypes.DISMISS_TOAST, toastId }),
  };
}

export { useToast, toast };

// ------------------------------------------------------------
// TOAST — PRESENTATIONAL COMPONENTS (previously ui/toast.jsx)
// ------------------------------------------------------------

const ToastProvider = ToastPrimitives.Provider;

/**
 * @typedef {React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>} ToastViewportProps
 * @typedef {React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & { variant?: 'default' | 'destructive' }} ToastProps
 * @typedef {React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>} ToastActionProps
 * @typedef {React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>} ToastCloseProps
 * @typedef {React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>} ToastTitleProps
 * @typedef {React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>} ToastDescriptionProps
 */

const ToastViewport = React.forwardRef(
  /** @param {ToastViewportProps} props */
  ({ className, ...props }, ref) => (
    <ToastPrimitives.Viewport
      ref={ref}
      className={cn(
        "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
        className
      )}
      {...props}
    />
  )
);
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Toast = React.forwardRef(
  /** @param {ToastProps} props */
  ({ className, variant, ...props }, ref) => {
    return (
      <ToastPrimitives.Root
        ref={ref}
        className={cn(toastVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef(
  /** @param {ToastActionProps} props */
  ({ className, altText = "Action", ...props }, ref) => (
    <ToastPrimitives.Action
      ref={ref}
      altText={altText}
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
        className
      )}
      {...props}
    />
  )
);
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef(
  /** @param {ToastCloseProps} props */
  ({ className, ...props }, ref) => (
    <ToastPrimitives.Close
      ref={ref}
      className={cn(
        "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
        className
      )}
      toast-close=""
      {...props}
    >
      <X className="h-4 w-4" />
    </ToastPrimitives.Close>
  )
);
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef(
  /** @param {ToastTitleProps} props */
  ({ className, ...props }, ref) => (
    <ToastPrimitives.Title
      ref={ref}
      className={cn("text-sm font-semibold", className)}
      {...props}
    />
  )
);
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef(
  /** @param {ToastDescriptionProps} props */
  ({ className, ...props }, ref) => (
    <ToastPrimitives.Description
      ref={ref}
      className={cn("text-sm opacity-90", className)}
      {...props}
    />
  )
);
ToastDescription.displayName = ToastPrimitives.Description.displayName;

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};

// ------------------------------------------------------------
// TOASTER (previously ui/toaster.jsx)
// ------------------------------------------------------------

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}

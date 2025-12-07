// "use client";

// import * as React from "react";
// import * as ProgressPrimitive from "@radix-ui/react-progress";

// import { cn } from "@/lib/utils";

// const Progress = React.forwardRef<
//   React.ElementRef<typeof ProgressPrimitive.Root>,
//   React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
// >(({ className, value, ...props }, ref) => (
//   <ProgressPrimitive.Root
//     ref={ref}
//     className={cn(
//       "relative h-2 w-full overflow-hidden rounded-full bg-gray-200",
//       className
//     )}
//     {...props}
//   >
//     <ProgressPrimitive.Indicator
//       className={cn(
//         "h-full transition-all",
//         (value ?? 0) === 100
//           ? "bg-green-500 rounded-full"
//           : "bg-red-500 rounded-l-full"
//       )}
//       style={{ width: `${value ?? 0}%` }}
//     />
//   </ProgressPrimitive.Root>
// ));
// Progress.displayName = ProgressPrimitive.Root.displayName;

// export { Progress };

"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-gray-200",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 transition-all",
        // If value is 100, use green and fully rounded corners.
        // Otherwise, use red and only round the left corners.
        value === 100
          ? "bg-green-400 rounded-full"
          : "bg-red-400 rounded-l-full"
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };

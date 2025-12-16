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
>(({ className, value, ...props }, ref) => {
  const progress = value || 0;

  // Determine color based on progress
  let barColor = "bg-red-400"; // < 80%
  if (progress === 100) {
    barColor = "bg-green-500"; // Bright green at 100%
  } else if (progress >= 80) {
    barColor = "bg-lime-600"; // Darker lime green at 80%+
  }

  return (
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
          barColor,
          progress === 100 ? "rounded-full" : "rounded-l-full"
        )}
        style={{ transform: `translateX(-${100 - progress}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };

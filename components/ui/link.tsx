import Link from "next/link";
import { cn } from "@/lib/utils";

interface LinkProps extends React.ComponentProps<typeof Link> {
  children: React.ReactNode;
  className?: string;
}

export function LinkComponent({ children, className, ...props }: LinkProps) {
  return (
    <Link
      className={cn(
        "text-primary hover:text-primary/80 transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
} 
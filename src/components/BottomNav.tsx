import { Home, Search, List, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "My Trail", path: "/" },
  { icon: Search, label: "Discover", path: "/discover" },
  { icon: List, label: "Lists", path: "/lists" },
  { icon: User, label: "Profile", path: "/profile" },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-4">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 transition-all duration-200 rounded-lg",
                "btn-press hover:bg-accent/50",
                isActive 
                  ? "text-primary scale-105" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon 
                className={cn(
                  "h-5 w-5 mb-1 transition-all duration-200",
                  isActive && "drop-shadow-sm"
                )} 
              />
              <span 
                className={cn(
                  "text-xs font-medium truncate transition-all duration-200",
                  isActive && "font-semibold"
                )}
              >
                {label}
              </span>
              {isActive && (
                <div className="absolute -bottom-px left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
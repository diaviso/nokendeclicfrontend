import { useAuth } from "@/contexts/AuthContext";
import { NotificationDropdown } from "@/components/notifications";
import { getImageUrl } from "@/services/api";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2 sm:gap-4 ml-4">
          <div className="hidden lg:block">
            <NotificationDropdown />
          </div>

          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            {user?.pictureUrl ? (
              <img src={getImageUrl(user.pictureUrl)} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <span className="text-sm font-medium text-primary">
                {user?.firstName?.[0] || user?.username[0].toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

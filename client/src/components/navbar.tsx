import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { User, LogOut, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { translations } from "@/lib/translations";

export default function Navbar() {
  const { user, logout } = useUser();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const result = await logout();
      if (!result.ok) {
        throw new Error(result.message);
      }
      toast({
        title: translations.general.success,
        description: translations.auth.loginSuccess,
      });
    } catch (error) {
      toast({
        title: translations.general.error,
        description: error instanceof Error ? error.message : translations.errors.somethingWentWrong,
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex gap-2">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 retro-btn">
              <Home className="h-4 w-4" />
              {translations.general.home}
            </Button>
          </Link>
        </div>

        <div className="flex-1"></div>

        <div className="flex items-center gap-2">
          {user && (
            <>
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  {user.username}
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
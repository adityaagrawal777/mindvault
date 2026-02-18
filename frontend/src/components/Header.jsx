import { useTheme } from "./theme-provider"
import { Button } from "./ui/button"
import { Moon, Sun, Menu, MessageSquareText, PanelLeftClose, PanelLeftOpen, Eye, EyeOff, LogOut, User } from "lucide-react"

export function Header({ onMenuClick, onDesktopSidebarToggle, isDesktopSidebarOpen, onPdfToggle, showPdfViewer, hasSession, user, onLogout }) {
  const { theme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Button variant="ghost" size="icon" className="mr-2 md:hidden" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
        </Button>
        <Button variant="ghost" size="icon" className="mr-2 hidden md:inline-flex h-8 w-8 rounded-lg" onClick={onDesktopSidebarToggle}>
            {isDesktopSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            <span className="sr-only">Toggle Sidebar</span>
        </Button>
        <div className="mr-4 flex items-center space-x-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <MessageSquareText className="h-4.5 w-4.5" />
          </div>
          <span className="hidden font-bold text-base sm:inline-block tracking-tight">
            PDF Chatbot
          </span>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {hasSession && (
            <Button
              variant={showPdfViewer ? "secondary" : "ghost"}
              size="icon"
              onClick={onPdfToggle}
              title={showPdfViewer ? "Hide PDF" : "View PDF"}
              className="h-8 w-8 rounded-lg"
            >
              {showPdfViewer ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="sr-only">Toggle PDF Viewer</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          {user && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border/50">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold">
                {user.username?.[0]?.toUpperCase() || <User className="h-3.5 w-3.5" />}
              </div>
              <span className="hidden sm:inline text-sm font-medium text-muted-foreground">{user.username}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive" onClick={onLogout} title="Log out">
                <LogOut className="h-3.5 w-3.5" />
                <span className="sr-only">Log out</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

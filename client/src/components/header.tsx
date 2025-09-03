import { useState } from "react";
import { Leaf, Moon, Sun, Menu, X, User, LogOut, Settings, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import AuthModal from "@/components/auth/auth-modal";
import LanguageSelector from "@/components/language-selector";

export default function Header() {
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const handleDownloadStatic = async () => {
    try {
      const response = await fetch('/api/download-static');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mediplant-static-website.tar.gz';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to download static website');
      }
    } catch (error) {
      console.error('Error downloading static website:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Leaf className="text-primary-foreground text-lg" data-testid="logo-icon" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground" data-testid="site-title">{t('site.title')}</h1>
              <p className="text-xs text-muted-foreground">{t('site.tagline')}</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('identify')}
              className="text-foreground hover:text-primary font-medium transition-colors"
              data-testid="nav-identify"
            >
              {t('nav.identify')}
            </button>
            <button 
              onClick={() => scrollToSection('knowledge')}
              className="text-foreground hover:text-primary font-medium transition-colors"
              data-testid="nav-knowledge"
            >
              {t('nav.knowledge')}
            </button>
            <button 
              onClick={() => scrollToSection('contribute')}
              className="text-foreground hover:text-primary font-medium transition-colors"
              data-testid="nav-contribute"
            >
              {t('nav.contribute')}
            </button>
            <button 
              onClick={() => scrollToSection('community')}
              className="text-foreground hover:text-primary font-medium transition-colors"
              data-testid="nav-community"
            >
              {t('nav.community')}
            </button>
          </nav>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2" data-testid="user-menu">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{user.name}</span>
                    {user.isAdmin && (
                      <Badge variant="secondary" className="ml-2 text-xs">Admin</Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </DropdownMenuItem>
                  {user.badges && user.badges.length > 0 && (
                    <DropdownMenuItem className="flex flex-wrap gap-1">
                      {user.badges.map((badge) => (
                        <Badge key={badge} variant="outline" className="text-xs">
                          {badge}
                        </Badge>
                      ))}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>Profile Settings</span>
                  </DropdownMenuItem>
                  {user.isAdmin && (
                    <DropdownMenuItem className="flex items-center space-x-2" data-testid="admin-panel-link">
                      <Settings className="h-4 w-4" />
                      <span>Admin Panel</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={logout}
                    className="flex items-center space-x-2 text-destructive focus:text-destructive"
                    data-testid="logout-button"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setAuthModalTab('login');
                    setIsAuthModalOpen(true);
                  }}
                  data-testid="login-button"
                >
                  {t('auth.signIn')}
                </Button>
                <Button
                  onClick={() => {
                    setAuthModalTab('register');
                    setIsAuthModalOpen(true);
                  }}
                  data-testid="register-button"
                >
                  {t('auth.signUp')}
                </Button>
              </div>
            )}
            
            <LanguageSelector />
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleDownloadStatic}
              title="Download Static Website"
              data-testid="download-static"
            >
              <Download className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              data-testid="theme-toggle"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="mobile-menu-toggle"
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4" data-testid="mobile-menu">
            <nav className="flex flex-col space-y-4">
              <button 
                onClick={() => scrollToSection('identify')}
                className="text-left text-foreground hover:text-primary font-medium transition-colors"
                data-testid="mobile-nav-identify"
              >
                Identify
              </button>
              <button 
                onClick={() => scrollToSection('knowledge')}
                className="text-left text-foreground hover:text-primary font-medium transition-colors"
                data-testid="mobile-nav-knowledge"
              >
                Knowledge Base
              </button>
              <button 
                onClick={() => scrollToSection('contribute')}
                className="text-left text-foreground hover:text-primary font-medium transition-colors"
                data-testid="mobile-nav-contribute"
              >
                Contribute
              </button>
              <button 
                onClick={() => scrollToSection('community')}
                className="text-left text-foreground hover:text-primary font-medium transition-colors"
                data-testid="mobile-nav-community"
              >
                Community
              </button>
            </nav>
          </div>
        )}
      </div>
      
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab={authModalTab}
      />
    </header>
  );
}

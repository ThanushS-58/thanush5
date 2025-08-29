import { useState } from "react";
import { Leaf, Moon, Sun, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
              <h1 className="text-xl font-bold text-foreground" data-testid="site-title">MediPlant AI</h1>
              <p className="text-xs text-muted-foreground">Traditional Plant Knowledge</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('identify')}
              className="text-foreground hover:text-primary font-medium transition-colors"
              data-testid="nav-identify"
            >
              Identify
            </button>
            <button 
              onClick={() => scrollToSection('knowledge')}
              className="text-foreground hover:text-primary font-medium transition-colors"
              data-testid="nav-knowledge"
            >
              Knowledge Base
            </button>
            <button 
              onClick={() => scrollToSection('contribute')}
              className="text-foreground hover:text-primary font-medium transition-colors"
              data-testid="nav-contribute"
            >
              Contribute
            </button>
            <button 
              onClick={() => scrollToSection('community')}
              className="text-foreground hover:text-primary font-medium transition-colors"
              data-testid="nav-community"
            >
              Community
            </button>
          </nav>
          
          <div className="flex items-center space-x-4">
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
    </header>
  );
}

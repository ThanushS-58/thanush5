import { Leaf, Github, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Footer() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-card border-t border-border py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Leaf className="text-primary-foreground h-4 w-4" data-testid="footer-logo" />
              </div>
              <span className="font-bold text-foreground" data-testid="footer-title">MediPlant AI</span>
            </div>
            <p className="text-sm text-muted-foreground" data-testid="footer-description">
              Preserving traditional medicinal plant knowledge through AI and community collaboration.
            </p>
          </div>
          
          <div>
            <h5 className="font-semibold text-foreground mb-4">Features</h5>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button 
                  onClick={() => scrollToSection('identify')} 
                  className="hover:text-primary transition-colors text-left"
                  data-testid="footer-link-identify"
                >
                  Plant Identification
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection('knowledge')} 
                  className="hover:text-primary transition-colors text-left"
                  data-testid="footer-link-knowledge"
                >
                  Knowledge Base
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection('contribute')} 
                  className="hover:text-primary transition-colors text-left"
                  data-testid="footer-link-contribute"
                >
                  Contribute
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection('community')} 
                  className="hover:text-primary transition-colors text-left"
                  data-testid="footer-link-community"
                >
                  Community
                </button>
              </li>
            </ul>
          </div>
          
          <div>
            <h5 className="font-semibold text-foreground mb-4">Support</h5>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors" data-testid="footer-link-docs">Documentation</a></li>
              <li><a href="#" className="hover:text-primary transition-colors" data-testid="footer-link-api">API Access</a></li>
              <li><a href="#" className="hover:text-primary transition-colors" data-testid="footer-link-privacy">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors" data-testid="footer-link-terms">Terms of Service</a></li>
            </ul>
          </div>
          
          <div>
            <h5 className="font-semibold text-foreground mb-4">Connect</h5>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                size="icon"
                className="w-8 h-8"
                data-testid="footer-social-github"
              >
                <Github className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="w-8 h-8"
                data-testid="footer-social-twitter"
              >
                <Twitter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground mb-4 md:mb-0" data-testid="footer-copyright">
            © 2024 MediPlant AI. Open source project for traditional knowledge preservation.
          </p>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span data-testid="footer-tagline">Made with ❤️ for indigenous communities</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

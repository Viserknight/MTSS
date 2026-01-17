import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, Shield, Image, Menu, X } from "lucide-react";
import { useState } from "react";
import mtssLogo from "@/assets/mtss-logo.png";

const Index = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 sm:gap-3">
            <img src={mtssLogo} alt="MTSS Logo" className="h-10 sm:h-12 w-auto" />
            <div className="hidden sm:block">
              <p className="font-heading font-bold text-lg leading-tight">MTSS</p>
              <p className="text-xs text-muted-foreground">We Strive for Excellence</p>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/gallery">
                <Image className="mr-1 h-4 w-4" />
                Gallery
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-b border-border px-4 py-4 space-y-2">
            <Button variant="ghost" className="w-full justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
              <Link to="/gallery">
                <Image className="mr-2 h-4 w-4" />
                Gallery
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
              <Link to="/login">Login</Link>
            </Button>
            <Button className="w-full" asChild onClick={() => setMobileMenuOpen(false)}>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="hero-gradient pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <div className="animate-fade-in">
            <img 
              src={mtssLogo} 
              alt="Mogwase Technical Secondary School" 
              className="h-32 md:h-40 w-auto mx-auto mb-8 drop-shadow-2xl"
            />
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-secondary-foreground mb-4 sm:mb-6 animate-fade-in px-2" style={{ animationDelay: "0.1s" }}>
            Mogwase Technical<br />
            <span className="text-primary">Secondary School</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-secondary-foreground/80 mb-6 sm:mb-8 max-w-2xl mx-auto animate-fade-in px-4" style={{ animationDelay: "0.2s" }}>
            "We Strive for Excellence"
          </p>
          <p className="text-base sm:text-lg text-secondary-foreground/70 mb-8 sm:mb-10 max-w-xl mx-auto animate-fade-in px-4" style={{ animationDelay: "0.3s" }}>
            Connecting Teachers, Parents, and Students through our comprehensive educational platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-fade-in px-4" style={{ animationDelay: "0.4s" }}>
            <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8" asChild>
              <Link to="/signup">
                <Users className="mr-2 h-5 w-5" />
                Get Started
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base sm:text-lg px-6 sm:px-8 bg-secondary-foreground/10 border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/20" asChild>
              <Link to="/login">
                Sign In
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">
                Connecting <span className="text-primary">Education</span> & <span className="text-primary">Community</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-6">
                Mogwase Technical Secondary School provides a comprehensive digital platform that bridges the gap between teachers, parents, and school administration.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Teachers</h3>
                    <p className="text-muted-foreground text-sm">Post announcements, upload report cards, and create AI-powered lesson plans.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Parents</h3>
                    <p className="text-muted-foreground text-sm">Stay informed with school updates, view report cards, and track your child's progress.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Administration</h3>
                    <p className="text-muted-foreground text-sm">Manage users, classes, and oversee all school activities in one place.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden md:flex justify-center">
              <img src={mtssLogo} alt="MTSS" className="h-64 w-auto opacity-80" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-secondary">
        <div className="container mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-secondary-foreground mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-secondary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
            Join the MTSS community and experience seamless school communication.
          </p>
          <Button size="lg" className="text-lg px-10" asChild>
            <Link to="/signup">Create Your Account</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-background border-t border-border">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={mtssLogo} alt="MTSS" className="h-10 w-auto" />
            <div>
              <p className="font-heading font-semibold">Mogwase Technical Secondary School</p>
              <p className="text-sm text-muted-foreground">We Strive for Excellence</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} MTSS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

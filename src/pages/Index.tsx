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
      <nav className="fixed top-0 left-0 right-0 z-50 nav-3d border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            <img src={mtssLogo} alt="MTSS Logo" className="h-10 sm:h-12 w-auto drop-shadow-lg group-hover:scale-105 transition-transform" />
            <div className="hidden sm:block">
              <p className="font-heading font-bold text-lg leading-tight text-3d">MTSS</p>
              <p className="text-xs text-muted-foreground">We Strive for Excellence</p>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="hover-lift">
              <Link to="/gallery">
                <Image className="mr-1 h-4 w-4" />
                Gallery
              </Link>
            </Button>
            <Button variant="outline" asChild className="hover-lift">
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
          <div className="md:hidden glass-3d border-t border-border/50 px-4 py-4 space-y-2">
            <Button variant="ghost" className="w-full justify-start hover-lift" asChild onClick={() => setMobileMenuOpen(false)}>
              <Link to="/gallery">
                <Image className="mr-2 h-4 w-4" />
                Gallery
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start hover-lift" asChild onClick={() => setMobileMenuOpen(false)}>
              <Link to="/login">Login</Link>
            </Button>
            <Button className="w-full" asChild onClick={() => setMobileMenuOpen(false)}>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="hero-3d pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Decorative 3D elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-primary/10 blur-3xl floating" style={{ animationDelay: "0s" }} />
          <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-accent/10 blur-3xl floating" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/4 w-24 h-24 rounded-full bg-primary/5 blur-2xl floating" style={{ animationDelay: "2s" }} />
        </div>
        
        <div className="container mx-auto text-center relative z-10">
          <div className="animate-fade-in">
            <img 
              src={mtssLogo} 
              alt="Mogwase Technical Secondary School" 
              className="h-32 md:h-40 w-auto mx-auto mb-8 drop-shadow-2xl floating"
            />
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-secondary-foreground mb-4 sm:mb-6 animate-fade-in text-3d px-2" style={{ animationDelay: "0.1s" }}>
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
            <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8 btn-3d" asChild>
              <Link to="/signup">
                <Users className="mr-2 h-5 w-5" />
                Get Started
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base sm:text-lg px-6 sm:px-8 bg-secondary-foreground/10 border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/20 btn-3d" asChild>
              <Link to="/login">
                Sign In
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-4 bg-background relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
        </div>
        
        <div className="container mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6 text-3d">
                Connecting <span className="text-primary">Education</span> & <span className="text-primary">Community</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-6">
                Mogwase Technical Secondary School provides a comprehensive digital platform that bridges the gap between teachers, parents, and school administration.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-xl glass-3d card-3d">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 depth-shadow">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Teachers</h3>
                    <p className="text-muted-foreground text-sm">Post announcements, upload report cards, and create AI-powered lesson plans.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl glass-3d card-3d">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 depth-shadow">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Parents</h3>
                    <p className="text-muted-foreground text-sm">Stay informed with school updates, view report cards, and track your child's progress.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl glass-3d card-3d">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 depth-shadow">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Administration</h3>
                    <p className="text-muted-foreground text-sm">Manage users, classes, and oversee all school activities in one place.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden md:flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-3xl scale-110" />
                <img src={mtssLogo} alt="MTSS" className="h-64 w-auto floating relative z-10 drop-shadow-2xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-secondary relative overflow-hidden">
        {/* 3D decorative shapes */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-20 w-20 h-20 border-2 border-primary/20 rounded-xl rotate-12 floating" style={{ animationDelay: "0.5s" }} />
          <div className="absolute bottom-10 right-20 w-16 h-16 border-2 border-accent/20 rounded-full floating" style={{ animationDelay: "1.5s" }} />
          <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-primary/10 rounded-lg rotate-45 floating" style={{ animationDelay: "2.5s" }} />
        </div>
        
        <div className="container mx-auto text-center relative z-10">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-secondary-foreground mb-6 text-3d">
            Ready to Get Started?
          </h2>
          <p className="text-secondary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
            Join the MTSS community and experience seamless school communication.
          </p>
          <Button size="lg" className="text-lg px-10 btn-3d gradient-shine" asChild>
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

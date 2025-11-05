import { Github, Twitter, Linkedin, Mail, GraduationCap } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2.5 mb-4">
              <img src="/aivyapp1.png" alt="Aivy Logo" className="h-[38px] w-[38px] object-contain" />
              <span className="text-[24px] font-bold text-white leading-none">
                Aivy
              </span>
            </div>
            <p className="text-background/70 mb-4 max-w-md">
              Focus on learning, not organizing. AI-powered study planning for students who dream big.
            </p>
            <p className="text-background/60 text-sm mb-6 max-w-md">
              Made by students, for students. Built with ❤️ in India.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="w-10 h-10 bg-background/10 hover:bg-background/20 rounded-lg flex items-center justify-center transition-colors duration-200"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-background/10 hover:bg-background/20 rounded-lg flex items-center justify-center transition-colors duration-200"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-background/10 hover:bg-background/20 rounded-lg flex items-center justify-center transition-colors duration-200"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-background/10 hover:bg-background/20 rounded-lg flex items-center justify-center transition-colors duration-200"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="text-background/70 hover:text-background transition-colors duration-200">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-background/70 hover:text-background transition-colors duration-200">
                  How it Works
                </a>
              </li>
              <li>
                <a href="#" className="text-background/70 hover:text-background transition-colors duration-200">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="text-background/70 hover:text-background transition-colors duration-200">
                  Integrations
                </a>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-background/70 hover:text-background transition-colors duration-200">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-background/70 hover:text-background transition-colors duration-200">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-background/70 hover:text-background transition-colors duration-200">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="text-background/70 hover:text-background transition-colors duration-200">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/20 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-background/70 text-sm">
            © {currentYear} Aivy. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <a href="/privacy-policy" className="text-background/70 hover:text-background text-sm transition-colors duration-200">
              Privacy Policy
            </a>
            <a href="/terms-of-service" className="text-background/70 hover:text-background text-sm transition-colors duration-200">
              Terms of Service
            </a>
            <a href="/cookie-policy" className="text-background/70 hover:text-background text-sm transition-colors duration-200">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
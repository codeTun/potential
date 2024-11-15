"use client";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ArrowUp,
} from "lucide-react";

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      {/* Footer */}
      <footer className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 relative overflow-hidden">
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -bottom-4 -left-4 w-64 h-64 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -top-4 -right-4 w-64 h-64 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="h-8 w-8 text-yellow-400 animate-pulse" />
                <span className="text-2xl font-bold">
                  <span className="text-yellow-400 text-3xl">P</span>otential
                </span>
              </div>
              <p className="text-sm mb-4">
                Unlock your potential and reach new heights with our innovative
                solutions and expert guidance.
              </p>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="text-white hover:text-yellow-400 transition-colors"
                >
                  <Facebook size={20} />
                </a>
                <a
                  href="#"
                  className="text-white hover:text-yellow-400 transition-colors"
                >
                  <Twitter size={20} />
                </a>
                <a
                  href="#"
                  className="text-white hover:text-yellow-400 transition-colors"
                >
                  <Instagram size={20} />
                </a>
                <a
                  href="#"
                  className="text-white hover:text-yellow-400 transition-colors"
                >
                  <Linkedin size={20} />
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="hover:text-yellow-400 transition-colors"
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-yellow-400 transition-colors"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-yellow-400 transition-colors"
                  >
                    Services
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-yellow-400 transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
              <p className="text-sm mb-2">Tunis, Tunisia</p>
              <p className="text-sm mb-2">Tunis </p>
              <p className="text-sm mb-2">Email: info@potential.com</p>
              <p className="text-sm">Phone: (216) 456-7890</p>
            </div>
          </div>
          <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm mb-4 md:mb-0">
              &copy; 2024 Potential. All rights reserved.
            </p>
            <Button
              onClick={scrollToTop}
              variant="outline"
              size="icon"
              className="bg-yellow-400 text-blue-800 hover:bg-yellow-500 transition-colors rounded-full animate-bounce"
            >
              <ArrowUp size={20} />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

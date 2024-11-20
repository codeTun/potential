// FILE: components/hero-section.tsx
"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Search, Menu } from "lucide-react";

export function HeroSectionComponent({
  onSearch,
}: {
  onSearch: (query: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
    setSearchQuery(""); // Reset the search query input
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="bg-gradient-to-br from-blue-900 to-blue-700 min-h-screen text-white overflow-hidden relative">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <svg
          className="absolute top-0 left-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* SVG content */}
        </svg>
      </div>

      {/* Interactive glow effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%)`,
          transition: "background 0.3s ease",
        }}
      />

      <nav className="container mx-auto px-4 py-6 relative z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Sparkles className="h-8 w-8 text-orange-400 animate-pulse" />
            <span className="text-2xl font-bold">
              <span className="text-orange-400 text-3xl">P</span>otential
            </span>
          </div>
          <div className="hidden md:flex space-x-4">
            <a href="#" className="hover:text-orange-300 transition-colors">
              Home
            </a>
            <a href="#" className="hover:text-orange-300 transition-colors">
              About
            </a>
            <a href="#" className="hover:text-orange-300 transition-colors">
              Services
            </a>
            <a href="#" className="hover:text-orange-300 transition-colors">
              Contact
            </a>
          </div>
          <Button variant={"ghost"} size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-24 relative z-10">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in-up">
            Unlock Your Potential
          </h1>
          <p className="text-l mb-12 max-w-2xl mx-auto animate-fade-in-up animation-delay-300">
            Discover the power within you and reach new heights. Start your
            journey with us today.
          </p>

          <form
            onSubmit={handleSearch}
            className="flex max-w-md mx-auto animate-fade-in-up animation-delay-600"
          >
            <div className="flex items-center bg-white rounded-full overflow-hidden max-w-2xl shadow-lg">
              <Input
                type="text"
                placeholder="Search for opportunities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-grow bg-transparent border-none pl-6 pr-4 py-3 text-lg focus:ring-0 focus:outline-none focus-visible:outline-none placeholder-white/70 text-black rounded-l-full"
                style={{
                  minWidth: "350px",
                  maxHeight: "150px",
                  outline: "none",
                }}
              />
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-r-full px-3 py-3 transition-all duration-300 ease-in-out group"
              >
                <span className="flex items-center">
                  <Search className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                  <span className="font-semibold">Search</span>
                </span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

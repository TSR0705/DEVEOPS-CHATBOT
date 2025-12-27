// Phase 5.2 CardNav integration complete
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { FaBars, FaTimes } from "react-icons/fa";

export default function CardNavClient({ isAuthenticated = false }: { isAuthenticated: boolean }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  // GSAP animation for menu
  useEffect(() => {
    if (isMenuOpen) {
      gsap.fromTo(
        menuRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
      );
    }
  }, [isMenuOpen]);

  // Handle "Get Started" button click
  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/sign-in"); // Clerk sign-in route
    }
  };

  // Toggle menu with GSAP animation
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        hamburgerRef.current &&
        !hamburgerRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-slate-200">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-slate-900"
          >
            <path
              d="M16 2L2 8L8 16L2 24L16 30L30 24L24 16L30 8L16 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 10L10 16L16 22L22 16L16 10Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-xl font-bold text-slate-900">DeployBot</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#" className="text-slate-700 hover:text-slate-900 transition-colors">
            Features
          </a>
          <a href="#" className="text-slate-700 hover:text-slate-900 transition-colors">
            Solutions
          </a>
          <a href="#" className="text-slate-700 hover:text-slate-900 transition-colors">
            Pricing
          </a>
          <a href="#" className="text-slate-700 hover:text-slate-900 transition-colors">
            Docs
          </a>
          <button
            onClick={handleGetStarted}
            className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            {isAuthenticated ? "Dashboard" : "Get Started"}
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          ref={hamburgerRef}
          onClick={toggleMenu}
          className="md:hidden p-2 rounded-md text-slate-700 hover:bg-slate-100 focus:outline-none"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div
          ref={menuRef}
          className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-lg"
        >
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            <a
              href="#"
              className="py-2 text-slate-700 hover:text-slate-900 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#"
              className="py-2 text-slate-700 hover:text-slate-900 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Solutions
            </a>
            <a
              href="#"
              className="py-2 text-slate-700 hover:text-slate-900 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </a>
            <a
              href="#"
              className="py-2 text-slate-700 hover:text-slate-900 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Docs
            </a>
            <button
              onClick={() => {
                handleGetStarted();
                setIsMenuOpen(false);
              }}
              className="w-full px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
            >
              {isAuthenticated ? "Dashboard" : "Get Started"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
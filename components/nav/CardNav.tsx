"use client";

import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { GoArrowUpRight } from "react-icons/go";

type CardNavLink = {
  label: string;
  href: string;
  ariaLabel: string;
};

export type CardNavItem = {
  label: string;
  bgColor: string;
  textColor: string;
  links: CardNavLink[];
};

export interface CardNavProps {
  logo: React.ReactNode;
  items: CardNavItem[];
  className?: string;
  ease?: string;
  baseColor?: string;
  menuColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
}

const CardNav: React.FC<CardNavProps> = ({
  logo,
  items,
  className = "",
  ease = "power3.out",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 320;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile) {
      const contentEl = navEl.querySelector(".card-nav-content") as HTMLElement;
      if (contentEl) {
        contentEl.style.visibility = "visible";
        contentEl.style.pointerEvents = "auto";
        contentEl.style.position = "static";
        contentEl.style.height = "auto";
        const height = 70 + contentEl.scrollHeight + 20;
        return height;
      }
    }
    return 320;
  };

  const createTimeline = useCallback(() => {
    if (!navRef.current) return null;

    gsap.set(navRef.current, { height: 70, overflow: "hidden" });
    gsap.set(cardsRef.current, { y: 50, opacity: 0 });

    const tl = gsap.timeline({ paused: true });
    tl.to(navRef.current, {
      height: calculateHeight,
      duration: 0.4,
      ease,
    });
    tl.to(
      cardsRef.current,
      { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.08 },
      "-=0.1"
    );

    return tl;
  }, [ease]);

  useLayoutEffect(() => {
    tlRef.current = createTimeline();

    return () => {
      tlRef.current?.kill();
    };
  }, [createTimeline]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;

    if (!isExpanded) {
      setIsExpanded(true);
      tl.play(0);
    } else {
      tl.eventCallback("onReverseComplete", () => setIsExpanded(false));
      tl.reverse();
    }
  };

  const setCardRef = (i: number) => (el: HTMLDivElement | null) => {
    if (el) cardsRef.current[i] = el;
  };

  return (
    <div
      className={`card-nav-container absolute left-1/2 -translate-x-1/2 w-[90%] max-w-[900px] z-[100] top-6 ${className}`}
    >
      <nav
        ref={navRef}
        className="block h-[70px] rounded-2xl shadow-lg relative overflow-hidden will-change-[height] z-[50] border border-[rgba(255,255,255,0.075)] bg-[#0A0E1B]"
      >
        {/* TOP BAR */}
        <div className="absolute inset-x-0 top-0 h-[70px] flex items-center justify-between px-4 z-[2]">
          <div
            className="flex items-center gap-2 cursor-pointer nav-menu-icon text-white"
            onClick={toggleMenu}
          >
            <div className="w-[26px] h-[2px] bg-current mb-[6px]" />
            <div className="w-[26px] h-[2px] bg-current" />
          </div>

          <div className="absolute left-1/2 -translate-x-1/2">{logo}</div>

          <button className="rounded-lg px-4 py-2 font-medium text-sm bg-[#0F1426] hover:bg-[#141A30] text-[#9BFFB0] border border-[rgba(255,255,255,0.075)] transition-colors">
            Get Started
          </button>
        </div>

        {/* CONTENT */}
        <div
          className={`card-nav-content absolute left-0 right-0 top-[70px] p-4 flex flex-col md:flex-row gap-4 ${
            isExpanded
              ? "visible pointer-events-auto"
              : "invisible pointer-events-none"
          }`}
        >
          {items.map((item, idx) => (
            <div
              key={item.label}
              ref={setCardRef(idx)}
              className="flex-1 rounded-xl p-5 flex flex-col gap-2 border border-[rgba(255,255,255,0.035)] nav-card"
              style={{ backgroundColor: item.bgColor, color: item.textColor }}
            >
              <div className="text-lg font-semibold">{item.label}</div>
              <div className="mt-auto flex flex-col gap-2">
                {item.links.map(lnk => (
                  <a
                    key={lnk.label}
                    href={lnk.href}
                    aria-label={lnk.ariaLabel}
                    className="flex items-center gap-2 text-sm opacity-90 hover:opacity-100 hover:text-white transition-colors"
                  >
                    <GoArrowUpRight />
                    {lnk.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;

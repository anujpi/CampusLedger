"use client"; 

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";

export interface NavTab {
  id: string;
  label: string;
  onClick?: () => void;
}

interface NavHeaderProps {
  tabs?: NavTab[];
  activeTab?: string;
}

function NavHeader({ 
  tabs = [
    { id: "home", label: "Home" },
    { id: "ecosystem", label: "Ecosystem" },
    { id: "features", label: "Features" },
  ],
  activeTab
}: NavHeaderProps) {
  const [position, setPosition] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });

  return (
    <ul
      className="relative mx-auto flex w-fit rounded-full border-2 border-white/20 bg-black/50 backdrop-blur-md p-1 shadow-2xl"
      onMouseLeave={() => setPosition((pv) => ({ ...pv, opacity: 0 }))}
    >
      {tabs.map((tab) => (
        <Tab key={tab.id} setPosition={setPosition} onClick={tab.onClick} isActive={activeTab === tab.id}>
          {tab.label}
        </Tab>
      ))}
      <Cursor position={position} />
    </ul>
  );
}

const Tab = ({
  children,
  setPosition,
  onClick,
  isActive
}: {
  children: React.ReactNode;
  setPosition: any;
  onClick?: () => void;
  isActive?: boolean;
}) => {
  const ref = useRef<HTMLLIElement>(null);
  return (
    <li
      ref={ref}
      onClick={onClick}
      onMouseEnter={() => {
        if (!ref.current) return;

        const { width } = ref.current.getBoundingClientRect();
        setPosition({
          width,
          opacity: 1,
          left: ref.current.offsetLeft,
        });
      }}
      className={`relative z-10 block cursor-pointer px-4 py-2 text-xs font-semibold uppercase tracking-wider mix-blend-difference md:px-6 md:py-2.5 md:text-sm transition-colors ${isActive ? "text-white" : "text-white/80 hover:text-white"}`}
    >
      {children}
    </li>
  );
};

const Cursor = ({ position }: { position: any }) => {
  return (
    <motion.li
      animate={position}
      className="absolute z-0 h-8 rounded-full bg-white md:h-10"
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    />
  );
};

export default NavHeader;

import { motion, useSpring, useTransform, useMotionValue } from "motion/react";
import { useRef, useState, useEffect } from "react";

interface MagneticCharacterProps {
  char: string;
  index: number;
}

function MagneticCharacter({ char, index }: MagneticCharacterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for the "magnetic" effect
  const springConfig = { damping: 15, stiffness: 150 };
  const translateX = useSpring(mouseX, springConfig);
  const translateY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent | MouseEvent) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    
    // Calculate distance from center
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    
    // If mouse is close enough (within 100px), apply force
    const radius = 100;
    const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);
    
    if (distance < radius) {
      // Move letters slightly towards or away from mouse (Everswap style is often a subtle attraction/wiggle)
      // We'll go with a subtle "push" or attraction that feels organic
      const force = (radius - distance) / radius;
      mouseX.set(distanceX * force * 0.5);
      mouseY.set(distanceY * force * 0.5);
    } else {
      mouseX.set(0);
      mouseY.set(0);
    }
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <motion.span
      ref={ref}
      onMouseLeave={handleMouseLeave}
      style={{
        x: translateX,
        y: translateY,
        display: "inline-block",
        willChange: "transform, opacity",
        transform: "translateZ(0)", // Forzado de aceleración de hardware para nitidez
      }}
      initial={{ y: 100, opacity: 0, filter: "blur(20px)" }}
      animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
      transition={{
        duration: 1.2,
        delay: index * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="cursor-default"
    >
      {char === " " ? "\u00A0" : char}
    </motion.span>
  );
}

export default function MagneticText({ text }: { text: string }) {
  return (
    <div className="flex select-none overflow-visible py-4">
      {text.split("").map((char, i) => (
        <MagneticCharacter key={i} char={char} index={i} />
      ))}
    </div>
  );
}

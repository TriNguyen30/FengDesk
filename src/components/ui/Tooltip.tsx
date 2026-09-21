import { ReactNode, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { twMerge } from "tailwind-merge";
import { AnimatePresence, motion } from "framer-motion";

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: "top" | "bottom" | "left" | "right" | "top-left";
  className?: string;
}

export default function Tooltip({ children, content, position = "top", className }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let top = 0;
    let left = 0;

    if (position === "left") {
      top = rect.top + rect.height / 2;
      left = rect.left - 8;
    } else if (position === "right") {
      top = rect.top + rect.height / 2;
      left = rect.right + 8;
    } else if (position === "top") {
      top = rect.top - 8;
      left = rect.left + rect.width / 2;
    } else if (position === "top-left") {
      top = rect.top - 8;
      left = rect.left;
    } else if (position === "bottom") {
      top = rect.bottom + 8;
      left = rect.left + rect.width / 2;
    }

    setCoords({ top, left });
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isVisible, position]);

  const getInitial = () => {
    switch (position) {
      case "left":
        return { opacity: 0, x: "-100%", y: "-50%" };
      case "right":
        return { opacity: 0, x: 0, y: "-50%" };
      case "top":
        return { opacity: 0, x: "-50%", y: "-100%" };
      case "top-left":
        return { opacity: 0, x: 0, y: "-100%" };
      case "bottom":
        return { opacity: 0, x: "-50%", y: 0 };
      default:
        return { opacity: 0 };
    }
  };

  const getAnimate = () => {
    switch (position) {
      case "left":
        return { opacity: 1, x: "-100%", y: "-50%" };
      case "right":
        return { opacity: 1, x: 0, y: "-50%" };
      case "top":
        return { opacity: 1, x: "-50%", y: "-100%" };
      case "top-left":
        return { opacity: 1, x: 0, y: "-100%" };
      case "bottom":
        return { opacity: 1, x: "-50%", y: 0 };
      default:
        return { opacity: 1 };
    }
  };

  const portalRoot = typeof document !== "undefined" ? document.body : null;

  return (
    <>
      <div
        ref={containerRef}
        className="inline-flex"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {portalRoot &&
        createPortal(
          <AnimatePresence>
            {isVisible && (
              <motion.div
                initial={getInitial()}
                animate={getAnimate()}
                exit={getInitial()}
                transition={{ duration: 0.15 }}
                style={{ top: coords.top, left: coords.left }}
                className={twMerge(
                  "pointer-events-none fixed z-[9999] whitespace-nowrap rounded-[8px] bg-gray-900/85 px-2.5 py-1.5 text-[12px] font-medium text-white shadow-sm backdrop-blur-[2px]",
                  className,
                )}
              >
                {content}
              </motion.div>
            )}
          </AnimatePresence>,
          portalRoot,
        )}
    </>
  );
}

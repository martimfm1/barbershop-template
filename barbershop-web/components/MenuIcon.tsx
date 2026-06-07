"use client"
import { motion } from "motion/react"

interface MenuIconProps {
open: boolean
className?: string
}

export function MenuIcon({ open, className = "size-6" }: MenuIconProps) {
return (
<motion.svg
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    stroke="currentColor"
    className={className}
    aria-hidden="true"
>
    <motion.line
    x1="3" y1="6" x2="21" y2="6"
    animate={open
        ? { x1: 4, y1: 4, x2: 20, y2: 20 }
        : { x1: 3, y1: 6, x2: 21, y2: 6 }
    }
    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    />
    <motion.line
    x1="3" y1="12" x2="21" y2="12"
    animate={open
        ? { opacity: 0, x1: 12, x2: 12 }
        : { opacity: 1, x1: 3, x2: 21 }
    }
    transition={{ duration: 0.2, ease: "easeInOut" }}
    />
    <motion.line
    x1="3" y1="18" x2="21" y2="18"
    animate={open
        ? { x1: 4, y1: 20, x2: 20, y2: 4 }
        : { x1: 3, y1: 18, x2: 21, y2: 18 }
    }
    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    />
</motion.svg>
)
}
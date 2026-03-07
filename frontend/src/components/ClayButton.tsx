import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ClayButtonProps extends HTMLMotionProps<"button"> {
    variant?: 'primary' | 'secondary' | 'pink' | 'mint' | 'purple';
    className?: string;
}

export const ClayButton: React.FC<ClayButtonProps> = ({
    children,
    className = '',
    variant = 'primary',
    type = 'button',
    disabled,
    ...props
}) => {
    const variantStyles = {
        primary: 'bg-clay-blue text-white',
        secondary: 'bg-background text-text-dark',
        pink: 'bg-clay-pink text-white',
        mint: 'bg-clay-mint text-text-dark',
        purple: 'bg-clay-purple text-white',
    };

    return (
        <motion.button
            type={type}
            whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            className={`clay-button ${variantStyles[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={disabled}
            {...props}
        >
            {children}
        </motion.button>
    );
};

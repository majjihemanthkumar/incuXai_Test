import React from 'react';
import { motion } from 'framer-motion';

interface ClayButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    variant?: 'primary' | 'secondary' | 'pink' | 'mint' | 'purple';
    type?: 'button' | 'submit';
}

export const ClayButton: React.FC<ClayButtonProps> = ({
    children,
    onClick,
    className = '',
    variant = 'primary',
    type = 'button'
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
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`clay-button ${variantStyles[variant]} ${className}`}
        >
            {children}
        </motion.button>
    );
};

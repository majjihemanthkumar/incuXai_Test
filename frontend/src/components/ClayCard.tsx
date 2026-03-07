import React from 'react';
import { motion } from 'framer-motion';

interface ClayCardProps {
    children: React.ReactNode;
    className?: string;
    animate?: boolean;
}

export const ClayCard: React.FC<ClayCardProps> = ({
    children,
    className = '',
    animate = true
}) => {
    return (
        <motion.div
            initial={animate ? { opacity: 0, y: 20 } : undefined}
            whileInView={animate ? { opacity: 1, y: 0 } : undefined}
            viewport={{ once: true }}
            className={`clay-card p-6 ${className}`}
        >
            {children}
        </motion.div>
    );
};

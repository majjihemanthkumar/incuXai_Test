import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ClayButton } from './ClayButton';

export const ClayNavbar: React.FC = () => {
    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="clay-nav flex items-center justify-between"
        >
            <Link to="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-clay-purple rounded-xl shadow-clay-light flex items-center justify-center text-white font-bold text-xl">
                    iX
                </div>
                <span className="text-xl font-bold text-text-dark tracking-tight">incuXai</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
                <Link to="/" className="text-sm font-medium text-text-dark hover:text-clay-blue transition-colors">Home</Link>
                <Link to="/features" className="text-sm font-medium text-text-dark hover:text-clay-blue transition-colors">Features</Link>
                <Link to="/dashboard" className="text-sm font-medium text-text-dark hover:text-clay-blue transition-colors">Dashboard</Link>
                <Link to="/contact" className="text-sm font-medium text-text-dark hover:text-clay-blue transition-colors">Contact</Link>
            </div>

            <div className="flex items-center gap-4">
                <Link to="/login">
                    <ClayButton variant="primary" className="py-2 px-5 text-sm">Login</ClayButton>
                </Link>
            </div>
        </motion.nav>
    );
};

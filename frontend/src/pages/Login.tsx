import React from 'react';
import { motion } from 'framer-motion';
import { ClayCard } from '../components/ClayCard';
import { ClayButton } from '../components/ClayButton';
import { AiOutlineMail, AiOutlineLock, AiOutlineGoogle, AiOutlineGithub } from 'react-icons/ai';

export const LoginPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-clay-blue/20 rounded-full blur-3xl" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-clay-pink/20 rounded-full blur-3xl" />

            <ClayCard className="w-full max-w-md p-10 z-10">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-clay-purple rounded-2xl shadow-clay-light flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                        iX
                    </div>
                    <h1 className="text-3xl font-bold text-text-dark">Welcome Back</h1>
                    <p className="text-text-dark/40">Log in to your incuXai account</p>
                </div>

                <form className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold ml-2 text-text-dark/60">Email Address</label>
                        <div className="relative">
                            <AiOutlineMail className="absolute left-5 top-1/2 -translate-y-1/2 text-text-dark/40 text-xl" />
                            <input
                                type="email"
                                placeholder="name@company.com"
                                className="clay-input pl-14"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold ml-2 text-text-dark/60">Password</label>
                        <div className="relative">
                            <AiOutlineLock className="absolute left-5 top-1/2 -translate-y-1/2 text-text-dark/40 text-xl" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="clay-input pl-14"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-2 text-xs font-semibold text-clay-blue">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 rounded-md border-clay-blue text-clay-blue focus:ring-clay-blue" />
                            Remember me
                        </label>
                        <button type="button" className="hover:underline">Forgot Password?</button>
                    </div>

                    <ClayButton type="submit" variant="primary" className="w-full py-4 text-lg">
                        Sign In
                    </ClayButton>
                </form>

                <div className="mt-10">
                    <div className="relative flex items-center justify-center mb-8">
                        <div className="absolute w-full h-[1px] bg-text-dark/10" />
                        <span className="relative bg-background px-4 text-xs font-bold text-text-dark/40 uppercase tracking-widest">Or continue with</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <ClayButton variant="secondary" className="flex items-center justify-center gap-2 py-3">
                            <AiOutlineGoogle className="text-xl" /> Google
                        </ClayButton>
                        <ClayButton variant="secondary" className="flex items-center justify-center gap-2 py-3">
                            <AiOutlineGithub className="text-xl" /> GitHub
                        </ClayButton>
                    </div>
                </div>

                <p className="mt-10 text-center text-sm text-text-dark/60">
                    Don't have an account? <button className="text-clay-blue font-bold hover:underline">Sign Up</button>
                </p>
            </ClayCard>
        </div>
    );
};

import React from 'react';
import { motion } from 'framer-motion';
import { ClayCard } from '../components/ClayCard';
import { ClayButton } from '../components/ClayButton';
import { ClayNavbar } from '../components/ClayNavbar';
import { AiOutlineMail, AiOutlinePhone, AiOutlineGlobal, AiOutlineMessage } from 'react-icons/ai';

export const ContactPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-background pb-20">
            <ClayNavbar />

            <section className="max-w-7xl mx-auto px-6 pt-20">
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-bold text-text-dark mb-4">Get in Touch</h1>
                    <p className="text-xl text-text-dark/40">Have questions? We're here to help you engage better.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    {/* Info Cards */}
                    <div className="space-y-8">
                        <ClayCard className="flex items-center gap-6 group hover:translate-x-2 transition-transform">
                            <div className="w-14 h-14 bg-clay-blue rounded-2xl flex items-center justify-center text-white text-2xl shadow-clay-light">
                                <AiOutlineMail />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-text-dark/40 uppercase tracking-widest">Email Us</p>
                                <p className="text-lg font-bold">support@incuxai.com</p>
                            </div>
                        </ClayCard>

                        <ClayCard className="flex items-center gap-6 group hover:translate-x-2 transition-transform">
                            <div className="w-14 h-14 bg-clay-pink rounded-2xl flex items-center justify-center text-white text-2xl shadow-clay-light">
                                <AiOutlinePhone />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-text-dark/40 uppercase tracking-widest">Call Us</p>
                                <p className="text-lg font-bold">+1 (555) 000-1234</p>
                            </div>
                        </ClayCard>

                        <ClayCard className="flex items-center gap-6 group hover:translate-x-2 transition-transform">
                            <div className="w-14 h-14 bg-clay-mint rounded-2xl flex items-center justify-center text-text-dark/60 text-2xl shadow-clay-light">
                                <AiOutlineGlobal />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-text-dark/40 uppercase tracking-widest">Global Office</p>
                                <p className="text-lg font-bold">123 Startup Ave, San Francisco, CA</p>
                            </div>
                        </ClayCard>
                    </div>

                    {/* Contact Form */}
                    <ClayCard className="p-10">
                        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                            <AiOutlineMessage className="text-clay-blue" /> Send a Message
                        </h2>

                        <form className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold ml-2 text-text-dark/60">Full Name</label>
                                    <input type="text" placeholder="John Doe" className="clay-input" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold ml-2 text-text-dark/60">Email Address</label>
                                    <input type="email" placeholder="john@example.com" className="clay-input" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold ml-2 text-text-dark/60">Subject</label>
                                <input type="text" placeholder="How can we help?" className="clay-input" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold ml-2 text-text-dark/60">Message</label>
                                <textarea
                                    placeholder="Your message here..."
                                    className="clay-input h-32 resize-none"
                                />
                            </div>

                            <ClayButton variant="primary" className="w-full py-4 text-lg">
                                Send Message
                            </ClayButton>
                        </form>
                    </ClayCard>
                </div>
            </section>
        </div>
    );
};

import React from 'react';
import { motion } from 'framer-motion';
import { ClayNavbar } from '../components/ClayNavbar';
import { ClayCard } from '../components/ClayCard';
import { ClayButton } from '../components/ClayButton';
import {
    AiOutlineRocket,
    AiOutlineTeam,
    AiOutlineLock,
    AiOutlineGlobal,
    AiOutlineBarChart,
    AiOutlineTablet
} from 'react-icons/ai';

export const FeaturesPage: React.FC = () => {
    const allFeatures = [
        {
            icon: <AiOutlineRocket />,
            title: "Real-time Interactions",
            desc: "Instantaneous feedback from your audience with zero noticeable latency. WebSockets power a seamless real-time experience.",
            color: "bg-clay-blue"
        },
        {
            icon: <AiOutlineTeam />,
            title: "Massive Scale",
            desc: "Designed to handle thousands of concurrent participants without breaking a sweat. Perfect for large conferences.",
            color: "bg-clay-pink"
        },
        {
            icon: <AiOutlineLock />,
            title: "Anti-Cheating Tech",
            desc: "Strict exam modes with tab switching detection, fullscreen enforcement, and copy-paste prevention.",
            color: "bg-clay-purple"
        },
        {
            icon: <AiOutlineGlobal />,
            title: "Global CDN",
            desc: "Fast load times anywhere in the world thanks to our edge-optimized asset delivery and distributed backend.",
            color: "bg-clay-mint"
        },
        {
            icon: <AiOutlineBarChart />,
            title: "Advanced Analytics",
            desc: "Deep dive into participant engagement, question difficulty, and overall completion rates with beautiful charts.",
            color: "bg-clay-blue"
        },
        {
            icon: <AiOutlineTablet />,
            title: "Mobile First Design",
            desc: "Every interaction is optimized for mobile devices, ensuring participants have a flawless experience on their phones.",
            color: "bg-clay-pink"
        }
    ];

    return (
        <div className="min-h-screen pb-20">
            <ClayNavbar />

            <section className="max-w-7xl mx-auto px-6 pt-20">
                <div className="text-center mb-20">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-6xl font-bold text-text-dark mb-6 leading-tight"
                    >
                        Everything you need for <br />
                        <span className="text-clay-purple">Interactive Presentations</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-text-dark/60 max-w-2xl mx-auto"
                    >
                        Discover the powerful features that make incuXai the ultimate tool for educators, presenters, and event organizers.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {allFeatures.map((feature, i) => (
                        <ClayCard
                            key={i}
                            className="group hover:-translate-y-2 transition-transform duration-300"
                        >
                            <div className={`w-16 h-16 ${feature.color} rounded-2xl mb-6 shadow-clay-light flex items-center justify-center text-white text-3xl group-hover:scale-110 transition-transform`}>
                                {feature.icon}
                            </div>
                            <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                            <p className="text-text-dark/60 leading-relaxed">
                                {feature.desc}
                            </p>
                        </ClayCard>
                    ))}
                </div>

                {/* CTA Section */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-32 p-12 bg-clay-purple/10 rounded-[40px] border border-clay-purple/20 text-center relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-clay-purple/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <h2 className="text-4xl font-bold mb-6 relative z-10">Ready to transform your events?</h2>
                    <p className="text-xl text-text-dark/60 max-w-2xl mx-auto mb-10 relative z-10">
                        Join thousands of presenters who trust incuXai to deliver unforgettable interactive experiences.
                    </p>
                    <ClayButton variant="primary" className="text-lg px-10 py-4 relative z-10">
                        Create Free Account
                    </ClayButton>
                </motion.div>
            </section>
        </div>
    );
};

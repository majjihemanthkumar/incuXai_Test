import React from 'react';
import { motion } from 'framer-motion';
import {
    AiOutlineDashboard,
    AiOutlineTeam,
    AiOutlineBarChart,
    AiOutlinePlus,
    AiOutlineBell,
    AiOutlineSetting
} from 'react-icons/ai';
import { ClayCard } from '../components/ClayCard';
import { ClayButton } from '../components/ClayButton';

export const DashboardPage: React.FC = () => {
    const stats = [
        { label: 'Active Sessions', value: '12', icon: <AiOutlineDashboard />, color: 'bg-clay-blue' },
        { label: 'Total Participants', value: '1,284', icon: <AiOutlineTeam />, color: 'bg-clay-pink' },
        { label: 'Avg. Engagement', value: '84%', icon: <AiOutlineBarChart />, color: 'bg-clay-mint' },
    ];

    return (
        <div className="flex min-h-screen bg-background p-4 md:p-8 gap-8">
            {/* Sidebar */}
            <motion.aside
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="hidden lg:flex flex-col w-72 clay-card h-[calc(100vh-4rem)] sticky top-8 p-8"
            >
                <div className="flex items-center gap-3 mb-12">
                    <div className="w-10 h-10 bg-clay-purple rounded-xl shadow-clay-light flex items-center justify-center text-white font-bold">iX</div>
                    <span className="text-xl font-bold tracking-tight">incuXai</span>
                </div>

                <nav className="flex-1 space-y-4">
                    <SidebarLink icon={<AiOutlineDashboard />} label="Dashboard" active />
                    <SidebarLink icon={<AiOutlineTeam />} label="Sessions" />
                    <SidebarLink icon={<AiOutlineBarChart />} label="Analytics" />
                    <SidebarLink icon={<AiOutlineBell />} label="Notifications" />
                    <SidebarLink icon={<AiOutlineSetting />} label="Settings" />
                </nav>

                <ClayButton variant="purple" className="mt-auto w-full flex items-center justify-center gap-2">
                    <AiOutlinePlus /> New Session
                </ClayButton>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 space-y-8 overflow-y-auto">
                {/* Header */}
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-text-dark">Dashboard Overview</h1>
                        <p className="text-text-dark/40">Welcome back, Presenter!</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 clay-card flex items-center justify-center text-xl cursor-pointer hover:shadow-clay-medium transition-shadow">
                            <AiOutlineBell />
                        </div>
                        <div className="w-12 h-12 rounded-full bg-clay-pink shadow-clay-light border-2 border-white overflow-hidden">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                        </div>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {stats.map((stat, i) => (
                        <ClayCard key={i} className="flex items-center gap-6 group hover:shadow-clay-medium transition-shadow">
                            <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center text-white text-2xl shadow-clay-light group-hover:scale-110 transition-transform`}>
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-text-dark/40">{stat.label}</p>
                                <p className="text-2xl font-bold text-text-dark">{stat.value}</p>
                            </div>
                        </ClayCard>
                    ))}
                </div>

                {/* Recent Activity & Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <ClayCard className="flex flex-col">
                        <h3 className="text-xl font-bold mb-6">Recent Sessions</h3>
                        <div className="space-y-4">
                            {[1, 2, 3].map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/50 border border-white hover:bg-white transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-clay-mint rounded-lg flex items-center justify-center text-text-dark/60 shadow-clay-inner">
                                            MB
                                        </div>
                                        <div>
                                            <p className="font-semibold">Marketing Brainstorm #0{42 + i}</p>
                                            <p className="text-xs text-text-dark/40">March 07, 2024 • 142 participants</p>
                                        </div>
                                    </div>
                                    <div className="glass-pill opacity-0 group-hover:opacity-100 transition-opacity">Full Report</div>
                                </div>
                            ))}
                        </div>
                    </ClayCard>

                    <ClayCard className="bg-clay-blue/10 border-clay-blue/20">
                        <h3 className="text-xl font-bold mb-6">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <ActionCard label="Create Quiz" color="bg-clay-blue" />
                            <ActionCard label="Live Poll" color="bg-clay-pink" />
                            <ActionCard label="Q&A Session" color="bg-clay-purple" />
                            <ActionCard label="Secure Exam" color="bg-clay-mint" />
                        </div>
                    </ClayCard>
                </div>
            </main>
        </div>
    );
};

const SidebarLink = ({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) => (
    <div className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all ${active ? 'bg-clay-blue text-white shadow-clay-light' : 'text-text-dark/60 hover:bg-white hover:text-text-dark'}`}>
        <span className="text-xl">{icon}</span>
        <span className="font-semibold">{label}</span>
    </div>
);

const ActionCard = ({ label, color }: { label: string, color: string }) => (
    <div className={`p-6 rounded-3xl ${color} bg-opacity-20 border border-white flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-clay-medium transition-all group`}>
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-white shadow-clay-light group-hover:scale-110 transition-transform`}>
            <AiOutlinePlus />
        </div>
        <p className="font-bold text-sm text-center">{label}</p>
    </div>
);

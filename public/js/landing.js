import { insforge, handleResponse } from './insforge-client.js';

document.addEventListener('DOMContentLoaded', () => {
    // ─── Theme Toggle ───
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('livepoll-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.textContent = savedTheme === 'dark' ? '🌙' : '☀️';

    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('livepoll-theme', next);
        themeToggle.textContent = next === 'dark' ? '🌙' : '☀️';
    });

    // ─── Join Toggle ───
    const joinBtn = document.getElementById('joinBtn');
    const joinSection = document.getElementById('joinSection');

    joinBtn.addEventListener('click', () => {
        joinSection.classList.toggle('hidden');
        if (!joinSection.classList.contains('hidden')) {
            document.getElementById('joinCode').focus();
            joinSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });

    // ─── Code Input Formatting ───
    const codeInput = document.getElementById('joinCode');
    codeInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
    });

    // ─── Join Form Submit ───
    const joinForm = document.getElementById('joinForm');
    joinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = codeInput.value.trim();
        const name = document.getElementById('joinName').value.trim();

        if (code.length !== 6) {
            showToast('Please enter a valid 6-digit code');
            return;
        }

        if (!name) {
            showToast('Please enter your name to join');
            document.getElementById('joinName').focus();
            return;
        }

        // Check if session exists via InsForge SDK
        try {
            const { data: session, error } = await insforge.database
                .from('sessions')
                .select('code, is_active')
                .eq('code', code)
                .maybeSingle();

            if (error) throw error;

            if (session) {
                if (!session.is_active) {
                    showToast('This session has already ended.');
                    return;
                }
                window.location.href = `audience.html?code=${code}&name=${encodeURIComponent(name)}`;
            } else {
                showToast('Session not found. Check your code and try again.');
            }
        } catch (err) {
            console.error('Join Error:', err);
            showToast('Connection error. Please try again.');
        }
    });

    // ─── Toast Helper ───
    function showToast(message) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // ─── Scroll reveal for features ───
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.feature-card').forEach(card => {
        card.style.animationPlayState = 'paused';
        observer.observe(card);
    });
});

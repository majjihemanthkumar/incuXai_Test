// public/js/insforge-client.js — Mock Frontend Client
// This replaces the remote service during development to prevent "No backend services available" errors.

export const insforge = {
    realtime: {
        channel: (name) => ({
            on: () => { /* Mock listener registration */ return this; },
            subscribe: async () => {
                console.log(`✦ [MOCK] Subscribed to channel: ${name}`);
                return { success: true };
            },
            unsubscribe: async () => {
                console.log(`✦ [MOCK] Unsubscribed from channel: ${name}`);
                return { success: true };
            }
        })
    },
    database: {
        from: (table) => ({
            select: (columns) => ({
                eq: (column, value) => ({
                    maybeSingle: async () => {
                        console.log(`✦ [MOCK] SDK Query: ${table} select ${columns} eq ${column}=${value}`);
                        if (table === 'sessions' && column === 'code') {
                            try {
                                const res = await fetch(`/api/session/${value}`);
                                if (res.ok) {
                                    const data = await res.json();
                                    return { data, error: null };
                                }
                                return { data: null, error: null };
                            } catch (err) {
                                return { data: null, error: err };
                            }
                        }
                        return { data: null, error: null };
                    }
                })
            })
        })
    }
};

// Helper to handle standard InsForge response { data, error }
export async function handleResponse(promise) {
    const { data, error } = await promise;
    if (error) {
        console.error('InsForge Error:', error);
        throw error;
    }
    return data;
}

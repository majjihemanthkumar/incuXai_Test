// frontend/src/lib/insforge.ts
// @ts-ignore
const backendUrl = import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin;

export const insforge = {
    realtime: {
        channel: (name: string) => ({
            on: () => { /* Mock listener registration */ return insforge.realtime.channel(name); },
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
        from: (table: string) => ({
            select: (columns: string) => ({
                eq: (column: string, value: string | number) => ({
                    maybeSingle: async () => {
                        console.log(`✦ [MOCK] SDK Query: ${table} select ${columns} eq ${column}=${value}`);
                        if (table === 'sessions' && column === 'code') {
                            try {
                                const res = await fetch(`${backendUrl}/api/session/${value}`);
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

export async function handleResponse(promise: Promise<any>) {
    const { data, error } = await promise;
    if (error) {
        console.error('InsForge Error:', error);
        throw error;
    }
    return data;
}

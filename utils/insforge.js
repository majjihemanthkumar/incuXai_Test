// utils/insforge.js — Enhanced Mock Database
// This ensures the application remains functional with joins and complex queries.

const mockData = {
    sessions: [],
    participants: [],
    activities: [],
    responses: [],
    disqualifications: [],
    scores: []
};

const createMockBuilder = (table) => {
    let query = { table, eq: [], order: null, limit: null, select: '*' };

    const builder = {
        select: (fields) => { query.select = fields; return builder; },
        from: (t) => createMockBuilder(t),
        eq: (col, val) => { query.eq.push({ col, val }); return builder; },
        order: (col, { ascending }) => { query.order = { col, ascending }; return builder; },
        limit: (n) => { query.limit = n; return builder; },

        _getFilteredResults: () => {
            let results = [...(mockData[table] || [])].filter(item =>
                query.eq.every(filter => {
                    if (filter.is_in) return filter.vals.includes(item[filter.col]);
                    return item[filter.col] === filter.val;
                })
            );

            // Handle sorting
            if (query.order) {
                results.sort((a, b) => {
                    const valA = a[query.order.col];
                    const valB = b[query.order.col];
                    const direction = query.order.ascending ? 1 : -1;
                    return valA > valB ? direction : -direction;
                });
            }

            // Handle limit
            if (query.limit) results = results.slice(0, query.limit);

            // ─── Handle Joins (Manual) ───
            if (query.select && query.select.includes('activities(*)')) {
                results = results.map(item => ({
                    ...item,
                    activities: (mockData.activities || [])
                        .filter(a => a.session_id === item.id)
                        .sort((a, b) => (a.index || 0) - (b.index || 0))
                }));
            }

            return results;
        },

        maybeSingle: async () => {
            const results = builder._getFilteredResults();
            return { data: results[0] || null, error: null };
        },

        single: async () => {
            const results = builder._getFilteredResults();
            // PGRST116 is Supabase/InsForge "not found" error code
            return { data: results[0] || null, error: results[0] ? null : { code: 'PGRST116', message: 'Not found' } };
        },

        all: async () => {
            const results = builder._getFilteredResults();
            return { data: results, results, error: null };
        },

        insert: (rows) => {
            const newRows = (Array.isArray(rows) ? rows : [rows]).map(row => ({
                id: Math.random().toString(36).substr(2, 9),
                created_at: new Date().toISOString(),
                is_active: true,
                ...row
            }));
            mockData[table].push(...newRows);

            return {
                select: () => ({
                    single: async () => ({ data: newRows[0], error: null })
                })
            };
        },

        update: (updates) => {
            const results = builder._getFilteredResults();
            results.forEach(item => Object.assign(item, updates));

            return {
                eq: () => ({
                    select: () => ({
                        single: async () => ({ data: results[0], error: null })
                    })
                }),
                select: () => ({
                    single: async () => ({ data: results[0], error: null })
                })
            };
        },

        in: (col, vals) => {
            query.eq.push({ col, is_in: true, vals });
            return builder;
        }
    };
    return builder;
};

const insforge = {
    database: {
        from: (table) => createMockBuilder(table)
    }
};

module.exports = { insforge };

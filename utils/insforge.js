// utils/insforge.js — Mock Database for Local Development
// This ensures the application remains functional even without remote backend services.

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
        maybeSingle: async () => {
            const results = mockData[table].filter(item =>
                query.eq.every(filter => item[filter.col] === filter.val)
            );
            return { data: results[0] || null, error: null };
        },
        single: async () => {
            const results = mockData[table].filter(item =>
                query.eq.every(filter => item[filter.col] === filter.val)
            );
            return { data: results[0] || null, error: results[0] ? null : { code: 'PGRST116' } };
        },
        all: async () => {
            let results = [...mockData[table]].filter(item =>
                query.eq.every(filter => item[filter.col] === filter.val)
            );
            if (query.order) {
                results.sort((a, b) => {
                    const valA = a[query.order.col];
                    const valB = b[query.order.col];
                    return query.order.ascending ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
                });
            }
            if (query.limit) results = results.slice(0, query.limit);
            return { data: results, results, error: null };
        },
        insert: (rows) => {
            const newRows = rows.map(row => ({
                id: Math.random().toString(36).substr(2, 9),
                created_at: new Date(),
                is_active: true,
                total_score: 0,
                status: 'active',
                ...row
            }));
            mockData[table].push(...newRows);
            const resBuilder = {
                select: () => ({
                    single: async () => ({ data: newRows[0], error: null })
                })
            };
            return resBuilder;
        },
        update: (updates) => {
            const targets = mockData[table].filter(item =>
                query.eq.every(filter => item[filter.col] === filter.val)
            );
            targets.forEach(item => Object.assign(item, updates));
            return {
                eq: () => ({
                    select: () => ({
                        single: async () => ({ data: targets[0], error: null })
                    })
                }),
                select: () => ({
                    single: async () => ({ data: targets[0], error: null })
                })
            };
        },
        in: (col, vals) => {
            query.eq.push({ col, is_in: true, vals });
            // Simplified mock filter for 'in'
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

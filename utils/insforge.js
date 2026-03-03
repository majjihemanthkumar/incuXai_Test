const { createClient } = require('@insforge/sdk');

const insforge = createClient({
    baseUrl: 'https://49yrb5er.us-east.insforge.app',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NTA3MzN9.KRF_J2TGe4-HiKb2e9hlzraGVo60-wMM4q1NnSnC3QA'
});

module.exports = { insforge };

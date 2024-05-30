/** Database setup for BizTime. */

const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://localhost:5433/biztime'
});

client.connect();

module.exports = client;
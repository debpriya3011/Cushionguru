const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:Gurunewyork1313@cushion-saas.chkwesk4oxhc.eu-north-1.rds.amazonaws.com:5432/postgres'
});

async function seed() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Inserting SUPER_ADMIN user...');
        await client.query(
            `INSERT INTO \"User\" (id, email, password, role, status, \"firstName\", \"lastName\", \"createdAt\", \"updatedAt\") 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING`,
            [
                '123456789',
                'admin@test.com',
                '$2a$10$xabqxS7kGr8s58vlV.Zqk.PGhaJ6y1lGPCzca5YzL/cVUZGUONq5.',
                'SUPER_ADMIN',
                'ACTIVE',
                'deb',
                'deb'
            ]
        );

        console.log('Inserting Retailer...');
        await client.query(
            `INSERT INTO \"Retailer\" (id, \"businessName\", \"contactName\", email, status, \"createdAt\", \"updatedAt\") 
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
            [
                'cmm1xaig600fu2nvbpmta50oe',
                'Deb Retailer',
                'deb',
                'retailer@test.com',
                'ACTIVE'
            ]
        );

        console.log('Inserting RETAILER user...');
        await client.query(
            `INSERT INTO \"User\" (id, email, password, role, status, \"firstName\", \"lastName\", \"retailerId\", \"invitedById\", \"createdAt\", \"updatedAt\") 
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING`,
            [
                'admin1@test.com',
                '$2a$10$SIrl/asFDtuo7.BWacDwmOdK8EVtHebHV42wGfz.F7g4Gr0TibH0W',
                'RETAILER',
                'ACTIVE',
                'deb',
                'deb',
                'cmm1xaig600fu2nvbpmta50oe',
                '123456789'
            ]
        );

        await client.query('COMMIT');
        console.log('All inserts completed successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error inserting data:', err);
    } finally {
        client.release();
        pool.end();
    }
}

seed();

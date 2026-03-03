const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const r = await prisma.retailer.findFirst({ where: { labelFileUrl: { not: null } } });
    if (r && r.labelFileUrl) {
        console.log('header:', r.labelFileUrl.substring(0, 50));
        const base64 = r.labelFileUrl.split(',')[1];
        if (base64) {
            const buf = Buffer.from(base64, 'base64');
            console.log('first 10 bytes (hex):', buf.slice(0, 10).toString('hex'));
        } else {
            console.log('No base64 data found after split');
        }
    } else {
        console.log('no retailer with labelFileUrl found');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE favorites DROP CONSTRAINT IF EXISTS favorites_unique_user CASCADE;`)
        console.log('Constraint dropped successfully!')
    } catch (error) {
        console.error('Error dropping constraint:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()

import 'dotenv/config'
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg" // adaptador de prisma para postgreSQL

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

export default prisma
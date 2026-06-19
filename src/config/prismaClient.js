import 'dotenv/config'
import { PrismaClient } from "@prisma/client" // Es la herramienta principal de Prisma para hacer peticiones
import { PrismaPg } from "@prisma/adapter-pg" // adaptador de prisma para postgreSQL

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL })
const prisma = new PrismaClient({ adapter })

export default prisma
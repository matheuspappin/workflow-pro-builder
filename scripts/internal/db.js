import 'dotenv/config'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL não configurada. Verifique o arquivo .env')
}

const sql = postgres(connectionString)

export default sql
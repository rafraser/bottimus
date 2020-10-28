import mysql from 'mysql'

export const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'bottimus',
  timezone: 'UTC'
})

export async function queryHelper (queryString: string, args: any[]): Promise<any[]> {
  return new Promise((resolve, reject) => {
    pool.query(queryString, args, (err, results) => {
      if (err) {
        reject(err)
      } else {
        resolve(results)
      }
    })
  })
}

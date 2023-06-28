import { knex as KnexSetup, Knex } from 'knex'
import { env } from './env'

const connectionDatabase: Knex.StaticConnectionConfig | string =
  env.DATABASE_CONNECTION === 'pg'
    ? env.DATABASE_URL
    : {
        filename: env.DATABASE_URL,
      }

export const config: Knex.Config = {
  client: env.DATABASE_CONNECTION,
  connection: connectionDatabase,
  useNullAsDefault: true,
  migrations: {
    directory: './db/migrations',
    extension: 'ts',
  },
}
export const knex = KnexSetup(config)

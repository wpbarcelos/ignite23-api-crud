import { FastifyInstance } from 'fastify'
import crypto, { randomUUID } from 'node:crypto'
import { knex } from '../database'
import { z } from 'zod'
import { checkSessionIdMiddleware } from '../middlewares/check-sessionId-middleware'

export async function transactionRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [checkSessionIdMiddleware] }, async (request) => {
    const sessionId = request.cookies.sessionId

    const transactions = await knex('transactions')
      .where('session_id', sessionId)
      .select()

    return {
      transactions,
    }
  })

  app.get(
    '/:id',
    { preHandler: [checkSessionIdMiddleware] },
    async (request) => {
      const sessionId = request.cookies.sessionId

      const getTransactionParamSchema = z.object({
        id: z.string().uuid(),
      })
      const { id } = getTransactionParamSchema.parse(request.params)

      const transaction = await knex('transactions')
        .where({
          session_id: sessionId,
          id,
        })
        .first()
      return {
        transaction,
      }
    },
  )

  app.get(
    '/summary',
    { preHandler: [checkSessionIdMiddleware] },
    async (request) => {
      const sessionId = request.cookies.sessionId

      const summary = await knex('transactions')
        .sum('amount', { as: 'amount' })
        .where('session_id', sessionId)
        .first()

      return {
        summary,
      }
    },
  )

  app.post('/', async (request, reply) => {
    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()
      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })
    const { title, amount, type } = createTransactionBodySchema.parse(
      request.body,
    )

    await knex('transactions').insert({
      id: crypto.randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId,
    })

    return reply.status(201).send()
  })
}

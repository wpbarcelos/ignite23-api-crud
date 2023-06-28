import {
  expect,
  test,
  beforeAll,
  afterAll,
  describe,
  it,
  beforeEach,
} from 'vitest'
import { execSync } from 'node:child_process'
import supertest from 'supertest'
import { app } from '../src/app'

const server = supertest(app.server)

describe('Transactions routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex:refresh')
  })

  test('shoud be able to  create a new transaction', async () => {
    const responseStatusCode = 201

    await server
      .post('/transactions')
      .send({
        title: 'New Transaction',
        amount: 4500,
        type: 'credit',
      })
      .expect(responseStatusCode)
  })

  it('should be able to list all transactions', async () => {
    const createTransactionResponse = await server.post('/transactions').send({
      title: 'New Transaction',
      amount: 4500,
      type: 'credit',
    })
    const cookies = createTransactionResponse.get('Set-Cookie')

    const listTransactionResponse = await server
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    expect(listTransactionResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: 'New Transaction',
        amount: 4500,
      }),
    ])

    expect(cookies[0]).includes(
      listTransactionResponse.body.transactions[0].session_id,
    )
  })

  it('should be able to get  a specific transaction', async () => {
    const createTransactionResponse = await server.post('/transactions').send({
      title: 'New Transaction',
      amount: 4500,
      type: 'credit',
    })
    const cookies = createTransactionResponse.get('Set-Cookie')

    const listTransactionResponse = await server
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    const transaction = listTransactionResponse.body.transactions[0]
    const { id: transactionId } = transaction

    const getTransactionResponse = await server
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies)
      .expect(200)

    expect(getTransactionResponse.body.transaction).toEqual(transaction)
  })

  it.only('should be able to get summary', async () => {
    const createTransactionResponse = await server.post('/transactions').send({
      title: 'New Transaction',
      amount: 4500,
      type: 'credit',
    })
    const cookies = createTransactionResponse.get('Set-Cookie')

    await server.post('/transactions').set('Cookie', cookies).send({
      title: 'New Transaction',
      amount: 500,
      type: 'debit',
    })

    const listTransactionResponse = await server
      .get('/transactions/summary')
      .set('Cookie', cookies)
      .expect(200)

    expect(listTransactionResponse.body.summary).toEqual({
      amount: 4000,
    })
  })
})

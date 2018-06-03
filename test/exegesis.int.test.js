const Koa = require('koa')
const path = require('path')
const supertest = require('supertest')
const createMiddleware = require('../')

async function sessionAuthenticator (context) {
  const session = context.req.headers.session

  if (!session || typeof (session) !== 'string') {
    return undefined
  }

  if (session !== 'secret') {
    throw context.makeError(403, 'Invalid session.')
  }

  return {
    type: 'success',
    user: { name: 'jmortemore' },
    roles: [ 'readWrite', 'admin' ]
  }
}

async function createServer () {
  const options = {
    controllers: path.resolve(__dirname, './app/controllers'),
    authenticators: {
      sessionKey: sessionAuthenticator
    },
    controllersPattern: '**/*.js'
  }

  const exegesisMiddleware = await createMiddleware(
    path.resolve(__dirname, './app/openapi.yaml'),
    options
  )

  const app = new Koa()

  app.use(async (ctx, next) => {
    try {
      await next()
    } catch (err) {
      ctx.status = 500
      ctx.body = `Internal error: ${err.message}`
    }
  })
  app.use(exegesisMiddleware)
  app.use(async (ctx) => {
    if (ctx.status === 404) {
      ctx.status = 404
    }
  })

  return app.listen()
}

describe('integration', function () {
  beforeEach(async function () {
    this.server = await createServer()
    this.request = supertest(this.server)
  })

  afterEach(async function () {
    this.server.close()
  })

  it('should succesfully call an API', function () {
    return this.request
      .get('/greet?name=Jason')
      .expect('Content-Type', 'application/json')
      .expect(200, { greeting: 'Hello, Jason!' })
  })

  it('should return an error for missing parameters', async function () {
    return this.request
      .get('/greet')
      .expect('Content-Type', 'application/json')
      .expect(400, {
        message: 'Validation errors',
        errors: [{
          message: 'Missing required query parameter "name"',
          location: {
            docPath: '/paths/~1greet/get/parameters/0',
            in: 'query',
            name: 'name',
            path: ''
          }
        }]
      })
  })

  it('should require authentication from an authenticator', async function () {
    return this.request
      .get('/secure')
      .expect(401, {
        message: 'Must authenticate using one of the following schemes: sessionKey.'
      })
  })

  it('should return an error from an authenticator', async function () {
    return this.request
      .get('/secure')
      .set('session', 'wrong')
      .expect(403, { message: 'Invalid session.' })
  })

  it('should authenticate correctly', async function () {
    return this.request
      .get('/secure')
      .set('session', 'secret')
      .expect(200, {
        sessionKey: {
          type: 'success',
          user: { name: 'jmortemore' },
          roles: ['readWrite', 'admin']
        }
      })
  })

  it('should 404', async function () {
    return this.request
      .get('/asd')
      .expect(404)
  })

  it('should 500', async function () {
    return this.request
      .get('/error')
      .expect(500, 'Internal error: Test')
  })
})

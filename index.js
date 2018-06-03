const { compileApi } = require('exegesis')

module.exports = async (openApiDoc, options) => {
  const middleware = await compileApi(openApiDoc, options)

  return async (ctx, next) => {
    return new Promise((resolve, reject) => {
      middleware(ctx.req, ctx.res, err => {
        if (err) reject(err)

        resolve(next())
      })
    })
  }
}

# exegesis-koa

[![Build Status](https://api.travis-ci.org/confuser/exegesis-koa.svg?branch=master)](https://travis-ci.org/confuser/exegesis-koa)
[![Coverage Status](https://coveralls.io/repos/github/confuser/exegesis-koa/badge.svg?branch=master)](https://coveralls.io/github/confuser/exegesis-koa?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/confuser/exegesis-koa/badge.svg?targetFile=package.json)](https://snyk.io/test/github/confuser/exegesis-koa?targetFile=package.json)

> ## *exegesis*
>
> *n.* An explanation or critical interpretation of a text, especially an
> API definition document.
>
> -- No dictionary ever

This library implements a Koa middleware for
[OpenAPI 3.x](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.1.md#requestBodyObject).

##
```
npm install exegesis-koa
```

## Tutorial

Check out the tutorial [here](https://github.com/exegesis-js/exegesis/blob/master/docs/Tutorial.md).

## Usage
```js
const Koa = require('koa')
const path = require('path')
const exegesisKoa = require('exegesis-koa')

async function createServer() {
    // See https://github.com/exegesis-js/exegesis/blob/master/docs/Options.md
    const options = {
        controllers: path.resolve(__dirname, './controllers')
    }
    const exegesisMiddleware = exegesisKoa(path.resolve(__dirname, './openapi.yaml'), options)

    const app = new Koa()

    // If you have any body parsers, this should go before them.
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

    app.listen()
}
```

Calling `exegesiskoa(openApiFile, options)` will return a Promise
which resolves to a koa middleware.

`openApiFile` is either a path to your openapi.yaml or openapi.json file,
or it can be a JSON object with the contents of your OpenAPI document.  This
should have the [`x-exegesis-controller`](https://github.com/exegesis-js/exegesis/blob/master/docs/OAS3%20Specification%20Extensions.md)
extension defined on any paths you want to be able to access.

`options` can be [anything you can pass to exegesis](https://github.com/exegesis-js/exegesis/blob/master/docs/Options.md).  At a
minimum, you'll probably want to provide `options.controllers`, a path to where
your [controller modules](https://github.com/exegesis-js/exegesis/blob/master/docs/Exegesis%20Controllers.md)
can be found.  If you have any security requirements defined, you'll also
want to pass in some [authenticators](https://github.com/exegesis-js/exegesis/blob/master/docs/OAS3%20Security.md).
To enable response validation, you'll want to provide a validation callback
function via [`onResponseValidationError()`](https://github.com/exegesis-js/exegesis/blob/master/docs/Options.md#onresponsevalidationerror).
Exegesis's functionality can also be extended using [plugins](https://github.com/exegesis-js/exegesis/tree/master/docs),
which run on every request.  Plugins let you add functionality like
[role base authorization](https://github.com/exegesis-js/exegesis-plugin-roles),
or CORS.

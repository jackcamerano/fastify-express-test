'use strict'

const Fastify = require('fastify')
const express = require('express')

class CredoError extends Error {
  constructor(message) {
    super(message)
    this.name = 'CredoError'
  }
}

async function build() {
  const fastify = Fastify({ logger: true })
  await fastify.register(require('@fastify/express'))

  const expressApp = express()

  expressApp.get('/foo', (req, res, next) => {
    console.log('[express] /foo handler invoked, forwarding error to next()')
    const error = new Error('Simulated error in /foo route')
    next(error)
  })

  expressApp.use((error, req, res, next) => {
    console.log('[express] middleware #1 reached, error:', error.message)
    const additionalParams = { error_description: error.message }
    console.log('[express] middleware #1 sending 500 JSON response')
    res.status(500).json({
      error: 'server_error',
      ...additionalParams
    })
    const throwError =
      error instanceof Error
        ? error
        : new CredoError('Unknown error in openid4vc error response handler')
    console.log(
      '[express] middleware #1 calling next(throwError):',
      throwError.message
    )
    next(throwError)
  })

  expressApp.use((error, req, res, next) => {
    console.log('[express] middleware #2 reached, error:', error.message)
    console.log('[express] middleware #2 res.headersSent =', res.headersSent)
    if (!res.headersSent) {
      console.log('[express] middleware #2 sending fallback 500 JSON response')
      res.status(500).json({
        error: 'server_error',
        error_description: 'An unexpected error occurred on the server.'
      })
    } else {
      console.log(
        '[express] middleware #2 skipping response, headers already sent'
      )
    }
  })

  fastify.use(expressApp)

  fastify.addHook('onSend', async (request, reply, payload) => {
    console.log('[fastify] using onSend')
    return payload
  })

  return fastify
}

build()
  .then(fastify => fastify.listen({ port: 3001 }))
  .catch(console.log)

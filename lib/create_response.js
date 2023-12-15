const { IncomingHttpHeaders, IncomingMessage } = require('http')

/**
 * Creates a Fetch API `Response` instance from the given
 * `http.IncomingMessage` instance.
 * copied from: https://github.com/mswjs/interceptors/blob/04152ed914f8041272b6e92ed374216b8177e1b2/src/interceptors/ClientRequest/utils/createResponse.ts#L8
 * TODO: maybe MSW can export this? so no duplicate code
 */

/**
 * Response status codes for responses that cannot have body.
 * @see https://fetch.spec.whatwg.org/#statuses
 */
const responseStatusCodesWithoutBody = [204, 205, 304]

/**
 * @param {IncomingMessage} message 
 */
function createResponse(message) {
  const responseBodyOrNull = responseStatusCodesWithoutBody.includes(
    message.statusCode || 200
  )
    ? null
    : new ReadableStream({
        start(controller) {
          message.on('data', (chunk) => controller.enqueue(chunk))
          message.on('end', () => controller.close())

          /**
           * @todo Should also listen to the "error" on the message
           * and forward it to the controller. Otherwise the stream
           * will pend indefinitely.
           */
        },
      })

  return new Response(responseBodyOrNull, {
    status: message.statusCode,
    statusText: message.statusMessage,
    headers: createHeadersFromIncomingHttpHeaders(message.headers),
  })
}

/**
 * @param {IncomingHttpHeaders} httpHeaders 
 */
function createHeadersFromIncomingHttpHeaders(httpHeaders) {
  const headers = new Headers()

  for (const headerName in httpHeaders) {
    const headerValues = httpHeaders[headerName]

    if (typeof headerValues === 'undefined') {
      continue
    }

    if (Array.isArray(headerValues)) {
      headerValues.forEach((headerValue) => {
        headers.append(headerName, headerValue)
      })

      continue
    }

    headers.set(headerName, headerValues)
  }

  return headers
}

module.exports = { createResponse }
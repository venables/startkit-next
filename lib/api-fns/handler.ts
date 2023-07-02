import { nanoid } from "nanoid/async"

import { logger } from "@/lib/logger"

import { buildErrorResponse } from "./errors/error-response"

import type { ApiResponse, NextRouteContext, NextRouteHandler } from "./types"
import type { NextResponse } from "next/server"

/**
 * Wrap an API handler with additional logging, error handling, etc.
 *
 * @example
 *
 *   type ResponseData = { name: string }
 *   type Context = NextRouteContext<{ id: string }>
 *
 *   export const GET = handler<ResponseData, Context>((req, context) => {
 *      if (!context.params.userId) {
 *        unauthorized()
 *      }
 *
 *      if (!req.query.name) {
 *        validationError("name is required")
 *      }
 *
 *      return NextResponse.json({ name: request.query.name })
 *   })
 *
 * @param handler the api handler
 * @returns a wrapped api handler
 */
export const handler = <T = void, U = NextRouteContext>(
  routeHandler: NextRouteHandler<ApiResponse<T>, U>
): NextRouteHandler<ApiResponse<T>, U> => {
  const startTime = new Date()

  return async (request, context) => {
    const requestId = await nanoid()
    const method = request.method
    const url = request.nextUrl.pathname

    /**
     * Log the HTTP request
     */
    logger.info(`➡️  [${requestId}] ${method} ${url} ...`)

    let response: NextResponse<ApiResponse<T>>

    try {
      response = await routeHandler(request, context)
    } catch (err) {
      response = buildErrorResponse(err)
    }

    const responseTime = new Date().getTime() - startTime.getTime()

    /**
     * Log the HTTP response status
     */
    logger.info(
      `⬅️  [${requestId}] ${method} ${url} (${response.status}) took ${responseTime}ms`
    )

    response.headers.set("x-request-id", requestId)
    response.headers.set("x-response-time", responseTime.toString())
    return response
  }
}

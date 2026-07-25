import handler from '@tanstack/react-start/server-entry'
import { paraglideMiddleware } from './i18n/paraglide/server'

const middleware = {
  fetch(req: Request): Promise<Response> {
    return paraglideMiddleware(req, () => handler.fetch(req))
  }
}

export default middleware

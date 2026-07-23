import type { FileRoutesByTo } from '@/routeTree.gen'
import type { Locale } from './paraglide/runtime'

type RoutePath = keyof FileRoutesByTo

export const excludedPaths = ['admin', 'docs', 'api'] as const

type PublicRoutePath = Exclude<RoutePath, `${string}${(typeof excludedPaths)[number]}${string}`>

type TranslatedPathname = {
  pattern: string
  localized: Array<[Locale, string]>
}

function toUrlPattern(path: string) {
  return (
    path
      // catch-all
      .replace(/\/\$$/, '/:path(.*)?')
      // optional parameters: {-$param}
      .replace(/\{-\$([a-zA-Z0-9_]+)\}/g, ':$1?')
      // named parameters: $param
      .replace(/\$([a-zA-Z0-9_]+)/g, ':$1')
      // remove trailing slash
      .replace(/\/+$/, '')
  )
}

function createTranslatedPathnames(
  input: Record<PublicRoutePath, Record<Locale, string>>
): TranslatedPathname[] {
  return Object.entries(input).map(([pattern, locales]) => ({
    pattern: toUrlPattern(pattern),
    localized: Object.entries(locales).map(
      ([locale, path]) =>
        [locale as Locale, `/${locale}${toUrlPattern(path)}`] satisfies [Locale, string]
    )
  }))
}

// Values are the base (unprefixed) translated path — createTranslatedPathnames
// prepends the /{locale} segment. See docs/reference/i18n.md
export const translatedPathnames = createTranslatedPathnames({
  '/': {
    en: '/',
    fr: '/'
  },
  '/login': {
    en: '/login',
    fr: '/login'
  },
  '/app': {
    en: '/app',
    fr: '/app'
  }
})

import { ParsedUrlQuery } from 'querystring';
import { format as formatUrl, parse as parseUrl, UrlObject } from 'url';

export interface URLMeaningfulParts {
  auth: string | null;
  hash: string | null;
  hostname: string | null;
  pathname: string | null;
  protocol: string | null;
  slashes: boolean | null;
  port: string | null;
  query: ParsedUrlQuery | {};
}

/**
 *  Takes a URL and a function that takes the meaningful parts
 *  of the URL as a key-value object, modifies some or all of
 *  the parts, and returns the modified parts formatted again
 *  as a url.
 *
 *  Url Parts sent:
 *    - protocol
 *    - slashes (does the url have the //)
 *    - auth
 *    - hostname (just the name of the host, no port or auth information)
 *    - port
 *    - pathname (the path after the hostname, no query or hash, starts
 *        with a slash if there was a path)
 *    - query (always an object, even when no query on original url)
 *    - hash
 *
 *  Why?
 *    - The default url library in node produces several conflicting
 *      properties on the "parsed" output. Modifying any of these might
 *      lead to the modifications being ignored (depending on which
 *      property was modified)
 *    - It's not always clear whether to use path/pathname, host/hostname,
 *      so this tries to add helpful constraints
 *
 *  @param url The string url to parse.
 *  @param urlModifier A function that will modify the parsed url, or return a new one.
 *  @returns The modified and reformatted url
 */
export function modifyUrl(
  url: string,
  urlModifier: (
    urlParts: URLMeaningfulParts
  ) => Partial<URLMeaningfulParts> | undefined
) {
  const parsed = parseUrl(url, true) as URLMeaningfulParts;

  // Copy over the most specific version of each property. By default, the parsed url includes several
  // conflicting properties (like path and pathname + search, or search and query) and keeping track
  // of which property is actually used when they are formatted is harder than necessary.
  const meaningfulParts: URLMeaningfulParts = {
    protocol: parsed.protocol,
    slashes: parsed.slashes,
    auth: parsed.auth,
    hostname: parsed.hostname,
    port: parsed.port,
    pathname: parsed.pathname,
    query: parsed.query || {},
    hash: parsed.hash,
  };

  // The urlModifier modifies the meaningfulParts object, or returns a new one.
  const modifiedParts = urlModifier(meaningfulParts) || meaningfulParts;

  // Format the modified/replaced meaningfulParts back into a url.
  return formatUrl({
    protocol: modifiedParts.protocol,
    slashes: modifiedParts.slashes,
    auth: modifiedParts.auth,
    hostname: modifiedParts.hostname,
    port: modifiedParts.port,
    pathname: modifiedParts.pathname,
    query: modifiedParts.query,
    hash: modifiedParts.hash,
  } as UrlObject);
}
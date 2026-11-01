// Redirect any *.pages.dev hostname (production alias and preview branches)
// to the canonical domain so only stratforcapital.com is indexed.
const CANONICAL_HOST = "stratforcapital.com";

export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname.endsWith(".pages.dev")) {
    url.protocol = "https:";
    url.hostname = CANONICAL_HOST;
    url.port = "";
    return Response.redirect(url.toString(), 301);
  }
  return context.next();
}

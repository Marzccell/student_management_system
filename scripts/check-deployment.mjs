const target = process.argv[2]
if (!target)
  throw new Error('Usage: node scripts/check-deployment.mjs <deployment URL>')
const url = new URL(target)
if (url.protocol !== 'https:') throw new Error('Use the HTTPS deployment URL.')
const response = await fetch(url, { signal: AbortSignal.timeout(20000) })
const html = await response.text()
const assets = [
  ...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+\.(?:js|css))"/g),
].map((match) => match[1])
console.log(
  JSON.stringify(
    {
      status: response.status,
      url: response.url,
      title: html.match(/<title>(.*?)<\/title>/)?.[1],
      assets,
    },
    null,
    2
  )
)
if (!response.ok) process.exitCode = 1
for (const asset of assets.filter((path) => path.endsWith('.js'))) {
  const source = await fetch(new URL(asset, url), {
    signal: AbortSignal.timeout(20000),
  }).then((r) => r.text())
  console.log(
    JSON.stringify({
      asset,
      projectFeature: /ProjectsPage|\/projects/.test(source),
      supabaseHost:
        source.match(/https:\/\/([a-z0-9]+\.supabase\.co)/)?.[1] || null,
    })
  )
}

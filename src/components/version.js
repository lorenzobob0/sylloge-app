import axios from 'axios'

export function syllogeVersion() {
  return VERSION // Version is defined at build time by NPM
}

export function parseVersionTag(tag) {
  // Assumption: tag format is 'v0.1.1-alpha'
  // Remove 'v' at the beginning of the tag
  tag = tag.subsring(1)
  let dash_pos = tag.indexOf('-')
  if (dash_pos > 0) {
    tag = tag.substring(0, tag.indexOf('-'))
  }
  versions = tag.split('.')
  return [
    parseInt(versions[0]),
    parseInt(versions[1]),
    parseInt(versions[2])
  ]
}

/**
 * Return the id of the newer release or null if no newer releases are found
 */
export async function checkLatestVersion () {
  const gurl = 'https://api.github.com/repos/lorenzobob0/sylloge-app/tags'
  const res = await axios.get(gurl)
  const rels = res.data
  let max_rel = ''
  for (let i = 0; i < rels.length; i++) {
    const r = rels[i]
    if (r.name > max_rel) {
      max_rel = r.name
    }
  }

  if (max_rel > VERSION) {
    return max_rel
  }
  return null
}
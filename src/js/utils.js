export function displayLabelValue(value, options = [], defaultValue = null) {
  let displayValue = defaultValue
  options.forEach((item) => {
    if (item.value === value) displayValue = item.label
  })
  return displayValue
}

export function getErrorMessage(response, data) {
  return (data && data.title) || response.status + ': ' + response.statusText
}

export const requestOptions = {
  method: 'GET',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Pragma: 'no-cache',
    'User-Agent': 'imbi-ui'
  },
  init: { credentials: 'include' }
}

export function httpGet(fetchMethod, path, onSuccess, onError) {
  httpRequest(fetchMethod, path, requestOptions).then(
    ({ data, success, status, headers }) => {
      success
        ? onSuccess({ data, status, headers })
        : onError({ message: data, status, headers })
    }
  )
}

export function httpDelete(fetchMethod, path, body) {
  const options = {
    ...requestOptions,
    method: 'DELETE'
  }
  if (body) {
    options.body = JSON.stringify(body)
  }
  return httpRequest(fetchMethod, path, options)
}

export function httpPatch(fetchMethod, path, body) {
  return httpRequest(fetchMethod, path, {
    ...requestOptions,
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: {
      ...requestOptions.headers,
      'Content-Type': 'application/json-patch+json'
    }
  })
}

export function httpPost(fetchMethod, path, body, options = {}) {
  return httpRequest(fetchMethod, path, {
    ...requestOptions,
    method: 'POST',
    body: JSON.stringify(body),
    ...options
  })
}

export async function httpRequest(fetchMethod, path, options = requestOptions) {
  const response = await fetchMethod(path, options)
  const text = await response.text()
  const data = text && JSON.parse(text)
  if (response.status >= 200 && response.status < 300)
    return {
      success: true,
      data: data,
      status: response.status,
      headers: response.headers
    }
  return {
    success: false,
    data: getErrorMessage(response, data),
    status: response.status,
    headers: response.headers,
    responseBody: data
  }
}

export function fetchPages(path, { fetch, baseURL }, onDataReceived, onError) {
  const localFetch = (resource) => {
    httpGet(fetch, new URL(resource, baseURL), onSuccess, onError)
  }
  const onSuccess = ({ data, headers }) => {
    const links = parseLinkHeader(headers.get('Link'))
    const nextLink = Object.hasOwn(links, 'next') ? links.next[0] : null
    onDataReceived(data, nextLink === null)
    if (nextLink !== null) {
      setTimeout(localFetch, 25, nextLink)
    }
  }
  localFetch(path)
}

export function isFunction(func) {
  return func && {}.toString.call(func) === '[object Function]'
}

const urlRegexp =
  /^(?:\w{3,32}:\/\/)(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/

export function isURL(value) {
  return urlRegexp.test(value)
}

const linkGroup = /<([\w\-.~!*'();:@&=+$,/?%#[\]]+)>;\s*rel="+([A-z]+)"+/

export function parseLinkHeader(header) {
  const linkCount = (header.match(/</g) || []).length
  const groups = []
  for (let i = 0; i < linkCount; i++) groups.push(linkGroup.source)
  const regex = new RegExp(groups.join(/\s*,\s*/.source))
  const match = header.match(regex)
  const links = {}
  if (match) {
    for (let i = 1; i < match.length; i = i + 2) {
      const link = match[i]
      const rel = match[i + 1]
      if (!Object.hasOwn(links, rel)) links[rel] = []
      links[rel].push(link)
    }
  }
  return links
}

export function lookupNamespaceByID(namespaces, namespace_id) {
  return namespaces.find((e) => e.id === namespace_id)
}

export function setDocumentTitle(value) {
  document.title = `${value} - Imbi`
}

export function ISO8601ToDatetimeLocal(isoDate) {
  if (!isoDate) return isoDate
  const msOffset = new Date().getTimezoneOffset() * 60 * 1000
  return new Date(new Date(isoDate).getTime() - msOffset)
    .toISOString()
    .slice(0, -1)
}

/**
 * Transform snake_case strings to camelCase
 * @param s
 * @returns {string}
 */
export function camelCase(s) {
  return s
    .toLowerCase()
    .replace(/(_[a-z])/g, (group) => group.toUpperCase().replace('_', ''))
}

/**
 * Create a function suitable for use with Array.sort
 *
 * The function will sort objects into the selected `direction` using `column` as the sort key
 *
 * @param column name of the property to sort rows by
 * @param direction 'asc' or 'desc'
 * @returns {function(a:number, b:number): number}
 */
export function createSingleColumnSorter(column, direction) {
  return (a, b) => {
    if (a[column] === null || a[column] < b[column])
      return direction === 'asc' ? -1 : 1
    if (b[column] === null || b[column] < a[column])
      return direction === 'asc' ? 1 : -1
    return 0
  }
}

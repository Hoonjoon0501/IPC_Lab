// Shared helper in Code.gs. Replace the existing definition; do not add a duplicate.
function cellImage_(value, description, title) {
  if (!value || value.valueType !== SpreadsheetApp.ValueType.IMAGE) return null;
  try {
    const src = value.getContentUrl();
    if (typeof src !== 'string' || !src.startsWith('https://')) return null;
    const options = {muteHttpExceptions: true};
    if (/^https:\/\/(?:docs\.google\.com|(?:[a-z0-9-]+\.)*googleusercontent\.com)\//i.test(src)) {
      options.headers = {Authorization: 'Bearer ' + ScriptApp.getOAuthToken()};
    }
    const response = UrlFetchApp.fetch(src, options);
    if (response.getResponseCode() !== 200) {
      console.warn('A cell image request failed with HTTP ' + response.getResponseCode());
      return null;
    }
    const mime = response.getBlob().getContentType().split(';')[0].toLowerCase();
    if (!['image/png','image/jpeg','image/gif','image/webp'].includes(mime)) {
      console.warn('A cell image returned an unsupported content type: ' + mime);
      return null;
    }
    const bytes = response.getContent();
    if (bytes.length > 5 * 1024 * 1024) {
      console.warn('A news image exceeds 5 MB; use a smaller image.');
      return null;
    }
    return {src: 'data:' + mime + ';base64,' + Utilities.base64Encode(bytes), alt: text_(description) || text_(value.getAltTextDescription()) || text_(value.getAltTextTitle()) || title};
  } catch (error) {
    console.warn('A news image could not be read: ' + error.message);
    return null;
  }
}

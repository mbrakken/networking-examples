export function $(id) {
  return document.getElementById(id);
}

export function xhrPromise(url, options = {}) {
  if (!url) {
    return Promise.reject(new Error('No URL provided'));
  }

  const { method = 'GET', body, headers } = options;

  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function (event) {
      if (xhr.readyState === 4) {
        resolve({ xhr, event });
      }
    };

    xhr.onerror = function (error) {
      reject({ error, xhr });
    };

    xhr.open(method, url);

    if (Array.isArray(headers)) {
      for (let i = 0; i < headers.length; i += 2) {
        xhr.setRequestHeader(headers[i], headers[i + 1]);
      }
    } else if (typeof headers === 'object') {
      Object.keys(headers).forEach((header) => {
        xhr.setRequestHeader(header, headers[header]);
      });
    }

    xhr.send(body);
  });
}

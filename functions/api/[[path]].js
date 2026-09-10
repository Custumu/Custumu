export async function onRequest(context) {
  const url = new URL(context.request.url);
  const backendUrl = `http://18.116.130.74:5000${url.pathname}${url.search}`;

  const headers = new Headers(context.request.headers);
  headers.set('Host', '18.116.130.74:5000');

  const options = {
    method: context.request.method,
    headers,
  };

  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    options.body = context.request.body;
    options.duplex = 'half';
  }

  try {
    const response = await fetch(backendUrl, options);
    return new Response(response.body, response);
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Failed to connect to backend', message: err.message }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

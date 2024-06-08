import http from 'http';
import yourFunction from './main.js'; // Adjust this path based on your file structure

const server = http.createServer(async (req, res) => {
  const log = console.log;

  // Simulated request object
  const simulatedRequest = {
    path: '/app',
    headers: {
      'user-agent': 'Mozilla/5.0 (Linux; Android 10; SM-G970F Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/78.0.3904.108 Mobile Safari/537.36',
    },
  };

  // Simulated response object
  const simulatedResponse = {
    redirect: (url) => {
      res.writeHead(302, { Location: url });
      res.end();
      log(`Redirected to: ${url}`);
    },
    send: (html, statusCode, headers) => {
      res.writeHead(statusCode, headers);
      res.end(html);
      log(`Sent HTML with status ${statusCode}`);
    },
    empty: () => {
      res.writeHead(204);
      res.end();
      log('Empty response sent');
    },
  };

  try {
    await yourFunction({ req: simulatedRequest, res: simulatedResponse, log });
  } catch (error) {
    log('Error:', error.message);
    res.writeHead(500);
    res.end(error.message);
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});

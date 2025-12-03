const http = require('http');

const data = JSON.stringify({
  text: '你好',
  sourceLanguage: 'zh',
  targetLanguage: 'en',
  mode: 'professional'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/instant-translation',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('测试中文到英文翻译...\n');

const req = http.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('响应状态:', res.statusCode);
    console.log('响应头:', res.headers);
    console.log('响应内容:', responseData);
  });
});

req.on('error', (error) => {
  console.error('请求错误:', error);
});

req.write(data);
req.end();

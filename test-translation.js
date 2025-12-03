const http = require('http');

const testTranslation = (text, sourceLang, targetLang) => {
  const data = JSON.stringify({
    text: text,
    sourceLanguage: sourceLang,
    targetLanguage: targetLang,
    mode: 'professional',
    provider: 'gemini'
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

  console.log(`\n测试翻译：${text}`);
  console.log(`从 ${sourceLang} 到 ${targetLang}`);
  console.log('发送请求...\n');

  const req = http.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      console.log('响应状态:', res.statusCode);
      console.log('响应内容:');
      try {
        const result = JSON.parse(responseData);
        console.log(JSON.stringify(result, null, 2));
      } catch (e) {
        console.log(responseData);
      }
      console.log('\n' + '='.repeat(60));
    });
  });

  req.on('error', (error) => {
    console.error('请求错误:', error);
  });

  req.write(data);
  req.end();
};

// 测试案例
setTimeout(() => testTranslation('hello', 'en', 'zh'), 500);
setTimeout(() => testTranslation('你好', 'zh', 'en'), 1500);
setTimeout(() => testTranslation('AWS Lambda', 'en', 'zh'), 2500);
setTimeout(() => testTranslation('Text-to-Speech', 'en', 'zh'), 3500);

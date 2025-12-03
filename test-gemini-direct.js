const axios = require('axios');

const API_KEY = 'AIzaSyBic-XEo_bjEXvA7EQX-KPy71ZbQiBS3sQ';

async function testGemini() {
  try {
    console.log('Testing Gemini API directly...');
    console.log('API Key:', API_KEY.substring(0, 10) + '...');

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: 'Translate the following text from English to Chinese: hello',
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
        },
      }
    );

    console.log('\n✅ Gemini API 调用成功！');
    console.log('\n翻译结果:');
    console.log(response.data.candidates[0].content.parts[0].text);

  } catch (error) {
    console.error('\n❌ Gemini API 调用失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('错误:', error.message);
    }
  }
}

testGemini();

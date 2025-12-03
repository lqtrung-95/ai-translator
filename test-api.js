async function testTranslation() {
  try {
    console.log('Testing translation API...');
    const response = await fetch('http://localhost:3001/api/instant-translation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: 'Text-to-Speech',
        mode: 'professional',
        provider: 'gemini'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Success!');
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testTranslation();
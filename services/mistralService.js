async function askMistral(message) {
  const response = await fetch(process.env.MISTRAL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.MISTRAL_MODEL || 'mistral-small-latest',
      messages: [
        {
          role: 'system',
          content: 'You are Juray IA, a professional assistant. Reply clearly and helpfully.'
        },
        {
          role: 'user',
          content: message
        }
      ]
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Mistral error:', data);
    throw new Error(data.message || 'Mistral request failed');
  }

  return data.choices?.[0]?.message?.content || 'No response available.';
}

module.exports = { askMistral };
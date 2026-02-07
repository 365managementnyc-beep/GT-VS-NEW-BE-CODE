// Mimic frontend login behavior
(async () => {
  try {
    const response = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'Admin@12345'
      })
    });

    console.log('Network Status:', response.status);
    console.log('Response Headers:', {
      contentType: response.headers.get('content-type'),
      cors: response.headers.get('access-control-allow-origin')
    });

    const data = await response.json();
    console.log('Response Body:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ LOGIN SUCCESS');
      console.log('Token:', data.token.substring(0, 50) + '...');
      console.log('User:', data.data?.email);
    } else {
      console.log('\n❌ LOGIN FAILED');
      console.log('Error:', data.message);
    }
  } catch (error) {
    console.error('Fetch Error:', error.message);
  }
})();

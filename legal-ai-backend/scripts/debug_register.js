
const userData = {
    username: 'testdebuguser_' + Date.now(),
    email: 'testdebug_' + Date.now() + '@example.com',
    password: 'password123',
    mobile: '9999999' + Math.floor(Math.random() * 1000),
    whatsapp: '9999999' + Math.floor(Math.random() * 1000),
    profession: 'individual',
    termsAgreed: 'true' // sending as string since that's what equals('true') check usually implies, or I can try boolean
};

console.log("Sending Request to /api/auth/register with data:", userData);

fetch('http://127.0.0.1:3000/api/auth/register', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
})
    .then(async res => {
        console.log("Status Code:", res.status);
        const text = await res.text();
        console.log("Response Body:", text);
    })
    .catch(err => {
        console.error("Fetch Error:", err);
    });

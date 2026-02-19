(async()=>{
  try{
    const res = await fetch('http://127.0.0.1:5000/api/auth/login',{
      method:'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({email:'admin@example.com', password:'Admin@12345'})
    });
    const text = await res.text();
    console.log('STATUS', res.status);
    console.log(text);
  }catch(err){
    console.error('ERR', err);
  }
})();

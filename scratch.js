const https = require('https');

https.get('https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyC0o-x50oHZ2B2bPJ4GOtIq4-oRmljMbSo', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => { 
      const models = JSON.parse(data).models;
      models.forEach(m => {
          console.log(m.name, " - ", m.supportedGenerationMethods?.join(", "));
      });
  });
}).on('error', (e) => {
  console.error(e);
});

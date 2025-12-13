const express = require('express');
// const fs =require('fs');
// const https = require('https');
// const http = require('http');
const app = express();
module.exports = app;  
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');




//Middleware
app.use('/.well-known/acme-challenge', express.static('/var/www/funkthetown/.well-known/acme-challenge'));

app.use(express.static(__dirname +'/'));

// parse application/x-www-form-urlencoded
 app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
 app.use(bodyParser.json())


 app.use(cors())

// demo

      //   const host = '0.0.0.0';
      //   const port = process.env.PORT || 3000;

      //  app.listen(port, host, function(){

      //      console.log("Server started");
      //      });



    //Live


    //  const httpServer = http.createServer((req,res)=>{
    //   res.writeHead(301,{Location:`https://${req.headers.host}${req.url}`});
    //     res.end();
    // }).listen(3000);

    //    const httpsServer = https.createServer({
    //     key: fs.readFileSync('/etc/ssl/private/_.funkthetown.net_private_key (1).key'),
    //     cert: fs.readFileSync('/etc/ssl/certs/funkthetown.net_ssl_certificate.cer'),
       
       
    //  }, app).listen(3000);


    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Serveur Node.js démarré sur le port ${port}`);
    });


const userRoutes = require('./routes/user');


require('dotenv').config();

// const atlasUser = process.env.ATLAS_USER
// const atlasPassword = process.env.ATLAS_PASSWORD

mongoose.connect(`mongodb+srv://hao:shangai2025@funkthetowncluster.bups6.mongodb.net/Funkthetowndb`,
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));



  app.use('/', userRoutes);
  

  

 


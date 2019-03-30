/*
  Referencias:
  https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start

  Requerimientos:
    npm install express --save
    npm install request --save
*/

'use strict'

//Importamos dependecias y agregamos e importamos dependecias
const request    = require('request'),
      express    = require('express'),
      bodyParser = require('body-parser'),
      app        = express().use(bodyParser.json());

const PAGE_ACCESS_TOKEN = "Tu token";

//Asigna un puerto al servidor y registra un mensaje en la consola en caso de exito
app.listen(process.env.PORT || 80, () => console.log('El webhook esta escuchando'));

app.get('/webhook', function(req, res) {

  /** CONST PARA VERIFICACION DE TOKEN **/
  const VERIFY_TOKEN = "Tu token otra vez";

  // Parametros de la solicitud de verificación de webhook
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // Comprueba si se enviado un token y un mode
  if (mode && token) {

    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {

      // Respuesta 200 exitosa
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);

    } else {
      // Respuesta '403 Forbidden' si los token no coinciden
      res.sendStatus(403);
    }
  }
});

app.post('/webhook', function(req, res) {

  let body = req.body;

  // Comprueba que esto es un evento  de una pagina de suscripcion
  if(body.object === 'page') {

    // Iteriza sobre cada entrada
    body.entry.forEach(function(entry) {

      // Obtiene el mensaje. Entry.messaging es un arreglo,
      // Ppero solo contendra un mensaje, asi que obtenemos el indice 0
      let webhook_event = entry.messaging[0];

      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;

      // Verfica si es un mensaje
      if(webhook_event.message){
        handleMessage(sender_psid, webhook_event.message);
      }
    });
    //Devuelve una respuesta '200 ok' a todas las solicitudes
    res.status(200).send('EVENT_RECEIVED');
  }
});

function handleMessage(sender_psid, received_message) {
  let response;

  //Verifica que el mensage contenga texto
  if(received_message.text){
    response = {
      "text": `Hola, tu mensaje fue: "${received_message.text}"`
    }
  }
  callSendAPI(sender_psid, response);
}

// Funcion para responder
function callSendAPI(sender_psid, response){

  //Construimos el mensaje
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  // Enviamos solicitud http a la plataforma Messenger(Responder el mensaje recibido)
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json":  request_body
  }, function(err, res, body) {
    if(!err) {
      console.log('mensaje enviado!');
    } else{
      console.log('El mensaje NO se envio');
    }
  });
}

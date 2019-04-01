/*
  Referencias:
  https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start

  Requerimientos:
    npm install express --save
    npm install request --save
*/

'use strict'

//Importamos dependecias
const request    = require('request'),
      express    = require('express'),
      bodyParser = require('body-parser'),
      app        = express().use(bodyParser.json());

const PAGE_ACCESS_TOKEN = "EAAeV0gqRVg0BANozuK4EphSq2uhJJ81Yetxc3vgg1JqpAmQAZBsdwW6yV9mXMbWPUUGZCpmhmzrixJKTTuLLCDCTAZAZA11UrsSjVrOdSEeKpsIwWrWfzUQ719tYVupTqkJNA3UUdJ99zXc7PRY0a9PDjsqInFUa5HQnI6NdggZDZD";

//Asigna un puerto al servidor y registra un mensaje en la consola en caso de exito
app.listen(process.env.PORT || 80, () => console.log('El webhook esta escuchando'));

app.get('/webhook', function(req, res) {

  // Parametros de la solicitud de verificación de webhook
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // Comprueba si se enviado un token y un mode
  if (mode && token) {

    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === PAGE_ACCESS_TOKEN ) {

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
      else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
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
    getFirstName(sender_psid, function(first_name) {
      response = {
        "text": `Hola ` + first_name + `, tu mensaje fue: "${received_message.text}", ahora enviame una foto`
      }
      callSendAPI(sender_psid, response);
    });
  }
  else if(received_message.attachments){

    // Traemos la url de la imagen que recibimos
    let attachment_url = received_message.attachments[0].payload.url;
    response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "Tu imagen",
            "subtitle": "¿Es lo que enviaste?",
            "image_url": attachment_url,
            "buttons":[
              {
                "type": "postback",
                "title": "Si",
                "payload": "si"
              },
              {
                "type": "postback",
                "title": "No",
                "payload": "no"
              }
            ]
          }]
        }
      }
    }
    callSendAPI(sender_psid, response);
  }
}

function handlePostback(sender_psid, received_postback){
  let response;

  let payload = received_postback.payload;

  // Set the response based on the postback payload
  if (payload === 'si') {
    response = { "text": "Gracias por confirmar!" }
  } else if (payload === 'no') {
    response = { "text": "Ops, algo salio mal" }
  }
  // Send the message to acknowledge the postback
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


// Funcion para traer first_name
function getFirstName(sender_psid, callback) {
  request({
    url: "https://graph.facebook.com/v2.6/" + sender_psid + "?",
    qs: {
      access_token: PAGE_ACCESS_TOKEN
    },
    headers: {
      'Accept': 'application/json',
      'Accept-Charset': 'utf-8',
      'User-Agent': 'test-bot'
    },
    method: "GET",
    json: true,
    time:true
  }, function(err, res, faceUserInfo) {
    if(!err) {
      callback(faceUserInfo.first_name);
    }
    else{
      callback(" :( ")
    }
  });
}

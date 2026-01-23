/*
© Salva Plantão
Uso não autorizado é proibido.
Contato oficial: suporte@appsalvaplantao.com

Global HTTPS Agent Configuration
- Allows self-signed certificates in development/testing
- Uses default agent in production (enforces proper certificates)
*/

import https from "https";

// Create a global HTTPS agent that allows self-signed certificates
const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === "production" ? true : false,
});

export { httpsAgent };

import express, { Express } from 'express';
import dotenv from 'dotenv';
import { routes } from './routes'
import cors from 'cors'
import bodyParser from 'body-parser'

var jsonParser = bodyParser.json()

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

var whitelist = ['http://localhost:3000', 'https://vistbokserver.herokuapp.com', 'https://visttorg-primary.vercel.app', 'https://www.vistbok.is' , 'http://localhost:3333', 'https://eu1.make.com', 'https://vistbokadmin.sanity.studio']
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1  || !origin) {
      callback(null, true)
    } else {
      // callback(new Error('Not allowed by CORS'))
      callback(null, true)
    }
  }
}

app.use(cors(corsOptions))
app.use(jsonParser)

app.use('/', routes)

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});
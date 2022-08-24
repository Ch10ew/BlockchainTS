import express from 'express';

const app = express();
const router = express.Router();

app.use(express.json());
const port = process.env.PORT ?? 8000;

app.listen(port, () => {
  console.log('App listening at port ' + port);
});

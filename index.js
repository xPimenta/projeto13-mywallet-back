import express, { json } from "express";
import cors from "cors";
import dotenv from "dotenv";
import chalk from "chalk";
import { MongoClient } from "mongodb";
import joi from "joi";
import bcrypt from "bcrypt";
import { v4 } from "uuid";

const app = express();
app.use(json());
app.use(cors());
dotenv.config();

let db = null;
const mongoClient = new MongoClient(process.env.MONGO_URL);
const conexao = mongoClient.connect();
conexao.then((client) => {
  db = mongoClient.db(process.env.MONGO_DB);
  console.log(chalk.bold.red("Conectado ao banco de dados"));
});
conexao.catch((e) =>
  console.log(
    chalk.bold.red("Ocorreu um erro ao conectar ao banco de dados"),
    e
  )
);

app.post("/sign-up", async (req, res) => {
  const { username, email, password, repeatPassword } = req.body;

  const signUpSchema = joi.object({
    username: joi.string().required(),
    email: joi.string().email().required(),
    password: joi.string().required(),
    repeatPassword: joi.string().required(),
  });

  const validation = signUpSchema.validate({ username, email, password, repeatPassword });
  
  if (validation.error) return res.sendStatus(401);

  try {
    const user = await db.collection("users").findOne({email});
    if(user) return res.sendStatus(401);

    const passwordHash = bcrypt.hashSync(password, 10);

    await db.collection("users").insertOne({ username, email, password: passwordHash });
    res.sendStatus(203);
  } catch(e){
    console.log(e);
    res.sendStatus(401);
  }
});

app.post("/sign-in", async (req, res) => {
  const login = req.body;
  const loginSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().required(),
  });
  const { error } = loginSchema.validate(login, { abortEarly: false });
  if (error) {
    res.status(402).send(error.details.map((detail) => detail.message));
    return;
  }

  try {
    const user = await db.collection("users").findOne({ email: login.email });
    if (usuario && bcrypt.compareSync(login.password, usuario.password)) {
      const token = v4();
      await db.collection("tokens").insertOne({
        token,
        user: usuario._id,
      });
      res.status(200).send(token);
    }
  } catch (error) {
    res.status(500).send(error.message);
    console.log("Erro ao logar usuario", error);
  }
});

app.listen(process.env.PORTA, () => {
  console.log(
    chalk.bold.blue(`Server is running on port ${process.env.PORTA}`)
  );
});

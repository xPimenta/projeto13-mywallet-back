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
  const cadastro = req.body;
  const cadastroSchema = joi.object({
    name: joi.string().required(),
    email: joi.string().email().required(),
    password: joi.string().required(),
  });
  const { error } = cadastroSchema.validate(cadastro, { abortEarly: false });
  if (error) {
    res.status(422).send(error.details.map((detail) => detail.message));
    return;
  }

  try {
    const user = await db.collection("users").insertOne({
      ...cadastro,
      senha: bcrypt.hashSync(cadastro.password, 10),
    });
    console.log("Usuario cadastrado com sucesso", user);
    res.sendStatus(201);
  } catch (error) {
    res.sendStatus(500);
    console.log("Erro ao cadastrar usuario", error);
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

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
  const { email, password } = req.body;

  const loginSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().required(),
  });

  const validation = loginSchema.validate({ email, password });
  if (validation.error) return res.sendStatus(401);

  try {
    const user = await db.collection("users").findOne({ email });
    if (user && bcrypt.compareSync(password, user.password)) {
      const token = v4();
      await db.collection("sessions").insertOne({
        token,
        user: user._id,
      });
      res.status(200).send({token});
    }
  } catch (error) {
    res.status(500).send(error.message);
    console.log("Erro ao logar usuario", error);
  }
});

app.get("/transactions", async (req, res) => {
  const { authorization } = req.headers;
  let token = authorization?.replace("Bearer ", "");

  if (!token) return res.sendStatus(401);

  const session = await db.collection("sessions").findOne({ token });
  if (!session) return res.sendStatus(401);

  try {
    const user = await db
      .collection("users")
      .findOne({ _id: ObjectId(session.user) });
    if (!user) return res.sendStatus(401);

    const transactions = await db
      .collection("transactions")
      .find({ user: user._id })
      .toArray();

    // let value = transactions.reduce((acc, curr) => {
    //   return acc + curr.value;
    // }, 0);

    // //transformando o valor para moeda brl
    // value = value.toLocaleString("pt-BR", {
    //   style: "currency",
    //   currency: "BRL",
    // });
    let value = 0;
    let income = 0;
    let outcome = 0;

    transactions.forEach((transaction) => {
      let realValue = transaction.value
        .replace("R$", "")
        .replace(",", ".")
        .trim();

      if (realValue.includes("-")) {
        realValue = realValue.replace("-", "").trim();
        outcome += Number(realValue);
      } else {
        income += Number(realValue);
      }

      realValue = Number(realValue);
    });

    value = income - outcome;

    value = value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    const balance = {
      inOut: income >= outcome ? "positive" : "negative",
      value,
    };

    return res.status(200).send({ transactions, balance, name: user.name });
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
});

app.post("/transactions", async (req, res) => {
  const { authorization } = req.headers;
  let { value, description, type } = req.body;

  let token = authorization?.replace("Bearer ", "");

  if (!token) return res.sendStatus(401);

  const session = await db.collection("sessions").findOne({ token });
  if (!session) return res.sendStatus(401);

  try {
    const user = await db
      .collection("users")
      .findOne({ _id: ObjectId(session.user) });
    if (!user) return res.sendStatus(401);

    const date = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });

    //transformando o valor para moeda brl
    value = value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    const transaction = {
      _id: new ObjectId(),
      user: user._id,
      value,
      description,
      date,
      type,
    };

    await db.collection("transactions").insertOne(transaction);
    return res.sendStatus(201);
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
});

app.listen(process.env.PORTA, () => {
  console.log(
    chalk.bold.blue(`Server is running on port ${process.env.PORTA}`)
  );
});

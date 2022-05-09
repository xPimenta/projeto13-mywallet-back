import { Router } from "express";

import {
  createTransaction,
  deleteTransaction,
  readTransactions,
} from "../controllers/transactionsController.js";
import {
  createMidleware,
  deleteMidleware,
} from "../middlewares/transactionMiddleware.js";

import { tokenValidator } from "../middlewares/tokenMiddleware.js";

const transactionsRoutes = Router();

transactionsRoutes.get("/transactions", tokenValidator, readTransactions);

transactionsRoutes.post(
  "/transactions",
  createMidleware,
  tokenValidator,
  createTransaction
);

transactionsRoutes.delete(
  "/transactions/:id",
  deleteMidleware,
  tokenValidator,
  deleteTransaction
);

export default transactionsRoutes;

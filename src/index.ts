import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Імпорти роутів
import productsRouter from "./routes/products";
import facetsRouter from "./routes/facets";

// Налаштування змінних середовища
dotenv.config();

// Створюємо сервер
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Підключаємо роутери
app.use("/products", productsRouter);
app.use("/facets", facetsRouter);

// Порт
const PORT = process.env.PORT || 5000;

// Старт сервера
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

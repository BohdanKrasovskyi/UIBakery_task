import express from "express";
import cors from "cors";
import dotenv from "dotenv";


import productsRouter from "./routes/products";
import facetsRouter from "./routes/facets";


dotenv.config();


const app = express();

app.use(cors());
app.use(express.json());


app.use("/products", productsRouter);
app.use("/facets", facetsRouter);


const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

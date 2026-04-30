import "dotenv/config";
import express from 'express';
import repoRoutes from './routes/repoRoutes.js';



const app = express();

app.use(express.json());

app.use("/api/repo",repoRoutes);

const PORT = 5000;

app.listen(PORT,()=> {
    console.log(`Server running on port ${PORT}`);
})
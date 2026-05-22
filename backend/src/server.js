const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req,res)=>{
   res.send("SkillMatrix API Running");
});

const PORT = 5000;

app.listen(PORT,()=>{
   console.log(`Server running on ${PORT}`);
});
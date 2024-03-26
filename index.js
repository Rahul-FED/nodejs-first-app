import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

mongoose
  .connect("mongodb://127.0.0.1:27017", {
    dbName: "backend",
  })
  .then(() => console.log("Database connected"))
  .catch(() => console.log("error"));

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password:String,
});
const User = mongoose.model("User", userSchema);

const app = express();

// using middlewares
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("view engine", "ejs");

const isAuthenticated = async (req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    try {
      const decoded = jwt.verify(token, "sdadlalflcsl");
      req.user = await User.findById(decoded._id);
      next();
    } catch (error) {
      res.render("login");
    }
  } else {
    res.redirect("/login")
  }
};

app.get("/", isAuthenticated, (req, res, next) => {
  res.render("logout", { name: req.user.name });
});
app.get("/login", (req, res) => {
  res.render("login")
});
app.get("/register", (req, res) => {
  res.render("register")
});
app.post("/login",async(req,res)=>{
  const {email,password}=req.body;
  let user=await User.findOne({email});
  if(!user) return res.redirect("/register");
  const isMatch=user.password===password;
  if(!isMatch) return res.render("/login",{message:"Incorrect password"});
  const token = jwt.sign({ _id: user._id }, "sdadlalflcsl");
  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  });

  res.redirect("/");

})

app.post("/register", async (req, res) => {
  const { name, email,password } = req.body;

  let user=await User.findOne({email})
  if(!user){
return res.redirect("/register")
  }
   user = await User.create({
    name,
    email,
    password
  });

  const token = jwt.sign({ _id: user._id }, "sdadlalflcsl");
  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  });

  res.redirect("/");
});

app.get("/logout", async (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

app.listen(3000, () => {
  console.log("server is working");
});

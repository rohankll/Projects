const express = require('express')
require('./db/config')
const cors = require('cors');
const User = require('./db/User')
const Product = require('./db/Product')
const Jwt = require('jsonwebtoken')
const jwtKey = 'commerce';
const app = express();
app.use(express.json());
app.use(cors());
app.post("/register", async (req, resp) => {
    let user = new User(req.body);
    let result = await user.save();
    result = result.toObject();                  //toObject() function converts the result fields into the object. 
    delete result.password;
    Jwt.sign({ result},jwtKey,{ expiresIn: "2h" }, (err, token) => {
        if (err) {
            resp.send({ result: "something went wrong, Please try again later" })
        }
    })
    
})
// in this, when we send data from postman then may be we send two same data of user, how we will recognize the data when we log in into the website. To solve this we have to take a field unique, so the database could recognize it as a single entity.
app.post("/login", async (req, resp) => {
    // resp.send(req.body);
    if (req.body.password && req.body.email) {
        let user = await User.findOne(req.body).select("-password");
        if (user) {
            Jwt.sign({ user},jwtKey,{ expiresIn: "2h" }, (err, token) => {
                if (err) {
                    resp.send({ result: "something went wrong, Please try again later" })
                }
                resp.send({ user, auth: token });
            })
            
        }
        else {
            resp.send({ result: "user not found" });
        }
    }
    else {
        resp.send({ result: "user not found" });
    }


})
app.post("/add-product",verifyToken, async (req, resp) => {
    let product = new Product(req.body);
    let result = await product.save();
    resp.send(result)
})
app.get('/products',verifyToken, async (req, resp) => {
    let products = await Product.find();
    if (products.length > 0) {
        resp.send(products)
    }
    else {
        resp.send({ result: "no products found" })
    }
})
app.delete("/product/:id",verifyToken, async (req, resp) => {

    const result = await Product.deleteOne({ _id: req.params.id });
    resp.send(result);

}
)
app.get('/product/:id',verifyToken, async (req, resp) => {
    let result = await Product.findOne({ _id: req.params.id })
    if (result) {
        resp.send(result)
    }
    else {
        resp.send({ result: "No data found" })
    }
})
app.put("/product/:id",verifyToken, async (req, resp) => {
    let result = await Product.updateOne(
        { _id: req.params.id },
        {
            $set: req.body
        }
    )
    resp.send(result)
});
app.get('/search/:key',verifyToken, async (req, resp) => {
    let result = await Product.find({
        "$or": [
            { name: { $regex: req.params.key } },
            { price: { $regex: req.params.key } },
            { category: { $regex: req.params.key } },
            { company: { $regex: req.params.key } }
        ]
    })
    resp.send(result)
})
function verifyToken(req,resp,next){
    let token= req.headers['authorization'];
    if(token){
        token=token.split(' ')[1];
        // console.log("middleware called",token);
        Jwt.verify(token,jwtKey,(err,valid)=>{
            if(err){
                   resp.status(401).send({result:"please enter the valid token in the header"}) 
            }
            else{
                    next();
            }
        })
    }
    else{
        resp.status(403).send({result:"please add the token in the header"})
    }
    // console.log("middleware called",token); 
    
}
app.listen(4000);
// we made a user entity from the "User.js" becoz at a time only one user can enter the data and here, we use await becoz if the input data take time to save on the server.
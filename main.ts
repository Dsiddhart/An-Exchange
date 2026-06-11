import express from "express";
export const app = express();

interface Balances {
    [key:string]: number;
}
interface User {
    id: string;
    balances: Balances;
}

interface Order {
    userId: string;
    price: number;
    quantity: number;
}

export const Ticker = "Meta";

const users: User[] = [{
    id: "1",
    balances: {
        "Meta": 10,
        "usd":1000
    }
},{
    id: "2",
    balances: {
        "Meta": 5,
        "usd":500
    }
}];

const bids: Order[] = [];
const asks: Order[] = [];

app.post("/order", (req: any, res: any) => {
    const side:string= req.body.side;
    const price: number = req.body.price;
    const quantity: number = req.body.quantity;
    const userId: string = req.body.userId;

    const remainingQuantity = fillOrder(side, price, quantity,userId);

    if (remainingQuantity === 0){
        res.json({filledQuantity: quantity});
        return;
    }
    if (side === "bid"){
        bids.push({
            userId,
            price,
            quantity: remainingQuantity
        });
        bids.sort((a,b) => a.price<b.price? -1:1);// <- sort bids in descending order

    } else {
        asks.push({
            userId,
            price,
            quantity: remainingQuantity
        })// ; // 
        asks.sort((a,b) => a.price>b.price? -1:1);// <- sort asks in ascending order

    }
    res.json({filledQuantity: quantity - remainingQuantity});
})
app.get("/depth", (req:any, res:any)=>{
    const depth:{
        [price: string]:{
            type: "bid" | "ask",
            quantity: number
        }
    }={};
    for(let i=0; i<bids.length;i++){
        if(!depth[bids[i].price]) {
            depth[bids[i].price]={
                type:"bid",
                quantity: bids[i].quantity
            };
        }
        else{
            depth[bids[i].price].quantity +=bids[i].quantity;
        }

    }
    for(let i=0; i<asks.length; i++){
        if(!depth[asks[i].price]) {
            depth[asks[i].price]={
                type:"ask",
                quantity: asks[i].quantity
            };
        }
        else{
            depth[asks[i].price].quantity +=asks[i].quantity;
        }
    }
    res.json({
        depth
    })
})
app.get("/balances/:userId", (req:any, res:any) => {
    const userId = req.params.userId;
    const user = users.find(u => u.id === userId);
    if(!user) {
        return res.json({
            usd: 0,
            [Ticker]:0
        })
    }
    res.json({ balances: user.balances});
})
function flipBalance(userId1: string, userId2: string, quantity:number, price: number){
    let user1 = users.find(u => u.id===userId1);
    let user2 = users.find(u => u.id===userId2);
    if(!user1||!user2){
        return;
    }
    user1.balances[Ticker] -= quantity;
    user2.balances[Ticker] += quantity;
    user1.balances["USD"] +=(quantity * price);
    user2.balances["USD"] -= (quantity * price);
}

function fillOrder(side:string, price:number, quantity:number, userId:string):number{
    let remainingQuantity = quantity;
    if(side === "bid"){
        for(let i=asks.length-1; i>=0;i--){
            if(asks[i].price > price){
                continue; // i feel a bug here because when a bid is made at larger ask price, it should be filled immediatlely with the current prize 
               // which i think is missing here
            }
        }
    }
}
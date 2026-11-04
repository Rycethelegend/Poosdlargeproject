require('express');
require('mongodb');

const token = require('./createJWT.js');

// ONLY IF USING MONGOOSE
// load user model
// const User = require("./models/user.js");
// load card model
// const Card = require("./models/card.js");


// Changed login API to only use username + password
// Tokens are checked with another api/function. Not sure yet.

exports.setApp = function (app, client) {

    app.post('/api/login', async (req, res, next) => {

        // incoming: login, password
        // outgoing: id, firstName, lastName, error

        let error = '';

        const { login, password } = req.body;

        const db = client.db("PoosdDatabase");
        const results = await db.collection('Users').find({ Login: login, Password: password }).toArray();

        let id = -1;
        let fn = '';
        let ln = '';

        let ret;

        if (results.length > 0) {
            id = results[0].UserId;
            fn = results[0].FirstName;
            ln = results[0].LastName;

            try {
                ret = token.createToken(fn, ln, id);
            }
            catch (e) {
                ret = { error: e.message };
            }
        }
        else {
            ret = { error: "Login/Password incorrect" };
        }

        res.status(200).json(ret);
    });

    app.post('/api/checktoken', async (req, res, next) => {
        // Log in automatically
        // Shares same token functionality as api/addCard and api/searchCards

        // incoming: jwtToken
        // outgoing: id, firstName, lastName, jwtToken (refreshed), error

        let error = '';

        const { jwtToken } = req.body;

        // Calls jwt.verify() in createJWT.js
        if (token.isExpired(jwtToken)) 
        {
            res.status(200).json({ error: 'JWT no longer valid. Login required.', jwtToken: '' });
            return;
        }

        // Refresh the expiration time
        var refreshedToken = null;
        try 
        {
            refreshedToken = token.refresh(jwtToken);
        }
        catch (e) 
        {
            console.log(e.message);
        }

        var ret = { error: error, jwtToken: refreshedToken };

        res.status(200).json({ret});
    });

    app.post('/api/addcard', async (req, res, next) => {
        // incoming: userId, color
        // outgoing: error

        const { userId, card, jwtToken } = req.body;

        try 
        {
            if (token.isExpired(jwtToken)) {
                const r = { error: 'The JWT is no longer valid', jwtToken: '' };
                res.status(200).json(r);
                return;
            }
        }
        catch (e) 
        {
            console.log(e.message);
        }

        const newCard = { Card: card, UserId: userId };
        let error = '';

        try {
            const db = client.db("PoosdDatabase");
            await db.collection('Cards').insertOne(newCard);
        }
        catch (e) {
            error = e.toString();
        }

        let refreshedToken = null;
        try 
        {
            refreshedToken = token.refresh(jwtToken);
        }
        catch (e) {
            console.log(e.message);
        }

        const ret = { error: error, jwtToken: refreshedToken };

        res.status(200).json(ret);
    });

    app.post('/api/searchcards', async (req, res, next) => {
        // incoming: userId, search
        // outgoing: results[], error

        let error = '';

        const { userId, search, jwtToken } = req.body;

        try 
        {
            if (token.isExpired(jwtToken)) 
            {
                var r = { error: 'The JWT is no longer valid', jwtToken: '' };
                res.status(200).json(r);
                return;
            }
        }
        catch (e) {
            console.log(e.message);
        }

        const _search = (search ?? '').trim();

        const db = client.db("PoosdDatabase");
        const results = await db.collection('Cards').find({ "Card": { $regex: _search + '.*', $options: 'i' } }).toArray();

        let _ret = [];
        for (let i = 0; i < results.length; i++) {
            _ret.push(results[i].Card);
        }

        let refreshedToken = null;
        try {
            refreshedToken = token.refresh(jwtToken);
        }
        catch (e) {
            console.log(e.message);
        }

        const ret = { results: _ret, error: error, jwtToken: refreshedToken };

        res.status(200).json(ret);
    });
}
app.post('/api/login', handleLogin);


async function handleLogin(req, res) {

    app.post('/api/login', async (req, res, next) => {
        // incoming: login, password
        // outgoing: id, firstName, lastName, error

        var error = '';

        const { login, password } = req.body;

        const db = client.db('COP4331Cards');
        const results = await db.collection('Users').find({ Login: login, Password: password }).toArray();

        var id = -1;
        var fn = '';
        var ln = '';

        if (results.length > 0) {
            id = results[0].UserID;
            fn = results[0].FirstName;
            ln = results[0].LastName;
        }

        var ret = { id: id, firstName: fn, lastName: ln, error: '' };
        res.status(200).json(ret);
    });
}
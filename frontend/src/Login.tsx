import { useState } from 'react';

async function doLogin(event: any): Promise<void> {
    
    const [message, setMessage] = useState('');
    const [loginName, setLoginName] = useState('');
    const [loginPassword, setPassword] = useState('');

    event.preventDefault();

    var obj = { login: loginName, password: loginPassword };
    var js = JSON.stringify(obj);

    try {
        const response = await fetch('http://localhost:5000/api/login',
            { method: 'POST', body: js, headers: { 'Content-Type': 'application/json' } });

        var res = JSON.parse(await response.text());

        if (res.id <= 0) {
            setMessage('User/Password combination incorrect');
        }
        else {
            var user = { firstName: res.firstName, lastName: res.lastName, id: res.id }
            localStorage.setItem('user_data', JSON.stringify(user));

            setMessage('');
            window.location.href = '/cards';
        }
    }
    catch (error: any) {
        alert(error.toString());
        return;
    }
};

import React, { useEffect, useState } from 'react';
import { buildPath } from '../path';
import { storeToken, retrieveToken, clearToken, type UserToken } from '../tokenStorage';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router';


function Login() {

    const [message, setMessage] = useState('');
    const [loginName, setLoginName] = React.useState('');
    const [loginPassword, setPassword] = React.useState('');

    // Wayyyy faster than changing window.href
    const navigate = useNavigate();


    async function checkToken(): Promise<void> 
    {
        const obj = { jwtToken: retrieveToken() };
        const js = JSON.stringify(obj);

        try {

            const response = await fetch(buildPath('api/checktoken'),
            {
                method: 'POST', body: js, 
                headers: { 'Content-Type': 'application/json' }
            });

            const txt = await response.text();
            const res = JSON.parse(txt);

            // No need to decode and check userId <= 0.
            // api/checkToken already calls jwt.verify in createJWT.js

            if (res.error.length > 0) 
            {
                clearToken();
            }
            else 
            {
                storeToken(res.jwtToken);
                navigate('/cards', { replace: true });
            }
        }
        catch (error: any) 
        {
            // Server unreachable
            console.log(error);
        }
    };

    async function doLogin(event: any): Promise<void> {

        event.preventDefault();

        const obj = { login: loginName, password: loginPassword };
        const js = JSON.stringify(obj);

        try {

            const response = await fetch(buildPath('api/login'),
            {
                method: 'POST', body: js,
                headers: { 'Content-Type': 'application/json' }
            });

            const txt = await response.text();
            const res = JSON.parse(txt);

            // Added for safety
            if( res.error.length > 0 )
            {
                setMessage( "API Error:" + res.error );
                return;
            }
            
            const { accessToken } = res;
            storeToken(res);

            const decoded = jwtDecode<UserToken>(accessToken);

            try {
                const ud = decoded;

                // Not quite sure what to use this for.
                // const iat = ud.iat

                // UserID should absolutely be separate from IAT (packet arrival time)
                const userId = ud.userId;
                const firstName = ud.firstName;
                const lastName = ud.lastName;

                if (userId <= 0) {
                    setMessage('User/Password combination incorrect');
                }
                else {
                    const user = { firstName: firstName, lastName: lastName, id: userId }
                    localStorage.setItem('user_data', JSON.stringify(user));

                    setMessage('');
                    navigate('/cards', { replace: true });
                    // window.location.href = '/cards';
                }
            }
            catch (e) 
            {
                console.log(e);
                return;
            }
        }
        catch (error: any) 
        {
            alert(error.toString());
            return;
        }
    };

    function handleSetLoginName(e: any): void {
        setLoginName(e.target.value);
    }

    function handleSetPassword(e: any): void {
        setPassword(e.target.value);
    }

    useEffect(() => {

        checkToken();

    }, []);

    return (
        <div id="loginDiv">
            <span id="inner-title">PLEASE LOG IN</span><br />
            Login: <input type="text" id="loginName" placeholder="Username"
                onChange={handleSetLoginName} /><br />
            Password: <input type="password" id="loginPassword" placeholder="Password"
                onChange={handleSetPassword} />
            <input type="submit" id="loginButton" className="buttons" value="Do It"
                onClick={doLogin} />
            <span id="loginResult">{message}</span>
        </div>
    );
};

export default Login;

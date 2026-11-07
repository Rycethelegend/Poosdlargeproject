import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router';
import './App.css'

// FUTURE: We may need a motion/transition library.

// import { gsap } from "gsap";
// import { useGSAP } from "@gsap/react";
// import { ScrollTrigger } from "gsap/ScrollTrigger";
// gsap.registerPlugin(ScrollTrigger, useGSAP);

import Navbar from './components/Navbar.tsx';
import Home from './sections/Home.tsx';
import LoginPage from './auth/LoginPage.tsx';
import RegisterPage from './auth/RegisterPage.tsx';
import ForgotPasswordPage from './auth/ForgotPasswordPage.tsx';
import ResetPasswordPage from './auth/ResetPasswordPage.tsx';
import { validToken } from './tokenStorage.ts';

function RootLayout() {
    return (
        <main className="overflow-x-hidden">
            <Navbar />
            <Outlet />
        </main>
    );
}

// Logged-out visitors land on the login page first
function RequireLogin({ children }: { children: ReactNode }) 
{
    return validToken() ? children : <Navigate to="/login" replace />;
}

// Logged-in users skip the login and register pages
function GuestOnly({ children }: { children: ReactNode }) {
    return validToken() ? <Navigate to="/" replace /> : children;
}

const routes = [
    {
        index: true,
        element: <RequireLogin><Home /></RequireLogin>,
    },
    { path: 'login', element: <GuestOnly><LoginPage /></GuestOnly> },
    { path: 'register', element: <GuestOnly><RegisterPage /></GuestOnly> },
    { path: 'forgot-password', element: <GuestOnly><ForgotPasswordPage /></GuestOnly> },
    { path: 'reset-password', element: <GuestOnly><ResetPasswordPage /></GuestOnly> },
    { path: '*', element: <Navigate to="/" replace /> },
];

const router = createBrowserRouter([
    {
        path: "/",
        element: <RootLayout />,
        children: routes,
    },
]);

function App() {
    return <RouterProvider router={router} />;
}

export default App;

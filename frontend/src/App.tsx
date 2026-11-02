import './App.css'
// import { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Outlet, ScrollRestoration } from 'react-router';

// FUTURE: We may need a motion/transition library.

// import { gsap } from "gsap";
// import { useGSAP } from "@gsap/react";
// import { ScrollTrigger } from "gsap/ScrollTrigger";
// gsap.registerPlugin(ScrollTrigger, useGSAP);

import Navbar from './components/Navbar.tsx';
import Home from './sections/Home.tsx';

function RootLayout() {
  return (
    <main className="overflow-x-hidden">
        <Navbar />
        <Outlet />
    </main>
  );
}
// <Suspense fallback={<div className="w-screen h-screen bg-black" />}>
// </Suspense>
// <ScrollRestoration />

export const publicRoutes = [
    {
        index: true,
        element: <Home />,
    },
];

const router = createBrowserRouter ([
  {
    path: "/",
    element: <RootLayout />,
    children: publicRoutes, // Your 200+ routes go here
  },
]);


function App() 
{
  return <RouterProvider router={router} />;
}

export default App;
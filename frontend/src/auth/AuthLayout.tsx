import type { ReactNode } from 'react';
import { GAME_TITLE } from '../gameInfo';

// Frame for the login, register and password reset pages: the same cream
// background, title and green felt table as the main menu.
const AuthLayout = ({ heading, children }: { heading: string; children: ReactNode }) => {
    return (
        <div className="relative min-h-screen w-full bg-cream flex flex-col items-center px-4 pt-12 pb-16">

            <p className="title text-center font-playfair mb-10">
                {GAME_TITLE}
            </p>

            <div className="relative w-full max-w-md bg-felt rounded-4xl border-16 border-felt-edge">

                <div className="absolute inset-0 pointer-events-none rounded-2xl bg-black/5 mask-size-[40px] mask-[url(/patterns/parkay-floor.svg)]" />

                <div className="relative flex flex-col gap-4 p-6">
                    <h1 className="text-3xl font-semibold text-center">{heading}</h1>
                    {children}
                </div>
            </div>
        </div>
    );
}

export default AuthLayout;

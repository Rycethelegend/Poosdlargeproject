const app_name = 'poosdbasecontactmanager.casa'

export function buildPath(route: string): string {

    // "npm run dev": talk to the Express server on this computer
    if (import.meta.env.DEV) {
        return 'http://localhost:5000/' + route;
    }

    // "npm run build": the live site. nginx serves it over https and passes
    // /api/ requests on to Express (port 5000 on the server).
    return 'https://' + app_name + '/' + route;
}

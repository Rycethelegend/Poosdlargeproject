const app_name = 'poosdbasecontactmanager.casa'

// The order was switched for localhost and URL. Strange. Also, default not required (idk why)
export function buildPath(route: string) : string {

    // Case: "npm run dev"
    if (import.meta.env.NODE_ENV != 'development') 
    {
        return 'http://localhost:5000/' + route;
    }

    // Case: "npm run build"
    else 
    {
        return 'http://' + app_name + ':5000/' + route;
    }
}

// OLD .JS CODE:
/* exports.buildPath =
function buildPath(route) {
    if (process.env.NODE_ENV != 'development') {
        return 'http://' + app_name + ':5000/' + route;
    }
    else {
        return 'http://localhost:5000/' + route;
    }
} */
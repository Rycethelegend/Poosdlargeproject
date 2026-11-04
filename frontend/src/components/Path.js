const app_name = 'poosdbasecontactmanager.casa'

/*
exports.buildPath =
    function buildPath(route) {
        if (process.env.NODE_ENV != 'development') {
            return 'http://' + app_name + ':5000/' + route;
        }
        else {
            return 'http://localhost:5000/' + route;
        }
    } */

export default function buildPath(route) {

    if (process.env.NODE_ENV != 'development') {
        return 'http://' + app_name + ':5000/' + route;
    }
    else {
        return 'http://localhost:5000/' + route;
    }
}
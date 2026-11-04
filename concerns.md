List of concerns:

React-router-dom was replaced by react-router v7. are we allowed to use react-router instead?

Routing currently works with declarative mode. Syntax is a little nicer with data mode.
Also data mode allows us to keep windows/navbars open while users cycle through windows.

In backend package.json I switched from "type": "commonjs" to "type": "module"
Need to see if this is allowed.

Frontend package.json
When replacing react-router-dom with the newer react-router, I changed a few dependencies:
-removed jsonwebtoken (jwt-decode already does this job)
-removed dotenv (wasnt being used in any frontend files)
-removed react-jwt (wasnt being used in any frontend files)
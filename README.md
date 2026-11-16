# Poosdlargeproject - **Poosdalatro**

# Description

A reimagining of the popular digital solitaire game Balatro retooled to work in a fast-paced single-player and multiplayer setting on both browser and android with a live leaderboard.

Hosted using a Droplet on DigitalOcean using a Mern stack, on an Ubuntu Linux Server with nginx, express PM2, and MongoDB database. 

Created for COP4331C, Processes in Object-Oriented Software Development at UCF, Fall 2026.

# Setup Instructions

Once your server and database are set up you can use the frontend/api here to deploy your app on a domain of your choice.

**Database Setup**

### Step 1: Login/Sign up to MongoDB Website
- Go to MongoDB website and create an Account or Sign into one:
- Use this link: https://cloud.mongodb.com/

### Step 2: On MongoDB, Create a Project
- In your project, create a Cluster called `Poosdbase`
- Inside of the `Poosdbase` Cluster, create a database called `PoosdDatabase`

### Step 3: Making the Schema
- In the `PoosdDatabase` create 4 tables:
  - `Leaderboard`
  - `Rooms`
  - `Users`
  - `VerificationCodes`

**Use the Entity-Relationship Diagram in this GitHub's `docs/poosdatabase_erd-v4.png` file to see what each table's entries should look like.**

### Step 4: MongoDB User Connection
- Make sure you create a database user for PoosdDatabase with Read & Write permissions.
  - Make sure you remember its Username and Password for later connection steps.

### Step 5: Connecting Database to Server
- In your Env file and Github Secrets, replace the value for `DATABASE_LINK` with your database link.
- Your database link should look like: `mongodb+srv://{Username}:{Password}@poosdbase.puafigd.mongodb.net/PoosdDatabase`
  - Where `{Username}` and `{Password}` are replaced with your Username and Password for the database user created in Step 4.

**Note: This `DATABASE_LINK` variable is used in the `server.js` file.**

**Note: The `server.js` file uses the mongoose Node.js library to connect to MongoDB.**






# Access

The webapp is currently hosted at https://poosdbasecontactmanager.casa/
The mobile app is not currently in the google play store. Requires a manual Install.

# Team Members And Their Roles

Levi Buffington - Project Manager:
Facilitated planning and meetings and tasking, completed system engineering requirements for the project, assisted development for frontend team, designed presentation

Frank Yang - API developer:
Worked on Search and Update Leaderboard endpoints. Also did some unit testing for functions in api.js

Nathan Melloul - Frontend Developer:
Initially got the server running and configured NPM along with Tailwind CSS. Then I made the frontend, and desktop / overlay modes. Did work on the backend token architecture (simple token functions, along with API/checktoken for heavy verification).
Took Alec's concept and made it multiplayer using AI. Created the API/multiplayer endpoints. Created the database schema for rooms, players, decks, etc. Created the windows for Lobbies / Room / Game / End / Timeout.
Helped Alec by creating the Rat card sprite.

Jake Arnold - Database Engineer:
Created and maintained MongoDB database. Centered on User separated table, making game data and specific user data organized in their respective table organizations.
Revised js MongoDB server connections.

Wenhuang Lin - Frontend Developer:
Spearheaded mobile development, designing mobile pages and integrating design choices to be consistent across platforms.

Rudolph Antoine - API Developer:
Worked on the Login and Register API endpoints. Also performed some of the Unit Testing for functions in api.js and multiplayer api.

Alec Hayes - Frontend Developer:
Worked on the Frontend with mainly developing the Singleplayer for both the website and mobile as well as getting the email for the email verification system to work. Also created the credits.






# AI Assistance Disclosure

This project was developed with assistance from generative AI tools:

### Levi Buffington
- **Tool**: Gemini 3.6 Flash
- **Dates**: October 2026-November 2026
- **Scope**: Project management duties, code reviews, code refactoring
- **Nature of Use**: Diagram construction assistance, frontend prototype development

### Wenhuang Lin
- **Tool**: Claude Opus 5.5
- **Dates**: October 2026-November 2026
- **Scope**: Mobile development, design, and planning
- **Nature of Use**: Summarize sections of codebase and mild code writing on frontend migration from web to mobile

### Alec Hayes
- **Tool**: Claude Opus 5.5
- **Dates**: October 2026-November 2026
- **Scope**: Frontend game functionality drafting
- **Nature of Use**: Helped with figuring out how the game functionality can be put into code, was modified by hand for final product.

### Jake Arnold
- **Tool**: Gemini 3.6 Flash
- **Dates**: November 2026
- **Scope**: Entity-Relationship Diagram drafting
- **Nature of Use**: Diagram construction assistance from database schema.

### Nathan Melloul
- **Tool**: Claude Opus 5.5
- **Dates**: October 2026-November 2026
- **Scope**: Double checked NPM setup. Brainstorming multiplayer concepts. Programming multiplayer using Alec's game code. Porting multiplayer to Dart/Flutter.
- **Nature of Use**: After server creation and configuration, I verified everything was correct (NPM + packages). Helped me decide between Colyseus and MongoDB approach. Designed the multiplayer API endpoints and mongoose schema.
                    Helped me port multiplayer components and schema from JavaScript to Dart/Flutter. Also helped port the multiplayer windows for Lobbies/Room/Game/End/Timeout.
                    Helped check all endpoints and inputs for possible errors / Cross Site Scripting (XSS) attacks at the end.

All AI-generated code and diagrams were reviewed, tested on the DigitalOcean LAMP environment, and validated against assignment rubric requirements.


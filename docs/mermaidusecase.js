%%{init: {'theme': 'base', 'themeVariables': { 'clusterBkg': 'transparent', 'clusterBorder': 'transparent' }}}%%

flowchart LR
    User(["User"])

    subgraph System ["Use Case"]
        direction TB
        
        UC1(["Register Account"])
        UC2(["Verify Email"])
        UC3(["Log In"])
        UC4(["Reset Password"])
        
        Homepage(["Homepage"])
        UC5(["Play Singleplayer"])
        UC6(["Play Multiplayer"])
        UC7(["Check Highscore / Leaderboard"])
        UC8(["View Profile"])
        UC9(["Settings"])
    end

    User --> UC1
    User --> UC3

    UC1 -.->|"<<include>>"| UC2
    UC3 -.->|"<<extend>>"| UC4
    
    UC1 ==> Homepage
    UC3 ==> Homepage

    Homepage --> UC5
    Homepage --> UC6
    Homepage --> UC7
    Homepage --> UC8
    Homepage --> UC9
%% devtoolsdaily:theme:start v1
%%{init: {"theme":"base","themeVariables":{"darkMode":true,"background":"#101827","primaryColor":"#24354b","primaryTextColor":"#f1f5f9","primaryBorderColor":"#8fa9cd","lineColor":"#a8bad3","tertiaryColor":"#303653","tertiaryTextColor":"#f1f5f9","tertiaryBorderColor":"#8fa9cd","edgeLabelBackground":"#101827"},"themeCSS":"& { background-color: #101827; }"}}%%
%% devtoolsdaily:theme:end

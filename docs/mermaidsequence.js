sequenceDiagram
    autonumber
    actor User as User
    participant Client as React / Flutter Client
    participant API as Express REST API
    participant DB as MongoDB Database

    User->>Client: Types partial search query (e.g., "georg") in search bar
    Note over Client: Client captures input via AJAX / Asynchronous call
    Client->>API: GET /api/leaderboard/search?query=georg
    Note over API: Express server receives request & builds partial regex filter
    API->>DB: Leaderboard.find({ player: { $regex: query, $options: 'i' } })
    Note over DB: MongoDB matches records (e.g., "george_bush_420")
    DB-->>API: Returns matching score documents
    API-->>Client: HTTP 200 OK (JSON array of matching scores)
    Client-->>User: Renders filtered leaderboard rows dynamically


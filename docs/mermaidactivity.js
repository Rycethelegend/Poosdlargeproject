flowchart TB
    Start([Start Round]) --> Init[Load Round, Target Score, Hands & Discards]
    Init --> CheckBoss{High Roller Boss Active?}
    
    CheckBoss -->|Yes| ApplyBoss[Apply Boss Rule Restrictions / Card Blocks]
    CheckBoss -->|No| SortHand[Player Views & Sorts Hand by Rank or Suit]
    ApplyBoss --> SortHand

    SortHand --> SelectCards[Player Clicks Cards to Select/Deselect]
    SelectCards --> LivePreview[Instant useMemo Score Preview & Hand Evaluation]
    
    LivePreview --> ActionChoice{Player Action?}

    %% Play Hand Branch
    ActionChoice -->|Play Hand| EvalPlay[Evaluate Final Hand: Chips x Mult]
    EvalPlay --> ApplyScore[Add Score to roundScore & Decrement handsLeft]
    ApplyScore --> CheckTarget{roundScore >= target?}

    CheckTarget -->|Yes| RoundWon[Phase: roundWon - Calculate Rewards & Interest]
    RoundWon --> Shop[Phase: shop - Visit Shop to Buy Jokers & Upgrades]
    Shop --> NextRound{More Rounds?}
    NextRound -->|Yes| Init
    NextRound -->|No| Victory([Run Complete])

    CheckTarget -->|No| CheckHands{handsLeft === 0?}
    CheckHands -->|No| SortHand
    CheckHands -->|Yes| GameOver[Phase: gameOver - Run Over]

    %% Discard Branch
    ActionChoice -->|Discard| CheckDiscards{discardsLeft > 0 AND selected > 0?}
    CheckDiscards -->|Yes| ExecuteDiscard[Remove Selected Cards & Decrement discardsLeft]
    ExecuteDiscard --> SortHand
    CheckDiscards -->|No| SortHand

    %% Game Over / Give Up Flow
    GameOver --> SaveScore[Send Final Score to Database / Leaderboard]
    SaveScore --> End([End Run / New Run])

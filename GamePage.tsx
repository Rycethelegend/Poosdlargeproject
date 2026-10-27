import React, { useState, useEffect } from 'react';
import type { Card, HandEvaluation } from '../utils/gameLogic';
import { createDeck, evaluateHand } from '../utils/gameLogic';

export const GamePage: React.FC = () => {
  const [deck, setDeck] = useState<Card[]>([]);
  const [hand, setHand] = useState<Card[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [score, setScore] = useState<number>(0);
  const [targetScore, setTargetScore] = useState<number>(300);
  const [handsRemaining, setHandsRemaining] = useState<number>(4);
  const [discardsRemaining, setDiscardsRemaining] = useState<number>(3);
  
  const [lastHandEval, setLastHandEval] = useState<HandEvaluation | null>(null);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [roundWon, setRoundWon] = useState<boolean>(false);

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    const newDeck = createDeck();
    const initialHand = newDeck.slice(0, 8);
    const remainingDeck = newDeck.slice(8);

    setDeck(remainingDeck);
    setHand(initialHand);
    setSelectedIds([]);
    setScore(0);
    setTargetScore(300);
    setHandsRemaining(4);
    setDiscardsRemaining(3);
    setLastHandEval(null);
    setGameOver(false);
    setRoundWon(false);
  };

  const toggleCardSelect = (cardId: string) => {
    if (gameOver || roundWon) return;

    if (selectedIds.includes(cardId)) {
      setSelectedIds(selectedIds.filter((id) => id !== cardId));
    } else {
      if (selectedIds.length < 5) {
        setSelectedIds([...selectedIds, cardId]);
      }
    }
  };

  const playHand = () => {
    if (selectedIds.length === 0 || handsRemaining <= 0 || gameOver || roundWon) return;

    const selectedCards = hand.filter((card) => selectedIds.includes(card.id));
    const handEval = evaluateHand(selectedCards);
    
    const newScore = score + handEval.score;
    setScore(newScore);
    setLastHandEval(handEval);

    const remainingHand = hand.filter((card) => !selectedIds.includes(card.id));
    const cardsToDrawCount = 8 - remainingHand.length;
    const drawnCards = deck.slice(0, cardsToDrawCount);
    
    setDeck(deck.slice(cardsToDrawCount));
    setHand([...remainingHand, ...drawnCards]);
    setSelectedIds([]);

    const nextHandsLeft = handsRemaining - 1;
    setHandsRemaining(nextHandsLeft);

    if (newScore >= targetScore) {
      setRoundWon(true);
    } else if (nextHandsLeft <= 0) {
      setGameOver(true);
    }
  };

  const discardCards = () => {
    if (selectedIds.length === 0 || discardsRemaining <= 0 || gameOver || roundWon) return;

    const remainingHand = hand.filter((card) => !selectedIds.includes(card.id));
    const cardsToDrawCount = 8 - remainingHand.length;
    const drawnCards = deck.slice(0, cardsToDrawCount);

    setDeck(deck.slice(cardsToDrawCount));
    setHand([...remainingHand, ...drawnCards]);
    setSelectedIds([]);
    setDiscardsRemaining(discardsRemaining - 1);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>Balatro Clone - Web Client</h1>

      {/* Score HUD */}
      <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#1e293b', color: '#fff', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <div>
          <h3>Score: {score} / {targetScore}</h3>
        </div>
        <div>
          <p>Hands Left: <strong>{handsRemaining}</strong></p>
          <p>Discards Left: <strong>{discardsRemaining}</strong></p>
        </div>
      </div>

      {/* Last Played Hand Banner */}
      {lastHandEval && (
        <div style={{ backgroundColor: '#0f172a', color: '#38bdf8', padding: '10px', borderRadius: '6px', textAlign: 'center', marginBottom: '20px' }}>
          Played: <strong>{lastHandEval.handName}</strong> (+{lastHandEval.score} Chips)
        </div>
      )}

      {/* Game State Messages */}
      {roundWon && (
        <div style={{ backgroundColor: '#16a34a', color: '#fff', padding: '15px', borderRadius: '8px', textAlign: 'center', marginBottom: '20px' }}>
          🎉 Target Reached! Round Won!
          <button onClick={startNewGame} style={{ marginLeft: '15px', padding: '8px 16px', cursor: 'pointer' }}>Next Round</button>
        </div>
      )}

      {gameOver && (
        <div style={{ backgroundColor: '#dc2626', color: '#fff', padding: '15px', borderRadius: '8px', textAlign: 'center', marginBottom: '20px' }}>
          💀 Game Over! Final Score: {score}
          <button onClick={startNewGame} style={{ marginLeft: '15px', padding: '8px 16px', cursor: 'pointer' }}>Try Again</button>
        </div>
      )}

      {/* Hand Cards Area */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', height: '140px', alignItems: 'flex-end', marginBottom: '30px' }}>
        {hand.map((card) => {
          const isSelected = selectedIds.includes(card.id);

          const xPercent = (card.rankIndex / 14) * 100;
          const yPercent = (card.suitIndex / 4) * 100;

          return (
            <div
              key={card.id}
              onClick={() => toggleCardSelect(card.id)}
              style={{
                width: '71px',
                height: '96px',
                borderRadius: '4px',
                border: isSelected ? '3px solid #f59e0b' : '1px solid #475569',
                cursor: 'pointer',
                transform: isSelected ? 'translateY(-16px)' : 'translateY(0)',
                transition: 'transform 0.15s ease, border 0.15s ease',
                backgroundColor: '#ffffff',
                backgroundImage: `url('/poker-cards.png')`,
                backgroundSize: '1500% 500%',
                backgroundPosition: `${xPercent}% ${yPercent}%`,
                imageRendering: 'pixelated',
              }}
            />
          );
        })}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
        <button
          onClick={playHand}
          disabled={selectedIds.length === 0 || handsRemaining <= 0 || gameOver || roundWon}
          style={{ padding: '12px 24px', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', opacity: selectedIds.length === 0 ? 0.5 : 1 }}
        >
          Play Hand ({selectedIds.length}/5)
        </button>

        <button
          onClick={discardCards}
          disabled={selectedIds.length === 0 || discardsRemaining <= 0 || gameOver || roundWon}
          style={{ padding: '12px 24px', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#e11d48', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', opacity: selectedIds.length === 0 || discardsRemaining <= 0 ? 0.5 : 1 }}
        >
          Discard ({discardsRemaining} Left)
        </button>
      </div>
    </div>
  );
};
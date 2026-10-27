import { useState, type ReactNode } from 'react';

export const GAME_TITLE = 'Card Game Title';

// Shared frame for every menu screen: big title on top, Credits button in the bottom-left corner
export default function MenuLayout({ children }: { children: ReactNode }) {
  const [showCredits, setShowCredits] = useState(false);

  return (
    <div className="menu-page">
      <h1 className="menu-title">{GAME_TITLE}</h1>
      <div className="menu-content">{children}</div>

      <button type="button" className="sketch-box credits-button" onClick={() => setShowCredits(true)}>
        Credits
      </button>

      {showCredits && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowCredits(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content sketch-box text-start">
              <div className="modal-header">
                <h5 className="modal-title">Credits</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowCredits(false)} />
              </div>
              <div className="modal-body">
                <p className="mb-0">COP 4331C Large Project, Fall 2026</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

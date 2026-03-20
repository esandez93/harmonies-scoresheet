import { useState } from 'react';
import {
  findUserByEmailOrUsername,
  createGameInvitation,
} from '../lib/invitationService';
import '../styles/invite-modal.css';

export const InvitePlayerModal = ({
  gameId,
  gameName,
  invitedByUsername,
  onInvitationSent,
  onClose,
}) => {
  const [step, setStep] = useState('input'); // input, confirm, success, error
  const [query, setQuery] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [emailForNewUser, setEmailForNewUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Handle search for existing user
  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter an email or username');
      return;
    }

    setLoading(true);
    setError('');
    setFoundUser(null);

    try {
      const user = await findUserByEmailOrUsername(query.trim());

      if (user) {
        // User found
        setFoundUser(user);
        setStep('confirm');
      } else {
        // User not found - go to email capture step
        // Check if query is already an email
        if (query.includes('@')) {
          setEmailForNewUser(query);
          setStep('confirm');
        } else {
          setStep('email-prompt');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle sending invitation
  const handleSendInvitation = async () => {
    if (!emailForNewUser && !foundUser) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await createGameInvitation(
        gameId,
        emailForNewUser || foundUser.email,
        invitedByUsername,
        gameName,
        foundUser?.username || query
      );

      if (result.success) {
        setSuccessMessage(
          `Invitation sent to ${emailForNewUser || foundUser.email}!`
        );
        setStep('success');
        setQuery('');
        setFoundUser(null);
        setEmailForNewUser('');

        if (onInvitationSent) {
          onInvitationSent();
        }

        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(result.error || 'Failed to send invitation');
        setStep('error');
      }
    } catch (err) {
      setError(err.message);
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        {step === 'input' && (
          <div className="modal-section">
            <h2>Invite Player to {gameName}</h2>
            <p className="modal-description">
              Enter a username or email address to invite a player
            </p>

            <div className="form-group">
              <label htmlFor="player-input">Username or Email</label>
              <input
                id="player-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
                placeholder="username or email@example.com"
                disabled={loading}
                autoFocus
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        )}

        {step === 'email-prompt' && (
          <div className="modal-section">
            <h2>Email Required</h2>
            <p className="modal-description">
              The username "{query}" was not found. To send an invitation, we
              need the player's email address so we can create their account.
            </p>

            <div className="form-group">
              <label htmlFor="email-input">Email Address</label>
              <input
                id="email-input"
                type="email"
                value={emailForNewUser}
                onChange={(e) => setEmailForNewUser(e.target.value)}
                placeholder="player@example.com"
                disabled={loading}
                autoFocus
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  setStep('input');
                  setQuery('');
                  setError('');
                }}
                disabled={loading}
              >
                Back
              </button>
              <button
                className="btn-primary"
                onClick={handleSendInvitation}
                disabled={loading || !emailForNewUser}
              >
                {loading ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="modal-section">
            <h2>Confirm Invitation</h2>

            {foundUser ? (
              <>
                <div className="user-card">
                  <div className="user-info">
                    <p className="user-name">@{foundUser.username}</p>
                    <p className="user-email">{foundUser.email}</p>
                  </div>
                </div>
                <p className="modal-description">
                  Invite {foundUser.display_name || foundUser.username} to
                  play?
                </p>
              </>
            ) : (
              <>
                <p className="modal-description">
                  A new account will be created for:
                </p>
                <div className="user-card">
                  <p className="user-email">{emailForNewUser}</p>
                </div>
                <p className="modal-description modal-description-small">
                  They'll receive an email with instructions to set up their
                  account and join the game.
                </p>
              </>
            )}

            {error && <div className="error-message">{error}</div>}

            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  setStep('input');
                  setFoundUser(null);
                  setEmailForNewUser('');
                  setError('');
                }}
                disabled={loading}
              >
                Back
              </button>
              <button
                className="btn-primary"
                onClick={handleSendInvitation}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="modal-section modal-success">
            <div className="success-icon">✓</div>
            <h2>Invitation Sent!</h2>
            <p className="modal-description">{successMessage}</p>
            <p className="modal-description modal-description-small">
              They'll receive an email shortly with a link to join the game.
            </p>

            <div className="modal-actions">
              <button className="btn-primary" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="modal-section modal-error">
            <div className="error-icon">⚠</div>
            <h2>Something went wrong</h2>
            <p className="modal-description">{error}</p>

            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  setStep('input');
                  setFoundUser(null);
                  setEmailForNewUser('');
                  setError('');
                  setQuery('');
                }}
              >
                Try Again
              </button>
              <button className="btn-primary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

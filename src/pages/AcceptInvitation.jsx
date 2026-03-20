import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInvitationByToken, acceptInvitation } from '../lib/invitationService';
import '../styles/accept-invitation.css';

export const AcceptInvitation = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false);

  useEffect(() => {
    const loadInvitation = async () => {
      try {
        const inv = await getInvitationByToken(token);
        if (!inv) {
          setError(
            'Invitation not found or has expired. Please ask for a new invitation.'
          );
        } else {
          setInvitation(inv);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadInvitation();
  }, [token]);

  // Auto-accept if user is logged in
  useEffect(() => {
    let isMounted = true;

    const handleAutoAccept = async () => {
      if (!authLoading && user && invitation) {
        if (!isMounted) return;
        setAccepting(true);
        setError('');

        try {
          const result = await acceptInvitation(invitation.id);
          if (isMounted) {
            if (result.success) {
              // Redirect to the game
              setTimeout(() => {
                if (isMounted) navigate(`/game/${result.gameId}`);
              }, 1500);
            } else {
              setError(result.error || 'Failed to accept invitation');
            }
          }
        } catch (err) {
          if (isMounted) setError(err.message);
        } finally {
          if (isMounted) setAccepting(false);
        }
      } else if (!authLoading && !user && invitation) {
        if (isMounted) setShowSignUpPrompt(true);
      }
    };

    handleAutoAccept();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading, invitation, navigate]);

  if (loading) {
    return (
      <div className="accept-invitation-page">
        <div className="invitation-container">
          <div className="loading">Loading invitation...</div>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="accept-invitation-page">
        <div className="invitation-container invitation-error">
          <div className="error-icon">⚠</div>
          <h1>Invalid Invitation</h1>
          <p className="error-message">{error}</p>
          <button
            className="btn-primary"
            onClick={() => navigate('/')}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="accept-invitation-page">
      <div className="invitation-container">
        {accepting ? (
          <>
            <div className="loading-icon">⏳</div>
            <h1>Accepting invitation...</h1>
            <p>Redirecting to game...</p>
          </>
        ) : user ? (
          <>
            <div className="success-icon">✓</div>
            <h1>Invitation Accepted!</h1>
            <p className="invitation-info">
              You've been added to <strong>{invitation.games?.name || 'the game'}</strong>
            </p>
            <p className="invitation-redirect">
              Redirecting to the game...
            </p>
          </>
        ) : showSignUpPrompt ? (
          <>
            <div className="invite-icon">🎮</div>
            <h1>You're Invited!</h1>
            <p className="invitation-info">
              <strong>
                {invitation.user_profiles?.username || 'A friend'}
                {invitation.user_profiles?.email && ` (${invitation.user_profiles.email})`}
              </strong>{' '}
              has invited you to play <strong>{invitation.games?.name || 'a game'}</strong> in
              Harmonies Scoresheet!
            </p>

            <div className="invitation-actions">
              <button
                className="btn-primary"
                onClick={() => navigate('/signup')}
              >
                Create Account & Join
              </button>
              <p className="or-text">or</p>
              <button
                className="btn-secondary"
                onClick={() => navigate('/login')}
              >
                Sign In to Your Account
              </button>
            </div>

            <p className="invitation-email">
              This invitation was sent to: <strong>{invitation.invited_email}</strong>
            </p>
          </>
        ) : null}

        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};

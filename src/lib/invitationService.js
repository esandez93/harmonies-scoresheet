import { supabase } from './supabase';

/**
 * Genera un token seguro para la invitación
 */
const generateToken = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

/**
 * Busca un usuario por email o username
 * @param {string} query - Email o username a buscar
 * @returns {Promise<Object|null>} Usuario encontrado o null
 */
export const findUserByEmailOrUsername = async (query) => {
  try {
    const lowerQuery = query.toLowerCase().trim();

    // Primero intenta buscar por email (exacto, case-insensitive)
    const { data: userByEmail, error: emailError } = await supabase
      .from('user_profiles')
      .select('id, username, email, display_name')
      .eq('email', lowerQuery)
      .single();

    if (userByEmail && !emailError) {
      return userByEmail;
    }

    // Si no encuentra por email, busca todos los usuarios y filtra por username (case-insensitive)
    const { data: allUsers, error: allUsersError } = await supabase
      .from('user_profiles')
      .select('id, username, email, display_name');

    if (!allUsersError && allUsers) {
      const foundUser = allUsers.find(
        (u) => u.username.toLowerCase() === lowerQuery
      );
      if (foundUser) {
        return foundUser;
      }
    }

    // Si no encuentra nada, devuelve null
    return null;
  } catch (error) {
    console.error('Error searching for user:', error);
    return null;
  }
};

/**
 * Crea una invitación a un juego
 * @param {string} gameId - ID del juego
 * @param {string} invitedEmail - Email del invitado
 * @param {string} invitedByUsername - Username de quien invita
 * @param {string} gameTitle - Nombre del juego
 * @param {string} invitedUsername - Username del invitado (si existe)
 * @returns {Promise<Object>} Token de invitación o error
 */
export const createGameInvitation = async (
  gameId,
  invitedEmail,
  invitedByUsername,
  gameTitle,
  invitedUsername
) => {
  try {
    const token = generateToken();
    const userId = (await supabase.auth.getUser()).data.user.id;

    // Buscar el ID del usuario invitado si existe
    let invitedUserId = null;
    let actualUsername = invitedUsername;

    if (invitedUsername) {
      const user = await findUserByEmailOrUsername(invitedUsername);
      if (user) {
        // Set the user ID for stricter RLS matching
        invitedUserId = user.id;
        invitedEmail = user.email;
        actualUsername = user.username;
      }
    }

    // Crear registro de invitación
    const invitationData = {
      game_id: gameId,
      invited_by: userId,
      invited_email: invitedEmail.toLowerCase(),
      invited_username: actualUsername,
      invited_user_id: invitedUserId, // Set if user found, NULL for email-only invites
      token,
    };

    const { error: invError } = await supabase
      .from('game_invitations')
      .insert(invitationData);

    if (invError) throw invError;

    // Use the data we sent instead of trying to select it back
    const invitation = invitationData;

    // Llamar a la Edge Function para enviar email
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      if (!supabaseUrl) {
        throw new Error('Missing Supabase URL');
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/send_game_invitation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gameId,
            invitedEmail: invitedEmail.toLowerCase(),
            invitedUsername: actualUsername || null,
            gameTitle,
            invitedByUsername,
            invitationToken: token,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Email send failed: ${response.statusText}`);
      }
    } catch (emailError) {
      // Si el email falla, eliminar la invitación
      await supabase
        .from('game_invitations')
        .delete()
        .eq('id', invitation.id);
      throw emailError;
    }

    return {
      success: true,
      invitation,
      message: `Invitation sent to ${invitedEmail}`,
    };
  } catch (error) {
    console.error('Error creating invitation:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Obtiene los detalles de una invitación usando el token
 * @param {string} token - Token de invitación
 * @returns {Promise<Object|null>} Detalles de la invitación o null
 */
export const getInvitationByToken = async (token) => {
  try {
    const { data: invitations, error } = await supabase
      .from('game_invitations')
      .select('*, games(id, name, user_id)')
      .eq('token', token)
      .eq('status', 'pending');

    if (error) throw error;
    if (!invitations || invitations.length === 0) {
      return null;
    }

    const invitation = invitations[0];

    // Verificar que no ha expirado
    if (new Date(invitation.expires_at) < new Date()) {
      return null;
    }

    // Fetch the inviter's profile separately
    const { data: inviterProfile, error: inviterError } = await supabase
      .from('user_profiles')
      .select('username, email, display_name')
      .eq('id', invitation.invited_by)
      .single();

    if (inviterProfile && !inviterError) {
      invitation.user_profiles = inviterProfile;
    }

    return invitation;
  } catch (error) {
    console.error('Error getting invitation:', error);
    return null;
  }
};

/**
 * Acepta una invitación
 * @param {string} invitationId - ID de la invitación
 * @returns {Promise<Object>} Resultado de aceptación
 */
export const acceptInvitation = async (invitationId) => {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');

    const { data: invitation, error: getError } = await supabase
      .from('game_invitations')
      .select('*')
      .eq('id', invitationId);

    if (getError) throw getError;
    if (!invitation || invitation.length === 0) {
      throw new Error('Invitation not found');
    }

    const inv = invitation[0];

    // Verificar que la invitación sea para este usuario (por email o ID)
    if (
      inv.invited_user_id !== user.id &&
      inv.invited_email.toLowerCase() !== user.email.toLowerCase()
    ) {
      throw new Error('This invitation is not for you');
    }

    // Actualizar invitación (set user_id si es nuevo, y marcar como aceptada)
    const { error: updateError } = await supabase
      .from('game_invitations')
      .update({
        status: 'accepted',
        invited_user_id: user.id,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitationId);

    if (updateError) throw updateError;

    // Fetch user's username
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    // Insert player into game. The database UNIQUE constraint will prevent duplicates.
    // If duplicate, the constraint error is expected and we'll ignore it.
    const { error: playerError } = await supabase
      .from('game_players')
      .insert([
        {
          game_id: inv.game_id,
          player_name: userProfile.username,
          user_id: user.id,
        },
      ]);

    // Ignore duplicate key violation error (player already exists)
    if (playerError && !playerError.message.includes('unique constraint')) {
      console.error('Failed to insert player:', playerError);
      throw new Error(`Failed to add you to the game: ${playerError.message}`);
    }

    return {
      success: true,
      gameId: inv.game_id,
    };
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Obtiene todas las invitaciones pendientes del usuario actual
 * @returns {Promise<Array>} Lista de invitaciones
 */
export const getPendingInvitations = async () => {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return [];

    const { data: invitations, error } = await supabase
      .from('game_invitations')
      .select('*, games(id, name)')
      .eq('status', 'pending')
      .or(
        `invited_user_id.eq.${user.id},invited_email.eq.${user.email}`
      )
      .order('created_at', { ascending: false });

    if (error) throw error;
    return invitations || [];
  } catch (error) {
    console.error('Error getting pending invitations:', error);
    return [];
  }
};

/**
 * Rechaza una invitación
 * @param {string} invitationId - ID de la invitación
 * @returns {Promise<Object>} Resultado del rechazo
 */
export const rejectInvitation = async (invitationId) => {
  try {
    const { error } = await supabase
      .from('game_invitations')
      .update({ status: 'declined' })
      .eq('id', invitationId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error rejecting invitation:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

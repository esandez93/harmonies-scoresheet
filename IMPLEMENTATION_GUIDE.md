# Sistema de Invitaciones - Guía de Implementación Completa

## 📋 Resumen

Se ha implementado un sistema completo de invitaciones para permitir que los jugadores inviten a otros usuarios a sus juegos. El sistema maneja tres casos:

1. **Usuario existente**: Se envía un email con un link de invitación
2. **Usuario no encontrado con username**: Se pide el email y se envía invitación
3. **Email no encontrado**: Se envía invitación para crear nueva cuenta

## 🔧 Componentes Implementados

### 1. Base de Datos (Supabase)

**Archivos de documentación:**
- [SETUP_INVITATIONS.md](SETUP_INVITATIONS.md) - Scripts SQL
- [EDGE_FUNCTION_SETUP.md](EDGE_FUNCTION_SETUP.md) - Edge Function para emails

**Tablas creadas:**
- `user_profiles` - Perfil de usuario con username
- `game_invitations` - Registro de invitaciones

**🎯 Creación Automática de Perfiles:**

El SQL incluye un trigger (`on_auth_user_created`) que:
- ✅ Crea perfil automáticamente cuando un usuario se registra
- ✅ Genera username único basado en el email si no se proporciona
- ✅ Funciona para usuarios creados en la app O en Supabase
- ✅ Si el usuario se creó manualmente en Supabase antes, el SQL crea perfiles para usuarios existentes

Esto significa que **no necesitas crear perfiles manualmente** - se crea automático.

### 2. Servicios Backend (`src/lib/`)

#### `invitationService.js`
Funciones para manejar invitaciones:
- `findUserByEmailOrUsername()` - Buscar usuario
- `createGameInvitation()` - Crear invitación y enviar email
- `getInvitationByToken()` - Obtener detalles de invitación
- `acceptInvitation()` - Aceptar invitación
- `getPendingInvitations()` - Listar invitaciones pendientes
- `rejectInvitation()` - Rechazar invitación

### 3. Componentes Frontend (`src/components/`)

#### `InvitePlayerModal.jsx`
Modal para invitar jugadores con flujo de 4 pasos:
1. Búsqueda (email/username)
2. Captura de email si no existe usuario
3. Confirmación
4. Éxito/Error

### 4. Páginas (`src/pages/`)

#### `AcceptInvitation.jsx`
Página pública para aceptar invitaciones:
- Valida token de invitación
- Auto-acepta si usuario está autenticado
- Muestra opciones de login/signup para nuevos usuarios
- Redirige al juego automáticamente

#### `SignUp.jsx` (Actualizado)
- Nuevo campo de username obligatorio
- Validación: 3-20 caracteres, solo letras, números, guiones bajos

### 5. Contexto Actualizado (`src/context/`)

#### `AuthContext.jsx` (Actualizado)
- Función `signUp()` ahora crea perfil en `user_profiles`
- Incluye username en el perfil

### 6. Estilos (`src/styles/`)

- `invite-modal.css` - Estilos del modal
- `accept-invitation.css` - Estilos de página de invitación
- `auth.css` - Actualizado con hints para username
- `game-detail.css` - Botón de invitar

### 7. Rutas (`src/App.jsx`)

Nueva ruta:
```javascript
<Route path="/invite/:token" element={<AcceptInvitation />} />
```

## 🚀 Pasos de Implementación

### Paso 1: Configurar Base de Datos

1. Abre tu proyecto de Supabase
2. Ve a **SQL Editor**
3. Crea una nueva query
4. Copia el SQL de `SETUP_INVITATIONS.md`
5. Ejecuta (Cmd/Ctrl + Enter)

### Paso 2: Crear Edge Function

1. En Supabase, ve a **Edge Functions**
2. Crea función llamada `send_game_invitation`
3. Copia el código de `EDGE_FUNCTION_SETUP.md`
4. Configura variabl de entorno `APP_URL` (tu dominio de Vercel)

### Paso 3: Testear Localmente

```bash
# Instala dependencias si no las tienes
npm install

# Inicia el servidor
npm run dev
```

### Paso 4: Flujo de Prueba

1. **Crear cuenta nueva**:
   - Ve a `/signup`
   - Ingresa: username, email, password
   - Verifica que se cree perfil en `user_profiles`

2. **Invitar usuario existente**:
   - En un juego, click "Invite Player"
   - Busca por username o email
   - Confirma invitación
   - Verifica que se envíe email (revisa Edge Function logs)

3. **Invitar nuevo usuario**:
   - En un juego, click "Invite Player"
   - Ingresa username que no exista
   - Proporciona email
   - Verifica invitación por email

4. **Aceptar invitación**:
   - Usuario recibe email con link `/invite/:token`
   - Si está logueado → auto-acepta y va al juego
   - Si no → muestra opciones login/signup

## 📧 Emails

### Estructura de Email

**Para usuario existente:**
```
Asunto: "You're invited to play Harmonies!"
Cuerpo: Mensaje personalizado con link de invitación
```

**Para nuevo usuario:**
```
Asunto: "Join us in Harmonies!"
Cuerpo: Explicación + mensaje personalizado + link
```

### Personalización

Los emails se generan en la Edge Function. Para cambiar:
1. Va a Supabase > Edge Functions > `send_game_invitation`
2. Modifica funciones `buildFoundUserEmail()` o `buildNewUserEmail()`
3. Redeploy

## 🔐 Seguridad

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado:

**user_profiles:**
- Usuarios ven su propio perfil
- Anyone puede ver usernames (para búsqueda)

**game_invitations:**
- Usuarios ven invitaciones dirigidas a ellos
- Usuarios ven invitaciones que enviaron
- Solo el propietario del juego puede invitar

### Validación

- Tokens de invitación son únicos
- Invitaciones expiran en 30 días
- Username: solo letras, números, guiones bajos

## 🌐 Despliegue a Producción

### 1. Variables de Entorno

Asegúrate que `.env.local` tiene:
```
VITE_SUPABASE_URL=tu_url
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

### 2. Edge Function APP_URL

En Supabase > Edge Functions > `send_game_invitation`, configura:
```
APP_URL = https://tu-dominio.vercel.app
```

### 3. Vercel Deployment

```bash
# Push a GitHub si usas Vercel conectado
git push origin main

# O deploy directamente
vercel deploy --prod
```

### 4. Verificar

Después del deploy:
1. Accede a `https://tu-dominio.vercel.app`
2. Prueba todo el flujo de invitación
3. Revisa logs en Supabase > Edge Functions

## 📊 Estructura de Datos

### user_profiles
```sql
id (UUID) - Referencias auth.users
username (TEXT UNIQUE) - Identificador único
display_name (TEXT) - Nombre a mostrar
email (TEXT) - Email del usuario
created_at, updated_at
```

### game_invitations
```sql
id (UUID) - ID único
game_id (UUID) - Referencia a games
invited_by (UUID) - Usuario que invita
invited_email (TEXT) - Email del invitado
invited_username (TEXT) - Username del invitado
invited_user_id (UUID) - ID si usuario existe
status (TEXT) - pending/accepted/declined
token (TEXT UNIQUE) - Link token
created_at, expires_at, accepted_at
```

## 🐛 Troubleshooting

### "User not found" al crear invitación
- Verifica que user_profiles fue creado correctamente
- Revisa que el usuario buscado tiene un perfil

### Email no enviado
- Revisa Edge Function en Supabase > Functions
- Verifica variable `APP_URL` está configurada
- Revisa autenticación de Supabase Auth

### Token expirado al aceptar
- Los tokens expiran en 30 días
- Crea una nueva invitación

### Username duplicado al signup
- Los usernames son únicos (UNIQUE constraint)
- Pide al usuario que elija otro

## 📝 Próximas Mejoras Posibles

- [ ] Revocar invitaciones
- [ ] Reenviar invitación
- [ ] Panel de invitaciones pendientes
- [ ] Notificaciones en-app cuando alguien acepta
- [ ] Historial de jugadores en el juego
- [ ] Eliminar jugadores de un juego

## 📚 Referencias

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [React Router](https://reactrouter.com/)

# Setup de Sistema de Invitaciones

Este documento contiene los scripts SQL necesarios para configurar el sistema de invitaciones de jugadores.

## Instrucciones

1. Ve a tu proyecto de Supabase en https://app.supabase.com
2. Abre el **SQL Editor**
3. Crea una nueva query
4. Copia y pega el SQL de abajo
5. Ejecuta (Cmd/Ctrl + Enter)

## SQL Setup

```sql
-- 1. Crear tabla user_profiles para almacenar usernames y datos de usuario
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  email TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Crear tabla game_invitations para rastrear invitaciones
CREATE TABLE IF NOT EXISTS game_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_username TEXT,
  invited_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending', -- pending, accepted, declined
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days'),
  accepted_at TIMESTAMP
);

-- 3. Habilitar RLS en user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas RLS para user_profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can view usernames"
  ON user_profiles FOR SELECT
  USING (true);

-- 5. Habilitar RLS en game_invitations
ALTER TABLE game_invitations ENABLE ROW LEVEL SECURITY;

-- 6. Crear políticas RLS para game_invitations
CREATE POLICY "Anyone can view pending invitations"
  ON game_invitations FOR SELECT
  USING (status = 'pending');

CREATE POLICY "Users can view invitations they created"
  ON game_invitations FOR SELECT
  USING (invited_by = auth.uid());

CREATE POLICY "Users can create invitations"
  ON game_invitations FOR INSERT
  WITH CHECK (invited_by = auth.uid());

CREATE POLICY "Users can accept unassigned invitations"
  ON game_invitations FOR UPDATE
  USING (invited_user_id IS NULL OR invited_user_id = auth.uid());

-- 7. Crear políticas RLS para games (necesarias para que los joins funcionen con invitaciones)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view games" ON games;
DROP POLICY IF EXISTS "Users can create games" ON games;
DROP POLICY IF EXISTS "Users can update their own games" ON games;
DROP POLICY IF EXISTS "Users can delete their own games" ON games;

-- Cualquiera puede ver cualquier juego (necesario para que los invitados puedan ver detalles del juego invitado)
CREATE POLICY "Anyone can view games"
  ON games FOR SELECT
  USING (true);

-- Solo el propietario puede crear juegos
CREATE POLICY "Users can create games"
  ON games FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Solo el propietario puede actualizar su juego
CREATE POLICY "Users can update their own games"
  ON games FOR UPDATE
  USING (user_id = auth.uid());

-- Solo el propietario puede eliminar su juego
CREATE POLICY "Users can delete their own games"
  ON games FOR DELETE
  USING (user_id = auth.uid());

-- 8. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_game_invitations_game_id ON game_invitations(game_id);
CREATE INDEX IF NOT EXISTS idx_game_invitations_invited_email ON game_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_game_invitations_invited_user_id ON game_invitations(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_game_invitations_status ON game_invitations(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- 9. Crear función que genera username desde email
CREATE OR REPLACE FUNCTION generate_username_from_email(email TEXT)
RETURNS TEXT AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INT := 1;
BEGIN
  -- Toma la parte del email antes del @
  base_username := SPLIT_PART(email, '@', 1);

  final_username := base_username;

  -- Si el username ya existe, añade un número
  WHILE EXISTS(SELECT 1 FROM user_profiles WHERE LOWER(username) = LOWER(final_username)) LOOP
    final_username := base_username || counter;
    counter := counter + 1;
  END LOOP;

  RETURN final_username;
END;
$$ LANGUAGE plpgsql;

-- 9. Crear función para crear perfil cuando nuevo usuario se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  generated_username TEXT;
BEGIN
  -- Usa el username del raw_user_meta_data si está disponible
  IF NEW.raw_user_meta_data->>'username' IS NOT NULL THEN
    INSERT INTO public.user_profiles (id, username, email, display_name)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'username',
      NEW.email,
      NEW.raw_user_meta_data->>'display_name'
    );
  ELSE
    -- Genera username del email como fallback
    generated_username := generate_username_from_email(NEW.email);
    INSERT INTO public.user_profiles (id, username, email)
    VALUES (NEW.id, generated_username, NEW.email);
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Si hay error (ej: username duplicado), log pero no falla
  RAISE WARNING 'Error creating user profile for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Crear trigger que llame la función cuando se crea usuario en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. Crear perfiles para usuarios existentes que no tienen perfil
INSERT INTO user_profiles (id, username, email)
SELECT
  id,
  generate_username_from_email(email),
  email
FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles)
ON CONFLICT (id) DO NOTHING;
```

## ✨ Qué incluye este SQL

✅ **Tablas**: `user_profiles` y `game_invitations`
✅ **RLS Policies**: Seguridad en el acceso a datos
✅ **Índices**: Performance optimizado
✅ **Triggers Automáticos**: Crea perfil cuando se registra usuario
✅ **Generación de Usernames**: Auto-genera si no se proporciona
✅ **Perfiles de Usuarios Existentes**: Crea perfiles para usuarios ya registrados

## Verificación

Después de ejecutar los scripts, puedes verificar que todo se creó correctamente:

1. Ve a la sección **Tables** en Supabase
2. Deberías ver:
   - `user_profiles` - Con todos los usuarios (existentes + nuevos)
   - `game_invitations` - Vacía pero lista para usar
   - `games` - Ya existente

3. Ve a **Database** > **Functions** para verificar:
   - `generate_username_from_email()`
   - `handle_new_user()`

4. Ve a **Database** > **Triggers** para verificar:
   - `on_auth_user_created` - En la tabla `auth.users`

## Próximos pasos

1. Crear la Edge Function para enviar emails (ver [EDGE_FUNCTION_SETUP.md](EDGE_FUNCTION_SETUP.md))
2. Actualizar el código del frontend (ver archivos en src/)

# Fix para Crear Perfiles Automáticamente

Cuando los usuarios se registran (incluso manualmente en Supabase), sus perfiles deben crearse automáticamente.

## SQL a Ejecutar en Supabase

Copia y pega esto en **SQL Editor** de Supabase:

```sql
-- 1. Crear función que genera username desde email
CREATE OR REPLACE FUNCTION generate_username_from_email(email TEXT)
RETURNS TEXT AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INT := 1;
BEGIN
  -- Toma la parte del email antes del @
  base_username := LOWER(SPLIT_PART(email, '@', 1));

  -- Reemplaza puntos y caracteres especiales
  base_username := REGEXP_REPLACE(base_username, '[^a-z0-9_]', '_', 'g');

  final_username := base_username;

  -- Si el username ya existe, añade un número
  WHILE EXISTS(SELECT 1 FROM user_profiles WHERE username = final_username) LOOP
    final_username := base_username || '_' || counter;
    counter := counter + 1;
  END LOOP;

  RETURN final_username;
END;
$$ LANGUAGE plpgsql;

-- 2. Crear función para crear perfil cuando nuevo usuario se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  generated_username TEXT;
BEGIN
  -- Si no tiene username en raw_user_meta_data, genera uno del email
  IF NEW.raw_user_meta_data->>'username' IS NOT NULL THEN
    INSERT INTO public.user_profiles (id, username, email, display_name)
    VALUES (
      NEW.id,
      LOWER(NEW.raw_user_meta_data->>'username'),
      NEW.email,
      NEW.raw_user_meta_data->>'display_name'
    );
  ELSE
    -- Genera username del email
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

-- 3. Crear trigger que llame la función cuando se crea usuario en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Crear perfiles para usuarios existentes que no tienen profil
INSERT INTO user_profiles (id, username, email)
SELECT
  id,
  LOWER(SPLIT_PART(email, '@', 1) || '_' || RIGHT(id::TEXT, 4)),
  email
FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles)
ON CONFLICT (id) DO NOTHING;
```

## Qué hace este SQL:

1. **Función `generate_username_from_email()`**: Genera un username único basado en el email
2. **Función `handle_new_user()`**: Se ejecuta automáticamente cuando se crea un usuario
3. **Trigger `on_auth_user_created`**: Llama a la función anterior
4. **INSERT**: Crea perfiles para usuarios existentes sin perfil

## Resultado:

✅ Nuevos usuarios creados en Supabase → Perfil automático creado
✅ Usuarios manuales existentes → Se crean perfiles automáticamente
✅ Búsqueda de usuarios funciona correctamente

---

## Próximos Pasos:

1. Ejecuta el SQL arriba
2. Los usuarios existentes tendrán perfiles con username generado
3. Intenta invitar nuevamente usando el username

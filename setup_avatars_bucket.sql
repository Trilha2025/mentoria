-- Script para criar o bucket de avatars no Supabase Storage
-- Execute este comando no SQL Editor do seu projeto Supabase

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Liberar acesso de leitura pública (Read)
CREATE POLICY "Avatar Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Liberar upload para usuários autenticados (Insert/Update)
CREATE POLICY "Avatar Upload Access" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Avatar Update Access" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars');

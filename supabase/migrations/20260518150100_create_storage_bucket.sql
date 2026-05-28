-- Criar o bucket property-images se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Criar política para permitir uploads públicos
CREATE POLICY "Allow public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Allow authenticated upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'property-images');

CREATE POLICY "Allow delete own uploads" ON storage.objects
  FOR DELETE USING (bucket_id = 'property-images');

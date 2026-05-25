-- =======================================================
-- ELIGE TU FUTURO — Esquema de Base de Datos para Supabase
-- Copia y pega este script en el SQL Editor de tu proyecto
-- =======================================================

-- 1. Eliminar tablas previas si existen (para empezar limpio si es necesario)
DROP TABLE IF EXISTS consultas;
DROP TABLE IF EXISTS instituciones;

-- 2. Crear tabla instituciones
CREATE TABLE instituciones (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    sigla TEXT,
    tipo TEXT DEFAULT 'Universidad', -- 'Universidad' o 'Instituto'
    ubicacion TEXT DEFAULT 'Santa Cruz de la Sierra',
    descripcion TEXT,
    telefono TEXT,
    email TEXT,
    web TEXT,
    link_resenas TEXT,
    costo_mensual NUMERIC DEFAULT 0,
    costo_inscripcion NUMERIC DEFAULT 0,
    carreras JSONB DEFAULT '[]'::jsonb, -- Almacenará la lista de carreras
    becas BOOLEAN DEFAULT FALSE,
    modalidad TEXT DEFAULT 'Presencial', -- 'Presencial', 'Virtual', 'Semi-presencial'
    acreditacion TEXT,
    tags TEXT[] DEFAULT '{}'::text[], -- Array de etiquetas de texto
    valoracion NUMERIC DEFAULT 4.0,
    num_resenas INTEGER DEFAULT 0
);

-- 3. Habilitar RLS para instituciones
ALTER TABLE instituciones ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas públicas de acceso para instituciones
-- Permitir lectura pública a cualquiera
CREATE POLICY "Permitir lectura pública de instituciones" 
ON instituciones FOR SELECT 
USING (true);

-- Permitir escritura pública (inserción, actualización, eliminación) para desarrollo/frontend estático
-- NOTA: En producción, restringirías esto a usuarios autenticados.
CREATE POLICY "Permitir inserción pública de instituciones" 
ON instituciones FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir actualización pública de instituciones" 
ON instituciones FOR UPDATE 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Permitir eliminación pública de instituciones" 
ON instituciones FOR DELETE 
USING (true);


-- 5. Crear tabla consultas
CREATE TABLE consultas (
    id SERIAL PRIMARY KEY,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    nombre TEXT NOT NULL,
    telefono TEXT NOT NULL,
    email TEXT,
    institucion TEXT,
    carrera TEXT,
    mensaje TEXT NOT NULL,
    consentimiento BOOLEAN DEFAULT TRUE
);

-- 6. Habilitar RLS para consultas
ALTER TABLE consultas ENABLE ROW LEVEL SECURITY;

-- 7. Crear políticas públicas para consultas
CREATE POLICY "Permitir envío de consultas público" 
ON consultas FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir ver consultas público" 
ON consultas FOR SELECT 
USING (true);

CREATE POLICY "Permitir eliminación de consultas pública" 
ON consultas FOR DELETE 
USING (true);

-- 8. Insertar datos semilla iniciales de las instituciones (basado en fallback)
INSERT INTO instituciones (nombre, sigla, tipo, ubicacion, descripcion, telefono, email, web, link_resenas, costo_mensual, costo_inscripcion, carreras, becas, modalidad, acreditacion, tags, valoracion, num_resenas)
VALUES 
(
    'Universidad Autónoma Gabriel René Moreno', 
    'UAGRM', 
    'Universidad', 
    'Santa Cruz de la Sierra', 
    'La universidad pública más grande de Bolivia y del oriente boliviano, con más de 80 años formando profesionales en todas las áreas del conocimiento.',
    '+591 3 336-6000', 
    'informaciones@uagrm.edu.bo', 
    'https://www.uagrm.edu.bo', 
    '', 
    0, 
    0, 
    '[
        {"nombre": "Medicina", "duracion": "6 años", "area": "Salud"},
        {"nombre": "Derecho", "duracion": "5 años", "area": "Jurídica"},
        {"nombre": "Ingeniería Civil", "duracion": "5 años", "area": "Ingeniería"},
        {"nombre": "Administración de Empresas", "duracion": "5 años", "area": "Negocios"},
        {"nombre": "Ingeniería Informática", "duracion": "5 años", "area": "Tecnología"},
        {"nombre": "Enfermería", "duracion": "4 años", "area": "Salud"},
        {"nombre": "Contaduría Pública", "duracion": "5 años", "area": "Negocios"},
        {"nombre": "Veterinaria", "duracion": "5 años", "area": "Salud"},
        {"nombre": "Arquitectura", "duracion": "5 años", "area": "Creativo"}
    ]'::jsonb,
    FALSE, 
    'Presencial', 
    'CEUB', 
    ARRAY['pública', 'gratuita', 'presencial'], 
    4.2, 
    148
),
(
    'Universidad Privada de Santa Cruz de la Sierra', 
    'UPSA', 
    'Universidad', 
    'Santa Cruz de la Sierra', 
    'Una de las universidades privadas más reconocidas de Bolivia, con enfoque en calidad académica, investigación y vínculos empresariales.',
    '+591 3 346-4000', 
    'informacion@upsa.edu.bo', 
    'https://www.upsa.edu.bo', 
    '', 
    1200, 
    500, 
    '[
        {"nombre": "Ingeniería Industrial", "duracion": "5 años", "area": "Ingeniería"},
        {"nombre": "Administración de Empresas", "duracion": "5 años", "area": "Negocios"},
        {"nombre": "Medicina", "duracion": "6 años", "area": "Salud"},
        {"nombre": "Arquitectura", "duracion": "5 años", "area": "Creativo"},
        {"nombre": "Ingeniería de Sistemas", "duracion": "5 años", "area": "Tecnología"},
        {"nombre": "Psicología", "duracion": "5 años", "area": "Social"},
        {"nombre": "Marketing", "duracion": "4 años", "area": "Negocios"},
        {"nombre": "Diseño Gráfico", "duracion": "4 años", "area": "Creativo"}
    ]'::jsonb,
    TRUE, 
    'Presencial', 
    'CEUB', 
    ARRAY['privada', 'presencial', 'becas'], 
    4.5, 
    203
),
(
    'Universidad Católica Boliviana', 
    'UCB', 
    'Universidad', 
    'Santa Cruz de la Sierra', 
    'Institución con valores humanistas reconocida por su calidad en ciencias sociales, humanidades y derecho.',
    '+591 3 343-5555', 
    'secretaria@ucbscz.edu.bo', 
    'https://www.ucbscz.edu.bo', 
    '', 
    1500, 
    600, 
    '[
        {"nombre": "Derecho", "duracion": "5 años", "area": "Jurídica"},
        {"nombre": "Comunicación Social", "duracion": "5 años", "area": "Social"},
        {"nombre": "Administración de Empresas", "duracion": "5 años", "area": "Negocios"},
        {"nombre": "Psicología", "duracion": "5 años", "area": "Social"},
        {"nombre": "Ingeniería Civil", "duracion": "5 años", "area": "Ingeniería"},
        {"nombre": "Economía", "duracion": "5 años", "area": "Negocios"}
    ]'::jsonb,
    TRUE, 
    'Presencial', 
    'CEUB', 
    ARRAY['privada', 'presencial', 'becas', 'humanidades'], 
    4.3, 
    167
),
(
    'Universidad Cristiana de Bolivia', 
    'UCEBOL', 
    'Universidad', 
    'Santa Cruz de la Sierra', 
    'Universidad privada con enfoque en valores cristianos, ofreciendo carreras a precios accesibles para estudiantes bolivianos.',
    '+591 3 370-0200', 
    'info@ucebol.edu.bo', 
    'https://www.ucebol.edu.bo', 
    '', 
    800, 
    300, 
    '[
        {"nombre": "Administración de Empresas", "duracion": "5 años", "area": "Negocios"},
        {"nombre": "Contaduría Pública", "duracion": "5 años", "area": "Negocios"},
        {"nombre": "Psicología", "duracion": "5 años", "area": "Social"},
        {"nombre": "Derecho", "duracion": "5 años", "area": "Jurídica"},
        {"nombre": "Trabajo Social", "duracion": "4 años", "area": "Social"}
    ]'::jsonb,
    TRUE, 
    'Presencial', 
    'CEUB', 
    ARRAY['privada', 'presencial', 'económica', 'becas'], 
    3.9, 
    89
),
(
    'Universidad Tecnológica Privada de Santa Cruz', 
    'UTEPSA', 
    'Universidad', 
    'Santa Cruz de la Sierra', 
    'Universidad especializada en ciencias tecnológicas y empresariales con enfoque práctico y orientado al mercado laboral.',
    '+591 3 340-4040', 
    'informaciones@utepsa.edu', 
    'https://www.utepsa.edu', 
    '', 
    950, 
    400, 
    '[
        {"nombre": "Ingeniería de Sistemas", "duracion": "5 años", "area": "Tecnología"},
        {"nombre": "Ingeniería Industrial", "duracion": "5 años", "area": "Ingeniería"},
        {"nombre": "Administración de Empresas", "duracion": "4 años", "area": "Negocios"},
        {"nombre": "Contaduría Pública", "duracion": "4 años", "area": "Negocios"},
        {"nombre": "Diseño Gráfico y Publicitario", "duracion": "4 años", "area": "Creativo"},
        {"nombre": "Marketing Digital", "duracion": "4 años", "area": "Negocios"}
    ]'::jsonb,
    TRUE, 
    'Semi-presencial', 
    'CEUB', 
    ARRAY['privada', 'semi-presencial', 'tecnología', 'becas'], 
    4.0, 
    134
),
(
    'Universidad Franz Tamayo', 
    'UNIFRANZ', 
    'Universidad', 
    'Santa Cruz de la Sierra', 
    'Universidad innovadora con modalidad virtual y presencial, enfocada en tecnología, negocios y ciencias de la salud.',
    '+591 3 333-2000', 
    'scz@unifranz.edu.bo', 
    'https://unifranz.edu.bo', 
    '', 
    1100, 
    450, 
    '[
        {"nombre": "Ingeniería de Sistemas", "duracion": "5 años", "area": "Tecnología"},
        {"nombre": "Medicina", "duracion": "6 años", "area": "Salud"},
        {"nombre": "Administración de Empresas", "duracion": "4 años", "area": "Negocios"},
        {"nombre": "Derecho", "duracion": "5 años", "area": "Jurídica"},
        {"nombre": "Psicología", "duracion": "5 años", "area": "Social"}
    ]'::jsonb,
    TRUE, 
    'Virtual', 
    'CEUB', 
    ARRAY['privada', 'virtual', 'online', 'becas'], 
    4.0, 
    98
),
(
    'Universidad de Aquino Bolivia', 
    'UDABOL', 
    'Universidad', 
    'Santa Cruz de la Sierra', 
    'Universidad privada con énfasis en salud, derecho y ciencias empresariales, con formación práctica e integral.',
    '+591 3 341-0000', 
    'scz@udabol.edu.bo', 
    'https://www.udabol.edu.bo', 
    '', 
    900, 
    350, 
    '[
        {"nombre": "Medicina", "duracion": "6 años", "area": "Salud"},
        {"nombre": "Odontología", "duracion": "5 años", "area": "Salud"},
        {"nombre": "Derecho", "duracion": "5 años", "area": "Jurídica"},
        {"nombre": "Administración de Empresas", "duracion": "5 años", "area": "Negocios"},
        {"nombre": "Enfermería", "duracion": "4 años", "area": "Salud"}
    ]'::jsonb,
    TRUE, 
    'Presencial', 
    'CEUB', 
    ARRAY['privada', 'presencial', 'salud', 'becas'], 
    3.9, 
    87
),
(
    'Instituto Tecnológico INFOCAL', 
    'INFOCAL', 
    'Instituto', 
    'Santa Cruz de la Sierra', 
    'Instituto de formación técnica y laboral dependiente de la CNC, con carreras técnicas cortas y alta salida laboral.',
    '+591 3 332-0000', 
    'info@infocal-scz.com', 
    'https://www.infocal-scz.com', 
    '', 
    350, 
    150, 
    '[
        {"nombre": "Técnico en Mecatrónica", "duracion": "2 años", "area": "Ingeniería"},
        {"nombre": "Técnico en Electricidad Industrial", "duracion": "2 años", "area": "Ingeniería"},
        {"nombre": "Técnico en Contabilidad", "duracion": "2 años", "area": "Negocios"},
        {"nombre": "Técnico en Diseño Gráfico", "duracion": "1.5 años", "area": "Creativo"},
        {"nombre": "Técnico en Gastronomía", "duracion": "2 años", "area": "Otro"}
    ]'::jsonb,
    FALSE, 
    'Presencial', 
    'Ministerio de Educación', 
    ARRAY['técnico', 'presencial', 'económico', 'corta duración'], 
    4.1, 
    76
);

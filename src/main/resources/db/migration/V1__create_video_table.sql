CREATE TABLE video (
    id BIGINT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cloudinary_url TEXT NOT NULL,
    thumbnail_url TEXT,
    creator_name VARCHAR(100),
    creator_avatar_url TEXT,
    duration_seconds INTEGER,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

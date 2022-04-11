PRAGMA foreign_keys = ON;
PRAGMA foreign_keys = 0;

CREATE TABLE IF NOT EXISTS users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	_id TEXT,
	username TEXT
);

CREATE TABLE IF NOT EXISTS exercises (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
    _id TEXT,
	description TEXT,
    duration INTEGER,
    date INTEGER,

    FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

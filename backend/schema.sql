-- D1 SQL Schema for INCUXAI Live Exam Platform

DROP TABLE IF EXISTS Disqualifications;
DROP TABLE IF EXISTS Scores;
DROP TABLE IF EXISTS Participants;
DROP TABLE IF EXISTS Sponsors;
DROP TABLE IF EXISTS Questions;
DROP TABLE IF EXISTS Exams;

CREATE TABLE Exams (
  id TEXT PRIMARY KEY, -- Room Code
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'pending' -- pending, active, completed
);

CREATE TABLE Questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option TEXT NOT NULL, -- A, B, C, or D
  order_index INTEGER NOT NULL,
  FOREIGN KEY(exam_id) REFERENCES Exams(id)
);

CREATE TABLE Participants (
  id TEXT PRIMARY KEY, -- UUID
  exam_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active', -- active, disqualified, completed
  total_score INTEGER DEFAULT 0,
  FOREIGN KEY(exam_id) REFERENCES Exams(id)
);

CREATE TABLE Scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  participant_id TEXT NOT NULL,
  question_id INTEGER NOT NULL,
  time_taken REAL NOT NULL,
  score INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  FOREIGN KEY(participant_id) REFERENCES Participants(id),
  FOREIGN KEY(question_id) REFERENCES Questions(id)
);

CREATE TABLE Disqualifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  participant_id TEXT NOT NULL,
  reason TEXT NOT NULL, -- e.g., 'focus_lost', 'minimized', 'heartbeat_timeout'
  disqualified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(participant_id) REFERENCES Participants(id)
);

CREATE TABLE Sponsors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  FOREIGN KEY(exam_id) REFERENCES Exams(id)
);

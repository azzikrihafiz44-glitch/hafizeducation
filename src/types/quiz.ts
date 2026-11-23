export type AppView =
  | 'landing'
  | 'portals'
  | 'campus-analysis'
  | 'lobby'
  | 'quiz'
  | 'results'
  | 'admin';

export type WardrobeCategory = 'character' | 'hair' | 'top' | 'bottom' | 'shoe' | 'accessory';

export type BodyStyle = 'girl' | 'boy' | 'chibi' | 'tall';
export type HairStyleType =
  | 'long'
  | 'twintails'
  | 'bob'
  | 'hijab'
  | 'pashmina'
  | 'spiky'
  | 'sidepart'
  | 'curly'
  | 'bun'
  | 'braids'
  | 'undercut'
  | 'ponytail'
  | 'wavy'
  | 'pixie';
export type BottomStyleType = 'skirt' | 'pleated' | 'longskirt' | 'tutu' | 'pants' | 'shorts';
export type ShoeStyleType = 'sneaker' | 'boots' | 'loafers' | 'heels' | 'sandals' | 'sport';
export type AccessoryStyleType =
  | 'none'
  | 'crown'
  | 'ribbon'
  | 'glasses'
  | 'headphones'
  | 'gradcap'
  | 'wings'
  | 'halo'
  | 'backpack'
  | 'scarf'
  | 'beret'
  | 'cat_ears'
  | 'wizard_hat'
  | 'cape'
  | 'bowtie'
  | 'star_wand';

export interface WardrobeItem {
  id: string;
  name: string;
  category: WardrobeCategory;
  color: string;
  accent?: string;
  emoji: string;
  bodyStyle?: BodyStyle;
  hairStyle?: HairStyleType;
  bottomStyle?: BottomStyleType;
  shoeStyle?: ShoeStyleType;
  accessoryStyle?: AccessoryStyleType;
}

export interface AvatarConfig {
  characterId: string;
  skinColor: string;
  hairId: string;
  topId: string;
  bottomId: string;
  shoeId?: string;
  accessoryId: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  choices: [string, string, string, string, string];
  correctIndex: number; // 0..4 (A..E)
  explanation: string;
  image?: string;
}

export type QuizCategory =
  | 'UTBK-SNBT'
  | 'TKA Saintek'
  | 'TKA Soshum'
  | 'Kedinasan'
  | 'ASAS XII'
  | 'Kelas X'
  | 'Kelas XI'
  | 'Kelas XII'
  | 'Umum';

export interface QuizRoom {
  code: string;
  title: string;
  questions: QuizQuestion[];
  createdAt: string;
  status?: 'waiting' | 'started';
  category?: QuizCategory;
  openAt?: string;
  closeAt?: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  grade: number; // 0..100
  points: number;
  correctCount: number;
  totalQuestions: number;
  answeredCount?: number;
  cheatCount?: number;
  status?: 'playing' | 'finished';
  isCurrentUser?: boolean;
  avatarLabel?: string;
  photoUrl?: string;
  timestamp: string;
}

export interface HistoryRecord {
  id: string;
  timestamp: string;
  roomCode: string;
  quizTitle: string;
  playerName: string;
  grade: number;
  points: number;
  correctCount: number;
  totalQuestions: number;
  rank: number;
  certificateId: string;
}

export interface LobbyChatMessage {
  id: string;
  sender: string;
  text: string;
  isSystem?: boolean;
  time: string;
}

export interface LobbyPlayer {
  id: string;
  name: string;
  isLocal: boolean;
  avatar: AvatarConfig;
  avatarLabel: string;
  photoUrl?: string;
}

export type EmoteType = 'jump' | 'dance' | 'wave' | 'party';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

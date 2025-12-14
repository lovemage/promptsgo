import { Dictionary } from '../types';

export interface BadgeInfo {
  silvers: number;
  stars: number;
  golds: number;
  title: string;
  level: number;
}

export const TITLES: Record<string, string[]> = {
  'en': [
    'Novice Creator', 'Apprentice', 'Explorer', 'Artisan', 'Star Creator',
    'Rising Star', 'Prompt Engineer', 'Specialist', 'Expert', 'Gold Master',
    'Grandmaster', 'Sage', 'Legend', 'Demi-God', 'God of Prompts'
  ],
  'zh-TW': [
    '新手創作者', '見習學徒', '探索者', '工匠', '星級創作者',
    '明日之星', '提示詞工程師', '專家', '達人', '金牌大師',
    '宗師', '賢者', '傳奇', '半神', '提示詞之神'
  ],
  'ja': [
    '新米クリエイター', '見習い', '冒険者', '職人', 'スタークリエイター',
    '新星', 'プロンプトエンジニア', 'スペシャリスト', '達人', 'ゴールドマスター',
    'グランドマスター', '賢者', 'レジェンド', '半神', 'プロンプトの神'
  ],
  'ko': [
    '초보 창작자', '수습생', '탐험가', '장인', '스타 창작자',
    '떠오르는 스타', '프롬프트 엔지니어', '스페셜리스트', '전문가', '골드 마스터',
    '그랜드마스터', '현자', '전설', '반신', '프롬프트의 신'
  ]
};

export const calculateBadgeInfo = (count: number, language: string = 'en'): BadgeInfo => {
  // Logic:
  // 5 Prompts = 1 Silver
  // 5 Silvers = 1 Star (25 Prompts)
  // 5 Stars = 1 Gold (125 Prompts)
  
  // Implementation:
  // We want to display the highest currency possible.
  // Example: 26 prompts -> 5 Silvers + 1 (remainder).
  // But 5 Silvers convert to 1 Star.
  // So 26 prompts = 1 Star + 0 Silver? Or 1 Star + 1 Silver?
  // 26 prompts / 5 = 5.2 -> 5 total silver units.
  // 5 silver units = 1 Star.
  // Remainder prompts?
  // The system counts in "completed" units.
  // 26 prompts has 5 completed silver units.
  // 5 completed silver units = 1 Star.
  // So 1 Star.
  // 30 prompts / 5 = 6 silver units.
  // 6 = 1 Star (5) + 1 Silver.
  
  const totalSilvers = Math.floor(count / 5);
  const totalStars = Math.floor(totalSilvers / 5);
  const totalGolds = Math.floor(totalStars / 5);

  const displayGolds = totalGolds;
  const displayStars = totalStars % 5;
  const displaySilvers = totalSilvers % 5;

  // Level for title (1-15)
  // We map the progression roughly to the 15 titles.
  // Let's define milestones based on the "highest badge" count.
  // This is a bit arbitrary but ensures we use all 15 titles.
  
  // Levels based on total silver units?
  // 1-4 Silvers (Levels 1-4)
  // 1-4 Stars (Levels 5-8) (Since 1 Star = 5 Silvers)
  // 1-5+ Golds (Levels 9-15)
  
  let level = 0;
  
  if (totalGolds > 0) {
      // Gold Tier (Levels 10+)
      // 1 Gold = Level 10
      // 2 Gold = Level 11
      // ...
      // Adjusting to fit 15 titles.
      // If we use the visual stage as level:
      // Silver 1-4 -> Lvl 1-4
      // Star 1-4 -> Lvl 5-8
      // Gold 1 -> Lvl 9? 
      // User said "5 Stars convert to Gold".
      // Let's map exactly:
      // 1 Silver (5) -> Lvl 1
      // 2 Silver (10) -> Lvl 2
      // 3 Silver (15) -> Lvl 3
      // 4 Silver (20) -> Lvl 4
      // 1 Star (25) -> Lvl 5
      // 1 Star 1 Silver (30) -> Is this a new level title? 
      // Probably titles are milestones for major badge changes or counts.
      // Let's simplify:
      // Level 1-4: 1-4 Silvers
      // Level 5-9: 1-5 Stars (Note: 5 stars becomes Gold, so effectively 1-4 stars, then Gold?)
      // Actually:
      // 1 Star (25) -> Lvl 5
      // 2 Star (50) -> Lvl 6
      // 3 Star (75) -> Lvl 7
      // 4 Star (100) -> Lvl 8
      // 1 Gold (125) -> Lvl 9?
      
      // Let's try to map 15 levels:
      if (totalGolds >= 7) level = 15;
      else if (totalGolds >= 6) level = 14;
      else if (totalGolds >= 5) level = 13;
      else if (totalGolds >= 4) level = 12;
      else if (totalGolds >= 3) level = 11;
      else if (totalGolds >= 2) level = 10;
      else level = 9; // 1 Gold
  } else if (totalStars > 0) {
      // Star Tier (Levels 5-8)
      if (totalStars >= 4) level = 8;
      else if (totalStars >= 3) level = 7;
      else if (totalStars >= 2) level = 6;
      else level = 5; // 1 Star
  } else {
      // Silver Tier (Levels 1-4)
      if (totalSilvers >= 4) level = 4;
      else if (totalSilvers >= 3) level = 3;
      else if (totalSilvers >= 2) level = 2;
      else if (totalSilvers >= 1) level = 1;
      else level = 0; // No badge
  }

  // Get localized titles
  const validLang = (language === 'zh-TW' || language === 'ja' || language === 'en' || language === 'ko') ? language : 'en';
  const titles = TITLES[validLang];
  
  // Map level to title index (0-14)
  // Level 1 -> Index 0
  // Level 15 -> Index 14
  // If level 0, empty string?
  const title = level > 0 ? titles[Math.min(level, 15) - 1] : '';

  return {
    silvers: displaySilvers,
    stars: displayStars,
    golds: displayGolds,
    title,
    level
  };
};

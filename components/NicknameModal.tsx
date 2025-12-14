import React, { useEffect, useMemo, useState } from 'react';
import { X, Dice6, Check } from 'lucide-react';
import { ThemeId, LanguageCode } from '../types';
import * as nicknameService from '../services/nicknameService';

type NicknamesJson = {
  prefixes: { id: number; zh: string; en: string; jp: string }[];
  suffixes: { id: number; zh: string; en: string; jp: string }[];
};

interface NicknameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (profile: nicknameService.NicknameProfile) => void;
  userId: string;
  theme: ThemeId;
  language: LanguageCode;
  currentLevel: number;
}

const NicknameModal: React.FC<NicknameModalProps> = ({ isOpen, onClose, onSaved, userId, theme, language, currentLevel }) => {
  const [profile, setProfile] = useState<nicknameService.NicknameProfile | null>(null);
  const [nicknamesData, setNicknamesData] = useState<NicknamesJson | null>(null);
  const [candidate, setCandidate] = useState<{ nickname: string; icon: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isDark = theme === 'dark' || theme === 'binder';

  const t = (zh: string, en: string, ja: string, ko: string) => {
    switch (language) {
      case 'zh-TW':
        return zh;
      case 'ja':
        return ja;
      case 'ko':
        return ko;
      default:
        return en;
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    nicknameService.ensureNicknameInitialized(userId, 3).then(p => {
      setProfile(p);
    });

    fetch('/nicknames.json')
      .then(r => r.json())
      .then((j: NicknamesJson) => setNicknamesData(j))
      .catch(err => {
        console.error('Failed to load nicknames.json:', err);
        setNicknamesData(null);
      });
  }, [isOpen, userId]);

  useEffect(() => {
    if (!isOpen) return;
    nicknameService.awardNicknameTokensForLevel(userId, currentLevel).then(p => {
      if (p) setProfile(p);
    });
  }, [currentLevel, isOpen, userId]);

  const icons = useMemo(
    () => ['⭐', '🌙', '🔥', '⚡', '🧠', '🎲', '🦊', '🐉', '🦄', '🍀'],
    []
  );

  const pickLangText = (item: { zh: string; en: string; jp: string }) => {
    if (language === 'zh-TW') return item.zh;
    if (language === 'ja') return item.jp;
    return item.en;
  };

  const rollOnce = async () => {
    if (!profile) return;
    if (!nicknamesData) return;
    if (profile.nicknameTokens <= 0) return;

    const prefix = nicknamesData.prefixes[Math.floor(Math.random() * nicknamesData.prefixes.length)];
    const suffix = nicknamesData.suffixes[Math.floor(Math.random() * nicknamesData.suffixes.length)];
    const icon = icons[Math.floor(Math.random() * icons.length)];

    const nextNickname = `${pickLangText(prefix)}${pickLangText(suffix)}`;
    setCandidate({ nickname: nextNickname, icon });
  };

  const confirm = async () => {
    if (!candidate) return;
    if (!profile) return;
    if (profile.nicknameTokens <= 0) return;

    setIsSaving(true);
    try {
      const nextTokens = Math.max(0, profile.nicknameTokens - 1);
      await nicknameService.saveNickname(userId, candidate.nickname, candidate.icon);
      await nicknameService.setNicknameTokens(userId, nextTokens);
      const nextProfile: nicknameService.NicknameProfile = {
        nickname: candidate.nickname,
        nicknameIcon: candidate.icon,
        nicknameTokens: nextTokens,
        nicknameLevel: profile.nicknameLevel,
      };
      setProfile(nextProfile);
      setCandidate(null);
      onSaved?.(nextProfile);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  let panelClass = 'bg-white text-slate-900 border-slate-200';
  if (theme === 'dark') panelClass = 'bg-slate-800 text-white border-white/10';
  if (theme === 'binder') panelClass = 'bg-[#1e1e1e] text-slate-200 border-white/10';
  if (theme === 'glass') panelClass = 'bg-white/60 text-slate-900 border-white/20 backdrop-blur-xl';

  const cardClass = `p-3 rounded-xl border ${
    isDark ? 'border-white/10 bg-white/5' : theme === 'glass' ? 'border-white/20 bg-white/20' : 'border-slate-200 bg-slate-50/60'
  }`;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-2xl border shadow-2xl ${panelClass}`}>
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
          <div>
            <div className="text-lg font-bold">
              {t('設定暱稱', 'Pick a nickname', 'ニックネーム設定', '닉네임 설정')}
            </div>
            <div className="text-xs opacity-70">
              {t(
                '完成教學後可擲骰 3 次；每次升級 +1 次（可累積）。',
                'After the tour you can roll 3 times; each level-up gives +1 roll (stackable).',
                '初回は3回、レベルアップごとに+1回（累積）。',
                '처음 3회, 레벨업마다 +1회(누적)'
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className={cardClass}>
            <div className="text-xs opacity-70 mb-1">{t('目前暱稱', 'Current', '現在', '현재')}</div>
            <div className="text-sm font-semibold">
              {(profile?.nicknameIcon || '') + (profile?.nickname || t('（尚未設定）', '(not set)', '（未設定）', '(미설정)'))}
            </div>
          </div>

          <div className={cardClass}>
            <div className="text-xs opacity-70 mb-1">{t('候選', 'Candidate', '候補', '후보')}</div>
            <div className="text-xl font-bold tabular-nums">
              {candidate ? `${candidate.icon}${candidate.nickname}` : t('按下骰子產生暱稱', 'Tap dice to roll', 'サイコロで生成', '주사위를 눌러 생성')}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs opacity-70">
              {t('剩餘次數：', 'Remaining rolls: ', '残り：', '남은 횟수: ')}
              <span className="font-bold">{profile?.nicknameTokens ?? 0}</span>
            </div>

            <button
              onClick={rollOnce}
              disabled={!profile || !nicknamesData || (profile?.nicknameTokens ?? 0) <= 0}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                isDark
                  ? 'border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-40'
                  : theme === 'glass'
                  ? 'border-white/20 bg-white/20 hover:bg-white/30 disabled:opacity-40'
                  : 'border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40'
              }`}
            >
              <Dice6 size={16} />
              {t('骰一次', 'Roll', '回す', '굴리기')}
            </button>
          </div>

          <button
            onClick={confirm}
            disabled={!candidate || isSaving || (profile?.nicknameTokens ?? 0) <= 0}
            className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
              theme === 'journal'
                ? 'bg-[#80c63c] hover:bg-[#6fae32] text-white disabled:opacity-40'
                : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40'
            }`}
          >
            <Check size={16} />
            {t('確認使用', 'Use this nickname', 'これにする', '확인')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NicknameModal;

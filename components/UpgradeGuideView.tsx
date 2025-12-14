import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Dictionary, LanguageCode, ThemeId } from '../types';

interface UpgradeGuideViewProps {
  language: LanguageCode;
  theme: ThemeId;
  dict: Dictionary;
  onBack: () => void;
}

const UpgradeGuideView: React.FC<UpgradeGuideViewProps> = ({ language, theme, dict, onBack }) => {
  const isDark = theme === 'dark' || theme === 'binder';

  const containerClass = `max-w-5xl mx-auto p-6 md:p-10 shadow-sm border rounded-xl my-8 ${
    theme === 'binder'
      ? 'bg-[#2c2c2c] text-white border-white/10'
      : theme === 'dark'
      ? 'bg-slate-900/40 text-white border-white/10'
      : theme === 'glass'
      ? 'bg-white/20 text-slate-900 border-white/20 backdrop-blur-xl'
      : theme === 'journal'
      ? 'bg-white text-slate-900 border-slate-200'
      : 'bg-white text-slate-900 border-slate-200'
  }`;
  const titleClass = "text-2xl md:text-3xl font-bold mb-2";
  const mutedClass = "text-sm opacity-70";
  const sectionTitleClass = "text-lg md:text-xl font-semibold mt-8 mb-3";
  const cardClass = `p-4 rounded-xl border ${
    isDark ? 'border-white/10 bg-white/5' : theme === 'glass' ? 'border-white/20 bg-white/20' : 'border-slate-200 bg-slate-50/60'
  }`;

  const t = (ko: string, en: string, zh: string, ja: string) => {
    switch (language) {
      case 'ko':
        return ko;
      case 'zh-TW':
        return zh;
      case 'ja':
        return ja;
      default:
        return en;
    }
  };

  const themeRules = [
    { id: 'binder', required: 2 },
    { id: 'glass', required: 3 },
    { id: 'dark', required: 5 },
    { id: 'royal', required: 8 },
    { id: 'greenble', required: 8 },
  ] as const;

  return (
    <div className={containerClass}>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm opacity-80 hover:opacity-100 hover:underline"
      >
        <ChevronLeft size={16} />
        {t('뒤로', 'Back', '返回', '戻る')}
      </button>

      <h1 className={titleClass}>{dict.upgradeGuideTitle}</h1>
      <div className={mutedClass}>
        {t(
          '공유로 레벨업하고, 배지/테마/아바타를 잠금 해제하세요.',
          'Level up by sharing and unlock badges, themes, and avatars.',
          '透過分享來升級，解鎖徽章、主題與頭像。',
          '共有してレベルアップし、バッジ・テーマ・アバターを解除しましょう。'
        )}
      </div>

      <h2 className={sectionTitleClass}>{t('이 페이지는 어디에 있나요?', 'Where is this page?', '這個頁面在哪裡？', 'このページはどこ？')}</h2>
      <div className={cardClass}>
        <div className="text-sm opacity-80 leading-relaxed">
          {t(
            '화면 하단의 Footer에서 "업그레이드 안내"(Upgrade Guide)를 눌러 들어올 수 있어요.',
            'You can open this from the Footer at the bottom: tap "Upgrade Guide".',
            '你可以在畫面底部的 Footer 點選「升級說明（Upgrade Guide）」進入本頁。',
            '画面下部のフッターから「Upgrade Guide」を押すと開けます。'
          )}
        </div>
      </div>

      <h2 className={sectionTitleClass}>{t('아바타는 어떻게 바꾸나요?', 'How do I change my avatar?', '如何更換頭像？', 'アバターの変更方法')}</h2>
      <div className={cardClass}>
        <div className="text-sm opacity-80 leading-relaxed">
          {t(
            '1) 왼쪽 사이드바를 엽니다.\n2) 프로필 영역에서 "아바타 변경"(Change avatar)을 누릅니다.\n3) 해금된 아바타를 선택하고 저장합니다.\n\n※ 레벨이 올라가면 더 많은 기본 아바타가 해금됩니다. 스타 창작자 이후에는 커스텀 업로드도 가능합니다.',
            '1) Open the left sidebar.\n2) In the profile area, tap "Change avatar".\n3) Pick an unlocked avatar and save.\n\nNote: Higher levels unlock more default avatars. After Star Creator, custom upload is available.',
            '1）打開左側側邊欄。\n2）在個人資訊區點選「更換頭像（Change avatar）」。\n3）選擇已解鎖的頭像並儲存。\n\n註：等級越高會解鎖更多預設頭像；達到星級創作者後可上傳自訂頭像。',
            '1）左のサイドバーを開きます。\n2）プロフィール欄の「Change avatar」を押します。\n3）解除済みのアバターを選んで保存します。\n\n注：レベルが上がるほど基本アバターが増え、スタークリエイター以降はカスタムアップロードも可能です。'
          )
            .split('\n')
            .map((line, idx) => (
              <div key={idx}>{line}</div>
            ))}
        </div>
      </div>

      <h2 className={sectionTitleClass}>{t('레벨 & 배지', 'Levels & Badges', '等級與徽章', 'レベルとバッジ')}</h2>
      <div className={cardClass}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="font-semibold mb-2">{t('규칙', 'Rules', '規則', 'ルール')}</div>
            <div className="text-sm opacity-80 leading-relaxed">
              {t(
                '프롬프트 5개 공유 = 실버 1개\n실버 5개 = 스타 1개 (총 25개 공유)\n스타 5개 = 골드 1개 (총 125개 공유)',
                'Share 5 prompts = 1 Silver\n5 Silvers = 1 Star (25 prompts)\n5 Stars = 1 Gold (125 prompts)',
                '分享 5 篇提示詞 = 1 銀幣\n5 銀幣 = 1 星星（25 篇）\n5 星星 = 1 金幣（125 篇）',
                '5個共有 = シルバー1\nシルバー5 = スター1（25個）\nスター5 = ゴールド1（125個）'
              )
                .split('\n')
                .map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
            </div>
          </div>

          <div>
            <div className="font-semibold mb-2">{t('배지 미리보기', 'Badge Preview', '徽章預覽', 'バッジプレビュー')}</div>
            <div className="flex items-center gap-3">
              <img src="/silver.png" alt="Silver" className="w-8 h-8 object-contain" />
              <img src="/star.png" alt="Star" className="w-8 h-8 object-contain" />
              <img src="/gold.png" alt="Gold" className="w-8 h-8 object-contain" />
            </div>
            <div className="text-xs opacity-70 mt-2">
              {t('배지는 공유 수에 따라 자동으로 계산됩니다.', 'Badges are calculated automatically from your share count.', '徽章會依分享數自動計算。', 'バッジは共有数から自動計算されます。')}
            </div>
          </div>

          <div>
            <div className="font-semibold mb-2">{t('레벨 예시', 'Level Examples', '等級示例', 'レベル例')}</div>
            <div className="text-sm opacity-80 leading-relaxed">
              {t(
                '레벨 1~4: 실버 단계\n레벨 5~8: 스타 단계\n레벨 9+: 골드 단계',
                'Level 1-4: Silver tier\nLevel 5-8: Star tier\nLevel 9+: Gold tier',
                'Level 1-4：銀幣階段\nLevel 5-8：星星階段\nLevel 9+：金幣階段',
                'Lv 1-4: シルバー\nLv 5-8: スター\nLv 9+: ゴールド'
              )
                .split('\n')
                .map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
            </div>
          </div>
        </div>
      </div>

      <h2 className={sectionTitleClass}>{t('테마 잠금 해제', 'Theme Unlocks', '主題解鎖', 'テーマ解除')}</h2>
      <div className={cardClass}>
        <div className="text-sm opacity-80 mb-3">
          {t(
            '아래 테마는 공유한 프롬프트 수에 따라 잠금 해제됩니다.',
            'Themes below are unlocked based on your shared prompt count.',
            '以下主題依分享提示詞數量解鎖。',
            '以下のテーマは共有数により解除されます。'
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {themeRules.map(r => (
            <div key={r.id} className={`flex items-center justify-between p-3 rounded-lg border ${isDark ? 'border-white/10 bg-white/5' : theme === 'glass' ? 'border-white/20 bg-white/20' : 'border-black/5 bg-black/5'}`}>
              <div className="font-medium">{r.id}</div>
              <div className="text-sm opacity-80">
                {t('필요: ', 'Required: ', '需求：', '必要：')}
                {r.required}
              </div>
            </div>
          ))}
        </div>
      </div>

      <h2 className={sectionTitleClass}>{t('아바타 잠금 해제', 'Avatar Unlocks', '頭像解鎖', 'アバター解除')}</h2>
      <div className={cardClass}>
        <div className="text-sm opacity-80 mb-4">
          {t(
            '레벨에 따라 기본 아바타가 해제됩니다. 잠기지 않은 아바타만 선택할 수 있습니다.',
            'Default avatars unlock by level. You can only select unlocked avatars.',
            '預設頭像會隨等級解鎖。只能選擇已解鎖的頭像。',
            '基本アバターはレベルで解除されます。解除済みのみ選択可能です。'
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="font-semibold mb-2">ava</div>
            <div className="text-sm opacity-80">
              {t('레벨 1: ava1-6', 'Level 1: ava1-6', 'Level 1：ava1-6', 'Lv1: ava1-6')}
              <div>{t('레벨 2: ava1-12', 'Level 2: ava1-12', 'Level 2：ava1-12', 'Lv2: ava1-12')}</div>
              <div>{t('레벨 3+: ava1-18', 'Level 3+: ava1-18', 'Level 3+：ava1-18', 'Lv3+: ava1-18')}</div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <img src="/avators_promptgp/ava1.PNG" alt="ava1" className="w-10 h-10 rounded-full object-cover border border-white/10" />
              <img src="/avators_promptgp/ava7.PNG" alt="ava7" className="w-10 h-10 rounded-full object-cover border border-white/10" />
              <img src="/avators_promptgp/ava13.PNG" alt="ava13" className="w-10 h-10 rounded-full object-cover border border-white/10" />
            </div>
          </div>

          <div>
            <div className="font-semibold mb-2">avb</div>
            <div className="text-sm opacity-80">
              <div>{t('레벨 4: avb1-6', 'Level 4: avb1-6', 'Level 4：avb1-6', 'Lv4: avb1-6')}</div>
              <div>{t('레벨 5+: avb1-16', 'Level 5+: avb1-16', 'Level 5+：avb1-16', 'Lv5+: avb1-16')}</div>
              <div className="mt-2">
                {t(
                  '스타 창작자 이후에는 커스텀 업로드가 가능합니다.',
                  'After Star Creator, you can upload a custom avatar.',
                  '星級創作者之後可上傳自訂頭像。',
                  'スタークリエイター以降はカスタムアップロード可能です。'
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <img src="/avators_promptgp/avb1.PNG" alt="avb1" className="w-10 h-10 rounded-full object-cover border border-white/10" />
              <img src="/avators_promptgp/avb7.PNG" alt="avb7" className="w-10 h-10 rounded-full object-cover border border-white/10" />
              <img src="/avators_promptgp/avb16.PNG" alt="avb16" className="w-10 h-10 rounded-full object-cover border border-white/10" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-xs opacity-60">
        {t(
          '참고: 공유 수는 Global Prompts에 게시한 횟수를 기준으로 계산됩니다.',
          'Note: share count is based on how many prompts you have published to Global Prompts.',
          '註：分享數以發布到 Global Prompts 的次數計算。',
          '注：共有数は Global Prompts に公開した回数に基づきます。'
        )}
      </div>
    </div>
  );
};

export default UpgradeGuideView;

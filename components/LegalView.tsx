import React from 'react';
import { LanguageCode, ThemeId, Dictionary } from '../types';
import { ChevronLeft } from 'lucide-react';

interface LegalViewProps {
  type: 'terms' | 'privacy';
  language: LanguageCode;
  theme: ThemeId;
  onBack: () => void;
  dict: Dictionary;
}

const LegalView: React.FC<LegalViewProps> = ({ type, language, theme, onBack, dict }) => {
  
  // Journal Theme Styles
  const containerClass = "max-w-4xl mx-auto p-8 bg-white shadow-sm border border-slate-200 rounded-xl my-8 min-h-[80vh]";
  const titleClass = "text-3xl font-bold mb-6 text-[#2c2c2c] border-b-2 border-[#80c63c] pb-2 inline-block";
  const sectionTitleClass = "text-xl font-semibold mt-8 mb-4 text-[#0c9e2d]";
  const textClass = "text-[#2c2c2c] leading-relaxed mb-4 text-sm md:text-base";
  const listClass = "list-disc pl-6 mb-4 space-y-2 text-[#2c2c2c] text-sm md:text-base";

  const getContent = () => {
    if (type === 'terms') {
      switch (language) {
        case 'zh-TW':
          return (
            <>
              <h1 className={titleClass}>服務條款</h1>
              <p className={textClass}>最後更新日期：2025年12月8日</p>
              
              <h2 className={sectionTitleClass}>1. 條款接受</h2>
              <p className={textClass}>歡迎使用 PromptsGo。通過訪問或使用我們的網站和服務，您同意受這些服務條款的約束。如果您不同意這些條款的任何部分，請不要使用我們的服務。</p>
              
              <h2 className={sectionTitleClass}>2. 服務說明</h2>
              <p className={textClass}>PromptsGo 提供一個 AI 提示詞（Prompt）的管理、分享和發現平台。我們保留隨時修改、暫停或終止服務的權利，恕不另行通知。</p>
              
              <h2 className={sectionTitleClass}>3. 用戶帳戶</h2>
              <p className={textClass}>為了使用某些功能，您可能需要註冊帳戶。您負責維護您帳戶信息的保密性，並對您帳戶下發生的所有活動負責。</p>
              
              <h2 className={sectionTitleClass}>4. 用戶內容</h2>
              <p className={textClass}>您保留您提交給 PromptsGo 的所有內容的所有權。通過提交內容，您授予我們全球性、非獨家、免版稅的許可，以使用、複製、修改和分發您的內容。</p>
              
              <h2 className={sectionTitleClass}>5. 禁止行為</h2>
              <ul className={listClass}>
                <li>違反任何適用法律或法規。</li>
                <li>侵犯他人的知識產權。</li>
                <li>傳播惡意軟件或病毒。</li>
                <li>騷擾、虐待或傷害他人。</li>
              </ul>

              <h2 className={sectionTitleClass}>6. 免責聲明</h2>
              <p className={textClass}>服務按「現狀」提供，不附帶任何形式的保證。我們不保證服務將不中斷、安全或無錯誤。</p>
            </>
          );
        case 'ja':
          return (
            <>
              <h1 className={titleClass}>利用規約</h1>
              <p className={textClass}>最終更新日：2025年12月8日</p>
              
              <h2 className={sectionTitleClass}>1. 規約への同意</h2>
              <p className={textClass}>PromptsGoをご利用いただきありがとうございます。本サービスにアクセスまたは利用することで、お客様は本利用規約に拘束されることに同意したものとみなされます。</p>
              
              <h2 className={sectionTitleClass}>2. サービスの説明</h2>
              <p className={textClass}>PromptsGoは、AIプロンプトの管理、共有、発見のためのプラットフォームを提供します。当社は、予告なしにサービスを変更、停止、または終了する権利を留保します。</p>
              
              <h2 className={sectionTitleClass}>3. ユーザーアカウント</h2>
              <p className={textClass}>一部の機能を利用するには、アカウント登録が必要な場合があります。アカウント情報の機密性を維持し、アカウントの下で行われるすべての活動に対して責任を負うものとします。</p>
              
              <h2 className={sectionTitleClass}>4. ユーザーコンテンツ</h2>
              <p className={textClass}>お客様は、PromptsGoに送信したすべてのコンテンツの所有権を保持します。コンテンツを送信することにより、お客様は当社に対し、そのコンテンツを使用、複製、変更、配布するための世界的、非独占的、ロイヤリティフリーのライセンスを付与するものとします。</p>
              
              <h2 className={sectionTitleClass}>5. 禁止事項</h2>
              <ul className={listClass}>
                <li>適用される法律または規制に違反すること。</li>
                <li>他者の知的財産権を侵害すること。</li>
                <li>マルウェアやウイルスを拡散すること。</li>
                <li>他者を嫌がらせ、虐待、または害すること。</li>
              </ul>

              <h2 className={sectionTitleClass}>6. 免責事項</h2>
              <p className={textClass}>サービスは「現状有姿」で提供され、いかなる種類の保証もありません。当社は、サービスが中断されず、安全で、エラーがないことを保証しません。</p>
            </>
          );
        default: // en
          return (
            <>
              <h1 className={titleClass}>Terms of Service</h1>
              <p className={textClass}>Last Updated: December 8, 2025</p>
              
              <h2 className={sectionTitleClass}>1. Acceptance of Terms</h2>
              <p className={textClass}>Welcome to PromptsGo. By accessing or using our website and services, you agree to be bound by these Terms of Service. If you do not agree to any part of these terms, please do not use our services.</p>
              
              <h2 className={sectionTitleClass}>2. Description of Service</h2>
              <p className={textClass}>PromptsGo provides a platform for managing, sharing, and discovering AI prompts. We reserve the right to modify, suspend, or terminate the service at any time without notice.</p>
              
              <h2 className={sectionTitleClass}>3. User Accounts</h2>
              <p className={textClass}>To access certain features, you may be required to register for an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.</p>
              
              <h2 className={sectionTitleClass}>4. User Content</h2>
              <p className={textClass}>You retain ownership of all content you submit to PromptsGo. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute your content.</p>
              
              <h2 className={sectionTitleClass}>5. Prohibited Conduct</h2>
              <ul className={listClass}>
                <li>Violating any applicable laws or regulations.</li>
                <li>Infringing upon the intellectual property rights of others.</li>
                <li>Transmitting malware or viruses.</li>
                <li>Harassing, abusing, or harming others.</li>
              </ul>

              <h2 className={sectionTitleClass}>6. Disclaimer</h2>
              <p className={textClass}>The service is provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted, secure, or error-free.</p>
            </>
          );
      }
    } else { // Privacy Policy
      switch (language) {
        case 'zh-TW':
          return (
            <>
              <h1 className={titleClass}>隱私權聲明</h1>
              <p className={textClass}>最後更新日期：2025年12月8日</p>
              
              <h2 className={sectionTitleClass}>1. 信息收集</h2>
              <p className={textClass}>我們收集您直接提供給我們的信息（如註冊帳戶時），以及通過您使用服務自動收集的信息（如使用數據、Cookie）。</p>
              
              <h2 className={sectionTitleClass}>2. 信息使用</h2>
              <p className={textClass}>我們使用收集的信息來提供、維護和改進我們的服務，與您溝通，以及個性化您的體驗。</p>
              
              <h2 className={sectionTitleClass}>3. 信息共享</h2>
              <p className={textClass}>除非得到您的同意或法律要求，否則我們不會與第三方共享您的個人信息。</p>
              
              <h2 className={sectionTitleClass}>4. 數據安全</h2>
              <p className={textClass}>我們採取合理的措施來保護您的信息免受丟失、盜竊、濫用和未經授權的訪問。</p>
              
              <h2 className={sectionTitleClass}>5. Cookie</h2>
              <p className={textClass}>我們使用 Cookie 和類似技術來增強您的體驗並收集有關您如何使用我們服務的數據。</p>
              
              <h2 className={sectionTitleClass}>6. 聯繫我們</h2>
              <p className={textClass}>如果您對本隱私政策有任何疑問，請通過 support@promptsgo.com 聯繫我們。</p>
            </>
          );
        case 'ja':
          return (
            <>
              <h1 className={titleClass}>プライバシーポリシー</h1>
              <p className={textClass}>最終更新日：2025年12月8日</p>
              
              <h2 className={sectionTitleClass}>1. 情報の収集</h2>
              <p className={textClass}>当社は、お客様が直接提供する情報（アカウント登録時など）およびサービスの利用を通じて自動的に収集される情報（利用データ、Cookieなど）を収集します。</p>
              
              <h2 className={sectionTitleClass}>2. 情報の利用</h2>
              <p className={textClass}>収集した情報は、サービスの提供、維持、改善、お客様とのコミュニケーション、および体験のパーソナライズのために使用されます。</p>
              
              <h2 className={sectionTitleClass}>3. 情報の共有</h2>
              <p className={textClass}>お客様の同意がある場合、または法律で義務付けられている場合を除き、当社は個人情報を第三者と共有しません。</p>
              
              <h2 className={sectionTitleClass}>4. データセキュリティ</h2>
              <p className={textClass}>当社は、紛失、盗難、悪用、および不正アクセスからお客様の情報を保護するために合理的な措置を講じます。</p>
              
              <h2 className={sectionTitleClass}>5. Cookie</h2>
              <p className={textClass}>当社は、お客様の体験を向上させ、サービスの利用状況に関するデータを収集するために、Cookieおよび類似の技術を使用します。</p>
              
              <h2 className={sectionTitleClass}>6. お問い合わせ</h2>
              <p className={textClass}>本プライバシーポリシーに関するご質問は、support@promptsgo.com までお問い合わせください。</p>
            </>
          );
        default: // en
          return (
            <>
              <h1 className={titleClass}>Privacy Policy</h1>
              <p className={textClass}>Last Updated: December 8, 2025</p>
              
              <h2 className={sectionTitleClass}>1. Information Collection</h2>
              <p className={textClass}>We collect information you provide directly to us (such as when registering an account) and information collected automatically through your use of the service (such as usage data, cookies).</p>
              
              <h2 className={sectionTitleClass}>2. Use of Information</h2>
              <p className={textClass}>We use collected information to provide, maintain, and improve our services, communicate with you, and personalize your experience.</p>
              
              <h2 className={sectionTitleClass}>3. Information Sharing</h2>
              <p className={textClass}>We do not share your personal information with third parties except with your consent or as required by law.</p>
              
              <h2 className={sectionTitleClass}>4. Data Security</h2>
              <p className={textClass}>We take reasonable measures to protect your information from loss, theft, misuse, and unauthorized access.</p>
              
              <h2 className={sectionTitleClass}>5. Cookies</h2>
              <p className={textClass}>We use cookies and similar technologies to enhance your experience and collect data about how you use our services.</p>
              
              <h2 className={sectionTitleClass}>6. Contact Us</h2>
              <p className={textClass}>If you have any questions about this Privacy Policy, please contact us at support@promptsgo.com.</p>
            </>
          );
      }
    }
  };

  return (
    <div className={`min-h-full p-4 md:p-8 overflow-y-auto ${theme === 'journal' ? 'bg-[#f4f1ea]' : 'bg-transparent'}`}>
      <div className={containerClass}>
        <button 
          onClick={onBack}
          className="flex items-center gap-1 text-[#80c63c] hover:text-[#0c9e2d] transition-colors mb-6 font-medium"
        >
          <ChevronLeft size={20} />
          {dict.cancel} {/* Using 'cancel' as 'Back' */}
        </button>
        
        <div className="prose prose-slate max-w-none">
          {getContent()}
        </div>
      </div>
    </div>
  );
};

export default LegalView;

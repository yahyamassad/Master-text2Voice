export type Language = 'ar' | 'en' | 'fr';
export type Direction = 'rtl' | 'ltr';
export interface LanguageListItem {
    code: string;
    name: string;
}

export const translations = {
  pageTitle: {
    ar: 'Sawtli - مترجم ومحول نص إلى كلام',
    en: 'Sawtli - Text-to-Speech & Translator',
    fr: 'Sawtli - Traducteur & Synthèse Vocale',
  },
  subtitle: {
    ar: 'اكتب... تكلم... ترجم... استمع',
    en: 'Write... Speak... Translate... Listen',
    fr: 'Écrivez... Parlez... Traduisez... Écoutez',
  },
  placeholder: {
    ar: 'أدخل النص هنا...',
    en: 'Enter text here...',
    fr: 'Entrez le texte ici...',
  },
  translationPlaceholder: {
    ar: 'الترجمة ستظهر هنا...',
    en: 'Translation will appear here...',
    fr: 'La traduction apparaîtra ici...',
  },
  sourceLanguage: {
    ar: 'لغة المصدر',
    en: 'Source Language',
    fr: 'Langue Source',
  },
  targetLanguage: {
    ar: 'اللغة الهدف',
    en: 'Target Language',
    fr: 'Langue Cible',
  },
  swapLanguages: {
    ar: 'تبديل اللغات',
    en: 'Swap languages',
    fr: 'Intervertir les langues',
  },
  speechSettings: {
    ar: 'إعدادات النطق',
    en: 'Speech Settings',
    fr: 'Paramètres Vocaux',
  },
  openSpeechSettings: {
    ar: 'فتح إعدادات النطق',
    en: 'Open Speech Settings',
    fr: 'Ouvrir les Paramètres Vocaux',
  },
  voiceLabel: {
    ar: 'الصوت',
    en: 'Voice',
    fr: 'Voix',
  },
  voicePuck: {
    ar: 'صوت (Puck) - ذكر',
    en: 'Puck (Male)',
    fr: 'Puck (Masculin)',
  },
  voiceKore: {
    ar: 'صوت (Kore) - أنثى',
    en: 'Kore (Female)',
    fr: 'Kore (Féminine)',
  },
  voiceZephyr: {
    ar: 'صوت (Zephyr) - أنثى',
    en: 'Zephyr (Female)',
    fr: 'Zephyr (Féminin)',
  },
  voiceCharon: {
    ar: 'صوت (Charon) - ذكر',
    en: 'Charon (Male)',
    fr: 'Charon (Masculin)',
  },
  voiceFenrir: {
    ar: 'صوت (Fenrir) - ذكر',
    en: 'Fenrir (Male)',
    fr: 'Fenrir (Masculin)',
  },
  previewVoiceTooltip: {
    ar: 'معاينة هذا الصوت',
    en: 'Preview this voice',
    fr: 'Aperçu de cette voix',
  },
  voicePreviewText: {
    ar: 'مرحباً، هذه معاينة لصوتي.',
    en: 'Hello, this is a preview of my voice.',
    fr: 'Bonjour, ceci est un aperçu de ma voix.',
  },
  speedLabel: {
    ar: 'سرعة النطق',
    en: 'Speech Speed',
    fr: 'Vitesse de la parole',
  },
  speedVerySlow: {
    ar: 'بطيء جداً',
    en: 'Very Slow',
    fr: 'Très Lent',
  },
  speedSlow: {
    ar: 'بطيء',
    en: 'Slow',
    fr: 'Lent',
  },
  speedNormal: {
    ar: 'عادي',
    en: 'Normal',
    fr: 'Normale',
  },
  speedFast: {
    ar: 'سريع',
    en: 'Fast',
    fr: 'Rapide',
  },
  speedVeryFast: {
    ar: 'سريع جداً',
    en: 'Very Fast',
    fr: 'Très Rapide',
  },
  speechEmotion: {
    ar: 'نبرة الصوت',
    en: 'Speech Emotion',
    fr: 'Émotion de la parole',
  },
  emotionDefault: {
    ar: 'افتراضي',
    en: 'Default',
    fr: 'Défaut',
  },
  emotionHappy: {
    ar: 'سعيد',
    en: 'Happy',
    fr: 'Heureux',
  },
  emotionSad: {
    ar: 'حزين',
    en: 'Sad',
    fr: 'Triste',
  },
  emotionFormal: {
    ar: 'رسمي',
    en: 'Formal',
    fr: 'Formel',
  },
  pauseLabel: {
    ar: 'التوقف بين الفقرات',
    en: 'Pause Between Paragraphs',
    fr: 'Pause entre les paragraphes',
  },
  seconds: {
    ar: 'ث',
    en: 's',
    fr: 's',
  },
  multiSpeakerSettings: {
    ar: 'إعدادات تعدد المتحدثين',
    en: 'Multi-Speaker Settings',
    fr: 'Paramètres multi-locuteurs',
  },
  enableMultiSpeaker: {
    ar: 'تفعيل وضع تعدد المتحدثين',
    en: 'Enable Multi-Speaker Mode',
    fr: 'Activer le mode multi-locuteurs',
  },
  enableMultiSpeakerInfo: {
      ar: 'عند التفعيل، سيحاول التطبيق تعيين أصوات مختلفة للمتحدثين. عند التعطيل، سيتم استخدام الصوت المحدد الفردي.',
      en: 'When enabled, the app assigns different voices to speakers. When disabled, the single selected voice is used.',
      fr: 'Activé, l\'app assigne des voix différentes aux locuteurs. Désactivé, la voix unique sélectionnée est utilisée.',
  },
  multiSpeakerInfo: {
    ar: "للصوت متعدد المتحدثين، نسّق النص على شكل 'الاسم: مرحباً!' في كل سطر.",
    en: "For multi-speaker audio, format your text like 'Name: Hello!' on each line.",
    fr: "Pour l'audio multi-locuteurs, formatez votre texte comme 'Nom : Bonjour !' sur chaque ligne.",
  },
  speakerName: {
    ar: 'اسم المتحدث',
    en: 'Speaker Name',
    fr: 'Nom du locuteur',
  },
  speakerVoice: {
    ar: 'صوت المتحدث',
    en: 'Speaker Voice',
    fr: 'Voix du locuteur',
  },
  speaker1: {
    ar: 'مثال: يزن',
    en: 'e.g., Yazan',
    fr: 'ex: Yazan',
  },
  speaker2: {
    ar: 'مثال: لانا',
    en: 'e.g., Lana',
    fr: 'ex: Lana',
  },
  translateButton: {
    ar: 'ترجمة',
    en: 'Translate',
    fr: 'Traduire',
  },
  translatingButton: {
    ar: 'جاري الترجمة...',
    en: 'Translating...',
    fr: 'Traduction...',
  },
  speakSource: {
    ar: 'استمع للنص الأصلي',
    en: 'Speak Source Text',
    fr: 'Écouter le Texte Source',
  },
  speakTarget: {
    ar: 'استمع للترجمة',
    en: 'Speak Translation',
    fr: 'Écouter la Traduction',
  },
  voiceInput: {
    ar: 'إدخال صوتي',
    en: 'Voice Input',
    fr: 'Entrée Vocale',
  },
  stopListening: {
    ar: 'إيقاف الاستماع',
    en: 'Stop Listening',
    fr: 'Arrêter l\'écoute',
  },
  pauseSpeaking: {
    ar: 'إيقاف مؤقت',
    en: 'Pause',
    fr: 'Pause',
  },
  resumeSpeaking: {
    ar: 'استئناف',
    en: 'Resume',
    fr: 'Reprendre',
  },
  stopSpeaking: {
    ar: 'إيقاف الصوت',
    en: 'Stop Audio',
    fr: 'Arrêter l\'Audio',
  },
  generatingSpeech: {
    ar: 'جاري التوليد...',
    en: 'Generating...',
    fr: 'Génération...',
  },
   encoding: {
    ar: 'جاري التحويل...',
    en: 'Encoding...',
    fr: 'Encodage...',
  },
  listening: {
    ar: 'جاري الاستماع...',
    en: 'Listening...',
    fr: 'Écoute en cours...',
  },
  downloadButton: {
    ar: 'تحميل',
    en: 'Download',
    fr: 'Télécharger',
  },
  shareSettings: {
    ar: 'مشاركة الرابط',
    en: 'Share Link',
    fr: 'Partager le lien',
  },
  shareSettingsTooltip: {
    ar: 'نسخ رابط مع الإعدادات الحالية',
    en: 'Copy a link with the current settings',
    fr: 'Copier un lien avec les paramètres actuels',
  },
  linkCopied: {
    ar: 'تم نسخ الرابط إلى الحافظة!',
    en: 'Link copied to clipboard!',
    fr: 'Lien copié dans le presse-papiers !',
  },
  shareAudio: {
    ar: 'مشاركة الصوت',
    en: 'Share Audio',
    fr: 'Partager l\'audio',
  },
  shareAudioTooltip: {
    ar: 'مشاركة الصوت بتنسيق MP3',
    en: 'Share audio as an MP3 file',
    fr: 'Partager l\'audio en tant que fichier MP3',
  },
  sharingAudio: {
    ar: 'جاري التحضير...',
    en: 'Preparing...',
    fr: 'Préparation...',
  },
  sharedAudioTitle: {
      ar: 'ملف صوتي من Sawtli',
      en: 'Audio from Sawtli',
      fr: 'Audio de Sawtli',
  },
  sharedAudioText: {
      ar: 'استمع إلى هذا الصوت الذي تم إنشاؤه.',
      en: 'Listen to this generated audio.',
      fr: 'Écoutez cet audio généré.',
  },
  shareNotSupported: {
    ar: 'المشاركة غير مدعومة في هذا المتصفح.',
    en: 'Sharing is not supported on this browser.',
    fr: 'Le partage n\'est pas pris en charge sur ce navigateur.',
  },
  downloadPanelTitle: {
    ar: 'تحميل الملف الصوتي',
    en: 'Download Audio File',
    fr: 'Télécharger le Fichier Audio',
  },
  downloadFormat: {
    ar: 'صيغة التحميل',
    en: 'Download Format',
    fr: 'Format de Téléchargement',
  },
  selectInterfaceLanguage: {
      ar: 'اختر لغة الواجهة',
      en: 'Select interface language',
      fr: 'Sélectionner la langue de l\'interface',
  },
  replay: {
      ar: 'إعادة من البداية',
      en: 'Replay from Start',
      fr: 'Rejouer depuis le début',
  },
  copy: {
    ar: 'نسخ',
    en: 'Copy',
    fr: 'Copier',
  },
  copyTooltip: {
    ar: 'نسخ النص',
    en: 'Copy Text',
    fr: 'Copier le texte',
  },
  copied: {
    ar: 'تم النسخ!',
    en: 'Copied!',
    fr: 'Copié !',
  },
  historyButton: {
    ar: 'السجلات',
    en: 'History',
    fr: 'Historique',
  },
  historyTitle: {
    ar: 'سجل الترجمة',
    en: 'Translation History',
    fr: 'Historique des traductions',
  },
  historyClear: {
    ar: 'مسح السجل',
    en: 'Clear History',
    fr: 'Effacer l\'historique',
  },
  historyEmpty: {
    ar: 'لا توجد ترجمات محفوظة.',
    en: 'No saved translations.',
    fr: 'Aucune traduction enregistrée.',
  },
  historySearch: {
    ar: 'ابحث في السجل...',
    en: 'Search history...',
    fr: 'Rechercher dans l\'historique...',
  },
  historyItemFrom: {
    ar: 'من',
    en: 'From',
    fr: 'De',
  },
  historyItemTo: {
    ar: 'إلى',
    en: 'To',
    fr: 'À',
  },
  errorApiNoAudio: {
    ar: 'لم يتم استلام أي بيانات صوتية من الواجهة البرمجية.',
    en: 'No audio data received from the API.',
    fr: 'Aucune donnée audio reçue de l\'API.',
  },
  errorUnexpected: {
    ar: 'حدث خطأ غير متوقع.',
    en: 'An unexpected error occurred.',
    fr: 'Une erreur inattendue est survenue.',
  },
  errorGemini: {
    ar: 'فشل في توليد الصوت. يرجى التحقق من وحدة التحكم لمزيد من التفاصيل.',
    en: 'Failed to generate speech. Please check the console for more details.',
    fr: 'Échec de la génération de la parole. Veuillez consulter la console pour plus de détails.',
  },
  errorTranslate: {
    ar: 'فشلت عملية الترجمة.',
    en: 'Translation failed.',
    fr: 'La traduction a échoué.',
  },
  errorMp3Encoding: {
    ar: 'فشل تحويل الملف إلى MP3. يرجى محاولة التحميل بصيغة WAV.',
    en: 'Failed to encode to MP3. Please try downloading as WAV.',
    fr: 'Échec de l\'encodage en MP3. Veuillez essayer de télécharger en WAV.',
  },
  errorMicPermission: {
    ar: 'تم رفض إذن الوصول إلى الميكروفون. يرجى تفعيل الإذن من إعدادات المتصفح.',
    en: 'Microphone permission was denied. Please enable it in your browser settings.',
    fr: 'L\'autorisation du microphone a été refusée. Veuillez l\'activer dans les paramètres de votre navigateur.',
  },
  errorMicNotSupported: {
    ar: 'ميزة التعرف على الكلام غير مدعومة في متصفحك.',
    en: 'Speech recognition is not supported by your browser.',
    fr: 'La reconnaissance vocale n\'est pas prise en charge par votre navigateur.',
  },
  feedbackTitle: {
    ar: 'آراء المستخدمين',
    en: 'User Feedback',
    fr: 'Avis des Utilisateurs',
  },
  feedbackSubtitle: {
    ar: 'شاهد ما يقوله الآخرون أو شاركنا رأيك!',
    en: 'See what others are saying or share your own feedback!',
    fr: 'Voyez ce que les autres en disent ou partagez votre avis !',
  },
  yourName: {
    ar: 'اسمك (اختياري)',
    en: 'Your Name (Optional)',
    fr: 'Votre Nom (Facultatif)',
  },
  yourComment: {
    ar: 'تعليقك...',
    en: 'Your comment...',
    fr: 'Votre commentaire...',
  },
  yourRating: {
    ar: 'تقييمك:',
    en: 'Your Rating:',
    fr: 'Votre Évaluation :',
  },
  submitFeedback: {
    ar: 'إرسال الرأي',
    en: 'Submit Feedback',
    fr: 'Envoyer l\'avis',
  },
  submittingFeedback: {
    ar: 'جاري الإرسال...',
    en: 'Submitting...',
    fr: 'Envoi en cours...',
  },
  noFeedbackYet: {
    ar: 'لا توجد آراء بعد. كن أول من يشاركنا رأيه!',
    en: 'No feedback yet. Be the first to share your thoughts!',
    fr: 'Aucun avis pour le moment. Soyez le premier à partager votre opinion !',
  },
  feedbackSuccess: {
    ar: 'شكراً لك على مشاركتنا رأيك!',
    en: 'Thank you for your feedback!',
    fr: 'Merci pour votre commentaire !',
  },
  feedbackError: {
    ar: 'فشل إرسال الرأي. الرجاء المحاولة مرة أخرى.',
    en: 'Failed to submit feedback. Please try again.',
    fr: 'Échec de l\'envoi de l\'avis. Veuillez réessayer.',
  },
  feedbackConfigNeededTitle: {
      ar: 'مطلوب إعداد Firebase',
      en: 'Firebase Configuration Required',
      fr: 'Configuration Firebase Requise',
  },
  feedbackConfigNeededBody: {
      ar: 'ميزة التعليقات معطلة. لتفعيلها، قم بإنشاء مشروع Firebase خاص بك وأضف قيم الإعداد التالية كمتغيرات بيئة (Environment Variables) في منصة النشر الخاصة بك:',
      en: 'The feedback feature is disabled. To enable it, create your own Firebase project and add the following configuration values as Environment Variables in your deployment platform:',
      fr: 'La fonctionnalité de commentaires est désactivée. Pour l\'activer, créez votre propre projet Firebase et ajoutez les valeurs de configuration suivantes en tant que variables d\'environnement sur votre plateforme de déploiement :',
  },
  firebaseSetupGuideTitle: {
      ar: 'عرض دليل الإعداد المفصل',
      en: 'Show Detailed Setup Guide',
      fr: 'Afficher le guide d\'installation détaillé',
  },
  firebaseSetupStep1Title: {
      ar: 'الخطوة 1: إنشاء مشروع Firebase',
      en: 'Step 1: Create a Firebase Project',
      fr: 'Étape 1 : Créer un projet Firebase',
  },
  firebaseSetupStep1Body: {
      ar: 'اذهب إلى منصة Firebase وأنشئ مشروعًا جديدًا. العملية سريعة ومجانية.',
      en: 'Go to the Firebase Console and create a new project. It\'s fast and free.',
      fr: 'Allez sur la console Firebase et créez un nouveau projet. C\'est rapide et gratuit.',
  },
  firebaseSetupStep1Button: {
      ar: 'الذهاب إلى منصة Firebase',
      en: 'Go to Firebase Console',
      fr: 'Aller à la console Firebase',
  },
  firebaseSetupStep2Title: {
      ar: 'الخطوة 2: الحصول على مفاتيح الإعداد',
      en: 'Step 2: Get Your Config Keys',
      fr: 'Étape 2 : Obtenez vos clés de configuration',
  },
  firebaseSetupStep2Body: {
      ar: 'في إعدادات مشروعك، أضف \'تطبيق ويب\' جديد. ستمنحك Firebase كائن `firebaseConfig` يحتوي على مفاتيحك. احتفظ بها للخطوة التالية.',
      en: 'In your project settings, add a new \'Web App\'. Firebase will give you a `firebaseConfig` object containing your keys. Keep them for the next step.',
      fr: 'Dans les paramètres de votre projet, ajoutez une nouvelle \'application Web\'. Firebase vous donnera un objet `firebaseConfig` contenant vos clés. Gardez-les pour la prochaine étape.',
  },
  firebaseSetupStep3Title: {
      ar: 'الخطوة 3: إضافة متغيرات البيئة',
      en: 'Step 3: Add Environment Variables',
      fr: 'Étape 3 : Ajouter des variables d\'environnement',
  },
  firebaseSetupStep3Body: {
      ar: 'اذهب إلى منصة النشر الخاصة بك (Vercel, Netlify, etc.) وأضف المفاتيح التي نسختها كـ \'متغيرات بيئة\'. استخدم هذه الأسماء بالضبط:',
      en: 'Go to your deployment platform (Vercel, Netlify, etc.) and add the keys you copied as \'Environment Variables\'. Use these exact names:',
      fr: 'Allez sur votre plateforme de déploiement (Vercel, Netlify, etc.) et ajoutez les clés que vous avez copiées en tant que \'Variables d\'environnement\'. Utilisez ces noms exacts :',
  },
  firebaseSetupCopyButton: {
      ar: 'نسخ',
      en: 'Copy',
      fr: 'Copier',
  },
  firebaseSetupCopiedButton: {
      ar: 'تم النسخ!',
      en: 'Copied!',
      fr: 'Copié !',
  },
  firebaseSetupStep4Title: {
      ar: 'الخطوة 4: تفعيل وتأمين قاعدة البيانات',
      en: 'Step 4: Enable & Secure Firestore',
      fr: 'Étape 4 : Activer et sécuriser Firestore',
  },
  firebaseSetupStep4Body: {
      ar: 'من لوحة تحكم Firebase، اذهب إلى Firestore Database وأنشئ قاعدة بيانات في \'وضع الإنتاج\'. بعد ذلك، اذهب إلى تبويب \'القواعد\' (Rules) والصق القاعدة الآمنة أدناه. هذه القاعدة تسمح لأي شخص بقراءة وإضافة التعليقات، ولكنها تمنع أي شخص من تعديل أو حذف تعليقات الآخرين.',
      en: 'From the Firebase dashboard, go to Firestore Database and create a database in \'production mode\'. Then, go to the \'Rules\' tab and paste the secure rule below. This rule allows anyone to read and create feedback, but prevents anyone from updating or deleting others\' posts.',
      fr: 'Depuis le tableau de bord Firebase, accédez à la base de données Firestore et créez une base de données en \'mode production\'. Ensuite, allez dans l\'onglet \'Règles\' et collez la règle sécurisée ci-dessous. Cette règle permet à quiconque de lire et de créer des commentaires, mais empêche quiconque de mettre à jour ou de supprimer les messages des autres.',
  },
  firebaseSetupStep5Title: {
      ar: 'الخطوة 5: إعادة النشر',
      en: 'Step 5: Redeploy',
      fr: 'Étape 5 : Redéployer',
  },
  firebaseSetupStep5Body: {
      ar: 'بعد إضافة المتغيرات، قم بإعادة نشر تطبيقك. سيتم تفعيل ميزة التعليقات تلقائيًا.',
      en: 'After adding the variables, redeploy your application. The feedback feature will be enabled automatically.',
      fr: 'Après avoir ajouté les variables, redéployez votre application. La fonctionnalité de commentaires sera activée automatiquement.',
  },
};

export const languageOptions: { value: Language; label: string; dir: Direction }[] = [
    { value: 'ar', label: 'العربية', dir: 'rtl' },
    { value: 'en', label: 'English', dir: 'ltr' },
    { value: 'fr', label: 'Français', dir: 'ltr' },
];

export const translationLanguages: LanguageListItem[] = [
    { code: 'ar', name: 'Arabic' },
    { code: 'bn', name: 'Bengali' },
    { code: 'zh', name: 'Chinese' },
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'hi', name: 'Hindi' },
    { code: 'id', name: 'Indonesian' },
    { code: 'it', name: 'Italian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ms', name: 'Malay' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'es', name: 'Spanish' },
    { code: 'tr', name: 'Turkish' },
    { code: 'vi', name: 'Vietnamese' },
];


export const t = (key: keyof typeof translations, lang: Language): string => {
  return translations[key][lang] || translations[key]['en'];
};

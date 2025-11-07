

export type Language = 'ar' | 'en' | 'fr';
export type Direction = 'rtl' | 'ltr';
export interface LanguageListItem {
    code: string;
    name: string;
    speechCode: string;
}

export const translations = {
  pageTitle: {
    ar: 'Sawtli - مترجم ومحول نص إلى كلام',
    en: 'Sawtli - Text-to-Speech & Translator',
    fr: 'Sawtli - Traducteur & Synthèse Vocale',
  },
  subtitle: {
    ar: 'اكتب • تكلم • ترجم • استمع',
    en: 'Write • Speak • Translate • Listen',
    fr: 'Écrivez • Parlez • Traduisez • Écoutez',
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
   geminiHdVoices: {
    ar: 'أصوات Gemini HD',
    en: 'Gemini HD Voices',
    fr: 'Voix Gemini HD',
  },
  geminiVoicesNote: {
    ar: 'هذه الأصوات عالية الجودة ومُحسَّنة للغة العربية الفصحى. قد تتوفر لهجات إضافية في المستقبل.',
    en: 'These high-quality voices are optimized for standard Arabic. Additional dialects may become available in the future.',
    fr: 'Ces voix de haute qualité sont optimisées pour l\'arabe standard. Des dialectes supplémentaires pourraient être disponibles à l\'avenir.',
  },
  systemVoices: {
    ar: 'أصوات النظام',
    en: 'System Voices',
    fr: 'Voix du Système',
  },
  suggestedVoices: {
    ar: 'الأصوات المقترحة',
    en: 'Suggested Voices',
    fr: 'Voix Suggérées',
  },
  otherSystemVoices: {
    ar: 'أصوات النظام الأخرى',
    en: 'Other System Voices',
    fr: 'Autres Voix du Système',
  },
  noRelevantSystemVoices: {
    ar: 'لا توجد أصوات نظام ذات صلة',
    en: 'No relevant system voices found',
    fr: 'Aucune voix système pertinente trouvée',
  },
  selectVoice: {
    ar: 'اختر صوتاً...',
    en: 'Select a voice...',
    fr: 'Sélectionnez une voix...',
  },
  geminiExclusiveFeature: {
    ar: 'ميزة حصرية لأصوات Gemini HD',
    en: 'This feature is exclusive to Gemini HD voices',
    fr: 'Cette fonctionnalité est exclusive aux voix Gemini HD',
  },
  voiceMale1: {
    ar: 'صوت عربي ١ (رجل)',
    en: 'Arabic Voice 1 (Male)',
    fr: 'Voix Arabe 1 (Homme)',
  },
  voiceFemale1: {
    ar: 'صوت عربي ١ (أنثى)',
    en: 'Arabic Voice 1 (Female)',
    fr: 'Voix Arabe 1 (Femme)',
  },
  voiceMale2: {
    ar: 'صوت عربي ٢ (رجل)',
    en: 'Arabic Voice 2 (Male)',
    fr: 'Voix Arabe 2 (Homme)',
  },
  voiceFemale2: {
    ar: 'صوت عربي ٢ (أنثى)',
    en: 'Arabic Voice 2 (Female)',
    fr: 'Voix Arabe 2 (Femme)',
  },
  voiceMale3: {
    ar: 'صوت عربي ٣ (رجل)',
    en: 'Arabic Voice 3 (Male)',
    fr: 'Voix Arabe 3 (Homme)',
  },
  previewVoiceTooltip: {
    ar: 'معاينة هذا الصوت',
    en: 'Preview this voice',
    fr: 'Aperçu de cette voix',
  },
  previewSystemVoice: {
    ar: 'معاينة صوت النظام',
    en: 'Preview System Voice',
    fr: 'Aperçu de la voix du système',
  },
  voicePreviewText: {
    ar: 'صوتلي معك أحلى',
    en: 'Sawtli sounds sweeter with you.',
    fr: 'Sawtli sonne plus doux avec vous.',
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
  soundEffects: {
    ar: 'مؤثرات صوتية',
    en: 'Sound Effects',
    fr: 'Effets Sonores',
  },
  addEffect: {
    ar: 'إضافة مؤثر',
    en: 'Add Effect',
    fr: 'Ajouter un Effet',
  },
  addLaugh: {
    ar: 'إضافة ضحكة',
    en: 'Add Laugh',
    fr: 'Ajouter un Rire',
  },
  addLaughter: {
    ar: 'إضافة ضحكة قوية',
    en: 'Add Laughter',
    fr: 'Ajouter un Rire Fort',
  },
  addSigh: {
    ar: 'إضافة تنهيدة',
    en: 'Add Sigh',
    fr: 'Ajouter un Soupir',
  },
  addSob: {
    ar: 'إضافة بكاء',
    en: 'Add Sob',
    fr: 'Ajouter un Sanglot',
  },
  addGasp: {
    ar: 'إضافة شهقة',
    en: 'Add Gasp',
    fr: 'Ajouter un Hoquet de Surprise',
  },
  addCough: {
    ar: 'إضافة سعلة',
    en: 'Add Cough',
    fr: 'Ajouter une Toux',
  },
  addHmm: {
    ar: 'إضافة همهمة',
    en: 'Add Hmm',
    fr: 'Ajouter un Hmm',
  },
  addCheer: {
    ar: 'إضافة هتاف',
    en: 'Add Cheer',
    fr: 'Ajouter une Acclamation',
  },
  addKiss: {
    ar: 'إضافة قبلة',
    en: 'Add Kiss',
    fr: 'Ajouter un Baiser',
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
  translatingButtonStop: {
    ar: 'إيقاف الترجمة',
    en: 'Stop Translating',
    fr: 'Arrêter la traduction',
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
    ar: 'إيقاف',
    en: 'Stop',
    fr: 'Arrêter',
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
  audioControl: {
    ar: 'استوديو الصوت',
    en: 'Sound Studio',
    fr: 'Studio Son',
  },
  audioControlTitle: {
    ar: 'استوديو تحسين الصوت',
    en: 'Audio Enhancement Studio',
    fr: 'Studio d\'Amélioration Audio',
  },
  comingSoon: {
    ar: 'معاينة استوديو الصوت',
    en: 'Sound Studio Preview',
    fr: 'Aperçu du Studio Son',
  },
  featureUnavailable: {
    ar: 'عناصر التحكم التفاعلية والمؤثرات الصوتية قيد التطوير حالياً!',
    en: 'Interactive controls and audio effects are currently under development!',
    fr: 'Les commandes interactives et les effets audio sont en cours de développement !',
  },
  hdAudio: {
    ar: 'صوت عالي الدقة (HD)',
    en: 'HD Audio',
    fr: 'Audio HD',
  },
  equalizer: {
    ar: 'موازن الصوت (EQ)',
    en: 'Equalizer (EQ)',
    fr: 'Égaliseur (EQ)',
  },
  dynamics: {
    ar: 'الديناميكيات',
    en: 'Dynamics',
    fr: 'Dynamiques',
  },
  compressor: {
    ar: 'ضاغط',
    en: 'Compressor',
    fr: 'Compresseur',
  },
  limiter: {
    ar: 'محدد',
    en: 'Limiter',
    fr: 'Limiteur',
  },
  effects: {
    ar: 'المؤثرات',
    en: 'Effects',
    fr: 'Effets',
  },
  reverb: {
    ar: 'صدى',
    en: 'Reverb',
    fr: 'Réverbération',
  },
  echo: {
    ar: 'تكرار',
    en: 'Echo',
    fr: 'Écho',
  },
  masterSection: {
    ar: 'القسم الرئيسي',
    en: 'Master Section',
    fr: 'Section Maître',
  },
  masterVolume: {
    ar: 'مستوى الصوت الرئيسي',
    en: 'Master Volume',
    fr: 'Volume Principal',
  },
  stereoWidth: {
    ar: 'اتساع ستيريو',
    en: 'Stereo Width',
    fr: 'Largeur Stéréo',
  },
  threshold: {
    ar: 'عتبة',
    en: 'Threshold',
    fr: 'Seuil',
  },
  ratio: {
    ar: 'نسبة',
    en: 'Ratio',
    fr: 'Ratio',
  },
  chorus: {
    ar: 'كورال',
    en: 'Chorus',
    fr: 'Chorus',
  },
  checkingServerConfig: {
    ar: 'جاري فحص إعدادات الخادم...',
    en: 'Checking server configuration...',
    fr: 'Vérification de la configuration du serveur...',
  },
  configNeededTitle: {
      ar: 'إجراء مطلوب: إعدادات الخادم غير مكتملة',
      en: 'Action Required: Server Configuration Incomplete',
      fr: 'Action Requise : Configuration du Serveur Incomplète',
  },
  configNeededBody_AppOwner: {
    ar: 'يا صاحب التطبيق! الميزات الأساسية معطلة لأن مفتاح API غير موجود. لإصلاح ذلك، اذهب إلى لوحة تحكم Vercel وأضف متغير بيئة (Environment Variable) بالإعدادات التالية.',
    en: 'Hey App Owner! Core features are disabled because the API key is missing. To fix this, go to your Vercel dashboard and add an Environment Variable with the following settings.',
    fr: 'Salut propriétaire de l\'application ! Les fonctionnalités de base sont désactivées car la clé API est manquante. Pour résoudre ce problème, accédez à votre tableau de bord Vercel et ajoutez une variable d\'environnement avec les paramètres suivants.',
  },
  goToVercelButton: {
      ar: 'الذهاب إلى إعدادات Vercel',
      en: 'Go to Vercel Settings',
      fr: 'Aller aux paramètres Vercel',
  },
  configNeededNote_Users: {
      ar: 'ملاحظة: هذه الرسالة تظهر فقط لصاحب التطبيق. لن يراها المستخدمون العاديون بمجرد اكتمال الإعداد.',
      en: 'Note: This message is only visible to the app owner. Regular users will not see this once the setup is complete.',
      fr: 'Remarque : Ce message n\'est visible que par le propriétaire de l\'application. Les utilisateurs réguliers ne le verront pas une fois la configuration terminée.',
  },
  dailyUsageLabel: {
    ar: 'الاستخدام اليومي',
    en: 'Daily Usage',
    fr: 'Usage Quotidien',
  },
  signIn: {
    ar: 'تسجيل الدخول',
    en: 'Sign In',
    fr: 'Se connecter',
  },
  signOut: {
    ar: 'تسجيل الخروج',
    en: 'Sign Out',
    fr: 'Se déconnecter',
  },
  signInError: {
    ar: 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.',
    en: 'Sign-in failed. Please try again.',
    fr: 'La connexion a échoué. Veuillez réessayer.',
  },
  manageAccount: {
    ar: 'إدارة الحساب',
    en: 'Manage Account',
    fr: 'Gérer le Compte',
  },
  joinedDate: {
    ar: 'تاريخ الانضمام',
    en: 'Joined',
    fr: 'Inscrit le',
  },
  dataManagement: {
    ar: 'إدارة البيانات',
    en: 'Data Management',
    fr: 'Gestion des Données',
  },
  clearCloudHistory: {
    ar: 'مسح سجل السحابة',
    en: 'Clear Cloud History',
    fr: 'Effacer l\'Historique Cloud',
  },
  clearCloudHistoryInfo: {
    ar: 'سيؤدي هذا إلى حذف سجل الترجمة بالكامل بشكل دائم من حسابك.',
    en: 'This will permanently delete your entire translation history from your account.',
    fr: 'Ceci supprimera définitivement tout votre historique de traduction de votre compte.',
  },
  dangerZone: {
    ar: 'منطقة الخطر',
    en: 'Danger Zone',
    fr: 'Zone de Danger',
  },
  deleteAccount: {
    ar: 'حذف الحساب',
    en: 'Delete Account',
    fr: 'Supprimer le Compte',
  },
  deleteAccountInfo: {
    ar: 'سيؤدي هذا إلى حذف حسابك وجميع بياناتك المرتبطة به بشكل دائم. لا يمكن التراجع عن هذا الإجراء.',
    en: 'This will permanently delete your account and all associated data. This action cannot be undone.',
    fr: 'Ceci supprimera définitivement votre compte et toutes les données associées. Cette action est irréversible.',
  },
  deleteConfirmation: {
    ar: 'هل أنت متأكد؟',
    en: 'Are you sure?',
    fr: 'Êtes-vous sûr ?',
  },
  deleteAccountConfirmationPrompt: {
    ar: 'هل أنت متأكد أنك تريد حذف حسابك؟ سيتم مسح جميع بياناتك بشكل دائم.',
    en: 'Are you sure you want to delete your account? All of your data will be permanently erased.',
    fr: 'Êtes-vous sûr de vouloir supprimer votre compte ? Toutes vos données seront effacées de manière permanente.',
  },
  accountDeletedSuccess: {
    ar: 'تم حذف حسابك بنجاح.',
    en: 'Your account has been successfully deleted.',
    fr: 'Votre compte a été supprimé avec succès.',
  },
  accountDeletionError: {
    ar: 'حدث خطأ أثناء حذف الحساب. قد تحتاج إلى تسجيل الدخول مرة أخرى والمحاولة مرة أخرى.',
    en: 'An error occurred while deleting the account. You may need to sign in again and retry.',
    fr: 'Une erreur est survenue lors de la suppression du compte. Vous devrez peut-être vous reconnecter et réessayer.',
  },
  historyClearSuccess: {
    ar: 'تم مسح سجل السحابة بنجاح.',
    en: 'Cloud history cleared successfully.',
    fr: 'L\'historique cloud a été effacé avec succès.',
  },
  historyClearError: {
    ar: 'فشل مسح سجل السحابة.',
    en: 'Failed to clear cloud history.',
    fr: 'Échec de l\'effacement de l\'historique cloud.',
  },
  errorApiKeyMissing: {
      ar: 'وضع المطور: يرجى إدخال مفتاح Gemini API الخاص بك عند المطالبة لاستخدام هذه الميزة.',
      en: 'Developer Mode: Please enter your Gemini API Key when prompted to use this feature.',
      fr: 'Mode Développeur : Veuillez saisir votre clé API Gemini lorsque vous y êtes invité pour utiliser cette fonctionnalité.',
  },
  errorApiNoAudio: {
    ar: 'لم يتم استلام أي بيانات صوتية من الواجهة البرمجية.',
    en: 'No audio data received from the API.',
    fr: 'Aucune donnée audio reçue de l\'API.',
  },
  errorUnexpected: {
    ar: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
    en: 'An unexpected error occurred. Please try again.',
    fr: 'Une erreur inattendue est survenue. Veuillez réessayer.',
  },
   errorRateLimit: {
    ar: 'لقد وصلت إلى الحد الأقصى للاستخدام اليومي من الأحرف. يرجى المحاولة مرة أخرى غدًا.',
    en: 'You have reached the daily character usage limit. Please try again tomorrow.',
    fr: 'Vous avez atteint la limite quotidienne d\'utilisation des caractères. Veuillez réessayer demain.',
  },
  errorRequestTimeout: {
    ar: 'استغرق الطلب وقتاً طويلاً جداً. قد يحدث هذا مع النصوص الطويلة. يرجى المحاولة بنص أقصر أو التحقق من اتصالك بالإنترنت.',
    en: 'The request took too long. This can happen with long texts. Please try with a shorter text or check your internet connection.',
    fr: 'La requête a pris trop de temps. Cela peut arriver avec des textes longs. Veuillez essayer avec un texte plus court ou vérifier votre connexion.',
  },
  errorSpeechGeneration: {
    ar: 'فشل في توليد الصوت. قد تكون هناك مشكلة في الخدمة. يرجى المحاولة مرة أخرى لاحقاً.',
    en: 'Failed to generate speech. There may be an issue with the service. Please try again later.',
    fr: 'Échec de la génération de la parole. Il y a peut-être un problème avec le service. Veuillez réessayer plus tard.',
  },
  errorTranslate: {
    ar: 'فشلت عملية الترجمة. يرجى التحقق من النص والمحاولة مرة أخرى.',
    en: 'Translation failed. Please check your text and try again.',
    fr: 'La traduction a échoué. Veuillez vérifier votre texte et réessayer.',
  },
  errorMp3Encoding: {
    ar: 'فشل تحويل الملف إلى MP3. يرجى محاولة التحميل بصيغة WAV.',
    en: 'Failed to encode to MP3. Please try downloading as WAV.',
    fr: 'Échec de l\'encodage en MP3. Veuillez essayer de télécharger en WAV.',
  },
   errorDownloadSystemVoice: {
    ar: 'لا يمكن تحميل الأصوات من النظام. يرجى اختيار أحد أصوات Gemini HD لتفعيل التحميل.',
    en: 'System voices cannot be downloaded. Please select a Gemini HD voice to enable downloading.',
    fr: 'Les voix du système ne peuvent pas être téléchargées. Veuillez sélectionner une voix Gemini HD pour activer le téléchargement.',
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
      en: 'From the Firebase dashboard, go to to Firestore Database and create a database in \'production mode\'. Then, go to the \'Rules\' tab and paste the secure rule below. This rule allows anyone to read and create feedback, but prevents anyone from updating or deleting others\' posts.',
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
    { code: 'ar', name: 'Arabic', speechCode: 'ar-SA' },
    { code: 'bn', name: 'Bengali', speechCode: 'bn-BD' },
    { code: 'zh', name: 'Chinese', speechCode: 'zh-CN' },
    { code: 'en', name: 'English', speechCode: 'en-US' },
    { code: 'fr', name: 'French', speechCode: 'fr-FR' },
    { code: 'de', name: 'German', speechCode: 'de-DE' },
    { code: 'hi', name: 'Hindi', speechCode: 'hi-IN' },
    { code: 'id', name: 'Indonesian', speechCode: 'id-ID' },
    { code: 'it', name: 'Italian', speechCode: 'it-IT' },
    { code: 'ja', name: 'Japanese', speechCode: 'ja-JP' },
    { code: 'ko', name: 'Korean', speechCode: 'ko-KR' },
    { code: 'ms', name: 'Malay', speechCode: 'ms-MY' },
    { code: 'pt', name: 'Portuguese', speechCode: 'pt-BR' },
    { code: 'ru', name: 'Russian', speechCode: 'ru-RU' },
    { code: 'es', name: 'Spanish', speechCode: 'es-ES' },
    { code: 'tr', name: 'Turkish', speechCode: 'tr-TR' },
    { code: 'vi', name: 'Vietnamese', speechCode: 'vi-VN' },
];


/**
 * Gets a translated string for a given key and language.
 * Falls back to English if the key is not found for the given language.
 * This is now a hoisted function declaration to prevent module initialization errors.
 * It also includes a defensive check to prevent crashes if a key is missing entirely.
 * @param key The key of the translation string.
 * @param lang The target language.
 * @returns The translated string.
 */
export function t(key: keyof typeof translations, lang: Language): string {
  const entry = translations[key];
  if (!entry) {
    console.error(`Translation key "${key}" not found.`);
    return key; // Return the key itself as a fallback to prevent crashing.
  }
  return entry[lang] || entry['en'];
}
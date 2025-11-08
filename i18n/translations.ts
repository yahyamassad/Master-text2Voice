

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
  closeButton: {
    ar: 'إغلاق',
    en: 'Close',
    fr: 'Fermer',
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
    ar: 'لا توجد أصوات نظام ذات صلة للغات المحددة.',
    en: 'No relevant system voices found for the selected languages.',
    fr: 'Aucune voix système pertinente trouvée pour les langues sélectionnées.',
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
  geminiVoiceSettings: {
    ar: 'إعدادات أصوات Gemini',
    en: 'Gemini Voice Settings',
    fr: 'Paramètres Voix Gemini',
  },
  voiceMale1: {
    ar: 'Puck (رجل)',
    en: 'Puck (Male)',
    fr: 'Puck (Homme)',
  },
  voiceFemale1: {
    ar: 'Kore (أنثى)',
    en: 'Kore (Female)',
    fr: 'Kore (Femme)',
  },
  voiceMale2: {
    ar: 'Charon (رجل)',
    en: 'Charon (Male)',
    fr: 'Charon (Homme)',
  },
  voiceFemale2: {
    ar: 'Zephyr (أنثى)',
    en: 'Zephyr (Female)',
    fr: 'Zephyr (Femme)',
  },
  voiceMale3: {
    ar: 'Fenrir (رجل)',
    en: 'Fenrir (Male)',
    fr: 'Fenrir (Homme)',
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
    ar: 'مرحباً. هذا هو صوتي.',
    en: 'Hello. This is my voice.',
    fr: 'Bonjour. C\'est ma voix.',
  },
  emotionLabel: {
    ar: 'النبرة العامة',
    en: 'Overall Tone',
    fr: 'Ton Général',
  },
  emotionLabelInfo: {
      ar: 'يضبط نبرة الصوت العامة. يمكنك أيضًا استخدام علامات مضمنة مثل "(بحزن)" لتغيير النبرة لجزء معين من النص.',
      en: 'Sets the general tone of the voice. You can also use inline tags like "(sadly)" to change the tone for a specific part of the text.',
      fr: 'Définit le ton général de la voix. Vous pouvez également utiliser des balises en ligne comme "(tristement)" pour changer le ton d\'une partie spécifique du texte.',
  },
  emotionDefault: {
    ar: 'افتراضي',
    en: 'Default',
    fr: 'Défaut',
  },
  emotionHappy: {
    ar: 'سعيد',
    en: 'Happy',
    fr: 'Joyeux',
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
  multiSpeakerExclusive: {
    ar: 'هذه الميزة تعتمد على أصوات Gemini عالية الجودة فقط.',
    en: 'This feature relies on Gemini HD voices only.',
    fr: 'Cette fonctionnalité repose uniquement sur les voix Gemini HD.',
  },
  multiSpeakerTooltip: {
    ar: 'للحصول على نتيجة أفضل، نسّق النص على شكل \'اسم المتحدث: النص المطلوب!\' في كل سطر.',
    en: 'For best results, format your text like \'Speaker Name: Your text!\' on each line.',
    fr: 'Pour de meilleurs résultats, formatez votre texte comme \'Nom du locuteur : Votre texte !\' sur chaque ligne.',
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
  audioStudio: {
    ar: 'استوديو الصوت',
    en: 'Audio Studio',
    fr: 'Studio Audio',
  },
    audioEnhancementStudio: {
    ar: 'استوديو تحسين الصوت',
    en: 'Audio Enhancement Studio',
    fr: 'Studio d\'Amélioration Audio',
  },
  audioStudioPreview: {
    ar: 'معاينة استوديو الصوت',
    en: 'Audio Studio Preview',
    fr: 'Aperçu du Studio Audio',
  },
  previewNotice: {
    ar: 'عذراً، التحكم والتأثيرات الصوتية المتقدمة قيد التطوير حالياً!',
    en: 'Sorry, advanced audio controls and effects are currently under development!',
    fr: 'Désolé, les contrôles audio avancés et les effets sont actuellement en cours de développement !',
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
  delay: {
    ar: 'تكرار',
    en: 'Delay',
    fr: 'Délai',
  },
  chorus: {
    ar: 'جوقة',
    en: 'Chorus',
    fr: 'Chorus',
  },
  hdAudio: {
    ar: 'صوت عالي الدقة (HD)',
    en: 'HD Audio',
    fr: 'Audio HD',
  },
  mainSection: {
    ar: 'القسم الرئيسي',
    en: 'Main Section',
    fr: 'Section Principale',
  },
  mainVolume: {
    ar: 'مستوى الصوت',
    en: 'Volume',
    fr: 'Volume',
  },
  stereoWidth: {
    ar: 'اتساع ستيريو',
    en: 'Stereo Width',
    fr: 'Largeur Stéréo',
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
  limiter: {
    ar: 'محدد',
    en: 'Limiter',
    fr: 'Limiteur',
  },
  compressor: {
    ar: 'ضاغط',
    en: 'Compressor',
    fr: 'Compresseur',
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
  signInNotConfigured: {
    ar: 'خدمة تسجيل الدخول غير مهيأة حاليًا.',
    en: 'Sign-in service is not currently configured.',
    fr: 'Le service de connexion n\'est pas configuré actuellement.',
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
    fr: 'Supprimer le compte',
  },
  deleteAccountInfo: {
      ar: 'سيؤدي هذا إلى حذف حسابك وجميع بياناتك المرتبطة به بشكل دائم. لا يمكن التراجع عن هذا الإجراء.',
      en: 'This will permanently delete your account and all associated data. This action cannot be undone.',
      fr: 'Ceci supprimera définitivement votre compte et toutes les données associées. Cette action est irréversible.',
  },
  deleteAccountConfirmationPrompt: {
      ar: 'هل أنت متأكد أنك تريد حذف حسابك؟ سيتم حذف جميع بياناتك بشكل دائم.',
      en: 'Are you sure you want to delete your account? All your data will be permanently erased.',
      fr: 'Êtes-vous sûr de vouloir supprimer votre compte ? Toutes vos données seront effacées de manière permanente.',
  },
  deleteConfirmation: {
      ar: 'حذف',
      en: 'Delete',
      fr: 'Supprimer',
  },
  accountDeletedSuccess: {
    ar: 'تم حذف الحساب بنجاح.',
    en: 'Account deleted successfully.',
    fr: 'Compte supprimé avec succès.',
  },
  accountDeletionError: {
    ar: 'حدث خطأ أثناء حذف الحساب. قد تحتاج إلى تسجيل الخروج وتسجيل الدخول مرة أخرى قبل المحاولة مرة أخرى.',
    en: 'An error occurred while deleting the account. You may need to sign out and sign back in before trying again.',
    fr: 'Une erreur s\'est produite lors de la suppression du compte. Vous devrez peut-être vous déconnecter et vous reconnecter avant de réessayer.',
  },
  yourUserId: {
      ar: 'معرف المستخدم الخاص بك',
      en: 'Your User ID',
      fr: 'Votre ID Utilisateur',
  },
  copyIdTooltip: {
      ar: 'نسخ المعرف',
      en: 'Copy ID',
      fr: 'Copier l\'ID',
  },
  ownerUidInfo: {
    ar: 'لتمكين صلاحيات المطور، قم بتعيين هذا المعرف كـ VITE_OWNER_UID في متغيرات البيئة الخاصة بك.',
    en: 'To enable developer powers, set this ID as VITE_OWNER_UID in your environment variables.',
    fr: 'Pour activer les pouvoirs de développeur, définissez cet ID comme VITE_OWNER_UID dans vos variables d\'environnement.',
  },
  developerPowers: {
      ar: 'صلاحيات المطور',
      en: 'Developer Powers',
      fr: 'Pouvoirs du Développeur',
  },
  devModeActive: {
      ar: 'وضع المطور نشط!',
      en: 'Developer Mode is Active!',
      fr: 'Le Mode Développeur est Actif !',
  },
  devModeInactive: {
      ar: 'وضع المطور غير نشط',
      en: 'Developer Mode is Inactive',
      fr: 'Le Mode Développeur est Inactif',
  },
  devModeInfo: {
      ar: 'يتجاوز هذا الوضع حدود الاستخدام العادية ويتطلب مفتاحًا سريًا للمالك يتم توفيره بشكل منفصل. مخصص للاختبار فقط.',
      en: 'This mode bypasses normal usage limits and requires an owner secret key provided separately. For testing only.',
      fr: 'Ce mode contourne les limites d\'utilisation normales et nécessite une clé secrète du propriétaire fournie séparément. Pour les tests uniquement.',
  },
  enterSecretKey: {
      ar: 'أدخل المفتاح السري...',
      en: 'Enter secret key...',
      fr: 'Entrez la clé secrète...',
  },
  activate: {
      ar: 'تفعيل',
      en: 'Activate',
      fr: 'Activer',
  },
  deactivate: {
      ar: 'إلغاء التفعيل',
      en: 'Deactivate',
      fr: 'Désactiver',
  },
  keySaved: {
      ar: 'تم حفظ المفتاح لهذه الجلسة.',
      en: 'Key saved for this session.',
      fr: 'Clé enregistrée pour cette session.',
  },
  keyRemoved: {
      ar: 'تمت إزالة المفتاح. تم إلغاء تفعيل وضع المطور.',
      en: 'Key removed. Developer mode deactivated.',
      fr: 'Clé supprimée. Mode développeur désactivé.',
  },
  historyClearSuccess: {
      ar: 'تم مسح السجل بنجاح.',
      en: 'History cleared successfully.',
      fr: 'Historique effacé avec succès.',
  },
  historyClearError: {
      ar: 'حدث خطأ أثناء مسح السجل.',
      en: 'Error clearing history.',
      fr: 'Erreur lors de l\'effacement de l\'historique.',
  },
   errorUnexpected: {
    ar: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
    en: 'An unexpected error occurred. Please try again.',
    fr: 'Une erreur inattendue est survenue. Veuillez réessayer.',
  },
  errorApiKeyMissing: {
    ar: 'خطأ في الخادم: مفتاح API مفقود. يجب على مالك التطبيق تكوين متغيرات البيئة في Vercel.',
    en: 'Server Error: API key is missing. The app owner must configure the environment variables on Vercel.',
    fr: 'Erreur Serveur : Clé API manquante. Le propriétaire de l\'application doit configurer les variables d\'environnement sur Vercel.',
  },
  errorRateLimit: {
    ar: 'لقد تجاوزت حد الاستخدام. يرجى المحاولة مرة أخرى لاحقًا.',
    en: 'You have exceeded the usage limit. Please try again later.',
    fr: 'Vous avez dépassé la limite d\'utilisation. Veuillez réessayer plus tard.',
  },
  errorRequestTimeout: {
    ar: 'انتهت مهلة الطلب. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.',
    en: 'The request timed out. Please check your internet connection and try again.',
    fr: 'La demande a expiré. Veuillez vérifier votre connexion Internet et réessayer.',
  },
  errorTranslate: {
    ar: 'فشل في الترجمة. يرجى التحقق من النص والمحاولة مرة أخرى.',
    en: 'Failed to translate. Please check your text and try again.',
    fr: 'La traduction a échoué. Veuillez vérifier votre texte et réessayer.',
  },
  errorSpeechGeneration: {
    ar: 'فشل في توليد الكلام.',
    en: 'Failed to generate speech.',
    fr: 'La génération de la parole a échoué.',
  },
  errorSpeechGenerationSystem: {
    ar: 'فشل تشغيل صوت النظام {voiceName}. قد لا يكون مدعومًا بالكامل في متصفحك. جرب صوتًا آخر أو استخدم أصوات Gemini HD لضمان التوافق.',
    en: 'System voice {voiceName} failed to play. It may not be fully supported by your browser. Try another voice or use Gemini HD voices for guaranteed compatibility.',
    fr: 'La voix système {voiceName} n\'a pas pu être lue. Elle n\'est peut-être pas entièrement prise en charge par votre navigateur. Essayez une autre voix ou utilisez les voix Gemini HD pour une compatibilité garantie.',
  },
  errorDownloadSystemVoice: {
    ar: 'لا يمكن تحميل الأصوات من نظام التشغيل مباشرة. يرجى اختيار صوت Gemini HD للتحميل.',
    en: 'Cannot download system voices directly. Please select a Gemini HD voice to download.',
    fr: 'Impossible de télécharger directement les voix du système. Veuillez sélectionner une voix Gemini HD pour télécharger.',
  },
  errorApiNoAudio: {
    ar: 'لم تتمكن الواجهة البرمجية من إرجاع بيانات صوتية. قد تكون هناك مشكلة في الخدمة.',
    en: 'The API did not return audio data. There might be an issue with the service.',
    fr: 'L\'API n\'a pas retourné de données audio. Il pourrait y avoir un problème avec le service.',
  },
  errorMp3Encoding: {
    ar: 'حدث خطأ أثناء تحويل الصوت إلى MP3.',
    en: 'An error occurred during MP3 encoding.',
    fr: 'Une erreur s\'est produite lors de l\'encodage MP3.',
  },
  errorMicNotSupported: {
    ar: 'التعرف على الكلام غير مدعوم في هذا المتصفح.',
    en: 'Speech recognition is not supported on this browser.',
    fr: 'La reconnaissance vocale n\'est pas prise en charge sur ce navigateur.',
  },
  errorMicPermission: {
    ar: 'تم رفض إذن استخدام الميكروفون. يرجى تمكينه في إعدادات المتصفح.',
    en: 'Microphone permission denied. Please enable it in your browser settings.',
    fr: 'Autorisation du microphone refusée. Veuillez l\'activer dans les paramètres de votre navigateur.',
  },
   feedbackTitle: {
    ar: 'شاركنا رأيك!',
    en: 'Share Your Feedback!',
    fr: 'Partagez Vos Commentaires !',
  },
  feedbackSubtitle: {
    ar: 'ساعدنا في تحسين Sawtli. ما الذي أعجبك؟ ما الذي يمكن أن يكون أفضل؟',
    en: 'Help us improve Sawtli. What did you like? What could be better?',
    fr: 'Aidez-nous à améliorer Sawtli. Qu\'avez-vous aimé ? Qu\'est-ce qui pourrait être amélioré ?',
  },
  yourName: {
    ar: 'اسمك (اختياري)',
    en: 'Your Name (Optional)',
    fr: 'Votre Nom (Facultatif)',
  },
  yourRating: {
    ar: 'تقييمك:',
    en: 'Your Rating:',
    fr: 'Votre Évaluation :',
  },
  yourComment: {
    ar: 'تعليقك...',
    en: 'Your comment...',
    fr: 'Votre commentaire...',
  },
  submitFeedback: {
    ar: 'إرسال التقييم',
    en: 'Submit Feedback',
    fr: 'Envoyer les Commentaires',
  },
  submittingFeedback: {
    ar: 'جاري الإرسال...',
    en: 'Submitting...',
    fr: 'Envoi en cours...',
  },
  feedbackSuccess: {
    ar: 'شكرًا لك! تم استلام تقييمك بنجاح.',
    en: 'Thank you! Your feedback has been received.',
    fr: 'Merci ! Vos commentaires ont été reçus.',
  },
  feedbackError: {
    ar: 'حدث خطأ أثناء إرسال تقييمك. يرجى المحاولة مرة أخرى.',
    en: 'An error occurred while submitting your feedback. Please try again.',
    fr: 'Une erreur s\'est produite lors de l\'envoi de vos commentaires. Veuillez réessayer.',
  },
  feedbackSubmissionDisabled: {
    ar: 'إرسال التقييمات الجديدة غير متاح حاليًا.',
    en: 'Submitting new feedback is currently unavailable.',
    fr: 'La soumission de nouveaux commentaires est actuellement indisponible.',
  },
  noFeedbackYet: {
    ar: 'لا توجد تقييمات حتى الآن. كن أول من يشاركنا رأيه!',
    en: 'No feedback yet. Be the first to share your thoughts!',
    fr: 'Aucun commentaire pour le moment. Soyez le premier à partager votre avis !',
  },
  appOwnerNoticeTitle: {
    ar: 'إشعارات مالك التطبيق',
    en: 'App Owner Notices',
    fr: 'Avis au propriétaire de l\'application',
  },
  appOwnerNoticeBody: {
    ar: 'ميزة واحدة أو أكثر تتطلب إعدادًا إضافيًا. هذا الإشعار مرئي لك فقط.',
    en: 'One or more features require additional setup. This notice is only visible to you.',
    fr: 'Une ou plusieurs fonctionnalités nécessitent une configuration supplémentaire. Cet avis n\'est visible que pour vous.',
  },
  feedbackConfigNeededTitle: {
      ar: 'ميزة تسجيل الدخول والتقييمات معطلة',
      en: 'Login & Feedback Features Disabled',
      fr: 'Fonctionnalités de Connexion & Commentaires Désactivées',
  },
  feedbackConfigNeededBody: {
      ar: 'يا صاحب التطبيق! لتمكين تسجيل دخول المستخدمين، حفظ السجلات، والتقييمات، تحتاج إلى إعداد Firebase. يرجى اتباع الدليل.',
      en: 'Hey App Owner! To enable user sign-in, history saving, and feedback, you need to set up Firebase. Please follow the guide.',
      fr: 'Salut propriétaire de l\'application ! Pour activer la connexion des utilisateurs, la sauvegarde de l\'historique et les commentaires, vous devez configurer Firebase. Veuillez suivre le guide.',
  },
  firebaseSetupGuideTitle: {
      ar: 'دليل إعداد Firebase (لصاحب التطبيق)',
      en: 'Firebase Setup Guide (For App Owner)',
      fr: 'Guide de Configuration Firebase (Pour le Propriétaire)',
  },
  firebaseSetupStep1Title: {
      ar: 'الخطوة 1: إنشاء مشروع Firebase',
      en: 'Step 1: Create a Firebase Project',
      fr: 'Étape 1 : Créer un projet Firebase',
  },
  firebaseSetupStep1Body: {
      ar: 'اذهب إلى وحدة تحكم Firebase، وأنشئ مشروعًا جديدًا، وأضف تطبيق ويب إليه.',
      en: 'Go to the Firebase Console, create a new project, and add a web app to it.',
      fr: 'Allez sur la console Firebase, créez un nouveau projet et ajoutez-y une application web.',
  },
  firebaseSetupStep1Button: {
      ar: 'الذهاب إلى Firebase Console',
      en: 'Go to Firebase Console',
      fr: 'Aller à la Console Firebase',
  },
  firebaseSetupStep2Title: {
      ar: 'الخطوة 2: تفعيل المصادقة و Firestore',
      en: 'Step 2: Enable Authentication & Firestore',
      fr: 'Étape 2 : Activer l\'Authentification & Firestore',
  },
  firebaseSetupStep2Body: {
      ar: 'في مشروعك، قم بتفعيل "Authentication" (اختر Google كمزود خدمة). ثم، أنشئ قاعدة بيانات "Firestore Database" في وضع الإنتاج.',
      en: 'In your project, enable "Authentication" (choose Google as a provider). Then, create a "Firestore Database" in production mode.',
      fr: 'Dans votre projet, activez "Authentication" (choisissez Google comme fournisseur). Ensuite, créez une base de données "Firestore Database" en mode production.',
  },
  firebaseSetupStep3Title: {
      ar: 'الخطوة 3: إضافة متغيرات البيئة',
      en: 'Step 3: Add Environment Variables',
      fr: 'Étape 3 : Ajouter les variables d\'environnement',
  },
  firebaseSetupStep3Body: {
      ar: 'انسخ بيانات تهيئة Firebase لتطبيق الويب الخاص بك وأضفها كمتغيرات بيئة في لوحة تحكم Vercel. يجب أن تبدأ أسماء المتغيرات بـ `VITE_`.',
      en: 'Copy your Firebase web app configuration credentials and add them as environment variables in your Vercel dashboard. The variable names must start with `VITE_`.',
      fr: 'Copiez les informations de configuration de votre application web Firebase et ajoutez-les comme variables d\'environnement dans votre tableau de bord Vercel. Les noms des variables doivent commencer par `VITE_`.',
  },
  firebaseSetupStep4Title: {
      ar: 'الخطوة 4: تعيين قواعد Firestore',
      en: 'Step 4: Set Firestore Rules',
      fr: 'Étape 4 : Définir les règles Firestore',
  },
  firebaseSetupStep4Body: {
      ar: 'اذهب إلى علامة التبويب "Rules" في Firestore واستبدل القواعد الافتراضية بالقواعد التالية للسماح للمستخدمين بإدارة بياناتهم الخاصة والتقييمات.',
      en: 'Go to the "Rules" tab in Firestore and replace the default rules with the following to allow users to manage their own data and feedback.',
      fr: 'Allez dans l\'onglet "Rules" de Firestore et remplacez les règles par défaut par les suivantes pour permettre aux utilisateurs de gérer leurs propres données et commentaires.',
  },
  firebaseSetupStep5Title: {
      ar: 'الخطوة 5: إعادة نشر التطبيق',
      en: 'Step 5: Redeploy Application',
      fr: 'Étape 5 : Redéployer l\'application',
  },
  firebaseSetupStep5Body: {
      ar: 'بعد إضافة متغيرات البيئة، يجب عليك إعادة نشر مشروع Vercel الخاص بك حتى تدخل التغييرات حيز التنفيذ.',
      en: 'After adding the environment variables, you must redeploy your Vercel project for the changes to take effect.',
      fr: 'Après avoir ajouté les variables d\'environnement, vous devez redéployer votre projet Vercel pour que les modifications prennent effet.',
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
};

export const languageOptions: { value: Language, label: string, dir: Direction }[] = [
    { value: 'ar', label: 'العربية', dir: 'rtl' },
    { value: 'en', label: 'English', dir: 'ltr' },
    { value: 'fr', label: 'Français', dir: 'ltr' },
];

export const translationLanguages: LanguageListItem[] = [
    { code: 'ar', name: 'Arabic', speechCode: 'ar-SA' },
    { code: 'en', name: 'English', speechCode: 'en-US' },
    { code: 'fr', name: 'French', speechCode: 'fr-FR' },
    { code: 'es', name: 'Spanish', speechCode: 'es-ES' },
    { code: 'de', name: 'German', speechCode: 'de-DE' },
    { code: 'it', name: 'Italian', speechCode: 'it-IT' },
    { code: 'ja', name: 'Japanese', speechCode: 'ja-JP' },
    { code: 'ko', name: 'Korean', speechCode: 'ko-KR' },
    { code: 'pt', name: 'Portuguese', speechCode: 'pt-BR' },
    { code: 'ru', name: 'Russian', speechCode: 'ru-RU' },
    { code: 'zh', name: 'Chinese', speechCode: 'zh-CN' },
    { code: 'hi', name: 'Hindi', speechCode: 'hi-IN' },
    { code: 'tr', name: 'Turkish', speechCode: 'tr-TR' },
];

export function t(key: keyof typeof translations, lang: Language): string {
    return translations[key][lang] || translations[key]['en'];
}
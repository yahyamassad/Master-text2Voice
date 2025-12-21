
export type Language = 'en' | 'ar' | 'fr' | 'es' | 'pt';

export const translationLanguages = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'العربية' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'pt', name: 'Português' },
];

export const translations: Record<string, Record<Language, string>> = {
  // --- GENERAL ---
  closeButton: { en: 'Close', ar: 'إغلاق', fr: 'Fermer', es: 'Cerrar', pt: 'Fechar' },
  saveButton: { en: 'Save', ar: 'حفظ', fr: 'Enregistrer', es: 'Guardar', pt: 'Salvar' },
  cancelButton: { en: 'Cancel', ar: 'إلغاء', fr: 'Annuler', es: 'Cancelar', pt: 'Cancelar' },
  loading: { en: 'Loading...', ar: 'جاري التحميل...', fr: 'Chargement...', es: 'Cargando...', pt: 'Carregando...' },

  // --- ARABIC DIALECTS ---
  dialectLabel: { ar: 'اللهجة العربية', en: 'Arabic Dialect', fr: 'Dialecte Arabe', es: 'Dialecto Árabe', pt: 'Dialeto Árabe' },
  dialectStandard: { ar: 'العربية الفصحى', en: 'Modern Standard', fr: 'Arabe Standard', es: 'Árabe Estándar', pt: 'Árabe Padrão' },
  dialectWhite: { ar: 'لهجة بيضاء (عامة)', en: 'White Dialect', fr: 'Dialecte Neutre', es: 'Dialecto Neutro', pt: 'Dialeto Neutro' },
  dialectKhaleeji: { ar: 'لهجة خليجية', en: 'Gulf (Khaleeji)', fr: 'Dialecte du Golfe', es: 'Dialecto del Golfo', pt: 'Dialeto do Golfo' },
  dialectLevantine: { ar: 'لهجة شامية', en: 'Levantine (Shami)', fr: 'Levantin', es: 'Levantino', pt: 'Levantino' },
  dialectEgyptian: { ar: 'لهجة مصرية', en: 'Egyptian', fr: 'Égyptien', es: 'Egipcio', pt: 'Egípcio' },
  dialectMaghrebi: { ar: 'لهجة مغاربية', en: 'Maghrebi', fr: 'Maghrébin', es: 'Magrebí', pt: 'Magrebino' },
  dialectIraqi: { ar: 'لهجة عراقية', en: 'Iraqi', fr: 'Irakien', es: 'Iraquí', pt: 'Iraquiano' },

  // --- SETTINGS ---
  settingsTitle: { en: 'Settings', ar: 'الإعدادات', fr: 'Paramètres', es: 'Ajustes', pt: 'Configurações' },
  voiceLabel: { en: 'Voice', ar: 'الصوت', fr: 'Voix', es: 'Voz', pt: 'Voz' },
  emotionLabel: { en: 'Emotion / Style', ar: 'المشاعر / الأسلوب', fr: 'Émotion / Style', es: 'Emoción / Estilo', pt: 'Emoção / Estilo' },
  speedLabel: { en: 'Speed', ar: 'السرعة', fr: 'Vitesse', es: 'Velocidad', pt: 'Velocidade' },
  pauseLabel: { en: 'Pause Duration', ar: 'مدة التوقف', fr: 'Durée de pause', es: 'Duración de la pausa', pt: 'Duração da pausa' },

  // --- FEEDBACK & REPORT ---
  feedbackTitle: { en: 'Feedback', ar: 'التعليقات', fr: 'Commentaires', es: 'Comentarios', pt: 'Comentários' },
  feedbackSubtitle: { en: 'We value your opinion', ar: 'رأيك يهمنا', fr: 'Votre avis nous intéresse', es: 'Valoramos tu opinión', pt: 'Valorizamos sua opinião' },
  yourName: { en: 'Your Name', ar: 'اسمك', fr: 'Votre nom', es: 'Tu nombre', pt: 'Seu nome' },
  yourRating: { en: 'Rating', ar: 'التقييم', fr: 'Note', es: 'Calificación', pt: 'Avaliação' },
  yourComment: { en: 'Comment', ar: 'التعليق', fr: 'Commentaire', es: 'Comentario', pt: 'Comentário' },
  submitFeedback: { en: 'Submit', ar: 'إرسال', fr: 'Envoyer', es: 'Enviar', pt: 'Enviar' },
  submittingFeedback: { en: 'Submitting...', ar: 'جاري الإرسال...', fr: 'Envoi...', es: 'Enviando...', pt: 'Enviando...' },
  feedbackSuccess: { en: 'Thank you!', ar: 'شكراً لك!', fr: 'Merci !', es: '¡Gracias!', pt: 'Obrigado!' },
  feedbackError: { en: 'Error submitting.', ar: 'خطأ في الإرسال.', fr: 'Erreur d\'envoi.', es: 'Error al enviar.', pt: 'Erro ao enviar.' },
  noFeedbackYet: { en: 'No reviews yet.', ar: 'لا توجد مراجعات بعد.', fr: 'Pas encore d\'avis.', es: 'Aún no hay reseñas.', pt: 'Ainda não há avaliações.' },
  reportProblem: { en: 'Report Issue', ar: 'إبلاغ عن مشكلة', fr: 'Signaler un problème', es: 'Informar un problema', pt: 'Relatar problema' },

  // --- HISTORY ---
  historyTitle: { en: 'History', ar: 'السجل', fr: 'Historique', es: 'Historial', pt: 'Histórico' },
  historySearch: { en: 'Search...', ar: 'بحث...', fr: 'Rechercher...', es: 'Buscar...', pt: 'Pesquisar...' },
  historyClear: { en: 'Clear', ar: 'مسح', fr: 'Effacer', es: 'Limpar', pt: 'Limpar' },
  historyEmpty: { en: 'Empty', ar: 'فارغ', fr: 'Vide', es: 'Vacío', pt: 'Vazio' },
  historyItemFrom: { en: 'From', ar: 'من', fr: 'De', es: 'De', pt: 'De' },
  historyItemTo: { en: 'To', ar: 'إلى', fr: 'À', es: 'A', pt: 'Para' },

  // --- ACCOUNT ---
  manageAccount: { en: 'Account', ar: 'الحساب', fr: 'Compte', es: 'Cuenta', pt: 'Conta' },
  joinedDate: { en: 'Joined', ar: 'انضم في', fr: 'Inscrit le', es: 'Unido el', pt: 'Entrou em' },
  dailyUsageLabel: { en: 'Daily Quota', ar: 'الحصة اليومية', fr: 'Quota quotidien', es: 'Cuota diaria', pt: 'Cota diária' },
  trialUsageLabel: { en: 'Total Usage', ar: 'إجمالي الاستخدام', fr: 'Usage total', es: 'Uso total', pt: 'Uso total' },
  dataManagement: { en: 'Data', ar: 'البيانات', fr: 'Données', es: 'Datos', pt: 'Dados' },
  clearCloudHistory: { en: 'Clear Cloud', ar: 'مسح السحاب', fr: 'Effacer cloud', es: 'Borrar nube', pt: 'Limpar nuvem' },
  clearCloudHistoryInfo: { en: 'Remove all items from cloud.', ar: 'حذف كل العناصر من السحاب.', fr: 'Supprimer tout du cloud.', es: 'Eliminar todo de la nube.', pt: 'Remover tudo da nuvem.' },
  deleteAccount: { en: 'Delete Account', ar: 'حذف الحساب', fr: 'Supprimer compte', es: 'Eliminar cuenta', pt: 'Excluir conta' },
  deleteAccountInfo: { en: 'Permanent action.', ar: 'إجراء دائم.', fr: 'Action permanente.', es: 'Acción permanente.', pt: 'Ação permanente.' },
  deleteConfirmation: { en: 'Delete', ar: 'حذف', fr: 'Supprimer', es: 'Eliminar', pt: 'Excluir' },
  yourUserId: { en: 'User ID', ar: 'معرف المستخدم', fr: 'ID utilisateur', es: 'ID de usuario', pt: 'ID do usuário' },
  signOut: { en: 'Sign Out', ar: 'تسجيل الخروج', fr: 'Déconnexion', es: 'Cerrar sesión', pt: 'Sair' },
  keySaved: { en: 'Code activated!', ar: 'تم تفعيل الكود!', fr: 'Code activé !', es: '¡Código activado!', pt: 'Código ativado!' },
  keyRemoved: { en: 'Admin mode off.', ar: 'تم إيقاف وضع المسؤول.', fr: 'Mode admin désactivé.', es: 'Modo admin desc.', pt: 'Modo admin desc.' },
  copyIdTooltip: { en: 'Copy ID', ar: 'نسخ المعرف', fr: 'Copier l\'ID', es: 'Copiar ID', pt: 'Copiar ID' },
  dangerZone: { en: 'Danger Zone', ar: 'منطقة الخطر', fr: 'Zone de danger', es: 'Zona de peligro', pt: 'Zona de perigo' },

  // --- STUDIO ---
  studioInputFile: { en: 'File', ar: 'ملف', fr: 'Fichier', es: 'Archivo', pt: 'Arquivo' },
  studioInputMic: { en: 'Mic', ar: 'مايك', fr: 'Micro', es: 'Mic', pt: 'Mic' },
  studioInputAi: { en: 'AI', ar: 'ذكاء', fr: 'IA', es: 'IA', pt: 'IA' },
  studioSave: { en: 'Save', ar: 'حفظ', fr: 'Enr.', es: 'Guardar', pt: 'Salvar' },
  studioSaveAs: { en: 'Save As', ar: 'حفظ باسم', fr: 'Enr. sous', es: 'Guardar como', pt: 'Salvar como' },
  studioOpen: { en: 'Open', ar: 'فتح', fr: 'Ouvrir', es: 'Abrir', pt: 'Abrir' },
  studioExportBtn: { en: 'Export', ar: 'تصدير', fr: 'Exporter', es: 'Exportar', pt: 'Exportar' },
  studioExportSettings: { en: 'Export Settings', ar: 'إعدادات التصدير', fr: 'Paramètres d\'export', es: 'Ajustes de exp.', pt: 'Configs de exp.' },
  studioSource: { en: 'Source', ar: 'المصدر', fr: 'Source', es: 'Fuente', pt: 'Fonte' },
  studioFullMix: { en: 'Full Mix', ar: 'مزيج كامل', fr: 'Mix complet', es: 'Mix completo', pt: 'Mix completo' },
  studioVoiceOnly: { en: 'Voice Only', ar: 'صوت فقط', fr: 'Voix seule', es: 'Solo voz', pt: 'Apenas voz' },
  studioDuration: { en: 'Duration', ar: 'المدة', fr: 'Durée', es: 'Duración', pt: 'Duração' },
  studioTrimVoice: { en: 'Trim to Voice', ar: 'قص على قدر الصوت', fr: 'Ajuster à la voix', es: 'Ajustar a la voz', pt: 'Ajustar à voz' },
  studioFullLength: { en: 'Full Length', ar: 'الطول الكامل', fr: 'Longueur totale', es: 'Longitud total', pt: 'Comprimento total' },
  studioFormat: { en: 'Format', ar: 'الصيغة', fr: 'Format', es: 'Formato', pt: 'Formato' },
  studioDownload: { en: 'Download', ar: 'تحميل', fr: 'Télécharger', es: 'Descargar', pt: 'Baixar' },
  studioEq: { en: 'Equalizer', ar: 'المعادل', fr: 'Égaliseur', es: 'Ecualizador', pt: 'Equalizador' },
  studioMixer: { en: 'Mixer', ar: 'الميكسر', fr: 'Mixeur', es: 'Mezclador', pt: 'Mixer' },
  studioAddMusic: { en: '+ Music', ar: '+ موسيقى', fr: '+ Musique', es: '+ Música', pt: '+ Música' },
  studioDucking: { en: 'Ducking', ar: 'دكينج', fr: 'Ducking', es: 'Ducking', pt: 'Ducking' },
  studioVoice: { en: 'Voice', ar: 'الصوت', fr: 'Voix', es: 'Voz', pt: 'Voz' },
  studioDelay: { en: 'Delay', ar: 'تأخير', fr: 'Délai', es: 'Retraso', pt: 'Atraso' },
  studioPan: { en: 'Pan', ar: 'بان', fr: 'Pan', es: 'Pan', pt: 'Pan' },
  studioMusic: { en: 'Music', ar: 'موسيقى', fr: 'Musique', es: 'Música', pt: 'Música' },
  studioSelectTrack: { en: 'Select track', ar: 'اختر المقطع', fr: 'Choisir une piste', es: 'Elegir pista', pt: 'Escolher faixa' },
  studioNoTracks: { en: 'No tracks', ar: 'لا توجد مقاطع', fr: 'Pas de pistes', es: 'Sin pistas', pt: 'Sem faixas' },
  studioPresets: { en: 'Presets', ar: 'قوالب', fr: 'Préréglages', es: 'Presets', pt: 'Presets' },
  studioReset: { en: 'Reset', ar: 'تصفير', fr: 'Réinit.', es: 'Reiniciar', pt: 'Resetar' },
  studioTimeStretch: { en: 'Time', ar: 'الوقت', fr: 'Temps', es: 'Tiempo', pt: 'Tempo' },
  studioAmbience: { en: 'Ambience', ar: 'الأجواء', fr: 'Ambiance', es: 'Ambiente', pt: 'Ambiente' },
  studioEcho: { en: 'Echo', ar: 'صدى', fr: 'Écho', es: 'Eco', pt: 'Eco' },
  studioDynamics: { en: 'Dynamics', ar: 'الديناميكا', fr: 'Dynamique', es: 'Dinámica', pt: 'Dinâmica' },
  studioSpeed: { en: 'Speed', ar: 'السرعة', fr: 'Vitesse', es: 'Velocidad', pt: 'Velocidade' },
  studioReverb: { en: 'Reverb', ar: 'ريفيرب', fr: 'Réverb', es: 'Reverb', pt: 'Reverb' },
  studioFeedback: { en: 'Feedback', ar: 'فيدباك', fr: 'Feedback', es: 'Feedback', pt: 'Feedback' },
  studioCompressor: { en: 'Compressor', ar: 'ضاغط', fr: 'Compresseur', es: 'Compresor', pt: 'Compressor' },
};

export const t = (key: keyof typeof translations, lang: Language): string => {
  return translations[key]?.[lang] || translations[key]?.['en'] || (key as string);
};

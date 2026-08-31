(function (root) {
  'use strict';

  // UI language resolution is shared by popup, dashboard, and the small
  // preset/configuration panels. Individual pages may still keep their large
  // legacy dictionaries; these compact overlays provide consistent wording
  // for the most visible shared controls and a stable extension point for more
  // locale files.
  const LANGUAGE_NAMES = Object.freeze({
    en: 'English', zh: '中文', ja: '日本語', ko: '한국어',
    de: 'Deutsch', fr: 'Français', es: 'Español', pt: 'Português',
    it: 'Italiano', ru: 'Русский'
  });

  const OVERRIDES = {
    ja: {
      appName: 'PageDye', navSites: 'ウェブサイト', navLibrary: 'ライブラリ', navData: 'データ', navSettings: '設定', navAbout: '概要',
      navAiChat: 'AIチャット', title: 'PageDye 設定', bgType: '背景を選択', typeNone: 'なし', typeColor: '色', typeImage: '画像', typeVideo: '動画', typeEffect: 'エフェクト',
      save: '保存', reset: 'リセット', cancel: 'キャンセル', apply: '適用', delete: '削除', chooseFile: 'ファイルを選択',
      opacity: '不透明度', blur: 'ぼかし', color: '色', fixed: '背景を固定', advanced: '開発者向け設定', performanceMode: 'パフォーマンス'
    },
    ko: {
      appName: 'PageDye', navSites: '웹사이트', navLibrary: '라이브러리', navData: '데이터', navSettings: '설정', navAbout: '정보',
      navAiChat: 'AI 채팅', title: 'PageDye 설정', bgType: '배경 선택', typeNone: '없음', typeColor: '색상', typeImage: '이미지', typeVideo: '동영상', typeEffect: '효과',
      save: '저장', reset: '초기화', cancel: '취소', apply: '적용', delete: '삭제', chooseFile: '파일 선택',
      opacity: '불투명도', blur: '흐림', color: '색상', fixed: '배경 고정', advanced: '개발자 설정', performanceMode: '성능'
    },
    de: {
      appName: 'PageDye', navSites: 'Websites', navLibrary: 'Bibliothek', navData: 'Daten', navSettings: 'Einstellungen', navAbout: 'Über',
      navAiChat: 'KI-Chat', title: 'PageDye-Einstellungen', bgType: 'Hintergrund auswählen', typeNone: 'Keine', typeColor: 'Farbe', typeImage: 'Bild', typeVideo: 'Video', typeEffect: 'Effekt',
      save: 'Speichern', reset: 'Zurücksetzen', cancel: 'Abbrechen', apply: 'Anwenden', delete: 'Löschen', chooseFile: 'Datei auswählen',
      opacity: 'Deckkraft', blur: 'Unschärfe', color: 'Farbe', fixed: 'Hintergrund fixieren', advanced: 'Entwickleroptionen', performanceMode: 'Leistung'
    },
    fr: {
      appName: 'PageDye', navSites: 'Sites web', navLibrary: 'Bibliothèque', navData: 'Données', navSettings: 'Paramètres', navAbout: 'À propos',
      navAiChat: 'Chat IA', title: 'Paramètres de PageDye', bgType: 'Choisir un arrière-plan', typeNone: 'Aucun', typeColor: 'Couleur', typeImage: 'Image', typeVideo: 'Vidéo', typeEffect: 'Effet',
      save: 'Enregistrer', reset: 'Réinitialiser', cancel: 'Annuler', apply: 'Appliquer', delete: 'Supprimer', chooseFile: 'choisir un fichier',
      opacity: 'Opacité', blur: 'Flou', color: 'Couleur', fixed: 'Arrière-plan fixe', advanced: 'Options développeur', performanceMode: 'Performances'
    },
    es: {
      appName: 'PageDye', navSites: 'Sitios web', navLibrary: 'Biblioteca', navData: 'Datos', navSettings: 'Configuración', navAbout: 'Acerca de',
      navAiChat: 'Chat de IA', title: 'Configuración de PageDye', bgType: 'Elegir un fondo', typeNone: 'Ninguno', typeColor: 'Color', typeImage: 'Imagen', typeVideo: 'Vídeo', typeEffect: 'Efecto',
      save: 'Guardar', reset: 'Restablecer', cancel: 'Cancelar', apply: 'Aplicar', delete: 'Eliminar', chooseFile: 'elegir archivo',
      opacity: 'Opacidad', blur: 'Desenfoque', color: 'Color', fixed: 'Fondo fijo', advanced: 'Controles de desarrollador', performanceMode: 'Rendimiento'
    },
    pt: {
      appName: 'PageDye', navSites: 'Sites', navLibrary: 'Biblioteca', navData: 'Dados', navSettings: 'Configurações', navAbout: 'Sobre',
      navAiChat: 'Chat de IA', title: 'Configurações do PageDye', bgType: 'Escolha um fundo', typeNone: 'Nenhum', typeColor: 'Cor', typeImage: 'Imagem', typeVideo: 'Vídeo', typeEffect: 'Efeito',
      save: 'Salvar', reset: 'Redefinir', cancel: 'Cancelar', apply: 'Aplicar', delete: 'Excluir', chooseFile: 'escolher arquivo',
      opacity: 'Opacidade', blur: 'Desfoque', color: 'Cor', fixed: 'Fundo fixo', advanced: 'Controles do desenvolvedor', performanceMode: 'Desempenho'
    },
    it: {
      appName: 'PageDye', navSites: 'Siti web', navLibrary: 'Libreria', navData: 'Dati', navSettings: 'Impostazioni', navAbout: 'Informazioni',
      navAiChat: 'Chat IA', title: 'Impostazioni di PageDye', bgType: 'Scegli uno sfondo', typeNone: 'Nessuno', typeColor: 'Colore', typeImage: 'Immagine', typeVideo: 'Video', typeEffect: 'Effetto',
      save: 'Salva', reset: 'Ripristina', cancel: 'Annulla', apply: 'Applica', delete: 'Elimina', chooseFile: 'scegli file',
      opacity: 'Opacità', blur: 'Sfocatura', color: 'Colore', fixed: 'Sfondo fisso', advanced: 'Controlli sviluppatore', performanceMode: 'Prestazioni'
    },
    ru: {
      appName: 'PageDye', navSites: 'Сайты', navLibrary: 'Библиотека', navData: 'Данные', navSettings: 'Настройки', navAbout: 'О программе',
      navAiChat: 'ИИ-чат', title: 'Настройки PageDye', bgType: 'Выберите фон', typeNone: 'Нет', typeColor: 'Цвет', typeImage: 'Изображение', typeVideo: 'Видео', typeEffect: 'Эффект',
      save: 'Сохранить', reset: 'Сбросить', cancel: 'Отмена', apply: 'Применить', delete: 'Удалить', chooseFile: 'выбрать файл',
      opacity: 'Непрозрачность', blur: 'Размытие', color: 'Цвет', fixed: 'Зафиксировать фон', advanced: 'Для разработчиков', performanceMode: 'Производительность'
    }
  };

  let loaded = {};
  const initialLanguage = detect(typeof navigator !== 'undefined' ? navigator.language : 'en');
  const ready = (async () => {
    if (initialLanguage === 'en' || typeof fetch !== 'function') return;
    try {
      const url = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL
        ? chrome.runtime.getURL(`scripts/locales/${initialLanguage}.json`)
        : `../scripts/locales/${initialLanguage}.json`;
      const response = await fetch(url);
      if (response.ok) loaded = await response.json();
    } catch (_) {
      // The compact built-in overlay remains available if a packaged locale
      // file is unavailable (for example in a unit-test DOM).
    }
  })();

  function detect(value) {
    const raw = String(value || (typeof navigator !== 'undefined' && navigator.language) || 'en').toLowerCase();
    const base = raw.split('-')[0].split('_')[0];
    return Object.prototype.hasOwnProperty.call(LANGUAGE_NAMES, base) ? base : 'en';
  }

  function translations(language) {
    const resolved = detect(language);
    return Object.assign({}, OVERRIDES[resolved] || {}, resolved === initialLanguage ? loaded : {});
  }

  function applyDocumentLanguage(language) {
    const resolved = detect(language);
    if (typeof document !== 'undefined' && document.documentElement) document.documentElement.lang = resolved;
    return resolved;
  }

  root.PageDyeLocale = Object.freeze({ LANGUAGE_NAMES, detect, translations, applyDocumentLanguage, ready });
})(typeof globalThis !== 'undefined' ? globalThis : this);

// Archivo de traducciones para la aplicación
// Contiene todos los textos traducidos al español

export const translations = {
  // Textos generales
  general: {
    loading: "Cargando...",
    retry: "Reintentar",
    error: "Error",
    success: "Éxito",
    home: "INICIO",
    profile: "Perfil",
    logout: "Cerrar sesión",
    failedToLoad: "Error al cargar los datos del usuario",
  },
  
  // Textos de autenticación
  auth: {
    login: "Iniciar sesión",
    register: "Registrarse",
    username: "Nombre de usuario",
    password: "Contraseña",
    email: "Correo electrónico",
    forgotPassword: "¿Olvidaste tu contraseña?",
    resetPassword: "Restablecer contraseña",
    newPassword: "Nueva contraseña",
    confirmPassword: "Confirmar contraseña",
    loginSuccess: "¡Bienvenido de nuevo!",
    registerSuccess: "¡Cuenta creada exitosamente!",
    usernameMinLength: "El nombre de usuario debe tener al menos 3 caracteres",
    passwordMinLength: "La contraseña debe tener al menos 6 caracteres",
    invalidEmail: "Por favor, ingrese una dirección de correo electrónico válida",
    checkEmail: "Revisa tu correo electrónico para obtener instrucciones de restablecimiento",
    errorSendingReset: "Error al enviar la solicitud de restablecimiento",
    dontHaveAccount: "¿No tienes una cuenta?",
    alreadyHaveAccount: "¿Ya tienes una cuenta?",
    createAccount: "Crear cuenta",
    loginToAccount: "Iniciar sesión",
  },
  
  // Textos de la página de inicio
  home: {
    welcomeText: "Bienvenidx a mi mundo,",
    questionText: "¿qué aventura quieres vivir hoy?",
    features: [
      "Genera imágenes de Akiba",
      "Crea clips de anime con música de Warner Music Latin",
      "Platica y chatéa con Akiba"
    ],
    warnerMusicTitle: "Warner Music Latin Vibes",
    warnerMusicDescription: "Aquí puedes escuchar algunas de mis pistas favoritas de mis colegas en Warner Music Latin",
    createAMV: "Crea tu AMV",
    chatWithAkiba: "Chatea con Akiba",
    latestCreations: "Últimas Creaciones",
    noVideosYet: "Aún no has generado ningún video. ¡Intenta crear uno!",
  },
  
  // Textos de la interfaz de chat
  chat: {
    placeholder: "Escribe un mensaje...",
    send: "Enviar",
    thinking: "Pensando...",
    errorSending: "Error al enviar el mensaje",
  },
  
  // Textos de la galería de videos
  videos: {
    title: "Mis Creaciones",
    noVideos: "No hay videos disponibles",
    loading: "Cargando videos...",
    error: "Error al cargar los videos",
    createVideo: "Crear video",
    videoGenStarted: "Generación de video iniciada",
    failedToStartGen: "Error al iniciar la generación de video",
    generatingVideo: "Generando video...",
    mergingAudio: "Mezclando audio...",
    yourGeneratedVideos: "Tus Videos Generados",
  },
  
  // Textos del formulario de carga
  upload: {
    title: "Crear un nuevo video",
    prompt: "Prompt",
    promptPlaceholder: "Describe lo que quieres ver en tu video...",
    style: "Estilo",
    music: "Música",
    generate: "Generar",
    generating: "Generando...",
    selectStyle: "Selecciona un estilo",
    selectMusic: "Selecciona música",
  },
  
  // Textos de estilos
  styles: {
    dramatic: {
      name: "Dramático",
      description: "Escenas de anime dramáticas e intensas con alto contraste"
    },
    romantic: {
      name: "Romántico",
      description: "Escenas de anime suaves y emotivas con colores cálidos"
    },
    action: {
      name: "Acción",
      description: "Secuencias de acción de anime rápidas con transiciones dinámicas"
    },
    aesthetic: {
      name: "Estético",
      description: "Escenas de anime estéticas y oníricas con colores pastel"
    },
    retro: {
      name: "Retro",
      description: "Estilo de anime retro con efecto de grano de película"
    }
  },
  
  // Textos del generador de imágenes
  imageGenerator: {
    title: "Generador de Imágenes",
    prompt: "Prompt",
    promptPlaceholder: "Describe la imagen que quieres generar...",
    generate: "Generar",
    generating: "Generando...",
    errorGenerating: "Error al generar la imagen",
  },
  
  // Textos de la página de perfil
  profile: {
    title: "Mi Perfil",
    username: "Nombre de usuario",
    email: "Correo electrónico",
    createdAt: "Cuenta creada el",
    myVideos: "Mis Videos",
    myImages: "Mis Imágenes",
    noContent: "No hay contenido disponible",
  },
  
  // Textos de errores
  errors: {
    notFound: "Página no encontrada",
    goHome: "Ir al inicio",
    somethingWentWrong: "Algo salió mal",
  },
  
  // Textos del sistema de logs
  logs: {
    systemLog: "Registro del sistema",
    time: "Tiempo",
    selectingMusic: "Seleccionando música",
    timeSegment: "Segmento de tiempo",
    audioTrimmed: "Segmento de audio recortado correctamente",
    noMusicSelected: "¡No se ha seleccionado música!",
    failedToTrimAudio: "Error al recortar el audio",
    generating: "Generando",
  },
  
  // Textos del selector de música
  music: {
    libraryLoaded: "Biblioteca de música cargada correctamente",
    failedToLoad: "Error al cargar la biblioteca de música",
    selectedSong: "Canción seleccionada",
    by: "por",
    pleaseSelect: "Por favor, selecciona una canción primero",
    trimming: "Recortando audio...",
    trimSuccess: "Audio recortado correctamente",
    trimError: "Error al recortar el audio",
    preview: "Vista previa",
    fullPlay: "Reproducir completo",
    confirm: "Confirmar selección",
    confirmedMusicSegment: "Segmento de música confirmado",
    timeRange: "Rango de tiempo",
    failedToTrim: "Error al recortar el segmento de audio",
    errorPlayingAudio: "Error al reproducir audio",
    failedToPlay: "Error al reproducir el audio. Por favor, intenta con otra canción o actualiza la página.",
    previewStopped: "Vista previa detenida",
    previewingSegment: "Reproduciendo segmento...",
    stoppedFullSong: "Canción completa detenida",
    playingFullSong: "Reproduciendo canción completa...",
    loadingLibrary: "Cargando biblioteca de música...",
    previewControls: "Controles de vista previa",
    stopPreview: "Detener vista previa",
    previewSegment: "Vista previa del segmento",
    stopFullSong: "Detener canción completa",
    playFullSong: "Reproducir canción completa",
    segmentStartTime: "Tiempo de inicio del segmento",
    confirmThisSegment: "Confirmar este segmento",
    mood: "Estado de ánimo"
  }
}; 
export const BRAND_INTRO_SESSION_KEY = "codjingrank-brand-intro-v1";

export const brandIntroInitializationScript = `(function(){try{if(sessionStorage.getItem("${BRAND_INTRO_SESSION_KEY}"))return;sessionStorage.setItem("${BRAND_INTRO_SESSION_KEY}","seen");if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;var root=document.documentElement;root.dataset.brandIntro="active";window.setTimeout(function(){delete root.dataset.brandIntro;},2200);}catch(e){}})();`;

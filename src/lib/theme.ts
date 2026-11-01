/** Clé de mémorisation du thème choisi par le visiteur (sur son appareil uniquement). */
export const THEME_KEY = 'ni-theme';

/**
 * Exécuté dans <head> avant l'affichage (variable `d` = <html>) : pose data-theme
 * pour éviter tout flash. « signature » = aucun attribut = l'alternance d'origine.
 */
export const THEME_INIT = `try{var p=localStorage.getItem('${THEME_KEY}')||'signature',t=p==='auto'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):p;d.dataset.themePref=p;if(t==='light'||t==='dark'){d.dataset.theme=t;var m=document.querySelector('meta[name="theme-color"]');if(m&&t==='light')m.setAttribute('content','#fbf8f2')}}catch(e){}`;

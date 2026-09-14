export const configuratorUrl='https://bohunek5.github.io/prescotpl/konfigurator/';
export const configuratorVersion='a9d8f23925dd';
export function configurationLink(state){return configuratorUrl+'#config='+encodeURIComponent(JSON.stringify(state));}
export const applications={
 kitchen:{name:'Pod szafkami',title:'Światło tam, gdzie pracujesz.',description:'Blat kuchenny potrzebuje światła na całej powierzchni. Dobierz barwę, taśmę i profil, a potem obejrzyj zestaw z bliska.',image:'assets/application-kitchen.webp',state:{strip:'delux',profile:'micro',cover:'hs-opal',view:'zone',zone:'under',light:true,dimmer:70,length:2000}},
 stairs:{name:'Na schodach',title:'Każdy stopień ma swoją linię.',description:'Pod noskiem stopnia czy w bocznej zabudowie? Sprawdź miejsce montażu profilu i zobacz, jak światło układa się na schodach.',image:'assets/application-stairs.webp',state:{strip:'delux',profile:'micro',cover:'hs-opal',view:'zone',zone:'stair-under',light:true,dimmer:55,length:1000}},
 furniture:{name:'W meblach',title:'Detal, który zmienia wnętrze.',description:'Oświetl wnętrze szafki lub szuflady. W konfiguratorze sprawdzisz profil, przebieg przewodów i działanie światła podczas otwierania.',image:'assets/application-furniture.webp',state:{strip:'delux',profile:'micro',cover:'hs-opal',view:'zone',zone:'drawer',light:true,dimmer:65,length:800}}
};

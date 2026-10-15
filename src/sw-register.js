// Register after first render; only on deployed secure origins or localhost.
if('serviceWorker'in navigator){
 window.addEventListener('load',()=>{
  navigator.serviceWorker.register(import.meta.env.BASE_URL+'sw.js',{scope:import.meta.env.BASE_URL}).catch(error=>console.warn('Aurora offline cache unavailable',error));
 });
}

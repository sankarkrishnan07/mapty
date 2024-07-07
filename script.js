'use strict';



const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

let map,mapEvent;

class Workout{

    date = new Date();
    id = (Date.now()+'').slice(-10);

    constructor(coords,distance,duration){
        this.coords=coords
        this.distance=distance;
        this.duration=duration;
    }

    setDesc(){
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
}
 
class Running extends Workout{
    type='running'
    constructor(coords,distance,duration,cadence){
        super(coords,distance,duration)
        this.cadence=cadence;

        this.calcPace();
        this.setDesc();
    }

    calcPace(){
        this.pace=this.duration/this.distance;
        return this.pace;
    }
}

class Cycling extends Workout{
    type='cycling'
    constructor(coords,distance,duration,elevation){
        super(coords,distance,duration)
        this.elevation=elevation;

        this.calcSpeed();
        this.setDesc();
    }

    calcSpeed(){
        this.speed=this.distance/(this.duration/60);
        return this.speed;
    }
}

const run = new Running([10,78],5,24,100);
const cyc = new Cycling([10,77],5,24,100);

// console.log(run,cyc);

class App{

    map;
    mapEvent;
    workouts = [];

    constructor(){
        this.getPosition();

        this.getLocalStorage();

        inputType.addEventListener('change',this.toggleField);

        form.addEventListener('submit',this.newWorkout.bind(this));

        containerWorkouts.addEventListener('click',this.moveToPopup.bind(this));
    }

    getPosition(){
        navigator.geolocation.getCurrentPosition(this.loadMap.bind(this),function(){
            alert("Could not get the location!");
        })
    }

    loadMap(position){
        const { latitude } = position.coords;
        const {longitude} = position.coords;
        const coords = [latitude, longitude];
        this.map = L.map('map').setView(coords, 13);
    
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);
    
    L.marker(coords).addTo(this.map)
        .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
        .openPopup();
    
    this.map.on('click',this.showForm.bind(this))

    this.workouts.forEach(work => {
        this.renderWorkoutMarker(work);
    })
    
    }
    

    // show form 
    showForm(mapE){
        this.mapEvent=mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    //hide form

    hideForm(){
        inputCadence.value=inputDistance.value=inputElevation.value=inputDuration.value='';
        form.style.display='none';
        form.classList.add('hidden');
        setTimeout(() => form.style.display='grid',1000)
    }
    //form submit
    newWorkout(e){

        const allNum = (...values) => values.every(val => Number.isFinite(val));
        const allPos = (...values) => values.every(val => val > 0);
        e.preventDefault();

        const type = inputType.value;
        const duration=+inputDuration.value;
        const distance=+inputDistance.value;
        const {lat,lng}=this.mapEvent.latlng;
        let workout;

        if(type==='running') {
            const cadence = +inputCadence.value;
            if(!allNum(duration,distance,cadence) || (!allPos(duration,distance,cadence))) return alert('Inputs are not valid');

            workout = new Running([lat,lng],distance,duration,cadence);
            
        }
        if(type==='cycling') {
            const elevation = +inputElevation.value;
            if(!allNum(duration,distance,elevation) || (!allPos(duration,distance))) return alert('Inputs are not valid');

            workout = new Cycling([lat,lng],distance,duration,elevation);
        }

        this.workouts.push(workout);
        // console.log(this.workouts);

        this.renderWorkoutMarker(workout);

        this.renderWorkout(workout);

        this.hideForm();

        this.setLocalStorage();
    }

    

    toggleField(){
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    }
    renderWorkoutMarker(workout){
        L.marker(workout.coords).addTo(this.map)
        .bindPopup(L.popup({
            maxwidth: 20,
            minWidth: 10,
            autoClose: false,
            closeOnClick: false,
            className: `${workout.type}-popup`
        }))
        .setPopupContent(`${workout.type === 'running'? '🏃‍♂️' : '🚴‍♀️'}${workout.description}`)
        .openPopup();
    }
    

    renderWorkout(workout){
        let html = `<li class="workout workout--${workout.type}" data-id=${workout.id}>
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${workout.type === 'running'? '🏃‍♂️' : '🚴‍♀️'}</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>`;

        if (workout.type === 'running'){
            html+=`<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;
        }

        if (workout.type === 'cycling'){
            html+=`<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`;

        }

        form.insertAdjacentHTML('afterend',html);
    }
    
    moveToPopup(e){
        const el = e.target.closest('.workout');
        if(!el) return;

        const workout = this.workouts.find(work => work.id === el.dataset.id);

        this.map.setView(workout.coords,13,{
            animate:true
        })
    }

    setLocalStorage(){
        localStorage.setItem('workout',JSON.stringify(this.workouts));
    }

    getLocalStorage(){
        const data = JSON.parse(localStorage.getItem('workout'));

        if (!data) return;

        this.workouts=data;

        this.workouts.forEach(work => {
            this.renderWorkout(work);
        })
    }

    reset(){
        localStorage.removeItem('workout');
        location.reload();
    }
}

const app = new App();
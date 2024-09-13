const API_KEY = 'edb7f7d7df3abfa1779bdba6e3cf2ffa';
const API_URL=  'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_URL= 'https://api.openweathermap.org/data/2.5/forecast';
const default_city= 'Delhi'; //Default city when no previous data exists
const cityInput= document.getElementById('cityInput');
const searchBtn= document.getElementById('searchBtn');
const currentLocBtn= document.getElementById('currentLocBtn');
const weatherData= document.getElementById('weatherData');
const cityName= document.getElementById('cityName');
const temperature= document.getElementById('temperature');
const description= document.getElementById('description');
const weatherImg= document.getElementById('weatherImg');
const details= document.getElementById('details');
const forecastData= document.getElementById('forecastData');
const recentCities= document.getElementById('recentCities');
const errorDiv= document.getElementById('error');

let cities= JSON.parse(localStorage.getItem('cities')) || [];

// Fucntion to update the recent cities in the datalist
function updateRecentCities(){
    // console.log(recentCities);
    recentCities.innerHTML='';
    if(cities.length>0){
        cities.forEach(city=>{
            const option= document.createElement('option');
            option.value=city;
            recentCities.appendChild(option);
        });
    }
}

// Function to display weather data
function displayWeather(data){
    cityInput.value='';
    const date= new Date();
    const options= {year: 'numeric', month: 'short', day: 'numeric'};
    const formattedDate= date.toLocaleDateString('en-US', options);

    cityName.innerHTML= `${data.name}, ${data.sys.country} (${formattedDate})`;
    temperature.innerHTML= `${Math.round(data.main.temp - 273.15)}°C`;
    description.innerHTML= data.weather[0].description;
    weatherImg.src= `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    details.innerHTML= `<p class= "text-lg"><i class="fa fa-tint fa-lg"></i> Humidity : ${data.main.humidity}%</p>
                    <p class= "text-lg"><i class="fa-solid fa-wind fa-lg"></i> Wind : ${data.wind.speed} m/s</p>
                    <p class= "text-lg"><i class="fa-solid fa-gauge"></i> Pressure : ${data.main.pressure} mb</p>`;

    // Update the recent cities list if the current city is not already included
    if(!cities.includes(data.name)){
        cities.push(data.name);
        localStorage.setItem('cities', JSON.stringify(cities));
        updateRecentCities();
    }
    localStorage.setItem('lastCity', data.name); //Store the most recent city locally
}

// Function to display 5-days Forecast data 
function displayForecast(data){
    forecastData.innerHTML='';
    // Filter the forecasts to get only one forecast per day
    const uniqueForecastDays= [];
    const fiveDaysForecast= data.list.filter(forecast=>{
        const forecastDate= new Date(forecast.dt *1000).getDate();
        if(!uniqueForecastDays.includes(forecastDate)){
            return uniqueForecastDays.push(forecastDate);
        }
    });
    fiveDaysForecast.slice(1,6).forEach(weatherItem=>{
        const timezoneOffset= data.city.timezone;
        const localDate= new Date((weatherItem.dt + timezoneOffset)* 1000);
        const date= localDate.toLocaleDateString('en-us',{year: 'numeric', month: '2-digit', day: '2-digit'});
        const day= localDate.toLocaleDateString('en-US',{weekday: 'short'});
        const temp= `${Math.round(weatherItem.main.temp-273.15)}°C`;
        const icon= weatherItem.weather[0].icon;
        const wind=`Wind: ${weatherItem.wind.speed}m/s`;
        const humidity= `Humidity: ${weatherItem.main.humidity}%`;
        const forecastCard= document.createElement('div');
        forecastCard.className= 'p-4 bg-blue-100 bg-opacity-20 text-white rounded-lg shadow-lg text-center';
        forecastCard.innerHTML= `
            <h4 class="font-semibold mb-2">${date}, ${day}</h4>
            <img src= "http://openweathermap.org/img/wn/${icon}@2x.png" class="mx-auto mb-2">
            <p class="font-semibold">${temp}</p>
            <p>${wind}</p>
            <p>${humidity}</p>
        `;
        forecastData.appendChild(forecastCard);
    });   
}

// Fetch and display weather data for the selected city
function fetchWeatherData(city){
    fetch(`${API_URL}?q=${city}&appid=${API_KEY}`)
        .then(response=>{
            if(!response.ok) throw alert('Invalid location, please enter the correct city name');
            return response.json();
        })
        .then(data=>{
            displayWeather(data);
            return fetch(`${FORECAST_URL}?q=${city}&appid=${API_KEY}`);
        })
        .then(response=>response.json())
        .then(displayForecast)
        .catch(error=>{
            errorDiv.innerHTML=error.message;
        });
}

// Fetch and display weather data using location
function fetchWeatherByLocation(lat, long){
    fetch(`${API_URL}?lat=${lat}&lon=${long}&appid=${API_KEY}`)
        .then(response=>response.json())
        .then(data=>{
            displayWeather(data);
            return fetch(`${FORECAST_URL}?lat=${lat}&lon=${long}&appid=${API_KEY}`);  
        })
        .then(response=>response.json())
        .then(displayForecast)
        .catch(error=>{
            errorDiv.innerHTML= error.message;
        });
}

// Event listener for search button
searchBtn.addEventListener('click',()=>{
    const city= cityInput.value.trim();
    if(city){
        fetchWeatherData(city);
        cityInput.value='';
    }else{
        alert('Please enter a city name.');
    }
});

// Event listener for selecting a city from the datalist
cityInput.addEventListener('input', (event)=>{
    const selectedCity= event.target.value;
    if(cities.includes(selectedCity)){
        fetchWeatherData(selectedCity);
    }
});


// Event listener for location button
currentLocBtn.addEventListener('click',()=>{
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(position=>{
            const {latitude: lat, longitude: long}= position.coords;
            fetchWeatherByLocation(lat, long);
        }, ()=>{
            errorDiv.innerHTML= 'Unable to retrieve your location.';
        });
    }else{
        errorDiv.innerHTML= 'Geolocation is not supported by this browser.';
    }
});

// Function to load last searched city or default city on page load
function loadInitialCity(){
    const lastCity= localStorage.getItem('lastCity');
    if(lastCity){
        fetchWeatherData(lastCity);
    }else{
        fetchWeatherData(default_city);
    }
}

// Initialize the recent cities list and load the initial city on page
updateRecentCities();
loadInitialCity();

// import logo from "./logo.svg";
// import "./App.css";
import React from "react";
function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], "☀️"],
    [[1], "🌤"],
    [[2], "⛅️"],
    [[3], "☁️"],
    [[45, 48], "🌫"],
    [[51, 56, 61, 66, 80], "🌦"],
    [[53, 55, 63, 65, 57, 67, 81, 82], "🌧"],
    [[71, 73, 75, 77, 85, 86], "🌨"],
    [[95], "🌩"],
    [[96, 99], "⛈"],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return "NOT FOUND";
  return icons.get(arr);
}

function convertToFlag(countryCode) {
  return [...countryCode.toUpperCase()]
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .reduce((a, b) => `${a}${b}`);
}
// function convertToFlag(countryCode) {
//   const codePoints = countryCode
//     .toUpperCase()
//     .split("")
//     .map((char) => 127397 + char.charCodeAt());
//   return String.fromCodePoint(...codePoints);
// }

function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(dateStr));
}

class App extends React.Component {
  state = {
    location: "",
    isLoading: false,
    locationDescription: "",
    weather: {},
  };
  handelLocation = (e) => {
    this.setState({ location: e.target.value });
  };
  fetchData = async () => {
    if (this.state.location.length < 2) return this.setState({ weather: {} });
    try {
      this.setState({ isLoading: true });
      // 1) Getting location (geocoding)
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${this.state.location}`,
      );
      const geoData = await geoRes.json();
      console.log(geoData);

      if (!geoData.results) throw new Error("Location not found");

      const { latitude, longitude, timezone, name, country_code } =
        geoData.results.at(0);
      this.setState({
        locationDescription: `${name}  ${convertToFlag(country_code)}`,
      });

      // 2) Getting actual weather
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`,
      );
      const weatherData = await weatherRes.json();
      this.setState({ weather: weatherData.daily });
    } catch (err) {
      console.error(err);
    } finally {
      this.setState({ isLoading: false });
    }
  };
  componentDidMount() {
    this.setState({ location: localStorage.getItem("location") ?? "" });
  }
  componentDidUpdate(prevprop, prevstate) {
    if (this.state.location !== prevstate.location) {
      this.fetchData();
      localStorage.setItem("location", this.state.location);
    }
  }
  render() {
    return (
      <div className="app">
        <h1>Classy Weather</h1>
        <div>
          <Input
            location={this.state.location}
            handelLocation={this.handelLocation}
          />
        </div>
        {this.state.isLoading && <p className="loader"> loading...</p>}
        {this.state.weather.weathercode && (
          <Weather
            locationDescription={this.state.locationDescription}
            weather={this.state.weather}
          />
        )}
      </div>
    );
  }
}
export default App;
class Input extends React.Component {
  render() {
    return (
      <input
        onChange={(e) => this.props.handelLocation(e)}
        placeholder=" search from location ..."
        type="text"
        value={this.props.location}
      />
    );
  }
}
class Weather extends React.Component {
  render() {
    const {
      temperature_2m_max: max_temp,
      temperature_2m_min: min_temp,
      time: days,
      weathercode: codes,
    } = this.props.weather;
    console.log(days);
    return (
      <div>
        <h2>{this.props.locationDescription}</h2>
        <ul className="weather">
          {days.map((day, i) => {
            return (
              <Day
                max_temp={max_temp[i]}
                min_temp={min_temp[i]}
                day={day}
                code={codes[i]}
                key={day}
                isToday={i === 0 ? true : false}
              />
            );
          })}
        </ul>
      </div>
    );
  }
}
class Day extends React.Component {
  render() {
    const { max_temp, min_temp, day, code, isToday } = this.props;
    return (
      <li className="day">
        <span>{getWeatherIcon(code)} </span>
        <p>{isToday ? "today" : formatDay(day)}</p>
        <p>
          {min_temp} &deg; &mdash; {max_temp} &deg;
        </p>
      </li>
    );
  }
}

import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import "react-hot-loader";

import log from "loglevel";

import React from "react";
import ReactDOM from "react-dom";
import App from "./App";

import * as serviceWorker from "./serviceWorker";

log.setDefaultLevel("debug");
log.setLevel("debug");

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

/**
multiple stars
deploy
 */

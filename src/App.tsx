import React from "react";

/** @jsx jsx */
import { jsx } from "@emotion/core";
import { hot } from "react-hot-loader/root";

import _ from "lodash";
import log from "loglevel";

import { StoreProvider, createStore, persist } from "easy-peasy";

import appModel from "./model";
import WbWordBookPage from "./WbWordBook";
import WbWordBooksPage from "./WbWordBooks";
import { Router, Redirect } from "@reach/router";

// *** Store
const store = (function initAppStore() {
  log.info("creat new store");
  const store = createStore(
    appModel
    // persist(appModel, {
    //   storage: "localStorage",
    //   // mergeStrategy: 'mergeDeep',
    // })
  );
  store.getActions().wordbook.loadDefault();
  return store;
})();

// *** App Root-Component
function App() {
  return (
    <StoreProvider store={store}>
      <Router>
        <Redirect path="/" to="books" />
        <WbWordBooksPage path="books" />
        <WbWordBookPage path="books/:bookName" />
      </Router>
      {/*
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.tsx</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
        */}
    </StoreProvider>
  );
}

export default App; // hot(App);

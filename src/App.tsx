import React from "react";

/** @jsx jsx */
import { jsx } from "@emotion/core";
// import { hot } from "react-hot-loader/root";

import log from "loglevel";

import { StoreProvider, createStore, persist } from "easy-peasy";
import { Router, Redirect } from "@reach/router";

import appModel from "./model";

import WbWordBookPage from "./WbWordBook";
import WbWordBooksPage from "./WbWordBooks";

// *** Store
const store = (function initAppStore() {
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

log.info("store created");

function Dummy() {
  return <div>ok</div>;
}

// *** App Root-Component
function App() {
  return (
    <StoreProvider store={store}>
      <Router>
        <Redirect path="/" from="/" to="/pages/books" noThrow />
        <WbWordBooksPage path="/pages/books" />
        <WbWordBookPage path="/pages/books/:bookName" />
      </Router>
    </StoreProvider>
  );
}

export default App; // hot(App);

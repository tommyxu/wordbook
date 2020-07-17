import "./init";

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import nock from "nock";
import log from "loglevel";
import App from "./App";
import {
  Router,
  Link,
  createHistory,
  createMemorySource,
  LocationProvider,
} from "@reach/router";

function renderWithRouter(
  ui: any,
  { route = "/", history = createHistory(createMemorySource(route)) } = {}
) {
  return {
    ...render(<LocationProvider history={history}>{ui}</LocationProvider>),
    history,
  };
}

const scope = nock("http://localhost")
  .persist()
  .get("/api/books")
  .delay(100)
  .reply(200, {
    status: "ok",
    data: [
      {
        id: "e14252419b85",
        name: "ziyang-m",
        wordCount: 355,
        version: 1594795470730,
      },
      {
        id: "6c0a0f4674e8",
        name: "copy10Jul",
        wordCount: 344,
        version: 1594210057965,
      },
      {
        id: "1ecde18823a3",
        name: "7julbackup",
        wordCount: 324,
        version: 1594087542677,
      },
    ],
  });

test("renders root App", async () => {
  renderWithRouter(<App />, { route: "/pages/books" });
  await waitFor(
    () => {
      screen.getByText("7julbackup");
    }
    // { timeout: 10000 }
  );
  screen.getByText("7julbackup");
});

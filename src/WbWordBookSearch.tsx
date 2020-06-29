import React, { useCallback, useEffect, useRef } from "react";
import log from "loglevel";
import _ from "lodash";

import {
  InputGroup,
  FormControl,
  Button,
  Form,
  ButtonGroup,
} from "react-bootstrap";
import {
  useStoreActions,
  useStore,
  useStoreState,
  WordModel,
  WordCardViewModel,
} from "./model";
import { createComponentStore, action, Action } from "easy-peasy";
import { FaArrowLeft } from "react-icons/fa";
import { WbWordCard } from "./WbWordCard";

const WbWordBookSearchOps = () => {
  const setSearchModeEnabled = useStoreActions(
    (actions) => actions.wordbook.uiState.setSearchModeEnabled
  );
  return (
    <ButtonGroup>
      <Button
        variant="outline-dark"
        onClick={() => setSearchModeEnabled(false)}
      >
        <FaArrowLeft />
      </Button>
    </ButtonGroup>
  );
};

interface WbWordBookSearchModel {
  wordQuery: string;
  setWordQuery: Action<WbWordBookSearchModel, string>;
  result: Array<WordModel>;
  setResult: Action<WbWordBookSearchModel, Array<WordModel>>;
}

const useWbWordBookSearchModel = createComponentStore<WbWordBookSearchModel>({
  wordQuery: "",
  setWordQuery: action((state, wordQuery) => {
    state.wordQuery = wordQuery;
  }),
  result: [],
  setResult: action((state, result) => {
    state.result = result;
  }),
});

export const WbWordBookSearch = () => {
  const [state, actions] = useWbWordBookSearchModel();
  const searchWord = useStoreActions((actions) => actions.wordbook.searchWord);

  const handleQuery = useCallback(
    (evt) => {
      actions.setResult([]);
      evt.stopPropagation();
      evt.preventDefault();
      const result = searchWord(state.wordQuery);
      actions.setResult(result);
    },
    [searchWord, state]
  );

  const wordQueryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (wordQueryRef.current) {
      _.delay(() => wordQueryRef.current!.focus(), 100);
    }
  }, [wordQueryRef]);

  return (
    <div>
      <div className="mb-3">
        <WbWordBookSearchOps />
      </div>
      <Form onSubmit={handleQuery}>
        <InputGroup className="">
          <FormControl
            placeholder="query ..."
            value={state.wordQuery}
            onChange={(evt) => actions.setWordQuery(evt.target.value)}
            ref={wordQueryRef}
            //   aria-describedby="basic-addon2"
          />
          <InputGroup.Append>
            <Button variant="outline-primary">Search</Button>
          </InputGroup.Append>
        </InputGroup>
      </Form>
      <div className="mt-4">
        <div className="ml-3">{state.result.length} item(s) found.</div>
        {state.result.map((word) => {
          return (
            <WbWordCard
              className="mt-3 mb-4"
              key={word.id}
              word={word}
              viewModel={WordCardViewModel.Full}
              onWordClick={_.noop}
              onWordSearch={_.noop}
              onStarsChange={_.noop}
              onRemarkClicked={_.noop}
            />
          );
        })}
      </div>
    </div>
  );
};

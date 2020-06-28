import { hot } from "react-hot-loader/root";
/** @jsx jsx */
import { jsx, css } from "@emotion/core";

import React, { useEffect, useCallback, useRef } from "react";

import log from "loglevel";
import moment from "moment";
import _ from "lodash";

import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";

import { FaBook, FaTrashAlt, FaClone } from "react-icons/fa";
import { Link } from "@reach/router";

import { useStoreActions, useStoreState } from "./model";
import { RouteComponentProps } from "@reach/router";
import { ConfirmDialog } from "./CommonComponents";
import Container from "react-bootstrap/Container";

type WbWordBooksProps = {} & RouteComponentProps;

const WbWordBooks = (props: WbWordBooksProps) => {
  const loadBooks = useStoreActions(
    (actions) => actions.wordbookList.loadBooks
  );

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const books = useStoreState((state) => state.wordbookList.books);

  const wordsRatio = useStoreState((state) => state.wordbookList.wordsRatio);
  const setWordRatio = useStoreActions(
    (state) => state.wordbookList.setWordsRatio
  );
  const newBookName = useStoreState((state) => state.wordbookList.newBookName);
  const setNewBookName = useStoreActions(
    (state) => state.wordbookList.setNewBookName
  );
  const setTemplateId = useStoreActions(
    (actions) => actions.wordbookList.setTemplateId
  );

  const confirmDialogVisible = useStoreState(
    (state) => state.wordbookList.confirmDialogVisible
  );
  const handleDialogAction = useStoreActions(
    (actions) => actions.wordbookList.handleDialogAction
  );
  const deleteDialogVisible = useStoreState(
    (state) => state.wordbookList.deleteDialogVisible
  );
  const handleDeleteDialogAction = useStoreActions(
    (state) => state.wordbookList.handleDeleteDialogAction
  );

  const newBookNameRef = useRef<HTMLInputElement>(null);

  const formRef = useRef<HTMLFormElement>(null);

  const createMakeBookDialogActionHandler = useCallback(
    (bookId: string) => () => {
      setTemplateId(bookId);
      handleDialogAction("show");
      _.delay(() => newBookNameRef.current?.focus(), 0);
    },
    [setTemplateId, handleDialogAction, newBookNameRef]
  );

  const createDeleteDialogActionHandler = useCallback(
    (bookId: string) => () => {
      setTemplateId(bookId);
      handleDeleteDialogAction("show");
    },
    [setTemplateId, handleDeleteDialogAction]
  );

  const handleFormSubmit = useCallback(
    (evt: React.FormEvent<any>) => {
      evt.preventDefault();
      evt.stopPropagation();
      if (formRef.current?.checkValidity()) {
        handleDialogAction("yes");
      }
    },
    [formRef, handleDialogAction]
  );

  const handleDialogActionCallback = useCallback(
    (action: string) => {
      log.info("received action", action);
      if (action === "yes") {
        if (formRef.current?.checkValidity()) {
          handleDialogAction(action);
        }
      } else {
        handleDialogAction(action);
      }
    },
    [formRef, handleDialogAction]
  );

  return (
    <Container>
      <ConfirmDialog
        title="Warning"
        message="Delete ?"
        show={deleteDialogVisible}
        onAction={handleDeleteDialogAction}
      />
      <ConfirmDialog
        title="Create a new word bank"
        show={confirmDialogVisible}
        onAction={handleDialogActionCallback}
        yesPrompt="OK"
        noPrompt="Cancel"
      >
        <Form ref={formRef} validated={true} onSubmit={handleFormSubmit}>
          <Form.Group controlId="wordsRatioRangeSelector">
            <Form.Label>Word bank name:</Form.Label>
            <Form.Control
              ref={newBookNameRef}
              type="text"
              value={newBookName}
              onChange={(evt) => setNewBookName(evt.target.value)}
              required
            />
          </Form.Group>
          <Form.Group controlId="wordsRatioRangeSelector">
            <Form.Label>Ratio of words picked randomly:</Form.Label>
            <Form.Control
              type="range"
              min={0}
              max={10}
              value={wordsRatio}
              onChange={(evt) => setWordRatio(_.toInteger(evt.target.value))}
            />
            <div className="mt-1 pl-3">
              {wordsRatio * 10}%
              {/* &#x2248;
            {_.toInteger((wordsRatio * wordsTotal) / 100)} words */}
            </div>
          </Form.Group>
        </Form>
      </ConfirmDialog>
      <div
        css={css`
          display: grid;
          grid-template-columns: 33.3% 33.3% 33.3%;
        `}
      >
        {books.map((book) => {
          return (
            <Card
              className="m-2"
              css={{
                minWidth: "20rem",
              }}
              key={book.id}
            >
              <Card.Body>
                <Card.Title>
                  <h3>
                    <FaBook />
                    <strong>
                      {" "}
                      <span className="typeface-roboto-slab">{book.name}</span>
                    </strong>
                  </h3>
                </Card.Title>
                <Card.Text className="mt-4 text-monospace">
                  Words: {book.wordCount}
                </Card.Text>
                <div className="d-flex justify-content-end">
                  <Link to={book.id}>
                    <Button className="ml-1 mw-6r" variant="success">
                      Open
                    </Button>
                  </Link>
                  <Button
                    className="ml-1"
                    variant="secondary"
                    onClick={createMakeBookDialogActionHandler(book.id)}
                  >
                    <FaClone />
                  </Button>
                  <Button
                    className="ml-1"
                    variant="secondary"
                    onClick={createDeleteDialogActionHandler(book.id)}
                  >
                    <FaTrashAlt />
                  </Button>
                </div>
              </Card.Body>
              <Card.Footer>
                <div className="d-flex justify-content-end">
                  {moment(book.version).format("llll")}
                </div>
              </Card.Footer>
            </Card>
          );
        })}
      </div>
    </Container>
  );
};

export default hot(WbWordBooks);

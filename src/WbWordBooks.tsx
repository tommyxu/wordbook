import { hot } from "react-hot-loader/root";
/** @jsx jsx */
import { jsx } from "@emotion/core";

import React, { useEffect } from "react";

import log from "loglevel";
import moment from "moment";

import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import { FaBook } from "react-icons/fa";
import { Link } from "@reach/router";

import { useStoreActions, useStoreState } from "./model";
import { RouteComponentProps } from "@reach/router";

type WbWordBooksProps = {} & RouteComponentProps;

const WbWordBooks = (props: WbWordBooksProps) => {
  const loadBooks = useStoreActions(
    (actions) => actions.wordbookList.loadBooks
  );
  useEffect(() => {
    loadBooks();
  }, [loadBooks]);
  const books = useStoreState((state) => state.wordbookList.books);
  log.info("render WbWordBooks");
  return (
    <div className="d-flex justify-content-center">
      {books.map((book) => {
        return (
          <Card
            className="m-2"
            css={{
              minWidth: "24rem",
            }}
            key={book.name}
          >
            <Card.Body>
              <Card.Title>
                <h2>
                  <FaBook />
                  <strong>
                    {" "}
                    <span>{book.name}</span>
                  </strong>
                </h2>
              </Card.Title>
              <Card.Text className="mt-4 text-monospace">
                Words: {book.wordCount}
              </Card.Text>
              <div className="d-flex justify-content-end">
                <Link to={book.name}>
                  <Button className="pl-4 pr-4" variant="primary">
                    Open
                  </Button>
                </Link>
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
  );
};

export default hot(WbWordBooks);

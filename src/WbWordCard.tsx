import styles from "./WbWordBook.module.css";

import React, { useCallback, MouseEvent } from "react";
/** @jsx jsx */
import { jsx, css } from "@emotion/core";

import clsx from "clsx";
import _ from "lodash";

import { Button, Card } from "react-bootstrap";
import { SwitchTransition, CSSTransition } from "react-transition-group";
import { FaStar, FaRegStar, FaTimes } from "react-icons/fa";

import { WordModel, WordCardViewModel } from "./model";

// *** Component
type WbWordCardProps = {
  className?: string;
  word?: WordModel;
  viewModel: WordCardViewModel;
  onWordClick: () => void;
  onWordSearch: () => void;
  onDelete?: () => void;
  onStarsChange: (numStars: number) => void;
  onRemarkClicked: () => void;
};
export const WbWordCard = (props: WbWordCardProps) => {
  const {
    className,
    word: wordProp,
    viewModel,
    onDelete,
    onWordClick,
    onWordSearch,
  } = props;

  const word = wordProp ?? {
    name: "",
    remark: "",
    example: "",
    stars: 0,
  };

  const deleteWord = useCallback(
    (evt: MouseEvent) => {
      evt.stopPropagation();
      onDelete && onDelete();
    },
    [onDelete]
  );

  const wordClickHandler = useCallback(
    (evt: MouseEvent) => {
      onWordClick();
    },
    [onWordClick]
  );

  const wordSearchHandler = useCallback(
    (evt: MouseEvent) => {
      onWordSearch();
    },
    [onWordSearch]
  );

  return (
    <SwitchTransition>
      <CSSTransition
        key={word.name}
        in
        mountOnEnter
        unmountOnExit
        timeout={200}
        classNames="fade"
      >
        <Card className={clsx(className, "shadow")}>
          <Card.Body>
            <React.Fragment>
              <Card.Title
                css={{
                  cursor: "pointer",
                }}
                onClick={wordClickHandler}
                onDoubleClick={wordSearchHandler}
              >
                {onDelete && (
                  <Button
                    variant="light"
                    onClick={deleteWord}
                    className={styles.WbWordCard__deleteButton}
                  >
                    <FaTimes />
                  </Button>
                )}
                <div className="d-flex align-items-center">
                  <span className="h1">
                    {viewModel === WordCardViewModel.Full ||
                    viewModel === WordCardViewModel.WordOnly
                      ? word.name
                      : "\xa0\xa0\xa0"}
                  </span>
                </div>
              </Card.Title>
              <Card.Text
                as="div"
                className={styles.WbWordCard__remark}
                onClick={() => props.onRemarkClicked()}
              >
                <div>
                  {(viewModel === WordCardViewModel.Full ||
                    viewModel === WordCardViewModel.DefinitionsOnly) && (
                    <div css={{ whiteSpace: "pre-line" }}>{word.remark}</div>
                  )}
                  {viewModel === WordCardViewModel.Full && (
                    <div
                      className="mt-1"
                      css={{ whiteSpace: "pre-line", fontStyle: "italic" }}
                    >
                      {word.example}
                    </div>
                  )}
                </div>
              </Card.Text>
            </React.Fragment>
            <div className={clsx("d-flex", "flex-row-reverse")}>
              <WbStarRater
                stars={word.stars}
                onStarsChange={props.onStarsChange}
              />
            </div>
          </Card.Body>
        </Card>
      </CSSTransition>
    </SwitchTransition>
  );
};
interface WbStarRaterProps {
  stars: number;
  onStarsChange: (value: number) => void;
}
const WbStarRaterStyles = {
  toggler: {
    paddingLeft: 0,
  },
};
const WbStarRater = (props: WbStarRaterProps) => {
  const { stars, onStarsChange } = props;

  const onStarClicked = useCallback(
    ({ name }) => {
      const sId = _.toSafeInteger(name);
      if (stars === 1 && sId === 1) {
        onStarsChange(0);
      } else {
        onStarsChange(sId);
      }
    },
    [onStarsChange, stars]
  );
  return (
    <span>
      <WbStarToggler
        name={"3"}
        checked={stars > 2}
        onClick={onStarClicked}
        css={WbStarRaterStyles.toggler}
      />
      <WbStarToggler
        name={"2"}
        checked={stars > 1}
        onClick={onStarClicked}
        css={WbStarRaterStyles.toggler}
      />
      <WbStarToggler
        name={"1"}
        checked={stars > 0}
        onClick={onStarClicked}
        css={WbStarRaterStyles.toggler}
      />
    </span>
  );
};
interface WbStarTogglerProps {
  name?: string;
  className?: string;
  checked: boolean;
  onClick?: (evt: { name?: string }) => void;
}
const WbStarTogglerStyles = {
  icon: (props: WbStarTogglerProps) => ({
    "&: hover": {
      color: "goldenrod",
      opacity: 0.9,
    },
    border: 0,
    ...(!props.checked
      ? {
          opacity: 0.4,
        }
      : {
          color: "gold",
        }),
  }),
};

const WbStarToggler = (props: WbStarTogglerProps) => {
  const { checked, className, name, onClick } = props;
  const clickCallback = useCallback(() => {
    if (onClick) {
      onClick({ name });
    }
  }, [onClick, name]);
  return (
    <span
      className={clsx(className, "btn")}
      css={WbStarTogglerStyles.icon(props)}
      onClick={clickCallback}
    >
      <h4>{checked ? <FaStar /> : <FaRegStar />}</h4>
    </span>
  );
};

import styles from "./WbWordBook.module.css";

import { hot } from "react-hot-loader/root";
/** @jsx jsx */
import { jsx, css } from "@emotion/core";

import { Link } from "@reach/router";

import React, {
  useCallback,
  useRef,
  useState,
  useEffect,
  MouseEvent,
} from "react";

import clsx from "clsx";

import log from "loglevel";
import _ from "lodash";

import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";
import Card from "react-bootstrap/Card";
import ToggleButton from "react-bootstrap/ToggleButton";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Pagination from "react-bootstrap/Pagination";
import PageItem from "react-bootstrap/PageItem";
import Accordion from "react-bootstrap/Accordion";
import Toast from "react-bootstrap/Toast";
import Modal from "react-bootstrap/Modal";

import { SwitchTransition, CSSTransition } from "react-transition-group";

import {
  FaStar,
  FaAngleDoubleDown,
  FaAngleDoubleUp,
  FaRegStar,
  FaEye,
  FaDownload,
  FaUpload,
  FaSearch,
  FaArrowsAltH,
  FaTimes,
  FaCloudUploadAlt,
  FaCloudDownloadAlt,
  FaVrCardboard,
  FaArrowLeft,
} from "react-icons/fa";
import { MdFirstPage, MdLastPage, MdLocationOn } from "react-icons/md";

import { useStoreActions, useStore, useStoreState } from "./model";

import type { RouteComponentProps } from "@reach/router";
import type { WordBookModel, WordModel } from "./model";

// *** Component
type WbWordCardProps = {
  word: WordModel | undefined | null;
  remarkVisible: boolean;
  immerseMode: boolean;

  onWordClick: () => void;
  onWordSearch: () => void;
  onDelete: () => void;
  onStarsChange: (numStars: number) => void;
  onRemarkClicked: () => void;
};

const WbWordCard = (props: WbWordCardProps) => {
  const { word: input, remarkVisible, immerseMode } = props;

  let word = input || {
    name: "Loading ...",
    remark: "",
    stars: 0,
  };

  const deleteWord = useCallback(
    (evt: MouseEvent) => {
      evt.stopPropagation();
      props.onDelete();
    },
    [props.onDelete]
  );

  const wordClickHandler = useCallback(
    (evt: MouseEvent) => {
      props.onWordClick();
    },
    [props.onWordClick]
  );

  const wordSearchHandler = useCallback(
    (evt: MouseEvent) => {
      props.onWordSearch();
    },
    [props.onWordSearch]
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
        <Card className="shadow-sm">
          <Card.Body>
            {immerseMode ? (
              <div className="pt-2">
                <p
                  className="display-3 mt-5 mb-5"
                  css={{
                    textAlign: "center",
                  }}
                >
                  <span className="font-weight-bolder typeface-roboto">
                    {word.name}
                  </span>
                </p>
              </div>
            ) : (
              <React.Fragment>
                <Card.Title
                  css={{
                    cursor: "pointer",
                  }}
                  onClick={wordClickHandler}
                  onDoubleClick={wordSearchHandler}
                >
                  <Button
                    variant="light"
                    onClick={deleteWord}
                    className={styles.WbWordCard__deleteButton}
                  >
                    <FaTimes />
                  </Button>
                  <div className="d-flex align-items-center">
                    <span className="h1">{word.name}</span>
                  </div>
                </Card.Title>
                <Card.Text
                  className={styles.WbWordCard_remark}
                  onClick={() => props.onRemarkClicked()}
                  css={{
                    cursor: "pointer",
                  }}
                >
                  {remarkVisible && (
                    <span css={{ whiteSpace: "pre-line" }}>{word.remark}</span>
                  )}
                </Card.Text>
              </React.Fragment>
            )}
            {/* <Card.Link href="#">Card Link</Card.Link>
        <Card.Link href="#">Another Link</Card.Link> */}
            {/* <ToggleButton checked={word.bookmarked} type="checkbox" value="bookmarked" variant="info" onChange={props.onToggleBookmarked}>
          <FaBook />
        </ToggleButton> */}
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
    [onStarsChange, props]
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
  icon: (props: WbStarTogglerProps) =>
    !props.checked
      ? {
          opacity: 0.4,
        }
      : {},
};

const WbStarToggler = (props: WbStarTogglerProps) => {
  const { checked, className, name, onClick } = props;
  const clickCallback = useCallback(() => {
    if (onClick) {
      onClick({ name });
    }
  }, [onClick]);
  return (
    <span
      className={clsx(
        className,
        "btn",
        checked ? "text-warning" : "text-muted",
        { "text-secondary": !checked }
      )}
      css={WbStarTogglerStyles.icon(props)}
      onClick={clickCallback}
    >
      <h4>{checked ? <FaStar /> : <FaRegStar />}</h4>
    </span>
  );
};

const WbWordBookNav = () => {
  log.info("render booknav");
  const pointer = useStoreState((state) => state.wordbook.pointer);
  const wordSize = useStoreState((state) => state.wordbook.currentWordSize);
  const offsetPointer = useStoreActions(
    (state) => state.wordbook.offsetPointer
  );
  return (
    <Pagination
      size="lg"
      className={clsx("mb-0", styles.WbWordBookNav__pagination)}
    >
      <Pagination.Item onClick={() => offsetPointer(-1e5)}>
        <MdFirstPage />
      </Pagination.Item>
      <Pagination.First onClick={() => offsetPointer(-10)} />
      <Pagination.Prev
        onClick={() => offsetPointer(-1)}
        css={{
          textAlign: "center",
          width: "5rem",
        }}
      />
      <PageItem
        active
        css={{
          textAlign: "center",
          width: "9rem",
        }}
      >
        <span>
          <small>
            {pointer + 1} / {wordSize}
          </small>
        </span>
      </PageItem>
      <Pagination.Next
        onClick={() => offsetPointer(1)}
        css={{
          textAlign: "center",
          width: "5rem",
        }}
      />
      <Pagination.Last onClick={() => offsetPointer(10)} />
      <Pagination.Item onClick={() => offsetPointer(1e5)}>
        <MdLastPage />
      </Pagination.Item>
    </Pagination>
  );
};

type WbWordBookViewerProps = {};

const WbWordBookViewer = (props: WbWordBookViewerProps) => {
  log.info("render viewer", props);

  const word = useStoreState((state) => state.wordbook.currentWord);
  const remarkVisible = useStoreState((state) => state.wordbook.remarkVisible);
  const immerseMode = useStoreState(
    (state) => state.wordbook.uiState.immerseMode
  );

  const toggleRemarkVisible = useStoreActions(
    (actions) => actions.wordbook.toggleRemarkVisible
  );
  const setCurrentWordStars = useStoreActions(
    (state) => state.wordbook.setCurrentWordStars
  );
  const deleteCurrentWord = useStoreActions(
    (state) => state.wordbook.deleteCurrentWord
  );
  const fillEditorWithCurrentWord = useStoreActions(
    (actions) => actions.wordbook.fillEditorWithCurrentWord
  );
  const setEditorCollapsed = useStoreActions(
    (actions) => actions.wordbook.uiState.setEditorCollapsed
  );
  const requestWordSearch = useStoreActions(
    (actions) => actions.wordbook.uiState.requestDirectSearch
  );

  const workClickedCallback = useCallback(() => {
    fillEditorWithCurrentWord();
    setEditorCollapsed(true);
  }, [fillEditorWithCurrentWord, setEditorCollapsed]);

  const wordSearchCallback = useCallback(() => {
    fillEditorWithCurrentWord();
    setEditorCollapsed(true);
    requestWordSearch();
  }, [fillEditorWithCurrentWord, setEditorCollapsed, requestWordSearch]);

  const toggleRemarkVisibleCallback = useCallback(() => {
    toggleRemarkVisible();
  }, [toggleRemarkVisible]);

  const deleteCallback = useCallback(() => deleteCurrentWord(), [
    deleteCurrentWord,
  ]);

  const changeStarsCallback = useCallback(
    (value) => {
      setCurrentWordStars(value);
    },
    [setCurrentWordStars]
  );

  return (
    <div>
      <div className={styles.WbWordBookViewer__WordCard}>
        <WbWordCard
          word={word}
          remarkVisible={remarkVisible}
          immerseMode={immerseMode}
          onRemarkClicked={toggleRemarkVisibleCallback}
          onWordClick={workClickedCallback}
          onWordSearch={wordSearchCallback}
          onDelete={deleteCallback}
          onStarsChange={changeStarsCallback}
        />
      </div>
      <div className="mt-4 d-flex align-items-center align-self-center">
        <div className="flex-fill">
          <WbWordBookNav />
        </div>
      </div>
    </div>
  );
};

interface WbWordEditorProps {
  onSearch: (name: string) => void;
}

const WbWordEditor = (props: WbWordEditorProps) => {
  const { onSearch } = props;
  const wordNameRef = useRef<HTMLInputElement>(null);
  const fields = useStoreState((state) => state.wordbook.editor.fields);
  const setValues = useStoreActions(
    (actions) => actions.wordbook.editor.setValues
  );
  const addNewWord = useStoreActions((actions) => actions.wordbook.saveWord);
  const clearFields = useStoreActions(
    (actions) => actions.wordbook.editor.clearValues
  );
  const addNewWordCallback = useCallback(() => {
    addNewWord(fields);
    clearFields();
  }, [addNewWord, clearFields, fields]);
  const searchCallback = useCallback(() => {
    onSearch(fields.name);
  }, [onSearch, fields]);
  const detectEnter = useCallback(
    (evt: React.KeyboardEvent<HTMLInputElement>) => {
      if (evt.keyCode === 13) {
        onSearch(fields.name);
      }
    },
    [onSearch, fields]
  );
  const clearInput = useCallback(
    (evt) => {
      setValues({ name: "", remark: "" });
      _.defer(() => {
        if (wordNameRef.current) {
          wordNameRef.current!.focus();
        }
      });
    },
    [setValues]
  );

  const directSearch = useStoreState(
    (state) => state.wordbook.uiState.directSearch
  );
  const clearDirectSearch = useStoreActions(
    (actions) => actions.wordbook.uiState.clearDirectSearch
  );

  const locatePointer = useStoreActions(
    (actions) => actions.wordbook.locatePointer
  );
  const locatePointerCallback = useCallback(() => {
    locatePointer(_.trim(fields.name));
  }, [locatePointer, fields]);

  useEffect(() => {
    if (directSearch) {
      clearDirectSearch();
      props.onSearch(fields.name);
    }
  }, [directSearch, clearDirectSearch, fields, props.onSearch]);

  return (
    <div>
      <Form>
        <Form.Group controlId="wordName">
          <Form.Label>Word</Form.Label>
          {/* 
          <Form.Text className="text-muted">
            We'll never share your email with anyone else.
          </Form.Text> 
          */}
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="word..."
              required
              ref={wordNameRef}
              value={fields.name}
              onChange={(evt) => setValues({ name: evt.target.value })}
              onKeyUp={detectEnter}
            />
            <Form.Control.Feedback type="invalid">
              Please choose a username.
            </Form.Control.Feedback>
            <InputGroup.Append>
              <Button variant="outline-secondary" onClick={clearInput}>
                <FaTimes />
              </Button>
              <Button
                variant="outline-secondary"
                onClick={locatePointerCallback}
              >
                <MdLocationOn />
              </Button>
              <Button variant="outline-secondary" onClick={searchCallback}>
                <FaSearch />
              </Button>
            </InputGroup.Append>
          </InputGroup>
        </Form.Group>
        <Form.Group controlId="wordRemark">
          <Form.Label>Remark</Form.Label>
          <Form.Control
            as="textarea"
            type="text"
            rows={4}
            value={fields.remark}
            onChange={(evt) => setValues({ remark: evt.target.value })}
          />
          {/* 
          <Form.Text className="text-muted">
            We'll never share your email with anyone else.
          </Form.Text> 
          */}
        </Form.Group>
        <div className="text-center">
          <Button
            as="input"
            type="submit"
            value="Save"
            readOnly
            onClick={addNewWordCallback}
          />
        </div>
      </Form>
    </div>
  );
};

const WbWordBookViewControl = () => {
  const remarkVisible = useStoreState((state) => state.wordbook.remarkVisible);
  const toggleRemarkVisible = useStoreActions(
    (actions) => actions.wordbook.toggleRemarkVisible
  );

  const filterStarred = useStoreState((state) => state.wordbook.filterStarred);
  const toggleFilterStarred = useStoreActions(
    (actions) => actions.wordbook.toggleFilterStarred
  );

  const immerseMode = useStoreState(
    (state) => state.wordbook.uiState.immerseMode
  );
  const toggleImmerseMode = useStoreActions(
    (actions) => actions.wordbook.uiState.toggleImmerseMode
  );
  const toggleImmerseModeCallback = useCallback(() => {
    toggleImmerseMode();
  }, [toggleImmerseMode]);

  const optionChecked = [];
  remarkVisible && optionChecked.push("remarkVisible");
  filterStarred && optionChecked.push("filterStarred");
  immerseMode && optionChecked.push("immerseMode");

  return (
    <ToggleButtonGroup type="checkbox" size="lg" value={optionChecked}>
      <ToggleButton
        variant="outline-primary"
        value="remarkVisible"
        onChange={() => toggleRemarkVisible()}
      >
        <FaEye />
      </ToggleButton>
      <ToggleButton
        variant="outline-primary"
        value="immerseMode"
        onChange={toggleImmerseModeCallback}
      >
        <FaVrCardboard />
      </ToggleButton>
      <ToggleButton
        variant="outline-primary"
        value="filterStarred"
        onChange={() => toggleFilterStarred()}
      >
        <FaStar />
      </ToggleButton>
    </ToggleButtonGroup>
  );
};

interface WbWordBookOpsProps {
  className?: string;
}

const WbWordBookOps = (props: WbWordBookOpsProps) => {
  const { className } = props;

  const fileRef = useRef<HTMLInputElement>(null);

  const loadWordBook = useStoreActions((actions) => actions.wordbook.load);

  const toggleSearchFrameVisible = useStoreActions(
    (actions) => actions.wordbook.uiState.toggleSearchFrameVisible
  );

  const handleDialogAction = useStoreActions(
    (actions) => actions.wordbook.handleDialogAction
  );

  const cloudDownload = useStoreActions(
    (actions) => actions.wordbook.cloudDownload
  );

  const store = useStore();

  const downloadFile = () => {
    const data = store.getState().wordbook; // fetch WordBook state locally
    const json = JSON.stringify(data, undefined, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    var a = document.createElement("a");
    a.download = `${data.name}-backup.json`;
    a.href = url;
    a.textContent = "backup.json";
    a.click();
  };

  const chooseFile = () => {
    const fileCtl = (fileRef.current as any) as HTMLInputElement;
    fileCtl.click();
  };

  const uploadFile = () => {
    const fileCtl = (fileRef.current as any) as HTMLInputElement;
    if (
      fileCtl === null ||
      fileCtl.files === null ||
      fileCtl.files.length === 0
    ) {
      return;
    }
    var file = fileCtl.files[0];
    if (file) {
      var reader = new FileReader();
      reader.readAsText(file, "UTF-8");
      reader.onload = function (evt) {
        const text = (evt.target!.result as any) as string;
        const content = JSON.parse(text);
        loadWordBook(content);
        handleDialogAction("show");
      };
      // reader.onerror = function (evt) {
      //   document.getElementById("fileContents").innerHTML = "error reading file";
      // }
    }
    fileCtl.value = "";
  };

  return (
    <div className={className}>
      <ButtonGroup size="lg" css={{ display: "none" }}>
        <Button variant="outline-dark" onClick={() => cloudDownload("")}>
          <FaCloudDownloadAlt />
        </Button>
        <Button
          variant={true ? "outline-dark" : "outline-secondary"}
          onClick={() => handleDialogAction("show")}
        >
          <FaCloudUploadAlt />
        </Button>
      </ButtonGroup>
      <ButtonGroup size="lg">
        {/* <Button variant="outline-primary"> */}
        <Link to="/pages/books" className="btn btn-outline-primary">
          <FaArrowLeft />
        </Link>
        {/* </Button> */}
        <Button variant="outline-primary" onClick={downloadFile}>
          <FaDownload />
        </Button>
        <Button variant="outline-primary" onClick={chooseFile}>
          <FaUpload />
        </Button>
        <Button
          variant="outline-primary"
          onClick={() => toggleSearchFrameVisible()}
        >
          <FaArrowsAltH />
        </Button>
      </ButtonGroup>
      <input
        type="file"
        ref={fileRef}
        onChange={uploadFile}
        className={"d-none"}
      />
    </div>
  );
};

interface ConfirmDialogProps {
  show: boolean;
  title: string;
  message: string;
  description?: string;
  yesPrompt?: string;
  noPrompt?: string;
  onHide?: () => void;
  onAction?: (actionKey: string) => void;
}

const ConfirmDialog = (props: ConfirmDialogProps) => {
  const {
    title,
    message,
    description,
    yesPrompt,
    noPrompt,
    show,
    onAction,
    onHide,
  } = props;
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{message}</p>
        <p>{description}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={() => onAction?.("no")}
          css={{
            minWidth: "5rem",
          }}
        >
          {noPrompt || "No"}
        </Button>
        <Button
          variant="primary"
          onClick={() => onAction?.("yes")}
          css={{
            minWidth: "5rem",
          }}
        >
          {yesPrompt || "Yes"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const WbNotificationBoard = () => {
  const notificationVisible = useStoreState(
    (state) => state.wordbook.uiState.notificationVisible
  );
  const setNotificationVisible = useStoreActions(
    (actions) => actions.wordbook.uiState.setNotificationVisible
  );
  const notificationText = useStoreState(
    (state) => state.wordbook.uiState.notificationText
  );

  return (
    <Toast
      onClose={() => setNotificationVisible(false)}
      show={notificationVisible}
      delay={2500}
      autohide
      css={{
        minWidth: "24rem",
        position: "absolute",
        bottom: "1rem",
        left: "calc(50% - 12rem)",
      }}
    >
      <Toast.Header>
        <strong className="mr-auto">Warning</strong>
        <small>just now</small>
      </Toast.Header>
      <Toast.Body>{notificationText}</Toast.Body>
    </Toast>
  );
};

type WbWordBookProps = {};

export const WbWordBook = (props: WbWordBookProps) => {
  log.info("render wbwordbook");

  const frameRef = useRef(null);

  const editorCollapsed = useStoreState(
    (state) => state.wordbook.uiState.editorCollapsed
  );
  const setEditorCollapsed = useStoreActions(
    (actions) => actions.wordbook.uiState.setEditorCollapsed
  );
  const wordEditorToggleCallback = useCallback(
    (evt) => {
      setEditorCollapsed(!editorCollapsed);
    },
    [setEditorCollapsed, editorCollapsed]
  );

  const searchFrameVisible = useStoreState(
    (state) => state.wordbook.uiState.searchFrameVisible
  );

  const searchWordCallback = useCallback(
    (name) => {
      const url = `https://dictionary.cambridge.org/dictionary/english/${name}`;
      const f = (frameRef.current as any) as HTMLIFrameElement;
      f.setAttribute("src", url);
    },
    [frameRef]
  );

  const confirmDialogVisible = useStoreState(
    (state) => state.wordbook.uiState.confirmDialogVisible
  );

  const handleDialogAction = useStoreActions(
    (actions) => actions.wordbook.handleDialogAction
  );

  const onConfirmDialogAction = useCallback(
    (actionKey) => {
      handleDialogAction(actionKey);
      if (actionKey === "no") {
        window.location.reload();
      }
    },
    [handleDialogAction]
  );

  return (
    <Container fluid>
      <Row>
        <Col>
          <ConfirmDialog
            show={confirmDialogVisible}
            title="Warning"
            message="Importing finished. "
            description="'Yes' to save it to the server. 'No' to cancel importing operation."
            onHide={() => handleDialogAction("hide")}
            onAction={onConfirmDialogAction}
          />
        </Col>
      </Row>
      <Row>
        <Col xs={searchFrameVisible ? { span: 5 } : { span: 6, offset: 3 }}>
          <WbNotificationBoard />
          <div className="d-flex justify-content-between mt-3">
            <WbWordBookOps />
            <WbWordBookViewControl />
          </div>
          <WbWordBookViewer />
          <div className="mt-4">
            <Accordion activeKey={"" + editorCollapsed}>
              <div className="text-center">
                <Accordion.Toggle
                  as={Button}
                  variant="link"
                  eventKey="true"
                  onClick={wordEditorToggleCallback}
                >
                  {!editorCollapsed ? (
                    <FaAngleDoubleDown />
                  ) : (
                    <FaAngleDoubleUp />
                  )}
                </Accordion.Toggle>
              </div>
              <Accordion.Collapse eventKey="true">
                <WbWordEditor onSearch={searchWordCallback} />
              </Accordion.Collapse>
            </Accordion>
          </div>
        </Col>
        {searchFrameVisible && (
          <Col xs={7}>
            <iframe
              title="cambridge_dictionary_iframe"
              frameBorder={0}
              ref={frameRef}
              className={styles.WbWord_searchFrame}
            />
          </Col>
        )}
      </Row>
    </Container>
  );
};

type WbWordBookPageProps = RouteComponentProps & { bookName?: string };

export const WbWordBookPage = (props: WbWordBookPageProps) => {
  const { bookName } = props;
  const cloudDownload = useStoreActions(
    (actions) => actions.wordbook.cloudDownload
  );

  // for page loading
  useEffect(() => {
    if (bookName !== undefined) {
      cloudDownload(bookName);
    }
  }, [bookName, cloudDownload]);

  return <WbWordBook />;
};

export default hot(WbWordBookPage);

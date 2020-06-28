import styles from "./WbWordBook.module.css";

import { hot } from "react-hot-loader/root";
/** @jsx jsx */
import { jsx, css } from "@emotion/core";

import { Link } from "@reach/router";

import React, { useCallback, useRef, useEffect, MouseEvent } from "react";

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
  FaVrCardboard,
  FaArrowLeft,
} from "react-icons/fa";
import {
  MdFirstPage,
  MdLastPage,
  MdNavigateNext,
  MdNavigateBefore,
  MdLocationOn,
  MdError,
  MdWarning,
  MdInfo,
  MdBrightnessHigh,
  MdBrightnessMedium,
  MdBrightnessLow,
} from "react-icons/md";

import {
  useStoreActions,
  useStore,
  useStoreState,
  NotificationLevel,
  ForwardStepActionMode,
} from "./model";

import { WordCardViewModel } from "./model";
import { IconType } from "react-icons/lib";

import type { RouteComponentProps } from "@reach/router";
import type { WordModel } from "./model";

// *** Component
type WbWordCardProps = {
  word?: WordModel;
  viewModel: WordCardViewModel;
  onWordClick: () => void;
  onWordSearch: () => void;
  onDelete: () => void;
  onStarsChange: (numStars: number) => void;
  onRemarkClicked: () => void;
};

const WbWordCard = (props: WbWordCardProps) => {
  const {
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
      onDelete();
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
        <Card className="shadow">
          <Card.Body>
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
  }, [onClick, name]);
  return (
    <span
      className={clsx(
        className,
        "btn",
        checked ? "text-secondary" : "text-muted",
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
  const pointer = useStoreState((state) => state.wordbook.pointer);
  const wordSize = useStoreState((state) => state.wordbook.currentWordSize);
  const offsetPointer = useStoreActions(
    (state) => state.wordbook.offsetPointer
  );

  const immerseMode = useStoreState(
    (state) => state.wordbook.uiState.immerseMode
  );
  const stepperMode = useStoreState(
    (state) => state.wordbook.uiState.stepperMode
  );
  const setStepperMode = useStoreActions(
    (state) => state.wordbook.uiState.setStepperMode
  );
  const forwardStepCallback = useCallback(() => {
    if (immerseMode) {
      // log.info("set to move forward", immerseMode, stepperMode);
      if (stepperMode === ForwardStepActionMode.MOVE_FORWARD) {
        setStepperMode(ForwardStepActionMode.SHOW_CARD);
        offsetPointer(1);
      } else if (stepperMode === ForwardStepActionMode.SHOW_CARD) {
        setStepperMode(ForwardStepActionMode.MOVE_FORWARD);
      }
    } else {
      offsetPointer(1);
    }
  }, [immerseMode, stepperMode, setStepperMode, offsetPointer]);
  return (
    <Pagination size="lg" className={clsx("mb-0")}>
      <Pagination.Item onClick={() => offsetPointer(-1e5)}>
        <MdFirstPage />
      </Pagination.Item>
      <Pagination.First onClick={() => offsetPointer(-10)} />
      <Pagination.Prev
        onClick={() => offsetPointer(-1)}
        css={{
          textAlign: "center",
          minWidth: "5rem",
        }}
      />
      <PageItem
        css={{
          textAlign: "center",
          minWidth: "8rem",
        }}
      >
        <span>
          <small>
            {pointer + 1} / {wordSize}
          </small>
        </span>
      </PageItem>
      <Pagination.Item
        active={
          immerseMode && stepperMode === ForwardStepActionMode.MOVE_FORWARD
        }
        onClick={forwardStepCallback}
        css={{
          textAlign: "center",
          minWidth: "5rem",
        }}
      >
        <MdNavigateNext />
      </Pagination.Item>
      <Pagination.Last onClick={() => offsetPointer(10)} />
      <Pagination.Item onClick={() => offsetPointer(1e5)}>
        <MdLastPage />
      </Pagination.Item>
    </Pagination>
  );
};

type WbWordBookViewerProps = {};

const WbWordBookViewer = (props: WbWordBookViewerProps) => {
  const word = useStoreState((state) => state.wordbook.currentWord);

  const cardViewModel = useStoreState(
    (state) => state.wordbook.uiState.compCardViewModel
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
      <div className="mt-3">
        {word ? (
          <WbWordCard
            word={word}
            viewModel={cardViewModel}
            onRemarkClicked={workClickedCallback}
            onWordClick={workClickedCallback}
            onWordSearch={wordSearchCallback}
            onDelete={deleteCallback}
            onStarsChange={changeStarsCallback}
          />
        ) : (
          <div className="mt-5 mb-5">
            <p className="text-center">No words available.</p>
          </div>
        )}
      </div>
      <div className="mt-4 d-flex justify-content-center">
        <WbWordBookNav />
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
    if (fields.name) {
      addNewWord(fields);
      clearFields();
    }
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
      onSearch(fields.name);
    }
  }, [directSearch, clearDirectSearch, fields, onSearch]);

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
              <Button variant="outline-primary" onClick={clearInput}>
                <FaTimes />
              </Button>
              <Button variant="outline-primary" onClick={locatePointerCallback}>
                <MdLocationOn />
              </Button>
              <Button variant="outline-primary" onClick={searchCallback}>
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
            rows={3}
            value={fields.remark}
            onChange={(evt) => setValues({ remark: evt.target.value })}
          />
        </Form.Group>
        <Form.Group controlId="wordExample">
          <Form.Label>Example</Form.Label>
          <Form.Control
            as="textarea"
            type="text"
            rows={3}
            value={fields.example}
            onChange={(evt) => setValues({ example: evt.target.value })}
          />
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

const WbWordCardViewModelControl = () => {
  const cardViewModel = useStoreState(
    (state) => state.wordbook.uiState.cardViewModel
  );
  const setCardViewModel = useStoreActions(
    (actions) => actions.wordbook.uiState.setCardViewModel
  );

  const radios = [
    {
      value: WordCardViewModel.Full,
      buttonIcon: MdBrightnessHigh,
    },
    {
      value: WordCardViewModel.WordOnly,
      buttonIcon: MdBrightnessLow,
    },
    {
      value: WordCardViewModel.DefinitionsOnly,
      buttonIcon: MdBrightnessMedium,
    },
  ];

  return (
    <ToggleButtonGroup
      name="WbWordCardViewModelSelector__ToggleButtonGroup"
      type="radio"
      size="lg"
      value={cardViewModel}
    >
      {radios.map((radio, idx) => (
        <ToggleButton
          key={idx}
          type="radio"
          variant="outline-primary"
          name="radio"
          value={radio.value}
          onChange={(evt: React.ChangeEvent<any>) =>
            setCardViewModel(parseInt(evt.currentTarget.value))
          }
        >
          <radio.buttonIcon />
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
};

const WbWordBookViewControl = () => {
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
  filterStarred && optionChecked.push("filterStarred");
  immerseMode && optionChecked.push("immerseMode");

  return (
    <ToggleButtonGroup type="checkbox" size="lg" value={optionChecked}>
      {/* <ToggleButton
        variant="outline-primary"
        value="remarkVisible"
        onChange={() => toggleImmerseModeCallback()}
      >
        <FaEye />
      </ToggleButton> */}
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

  const mergeBook = useStoreActions((actions) => actions.wordbook.merge);

  const toggleSearchFrameVisible = useStoreActions(
    (actions) => actions.wordbook.uiState.toggleSearchFrameVisible
  );
  // const cloudDownload = useStoreActions(
  //   (actions) => actions.wordbook.cloudDownload
  // );
  const cloudUpload = useStoreActions(
    (actions) => actions.wordbook.cloudUpload
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
        mergeBook(content);
        cloudUpload();
      };
      // reader.onerror = function (evt) {
      //   document.getElementById("fileContents").innerHTML = "error reading file";
      // }
    }
    fileCtl.value = "";
  };

  return (
    <div className={clsx(className)}>
      <ButtonGroup size="lg">
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
  const notificationLevel = useStoreState(
    (state) => state.wordbook.uiState.notificationLevel
  );

  const mappingIcon = (level: NotificationLevel) => {
    let icon: IconType = MdInfo;
    if (level === NotificationLevel.Info) {
      icon = MdInfo;
    } else if (level === NotificationLevel.Warning) {
      icon = MdWarning;
    } else if (level === NotificationLevel.Error) {
      icon = MdError;
    }
    return icon;
  };
  const LevelIcon = mappingIcon(notificationLevel);

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
        <LevelIcon />
        <strong className="mr-auto ml-2">{notificationLevel}</strong>
        {/* <small>just now</small> */}
      </Toast.Header>
      <Toast.Body>{notificationText}</Toast.Body>
    </Toast>
  );
};

type WbWordBookProps = {};

export const WbWordBook = (props: WbWordBookProps) => {
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
      const f = (frameRef.current as any) as HTMLIFrameElement;
      if (f) {
        const url = `https://dictionary.cambridge.org/dictionary/english/${name}`;
        f.setAttribute("src", url);
      }
    },
    [frameRef]
  );

  return (
    <Container fluid>
      {/* <Row>
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
      </Row> */}
      <Row>
        <Col xs={searchFrameVisible ? { span: 5 } : { span: 6, offset: 3 }}>
          <WbNotificationBoard />
          <div className="d-flex justify-content-between mt-3">
            <WbWordBookOps />
            <WbWordCardViewModelControl />
            <WbWordBookViewControl />
          </div>
          <WbWordBookViewer />
          <div className="mt-3">
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
              className={styles.WbWord__searchFrame}
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

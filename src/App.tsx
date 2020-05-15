import 'bootstrap/dist/css/bootstrap.min.css';
// import './App.css';

import React, { useCallback, useRef, useState } from 'react';

import _ from 'lodash';
import { nanoid } from 'nanoid'


import { createStore, StoreProvider, action, computed, createTypedHooks, persist, Thunk, thunk } from 'easy-peasy';
import { Action, Computed } from 'easy-peasy';
// createComponentStore State Actions

import styles from './App.module.css'; // Import css modules stylesheet as styles
import clsx from 'clsx';

import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup';
import Card from 'react-bootstrap/Card';
import ToggleButton from 'react-bootstrap/ToggleButton';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Pagination from 'react-bootstrap/Pagination';
import PageItem from 'react-bootstrap/PageItem';
import Accordion from 'react-bootstrap/Accordion';

import { FaStar, FaAngleDoubleDown, FaAngleDoubleUp, FaRegStar, FaEye, FaDownload, FaUpload, FaSearch, FaArrowsAltH, FaTimes, } from 'react-icons/fa';

enum WordType {
  n = "n",
  adj = "adj",
  adv = "adv",
  v = "v",
  vt = "vt",
  vi = "vi",
}

// *** Model
interface WordModel {
  id: string,
  name: string,
  starred: boolean,
  type: string[],
  bookmarked: boolean,
  remark: string,
  createdOn: number,
};

interface WordBookModel {
  words: Array<WordModel>,
  wordSize: Computed<WordBookModel, number>,

  pointer: number,
  offsetPointer: Action<WordBookModel, number>,

  currentWord: Computed<WordBookModel, WordModel>,
  toggleCurrentWordStarred: Action<WordBookModel>,
  toggleCurrentWordBookmarked: Action<WordBookModel>,

  deleteCurrentWord: Action<WordBookModel>,

  saveWord: Action<WordBookModel, Partial<WordModel>>,

  remarkVisible: boolean,
  toggleRemarkVisible: Action<WordBookModel>,

  searchFrameVisible: boolean,
  toggleSearchFrameVisible: Action<WordBookModel>,

  editor: WordEditorModel,
  fillEditorWithCurrentWord: Action<WordBookModel>,

  load: Action<WordBookModel, Partial<WordBookModel>>,
  loadDefault: Thunk<WordBookModel>,
};

interface WordEditorModel {
  fields: WordModel,
  setValues: Action<WordEditorModel, Partial<WordModel>>,
  clearValues: Action<WordEditorModel>,
}

interface AppModel {
  wordbook: WordBookModel,
};

const createWordModel = () => {
  return {
    id: '',
    starred: false,
    type: [],
    bookmarked: false,
    name: '',
    remark: '',
    createdOn: 0,
  };
}

// *** Store
const store = (function initAppStore() {
  const wordEditorModel: WordEditorModel = {
    fields: createWordModel(),
    setValues: action((state, payload) => {
      _.assign(state.fields, payload);
    }),
    clearValues: action((state) => {
      _.assign(state.fields, createWordModel());
    })
  };

  const appModel: AppModel = {
    wordbook: {
      words: new Array<WordModel>(),
      pointer: -1,

      wordSize: computed((state) => {
        return state.words.length;
      }),
      currentWord: computed((state) => {
        // console.log('current word is ', state.words, state.pointer);
        return state.words[state.pointer];
      }),
      offsetPointer: action((state, value) => {
        const p = state.pointer + value;
        state.pointer = Math.max(Math.min(p, state.words.length - 1), 0);
      }),
      deleteCurrentWord: action((state) => {
        state.words.splice(state.pointer, 1);
        state.pointer = Math.max(Math.min(state.pointer, state.words.length - 1), 0);
      }),
      saveWord: action((state, newWord) => {
        if (_.isEmpty(newWord.name)) {
          return;
        }
        const pExist = _.findIndex(state.words, (item) => {
          return item.name === newWord.name;
        });
        if (pExist >= 0) {
          state.pointer = pExist;
          if (newWord.remark) {
            state.words[pExist].remark = newWord.remark;
          }
        } else {
          state.words.push({
            id: nanoid(),
            name: newWord.name || '',
            starred: false,
            bookmarked: false,
            type: [],
            remark: newWord.remark || '',
            createdOn: Date.now(),
          });
          state.pointer = state.words.length - 1;
        }
      }),
      toggleCurrentWordStarred: action((state) => {
        state.words[state.pointer].starred = !state.words[state.pointer].starred;
      }),
      toggleCurrentWordBookmarked: action((state) => {
        state.words[state.pointer].bookmarked = !state.words[state.pointer].bookmarked;
      }),

      remarkVisible: true,
      searchFrameVisible: true,
      toggleRemarkVisible: action((state) => {
        state.remarkVisible = !state.remarkVisible;
      }),
      toggleSearchFrameVisible: action((state) => {
        state.searchFrameVisible = !state.searchFrameVisible;
      }),

      editor: wordEditorModel,
      fillEditorWithCurrentWord: action((state) => {
        state.editor.fields.name = state.currentWord.name;
        state.editor.fields.remark = state.currentWord.remark;
      }),

      load: action((state, doc) => {
        state.words = doc.words || [];
        state.pointer = 0;
      }),
      loadDefault: thunk((actions, payload, helper) => {
        if (helper.getState().wordSize === 0) {
          actions.saveWord({ name: 'fluter', remark: 'fluter detail example' });
          actions.saveWord({ name: 'resolute', remark: 'resolute detail example' });
          actions.saveWord({ name: 'cardigan', remark: 'cardigan detail example' });
        }
      }),
    }
  };
  const store = createStore(persist(
    appModel,
    {
      storage: 'localStorage',
    }
  ));
  store.getActions().wordbook.loadDefault();
  return store;
})();

// *** Component
const typedHooks = createTypedHooks<AppModel>();
export const useStoreActions = typedHooks.useStoreActions;
export const useStoreDispatch = typedHooks.useStoreDispatch;
export const useStoreState = typedHooks.useStoreState;

type WbWordCardProps = {
  word: WordModel,
  remarkVisible?: boolean;
  onToggleStarred: () => void,
  onToggleBookmarked: () => void,
  onWordClicked: () => void;
  onDelete: () => void;
}

const WbWordCard = (props: WbWordCardProps) => {
  const { word, remarkVisible } = props;
  return (
    <Card>
      <Card.Body>
        <Card.Title className={styles.WbWordCard__title}>
          <Button variant="light" onClick={() => props.onDelete()} className={styles.WbWordCard__deleteButton}>
            <FaTimes />
          </Button>
          <div className="d-flex align-items-center" >
            <span className="h1" onClick={() => props.onWordClicked()}>
              {word.name}
            </span>
          </div>
        </Card.Title>

        {/* <Card.Subtitle className="mb-2 text-muted">Card Subtitle</Card.Subtitle> */}
        <Card.Text className={styles.WbWordCard_remark}>
          {remarkVisible && (
            <span>{word.remark}</span>
          )}
        </Card.Text>

        {/* <Card.Link href="#">Card Link</Card.Link>
        <Card.Link href="#">Another Link</Card.Link> */}
        {/* <ToggleButton checked={word.starred} type="checkbox" value="starred" variant="outline-warning" size="lg" onChange={props.onToggleStarred}>
          <FaStar />
        </ToggleButton> */}
        {/* <ToggleButton checked={word.bookmarked} type="checkbox" value="bookmarked" variant="info" onChange={props.onToggleBookmarked}>
          <FaBook />
        </ToggleButton> */}
        <div className={clsx("d-flex", "flex-row-reverse")}>
          <WbStarToggler checked={word.starred} onClick={props.onToggleStarred} />
        </div>
      </Card.Body>
    </Card >
  );
}

interface WbStarTogglerProps {
  checked: boolean,
  onClick?: () => void;
}

const WbStarToggler = (props: WbStarTogglerProps) => {
  const { checked } = props;
  return (
    <span className={clsx("btn", checked ? "text-warning" : "text-secondary")} onClick={props.onClick}>
      <h4>
        {checked ? (<FaStar />) : (<FaRegStar />)}
      </h4>
    </span>
  )
}

const WbWordBookNav = () => {
  const pointer = useStoreState((state) => state.wordbook.pointer);
  const wordSize = useStoreState((state) => state.wordbook.wordSize);
  const offsetPointer = useStoreActions((state) => state.wordbook.offsetPointer);
  return (
    <Pagination size="lg" className={clsx('mb-0', styles.WbWordBookNav__pagination)}>
      <Pagination.First onClick={() => offsetPointer(-1e5)} />
      <Pagination.Prev onClick={() => offsetPointer(-1)} />
      <PageItem disabled>
        {pointer + 1}/{wordSize}
      </PageItem>
      <Pagination.Next onClick={() => offsetPointer(1)} />
      <Pagination.Last onClick={() => offsetPointer(1e5)} />
    </Pagination>

  );
}

type WbWordBookViewerProps = {
}

const WbWordBookViewer = (props: WbWordBookViewerProps) => {
  const word = useStoreState((state) => {
    return state.wordbook.currentWord;
  });
  const remarkVisible = useStoreState((state) => {
    return state.wordbook.remarkVisible;
  });
  const toggleWordStarred = useStoreActions((actions) => actions.wordbook.toggleCurrentWordStarred);
  const toggleWordBookmarked = useStoreActions((actions) => actions.wordbook.toggleCurrentWordBookmarked);
  const fillEditorWithCurrentWord = useStoreActions((actions) => actions.wordbook.fillEditorWithCurrentWord);
  const deleteCurrentWord = useStoreActions((state) => state.wordbook.deleteCurrentWord);
  const toggleStarredCallback = useCallback(() => toggleWordStarred(), [toggleWordStarred]);
  const toggleBookmarkedCallback = useCallback(() => toggleWordBookmarked(), [toggleWordBookmarked]);
  const workClickedCallback = useCallback(() => fillEditorWithCurrentWord(), [fillEditorWithCurrentWord]);
  const deleteCallback = useCallback(() => deleteCurrentWord(), [deleteCurrentWord]);

  return (
    <div>
      <div className={styles.WbWordBookViewer__WordCard}>
        <WbWordCard
          word={word} remarkVisible={remarkVisible}
          onToggleBookmarked={toggleBookmarkedCallback}
          onToggleStarred={toggleStarredCallback}
          onWordClicked={workClickedCallback}
          onDelete={deleteCallback}
        />
      </div>
      <div className="d-flex align-items-center align-self-center">
        <div className="flex-fill">
          <WbWordBookNav />
        </div>
        <WbWordBookViewControl />
      </div>
    </div>
  );
};

interface WbWordEditorProps {
  onSearch: (name: string) => void,
}

const WbWordEditor = (props: WbWordEditorProps) => {
  const { onSearch } = props;
  const wordNameRef = useRef<HTMLInputElement>(null);
  const fields = useStoreState(state => state.wordbook.editor.fields);
  const setValues = useStoreActions(actions => actions.wordbook.editor.setValues);
  const addNewWord = useStoreActions((actions) => actions.wordbook.saveWord);
  const clearFields = useStoreActions((actions) => actions.wordbook.editor.clearValues);
  const addNewWordCallback = useCallback(() => {
    addNewWord(fields);
    clearFields();
  }, [addNewWord, clearFields, fields]);
  const searchCallback = useCallback(() => {
    onSearch(fields.name);
  }, [onSearch, fields]);
  const detectEnter = useCallback((evt: React.KeyboardEvent<HTMLInputElement>) => {
    if (evt.keyCode === 13) {
      onSearch(fields.name);
    }
  }, [onSearch, fields]);
  const clearInput = useCallback((evt) => {
    setValues({ name: '', remark: '' });
    _.defer(() => {
      if (wordNameRef.current) {
        wordNameRef.current!.focus();
      }
    });
  }, [setValues]);

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
            <Form.Control type="text" placeholder="word..." required ref={wordNameRef}
              value={fields.name} onChange={(evt) => setValues({ name: evt.target.value })}
              onKeyUp={detectEnter}
            />
            <Form.Control.Feedback type="invalid">
              Please choose a username.
            </Form.Control.Feedback>
            <InputGroup.Append>
              {/* <InputGroup.Text id="inputGroupPrepend"> */}
              <Button variant="outline-secondary" onClick={clearInput}>
                <FaTimes />
              </Button>
              <Button variant="outline-secondary" onClick={searchCallback}>
                <FaSearch />
              </Button>
              {/* </InputGroup.Text> */}
            </InputGroup.Append>
          </InputGroup>
        </Form.Group>
        <Form.Group controlId="wordRemark">
          <Form.Label>Remark</Form.Label>
          <Form.Control as="textarea" type="text" rows={4}
            value={fields.remark} onChange={(evt) => setValues({ remark: evt.target.value })}
          />
          {/* 
          <Form.Text className="text-muted">
            We'll never share your email with anyone else.
          </Form.Text> 
          */}
        </Form.Group>
        <div className="text-center">
          <Button as="input" type="submit" value="Save" readOnly onClick={addNewWordCallback} />
        </div>
      </Form>
    </div>
  )
}

const WbWordBookViewControl = () => {
  const remarkVisible = useStoreState(state => state.wordbook.remarkVisible);
  const toggleRemarkVisible = useStoreActions(actions => actions.wordbook.toggleRemarkVisible);

  return (
    <ToggleButtonGroup type="checkbox" size="lg">
      <ToggleButton variant="outline-success" checked={remarkVisible} value="remarkVisible" onChange={() => toggleRemarkVisible()}>
        <FaEye />
      </ToggleButton>
      <ToggleButton variant="outline-success" checked={remarkVisible} value="starredFilter" onChange={() => toggleRemarkVisible()}>
        <FaStar />
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

interface WbWordBookOpsProps {
  className?: string,
}

const WbWordBookOps = (props: WbWordBookOpsProps) => {
  const { className } = props;
  const fileRef = useRef<HTMLInputElement>(null);

  const loadAction = useStoreActions(actions => actions.wordbook.load);
  const toggleSearchFrameVisible = useStoreActions(actions => actions.wordbook.toggleSearchFrameVisible);

  const downloadFile = () => {
    const data = store.getState().wordbook;
    const json = JSON.stringify(data);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    var a = document.createElement('a');
    a.download = "backup.json";
    a.href = url;
    a.textContent = "backup.json";
    a.click();
  };

  const chooseFile = () => {
    const fileCtl = fileRef.current as any as HTMLInputElement;
    fileCtl.click();
  }

  const uploadFile = () => {
    const fileCtl = fileRef.current as any as HTMLInputElement;
    if (fileCtl === null || fileCtl.files === null || fileCtl.files.length === 0) {
      return;
    }
    var file = fileCtl.files[0];
    if (file) {
      var reader = new FileReader();
      reader.readAsText(file, "UTF-8");
      reader.onload = function (evt) {
        const text = evt.target!.result as any as string;
        const content = JSON.parse(text);
        console.log(content);
        loadAction(content);
      }
      // reader.onerror = function (evt) {
      //   document.getElementById("fileContents").innerHTML = "error reading file";
      // }
    }
    fileCtl.value = '';
  }

  return (
    <div className={className}>
      <ButtonGroup size="lg">
        <Button variant="outline-dark" onClick={downloadFile}>
          <FaDownload />
        </Button>
        <Button variant="outline-dark" onClick={chooseFile}>
          <FaUpload />
        </Button>
        <Button variant="outline-dark" onClick={() => toggleSearchFrameVisible()}>
          <FaArrowsAltH />
        </Button>
      </ButtonGroup>
      <input type="file" ref={fileRef} onChange={uploadFile} className={"d-none"} />
      {/* <Form.File /> */}
      {/* <FormFileInput /> */}
    </div>
  )
}

const WbWordBook = () => {
  const frameRef = useRef(null);
  const [accordionKey, setAccordionKey] = useState('0');

  const searchFrameVisible = useStoreState((state) => {
    return state.wordbook.searchFrameVisible;
  });

  const searchWordCallback = useCallback((name) => {
    const url = `https://dictionary.cambridge.org/dictionary/english/${name}`
    const f = frameRef.current as any as HTMLIFrameElement;
    f.setAttribute('src', url);
  }, [frameRef]);

  const wordEditorToggleCallback = useCallback((evt) => {
    setAccordionKey(accordionKey === '0' ? '1' : '0');
  }, [setAccordionKey, accordionKey]);

  return (
    <Container fluid>
      <Row>
        <Col>
        </Col>
      </Row>
      <Row>
        <Col xs={searchFrameVisible ? { span: 5 } : { span: 6, offset: 3 }}>
          <WbWordBookOps className={clsx("d-flex justify-content-end mt-3")} />
          <WbWordBookViewer />
          <div className={styles.WbWordBook__WordEditor}>
            <Accordion activeKey={accordionKey}>
              <div className="text-center">
                <Accordion.Toggle as={Button} variant="link" eventKey="1" onClick={wordEditorToggleCallback}>
                  {accordionKey === '0' ? (<FaAngleDoubleDown />) : (<FaAngleDoubleUp />)}
                </Accordion.Toggle>
              </div>
              <Accordion.Collapse eventKey="1">
                <WbWordEditor onSearch={searchWordCallback} />
              </Accordion.Collapse>
            </Accordion>
          </div>
        </Col>
        {searchFrameVisible && (
          <Col xs={7}>
            <iframe title="cambridge_dictionary_iframe" frameBorder={0} ref={frameRef} className={styles.WbWord_searchFrame} />
          </Col>
        )}
      </Row>
    </Container>
  );
}

function App() {
  return (
    <StoreProvider store={store}>
      <div className="App">
        <WbWordBook />
        {/* <header className="App-header">
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
        </header> */}
      </div>
    </StoreProvider>
  );
}

export default App;

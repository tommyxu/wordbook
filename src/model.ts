import { nanoid } from "nanoid";
import _ from "lodash";
import log from "loglevel";

import {
  action,
  computed,
  createTypedHooks,
  thunk,
  thunkOn,
  actionOn,
} from "easy-peasy";
import { Action, Computed, ActionOn, ThunkOn, Thunk, State } from "easy-peasy";

// *** Model
export interface WordModel {
  id: string;
  name: string;
  stars: number;
  starred: boolean;
  type: string[];
  bookmarked: boolean;
  remark: string;
  createdOn: number;
  lastModified: number;
}

export interface WordBookModel {
  spec: string;

  dirty: boolean;
  setDirty: Action<WordBookModel, boolean>;

  version: number;
  increaseVersion: Action<WordBookModel>;

  _words: Array<WordModel>;

  filterStarred: boolean;
  toggleFilterStarred: Action<WordBookModel>;
  currentWords: Computed<WordBookModel, Array<WordModel>>;
  currentWordSize: Computed<WordBookModel, number>;

  pointer: number;
  offsetPointer: Action<WordBookModel, number>;

  currentWord: Computed<WordBookModel, WordModel | null>;

  // toggleCurrentWordStarred: Action<WordBookModel>;
  setCurrentWordStars: Action<WordBookModel, number>;
  toggleCurrentWordBookmarked: Action<WordBookModel>;
  deleteCurrentWord: Action<WordBookModel>;

  saveWord: Action<WordBookModel, Partial<WordModel>>;

  remarkVisible: boolean;
  toggleRemarkVisible: Action<WordBookModel>;

  editor: WordEditorModel;
  fillEditorWithCurrentWord: Action<WordBookModel>;

  load: Action<WordBookModel, Partial<WordBookModel>>;
  loadDefault: Thunk<WordBookModel>;

  cloudUpload: Thunk<WordBookModel>;
  cloudDownload: Thunk<WordBookModel>;

  autoSetDirty: ThunkOn<WordBookModel>;

  uiState: WordBookUiState;
  handleDialogAction: Thunk<WordBookModel, string>;
}

// export interface DialogActionPayload {
//   topic: string;
//   action: string;
// }

export interface WordBookUiState {
  confirmDialogVisible: boolean;
  setConfirmDialogVisible: Action<WordBookUiState, boolean>;

  searchFrameVisible: boolean;
  toggleSearchFrameVisible: Action<WordBookUiState>;

  notificationVisible: boolean;
  setNotificationVisible: Action<WordBookUiState, boolean>;

  editorCollapsed: boolean;
  setEditorCollapsed: Action<WordBookUiState, boolean>;
}

export interface WordEditorModel {
  fields: WordModel;
  setValues: Action<WordEditorModel, Partial<WordModel>>;
  clearValues: Action<WordEditorModel>;
}

export interface AppModel {
  wordbook: WordBookModel;
}

const createWordModel = () => {
  return {
    id: "",
    stars: 0,
    starred: false,
    type: [],
    bookmarked: false,
    name: "",
    remark: "",
    createdOn: new Date().getTime(),
    lastModified: new Date().getTime(),
  };
};

const createWordEditorModel = () => {
  const model: WordEditorModel = {
    fields: createWordModel(),
    setValues: action((state, payload) => {
      _.assign(state.fields, payload);
    }),
    clearValues: action((state) => {
      _.assign(state.fields, createWordModel());
    }),
  };
  return model;
};

const createWordBookModel = () => {
  const findWordIndex = (state: State<WordBookModel>, word: WordModel) => {
    return _.findIndex(state._words, (item) => item.id === word.id);
  };
  const getFilteredWords = (state: State<WordBookModel>) => {
    if (state.filterStarred) {
      return _.filter(state._words, (w) => w.starred);
    } else {
      return state._words;
    }
  };
  const setNewPointer = (state: State<WordBookModel>, p?: number) => {
    const filterWordSize = getFilteredWords(state).length;
    state.pointer = Math.max(
      Math.min(p === undefined ? 1e8 : p, filterWordSize - 1),
      0
    );
  };
  const getCurrentWord = (state: State<WordBookModel>) => {
    if (state.pointer >= 0) {
      return getFilteredWords(state)[state.pointer];
    } else {
      return null;
    }
  };

  const wordbookModel: WordBookModel = {
    spec: "wordbook/1",

    dirty: false,
    setDirty: action((state, flag) => {
      state.dirty = flag;
    }),

    version: 0,
    increaseVersion: action((state) => {
      state.version = new Date().getTime();
      state.dirty = true;
    }),

    filterStarred: false,
    toggleFilterStarred: action((state) => {
      state.filterStarred = !state.filterStarred;
      state.pointer = 0; // go back to the first item
    }),

    _words: new Array<WordModel>(),
    currentWords: computed((state) => {
      return getFilteredWords(state);
    }),
    currentWordSize: computed((state) => {
      return getFilteredWords(state).length;
    }),

    pointer: -1,
    currentWord: computed((state) => {
      return getCurrentWord(state);
    }),
    offsetPointer: action((state, value) => {
      setNewPointer(state, state.pointer + value);
    }),

    deleteCurrentWord: action((state) => {
      const cw = getCurrentWord(state);
      const wIndex = findWordIndex(state, cw!);
      state._words.splice(wIndex, 1);
      setNewPointer(state, state.pointer);
    }),
    // toggleCurrentWordStarred: action((state) => {
    //   const word = getCurrentWord(state);
    //   if (word) {
    //     word.starred = !word.starred;
    //     // this operation might cause star array reseting and pointer reset
    //     setNewPointer(state, state.pointer);
    //   }
    // }),
    setCurrentWordStars: action((state, stars: number) => {
      const word = getCurrentWord(state);
      if (word) {
        word.stars = stars;
        if (word.stars > 0) {
          word.starred = true;
        } else {
          word.starred = false;
        }
        // this operation might cause star array reseting and pointer reset
        setNewPointer(state, state.pointer);
      }
    }),
    toggleCurrentWordBookmarked: action((state) => {
      const word = getCurrentWord(state);
      if (word) {
        word.bookmarked = !word.bookmarked;
      }
    }),
    saveWord: action((state, newWord) => {
      if (_.isEmpty(newWord.name)) {
        return;
      }
      const pExist = _.findIndex(state._words, (item) => {
        return item.name === newWord.name;
      });
      // if the old word is found, just update
      if (pExist >= 0) {
        if (newWord.remark) {
          state._words[pExist].remark = newWord.remark;
          state._words[pExist].lastModified = new Date().getTime();
        }
      } else {
        const nw = createWordModel();
        nw.id = nanoid();
        nw.name = newWord.name || "<missed>";
        nw.remark = newWord.remark || "<missed>";
        nw.createdOn = 0;
        state._words.push(nw);
        setNewPointer(state);
      }
    }),

    remarkVisible: true,
    toggleRemarkVisible: action((state) => {
      state.remarkVisible = !state.remarkVisible;
    }),

    editor: createWordEditorModel(),
    fillEditorWithCurrentWord: action((state) => {
      if (state.currentWord) {
        state.editor.fields.name = state.currentWord.name;
        state.editor.fields.remark = state.currentWord.remark;
      }
    }),

    load: action((state, doc) => {
      if (doc.spec?.startsWith("wordbook/") && doc._words) {
        const input = doc._words!;
        // regularize the input document
        const content = _.forEach(input, (w: WordModel) => {
          if (w.stars === undefined) {
            w.stars = w.starred ? 1 : 0;
          }
          w.remark = _.trim(w.remark);
          w.name = _.trim(w.name);
          if (w.createdOn === 0 || w.createdOn === undefined) {
            w.createdOn = new Date().getTime();
          }
          if (w.lastModified === 0 || w.lastModified === undefined) {
            w.lastModified = w.createdOn;
          }
        });
        state._words = content;
        log.info("load words, size: ", content.length);
        state.pointer = 0;
      } else {
        log.error("unknown document. cannot merge.");
      }
    }),

    loadDefault: thunk((actions, payload, helper) => {
      if (helper.getState()._words.length === 0) {
        actions.saveWord({ name: "fluster", remark: "fluster detail example" });
        actions.saveWord({
          name: "resolute",
          remark: "resolute detail example",
        });
        actions.saveWord({
          name: "cardigan",
          remark: "cardigan detail example",
        });
      }
    }),

    cloudDownload: thunk(async (actions, payload, helper) => {
      const resp = await fetch("/api/state");
      const remoteDoc = await resp.json();
      actions.load(remoteDoc);
    }),

    cloudUpload: thunk(async (actions, payload, helper) => {
      const resp = await fetch("/api/state", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(helper.getState()),
      });
      const remote = await resp.json();
      if (remote.status === "ok") {
        actions.setDirty(false);
      }
    }),

    autoSetDirty: thunkOn(
      (actions) => [
        // actions.offsetPointer,
        actions.setCurrentWordStars,
        actions.deleteCurrentWord,
        actions.saveWord,
      ],
      async (actions, target) => {
        actions.increaseVersion();
      }
    ),

    uiState: {
      confirmDialogVisible: false,
      setConfirmDialogVisible: action((state, visible) => {
        state.confirmDialogVisible = visible;
      }),
      searchFrameVisible: true,
      toggleSearchFrameVisible: action((state) => {
        state.searchFrameVisible = !state.searchFrameVisible;
      }),
      notificationVisible: false,
      setNotificationVisible: action((state, visible) => {
        state.notificationVisible = visible;
      }),
      editorCollapsed: false,
      setEditorCollapsed: action((state, collapsed) => {
        state.editorCollapsed = collapsed;
        log.info("set note visible", collapsed);
      }),
    },

    handleDialogAction: thunk(async (actions, actionKey, helper) => {
      switch (actionKey) {
        case "show":
          actions.uiState.setConfirmDialogVisible(true);
          break;
        case "yes":
          actions.uiState.setConfirmDialogVisible(false);
          actions.cloudUpload();
        case "no":
          actions.uiState.setConfirmDialogVisible(false);
          break;
      }
    }),
  };

  return wordbookModel;
};

const createAppModel = () => {
  const appModel: AppModel = {
    wordbook: createWordBookModel(),
  };
  return appModel;
};

// createComponentStore State Actions

// enum WordType {
//   n = "n",
//   adj = "adj",
//   adv = "adv",
//   v = "v",
//   vt = "vt",
//   vi = "vi",
// }

const typedHooks = createTypedHooks<AppModel>();

export const useStoreActions = typedHooks.useStoreActions;
export const useStoreDispatch = typedHooks.useStoreDispatch;
export const useStoreState = typedHooks.useStoreState;

export default createAppModel();

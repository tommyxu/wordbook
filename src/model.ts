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

import FlexSearch from "flexsearch";
import flexsearch_en from "flexsearch/lang/en.min.js";

const index = FlexSearch.create({
  // stemmer: flexsearch_en,
  // filter: flexsearch_en,
  // profile: "match",
  // encode: "extra",
  doc: {
    id: "id",
    field: {
      name: {
        encode: "simple",
        tokenize: "forward",
      },
      remark: {
        encode: "simple",
        tokenize: "forward",
      },
      translation: {
        encode: false,
        tokenize: function (str: string) {
          return str.replace(/[\x20-\x7F]/g, "").split("");
        },
      },
    }, // ["name", "remark", "example", "translation"],
  },
});
log.info("index.info", index.info());

// *** Model
export interface WordModel {
  id: string;
  name: string; // alias: word
  stars: number;
  starred: boolean;
  type: string[];
  bookmarked: boolean;
  remark: string; // alias: definition
  example: string; // alias: usage
  translation: string; // not used now
  pronunciations: string; // not used now
  createdOn: number;
  lastModified: number;
}

export enum WordCardViewModel {
  Full, // word + definition + usage
  WordOnly,
  DefinitionsOnly,
}

export interface WordBookModel {
  spec: string;

  id: string;
  name: string;

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
  setPointer: Action<WordBookModel, number>;
  locatePointer: Thunk<WordBookModel, string>;

  currentWord: Computed<WordBookModel, WordModel | null>;

  setCurrentWordStars: Action<WordBookModel, number>;
  toggleCurrentWordBookmarked: Action<WordBookModel>;
  deleteCurrentWord: Action<WordBookModel>;

  saveWord: Action<WordBookModel, Partial<WordModel>>;
  searchWord: Thunk<WordBookModel, string>;

  editor: WordEditorModel;
  fillEditorWithCurrentWord: Action<WordBookModel>;

  load: Action<WordBookModel, Partial<WordBookModel>>;
  merge: Action<WordBookModel, Partial<WordBookModel>>;

  loadDefault: Thunk<WordBookModel>;

  cloudUpload: Thunk<WordBookModel>;
  cloudDownload: Thunk<WordBookModel, string>;

  autoSetDirty: ThunkOn<WordBookModel>;

  uiState: WordBookUiState;
}

export enum NotificationLevel {
  Warning = "Warning",
  Error = "Error",
  Info = "Info",
}

export type NotificationConfig = {
  text: string;
  level: NotificationLevel;
};

export enum ForwardStepActionMode {
  SHOW_CARD,
  MOVE_FORWARD,
}

export interface WordBookUiState {
  searchFrameVisible: boolean;
  toggleSearchFrameVisible: Action<WordBookUiState>;

  directSearch: boolean;
  requestDirectSearch: Action<WordBookUiState>;
  clearDirectSearch: Action<WordBookUiState>;

  notificationVisible: boolean;
  notificationText: string;
  notificationLevel: NotificationLevel;
  setNotificationVisible: Action<WordBookUiState, boolean>;
  showNotification: Action<WordBookUiState, NotificationConfig>;

  editorCollapsed: boolean;
  setEditorCollapsed: Action<WordBookUiState, boolean>;

  immerseMode: boolean;
  toggleImmerseMode: Action<WordBookUiState>;

  stepperMode: ForwardStepActionMode;
  setStepperMode: Action<WordBookUiState, ForwardStepActionMode>;

  cardViewModel: WordCardViewModel;
  setCardViewModel: Action<WordBookUiState, WordCardViewModel>;
  toggleCardDefinitionVisible: Action<WordBookUiState>;

  compCardViewModel: Computed<WordBookUiState, WordCardViewModel>;

  searchModeEnabled: boolean;
  setSearchModeEnabled: Action<WordBookUiState, boolean>;
}

export interface WordEditorModel {
  fields: WordModel;
  setValues: Action<WordEditorModel, Partial<WordModel>>;
  clearValues: Action<WordEditorModel>;
}

export interface WordBookOverviewModel {
  id: string;
  name: string;
  wordCount: number;
  version: number; // data
}

export interface WordBookListModel {
  books: Array<WordBookOverviewModel>;
  setBooks: Action<WordBookListModel, Array<WordBookOverviewModel>>;
  loadBooks: Thunk<WordBookListModel>;

  templateId: string;
  setTemplateId: Action<WordBookListModel, string>;
  wordsRatio: number;
  setWordsRatio: Action<WordBookListModel, number>;
  newBookName: string;
  setNewBookName: Action<WordBookListModel, string>;
  confirmDialogVisible: boolean;
  setConfirmDialogVisible: Action<WordBookListModel, boolean>;
  handleDialogAction: Thunk<WordBookListModel, string>;
  deleteDialogVisible: boolean;
  setDeleteDialogVisible: Action<WordBookListModel, boolean>;
  handleDeleteDialogAction: Thunk<WordBookListModel, string>;

  makeNewBook: Thunk<WordBookListModel>;
  deleteBook: Thunk<WordBookListModel, string>;
}

export interface AppModel {
  wordbookList: WordBookListModel;
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
    example: "",
    translation: "",
    pronunciations: "",
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

  // const showNotification = (
  //   wordbookState: State<WordBookModel>,
  //   text: string
  // ) => {
  //   const state = wordbookState.uiState;
  //   state.notificationText = text;
  //   state.notificationVisible = true;
  // };

  const wordbookModel: WordBookModel = {
    spec: "wordbook/1",
    id: "",
    name: "",

    dirty: false,
    setDirty: action((state, flag) => {
      state.dirty = flag;
    }),

    version: 0,
    increaseVersion: action((state) => {
      state.version = new Date().getTime();
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
    setPointer: action((state, pos) => {
      state.filterStarred = false;
      setNewPointer(state, pos);
    }),
    locatePointer: thunk((actions, wordName, helper) => {
      const pos = _.findIndex(
        helper.getState()._words,
        (word) => word.name === wordName
      );
      if (pos === -1) {
        actions.uiState.showNotification({
          level: NotificationLevel.Warning,
          text: `Word "${wordName}" not found.`,
        });
      } else {
        actions.setPointer(pos);
        actions.fillEditorWithCurrentWord();
      }
    }),

    deleteCurrentWord: action((state) => {
      const cw = getCurrentWord(state);
      const wIndex = findWordIndex(state, cw!);
      state._words.splice(wIndex, 1);
      setNewPointer(state, state.pointer);
    }),
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

      const fixRemark = (remark?: string) => {
        let ret = remark ?? "";
        ret = _.trim(ret);
        if (ret.endsWith(":")) {
          ret = _.trimEnd(ret, ":");
          // ret += ".";
        }
        return ret;
      };

      // if the old word is found, just update
      if (pExist >= 0) {
        state._words[pExist].remark = fixRemark(newWord.remark);
        state._words[pExist].example = _.trim(newWord.example ?? "");
        state._words[pExist].translation = _.trim(newWord.translation ?? "");
        state._words[pExist].lastModified = new Date().getTime();
      } else {
        const nw = createWordModel();
        nw.id = nanoid();
        nw.name = newWord.name!;
        nw.remark = fixRemark(newWord.remark ?? "<missed>");
        nw.example = _.trim(newWord.example ?? "");
        nw.translation = _.trim(newWord.translation ?? "");
        nw.stars = 1;
        nw.starred = true;
        state._words.push(nw);
        setNewPointer(state);
      }
    }),
    searchWord: thunk((actions, query, helper) => {
      const wordsDoc = helper.getState()._words;
      index.add(wordsDoc); // build index
      const result = index.search(query, { limit: 10 });
      // log.info(result);
      return result;
    }),

    editor: createWordEditorModel(),
    fillEditorWithCurrentWord: action((state) => {
      if (state.currentWord) {
        state.editor.fields.name = state.currentWord.name;
        state.editor.fields.remark = state.currentWord.remark;
        state.editor.fields.example = state.currentWord.example;
        state.editor.fields.translation = state.currentWord.translation;
      }
    }),

    merge: action((state, doc) => {
      state._words = state._words.concat(doc._words!);
      setNewPointer(state, 0);
    }),
    load: action((state, doc) => {
      // check spec to determine if we can support this doc
      if (doc.spec?.startsWith("wordbook/") && doc._words) {
        // client spec upgrade
        if (doc.spec === "wordbook/1") {
          doc.id = doc.name;
          doc.spec = "wordbook/2";
        }

        if (_.includes(["wordbook/2", "wordbook/3"], doc.spec)) {
          const input = doc._words!;
          const content = _.map(input, (src: WordModel) => {
            const w = createWordModel();
            _.assign(w, src);
            // if (w.stars === undefined) {
            //   w.stars = w.starred ? 1 : 0;
            // }
            // w.remark = _.trim(w.remark);
            // w.name = _.trim(w.name);
            // if (w.createdOn === 0 || w.createdOn === undefined) {
            //   w.createdOn = new Date().getTime();
            // }
            // if (w.lastModified === 0 || w.lastModified === undefined) {
            //   w.lastModified = w.createdOn;
            // }
            return w;
          });
          doc._words = content;
          doc.spec = "wordbook/4";
        }

        if (doc.spec === "wordbook/4") {
          // it is the last spec we can handle
        } else {
          throw `unknown spec. ${doc.spec} cannot proceed.`;
        }

        // reset each field if possible
        state.id = doc.id!;
        state.spec = doc.spec;
        state.name = doc.name!;
        state._words = doc._words!;
        state.version = doc.version!;
        state.dirty = false;

        // pointer
        state.filterStarred = false;
        state.pointer = state._words.length - 1;
      } else {
        log.error("unknown document. cannot merge.");
      }
    }),

    loadDefault: thunk((actions, payload, helper) => {
      // if (helper.getState()._words.length === 0) {
      //   actions.saveWord({ name: "fluster", remark: "fluster detail example" });
      //   actions.saveWord({
      //     name: "resolute",
      //     remark: "resolute detail example",
      //   });
      //   actions.saveWord({
      //     name: "cardigan",
      //     remark: "cardigan detail example",
      //   });
      // }
    }),

    cloudDownload: thunk(async (actions, bookId, helper) => {
      const resp = await fetch(`${process.env.PUBLIC_URL}/api/books/${bookId}`);
      const respBody = await resp.json();
      if (respBody.status === "ok") {
        actions.load(respBody.data);
      }
    }),

    cloudUpload: thunk(async (actions, payload, helper) => {
      const requestDoc = helper.getState();
      const resp = await fetch(
        `${process.env.PUBLIC_URL}/api/books/${requestDoc.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestDoc),
        }
      );

      const extractBody = async (
        response: Response,
        successHandler: (body: any) => void,
        errorHandler: (error?: any) => void = () => {}
      ) => {
        if (response.ok) {
          const remote = await resp.json();
          if (remote.status === "ok") {
            successHandler(remote.body);
          } else {
            errorHandler(remote.body);
          }
        } else {
          errorHandler();
        }
      };

      await extractBody(
        resp,
        () => {
          actions.setDirty(false);
        },
        () => {
          actions.uiState.showNotification({
            level: NotificationLevel.Error,
            text: "Failed to sync with server. Try later.",
          });
        }
      );
    }),

    autoSetDirty: thunkOn(
      (actions) => [
        actions.setCurrentWordStars,
        actions.deleteCurrentWord,
        actions.saveWord,
      ],
      async (actions, target) => {
        actions.increaseVersion();
        actions.setDirty(true);
        await actions.cloudUpload();
      }
    ),

    uiState: {
      searchFrameVisible: true,
      toggleSearchFrameVisible: action((state) => {
        state.searchFrameVisible = !state.searchFrameVisible;
      }),
      notificationVisible: false,
      notificationText: "",
      notificationLevel: NotificationLevel.Info,
      setNotificationVisible: action((state, visible) => {
        state.notificationVisible = visible;
      }),
      showNotification: action((state, { text, level }) => {
        state.notificationText = text;
        state.notificationLevel = level;
        state.notificationVisible = true;
      }),

      editorCollapsed: false,
      setEditorCollapsed: action((state, collapsed) => {
        state.editorCollapsed = collapsed;
      }),
      directSearch: false,
      requestDirectSearch: action((state) => {
        state.directSearch = true;
      }),
      clearDirectSearch: action((state) => {
        state.directSearch = false;
      }),

      immerseMode: false,
      toggleImmerseMode: action((state) => {
        state.immerseMode = !state.immerseMode;
        if (state.immerseMode) {
          state.stepperMode = ForwardStepActionMode.SHOW_CARD;
        }
      }),
      stepperMode: ForwardStepActionMode.SHOW_CARD,
      setStepperMode: action((state, mode) => {
        state.stepperMode = mode;
      }),

      cardViewModel: WordCardViewModel.Full,
      setCardViewModel: action((state, cardViewModel) => {
        state.cardViewModel = cardViewModel;
      }),
      toggleCardDefinitionVisible: action((state) => {
        if (state.cardViewModel === WordCardViewModel.Full) {
          state.cardViewModel = WordCardViewModel.WordOnly;
        } else if (state.cardViewModel === WordCardViewModel.WordOnly) {
          state.cardViewModel = WordCardViewModel.Full;
        }
      }),

      compCardViewModel: computed((state) => {
        if (state.immerseMode) {
          switch (state.stepperMode) {
            case ForwardStepActionMode.SHOW_CARD:
              return state.cardViewModel;
            case ForwardStepActionMode.MOVE_FORWARD:
              return WordCardViewModel.Full;
          }
        } else {
          return state.cardViewModel;
        }
      }),

      searchModeEnabled: true,
      setSearchModeEnabled: action((state, enabled) => {
        state.searchModeEnabled = enabled;
      }),
    },
  };

  return wordbookModel;
};

interface ApiResponse {
  status: "ok" | "error";
  error: string;
  data: object;
}

const createWordBookListModel = () => {
  const model: WordBookListModel = {
    books: [],
    setBooks: action((state, payload) => {
      state.books = payload;
    }),
    loadBooks: thunk(async (actions, payload, helper) => {
      const resp = await fetch(`${process.env.PUBLIC_URL}/api/books`);
      const doc = await resp.json();
      actions.setBooks(
        (doc as ApiResponse).data as Array<WordBookOverviewModel>
      );
    }),

    templateId: "",
    setTemplateId: action((state, bookId) => {
      state.templateId = bookId;
    }),
    wordsRatio: 2,
    setWordsRatio: action((state, ratio) => {
      state.wordsRatio = ratio;
    }),
    newBookName: "",
    setNewBookName: action((state, newBookName) => {
      state.newBookName = newBookName;
    }),
    confirmDialogVisible: false,
    setConfirmDialogVisible: action((state, visible) => {
      state.confirmDialogVisible = visible;
    }),
    deleteDialogVisible: false,
    setDeleteDialogVisible: action((state, visible) => {
      state.deleteDialogVisible = visible;
    }),
    handleDeleteDialogAction: thunk(async (actions, actionKey, helper) => {
      switch (actionKey) {
        case "show":
          actions.setDeleteDialogVisible(true);
          break;
        case "yes":
          actions.setDeleteDialogVisible(false);
          await actions.deleteBook(helper.getState().templateId);
          break;
        case "no":
        case "hide":
          actions.setDeleteDialogVisible(false);
          break;
      }
    }),

    deleteBook: thunk(async (actions, bookId, helper) => {
      const resp = await fetch(
        `${process.env.PUBLIC_URL}/api/books/${bookId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const result = await resp.json();
      if (result.status === "ok") {
        await actions.loadBooks();
      }
    }),

    handleDialogAction: thunk(async (actions, actionKey, helper) => {
      switch (actionKey) {
        case "show":
          actions.setConfirmDialogVisible(true);
          break;
        case "yes":
          actions.setConfirmDialogVisible(false);
          await actions.makeNewBook();
          break;
        case "no":
        case "hide":
          actions.setConfirmDialogVisible(false);
          break;
      }
    }),

    makeNewBook: thunk(async (actions, payload, helper) => {
      let requestDoc = (({ templateId, wordsRatio, newBookName }) => ({
        templateId,
        name: newBookName,
        wordsRatio: wordsRatio * 10,
      }))(helper.getState());

      const resp = await fetch(`${process.env.PUBLIC_URL}/api/books`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestDoc),
      });
      const result = await resp.json();
      if (result.status === "ok") {
        await actions.loadBooks();
      }
    }),
  };
  return model;
};

const createAppModel = () => {
  const appModel: AppModel = {
    wordbookList: createWordBookListModel(),
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
export const useStore = typedHooks.useStore;

export default createAppModel();

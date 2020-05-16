import { nanoid } from 'nanoid'
import _ from 'lodash';

import { action, computed, createTypedHooks, Thunk, thunk, State } from 'easy-peasy';
import { Action, Computed } from 'easy-peasy';

import log from 'loglevel';
log.setDefaultLevel('debug');

// *** Model
export interface WordModel {
  id: string,
  name: string,
  starred: boolean,
  type: string[],
  bookmarked: boolean,
  remark: string,
  createdOn: number,
};

export interface WordBookModel {
  _words: Array<WordModel>,

  filterStarred: boolean,
  toggleFilterStarred: Action<WordBookModel>,
  currentWords: Computed<WordBookModel, Array<WordModel>>,
  currentWordSize: Computed<WordBookModel, number>,

  pointer: number,
  offsetPointer: Action<WordBookModel, number>,

  currentWord: Computed<WordBookModel, WordModel | null>,
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

export interface WordEditorModel {
  fields: WordModel,
  setValues: Action<WordEditorModel, Partial<WordModel>>,
  clearValues: Action<WordEditorModel>,
}

export interface AppModel {
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
const createWordEditorModel = () => {
  const model: WordEditorModel = {
    fields: createWordModel(),
    setValues: action((state, payload) => {
      _.assign(state.fields, payload);
    }),
    clearValues: action((state) => {
      _.assign(state.fields, createWordModel());
    })
  };
  return model;
};

const createWordBookModel = () => {
  // const findWordIndex = (state: State<WordBookModel>, word: WordModel) => {
  //   return _.findIndex(state._words, item => item.id === word.id);
  // };
  const getFilteredWords = (state: State<WordBookModel>) => {
    if (state.filterStarred) {
      return _.filter(state._words, w => w.starred);
    } else {
      return state._words;
    }
  }
  const setNewPointer = (state: State<WordBookModel>, p?: number) => {
    const filterWordSize = getFilteredWords(state).length;
    state.pointer = Math.max(Math.min(p === undefined ? 1e8 : p, filterWordSize - 1), 0);
  }
  const getCurrentWord = (state: State<WordBookModel>) => {
    if (state.pointer >= 0) {
      return getFilteredWords(state)[state.pointer];
    } else {
      return null;
    }
  }

  const wordbookModel: WordBookModel = {
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
      // const p = findWordIndex(state, state.currentWord);
      // state._words.splice(p, 1);
      // state.pointer = Math.max(Math.min(p, state.currentWordSize - 1), 0);
    }),
    toggleCurrentWordStarred: action((state) => {
      const word = getCurrentWord(state);
      if (word) {
        word.starred = !word.starred;
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
      if (pExist >= 0) {
        state.pointer = pExist;
        if (newWord.remark) {
          state._words[pExist].remark = newWord.remark;
        }
      } else {
        state._words.push({
          id: nanoid(),
          name: newWord.name || '',
          starred: false,
          bookmarked: false,
          type: [],
          remark: newWord.remark || '',
          createdOn: Date.now(),
        });
        setNewPointer(state);
        // log.info('save-word, state.pointer', state.pointer, state.currentWord, state.currentWordSize);
      }
    }),

    remarkVisible: true,
    toggleRemarkVisible: action((state) => {
      state.remarkVisible = !state.remarkVisible;
    }),

    searchFrameVisible: true,
    toggleSearchFrameVisible: action((state) => {
      state.searchFrameVisible = !state.searchFrameVisible;
    }),

    editor: createWordEditorModel(),

    fillEditorWithCurrentWord: action((state) => {
      if (state.currentWord) {
        state.editor.fields.name = state.currentWord.name;
        state.editor.fields.remark = state.currentWord.remark;
      }
    }),

    load: action((state, doc) => {
      state._words = doc._words || (doc as any).words || [];
      state.pointer = 0;
    }),
    loadDefault: thunk((actions, payload, helper) => {
      if (helper.getState()._words.length === 0) {
        actions.saveWord({ name: 'fluster', remark: 'fluster detail example' });
        actions.saveWord({ name: 'resolute', remark: 'resolute detail example' });
        actions.saveWord({ name: 'cardigan', remark: 'cardigan detail example' });
      }
    }),
  };
  return wordbookModel;
}

const createAppModel = () => {
  const appModel: AppModel = {
    wordbook: createWordBookModel()
  };
  return appModel;
}

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

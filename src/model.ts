import { nanoid } from 'nanoid'
import _ from 'lodash';

import { action, computed, createTypedHooks, Thunk, thunk } from 'easy-peasy';
import { Action, Computed } from 'easy-peasy';

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
  words: Array<WordModel>,

  filterStarred: boolean,
  toggleFilterStarred: Action<WordBookModel>,
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

const createAppModel = () => {
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
      toggleRemarkVisible: action((state) => {
        state.remarkVisible = !state.remarkVisible;
      }),

      searchFrameVisible: true,
      toggleSearchFrameVisible: action((state) => {
        state.searchFrameVisible = !state.searchFrameVisible;
      }),

      filterStarred: false,
      toggleFilterStarred: action((state) => {
        state.filterStarred = !state.filterStarred;
      }),

      editor: createWordEditorModel(),

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

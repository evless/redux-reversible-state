## Redux Reversible State

This is a wrapper for redux to get [undo-redo](https://redux.js.org/recipes/implementing-undo-history) functionality. This module save part of state.

## Usage

`undoRedo` saves only changes which you point in singleAction. You should use `createActionWather` for creating singleAction. If you want to save some changes in one part you should use groupAction. Group has name and you should use start/end actions with groupName to group will understand when her needs to start and stop.

```ts
import { combineReducers, createActionWatcher } from 'redux';
import { undoRedo } from 'redux-reversible-state'

const undo = createAction('UNDO');
const redo = createAction('REDO');
const cleanHistory = createAction('CLEAN_HISTORY');
const startGroup = createAction('START_GROUP');
const endGroup = createAction('END_GROUP');
const changeFruits = createAction('CHANGE_FRUITS');
const changeWorkers = createAction('CHANGE_WORKERS');
const changeFlag = createAction('CHANGE_FLAG');

const combinedReducers = combineReducers({
    warehouse: warehouseReducer,
    flags: flagsReducer,
    office: officeReducer,
});

export const rootReducer = undoRedo(combinedReducers, {
    undoType: undo.type,
    redoType: redo.type,
    cleanHistoryType: cleanHistory.type,
    startGroupType: startGroup.type,
    endGroupType: endGroup.type,
    singleAction: [],
    groupAction: [
        {
            groupName: 'saveWorkersAndFruits',
            actions: [
                createActionWatcher(combinedReducers, changeWorkers.type, ['office', 'workers']),
                createActionWatcher(combinedReducers, changeFruits.type, ['warehouse', 'fruits']),
            ],
        },
    ],
});
```

Example for using `groupAction`. Here we will save part of state only for `changeWorkers` and `changeFruits`:
```ts
dispatch(startGroupType('saveWorkersAndFruits'))
dispatch(changeWorkers([{ name: 'John', age: 25 }]))
dispatch(changeFruits([{ name: 'apple', count: 3 }]))
dispatch(changeFlag([{ name: 'apple', count: 3 }]))
dispatch(endGroupType('saveWorkersAndFruits'))
```

## API

Options for configuration:

```ts
type SingleAction = {
    actionName: string;
    path: ReadonlyArray<string | number | symbol>;
};

type Group = {
    groupName: string;
    actions: ReadonlyArray<SingleAction>;
};

type Options = {
    undoType: string;
    redoType: string;
    cleanHistoryType: string;
    startGroupType: string;
    endGroupType: string;
    singleAction: ReadonlyArray<SingleAction>;
    groupAction: ReadonlyArray<Group>;
};
```
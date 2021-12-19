import { combineReducers } from 'redux';
import { setAutoFreeze } from 'immer';

import { createAction, createReducer } from '@reduxjs/toolkit';

import { TestReducer } from './helpers';

import { createActionWatcher, undoRedo } from '../src';

setAutoFreeze(false);

type Action<T> = { type: string; payload: T }
type Items = ReadonlyArray<{ name: string; count: number }>;
type Workers = ReadonlyArray<{ name: string; age: number }>;
type Warehouse = { fruits: Items; vegetables: Items };
type Flags = { isDay: boolean; isWorking: boolean };
type Office = { workers: Workers };

const changeFruits = createAction<Items>('CHANGE_FRUITS');
const changeVegetables = createAction<Items>('CHANGE_VEGETABLES');
const changeFlag = createAction<Partial<Flags>>('CHANGE_FLAG');
const changeWorkers = createAction<Workers>('CHANGE_WORKERS');
const undo = createAction('UNDO');
const redo = createAction('REDO');
const cleanHistory = createAction('CLEAN_HISTORY');
const startGroup = createAction<string>('START_GROUP');
const endGroup = createAction<string>('END_GROUP');

const changeItemsHandler =
    (type: 'fruits' | 'vegetables') =>
    (state: Warehouse, action: Action<Items>): Warehouse => ({
        ...state,
        [type]: action.payload,
    });

const warehouseInitialState: Warehouse = { fruits: [], vegetables: [] };

const warehouseReducer = createReducer(warehouseInitialState, (builder) =>
    builder
        .addCase(changeFruits, changeItemsHandler('fruits'))
        .addCase(changeVegetables, changeItemsHandler('vegetables')),
);

const changeFlagHandler = (state: Flags, action: Action<Partial<Flags>>): Flags => ({
    ...state,
    ...action.payload,
});

const flagsInitialState: Flags = { isDay: false, isWorking: false };
const flagsReducer = createReducer(flagsInitialState, (builder) => builder.addCase(changeFlag, changeFlagHandler));

const changeWorkersHandler = (state: Office, action: Action<Workers>): Office => ({
    ...state,
    workers: action.payload,
});

const officeInitialState: Office = { workers: [] };
const officeReducer = createReducer(officeInitialState, (builder) =>
    builder.addCase(changeWorkers, changeWorkersHandler),
);

const combinedReducers = combineReducers({
    warehouse: warehouseReducer,
    flags: flagsReducer,
    office: officeReducer,
});

const undoRedoOptions = {
    undoType: undo.type,
    redoType: redo.type,
    cleanHistoryType: cleanHistory.type,
    startGroupType: startGroup.type,
    endGroupType: endGroup.type,
};

describe('undoRedo', () => {
    it('should work in normal mode without saving data', () => {
        const rootReducer = undoRedo(combinedReducers, {
            ...undoRedoOptions,
            singleAction: [],
            groupAction: [],
        });

        new TestReducer(rootReducer, {
            past: [],
            present: {
                warehouse: warehouseInitialState,
                flags: flagsInitialState,
                office: officeInitialState,
            },
            future: [],
        })
            .put(
                changeFruits([
                    {
                        name: 'apple',
                        count: 3,
                    },
                ]),
            )
            .put(
                changeWorkers([
                    {
                        name: 'John',
                        age: 25,
                    },
                ]),
            )
            .put(
                changeFlag({
                    isWorking: true,
                }),
            )
            .expectState((state) => state.present.warehouse.fruits.length, 1)
            .expectState((state) => state.present.warehouse.fruits[0].name, 'apple')
            .expectState((state) => state.present.office.workers.length, 1)
            .expectState((state) => state.present.office.workers[0].name, 'John')
            .expectState((state) => state.present.flags.isWorking, true)
            .expectState((state) => state.past.length, 0)
            .expectState((state) => state.future.length, 0);
    });

    it('should save only workers', () => {
        const rootReducer = undoRedo(combinedReducers, {
            ...undoRedoOptions,
            singleAction: [createActionWatcher(combinedReducers, changeWorkers.type, ['office', 'workers'])],
            groupAction: [],
        });

        new TestReducer(rootReducer, {
            past: [],
            present: {
                warehouse: warehouseInitialState,
                flags: flagsInitialState,
                office: officeInitialState,
            },
            future: [],
        })
            .put(
                changeFruits([
                    {
                        name: 'apple',
                        count: 3,
                    },
                ]),
            )
            .put(
                changeWorkers([
                    {
                        name: 'John',
                        age: 25,
                    },
                ]),
            )
            .put(
                changeFlag({
                    isWorking: true,
                }),
            )
            .expectState((state) => state.present.warehouse.fruits.length, 1)
            .expectState((state) => state.present.warehouse.fruits[0].name, 'apple')
            .expectState((state) => state.present.office.workers.length, 1)
            .expectState((state) => state.present.office.workers[0].name, 'John')
            .expectState((state) => state.present.flags.isWorking, true)
            .expectState((state) => state.past.length, 1)
            .expectState((state) => state.past[0], {
                name: 'CHANGE_WORKERS',
                type: 'single',
                changes: [
                    {
                        path: ['office', 'workers'],
                        value: [],
                    },
                ],
            })
            .expectState((state) => state.future.length, 0);
    });

    it('should save workers and fruits', () => {
        const rootReducer = undoRedo(combinedReducers, {
            ...undoRedoOptions,
            singleAction: [
                createActionWatcher(combinedReducers, changeWorkers.type, ['office', 'workers']),
                createActionWatcher(combinedReducers, changeFruits.type, ['warehouse', 'fruits']),
            ],
            groupAction: [],
        });

        new TestReducer(rootReducer, {
            past: [],
            present: {
                warehouse: warehouseInitialState,
                flags: flagsInitialState,
                office: officeInitialState,
            },
            future: [],
        })
            .put(
                changeFruits([
                    {
                        name: 'apple',
                        count: 3,
                    },
                ]),
            )
            .put(
                changeWorkers([
                    {
                        name: 'John',
                        age: 25,
                    },
                ]),
            )
            .put(
                changeFlag({
                    isWorking: true,
                }),
            )
            .expectState((state) => state.present.warehouse.fruits.length, 1)
            .expectState((state) => state.present.warehouse.fruits[0].name, 'apple')
            .expectState((state) => state.present.office.workers.length, 1)
            .expectState((state) => state.present.office.workers[0].name, 'John')
            .expectState((state) => state.present.flags.isWorking, true)
            .expectState((state) => state.past.length, 2)
            .expectState((state) => state.past[0], {
                name: 'CHANGE_FRUITS',
                type: 'single',
                changes: [
                    {
                        path: ['warehouse', 'fruits'],
                        value: [],
                    },
                ],
            })
            .expectState((state) => state.past[1], {
                name: 'CHANGE_WORKERS',
                type: 'single',
                changes: [
                    {
                        path: ['office', 'workers'],
                        value: [],
                    },
                ],
            })
            .expectState((state) => state.future.length, 0);
    });

    it('should save only group actions composed of workers and fruits', () => {
        const rootReducer = undoRedo(combinedReducers, {
            ...undoRedoOptions,
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

        new TestReducer(rootReducer, {
            past: [],
            present: {
                warehouse: warehouseInitialState,
                flags: flagsInitialState,
                office: officeInitialState,
            },
            future: [],
        })
            .put(
                changeFruits([
                    {
                        name: 'apple',
                        count: 3,
                    },
                ]),
            )
            .put(
                changeWorkers([
                    {
                        name: 'John',
                        age: 25,
                    },
                ]),
            )
            .put(
                changeFlag({
                    isWorking: true,
                }),
            )
            .expectState((state) => state.present.warehouse.fruits.length, 1)
            .expectState((state) => state.present.warehouse.fruits[0].name, 'apple')
            .expectState((state) => state.present.office.workers.length, 1)
            .expectState((state) => state.present.office.workers[0].name, 'John')
            .expectState((state) => state.present.flags.isWorking, true)
            .expectState((state) => state.past.length, 0)
            .expectState((state) => state.future.length, 0)
            .put(startGroup('saveWorkersAndFruits'))
            .put(
                changeFruits([
                    {
                        name: 'orange',
                        count: 1,
                    },
                ]),
            )
            .put(
                changeVegetables([
                    {
                        name: 'cucumber',
                        count: 10,
                    },
                ]),
            )
            .put(
                changeFlag({
                    isWorking: false,
                }),
            )
            .put(endGroup('otherGroupName'))
            .put(
                changeWorkers([
                    {
                        name: 'John',
                        age: 25,
                    },
                    {
                        name: 'Steven',
                        age: 33,
                    },
                ]),
            )
            .put(endGroup('saveWorkersAndFruits'))
            .expectState((state) => state.present.warehouse.fruits.length, 1)
            .expectState((state) => state.present.warehouse.vegetables.length, 1)
            .expectState((state) => state.present.office.workers.length, 2)
            .expectState((state) => state.present.flags.isWorking, false)
            .expectState((state) => state.past.length, 1)
            .expectState((state) => state.past[0], {
                name: 'saveWorkersAndFruits',
                type: 'group',
                changes: [
                    {
                        path: ['warehouse', 'fruits'],
                        value: [
                            {
                                name: 'apple',
                                count: 3,
                            },
                        ],
                    },
                    {
                        path: ['office', 'workers'],
                        value: [
                            {
                                name: 'John',
                                age: 25,
                            },
                        ],
                    },
                ],
            })
            .expectState((state) => state.future.length, 0);
    });

    it('should save only group actions composed of workers and fruits when group was started', () => {
        const rootReducer = undoRedo(combinedReducers, {
            ...undoRedoOptions,
            singleAction: [
                createActionWatcher(combinedReducers, changeWorkers.type, ['office', 'workers']),
                createActionWatcher(combinedReducers, changeFruits.type, ['warehouse', 'fruits']),
                createActionWatcher(combinedReducers, changeVegetables.type, ['warehouse', 'vegetables']),
            ],
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

        new TestReducer(rootReducer, {
            past: [],
            present: {
                warehouse: warehouseInitialState,
                flags: flagsInitialState,
                office: officeInitialState,
            },
            future: [],
        })
            .put(startGroup('saveWorkersAndFruits'))
            .put(
                changeFruits([
                    {
                        name: 'orange',
                        count: 1,
                    },
                ]),
            )
            .put(
                changeVegetables([
                    {
                        name: 'cucumber',
                        count: 10,
                    },
                ]),
            )
            .put(
                changeFlag({
                    isWorking: false,
                }),
            )
            .put(endGroup('otherGroupName'))
            .put(
                changeWorkers([
                    {
                        name: 'John',
                        age: 25,
                    },
                    {
                        name: 'Steven',
                        age: 33,
                    },
                ]),
            )
            .put(endGroup('saveWorkersAndFruits'))
            .expectState((state) => state.present.warehouse.fruits.length, 1)
            .expectState((state) => state.present.warehouse.vegetables.length, 1)
            .expectState((state) => state.present.office.workers.length, 2)
            .expectState((state) => state.present.flags.isWorking, false)
            .expectState((state) => state.past.length, 1)
            .expectState((state) => state.past[0], {
                name: 'saveWorkersAndFruits',
                type: 'group',
                changes: [
                    {
                        path: ['warehouse', 'fruits'],
                        value: [],
                    },
                    {
                        path: ['office', 'workers'],
                        value: [],
                    },
                ],
            })
            .expectState((state) => state.future.length, 0);
    });

    it('should undo and redo changes', () => {
        const rootReducer = undoRedo(combinedReducers, {
            ...undoRedoOptions,
            singleAction: [
                createActionWatcher(combinedReducers, changeWorkers.type, ['office', 'workers']),
                createActionWatcher(combinedReducers, changeFruits.type, ['warehouse', 'fruits']),
            ],
            groupAction: [],
        });

        new TestReducer(rootReducer, {
            past: [],
            present: {
                warehouse: warehouseInitialState,
                flags: flagsInitialState,
                office: officeInitialState,
            },
            future: [],
        })
            .put(
                changeFruits([
                    {
                        name: 'apple',
                        count: 3,
                    },
                ]),
            )
            .put(
                changeWorkers([
                    {
                        name: 'John',
                        age: 25,
                    },
                ]),
            )
            .put(
                changeFlag({
                    isWorking: true,
                }),
            )
            .expectState((state) => state.present.warehouse.fruits.length, 1)
            .expectState((state) => state.present.warehouse.fruits[0].name, 'apple')
            .expectState((state) => state.present.office.workers.length, 1)
            .expectState((state) => state.present.office.workers[0].name, 'John')
            .expectState((state) => state.present.flags.isWorking, true)
            .expectState((state) => state.past.length, 2)
            .expectState((state) => state.past[0], {
                name: 'CHANGE_FRUITS',
                type: 'single',
                changes: [
                    {
                        path: ['warehouse', 'fruits'],
                        value: [],
                    },
                ],
            })
            .expectState((state) => state.past[1], {
                name: 'CHANGE_WORKERS',
                type: 'single',
                changes: [
                    {
                        path: ['office', 'workers'],
                        value: [],
                    },
                ],
            })
            .expectState((state) => state.future.length, 0)
            // first undo time
            .put(undo())
            .expectState((state) => state.present.warehouse.fruits.length, 1)
            .expectState((state) => state.present.office.workers.length, 0)
            .expectState((state) => state.present.flags.isWorking, true)
            .expectState((state) => state.past.length, 1)
            .expectState((state) => state.past[0], {
                name: 'CHANGE_FRUITS',
                type: 'single',
                changes: [
                    {
                        path: ['warehouse', 'fruits'],
                        value: [],
                    },
                ],
            })
            .expectState((state) => state.future.length, 1)
            .expectState((state) => state.future[0], {
                name: 'CHANGE_WORKERS',
                type: 'single',
                changes: [
                    {
                        path: ['office', 'workers'],
                        value: [
                            {
                                name: 'John',
                                age: 25,
                            },
                        ],
                    },
                ],
            })
            // second undo time
            .put(undo())
            .expectState((state) => state.present.warehouse.fruits.length, 0)
            .expectState((state) => state.present.office.workers.length, 0)
            .expectState((state) => state.present.flags.isWorking, true)
            .expectState((state) => state.past.length, 0)
            .expectState((state) => state.future.length, 2)
            .expectState((state) => state.future[0], {
                name: 'CHANGE_FRUITS',
                type: 'single',
                changes: [
                    {
                        path: ['warehouse', 'fruits'],
                        value: [
                            {
                                name: 'apple',
                                count: 3,
                            },
                        ],
                    },
                ],
            })
            .expectState((state) => state.future[1], {
                name: 'CHANGE_WORKERS',
                type: 'single',
                changes: [
                    {
                        path: ['office', 'workers'],
                        value: [
                            {
                                name: 'John',
                                age: 25,
                            },
                        ],
                    },
                ],
            })
            // first redo time
            .put(redo())
            .expectState((state) => state.present.warehouse.fruits.length, 1)
            .expectState((state) => state.present.office.workers.length, 0)
            .expectState((state) => state.present.flags.isWorking, true)
            .expectState((state) => state.past.length, 1)
            .expectState((state) => state.past[0], {
                name: 'CHANGE_FRUITS',
                type: 'single',
                changes: [
                    {
                        path: ['warehouse', 'fruits'],
                        value: [],
                    },
                ],
            })
            .expectState((state) => state.future.length, 1)
            .expectState((state) => state.future[0], {
                name: 'CHANGE_WORKERS',
                type: 'single',
                changes: [
                    {
                        path: ['office', 'workers'],
                        value: [
                            {
                                name: 'John',
                                age: 25,
                            },
                        ],
                    },
                ],
            })
            // second redo time
            .put(redo())
            .expectState((state) => state.present.warehouse.fruits.length, 1)
            .expectState((state) => state.present.warehouse.fruits[0].name, 'apple')
            .expectState((state) => state.present.office.workers.length, 1)
            .expectState((state) => state.present.office.workers[0].name, 'John')
            .expectState((state) => state.present.flags.isWorking, true)
            .expectState((state) => state.past.length, 2)
            .expectState((state) => state.past[0], {
                name: 'CHANGE_FRUITS',
                type: 'single',
                changes: [
                    {
                        path: ['warehouse', 'fruits'],
                        value: [],
                    },
                ],
            })
            .expectState((state) => state.past[1], {
                name: 'CHANGE_WORKERS',
                type: 'single',
                changes: [
                    {
                        path: ['office', 'workers'],
                        value: [],
                    },
                ],
            });
    });

    it('should undo and redo for group changes', () => {
        const groupName = 'WAREHOUSE_CHANGE_GROUP';
        const rootReducer = undoRedo(combinedReducers, {
            ...undoRedoOptions,
            singleAction: [],
            groupAction: [
                {
                    groupName,
                    actions: [
                        createActionWatcher(combinedReducers, changeFruits.type, ['warehouse', 'fruits']),
                        createActionWatcher(combinedReducers, changeVegetables.type, ['warehouse', 'vegetables']),
                    ],
                },
            ],
        });

        new TestReducer(rootReducer, {
            past: [],
            present: {
                warehouse: warehouseInitialState,
                flags: flagsInitialState,
                office: officeInitialState,
            },
            future: [],
        })
            .put(startGroup(groupName))
            .put(
                changeFruits([
                    {
                        name: 'apple',
                        count: 1,
                    },
                ]),
            )
            .put(
                changeFruits([
                    {
                        name: 'orange',
                        count: 2,
                    },
                ]),
            )
            .put(endGroup(groupName))
            .expectState((state) => state.present.warehouse.fruits.length, 1)
            .expectState((state) => state.present.warehouse.fruits[0].name, 'orange')
            .expectState((state) => state.past.length, 1)
            .expectState((state) => state.past[0], {
                name: groupName,
                type: 'group',
                changes: [
                    {
                        path: ['warehouse', 'fruits'],
                        value: [],
                    },
                ],
            })
            .expectState((state) => state.future.length, 0)
            // first undo time
            .put(undo())
            .expectState((state) => state.present.warehouse.fruits.length, 0)
            .expectState((state) => state.past.length, 0)
            .expectState((state) => state.future.length, 1)
            .expectState((state) => state.future[0], {
                name: groupName,
                type: 'group',
                changes: [
                    {
                        path: ['warehouse', 'fruits'],
                        value: [
                            {
                                name: 'orange',
                                count: 2,
                            },
                        ],
                    },
                ],
            })
            // // first redo time
            .put(redo())
            .expectState((state) => state.present.warehouse.fruits.length, 1)
            .expectState((state) => state.present.warehouse.fruits[0].name, 'orange')
            .expectState((state) => state.past.length, 1)
            .expectState((state) => state.past[0], {
                name: groupName,
                type: 'group',
                changes: [
                    {
                        path: ['warehouse', 'fruits'],
                        value: [],
                    },
                ],
            })
            .expectState((state) => state.future.length, 0);
    });

    it('should clean future changes after new single change', () => {
        const rootReducer = undoRedo(combinedReducers, {
            ...undoRedoOptions,
            singleAction: [
                createActionWatcher(combinedReducers, changeWorkers.type, ['office', 'workers']),
                createActionWatcher(combinedReducers, changeFruits.type, ['warehouse', 'fruits']),
            ],
            groupAction: [],
        });

        new TestReducer(rootReducer, {
            past: [],
            present: {
                warehouse: warehouseInitialState,
                flags: flagsInitialState,
                office: officeInitialState,
            },
            future: [
                {
                    name: 'CHANGE_WORKERS',
                    type: 'single',
                    changes: [
                        {
                            path: ['office', 'workers'],
                            value: [
                                {
                                    name: 'Steven',
                                    age: 33,
                                },
                            ],
                        },
                    ],
                },
            ],
        })
            .put(
                changeFruits([
                    {
                        name: 'apple',
                        count: 3,
                    },
                ]),
            )
            .put(
                changeWorkers([
                    {
                        name: 'John',
                        age: 25,
                    },
                ]),
            )
            .put(
                changeFlag({
                    isWorking: true,
                }),
            )
            .expectState((state) => state.present.warehouse.fruits.length, 1)
            .expectState((state) => state.present.warehouse.fruits[0].name, 'apple')
            .expectState((state) => state.present.office.workers.length, 1)
            .expectState((state) => state.present.office.workers[0].name, 'John')
            .expectState((state) => state.present.flags.isWorking, true)
            .expectState((state) => state.past.length, 2)
            .expectState((state) => state.future.length, 0);
    });

    it('should clean future changes after new group changes', () => {
        const groupName = 'WAREHOUSE_CHANGE_GROUP';
        const rootReducer = undoRedo(combinedReducers, {
            ...undoRedoOptions,
            singleAction: [],
            groupAction: [
                {
                    groupName,
                    actions: [
                        createActionWatcher(combinedReducers, changeFruits.type, ['warehouse', 'fruits']),
                        createActionWatcher(combinedReducers, changeVegetables.type, ['warehouse', 'vegetables']),
                    ],
                },
            ],
        });

        new TestReducer(rootReducer, {
            past: [],
            present: {
                warehouse: warehouseInitialState,
                flags: flagsInitialState,
                office: officeInitialState,
            },
            future: [
                {
                    name: 'CHANGE_WORKERS',
                    type: 'single',
                    changes: [
                        {
                            path: ['office', 'workers'],
                            value: [
                                {
                                    name: 'Steven',
                                    age: 33,
                                },
                            ],
                        },
                    ],
                },
            ],
        })
            .put(startGroup(groupName))
            .put(
                changeFruits([
                    {
                        name: 'apple',
                        count: 1,
                    },
                ]),
            )
            .put(
                changeVegetables([
                    {
                        name: 'cucumber',
                        count: 2,
                    },
                ]),
            )
            .put(endGroup(groupName))
            .expectState((state) => state.present.warehouse.fruits.length, 1)
            .expectState((state) => state.present.warehouse.fruits[0].name, 'apple')
            .expectState((state) => state.present.warehouse.vegetables.length, 1)
            .expectState((state) => state.present.warehouse.vegetables[0].name, 'cucumber')
            .expectState((state) => state.past.length, 1)
            .expectState((state) => state.future.length, 0);
    });

    it('should clean history', () => {
        const rootReducer = undoRedo(combinedReducers, {
            ...undoRedoOptions,
            singleAction: [
                createActionWatcher(combinedReducers, changeWorkers.type, ['office', 'workers']),
                createActionWatcher(combinedReducers, changeFruits.type, ['warehouse', 'fruits']),
            ],
            groupAction: [],
        });

        new TestReducer(rootReducer, {
            past: [
                {
                    name: 'CHANGE_FRUITS',
                    type: 'single',
                    changes: [
                        {
                            path: ['warehouse', 'fruits'],
                            value: [
                                {
                                    name: 'apple',
                                    count: 3,
                                },
                            ],
                        },
                    ],
                },
                {
                    name: 'CHANGE_WORKERS',
                    type: 'single',
                    changes: [
                        {
                            path: ['office', 'workers'],
                            value: [
                                {
                                    name: 'John',
                                    age: 25,
                                },
                            ],
                        },
                    ],
                },
            ],
            present: {
                warehouse: warehouseInitialState,
                flags: flagsInitialState,
                office: officeInitialState,
            },
            future: [
                {
                    name: 'CHANGE_WORKERS',
                    type: 'single',
                    changes: [
                        {
                            path: ['office', 'workers'],
                            value: [
                                {
                                    name: 'Steven',
                                    age: 33,
                                },
                            ],
                        },
                    ],
                },
            ],
        })
            .put(cleanHistory())
            .expectState((state) => state.past.length, 0)
            .expectState((state) => state.future.length, 0);
    });
});
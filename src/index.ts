import { get, set, reverse } from 'lodash';

import { Action, AnyAction, Reducer } from 'redux';

type SingleKey<State, StateKey extends keyof State = keyof State> = readonly [StateKey];

type DoubleKey<
    State,
    StateKey extends keyof State = keyof State,
    SecondStateKey extends keyof State[StateKey] = keyof State[StateKey]
> = readonly [StateKey, SecondStateKey];

type TripleKey<
    State,
    StateKey extends keyof State = keyof State,
    SecondStateKey extends keyof State[StateKey] = keyof State[StateKey],
    ThirdStateKey extends keyof State[StateKey][SecondStateKey] = keyof State[StateKey][SecondStateKey]
> = readonly [StateKey, SecondStateKey, ThirdStateKey];

type Path<T, K extends keyof T, K2 extends keyof T[K], K3 extends keyof T[K][K2]> =
    | SingleKey<T, K>
    | DoubleKey<T, K, K2>
    | TripleKey<T, K, K2, K3>;

type Change = {
    path: ReadonlyArray<string | number | symbol>;
    value: any;
};

type Section = {
    name: string;
    type: 'single' | 'group';
    changes: ReadonlyArray<Change>;
};

export type StateWithHistory<T> = {
    past: ReadonlyArray<Section>;
    present: T;
    future: ReadonlyArray<Section>;
};

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

type UndoRedoAction = Action & {
    payload?: string;
};

/**
 * You should use to check correct path to store.
 * Maximum deep = 3.
 *
 *
 * Example:
 *
 * store:
 * warehouse: {
 *  fruits: []
 * }
 *
 * It will be without error:
 * createActionWatcher(reducers, actionType, ['warehouse', 'fruits'])
 *
 * Typescript will say that path incorrect:
 * createActionWatcher(reducers, actionType, ['warehouse', 'vegetables'])
 */
export const createActionWatcher = <
    State extends Record<string, any>,
    StateKey extends keyof State = keyof State,
    SecondStateKey extends keyof State[StateKey] = keyof State[StateKey],
    ThirdStateKey extends keyof State[StateKey][SecondStateKey] = keyof State[StateKey][SecondStateKey]
>(
    _state: Reducer<State>,
    actionName: string,
    path: Path<State, StateKey, SecondStateKey, ThirdStateKey>,
): SingleAction => ({
    actionName,
    path,
});

const isDefined = <T>(p: T): p is Exclude<T, undefined> => p !== undefined

/**
 * It's reducers wrapper for undo/redo possibility.
 *
 * Common idea: https://redux.js.org/recipes/implementing-undo-history
 *
 * We have a lot of changes/sagas and big data so we cannot save whole state every time.
 * `undoRedo` saves only changes which you point in singleAction. You should use `createActionWather` for creating singleAction.
 * If you want to save some changes in one part you should use groupAction. Group has name and you should use start/end actions with groupName to
 * group will understand when her needs to start and stop.
 *
 * **IMPORTANT**:
 * For group: If you use recursions actions, it will not be work, because for every group you get different changes.
 * If you want to group changes you should do it in one group in one time.
 *
 * Examples: You can see examples in `undoRedo.test.ts` file.
 *
 */
export const undoRedo = <State extends Record<string, any>, A extends UndoRedoAction = AnyAction>(
    reducer: Reducer<State, A>,
    options: Options,
): Reducer<StateWithHistory<State>, A> => {
    const singleActionNames = options.singleAction.map((item) => item.actionName);
    let activeGroupName: string | undefined;
    let activeGroupActions: ReadonlyArray<SingleAction> = [];
    let activeGroupActionNames: readonly string[] = [];
    let mutableSummaryPastChanges: ReadonlyArray<Change> = [];

    return (state, action, ...rest) => {
        if (!state) {
            const present = reducer(undefined, action, ...rest);

            return {
                past: [],
                present,
                future: [],
            };
        }

        const present = reducer(state.present, action, ...rest);

        if (
            action.type === options.startGroupType &&
            action.payload &&
            !activeGroupActionNames.length &&
            !isDefined(activeGroupName)
        ) {
            const group = options.groupAction.find((item) => item.groupName === action.payload);

            if (!group) {
                return {
                    ...state,
                    present,
                };
            }

            activeGroupName = action.payload;
            activeGroupActions = group.actions;
            activeGroupActionNames = group.actions.map((item) => item.actionName);
        }

        if (action.type === options.endGroupType && activeGroupName === action.payload && isDefined(activeGroupName)) {
            const past = [
                ...state.past,
                { name: activeGroupName, type: 'group', changes: mutableSummaryPastChanges },
            ] as const;

            activeGroupName = undefined;
            activeGroupActions = [];
            activeGroupActionNames = [];
            mutableSummaryPastChanges = [];

            return {
                ...state,
                present,
                past,
                future: [],
            };
        }

        if (activeGroupActionNames.includes(action.type)) {
            const singleActions = activeGroupActions.filter((item) => item.actionName === action.type);

            if (singleActions.length) {
                const previosChangesPath = mutableSummaryPastChanges.map((item) => item.path);

                mutableSummaryPastChanges = [
                    ...mutableSummaryPastChanges,
                    ...singleActions
                        .map((singleAction) =>
                            previosChangesPath.includes(singleAction.path)
                                ? undefined
                                : {
                                      path: singleAction.path,
                                      value: get(state.present, singleAction.path),
                                  },
                        )
                        .filter(isDefined),
                ];
            }

            return {
                ...state,
                present,
            };
        }

        if (singleActionNames.includes(action.type) && !isDefined(activeGroupName)) {
            const singleActions = options.singleAction.filter((item) => item.actionName === action.type);

            if (!singleActions.length) {
                return {
                    ...state,
                    present,
                };
            }

            return {
                present,
                past: [
                    ...state.past,
                    ...singleActions.map((singleAction) => ({
                        name: action.type,
                        type: 'single' as const,
                        changes: [
                            {
                                path: singleAction.path,
                                value: get(state.present, singleAction.path),
                            },
                        ],
                    })),
                ],
                future: [],
            };
        }

        if (action.type === options.undoType && state.past.length) {
            const past = state.past.slice(0, -1);
            const previosSection = state.past[state.past.length - 1];
            const futureChanges = {
                ...previosSection,
                changes: reverse(previosSection.changes).map((changes) => ({
                    path: changes.path,
                    value: get(state.present, changes.path),
                })),
            };

            previosSection.changes.forEach(
                changes => set(present, changes.path, changes.value)
            );

            return {
                present,
                past,
                future: [futureChanges, ...state.future],
            };
        }

        if (action.type === options.redoType && state.future.length) {
            const future = state.future.slice(1);
            const futureSection = state.future[0];
            const pastChanges = {
                ...futureSection,
                changes: reverse(futureSection.changes).map((changes) => ({
                    path: changes.path,
                    value: get(state.present, changes.path),
                })),
            };

            futureSection.changes.forEach(
                changes => set(present, changes.path, changes.value)
            );

            return {
                present,
                past: [...state.past, pastChanges],
                future,
            };
        }

        if (action.type === options.cleanHistoryType) {
            return {
                ...state,
                past: [],
                future: [],
            };
        }

        return {
            ...state,
            present,
        };
    };
};
import { AnyAction } from 'redux';

export class TestReducer<State> {
    private state: State;

    private reducer: (state: State, action: AnyAction) => State;

    constructor(reducerUnderTest: (state: State, action: AnyAction) => State, initialState: State) {
        this.reducer = reducerUnderTest;
        this.state = reducerUnderTest(initialState, { type: 'MOCK_ACTION' });
    }

    public put(action: AnyAction): TestReducer<State> {
        this.state = this.reducer(this.state, action);
        return this;
    }

    public expectState(selector: (state: State) => any, value: any): TestReducer<State> {
        expect(selector(this.state)).toEqual(value);
        return this;
    }
}

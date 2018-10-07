import {IUIState} from "./state";

export const setDrawerState = (state: IUIState, payload: boolean) => {
    state.navbar.open = payload;
};

import { mainReducer } from './redusers/main/main';
import { configureStore, combineReducers } from '@reduxjs/toolkit'

const rootReducer = combineReducers({
    main: mainReducer
})

export const store = configureStore({
    reducer: rootReducer,
    
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false,
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
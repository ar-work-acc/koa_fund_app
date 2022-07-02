import { configureStore } from "@reduxjs/toolkit"
import { sliceAPI } from "../features/api/sliceAPI"

export const store = configureStore({
    reducer: {
        [sliceAPI.reducerPath]: sliceAPI.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(sliceAPI.middleware),
})

import { sliceAPI } from "../api/sliceAPI"

export const sliceAdmin = sliceAPI.injectEndpoints({
    endpoints: (builder) => ({
        createSharePrice: builder.mutation({
            query: (params) => ({
                url: `/admin/createSharePrice`,
                method: "POST",
                body: params,
            }),
            // TODO exclude specific tags like 'list'
            invalidatesTags: [{ type: "Fund" }],
        }),
        processOrders: builder.mutation({
            query: () => ({
                url: `/admin/processOrders`,
                method: "POST",
            }),
            invalidatesTags: [
                { type: "Order", id: "list" },
                { type: "User", id: "login" },
            ],
        }),
    }),
})

export const { useCreateSharePriceMutation, useProcessOrdersMutation } =
    sliceAdmin

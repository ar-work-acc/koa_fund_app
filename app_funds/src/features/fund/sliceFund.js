import { sliceAPI } from "../api/sliceAPI"

export const sliceFund = sliceAPI.injectEndpoints({
    endpoints: (builder) => ({
        getFundList: builder.query({
            query: (params) => ({
                url: "/funds",
                params,
            }),
            providesTags: [{ type: "Fund", id: "list" }],
        }),
        getFund: builder.query({
            query: (id) => `/funds/${id}`,
            providesTags: (result, error, arg) => [{ type: "Fund", id: arg }],
        }),
        getOrderList: builder.query({
            query: (params) => ({
                url: "/orders",
                params,
            }),
            providesTags: [{ type: "Order", id: "list" }],
        }),
        createOrder: builder.mutation({
            query: (params) => ({
                url: `/orders`,
                method: "POST",
                body: params,
            }),
            invalidatesTags: (result, error, arg) => [
                { type: "Order", id: "list" },
            ],
        }),
        getExchangeRate: builder.query({
            query: (params) => ({
                url: "/exchangeRate",
                params,
            }),
            providesTags: (result, error, arg) => [
                { type: "ExchangeRate", id: arg.currency },
            ],
        }),
    }),
})

export const {
    useGetFundListQuery,
    useGetFundQuery,
    useGetOrderListQuery,
    useCreateOrderMutation,
    useGetExchangeRateQuery,
} = sliceFund
